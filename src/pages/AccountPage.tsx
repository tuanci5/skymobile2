import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Plus, Edit, Trash2, Key, Mail, Phone, Lock, 
  Search, Eye, EyeOff, FileText, AlertCircle, Loader2, Save, X, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

interface Account {
  id: string;
  account_type: string;
  username: string;
  password?: string;
  email: string;
  phone: string;
  two_factor: string;
  recovery_email: string;
  notes: string;
  created_at: string;
}

const ACCOUNT_TYPES = [
  'Facebook', 'Google', 'TikTok', 'Instagram', 'Gmail', 
  'Facebook Ads', 'Google Ads', 'TikTok Ads', 'Zalo',
  'GitHub', 'AWS', 'DigitalOcean', 'Vercel', 'Supabase',
  'ChatGPT / OpenAI', 'Claude / Anthropic', 'Midjourney',
  'Canva', 'Figma', 'Khác'
];

export const AccountPage = ({ user }: { user?: any }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    account_type: 'Facebook',
    custom_type: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    two_factor: '',
    recovery_email: '',
    notes: ''
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/accounts`);
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      const isCustom = !ACCOUNT_TYPES.includes(acc.account_type);
      setEditingAccount(acc);
      setFormData({
        account_type: isCustom ? 'Khác' : acc.account_type,
        custom_type: isCustom ? acc.account_type : '',
        username: acc.username || '',
        password: acc.password || '',
        email: acc.email || '',
        phone: acc.phone || '',
        two_factor: acc.two_factor || '',
        recovery_email: acc.recovery_email || '',
        notes: acc.notes || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        account_type: 'Facebook',
        custom_type: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        two_factor: '',
        recovery_email: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalType = formData.account_type === 'Khác' ? formData.custom_type : formData.account_type;
      
      const payload = {
        ...formData,
        account_type: finalType || 'Khác'
      };

      const url = editingAccount 
        ? `${API_BASE_URL}/api/accounts/${editingAccount.id}`
        : `${API_BASE_URL}/api/accounts`;
        
      const res = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save account');
      
      await fetchAccounts();
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
      await fetchAccounts();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAccounts = accounts.filter(a => 
    a.username?.toLowerCase().includes(search.toLowerCase()) || 
    a.account_type?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getAccountIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('facebook')) return <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold">F</div>;
    if (t.includes('google') || t.includes('gmail')) return <div className="w-8 h-8 rounded bg-red-500 text-white flex items-center justify-center font-bold">G</div>;
    if (t.includes('tiktok')) return <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">T</div>;
    if (t.includes('zalo')) return <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center font-bold">Z</div>;
    if (t.includes('github')) return <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center font-bold">Git</div>;
    return <Key className="w-6 h-6 text-slate-400" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">Quản lý Tài khoản</h3>
            <p className="text-slate-500 text-sm mt-0.5">Kho lưu trữ thông tin đăng nhập và cấu hình bảo mật</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm tài khoản
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên đăng nhập, loại tài khoản, email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-violet-400 outline-none transition-all" 
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
          <p>Đang tải danh sách tài khoản...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Key className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-bold text-slate-500">Không tìm thấy tài khoản</p>
          <p className="text-sm">Bấm "Thêm tài khoản" để bắt đầu lưu trữ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAccounts.map(acc => (
            <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getAccountIcon(acc.account_type)}
                  <div>
                    <h4 className="font-bold text-slate-900 truncate max-w-[150px]">{acc.username || 'N/A'}</h4>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider mt-1">
                      {acc.account_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenModal(acc)} className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Mật khẩu</span>
                    <button onClick={() => togglePassword(acc.id)} className="text-slate-400 hover:text-slate-600">
                      {showPasswords[acc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-medium text-slate-700 break-all">
                    {showPasswords[acc.id] ? (acc.password || '—') : '••••••••••••'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {acc.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{acc.email}</span>
                    </div>
                  )}
                  {acc.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{acc.phone}</span>
                    </div>
                  )}
                  {acc.two_factor && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 col-span-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" /> <span className="truncate">2FA: {acc.two_factor}</span>
                    </div>
                  )}
                </div>
              </div>

              {acc.notes && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 italic line-clamp-2">
                  <FileText className="w-3.5 h-3.5 inline mr-1 opacity-50" />
                  {acc.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa Tài khoản */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
                    {editingAccount ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="account-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700">Loại tài khoản <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {ACCOUNT_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, account_type: type})}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                              formData.account_type === type 
                                ? 'bg-violet-50 border-violet-600 text-violet-700 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      {formData.account_type === 'Khác' && (
                        <input 
                          type="text" 
                          placeholder="Nhập loại hình tài khoản..." 
                          required
                          value={formData.custom_type} 
                          onChange={e => setFormData({...formData, custom_type: e.target.value})}
                          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tên đăng nhập <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:ring-2 focus:ring-violet-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email đăng ký</label>
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">SĐT đăng ký</label>
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mã 2FA / Khôi phục</label>
                      <input 
                        type="text" 
                        value={formData.two_factor} 
                        onChange={e => setFormData({...formData, two_factor: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email khôi phục</label>
                      <input 
                        type="email" 
                        value={formData.recovery_email} 
                        onChange={e => setFormData({...formData, recovery_email: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Ghi chú (Cookies, Thông tin thêm...)</label>
                      <textarea 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 outline-none resize-none"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  form="account-form"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Lưu tài khoản
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
