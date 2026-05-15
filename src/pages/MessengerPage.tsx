import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Settings, Search, Send, User, Bot, Clock, Filter,
  ChevronRight, MoreVertical, Plus, CreditCard, Target, ExternalLink, Power, Hand,
  ShoppingCart, Package, MapPin, Phone, StickyNote, RefreshCw, Trash2, Activity,
  Languages, Loader2, Facebook, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS } from '../data/productData';
import { AvatarImage } from '../components/AvatarImage';
import { API_BASE_URL } from '../components/messenger/api';
import { AvatarFallback } from '../components/messenger/avatar';
import { OPTIMISTIC_MESSAGE_ID_BASE, isOptimisticMessage, isSameOutgoingMessage } from '../components/messenger/messageUtils';
import type { Conversation, ConversationAdSource, ConversationNote, DetailedProduct, FBPage, Message } from '../components/messenger/types';
import { useFacebookSdk } from '../components/messenger/useFacebookSdk';
import { formatNoteTime, getConversationAvatar } from '../components/messenger/utils';
import { aiService, settingService } from '../services/api';

type MessageTemplateMap = Record<string, string[]>;

type CustomerStatusOption = {
  label: string;
  color: string;
};

const DEFAULT_CUSTOMER_STATUSES: CustomerStatusOption[] = [
  { label: 'Khách nét', color: 'emerald' },
  { label: 'Đang chăm', color: 'blue' },
  { label: 'Chờ phản hồi', color: 'amber' },
  { label: 'Đã chốt', color: 'violet' },
  { label: 'Không tiềm năng', color: 'slate' }
];

const CUSTOMER_STATUS_STYLES: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200'
};

const normalizeCustomerStatuses = (statuses: CustomerStatusOption[]) => {
  const normalized = statuses
    .filter(item => item && typeof item.label === 'string')
    .map(item => ({ label: item.label.trim(), color: item.color || 'blue' }))
    .filter(item => item.label);

  return normalized.length > 0 ? normalized : DEFAULT_CUSTOMER_STATUSES;
};

const parseCustomerStatuses = (value?: string): CustomerStatusOption[] => {
  if (!value) return DEFAULT_CUSTOMER_STATUSES;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (parsed.every(item => typeof item === 'string')) {
        return normalizeCustomerStatuses(parsed.map(label => ({ label, color: 'blue' })));
      }
      return normalizeCustomerStatuses(parsed as CustomerStatusOption[]);
    }
  } catch (error) {
    console.error('Failed to parse customer statuses:', error);
  }

  return DEFAULT_CUSTOMER_STATUSES;
};

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
  const normalized: MessageTemplateMap = { ...DEFAULT_MESSAGE_TEMPLATES };

  Object.entries(templates).forEach(([languageCode, languageTemplates]) => {
    if (!Array.isArray(languageTemplates)) return;

    normalized[languageCode] = languageTemplates
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean);
  });

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

const TRANSLATION_CACHE_LANGUAGE = 'Vietnamese:auto-detect:v2';

type ImageLibraryItem = {
  id: number;
  page_id?: string | null;
  title: string;
  description?: string | null;
  image_url: string;
  category?: string | null;
  tags?: string[] | null;
};

// ─── Avatar Helper ─────────────────────────────────────────────────────────
export const MessengerPage = ({ user }: { user?: any }) => {
  const [pages, setPages] = useState<FBPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [replyText, setReplyText] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [imageLibrary, setImageLibrary] = useState<ImageLibraryItem[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [imageLibrarySearch, setImageLibrarySearch] = useState('');
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [newLibraryImage, setNewLibraryImage] = useState({ title: '', image_url: '', category: '', description: '' });
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [tokenTestResults, setTokenTestResults] = useState<Record<string, any>>({});
  const [adSources, setAdSources] = useState<ConversationAdSource[]>([]);
  const [isLoadingAdSources, setIsLoadingAdSources] = useState(false);
  const [showAdHistory, setShowAdHistory] = useState(true);
  const [warehouseProducts, setWarehouseProducts] = useState<DetailedProduct[]>([]);
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'bot'>('all');
  const [conversationSearch, setConversationSearch] = useState('');
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplateMap>(() => normalizeMessageTemplateMap(DEFAULT_MESSAGE_TEMPLATES));
  const [customerStatuses, setCustomerStatuses] = useState<CustomerStatusOption[]>(DEFAULT_CUSTOMER_STATUSES);
  const replyLanguageOptions = [
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
  const [translationMode, setTranslationMode] = useState(false);
  const [replyTargetLanguage, setReplyTargetLanguage] = useState(replyLanguageOptions[3]);
  const [translatedReplyText, setTranslatedReplyText] = useState('');
  const [translatedFromText, setTranslatedFromText] = useState('');
  const [isTranslatingReply, setIsTranslatingReply] = useState(false);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [replyLanguageSource, setReplyLanguageSource] = useState<'manual' | 'detected' | 'fallback' | null>(null);
  const activeTemplateLanguageCode = selectedConv?.preferred_language_code || replyTargetLanguage.code || 'vi';
  const activeTemplateLanguageLabel = selectedConv?.preferred_language_label || replyTargetLanguage.label || 'Tiếng Việt';
  const activeMessageTemplates = messageTemplates[activeTemplateLanguageCode]?.length
    ? messageTemplates[activeTemplateLanguageCode]
    : messageTemplates.vi?.length
      ? messageTemplates.vi
      : messageTemplates.en || [];

  const [orderForm, setOrderForm] = useState({
    phone: '',
    address: '',
    product: '',
    price: '',
    note: ''
  });

  const [newPageForm, setNewPageForm] = useState({
    pageName: '',
    pageId: '',
    pageAccessToken: '',
    difyApiKey: '',
    facebookAdAccountId: '',
    businessId: ''
  });

  const [editingPage, setEditingPage] = useState<{ id: string, token: string, difyKey: string, facebookAdAccountId?: string, businessId?: string, aiReplyDelay?: number, aiStartHour?: number, aiEndHour?: number } | null>(null);

  const isManager = user?.role === 'Quản trị';
  const [staffList, setStaffList] = useState<{ name: string, email: string, role: string }[]>([]);
  const [isEditingProfileUrl, setIsEditingProfileUrl] = useState(false);
  const [profileUrlInput, setProfileUrlInput] = useState('');
  const [isSavingProfileUrl, setIsSavingProfileUrl] = useState(false);

  const currentUserName = user?.name || user?.email || 'Người dùng hiện tại';
  const currentUserEmail = user?.email || null;
  const getConversationPageName = (conv?: Conversation | null) => {
    if (!conv) return '';
    return conv.page_name || pages.find(page => page.page_id === conv.page_id)?.page_name || '';
  };

  const getCustomerStatusOption = (status?: string | null) => (
    customerStatuses.find(item => item.label === status) || null
  );

  const getCustomerStatusClass = (status?: string | null) => {
    const option = getCustomerStatusOption(status);
    return CUSTOMER_STATUS_STYLES[option?.color || 'blue'] || CUSTOMER_STATUS_STYLES.blue;
  };

  const formatConversationListTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const hoursSinceMessage = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (hoursSinceMessage >= 24) {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }

    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  useFacebookSdk();

  const markConversationRead = async (convId: number) => {
    setConversations(prev => prev.map(conv => (
      conv.id === convId ? { ...conv, unread_count: 0 } : conv
    )));
    setSelectedConv(prev => prev?.id === convId ? { ...prev, unread_count: 0 } : prev);

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${convId}/read`, { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Mark read failed: ${res.status}`);
      }
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setStaffList(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhân viên:', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMessengerSettings = async () => {
      try {
        const data = await settingService.getAll();
        setMessageTemplates(parseMessageTemplates(data.message_templates));
        setCustomerStatuses(parseCustomerStatuses(data.customer_statuses));
      } catch (err) {
        console.error('Lỗi khi tải cài đặt Messenger:', err);
        setMessageTemplates(DEFAULT_MESSAGE_TEMPLATES);
        setCustomerStatuses(DEFAULT_CUSTOMER_STATUSES);
      }
    };

    fetchMessengerSettings();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagesRes, convsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/fb/pages`),
          fetch(`${API_BASE_URL}/api/fb/conversations`)
        ]);

        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          setPages(pagesData);
          if (pagesData.length > 0) setSelectedPage(pagesData[0].page_id);
        }

        if (convsRes.ok) {
          const convsData = await convsRes.json();
          setConversations(convsData);
        }
      } catch (err) {
        console.error('Error fetching messenger data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConv) return;

    const pollMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/messages?limit=10`);
        if (res.ok) {
          const data = await res.json();
          setMessages(prev => {
            if (data.length === 0) return prev;
            if (prev.length === 0) return data;
            
            const lastPrev = prev[prev.length - 1];
            const lastNew = data[data.length - 1];
            
            if (lastNew.id !== lastPrev.id) {
              const newItems = data.filter(newMsg => !prev.some(existingMsg => {
                if (existingMsg.id === newMsg.id) return true;
                return isOptimisticMessage(existingMsg.id) && isSameOutgoingMessage(existingMsg, newMsg);
              }));

              if (newItems.some((msg: Message) => msg.sender_type === 'user')) {
                void markConversationRead(selectedConv.id);
              }

              if (prev.length <= 10) {
                hydrateTranslations(data);
                setIsInitialLoad(true);
                return data;
              }

              if (newItems.length > 0) {
                hydrateTranslations(newItems);
                const container = chatContainerRef.current;
                if (container) {
                  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                  if (isNearBottom) setIsInitialLoad(true);
                }
                return [...prev, ...newItems];
              }
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          setWarehouseProducts(data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const hydrateTranslations = (messageRows: Message[]) => {
    const cachedTranslations = messageRows.reduce<Record<number, string>>((acc, msg) => {
      if (msg.ai_translation && msg.ai_translation_language === TRANSLATION_CACHE_LANGUAGE) {
        acc[msg.id] = msg.ai_translation;
      }
      return acc;
    }, {});

    if (Object.keys(cachedTranslations).length > 0) {
      setTranslations(prev => ({ ...prev, ...cachedTranslations }));
    }
  };

  const loadMessages = async (convId: number) => {
    try {
      setIsLoadingMore(false);
      setHasMoreMessages(true);
      setIsInitialLoad(true);
      setTranslations({});
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${convId}/messages?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        hydrateTranslations(data);
        if (data.length < 10) setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !selectedConv || messages.length === 0) return;

    setIsLoadingMore(true);
    setIsInitialLoad(false);
    const earliestAt = messages[0].created_at;
    const scrollHeightBefore = chatContainerRef.current?.scrollHeight || 0;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/messages?limit=10&before=${encodeURIComponent(earliestAt)}`);
      if (res.ok) {
        const newData = await res.json();
        if (newData.length < 10) setHasMoreMessages(false);

        if (newData.length > 0) {
          hydrateTranslations(newData);
          setMessages(prev => [...newData, ...prev]);

          setTimeout(() => {
            if (chatContainerRef.current) {
              const scrollHeightAfter = chatContainerRef.current.scrollHeight;
              chatContainerRef.current.scrollTop = scrollHeightAfter - scrollHeightBefore;
            }
          }, 0);
        }
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTranslate = async (messageId: number, text: string) => {
    if (translations[messageId]) return;

    setTranslatingId(messageId);
    try {
      const res = await aiService.translate(text, messageId);
      setTranslations(prev => ({ ...prev, [messageId]: res.translatedText }));
      setMessages(prev => prev.map(msg => msg.id === messageId ? {
        ...msg,
        ai_translation: res.translatedText,
        ai_translation_language: TRANSLATION_CACHE_LANGUAGE,
        translated_at: res.translatedAt || new Date().toISOString()
      } : msg));
    } catch (error: any) {
      alert(error.message || 'Lỗi khi dịch tin nhắn.');
    } finally {
      setTranslatingId(null);
    }
  };

  const loadNotes = async (convId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${convId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const loadAdSources = async (convId: number) => {
    setIsLoadingAdSources(true);
    setAdSources([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${convId}/ad-sources`);
      if (res.ok) {
        const data = await res.json();
        setAdSources(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading ad sources:', err);
    } finally {
      setIsLoadingAdSources(false);
    }
  };

  const applyConversationLanguage = (conv: Conversation) => {
    const savedLanguage = replyLanguageOptions.find(opt => opt.code === conv.preferred_language_code);
    if (savedLanguage) {
      setReplyTargetLanguage(savedLanguage);
      setReplyLanguageSource(conv.preferred_language_source || null);
      return true;
    }
    return false;
  };

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv({ ...conv, unread_count: 0 });
    setNewNote('');
    setReplyText('');
    setTranslatedReplyText('');
    setTranslatedFromText('');
    setIsEditingProfileUrl(false);
    setProfileUrlInput(conv.manual_profile_url || '');
    void markConversationRead(conv.id);
    loadMessages(conv.id);
    loadNotes(conv.id);
    loadAdSources(conv.id);

    if (!applyConversationLanguage(conv)) {
      setIsDetectingLanguage(true);
      try {
        const detected = await aiService.detectConversationLanguage(conv.id);
        const detectedLanguage = replyLanguageOptions.find(opt => opt.code === detected.languageCode) || replyLanguageOptions[3];
        setReplyTargetLanguage(detectedLanguage);
        setReplyLanguageSource(detected.source || 'detected');
        const updatedLanguage = {
          preferred_language_code: detectedLanguage.code,
          preferred_language_label: detectedLanguage.label,
          preferred_language_source: detected.source || 'detected',
          preferred_language_confidence: detected.confidence ?? null
        };
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, ...updatedLanguage } : c));
        setSelectedConv(prev => prev?.id === conv.id ? { ...prev, ...updatedLanguage } : prev);
      } catch (err) {
        console.error('Failed to detect customer language:', err);
        setReplyTargetLanguage(replyLanguageOptions[3]);
        setReplyLanguageSource('fallback');
      } finally {
        setIsDetectingLanguage(false);
      }
    }

    // Refresh profile if name is generic or avatar is missing
    if (conv.customer_name === 'Khách hàng FB' || !getConversationAvatar(conv)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${conv.id}/refresh-profile`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setConversations(prev => prev.map(c => c.id === conv.id ? {
            ...c,
            customer_name: data.customer_name,
            avatarUrl: data.avatarUrl,
            customer_avatar: data.customer_avatar,
            profile_link: data.profile_link
          } : c));
          setSelectedConv(prev => prev?.id === conv.id ? {
            ...prev,
            customer_name: data.customer_name,
            avatarUrl: data.avatarUrl,
            customer_avatar: data.customer_avatar,
            profile_link: data.profile_link
          } : prev);
        }
      } catch (err) {
        console.error('Failed to refresh profile:', err);
      }
    }
  };

  const handleReplyLanguageChange = async (languageCode: string) => {
    const language = replyLanguageOptions.find(opt => opt.code === languageCode) || replyLanguageOptions[3];
    setReplyTargetLanguage(language);
    setReplyLanguageSource('manual');
    setTranslatedReplyText('');
    setTranslatedFromText('');

    if (!selectedConv) return;

    setSelectedConv(prev => prev ? {
      ...prev,
      preferred_language_code: language.code,
      preferred_language_label: language.label,
      preferred_language_source: 'manual',
      preferred_language_confidence: 1
    } : null);
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? {
      ...c,
      preferred_language_code: language.code,
      preferred_language_label: language.label,
      preferred_language_source: 'manual',
      preferred_language_confidence: 1
    } : c));

    try {
      await aiService.saveConversationLanguage(selectedConv.id, language.code, language.label, 'manual');
    } catch (error: any) {
      alert(error.message || 'Không thể lưu ngôn ngữ đã chọn.');
    }
  };

  const handleTranslateReply = async () => {
    if (!replyText.trim()) return;
    setIsTranslatingReply(true);
    try {
      const res = await aiService.translate(replyText.trim(), undefined, replyTargetLanguage.code, 'Vietnamese');
      setTranslatedReplyText(res.translatedText);
      setTranslatedFromText(replyText.trim());
    } catch (error: any) {
      alert(error.message || 'Lỗi khi dịch bản nháp trả lời.');
    } finally {
      setIsTranslatingReply(false);
    }
  };

  const handleSendTranslatedReply = async () => {
    if (!translatedReplyText.trim()) return;
    const originalReplyText = replyText;
    const originalTranslatedText = translatedReplyText;
    setReplyText(translatedReplyText);
    await handleSendMessage(translatedReplyText);
    setReplyText('');
    setTranslatedReplyText('');
    setTranslatedFromText('');
    if (!selectedConv) {
      setReplyText(originalReplyText);
      setTranslatedReplyText(originalTranslatedText);
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? replyText).trim();
    if (!textToSend || !selectedConv) return;

    setReplyText('');

    // Optimistic UI update
    const optimisticId = OPTIMISTIC_MESSAGE_ID_BASE + Date.now();
    const newMessage: Message = {
      id: optimisticId,
      sender_type: 'human',
      message_text: textToSend,
      created_at: new Date().toISOString()
    };
    setIsInitialLoad(true);
    setMessages(prev => [...prev, newMessage]);

    // Update conversation state to human intervened
    setSelectedConv(prev => prev ? { ...prev, is_human_intervened: true, last_message: textToSend, last_message_at: new Date().toISOString() } : null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          text: textToSend
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const facebookDetails = errorData?.details
          ? `\n\nChi tiết Facebook:\n${JSON.stringify(errorData.details, null, 2)}`
          : '';
        throw new Error(`${errorData?.error || `Không thể gửi tin nhắn. Mã lỗi HTTP: ${res.status}`}${facebookDetails}`);
      }

      const data = await res.json();
      if (data.message) {
        setMessages(prev => prev.map(msg => msg.id === optimisticId ? data.message : msg));
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      setReplyText(textToSend);
      alert(`Không thể gửi tin nhắn:\n\n${err?.message || 'Lỗi không xác định'}`);
    }
  };

  const loadImageLibrary = async (search = imageLibrarySearch) => {
    if (!selectedConv) return;
    setIsLoadingImages(true);
    try {
      const params = new URLSearchParams({ page_id: selectedConv.page_id });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${API_BASE_URL}/api/fb/image-library?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải thư viện ảnh.');
      setImageLibrary(await res.json());
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải thư viện ảnh.');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const openImageLibrary = () => {
    setSelectedImageIds([]);
    setIsImageLibraryOpen(true);
    loadImageLibrary('');
  };

  const handleAddLibraryImage = async () => {
    if (!selectedConv || !newLibraryImage.title.trim() || !newLibraryImage.image_url.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/image-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: selectedConv.page_id,
          title: newLibraryImage.title.trim(),
          image_url: newLibraryImage.image_url.trim(),
          category: newLibraryImage.category.trim() || null,
          description: newLibraryImage.description.trim() || null,
          created_by: currentUserEmail || currentUserName
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Không thể thêm ảnh vào thư viện.');
      setNewLibraryImage({ title: '', image_url: '', category: '', description: '' });
      await loadImageLibrary();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm ảnh.');
    }
  };

  const handleDeleteLibraryImage = async (image: ImageLibraryItem) => {
    if (deletingImageId || isSendingImage) return;
    if (!confirm(`Bạn có chắc chắn muốn xoá ảnh "${image.title}" khỏi thư viện?`)) return;

    setDeletingImageId(image.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/image-library/${image.id}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Không thể xoá ảnh khỏi thư viện.');

      setImageLibrary(prev => prev.filter(item => item.id !== image.id));
      setSelectedImageIds(prev => prev.filter(id => id !== image.id));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xoá ảnh.');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSendImage = async (imageUrl: string, libraryImageId?: number, options?: { keepLibraryOpen?: boolean }) => {
    if (!selectedConv || isSendingImage) return;
    const finalUrl = imageUrl.trim();
    if (!finalUrl && !libraryImageId) return;

    setIsSendingImage(true);
    const optimisticId = OPTIMISTIC_MESSAGE_ID_BASE + Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_type: 'human',
      message_text: '[Ảnh]',
      attachment_type: 'image',
      attachment_proxy_url: finalUrl ? `/api/fb/message-attachment-proxy/${optimisticId}` : null,
      attachment_url: finalUrl || null,
      created_at: new Date().toISOString()
    };
    setIsInitialLoad(true);
    setMessages(prev => [...prev, optimisticMessage]);
    setSelectedConv(prev => prev ? { ...prev, is_human_intervened: true, last_message: '[Ảnh]', last_message_at: new Date().toISOString() } : null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/messages/send-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          image_url: finalUrl || undefined,
          library_image_id: libraryImageId
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Không thể gửi ảnh. Mã lỗi HTTP: ${res.status}`);
      if (data.message) setMessages(prev => prev.map(msg => msg.id === optimisticId ? data.message : msg));
      setQuickImageUrl('');
      if (!options?.keepLibraryOpen) setIsImageLibraryOpen(false);
    } catch (err: any) {
      console.error('Error sending image:', err);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      alert(`Không thể gửi ảnh:\n\n${err?.message || 'Lỗi không xác định'}`);
      throw err;
    } finally {
      setIsSendingImage(false);
    }
  };

  const toggleSelectedImage = (imageId: number) => {
    setSelectedImageIds(prev => prev.includes(imageId)
      ? prev.filter(id => id !== imageId)
      : [...prev, imageId]
    );
  };

  const handleSendSelectedImages = async () => {
    if (!selectedImageIds.length || isSendingImage) return;
    const idsToSend = [...selectedImageIds];
    try {
      for (const imageId of idsToSend) {
        await handleSendImage('', imageId, { keepLibraryOpen: true });
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      setSelectedImageIds([]);
      setIsImageLibraryOpen(false);
    } catch {
      // handleSendImage already shows the detailed error.
    }
  };

  const handleToggleBot = async () => {
    if (!selectedConv) return;
    const newState = !selectedConv.is_human_intervened;

    // Optimistic UI update
    setSelectedConv(prev => prev ? { ...prev, is_human_intervened: newState } : null);
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, is_human_intervened: newState } : c));

    const url = `${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/toggle-bot`;
    console.log(`[BOT_TOGGLE] Fetching: ${url} with state: ${newState}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_human_intervened: newState })
      });

      console.log(`[BOT_TOGGLE] Response status: ${res.status}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[BOT_TOGGLE] Error response: ${errorText}`);
        throw new Error(`Failed to update bot state: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update bot state');
      }
    } catch (err) {
      console.error('Error toggling bot:', err);
      alert('Không thể cập nhật trạng thái AI. Vui lòng thử lại.');
      // Revert UI on error
      setSelectedConv(prev => prev ? { ...prev, is_human_intervened: !newState } : null);
      setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, is_human_intervened: !newState } : c));
    }
  };

  const handleSendNote = async () => {
    if (!selectedConv || !newNote.trim()) return;

    const noteText = newNote.trim();
    const optimisticNote: ConversationNote = {
      id: Date.now(),
      conversation_id: selectedConv.id,
      note_text: noteText,
      author_name: currentUserName,
      author_email: currentUserEmail || undefined,
      created_at: new Date().toISOString()
    };

    setNewNote('');
    setNotes(prev => [...prev, optimisticNote]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: noteText,
          author_name: currentUserName,
          author_email: currentUserEmail
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNotes(prev => prev.map(note => note.id === optimisticNote.id ? data.note : note));
        }
      } else {
        throw new Error(`Failed to save note: ${res.status}`);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setNotes(prev => prev.filter(note => note.id !== optimisticNote.id));
      setNewNote(noteText);
      alert('Không thể lưu ghi chú. Vui lòng thử lại.');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: selectedConv.customer_name,
          customer_id: selectedConv.customer_id,
          page_id: selectedConv.page_id,
          phone: orderForm.phone,
          address: orderForm.address,
          product_name: orderForm.product,
          amount: parseFloat(orderForm.price.replace(/[^0-9.]/g, '')) || 0,
          note: orderForm.note,
          assigned_to: user?.email || 'N/A'
        })
      });

      if (res.ok) {
        alert('Đã tạo đơn hàng thành công!');
        setIsOrderModalOpen(false);
        setOrderForm({ phone: '', address: '', product: '', price: '', note: '' });
      } else {
        const data = await res.json();
        alert('Lỗi khi tạo đơn hàng: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleSaveManualProfile = async () => {
    if (!selectedConv || !profileUrlInput.trim()) return;
    setIsSavingProfileUrl(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/manual-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_url: profileUrlInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        const newAvatarUrl = data.avatar_url || null;
        const updatedConv: any = {
          ...selectedConv,
          manual_profile_url: data.manual_profile_url,
          facebook_uid: data.facebook_uid || null,
          ...(newAvatarUrl ? { customer_avatar: newAvatarUrl, avatarUrl: newAvatarUrl } : {})
        };
        setSelectedConv(updatedConv);
        setConversations(prev => prev.map(c => c.id === selectedConv.id ? updatedConv : c));
        setIsEditingProfileUrl(false);
        if (data.uid_source === 'business_suite_selected_item_id') {
          alert(data.business_id_updated
            ? 'Đã parse UID từ link Business Suite và cập nhật Business ID cho Fanpage.'
            : 'Đã parse UID từ link Business Suite.');
        } else if (data.uid_extracted && newAvatarUrl) {
          // Avatar đã được cập nhật tự động
        } else if (data.uid_extracted && !newAvatarUrl) {
          alert('Đã lưu profile URL. Không tải được avatar (ảnh riêng tư hoặc hạn chế).');
        } else {
          alert('Đã lưu profile URL. Không thể trích xuất UID tự động từ URL này.');
        }
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể lưu'));
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setIsSavingProfileUrl(false);
    }
  };


  const handleAssign = async (staff: string) => {
    if (!selectedConv) return;
    setSelectedConv(prev => prev ? { ...prev, assigned_to: staff } : null);
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, assigned_to: staff } : c));

    try {
      await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: staff })
      });
    } catch (err) {
      console.error('Error assigning conversation:', err);
    }
  };

  const handleCustomerStatusChange = async (status: string) => {
    if (!selectedConv) return;

    const previousStatus = selectedConv.customer_status || null;
    const nextStatus = status || null;
    setSelectedConv(prev => prev ? { ...prev, customer_status: nextStatus } : null);
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, customer_status: nextStatus } : c));

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/customer-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_status: nextStatus })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Không thể cập nhật trạng thái khách.');
    } catch (err: any) {
      console.error('Error updating customer status:', err);
      setSelectedConv(prev => prev ? { ...prev, customer_status: previousStatus } : null);
      setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, customer_status: previousStatus } : c));
      alert(err.message || 'Không thể cập nhật trạng thái khách. Vui lòng thử lại.');
    }
  };

  const handleChangeDistribution = (pageId: string, mode: 'manual' | 'round_robin' | 'ai_first') => {
    setPages(prev => prev.map(p => p.page_id === pageId ? { ...p, distribution_mode: mode } : p));
  };

  const handleAssignPageUser = async (pageId: string, userEmail: string, isChecked: boolean) => {
    const page = pages.find(p => p.page_id === pageId);
    if (!page) return;

    let newUsers = [...(page.assigned_users || [])];
    if (isChecked) {
      if (!newUsers.includes(userEmail)) newUsers.push(userEmail);
    } else {
      newUsers = newUsers.filter(u => u !== userEmail);
    }

    setPages(prev => prev.map(p => p.page_id === pageId ? { ...p, assigned_users: newUsers } : p));

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/pages/${pageId}/assign-users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_users: newUsers })
      });
      if (!res.ok) throw new Error('Failed to update page assignments');
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật nhân sự quản lý Page');
      setPages(prev => prev.map(p => p.page_id === pageId ? { ...p, assigned_users: page.assigned_users } : p));
    }
  };

  const handleAddPage = async () => {
    if (!newPageForm.pageName || !newPageForm.pageId || !newPageForm.pageAccessToken) {
      alert("Vui lòng điền đầy đủ Tên hiển thị, Page ID và Access Token");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: newPageForm.pageId,
          page_name: newPageForm.pageName,
          access_token: newPageForm.pageAccessToken,
          dify_api_key: newPageForm.difyApiKey || null,
          facebook_ad_account_id: newPageForm.facebookAdAccountId || null,
          business_id: newPageForm.businessId || null
        })
      });

      if (res.ok) {
        const pagesRes = await fetch(`${API_BASE_URL}/api/fb/pages`);
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          setPages(pagesData);
        }

        setNewPageForm({
          pageName: '',
          pageId: '',
          pageAccessToken: '',
          difyApiKey: '',
          facebookAdAccountId: '',
          businessId: ''
        });

        alert(`Đã thêm Fanpage "${newPageForm.pageName}" thành công!`);
      } else {
        const errorData = await res.json();
        alert(`Lỗi: ${errorData.error || "Không thể lưu Fanpage"}`);
      }
    } catch (err) {
      console.error("Error adding page:", err);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const handleUpdatePageSettings = async (pageId: string) => {
    if (!editingPage || editingPage.id !== pageId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: editingPage.token,
          dify_api_key: editingPage.difyKey,
          facebook_ad_account_id: editingPage.facebookAdAccountId,
          business_id: editingPage.businessId,
          ai_reply_delay: editingPage.aiReplyDelay,
          ai_start_hour: editingPage.aiStartHour,
          ai_end_hour: editingPage.aiEndHour
        })
      });

      if (res.ok) {
        setPages(prev => prev.map(p => p.page_id === pageId ? {
          ...p,
          dify_api_key: editingPage.difyKey,
          facebook_ad_account_id: editingPage.facebookAdAccountId,
          business_id: editingPage.businessId,
          ai_reply_delay: editingPage.aiReplyDelay,
          ai_start_hour: editingPage.aiStartHour,
          ai_end_hour: editingPage.aiEndHour
        } : p));
        alert("Đã cập nhật cài đặt Fanpage thành công!");
      } else {
        alert("Lỗi khi cập nhật cài đặt.");
      }
    } catch (err) {
      console.error("Error updating page:", err);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const handleTestPageToken = async (page: FBPage) => {
    const draft = editingPage?.id === page.page_id ? editingPage : null;
    setIsTestingConn(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/pages/${page.page_id}/test-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: draft?.token || undefined,
          facebook_ad_account_id: draft?.facebookAdAccountId ?? page.facebook_ad_account_id ?? undefined
        })
      });
      const data = await res.json();
      setTokenTestResults(prev => ({ ...prev, [page.page_id]: data }));
      if (!res.ok) throw new Error(data.error || 'Không thể kiểm tra token');
    } catch (err: any) {
      setTokenTestResults(prev => ({
        ...prev,
        [page.page_id]: { token_alive: false, page_access_ok: false, ads_read_ok: false, errors: [{ message: err.message }] }
      }));
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleDeletePage = async (pageId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Fanpage "${name}" khỏi hệ thống?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/pages/delete/${pageId}`, {
        method: 'POST'
      });

      if (res.ok) {
        setPages(prev => prev.filter(p => p.page_id !== pageId));
        setExpandedPageId(null);
        alert(`Đã xóa Fanpage "${name}" thành công.`);
      } else {
        alert("Lỗi khi xóa Fanpage. Vui lòng kiểm tra lại kết nối server.");
      }
    } catch (err) {
      console.error("Error deleting page:", err);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current && isInitialLoad) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isInitialLoad]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && !isLoadingMore && hasMoreMessages) {
      loadMoreMessages();
    }
  };

  const displayedConversations = conversations.filter(conv => {
    if (!isManager) {
      const page = pages.find(p => p.page_id === conv.page_id);
      const isPageUnassigned = !page?.assigned_users || page.assigned_users.length === 0;
      const isAssignedToPage = page?.assigned_users?.includes(user?.email || '');
      const isAssignedToConv = conv.assigned_to && (conv.assigned_to === user?.email || conv.assigned_to === user?.name || conv.assigned_to.includes(user?.name || ''));

      // CSKH can see if they are assigned to the page OR assigned to the conversation OR the page has no one assigned
      if (!isAssignedToPage && !isAssignedToConv && !isPageUnassigned) return false;
    }

    if (conversationFilter === 'unread' && (conv.unread_count || 0) <= 0) return false;
    if (conversationFilter === 'bot' && conv.is_human_intervened) return false;

    const searchTerm = conversationSearch.trim().toLowerCase();
    if (searchTerm) {
      const searchableText = [
        conv.customer_name,
        conv.page_name,
        conv.page_id,
        conv.customer_id,
        conv.last_message,
        conv.assigned_to,
        conv.campaign_name
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });

  const filterButtonClass = (filter: 'all' | 'unread' | 'bot') =>
    `px-3 py-1.5 text-xs font-semibold rounded-full shrink-0 transition-colors ${conversationFilter === filter
      ? 'bg-blue-100 text-blue-700'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="h-full min-h-0 bg-slate-50 flex overflow-hidden shadow-sm">
      {/* ─── LEFT PANEL: Conversation List ─── */}
      <div className="w-[300px] xl:w-[340px] 2xl:w-[380px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800">Tin nhắn</h2>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="messenger-conversation-search"
              type="text"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Tìm kiếm khách hàng..."
              className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            <button id="messenger-filter-all" onClick={() => setConversationFilter('all')} className={filterButtonClass('all')}>Tất cả</button>
            <button id="messenger-filter-unread" onClick={() => setConversationFilter('unread')} className={filterButtonClass('unread')}>Chưa đọc</button>
            <button id="messenger-filter-bot" onClick={() => setConversationFilter('bot')} className={filterButtonClass('bot')}>Bot đang xử lý</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {displayedConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Không có tin nhắn nào bạn đang phụ trách.
            </div>
          ) : (
            displayedConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConv(conv)}
                className={`px-4 py-3 border-b border-slate-100 cursor-pointer transition-colors ${selectedConv?.id === conv.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex gap-3">
                  <div
                    className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0"
                  >
                    <AvatarImage
                      src={getConversationAvatar(conv)}
                      name={conv.customer_name}
                      size="sm"
                      className="border border-slate-200"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate pr-2">
                        {conv.customer_name}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {formatConversationListTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate flex-1 min-w-0 ${conv.unread_count > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                        {conv.last_message}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {conv.is_human_intervened ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md flex items-center gap-1 whitespace-nowrap">
                          <Hand className="w-3 h-3" /> NV CSKH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1 whitespace-nowrap">
                          <Bot className="w-3 h-3" /> AI Dify
                        </span>
                      )}
                      {conv.campaign_name && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md truncate max-w-[120px] whitespace-nowrap">
                          Ads: {conv.campaign_name}
                        </span>
                      )}
                      {conv.customer_status && (
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-md truncate max-w-[120px] border whitespace-nowrap ${getCustomerStatusClass(conv.customer_status)}`}>
                          {conv.customer_status}
                        </span>
                      )}
                      {conv.assigned_to && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md truncate max-w-[120px] border border-slate-200 whitespace-nowrap">
                          👤 {conv.assigned_to.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )))}
        </div>
      </div>

      {/* ─── MIDDLE PANEL: Chat Area ─── */}
      <div className="flex-1 min-w-0 flex flex-col bg-white relative">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="min-h-[64px] py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 px-5 bg-white shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                  <AvatarImage
                    src={getConversationAvatar(selectedConv)}
                    name={selectedConv.customer_name}
                    size="sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate pr-4">
                    {selectedConv.customer_name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>Trạng thái:</span>
                    {selectedConv.is_human_intervened ? (
                      <span className="text-orange-600 font-medium">Nhân viên đang hỗ trợ</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">AI đang tự động trả lời</span>
                    )}
                  </div>
                </div>
              </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 md:pr-3 md:border-r border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Khách:</span>
                    <select
                      id="messenger-customer-status-select"
                      className={`text-sm border rounded-lg px-3 py-1.5 font-black outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 max-w-[150px] truncate ${selectedConv.customer_status ? getCustomerStatusClass(selectedConv.customer_status) : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      value={selectedConv.customer_status || ''}
                      onChange={(e) => handleCustomerStatusChange(e.target.value)}
                    >
                      <option value="">-- Chọn trạng thái --</option>
                      {customerStatuses.map(status => (
                        <option key={status.label} value={status.label}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  {isManager && (
                  <div className="flex items-center gap-2 md:pr-4 md:border-r border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Phụ trách:</span>
                    <select
                      className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 max-w-[160px] truncate"
                      value={selectedConv.assigned_to || ''}
                      onChange={(e) => handleAssign(e.target.value)}
                    >
                      <option value="">-- Chưa giao --</option>
                      {staffList.length > 0 ? staffList.map(staff => (
                        <option key={staff.email} value={staff.email}>{staff.name} ({staff.role || 'Thành viên'})</option>
                      )) : (
                        <>
                          <option value="Nguyễn Văn A (Sale)">Nguyễn Văn A (Sale)</option>
                          <option value="Lê Văn C (CSKH)">Lê Văn C (CSKH)</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
                <button
                  onClick={handleToggleBot}
                  className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap shadow-sm ${selectedConv.is_human_intervened
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
                    }`}
                >
                  {selectedConv.is_human_intervened ? (
                    <><Power className="w-4 h-4" /> Bật lại AI</>
                  ) : (
                    <><Hand className="w-4 h-4" /> Dừng AI - CSKH Chat</>
                  )}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50 scroll-smooth"
            >
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
              {!hasMoreMessages && messages.length >= 10 && (
                <div className="text-center text-slate-400 text-xs py-2">
                  Đã tải hết lịch sử tin nhắn
                </div>
              )}
              {messages.map((msg, i) => {
                const isUser = msg.sender_type === 'user';
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex gap-3 max-w-[70%] ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
                      {!isUser && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender_type === 'ai' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                          {msg.sender_type === 'ai' ? <Bot className="w-4 h-4 text-emerald-600" /> : <User className="w-4 h-4 text-blue-600" />}
                        </div>
                      )}

                      <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                        <div className={`p-3 rounded-2xl relative group ${isUser ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm' :
                            msg.sender_type === 'ai' ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md' :
                              'bg-blue-600 text-white rounded-tr-sm shadow-md'
                          }`}>
                          {msg.attachment_type === 'image' && msg.attachment_proxy_url && (
                            <a
                              href={`${API_BASE_URL}${msg.attachment_proxy_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-xl bg-slate-100 border border-white/20 shadow-sm mb-2"
                              title="Mở ảnh trong tab mới"
                            >
                              <img
                                src={`${API_BASE_URL}${msg.attachment_proxy_url}`}
                                alt="Ảnh trong tin nhắn Messenger"
                                className="max-h-80 max-w-full object-contain bg-slate-100"
                                loading="lazy"
                              />
                            </a>
                          )}
                          {msg.message_text && msg.message_text !== '[Ảnh]' && (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                          )}
                          
                          <button 
                            onClick={() => handleTranslate(msg.id, msg.message_text)}
                            disabled={translatingId === msg.id}
                            className={`absolute ${isUser ? '-right-10' : '-left-10'} top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 hover:border-blue-200 z-10`}
                            title="Dịch bằng AI"
                          >
                            {translatingId === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                          </button>

                          {translations[msg.id] && (
                            <div className={`mt-2 pt-2 border-t ${isUser ? 'border-slate-100 text-slate-500' : 'border-white/20 text-white/90'} text-xs italic`}>
                              <div className="flex items-center gap-1 mb-1 font-bold not-italic uppercase tracking-wider text-[10px] opacity-70">
                                <Languages className="w-3 h-3" /> Bản dịch AI:
                              </div>
                              {translations[msg.id]}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!isUser && (
                            <span className="opacity-70 ml-1 font-medium">• {msg.sender_type === 'ai' ? 'AI Dify' : 'CSKH'}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="px-4 py-3 bg-white border-t border-slate-200">
              {!selectedConv.is_human_intervened && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <Bot className="w-4 h-4 shrink-0" />
                  AI đang trong chế độ tự động trả lời. Nếu bạn gửi tin nhắn, AI sẽ tự động bị tạm dừng.
                </div>
              )}

              <div className="mb-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={translationMode}
                      onChange={(e) => setTranslationMode(e.target.checked)}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Soạn tiếng Việt → dịch trước khi gửi
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-white/80 border border-indigo-100 text-slate-600 font-bold">
                      {isDetectingLanguage ? 'AI đang đoán ngôn ngữ...' : replyLanguageSource === 'manual' ? 'Nhân viên chọn' : replyLanguageSource === 'detected' ? 'AI tự đoán' : 'Mặc định'}
                    </span>
                    <select
                      value={replyTargetLanguage.code}
                      onChange={(e) => handleReplyLanguageChange(e.target.value)}
                      disabled={isDetectingLanguage}
                      className="bg-white border border-indigo-200 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {replyLanguageOptions.map(language => (
                        <option key={language.code} value={language.code}>{language.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {translationMode && (
                  <div className="space-y-3">
                    <div className="flex items-end gap-3 bg-white/90 p-2 rounded-2xl border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
                      <textarea
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value);
                          if (translatedReplyText && e.target.value.trim() !== translatedFromText) {
                            setTranslatedReplyText('');
                          }
                        }}
                        placeholder="Soạn tin nhắn bằng tiếng Việt cho nhân viên..."
                        className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none px-3 py-2.5 text-sm scrollbar-thin"
                        rows={1}
                      />
                      <button
                        onClick={handleTranslateReply}
                        disabled={!replyText.trim() || isTranslatingReply || isDetectingLanguage}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0 text-sm font-bold"
                      >
                        {isTranslatingReply ? 'Đang dịch...' : 'Dịch'}
                      </button>
                    </div>

                    {replyText.trim() && translatedReplyText && replyText.trim() !== translatedFromText && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        Nội dung tiếng Việt đã thay đổi. Vui lòng bấm Dịch lại trước khi gửi.
                      </div>
                    )}

                    {translatedReplyText && (
                      <div className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Bản dịch gửi cho khách ({replyTargetLanguage.label})</p>
                          <button
                            onClick={handleSendTranslatedReply}
                            disabled={!translatedReplyText.trim() || replyText.trim() !== translatedFromText || isTranslatingReply}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" /> Gửi bản dịch
                          </button>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{translatedReplyText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!translationMode && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Trả lời trong Messenger..."
                    className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none text-sm scrollbar-thin"
                    rows={1}
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <button
                        onClick={openImageLibrary}
                        disabled={isSendingImage}
                        className="p-2 rounded-full hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                        title="Gửi ảnh / mở thư viện ảnh"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsTemplatePanelOpen(prev => !prev)}
                        className={`p-2 rounded-full transition-colors ${isTemplatePanelOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                        title="Tin nhắn mẫu"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!replyText.trim()}
                      className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                      title="Gửi tin nhắn"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {!translationMode && isTemplatePanelOpen && (
                <div className="mt-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-blue-700">Tin nhắn mẫu</p>
                      <p className="text-[11px] font-semibold text-blue-500">Đang hiển thị theo {activeTemplateLanguageLabel}</p>
                    </div>
                    <button onClick={() => setIsTemplatePanelOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Đóng</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeMessageTemplates.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-3 py-4 text-xs font-semibold text-slate-500">
                        Chưa có tin nhắn mẫu cho ngôn ngữ này. Vui lòng thêm trong Cài đặt hệ thống.
                      </div>
                    )}
                    {activeMessageTemplates.map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setReplyText(template);
                          setIsTemplatePanelOpen(false);
                        }}
                        className="max-w-full rounded-full border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm transition-all"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa chọn hội thoại</h3>
            <p>Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái.</p>
          </div>
        )}
      </div>

      {/* ─── RIGHT PANEL: Customer Info & Notes ─── */}
      <div className="w-[300px] xl:w-[340px] 2xl:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="h-[56px] border-b border-slate-200 flex items-center px-5">
          <h2 className="font-bold text-slate-800">Thông tin chi tiết</h2>
        </div>

        {selectedConv ? (
          <div className="px-5 py-4 overflow-y-auto flex-1">
            <div className="mb-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                  <AvatarImage
                    src={getConversationAvatar(selectedConv)}
                    name={selectedConv.customer_name}
                    size="lg"
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-base font-black text-slate-900 truncate">{selectedConv.customer_name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {getConversationPageName(selectedConv) && (
                      <div className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold flex items-center gap-1 max-w-full">
                        <Facebook className="w-3 h-3 shrink-0" />
                        <span className="truncate">{getConversationPageName(selectedConv)}</span>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" /> {new Date(selectedConv.last_message_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút Lên Đơn */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="col-span-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Lên Đơn
              </button>

                <button
                  onClick={() => {
                    if (!selectedConv.facebook_uid) {
                      alert('Chưa có UID thật. Hãy cập nhật Profile Facebook thủ công trước để mở đúng hội thoại trong Meta Inbox.');
                      return;
                    }
                    if (!selectedConv.business_id) {
                      alert('Fanpage này chưa cấu hình Meta Business ID. Vào Cài đặt Messenger > Fanpage để nhập Business ID trước.');
                      return;
                    }
                    const inboxUrl = new URL('https://business.facebook.com/latest/inbox/all');
                    inboxUrl.searchParams.set('asset_id', selectedConv.page_id);
                    inboxUrl.searchParams.set('business_id', selectedConv.business_id);
                    inboxUrl.searchParams.set('ir_qe_exposed', '1');
                    inboxUrl.searchParams.set('nav_ref', 'manage_page_ap_plus_default');
                    inboxUrl.searchParams.set('selected_item_id', selectedConv.facebook_uid);
                    inboxUrl.searchParams.set('mailbox_id', selectedConv.page_id);
                    inboxUrl.searchParams.set('thread_type', 'FB_MESSAGE');
                    window.open(inboxUrl.toString(), '_blank');
                  }}
                  className="py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  Inbox FB
                </button>
                <button
                  onClick={() => {
                    if (selectedConv.facebook_uid) {
                      window.open(`https://www.facebook.com/profile.php?id=${selectedConv.facebook_uid}`, '_blank');
                    } else {
                      alert('Chưa có UID thật. Hãy dán link Business Suite có selected_item_id để lưu UID trước.');
                    }
                  }}
                  className="py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 text-[11px]"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Profile FB
                </button>
            </div>

            {/* Manual Facebook Profile Panel */}
            <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Lấy UID
                  </h4>
                </div>
                <button
                  id="edit-manual-profile-url"
                  onClick={() => {
                    setProfileUrlInput(selectedConv.manual_profile_url || '');
                    setIsEditingProfileUrl(prev => !prev);
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-blue-700 text-[11px] font-bold hover:bg-blue-50 transition-colors"
                >
                  {isEditingProfileUrl ? 'Đóng' : selectedConv.manual_profile_url ? 'Sửa' : 'Thêm'}
                </button>
              </div>

              <div className="space-y-2 text-xs">

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/80 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">PSID</p>
                    <p className="font-mono text-[11px] text-slate-700 break-all">{selectedConv.customer_id}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">UID thật</p>
                    <p className={`font-mono text-[11px] break-all ${selectedConv.facebook_uid ? 'text-emerald-700 font-bold' : 'text-slate-400 italic'}`}>
                      {selectedConv.facebook_uid || 'Chưa có'}
                    </p>
                  </div>
                </div>


                {isEditingProfileUrl && (
                  <div className="rounded-2xl border border-blue-100 bg-white p-3 space-y-2">
                    <input
                      id="manual-profile-url-input"
                      value={profileUrlInput}
                      onChange={(e) => setProfileUrlInput(e.target.value)}
                      placeholder="Dán link Business Suite có selected_item_id hoặc link Facebook profile"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    />
                    <div className="flex gap-2">
                      <button
                        id="save-manual-profile-url"
                        onClick={handleSaveManualProfile}
                        disabled={isSavingProfileUrl || !profileUrlInput.trim()}
                        className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSavingProfileUrl ? 'Đang lưu...' : 'Lưu & parse UID'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfileUrl(false);
                          setProfileUrlInput(selectedConv.manual_profile_url || '');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Ưu tiên dán link Meta Business Suite Inbox có <b>selected_item_id</b>. Hệ thống sẽ tự lưu UID thật và cập nhật <b>business_id</b> cho Fanpage nếu link có tham số này.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ads Tracking Panel */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl border border-purple-100 p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-100">
                <h4 className="flex items-center gap-2 font-bold text-slate-800">
                  <Target className="w-5 h-5 text-purple-600" />
                  Nguồn Quảng cáo (Ads)
                </h4>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${selectedConv.ad_id ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {selectedConv.ad_id ? 'Có Ads source' : 'Organic'}
                </span>
              </div>

              {selectedConv.ad_id ? (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-white/70 bg-white shadow-sm">
                    {selectedConv.ad_image && (
                      <div className="bg-slate-950 aspect-video flex items-center justify-center">
                        <img src={selectedConv.ad_image} alt="Ad Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Nguồn mới nhất</p>
                          <h5 className="text-sm font-black text-slate-900">{selectedConv.ad_name || selectedConv.campaign_name || selectedConv.ad_id}</h5>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${selectedConv.ad_source_status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : selectedConv.ad_source_status === 'permission_error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {selectedConv.ad_source_status === 'resolved' ? 'Đã resolve' : selectedConv.ad_source_status || 'detected'}
                        </span>
                      </div>
                      {selectedConv.ad_message && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600 text-[13px] line-clamp-4">
                          "{selectedConv.ad_message}"
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Campaign</p>
                          <p className="font-semibold text-slate-800 break-words">{selectedConv.campaign_name || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Ad Set</p>
                          <p className="font-semibold text-slate-800 break-words">{selectedConv.adset_name || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Ad ID</p>
                          <p className="font-mono text-slate-700 break-all">{selectedConv.ad_id}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Cập nhật</p>
                          <p className="font-semibold text-slate-700">{selectedConv.ad_source_updated_at ? new Date(selectedConv.ad_source_updated_at).toLocaleString() : '—'}</p>
                        </div>
                      </div>
                      {selectedConv.ad_source_error && (
                        <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                          <b>Lỗi lấy Ads:</b> {selectedConv.ad_source_error}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    id="toggle-ad-history"
                    onClick={() => setShowAdHistory(prev => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-purple-100 text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <span>Lịch sử Ads đã nhấn ({adSources.length})</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showAdHistory ? 'rotate-90' : ''}`} />
                  </button>

                  {showAdHistory && (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {isLoadingAdSources ? (
                        <div className="text-center py-4 text-xs text-slate-400">Đang tải lịch sử Ads...</div>
                      ) : adSources.length > 0 ? adSources.map((source, idx) => (
                        <div key={source.id} className="relative pl-5">
                          <div className="absolute left-1 top-2 bottom-0 w-px bg-purple-100" />
                          <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                          <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-black text-slate-800 line-clamp-1">{source.ad_name || source.campaign_name || source.ad_id}</p>
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">#{idx + 1}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">Campaign: {source.campaign_name || '—'}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">Ad Set: {source.adset_name || '—'}</p>
                            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                              <span>Nhấn {source.click_count || 1} lần</span>
                              <span>{source.last_seen_at ? new Date(source.last_seen_at).toLocaleString() : ''}</span>
                            </div>
                            {source.error_message && <p className="mt-2 text-[11px] text-rose-600">{source.error_message}</p>}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">Chưa có lịch sử Ads.</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm italic bg-white/70 rounded-xl border border-dashed border-slate-200">
                  Khách tự nhiên (Organic) hoặc webhook chưa gửi referral ad_id.
                </div>
              )}
            </div>

            {/* Ghi chú section */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Ghi chú nội bộ
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-3 pr-1 scrollbar-thin">
                {notes.map(note => (
                  <div key={note.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-sm text-slate-800 mb-1">{note.note_text}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>{note.author_name}</span>
                      <span>{formatNoteTime(note.created_at)}</span>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có ghi chú nào.
                  </div>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Thêm ghi chú..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                />
                <button
                  onClick={handleSendNote}
                  disabled={!newNote.trim()}
                  className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-6 text-center italic">
            Chọn một hội thoại để xem thông tin chi tiết.
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Quản lý Fanpage & Dify</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                   <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-4">Các trang đã kết nối</h3>
                  {pages.map(page => (
                    <div key={page.id} className="border border-slate-200 rounded-2xl mb-3 overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
                      <div
                        onClick={() => setExpandedPageId(expandedPageId === page.page_id ? null : page.page_id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${expandedPageId === page.page_id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                              {page.page_name}
                            </h4>
                            <p className="text-sm text-slate-500">ID: {page.page_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-emerald-200">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Đang hoạt động
                          </span>

                          <div className="flex flex-col gap-1 items-end ml-2" onClick={e => e.stopPropagation()}>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phân phối</span>
                            <select
                              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-bold text-slate-700 outline-none cursor-pointer focus:border-blue-500 shadow-sm"
                              value={page.distribution_mode || 'manual'}
                              onChange={(e) => handleUpdatePageSettings(page.page_id)}
                            >
                              <option value="manual">Thủ công (Manager chia)</option>
                              <option value="round_robin">Chia đều (Round Robin)</option>
                              <option value="ai_first">AI Trả lời trước</option>
                            </select>
                          </div>

                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedPageId === page.page_id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedPageId === page.page_id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 bg-slate-50/50"
                          >
                            <div className="p-5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Page Access Token</p>
                                  <input
                                    type="password"
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Dán mã Page Access Token mới vào đây..."
                                    value={editingPage?.id === page.page_id ? editingPage.token : ''}
                                    onChange={(e) => {
                                      const newToken = e.target.value;
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: newToken,
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || ''),
                                        facebookAdAccountId: prev?.id === page.page_id ? prev.facebookAdAccountId : (page.facebook_ad_account_id || ''),
                                        businessId: prev?.id === page.page_id ? prev.businessId : (page.business_id || '')
                                      }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dify Chat API Key</p>
                                  <input
                                    type="text"
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="app-..."
                                    value={editingPage?.id === page.page_id ? editingPage.difyKey : (page.dify_api_key || '')}
                                    onChange={(e) => {
                                      const newKey = e.target.value;
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: prev?.id === page.page_id ? prev.token : '',
                                        difyKey: newKey,
                                        facebookAdAccountId: prev?.id === page.page_id ? prev.facebookAdAccountId : (page.facebook_ad_account_id || ''),
                                        businessId: prev?.id === page.page_id ? prev.businessId : (page.business_id || '')
                                      }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian AI chờ trả lời (giây)</p>
                                  <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mặc định: 5 giây"
                                    value={editingPage?.id === page.page_id ? (editingPage.aiReplyDelay ?? page.ai_reply_delay ?? 5) : (page.ai_reply_delay ?? 5)}
                                    onChange={(e) => {
                                      const newDelay = parseInt(e.target.value) || 5;
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: prev?.id === page.page_id ? prev.token : '',
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || ''),
                                        facebookAdAccountId: prev?.id === page.page_id ? prev.facebookAdAccountId : (page.facebook_ad_account_id || ''),
                                        businessId: prev?.id === page.page_id ? prev.businessId : (page.business_id || ''),
                                        aiReplyDelay: newDelay
                                      }));
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facebook Ad Account ID</p>
                                  <input
                                    id={`fb-ad-account-${page.page_id}`}
                                    type="text"
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="VD: act_123456789 hoặc 123456789"
                                    value={editingPage?.id === page.page_id ? (editingPage.facebookAdAccountId ?? '') : (page.facebook_ad_account_id || '')}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: prev?.id === page.page_id ? prev.token : '',
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || ''),
                                        facebookAdAccountId: value,
                                        businessId: prev?.id === page.page_id ? prev.businessId : (page.business_id || ''),
                                        aiReplyDelay: prev?.id === page.page_id ? prev.aiReplyDelay : (page.ai_reply_delay ?? 5),
                                        aiStartHour: prev?.id === page.page_id ? prev.aiStartHour : (page.ai_start_hour ?? 0),
                                        aiEndHour: prev?.id === page.page_id ? prev.aiEndHour : (page.ai_end_hour ?? 24)
                                      }));
                                    }}
                                  />
                                  <p className="mt-1 text-[11px] text-slate-400">Dùng để test quyền <b>ads_read</b> qua Campaigns API.</p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meta Business ID</p>
                                  <input
                                    id={`fb-business-id-${page.page_id}`}
                                    type="text"
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: 758611632240327"
                                    value={editingPage?.id === page.page_id ? (editingPage.businessId ?? '') : (page.business_id || '')}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: prev?.id === page.page_id ? prev.token : '',
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || ''),
                                        facebookAdAccountId: prev?.id === page.page_id ? prev.facebookAdAccountId : (page.facebook_ad_account_id || ''),
                                        businessId: value,
                                        aiReplyDelay: prev?.id === page.page_id ? prev.aiReplyDelay : (page.ai_reply_delay ?? 5),
                                        aiStartHour: prev?.id === page.page_id ? prev.aiStartHour : (page.ai_start_hour ?? 0),
                                        aiEndHour: prev?.id === page.page_id ? prev.aiEndHour : (page.ai_end_hour ?? 24)
                                      }));
                                    }}
                                  />
                                  <p className="mt-1 text-[11px] text-slate-400">Dùng để mở đúng thread trong Meta Business Suite Inbox.</p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bật AI từ lúc (Giờ)</p>
                                  <select
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingPage?.id === page.page_id ? (editingPage.aiStartHour ?? page.ai_start_hour ?? 0) : (page.ai_start_hour ?? 0)}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: prev?.id === page.page_id ? prev.token : '',
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || ''),
                                        facebookAdAccountId: prev?.id === page.page_id ? prev.facebookAdAccountId : (page.facebook_ad_account_id || ''),
                                        businessId: prev?.id === page.page_id ? prev.businessId : (page.business_id || ''),
                                        aiReplyDelay: prev?.id === page.page_id ? prev.aiReplyDelay : (page.ai_reply_delay ?? 5),
                                        aiStartHour: val,
                                        aiEndHour: prev?.id === page.page_id ? prev.aiEndHour : (page.ai_end_hour ?? 24)
                                      }));
                                    }}
                                  >
                                    {Array.from({ length: 25 }, (_, i) => (
                                      <option key={i} value={i}>{i} giờ</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tắt AI lúc (Giờ)</p>
                                  <select
                                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingPage?.id === page.page_id ? (editingPage.aiEndHour ?? page.ai_end_hour ?? 24) : (page.ai_end_hour ?? 24)}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      setEditingPage(prev => ({
                                        id: page.page_id,
                                        token: prev?.id === page.page_id ? prev.token : '',
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || ''),
                                        facebookAdAccountId: prev?.id === page.page_id ? prev.facebookAdAccountId : (page.facebook_ad_account_id || ''),
                                        businessId: prev?.id === page.page_id ? prev.businessId : (page.business_id || ''),
                                        aiReplyDelay: prev?.id === page.page_id ? prev.aiReplyDelay : (page.ai_reply_delay ?? 5),
                                        aiStartHour: prev?.id === page.page_id ? prev.aiStartHour : (page.ai_start_hour ?? 0),
                                        aiEndHour: val
                                      }));
                                    }}
                                  >
                                    {Array.from({ length: 25 }, (_, i) => (
                                      <option key={i} value={i}>{i} giờ</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="mb-5">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nhân sự quản lý Page</p>
                                <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                                  {staffList.length > 0 ? staffList.map(staff => (
                                    <label key={staff.email} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-50 px-2 rounded-lg">
                                      <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={(page.assigned_users || []).includes(staff.email)}
                                        onChange={(e) => handleAssignPageUser(page.page_id, staff.email, e.target.checked)}
                                      />
                                      <span className="text-sm text-slate-700">{staff.name} <span className="text-xs text-slate-400">({staff.role || 'Thành viên'})</span></span>
                                    </label>
                                  )) : (
                                    <div className="text-xs text-slate-400 italic py-2">Chưa tải được danh sách nhân sự.</div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdatePageSettings(page.page_id)}
                                    disabled={!editingPage || editingPage.id !== page.page_id}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                  >
                                    Lưu thay đổi
                                  </button>
                                  <button
                                    onClick={() => handleTestPageToken(page)}
                                    disabled={isTestingConn}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
                                    {isTestingConn ? 'Đang kiểm tra...' : 'Test token & Ads'}
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleDeletePage(page.page_id, page.page_name)}
                                  className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa Trang
                                </button>
                              </div>

                              {tokenTestResults[page.page_id] && (
                                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kết quả kiểm tra Token & Ads</h4>
                                    <span className="text-[10px] text-slate-400">{tokenTestResults[page.page_id].checked_at ? new Date(tokenTestResults[page.page_id].checked_at).toLocaleString() : 'Vừa kiểm tra'}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                    {[
                                      ['Token còn sống', tokenTestResults[page.page_id].token_alive],
                                      ['Page access', tokenTestResults[page.page_id].page_access_ok],
                                      ['ads_read / Ad Account', tokenTestResults[page.page_id].ads_read_ok]
                                    ].map(([label, ok]) => (
                                      <div key={String(label)} className={`rounded-xl px-3 py-2 text-xs font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        {ok ? '✓' : '✕'} {label}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {(tokenTestResults[page.page_id].permissions || []).map((perm: any) => (
                                      <span key={perm.name} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${perm.granted ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        {perm.granted ? '✓' : '–'} {perm.name}
                                      </span>
                                    ))}
                                  </div>
                                  {(tokenTestResults[page.page_id].errors || []).length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {tokenTestResults[page.page_id].errors.map((err: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className={`text-[11px] rounded-xl p-3 border ${err.severity === 'info'
                                            ? 'text-slate-600 bg-slate-50 border-slate-200'
                                            : 'text-rose-600 bg-rose-50 border-rose-100'
                                          }`}
                                        >
                                          <b>{err.step || 'error'}:</b> {err.message}
                                          {err.detail && <span className="block mt-1 opacity-70">Meta detail: {err.detail}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Terminal Log View */}
                              <div className="bg-[#1e1e1e] rounded-xl p-4 shadow-inner border border-slate-800">
                                <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                  <span className="text-[10px] text-slate-400 font-mono ml-2">system_log_tty1</span>
                                </div>
                                <div className="font-mono text-[11px] leading-relaxed space-y-1.5 h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                  <p className="text-slate-300"><span className="text-emerald-400">[{new Date(Date.now() - 3600000).toLocaleTimeString()}]</span> [INFO] Khởi tạo kết nối Fanpage ID: {page.page_id}</p>
                                  <p className="text-slate-300"><span className="text-emerald-400">[{new Date(Date.now() - 3595000).toLocaleTimeString()}]</span> [OK] Đã lưu thông tin Access Token thành công.</p>
                                  <p className="text-slate-300"><span className="text-emerald-400">[{new Date(Date.now() - 3590000).toLocaleTimeString()}]</span> [OK] Xác thực Graph API v25.0: Thành công.</p>
                                  {page.dify_api_key ? (
                                    <p className="text-slate-300"><span className="text-emerald-400">[{new Date(Date.now() - 3585000).toLocaleTimeString()}]</span> [OK] Xác thực Dify Chatbot API: Thành công.</p>
                                  ) : (
                                    <p className="text-amber-400"><span className="text-amber-500">[{new Date(Date.now() - 3585000).toLocaleTimeString()}]</span> [WARN] Chưa có Dify API Key, AI sẽ không tự động trả lời.</p>
                                  )}
                                  <p className="text-slate-300"><span className="text-emerald-400">[{new Date().toLocaleTimeString()}]</span> [WAITING] Đang chờ Webhook events từ Facebook (messages)...</p>
                                  {isTestingConn && (
                                    <p className="text-blue-400 animate-pulse mt-2">&gt; Gửi ping tới Facebook Graph API...</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <h3 className="font-bold text-slate-800 mb-1">Kết nối Fanpage mới</h3>
                  <p className="text-sm text-slate-500 mb-6">Kết nối tự động qua Facebook hoặc nhập thông tin thủ công.</p>

                  {/* Nút Kết nối qua Facebook */}
                  <button
                    onClick={() => {
                      const FB = (window as any).FB;
                      if (!FB) {
                        alert("Đang tải thư viện Facebook. Vui lòng thử lại sau vài giây.");
                        return;
                      }

                      FB.login((response: any) => {
                        if (response.authResponse) {
                          const accessToken = response.authResponse.accessToken;
                          FB.api('/me/accounts', { access_token: accessToken }, (pagesResponse: any) => {
                            if (pagesResponse && !pagesResponse.error && pagesResponse.data?.length > 0) {
                              const firstPage = pagesResponse.data[0];
                              setNewPageForm(prev => ({
                                ...prev,
                                pageName: firstPage.name,
                                pageId: firstPage.id,
                                pageAccessToken: firstPage.access_token
                              }));
                              alert(`Đã lấy thành công thông tin trang: ${firstPage.name}`);
                            } else {
                              alert("Không tìm thấy Fanpage nào hoặc bạn chưa cấp quyền đủ.");
                            }
                          });
                        } else {
                          console.log('User cancelled login or did not fully authorize.');
                        }
                      }, {
                        config_id: import.meta.env.VITE_FACEBOOK_CONFIG_ID || '',
                        scope: 'pages_show_list,pages_messaging,pages_manage_metadata'
                      });
                    }}
                    className="w-full mb-6 py-3.5 bg-[#1877F2] text-white font-bold rounded-xl hover:bg-[#166FE5] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-md shadow-blue-500/20"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                    Kết nối tự động qua Facebook (Khuyên dùng)
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoặc nhập thủ công</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tên hiển thị</label>
                      <input
                        type="text"
                        value={newPageForm.pageName}
                        onChange={(e) => setNewPageForm({ ...newPageForm, pageName: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="VD: Sky Mobile CSKH"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Page ID</label>
                      <input
                        type="text"
                        value={newPageForm.pageId}
                        onChange={(e) => setNewPageForm({ ...newPageForm, pageId: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="Nhập ID trang Fanpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Page Access Token</label>
                      <input
                        type="password"
                        value={newPageForm.pageAccessToken}
                        onChange={(e) => setNewPageForm({ ...newPageForm, pageAccessToken: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="EAAA..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        Dify Chat API Key
                        <a href="https://dify.movads.vn" target="_blank" className="text-blue-600 font-normal hover:underline flex items-center gap-1 text-xs">
                          Lấy key tại dify.movads.vn <ExternalLink className="w-3 h-3" />
                        </a>
                      </label>
                      <input
                        type="password"
                        value={newPageForm.difyApiKey}
                        onChange={(e) => setNewPageForm({ ...newPageForm, difyApiKey: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="app-..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Facebook Ad Account ID</label>
                      <input
                        id="new-facebook-ad-account-id"
                        type="text"
                        value={newPageForm.facebookAdAccountId}
                        onChange={(e) => setNewPageForm({ ...newPageForm, facebookAdAccountId: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                        placeholder="VD: act_123456789 hoặc 123456789"
                      />
                      <p className="mt-1 text-xs text-slate-400">Cần user kết nối Page có quyền xem Ad Account và app đã duyệt ads_read.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Meta Business ID</label>
                      <input
                        id="new-facebook-business-id"
                        type="text"
                        value={newPageForm.businessId}
                        onChange={(e) => setNewPageForm({ ...newPageForm, businessId: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="VD: 758611632240327"
                      />
                      <p className="mt-1 text-xs text-slate-400">Lấy trong URL Business Suite: business_id=...</p>
                    </div>
                    <button
                      onClick={handleAddPage}
                      className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl mt-4 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Thêm Fanpage
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isImageLibraryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsImageLibraryOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[86vh] bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden border border-white/60"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Thư viện ảnh CSKH</h2>
                  <p className="text-xs text-white/80 mt-1">Chọn ảnh mẫu hoặc thêm URL ảnh mới để gửi qua Facebook Messenger.</p>
                </div>
                <button onClick={() => setIsImageLibraryOpen(false)} className="p-2 hover:bg-white/15 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 max-h-[calc(86vh-76px)] overflow-hidden">
                <div className="p-5 overflow-y-auto bg-slate-50">
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        id="messenger-image-library-search"
                        value={imageLibrarySearch}
                        onChange={(e) => setImageLibrarySearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') loadImageLibrary(imageLibrarySearch); }}
                        placeholder="Tìm theo tên, mô tả, danh mục..."
                        className="w-full outline-none text-sm bg-transparent"
                      />
                    </div>
                    <button
                      onClick={() => loadImageLibrary(imageLibrarySearch)}
                      disabled={isLoadingImages}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl font-bold text-sm disabled:opacity-50"
                    >
                      {isLoadingImages ? 'Đang tải...' : 'Tìm'}
                    </button>
                  </div>

                  {selectedImageIds.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
                      <div className="text-sm font-bold text-slate-700">
                        Đã chọn <span className="text-violet-600">{selectedImageIds.length}</span> ảnh để gửi
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedImageIds([])}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
                        >
                          Bỏ chọn
                        </button>
                        <button
                          onClick={handleSendSelectedImages}
                          disabled={isSendingImage}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-black text-white shadow-lg shadow-violet-500/20 disabled:opacity-50"
                        >
                          {isSendingImage ? 'Đang gửi...' : `Gửi ${selectedImageIds.length} ảnh`}
                        </button>
                      </div>
                    </div>
                  )}

                  {imageLibrary.length === 0 ? (
                    <div className="h-64 rounded-3xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center text-slate-400">
                      <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
                      <p className="font-bold text-slate-600">Chưa có ảnh trong thư viện</p>
                      <p className="text-sm">Thêm ảnh bằng form bên phải để dùng lại cho các hội thoại.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {imageLibrary.map(item => {
                        const selectedIndex = selectedImageIds.indexOf(item.id);
                        const isSelected = selectedIndex >= 0;
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelectedImage(item.id)}
                            className={`bg-white rounded-3xl border shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer ${isSelected ? 'border-violet-500 ring-4 ring-violet-100' : 'border-slate-200'}`}
                          >
                            <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              <div className={`absolute top-3 right-3 h-7 min-w-7 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-sm ${isSelected ? 'bg-violet-600 text-white border-white px-2' : 'bg-white/90 text-slate-400 border-white'}`}>
                                {isSelected ? selectedIndex + 1 : ''}
                              </div>
                              {item.category && (
                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-slate-700 text-[10px] font-black shadow-sm">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-black text-slate-900 truncate">{item.title}</h3>
                              {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendImage('', item.id);
                                  }}
                                  disabled={isSendingImage || deletingImageId === item.id}
                                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  <Send className="w-4 h-4" /> {isSendingImage ? 'Đang gửi...' : 'Gửi'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLibraryImage(item);
                                  }}
                                  disabled={deletingImageId === item.id || isSendingImage}
                                  title="Xoá ảnh khỏi thư viện"
                                  className="h-9 w-9 shrink-0 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50 disabled:hover:bg-rose-50 disabled:hover:text-rose-600 flex items-center justify-center transition-all"
                                >
                                  {deletingImageId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-5 bg-white border-l border-slate-200 overflow-y-auto">
                  <h3 className="font-black text-slate-900 mb-1">Thêm ảnh mới</h3>
                  <p className="text-xs text-slate-500 mb-4">Dùng URL ảnh công khai HTTPS để Facebook có thể tải và gửi cho khách.</p>
                  <div className="space-y-3">
                    <input
                      value={newLibraryImage.title}
                      onChange={(e) => setNewLibraryImage(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Tên ảnh / mục đích sử dụng"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    />
                    <input
                      value={newLibraryImage.image_url}
                      onChange={(e) => setNewLibraryImage(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://.../image.jpg"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    />
                    <input
                      value={newLibraryImage.category}
                      onChange={(e) => setNewLibraryImage(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Danh mục (VD: Bảng giá, Hướng dẫn)"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    />
                    <textarea
                      value={newLibraryImage.description}
                      onChange={(e) => setNewLibraryImage(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả ngắn..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                    />
                    {newLibraryImage.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={newLibraryImage.image_url} alt="Preview ảnh mới" className="w-full max-h-48 object-contain" />
                      </div>
                    )}
                    <button
                      onClick={handleAddLibraryImage}
                      disabled={!newLibraryImage.title.trim() || !newLibraryImage.image_url.trim()}
                      className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black disabled:opacity-50"
                    >
                      Lưu vào thư viện
                    </button>
                    <button
                      onClick={() => handleSendImage(newLibraryImage.image_url)}
                      disabled={!newLibraryImage.image_url.trim() || isSendingImage}
                      className="w-full py-3 bg-violet-50 text-violet-700 border border-violet-100 rounded-2xl font-black disabled:opacity-50"
                    >
                      Gửi URL này ngay
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isOrderModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOrderModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[70] p-6"
            >
              <h2 className="text-xl font-bold mb-4">Lên đơn hàng</h2>
              {/* Order form fields... */}
              <button onClick={() => setIsOrderModalOpen(false)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Đóng</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
