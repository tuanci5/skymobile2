import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  ShieldCheck, 
  Cpu, 
  Key, 
  Globe, 
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquareText,
  Plus,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { settingService } from '../services/api';

type MessageTemplateMap = Record<string, string[]>;

type LanguageOption = {
  code: string;
  label: string;
};

const MESSAGE_TEMPLATE_LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh-Mandarin', label: 'Tiếng Trung Quan thoại' },
  { code: 'zh-Cantonese', label: 'Tiếng Quảng Đông' },
  { code: 'tl', label: 'Tiếng Tagalog' },
  { code: 'en', label: 'Tiếng Anh' },
  { code: 'id', label: 'Tiếng Indonesia' },
  { code: 'ne', label: 'Tiếng Nepal' },
  { code: 'pt', label: 'Tiếng Bồ Đào Nha' },
  { code: 'es', label: 'Tiếng Tây Ban Nha' },
  { code: 'my', label: 'Tiếng Miến Điện / Myanmar' },
  { code: 'ko', label: 'Tiếng Hàn' }
];

const DEFAULT_MESSAGE_TEMPLATES: MessageTemplateMap = {
  vi: [
    'Dạ em chào anh/chị, Sky Mobile có thể hỗ trợ mình thông tin gì ạ?',
    'Dạ anh/chị cho em xin số điện thoại để CSKH hỗ trợ nhanh hơn ạ.',
    'Dạ bên em sẽ kiểm tra và phản hồi lại mình trong ít phút ạ.',
    'Dạ anh/chị muốn tham khảo dòng máy hoặc gói cước nào ạ?',
    'Dạ cảm ơn anh/chị đã liên hệ Sky Mobile ạ.'
  ],
  en: [
    'Hello, thank you for contacting Sky Mobile. How can we support you today?',
    'Could you please send your phone number so our support team can assist you faster?',
    'We will check and get back to you in a few minutes.',
    'Which device model or service plan would you like to learn more about?',
    'Thank you for contacting Sky Mobile.'
  ]
};

const normalizeMessageTemplateMap = (templates: MessageTemplateMap) => {
  const normalized: MessageTemplateMap = {};

  MESSAGE_TEMPLATE_LANGUAGES.forEach(language => {
    const cleanedTemplates = (templates[language.code] || [])
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean);

    normalized[language.code] = cleanedTemplates;
  });

  if (normalized.vi.length === 0) {
    normalized.vi = DEFAULT_MESSAGE_TEMPLATES.vi;
  }

  return normalized;
};

const parseMessageTemplates = (value?: string): MessageTemplateMap => {
  if (!value) return normalizeMessageTemplateMap(DEFAULT_MESSAGE_TEMPLATES);

  try {
    const templates = JSON.parse(value);

    if (Array.isArray(templates)) {
      return normalizeMessageTemplateMap({ vi: templates });
    }

    if (templates && typeof templates === 'object') {
      return normalizeMessageTemplateMap(templates as MessageTemplateMap);
    }
  } catch (error) {
    console.error('Failed to parse message templates:', error);
  }

  return normalizeMessageTemplateMap(DEFAULT_MESSAGE_TEMPLATES);
};

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    ai_api_key: '',
    ai_endpoint: 'https://api.openai.com/v1/chat/completions',
    ai_model: 'gpt-3.5-turbo',
    app_name: 'Sky Mobile Dashboard',
    message_templates: JSON.stringify(DEFAULT_MESSAGE_TEMPLATES),
  });
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplateMap>(() => normalizeMessageTemplateMap(DEFAULT_MESSAGE_TEMPLATES));
  const [selectedTemplateLanguage, setSelectedTemplateLanguage] = useState('vi');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingService.getAll();
      const loadedSettings = { ...settings, ...data };
      setSettings(loadedSettings);
      setMessageTemplates(parseMessageTemplates(loadedSettings.message_templates));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const templatesToSave = normalizeMessageTemplateMap(messageTemplates);
      await settingService.save({
        ...settings,
        message_templates: JSON.stringify(templatesToSave),
      });
      setSettings(prev => ({ ...prev, message_templates: JSON.stringify(templatesToSave) }));
      setMessageTemplates(templatesToSave);
      setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Không thể lưu cài đặt.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedLanguageTemplates = messageTemplates[selectedTemplateLanguage] || [];
  const selectedLanguageLabel = MESSAGE_TEMPLATE_LANGUAGES.find(item => item.code === selectedTemplateLanguage)?.label || selectedTemplateLanguage;

  const addMessageTemplate = () => {
    const text = newTemplateText.trim();
    if (!text) return;
    setMessageTemplates(prev => ({
      ...prev,
      [selectedTemplateLanguage]: [...(prev[selectedTemplateLanguage] || []), text]
    }));
    setNewTemplateText('');
  };

  const updateMessageTemplate = (index: number, value: string) => {
    setMessageTemplates(prev => ({
      ...prev,
      [selectedTemplateLanguage]: (prev[selectedTemplateLanguage] || []).map((item, itemIndex) => (itemIndex === index ? value : item))
    }));
  };

  const removeMessageTemplate = (index: number) => {
    setMessageTemplates(prev => ({
      ...prev,
      [selectedTemplateLanguage]: (prev[selectedTemplateLanguage] || []).filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
        </div>
        <p className="text-slate-500">Cấu hình tham số AI, API và các thiết lập chung cho toàn bộ ứng dụng.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* AI Configuration Section */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800">Cấu hình AI (Dịch thuật & Trợ lý)</h2>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  API Key (OpenAI / OmniRoute)
                </label>
                <input 
                  type="password"
                  value={settings.ai_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="sk-..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  API Endpoint
                </label>
                <input 
                  type="text"
                  value={settings.ai_endpoint || ''}
                  onChange={(e) => setSettings({ ...settings, ai_endpoint: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  AI Model
                </label>
                <input 
                  type="text"
                  value={settings.ai_model || ''}
                  onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Lưu ý về bảo mật:</p>
                Khóa API sẽ được lưu trữ an toàn trong cơ sở dữ liệu và chỉ được sử dụng qua backend proxy. 
                Đảm bảo endpoint cung cấp đúng định dạng Chat Completions của OpenAI.
              </div>
            </div>
          </div>
        </section>

        {/* Messenger Template Section */}
        <section className="bg-white rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="font-bold text-slate-800">Tin nhắn mẫu Messenger</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Cài đặt câu trả lời nhanh tương ứng với từng ngôn ngữ hội thoại.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/80 border border-blue-100 text-xs font-black text-blue-700">
                {selectedLanguageTemplates.length} mẫu · {selectedLanguageLabel}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {MESSAGE_TEMPLATE_LANGUAGES.map(language => {
                const isActive = selectedTemplateLanguage === language.code;
                const templateCount = messageTemplates[language.code]?.length || 0;

                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateLanguage(language.code);
                      setNewTemplateText('');
                    }}
                    className={`shrink-0 rounded-2xl border px-4 py-2 text-left transition-all ${
                      isActive
                        ? 'border-blue-300 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <span className="block text-xs font-black">{language.label}</span>
                    <span className={`mt-0.5 block text-[11px] font-bold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {templateCount} mẫu
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs font-semibold text-blue-800">
              Đang chỉnh tin nhắn mẫu cho <span className="font-black">{selectedLanguageLabel}</span>. Messenger sẽ tự hiển thị nhóm này khi hội thoại có ngôn ngữ tương ứng.
            </div>

            <div className="space-y-3">
              {selectedLanguageTemplates.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                  Chưa có tin nhắn mẫu cho {selectedLanguageLabel}. Hãy thêm mẫu đầu tiên bên dưới.
                </div>
              )}

              {selectedLanguageTemplates.map((template, index) => (
                <div key={`${selectedTemplateLanguage}-${index}`} className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-sm transition-all">
                  <div className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                    {index + 1}
                  </div>
                  <textarea
                    value={template}
                    onChange={(e) => updateMessageTemplate(index, e.target.value)}
                    className="min-h-[44px] flex-1 resize-y bg-transparent text-sm font-semibold leading-relaxed text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder={`Nhập nội dung tin nhắn mẫu bằng ${selectedLanguageLabel}...`}
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => removeMessageTemplate(index)}
                    className="mt-1 rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Xóa tin nhắn mẫu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 md:flex-row md:items-start">
              <textarea
                value={newTemplateText}
                onChange={(e) => setNewTemplateText(e.target.value)}
                className="min-h-[58px] flex-1 resize-y rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Nhập tin nhắn mẫu mới bằng ${selectedLanguageLabel}...`}
                rows={2}
              />
              <button
                type="button"
                onClick={addMessageTemplate}
                disabled={!newTemplateText.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                <Plus className="w-4 h-4" />
                Thêm mẫu
              </button>
            </div>
          </div>
        </section>

        {/* General App Section */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Cài đặt chung</h2>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tên ứng dụng</label>
              <input 
                type="text"
                value={settings.app_name || ''}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </div>
          
          <button 
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cài đặt
          </button>
        </div>
      </form>
    </div>
  );
};
