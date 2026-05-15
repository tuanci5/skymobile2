import { Router } from 'express';
import { pool } from '../db';

const DEFAULT_TRANSLATION_TARGET_LANGUAGE = 'Vietnamese';
const TRANSLATION_CACHE_LANGUAGE = 'Vietnamese:auto-detect:v2';

const SUPPORTED_REPLY_LANGUAGES = [
  { code: 'zh-Mandarin', label: 'Tiếng Trung Quan thoại', aiLabel: 'Mandarin Chinese' },
  { code: 'zh-Cantonese', label: 'Tiếng Quảng Đông', aiLabel: 'Cantonese Chinese' },
  { code: 'tl', label: 'Tiếng Tagalog', aiLabel: 'Tagalog' },
  { code: 'en', label: 'Tiếng Anh', aiLabel: 'English' },
  { code: 'id', label: 'Tiếng Indonesia', aiLabel: 'Indonesian' },
  { code: 'ne', label: 'Tiếng Nepal', aiLabel: 'Nepali' },
  { code: 'pt', label: 'Tiếng Bồ Đào Nha', aiLabel: 'Portuguese' },
  { code: 'es', label: 'Tiếng Tây Ban Nha', aiLabel: 'Spanish' },
  { code: 'my', label: 'Tiếng Miến Điện / Myanmar', aiLabel: 'Burmese / Myanmar' },
  { code: 'ko', label: 'Tiếng Hàn', aiLabel: 'Korean' }
] as const;

const normalizeReplyLanguage = (language?: string) => {
  if (!language) return null;
  return SUPPORTED_REPLY_LANGUAGES.find(lang =>
    lang.code === language || lang.label === language || lang.aiLabel === language
  ) || null;
};

const buildTranslationSystemPrompt = (targetLanguage: string, sourceLanguage?: string) => [
  'You are a strict translation engine for customer support messages.',
  sourceLanguage ? `Translate from ${sourceLanguage}.` : 'Auto-detect the source language from the user text.',
  `Always translate to ${targetLanguage} only.`,
  targetLanguage === 'Vietnamese' ? 'If the text is already Vietnamese, return natural Vietnamese with the same meaning.' : 'Use natural, polite customer-support phrasing.',
  'Preserve names, product names, URLs, phone numbers, prices, emojis, line breaks, and markdown emphasis.',
  'Do not answer the message. Return only the translation with no explanation.'
].join(' ');

const buildTranslationQuery = (text: string, targetLanguage: string, sourceLanguage?: string) => [
  `Translate the following message${sourceLanguage ? ` from ${sourceLanguage}` : ''} to ${targetLanguage}.`,
  'Return only the translated text.',
  '',
  text
].join('\n');

const buildTranslationRequestBody = (endpoint: string, model: string, text: string, targetLanguage = DEFAULT_TRANSLATION_TARGET_LANGUAGE, sourceLanguage?: string) => {
  const systemPrompt = buildTranslationSystemPrompt(targetLanguage, sourceLanguage);
  const query = buildTranslationQuery(text, targetLanguage, sourceLanguage);

  if (/\/chat-messages(?:[/?#]|$)/i.test(endpoint)) {
    return {
      inputs: {},
      query: `${systemPrompt}\n\n${query}`,
      response_mode: 'blocking',
      conversation_id: '',
      user: 'sky-mobile-translation'
    };
  }

  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    temperature: 0.1
  };
};

const buildLanguageDetectionRequestBody = (endpoint: string, model: string, customerMessages: string[]) => {
  const languageOptions = SUPPORTED_REPLY_LANGUAGES.map(lang => `${lang.code}: ${lang.label} (${lang.aiLabel})`).join('\n');
  const prompt = [
    'Detect the customer language from recent customer messages.',
    'Choose exactly one language from the supported list.',
    'Return only valid JSON with languageCode, languageLabel, confidence, and reason.',
    'If uncertain, choose en with low confidence.',
    '',
    'Supported languages:',
    languageOptions,
    '',
    'Recent customer messages:',
    customerMessages.join('\n---\n')
  ].join('\n');

  if (/\/chat-messages(?:[/?#]|$)/i.test(endpoint)) {
    return {
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      conversation_id: '',
      user: 'sky-mobile-language-detection'
    };
  }

  return {
    model,
    messages: [
      { role: 'system', content: 'You classify customer message language. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0
  };
};

const parseAiTextResponse = (responseText: string) => {
  try {
    const data = JSON.parse(responseText);
    return data.choices?.[0]?.message?.content?.trim() || data.answer?.trim() || '';
  } catch (e) {
    let result = '';
    for (const line of responseText.split('\n')) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.substring(6));
          result += data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || data.answer || '';
        } catch (err) {}
      }
    }
    return result.trim();
  }
};

const getAiSettings = async () => {
  const { rows } = await pool.query('SELECT * FROM app_settings WHERE key IN ($1, $2, $3)', ['ai_api_key', 'ai_endpoint', 'ai_model']);
  const settings: Record<string, string> = {};
  rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return {
    apiKey: settings['ai_api_key'],
    endpoint: settings['ai_endpoint'] || 'https://api.openai.com/v1/chat/completions',
    model: settings['ai_model'] || 'gpt-3.5-turbo'
  };
};

const router = Router();

router.post('/translate', async (req, res) => {
  try {
    const { text, messageId, targetLanguage, sourceLanguage } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const targetLanguageOption = normalizeReplyLanguage(targetLanguage);
    const finalTargetLanguage = targetLanguageOption?.aiLabel || targetLanguage || DEFAULT_TRANSLATION_TARGET_LANGUAGE;
    const shouldUseMessageCache = !targetLanguage && !sourceLanguage;

    const parsedMessageId = messageId ? Number(messageId) : null;
    if (shouldUseMessageCache && parsedMessageId && Number.isFinite(parsedMessageId)) {
      const { rows: cachedRows } = await pool.query(
        `SELECT ai_translation, ai_translation_language, translated_at
         FROM fb_messages
         WHERE id = $1
           AND ai_translation IS NOT NULL
           AND btrim(ai_translation) <> ''
           AND COALESCE(ai_translation_language, $2) = $2`,
        [parsedMessageId, TRANSLATION_CACHE_LANGUAGE]
      );

      if (cachedRows.length > 0) {
        return res.json({
          translatedText: cachedRows[0].ai_translation,
          cached: true,
          targetLanguage: DEFAULT_TRANSLATION_TARGET_LANGUAGE,
          translatedAt: cachedRows[0].translated_at
        });
      }
    }

    const { apiKey, endpoint, model } = await getAiSettings();
    if (!apiKey) return res.status(400).json({ error: 'AI API Key is not configured' });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildTranslationRequestBody(endpoint, model, text, finalTargetLanguage, sourceLanguage))
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {}
      throw new Error(`AI API error: ${errorMessage}`);
    }

    const textRes = await response.text();
    const translatedText = parseAiTextResponse(textRes);
    if (!translatedText) {
      console.error('AI API Raw Response:', textRes);
      throw new Error('Could not get translation from AI or response format is not supported.');
    }

    if (shouldUseMessageCache && parsedMessageId && Number.isFinite(parsedMessageId)) {
      await pool.query(
        `UPDATE fb_messages
         SET ai_translation = $1,
             ai_translation_language = $2,
             translated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [translatedText, TRANSLATION_CACHE_LANGUAGE, parsedMessageId]
      );
    }

    res.json({
      translatedText,
      cached: false,
      targetLanguage: targetLanguageOption?.label || finalTargetLanguage,
      targetLanguageCode: targetLanguageOption?.code || null
    });
  } catch (error: any) {
    console.error('AI Translation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate' });
  }
});

router.post('/detect-conversation-language', async (req, res) => {
  try {
    const conversationId = Number(req.body.conversationId);
    if (!conversationId || !Number.isFinite(conversationId)) {
      return res.status(400).json({ error: 'conversationId is required' });
    }

    const { rows: convRows } = await pool.query('SELECT * FROM fb_conversations WHERE id = $1', [conversationId]);
    if (convRows.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const conversation = convRows[0];
    if (conversation.preferred_language_code && conversation.preferred_language_source === 'manual') {
      return res.json({
        languageCode: conversation.preferred_language_code,
        languageLabel: conversation.preferred_language_label,
        source: 'manual',
        confidence: Number(conversation.preferred_language_confidence || 1)
      });
    }

    if (conversation.preferred_language_code && conversation.preferred_language_source === 'detected') {
      return res.json({
        languageCode: conversation.preferred_language_code,
        languageLabel: conversation.preferred_language_label,
        source: 'detected',
        confidence: Number(conversation.preferred_language_confidence || 0)
      });
    }

    const { rows: messageRows } = await pool.query(
      `SELECT message_text FROM fb_messages
       WHERE conversation_id = $1
         AND sender_type = 'user'
         AND message_text IS NOT NULL
         AND btrim(message_text) <> ''
       ORDER BY created_at DESC
       LIMIT 10`,
      [conversationId]
    );

    if (messageRows.length === 0) {
      const fallback = SUPPORTED_REPLY_LANGUAGES.find(lang => lang.code === 'en')!;
      await pool.query(
        `UPDATE fb_conversations
         SET preferred_language_code = $1,
             preferred_language_label = $2,
             preferred_language_source = 'fallback',
             preferred_language_confidence = $3,
             preferred_language_updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [fallback.code, fallback.label, 0, conversationId]
      );
      return res.json({ languageCode: fallback.code, languageLabel: fallback.label, source: 'fallback', confidence: 0 });
    }

    const { apiKey, endpoint, model } = await getAiSettings();
    if (!apiKey) return res.status(400).json({ error: 'AI API Key is not configured' });

    const customerMessages = messageRows.map(row => row.message_text).reverse();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildLanguageDetectionRequestBody(endpoint, model, customerMessages))
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${errorText || response.statusText}`);
    }

    const rawAnswer = parseAiTextResponse(await response.text());
    let detected: any = {};
    try {
      const jsonMatch = rawAnswer.match(/\{[\s\S]*\}/);
      detected = JSON.parse(jsonMatch ? jsonMatch[0] : rawAnswer);
    } catch (e) {
      detected = {};
    }

    const languageOption = normalizeReplyLanguage(detected.languageCode) || normalizeReplyLanguage(detected.languageLabel) || SUPPORTED_REPLY_LANGUAGES.find(lang => lang.code === 'en')!;
    const confidence = Math.max(0, Math.min(1, Number(detected.confidence) || 0.5));

    await pool.query(
      `UPDATE fb_conversations
       SET preferred_language_code = $1,
           preferred_language_label = $2,
           preferred_language_source = 'detected',
           preferred_language_confidence = $3,
           preferred_language_updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
         AND COALESCE(preferred_language_source, '') <> 'manual'`,
      [languageOption.code, languageOption.label, confidence, conversationId]
    );

    res.json({
      languageCode: languageOption.code,
      languageLabel: languageOption.label,
      source: 'detected',
      confidence,
      reason: detected.reason || ''
    });
  } catch (error: any) {
    console.error('AI Language Detection Error:', error);
    res.status(500).json({ error: error.message || 'Failed to detect language' });
  }
});

export default router;
