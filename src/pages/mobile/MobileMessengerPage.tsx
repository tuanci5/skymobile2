import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Send, Bot, User, Hand, Power, ShoppingCart, MessageCircle, ChevronRight, Info, RefreshCw, Languages, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarImage } from '../../components/AvatarImage';
import { API_BASE_URL } from '../../components/messenger/api';
import { getConversationAvatar } from '../../components/messenger/utils';
import { OPTIMISTIC_MESSAGE_ID_BASE, isOptimisticMessage, isSameOutgoingMessage } from '../../components/messenger/messageUtils';
import type { Conversation, Message } from '../../components/messenger/types';
import { BottomNav } from '../../layout/BottomNav';

type MobileScreen = 'list' | 'chat' | 'info';

export const MobileMessengerPage = ({ user }: { user?: any }) => {
  const [screen, setScreen] = useState<MobileScreen>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'bot'>('all');
  const [searchText, setSearchText] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  // Fetch conversations
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fb/conversations`);
        if (res.ok) setConversations(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchConvs();
    const iv = setInterval(fetchConvs, 5000);
    return () => clearInterval(iv);
  }, []);

  // Poll messages
  useEffect(() => {
    if (!selectedConv) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/messages?limit=10`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(prev => {
          if (!data.length) return prev;
          if (!prev.length) return data;
          const lastNew = data[data.length - 1];
          const lastPrev = prev[prev.length - 1];
          if (lastNew.id !== lastPrev.id) {
            const newItems = data.filter((m: Message) => !prev.some(e => e.id === m.id || (isOptimisticMessage(e.id) && isSameOutgoingMessage(e, m))));
            if (prev.length <= 10) { setIsInitialLoad(true); return data; }
            if (newItems.length) { setIsInitialLoad(true); return [...prev, ...newItems]; }
          }
          return prev;
        });
      } catch (err) { console.error(err); }
    };
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, [selectedConv?.id]);

  // Scroll to bottom
  useEffect(() => {
    if (chatRef.current && isInitialLoad) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isInitialLoad]);

  const loadMessages = async (convId: number) => {
    setIsInitialLoad(true); setHasMore(true);
    const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${convId}/messages?limit=10`);
    if (res.ok) { const d = await res.json(); setMessages(d); if (d.length < 10) setHasMore(false); }
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !selectedConv || !messages.length) return;
    setIsLoadingMore(true); setIsInitialLoad(false);
    const before = messages[0].created_at;
    const hBefore = chatRef.current?.scrollHeight || 0;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/messages?limit=10&before=${encodeURIComponent(before)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.length < 10) setHasMore(false);
        if (d.length) {
          setMessages(p => [...d, ...p]);
          setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight - hBefore; }, 0);
        }
      }
    } finally { setIsLoadingMore(false); }
  };

  const markRead = async (id: number) => {
    setConversations(p => p.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
    try { await fetch(`${API_BASE_URL}/api/fb/conversations/${id}/read`, { method: 'POST' }); } catch {}
  };

  const selectConv = (conv: Conversation) => {
    setSelectedConv({ ...conv, unread_count: 0 });
    setReplyText('');
    markRead(conv.id);
    loadMessages(conv.id);
    setScreen('chat');
  };

  const sendMessage = async () => {
    const text = replyText.trim();
    if (!text || !selectedConv) return;
    setReplyText('');
    const optId = OPTIMISTIC_MESSAGE_ID_BASE + Date.now();
    const optMsg: Message = { id: optId, sender_type: 'human', message_text: text, created_at: new Date().toISOString() };
    setIsInitialLoad(true);
    setMessages(p => [...p, optMsg]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fb/messages/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedConv.id, text })
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      if (data.message) setMessages(p => p.map(m => m.id === optId ? data.message : m));
    } catch (err: any) {
      setMessages(p => p.filter(m => m.id !== optId));
      setReplyText(text);
      alert('Không thể gửi tin nhắn');
    }
  };

  const toggleBot = async () => {
    if (!selectedConv) return;
    const next = !selectedConv.is_human_intervened;
    setSelectedConv(p => p ? { ...p, is_human_intervened: next } : null);
    setConversations(p => p.map(c => c.id === selectedConv.id ? { ...c, is_human_intervened: next } : c));
    try {
      await fetch(`${API_BASE_URL}/api/fb/conversations/${selectedConv.id}/toggle-bot`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_human_intervened: next })
      });
    } catch {
      setSelectedConv(p => p ? { ...p, is_human_intervened: !next } : null);
      setConversations(p => p.map(c => c.id === selectedConv.id ? { ...c, is_human_intervened: !next } : c));
    }
  };

  const fmtTime = (v: string) => {
    const d = new Date(v); if (isNaN(d.getTime())) return '';
    const hrs = (Date.now() - d.getTime()) / 3600000;
    return hrs >= 24 ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const displayed = conversations.filter(c => {
    if (filter === 'unread' && (c.unread_count || 0) <= 0) return false;
    if (filter === 'bot' && c.is_human_intervened) return false;
    if (searchText.trim()) {
      const s = [c.customer_name, c.last_message, c.assigned_to].filter(Boolean).join(' ').toLowerCase();
      if (!s.includes(searchText.toLowerCase())) return false;
    }
    return true;
  });

  const filterBtn = (f: 'all' | 'unread' | 'bot') =>
    `px-3 py-1.5 text-xs font-semibold rounded-full shrink-0 transition-colors ${filter === f ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`;

  // ── SCREEN: Conversation List ──
  if (screen === 'list') return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <div className="px-4 pt-[env(safe-area-inset-top)] pb-2 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between py-3">
          <h1 className="font-bold text-xl text-slate-900">Tin nhắn</h1>
          <span className="text-xs text-slate-400">{conversations.length} cuộc hội thoại</span>
        </div>
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Tìm kiếm..."
            className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 pb-2">
          <button onClick={() => setFilter('all')} className={filterBtn('all')}>Tất cả</button>
          <button onClick={() => setFilter('unread')} className={filterBtn('unread')}>Chưa đọc</button>
          <button onClick={() => setFilter('bot')} className={filterBtn('bot')}>Bot đang xử lý</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        {displayed.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Không có tin nhắn.</div>
        ) : displayed.map(conv => (
          <div key={conv.id} onClick={() => selectConv(conv)}
            className="px-4 py-3 border-b border-slate-50 active:bg-slate-50 flex gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
              <AvatarImage src={getConversationAvatar(conv)} name={conv.customer_name} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <h4 className="font-bold text-sm text-slate-900 truncate pr-2">{conv.customer_name}</h4>
                <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(conv.last_message_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-xs truncate flex-1 ${conv.unread_count > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{conv.last_message}</p>
                {conv.unread_count > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                {conv.is_human_intervened ? (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md flex items-center gap-1"><Hand className="w-3 h-3" /> NV</span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1"><Bot className="w-3 h-3" /> AI</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav activeTab="messenger" unreadCount={totalUnread} />
    </div>
  );

  // ── SCREEN: Chat ──
  if (screen === 'chat' && selectedConv) return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}>
        <button onClick={() => { setScreen('list'); setSelectedConv(null); }} className="p-2 -ml-1 text-slate-600 active:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
          <AvatarImage src={getConversationAvatar(selectedConv)} name={selectedConv.customer_name} size="sm" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => setScreen('info')}>
          <h3 className="font-bold text-sm text-slate-900 truncate">{selectedConv.customer_name}</h3>
          <p className="text-[11px] text-slate-500">{selectedConv.is_human_intervened ? 'NV đang hỗ trợ' : 'AI tự động'}</p>
        </div>
        <button onClick={toggleBot}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 ${selectedConv.is_human_intervened ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
          {selectedConv.is_human_intervened ? <><Power className="w-3 h-3" /> AI</> : <><Hand className="w-3 h-3" /> CSKH</>}
        </button>
        <button onClick={() => setScreen('info')} className="p-2 text-slate-500">
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={chatRef} onScroll={e => { if (e.currentTarget.scrollTop === 0 && !isLoadingMore && hasMore) loadMore(); }}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50/50">
        {isLoadingMore && <div className="flex justify-center py-2"><RefreshCw className="w-5 h-5 text-blue-500 animate-spin" /></div>}
        {messages.map(msg => {
          const isUser = msg.sender_type === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] ${isUser ? '' : ''}`}>
                <div className={`px-3 py-2 rounded-2xl text-[14px] leading-relaxed ${isUser ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' : msg.sender_type === 'ai' ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                  {msg.attachment_type === 'image' && msg.attachment_proxy_url && (
                    <img src={`${API_BASE_URL}${msg.attachment_proxy_url}`} alt="" className="max-h-48 rounded-xl mb-1" loading="lazy" />
                  )}
                  {msg.message_text && msg.message_text !== '[Ảnh]' && <p className="whitespace-pre-wrap">{msg.message_text}</p>}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {!isUser && <span className="ml-1">• {msg.sender_type === 'ai' ? 'AI' : 'CSKH'}</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-white border-t border-slate-200" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        {!selectedConv.is_human_intervened && (
          <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5">
            <Bot className="w-3 h-3 shrink-0" /> AI đang tự động. Gửi tin sẽ tạm dừng AI.
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 max-h-24 min-h-[40px] bg-slate-100 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500" rows={1} />
          <button onClick={sendMessage} disabled={!replyText.trim()}
            className="p-2.5 rounded-full bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── SCREEN: Info ──
  if (screen === 'info' && selectedConv) return (
    <div className="flex flex-col h-[100dvh] bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button onClick={() => setScreen('chat')} className="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-slate-900">Thông tin chi tiết</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg mb-3">
            <AvatarImage src={getConversationAvatar(selectedConv)} name={selectedConv.customer_name} size="lg" />
          </div>
          <h3 className="font-black text-lg text-slate-900">{selectedConv.customer_name}</h3>
          <p className="text-xs text-slate-500 mt-1">{selectedConv.page_name || ''}</p>
        </div>

        <button onClick={() => setScreen('chat')}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm">
          <ShoppingCart className="w-4 h-4" /> Lên Đơn
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => {
            if (selectedConv.facebook_uid && selectedConv.business_id) {
              const url = new URL('https://business.facebook.com/latest/inbox/all');
              url.searchParams.set('asset_id', selectedConv.page_id);
              url.searchParams.set('business_id', selectedConv.business_id);
              url.searchParams.set('selected_item_id', selectedConv.facebook_uid);
              window.open(url.toString(), '_blank');
            } else alert('Chưa có UID hoặc Business ID');
          }} className="py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
            📥 Inbox FB
          </button>
          <button onClick={() => {
            if (selectedConv.facebook_uid) window.open(`https://www.facebook.com/profile.php?id=${selectedConv.facebook_uid}`, '_blank');
            else alert('Chưa có UID');
          }} className="py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
            👤 Profile FB
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
          <h4 className="font-bold text-sm text-slate-700">Thông tin</h4>
          <div className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between"><span className="text-slate-400">Trạng thái:</span>
              <span className={`font-bold ${selectedConv.is_human_intervened ? 'text-orange-600' : 'text-emerald-600'}`}>
                {selectedConv.is_human_intervened ? 'NV hỗ trợ' : 'AI tự động'}
              </span>
            </div>
            {selectedConv.assigned_to && <div className="flex justify-between"><span className="text-slate-400">Phụ trách:</span><span className="font-bold">{selectedConv.assigned_to}</span></div>}
            {selectedConv.customer_status && <div className="flex justify-between"><span className="text-slate-400">TT khách:</span><span className="font-bold">{selectedConv.customer_status}</span></div>}
            <div className="flex justify-between"><span className="text-slate-400">Cập nhật:</span><span>{new Date(selectedConv.last_message_at).toLocaleDateString('vi-VN')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
};
