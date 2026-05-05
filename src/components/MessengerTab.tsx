import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Settings, Search, Send, User, Bot, Clock, Filter,
  ChevronRight, MoreVertical, Plus, CreditCard, Target, ExternalLink, Power, Hand,
  ShoppingCart, Package, MapPin, Phone, StickyNote, RefreshCw, Trash2, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS } from '../data/productData';
import { AvatarImage } from './AvatarImage';

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

// ─── Avatar Helper ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#ec4899', '#be185d'],
  ['#f59e0b', '#b45309'], ['#10b981', '#047857'], ['#ef4444', '#b91c1c'],
  ['#06b6d4', '#0e7490'], ['#f97316', '#c2410c']
];

const getAvatarGradient = (name: string) => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const AvatarFallback = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const [from, to] = getAvatarGradient(name);
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <div
      className={`w-full h-full flex items-center justify-center font-bold text-white ${sizeClass}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {getInitials(name)}
    </div>
  );
};

interface FBPage {
  id: number;
  page_id: string;
  page_name: string;
  is_active: boolean;
  distribution_mode: 'manual' | 'round_robin' | 'ai_first';
  dify_api_key?: string;
}

interface Conversation {
  id: number;
  page_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string | null;
  avatarUrl?: string | null;
  last_message: string;
  last_message_at: string;
  is_human_intervened: boolean;
  ad_id?: string;
  campaign_name?: string;
  ad_cost?: number;
  unread_count: number;
  assigned_to?: string;
  profile_link?: string;
  ad_image?: string;
  ad_message?: string;
  customer_note?: string;
}

interface Message {
  id: number;
  sender_type: 'user' | 'ai' | 'human';
  message_text: string;
  created_at: string;
}

interface ConversationNote {
  id: number;
  conversation_id: number;
  note_text: string;
  author_name?: string;
  author_email?: string;
  created_at: string;
}

interface DetailedProduct {
  id: number;
  name: string;
  sale_price: number;
  import_price: number;
  import_date: string;
  seller: string;
  category: string;
  description: string;
  created_at: string;
}

export const MessengerTab = ({ user }: { user?: any }) => {
  const [pages, setPages] = useState<FBPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [replyText, setReplyText] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [warehouseProducts, setWarehouseProducts] = useState<DetailedProduct[]>([]);

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
    difyApiKey: ''
  });

  const [editingPage, setEditingPage] = useState<{ id: string, token: string, difyKey: string } | null>(null);

  const isManager = user?.role === 'Quản trị' || user?.role?.includes('Trưởng');
  const [staffList, setStaffList] = useState<{ name: string, email: string, role: string }[]>([]);

  const getConversationAvatar = (conv: Conversation) => conv.avatarUrl || conv.customer_avatar || null;
  const currentUserName = user?.name || user?.email || 'Người dùng hiện tại';
  const currentUserEmail = user?.email || null;

  const formatNoteTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
        if (API_BASE_URL === '/') API_BASE_URL = '';
        else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

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
    // Initialize Facebook SDK
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
    };

    (function (d, s, id) {
      var js: any, fjs: any = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/vi_VN/sdk.js";
      if (fjs) fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  // Fetch real data on load
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

    // Poll for new conversations every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch products for order modal
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

  const loadMessages = async (convId: number) => {
    try {
      setIsLoadingMore(false);
      setHasMoreMessages(true);
      setIsInitialLoad(true);
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${convId}/messages?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
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
          setMessages(prev => [...newData, ...prev]);

          // Maintain scroll position after state update
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

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);
    setNewNote('');
    loadMessages(conv.id);
    loadNotes(conv.id);

    // Refresh profile if name is generic or avatar is missing
    if (conv.customer_name === 'Khách hàng FB' || !getConversationAvatar(conv)) {
      try {
        let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
        if (API_BASE_URL === '/') API_BASE_URL = '';
        else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

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

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedConv) return;

    const textToSend = replyText;
    setReplyText('');

    // Optimistic UI update
    const newMessage: Message = {
      id: Date.now(),
      sender_type: 'human',
      message_text: textToSend,
      created_at: new Date().toISOString()
    };
    setIsInitialLoad(true);
    setMessages(prev => [...prev, newMessage]);

    // Update conversation state to human intervened
    setSelectedConv(prev => prev ? { ...prev, is_human_intervened: true, last_message: textToSend, last_message_at: new Date().toISOString() } : null);

    try {
      await fetch(`${API_BASE_URL}/api/fb/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          text: textToSend
        })
      });
    } catch (err) {
      console.error('Error sending message:', err);
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
        method: 'POST', // Changed to POST for better compatibility
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

  const handleChangeDistribution = (pageId: string, mode: 'manual' | 'round_robin' | 'ai_first') => {
    setPages(prev => prev.map(p => p.page_id === pageId ? { ...p, distribution_mode: mode } : p));
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
          dify_api_key: newPageForm.difyApiKey || null
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
          difyApiKey: ''
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
          dify_api_key: editingPage.difyKey
        })
      });

      if (res.ok) {
        setPages(prev => prev.map(p => p.page_id === pageId ? {
          ...p,
          dify_api_key: editingPage.difyKey
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
    if (isManager) return true;
    if (!conv.assigned_to) return false;
    return conv.assigned_to === user?.email || conv.assigned_to === user?.name || conv.assigned_to.includes(user?.name);
  });

  return (
    <div className="h-[calc(100vh-100px)] min-h-[600px] bg-slate-50 flex rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800">Tin nhắn</h2>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            <button className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full shrink-0">Tất cả</button>
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold rounded-full shrink-0">Chưa đọc</button>
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold rounded-full shrink-0">Bot đang xử lý</button>
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
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedConv?.id === conv.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
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
                      <h4
                        className="font-bold text-sm text-slate-900 truncate pr-2"
                      >
                        {conv.customer_name}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                      {conv.last_message}
                    </p>

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

      <div className="flex-1 flex flex-col bg-white relative">
        {selectedConv ? (
          <>
            <div className="min-h-[72px] py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 px-6 bg-white shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden"
                >
                  <AvatarImage
                    src={getConversationAvatar(selectedConv)}
                    name={selectedConv.customer_name}
                    size="sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-slate-900 text-lg truncate pr-4"
                    onClick={async () => {
                      if (isManager) {
                        const newName = window.prompt('Nhập tên khách hàng mới:', selectedConv.customer_name);
                        if (newName && newName !== selectedConv.customer_name) {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/rename`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName })
                            });
                            if (res.ok) {
                              setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, customer_name: newName } : c));
                              setSelectedConv({ ...selectedConv, customer_name: newName });
                            }
                          } catch (err) {
                            alert('Lỗi khi đổi tên');
                          }
                        }
                      }
                    }}
                  >
                    {selectedConv.customer_name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>Trạng thái:</span>
                    {selectedConv.is_human_intervened ? (
                      <span className="text-orange-600 font-medium">Nhân viên đang hỗ trợ</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">AI đang tự động trả lời</span>
                    )}
                    <button
                      onClick={async (e) => {
                        const btn = e.currentTarget;
                        const originalText = btn.innerText;
                        btn.innerText = 'Đang cập nhật...';
                        btn.disabled = true;

                        try {
                          console.log('Refreshing profile for:', selectedConv.id);
                          const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/refresh-profile`, { method: 'POST' });
                          if (!res.ok) throw new Error('API Error ' + res.status);

                          const data = await res.json();
                          if (data.success) {
                            setConversations(prev => prev.map(c => c.id === selectedConv.id ? {
                              ...c,
                              customer_name: data.customer_name,
                              avatarUrl: data.avatarUrl,
                              customer_avatar: data.customer_avatar,
                              profile_link: data.profile_link
                            } : c));
                            setSelectedConv({
                              ...selectedConv,
                              customer_name: data.customer_name,
                              avatarUrl: data.avatarUrl,
                              customer_avatar: data.customer_avatar,
                              profile_link: data.profile_link
                            });
                            alert('Cập nhật thành công!');
                          } else {
                            alert('Không thể lấy thông tin từ Facebook: ' + (data.error || 'Lỗi không xác định'));
                          }
                        } catch (err) {
                          console.error('Refresh error:', err);
                          alert('Lỗi kết nối: ' + err.message);
                        } finally {
                          btn.innerText = originalText;
                          btn.disabled = false;
                        }
                      }}
                      className="ml-2 text-blue-600 hover:underline text-[10px] disabled:opacity-50"
                    >
                      Cập nhật ảnh/tên
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
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
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth"
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
                        <div className={`p-3 rounded-2xl ${isUser ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm' :
                            msg.sender_type === 'ai' ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md' :
                              'bg-blue-600 text-white rounded-tr-sm shadow-md'
                          }`}>
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
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
            <div className="p-4 bg-white border-t border-slate-200">
              {!selectedConv.is_human_intervened && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <Bot className="w-4 h-4 shrink-0" />
                  AI đang trong chế độ tự động trả lời. Nếu bạn gửi tin nhắn, AI sẽ tự động bị tạm dừng.
                </div>
              )}
              <div className="flex items-end gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Nhập tin nhắn để trả lời khách hàng..."
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none px-3 py-2.5 text-sm scrollbar-thin"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!replyText.trim()}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
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

      {/* ─── RIGHT PANEL: Customer Info & Ads Tracking ─── */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="h-16 border-b border-slate-200 flex items-center px-6">
          <h2 className="font-bold text-slate-800">Thông tin chi tiết</h2>
        </div>

        {selectedConv ? (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-sm overflow-hidden"
              >
                <AvatarImage
                  src={getConversationAvatar(selectedConv)}
                  name={selectedConv.customer_name}
                  size="lg"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedConv.customer_name}</h3>
              <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
                <Clock className="w-4 h-4" /> Lần cuối: {new Date(selectedConv.last_message_at).toLocaleDateString('vi-VN')}
              </p>
            </div>

            {/* Nút Lên Đơn & Profile */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Lên Đơn
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (selectedConv.customer_id && selectedConv.page_id) window.open(`https://www.facebook.com/${selectedConv.page_id}/inbox/${selectedConv.customer_id}`, '_blank');
                  }}
                  className="py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  Inbox FB
                </button>
                <button
                  onClick={() => {
                    if (selectedConv.customer_id && selectedConv.page_id) {
                      // Using Meta Business Suite People link which is more reliable for PSIDs
                      window.open(`https://business.facebook.com/latest/people/${selectedConv.customer_id}?asset_id=${selectedConv.page_id}`, '_blank');
                    }
                  }}
                  className="py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 text-[11px]"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Profile FB
                </button>
              </div>
            </div>

            {/* Ads Tracking Panel */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                <Target className="w-5 h-5 text-purple-600" />
                Nguồn Quảng cáo (Ads)
              </h4>

              {selectedConv.campaign_name ? (
                <div className="space-y-4">
                  {selectedConv.ad_image && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 aspect-video flex items-center justify-center relative group">
                      <img
                        src={selectedConv.ad_image}
                        alt="Ad Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex flex-col items-center justify-center gap-2 text-slate-400"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22%3E%3Crect x=%222%22 y=%222%22 width=%2220%22 height=%2220%22 rx=%222%22 ry=%222%22/%3E%3Ccircle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/%3E%3Cpath d=%22M21 15l-5-5L5 21%22/%3E%3C/svg%3E" alt="Error" class="w-12 h-12 opacity-40" /><span class="text-sm">Không thể tải hình ảnh</span></div>';
                          }
                        }}
                      />
                    </div>
                  )}
                  {selectedConv.ad_message && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 italic text-slate-600 text-[13px] line-clamp-3">
                      "{selectedConv.ad_message}"
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chiến dịch</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedConv.campaign_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ad ID</p>
                      <p className="text-sm text-slate-700">{selectedConv.ad_id}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chi phí / Mess</p>
                      <p className="text-sm font-bold text-rose-600">{selectedConv.ad_cost?.toLocaleString()}đ</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm italic">
                  Khách tự nhiên (Organic)
                </div>
              )}
            </div>

            {/* Notes Panel */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Ghi chú nội bộ</h4>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
                <div className="max-h-56 overflow-y-auto p-3 space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-6">
                      Chưa có ghi chú nội bộ.
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="bg-white border border-amber-100 rounded-xl p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {note.author_name || note.author_email || 'Người dùng'}
                            </p>
                            {note.author_email && (
                              <p className="text-[10px] text-slate-400 truncate">{note.author_email}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatNoteTime(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{note.note_text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-amber-200 bg-white p-3">
              <textarea
                className="w-full min-h-[76px] max-h-32 resize-none bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Thêm ghi chú về khách hàng này..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSendNote();
                  }
                }}
              ></textarea>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSendNote}
                      disabled={!newNote.trim()}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi ghi chú
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-6 text-center">
            Chọn một cuộc hội thoại để xem chi tiết thông tin và dữ liệu Ads.
          </div>
        )}
      </div>

      {/* ─── SETTINGS MODAL ─── */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Quản lý Fanpage & Tích hợp Dify</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-6 h-6 rotate-90" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                              value={page.distribution_mode}
                              onChange={(e) => handleChangeDistribution(page.page_id, e.target.value as any)}
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
                              <div className="grid grid-cols-1 gap-4 mb-5">
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
                                        difyKey: prev?.id === page.page_id ? prev.difyKey : (page.dify_api_key || '')
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
                                        difyKey: newKey
                                      }));
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdatePageSettings(page.page_id)}
                                    disabled={!editingPage || editingPage.id !== page.page_id || (!editingPage.token && editingPage.difyKey === page.dify_api_key)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                  >
                                    Lưu thay đổi
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsTestingConn(true);
                                      setTimeout(() => setIsTestingConn(false), 1500);
                                    }}
                                    disabled={isTestingConn}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
                                    {isTestingConn ? 'Đang kiểm tra...' : 'Test kết nối'}
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleDeletePage(page.page_id, page.page_name)}
                                  className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-600 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa Trang
                                </button>
                              </div>

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
                                  <p className="text-slate-300"><span className="text-emerald-400">[{new Date(Date.now() - 3590000).toLocaleTimeString()}]</span> [OK] Xác thực Graph API v19.0: Thành công.</p>
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
                        config_id: import.meta.env.VITE_FACEBOOK_CONFIG_ID || '', // Tùy chọn nếu dùng Configuration Login
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

        {/* ─── ORDER MODAL ─── */}
        {isOrderModalOpen && selectedConv && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOrderModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Lên đơn hàng mới</h2>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="order-form" onSubmit={handleCreateOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" /> Tên Khách Hàng
                    </label>
                    <input
                      type="text"
                      value={selectedConv.customer_name}
                      readOnly
                      className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500" /> Số điện thoại
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.phone}
                      onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      placeholder="Nhập SĐT..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" /> Địa chỉ giao hàng
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.address}
                      onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-500" /> Sản phẩm
                      </label>
                      <select
                        required
                        value={orderForm.product}
                        onChange={e => {
                          const productName = e.target.value;
                          const product = warehouseProducts.find(p => p.name === productName);
                          setOrderForm({ 
                            ...orderForm, 
                            product: productName,
                            price: product ? product.sale_price.toString() : ''
                          });
                        }}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow cursor-pointer"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {warehouseProducts.length > 0 ? (
                          warehouseProducts.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))
                        ) : (
                          PRODUCTS.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-500" /> Tổng tiền (¥/VNĐ)
                      </label>
                      <input
                        type="text"
                        value={orderForm.price}
                        onChange={e => setOrderForm({ ...orderForm, price: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        placeholder="VD: 3500¥"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-slate-500" /> Ghi chú đơn hàng
                    </label>
                    <textarea
                      value={orderForm.note}
                      onChange={e => setOrderForm({ ...orderForm, note: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow min-h-[80px] resize-none"
                      placeholder="Ghi chú thêm về giờ giao, yêu cầu đặc biệt..."
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="order-form"
                  className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Xác nhận lên đơn
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
