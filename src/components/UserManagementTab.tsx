import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, UserPlus, Mail, Shield,
  Trash2, Edit2, Check, X, Search,
  RefreshCw, AlertCircle, ShieldAlert
} from 'lucide-react';

interface User {
  email: string;
  name: string;
  role: string;
  picture?: string;
  created_at: string;
  manager_email?: string;
}

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

const ROLE_OPTIONS = [
  'Quản trị',
  'Trưởng nhóm Marketing',
  'Trưởng nhóm Sale',
  'Trưởng nhóm CSKH',
  'Nhân viên Quảng cáo',
  'Nhân viên Content',
  'Nhân viên Media',
  'Nhân viên Sale',
  'Nhân viên CSKH',
  'Telesale',
  'Nhân viên Kỹ thuật',
  'Nhân viên kế toán tổng hợp',
  'Nhân viên Hành chính & Nhân sự',
  'Quản lý',
  'Thành viên',
  'Khách'
];

export const UserManagementTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'Thành viên',
    permissions: [] as string[],
    manager_email: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/role-permissions`);
      if (!response.ok) throw new Error('Failed to fetch role permissions');
      const data = await response.json();
      setRolePermissions(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRolePermissions();
  }, []);

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        manager_email: user.manager_email || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        role: 'Thành viên',
        permissions: [],
        manager_email: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser
        ? `${API_BASE_URL}/api/users/${editingUser.email}`
        : `${API_BASE_URL}/api/users`;

      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save user');

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (email: string) => {
    if (email === 'tuanci5@gmail.com') {
      alert('Không thể xóa tài khoản Quản trị viên hệ thống.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${email}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEditRole = (role: string, currentTabs: string[]) => {
    setEditingRole(role);
    setTempPermissions(currentTabs);
  };

  const handleToggleTempPermission = (tabId: string) => {
    setTempPermissions(prev =>
      prev.includes(tabId) ? prev.filter(t => t !== tabId) : [...prev, tabId]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/role-permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editingRole, allowed_tabs: tempPermissions })
      });
      if (!response.ok) throw new Error('Failed to save role permissions');
      await fetchRolePermissions();
      setEditingRole(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRolePermission = async (role: string, tabId: string, allowed: boolean) => {
    // This is now handled by handleSaveRolePermissions for manual save
    // But kept for any background logic if needed, or can be removed
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const uniqueRoles = Array.from(new Set(users.map(u => u.role))).sort();

  const TABS_TO_MANAGE = [
    { id: 'model', label: 'Mô hình Vận hành' },
    { id: 'hr', label: 'Nhân sự & JD' },
    { id: 'salary', label: 'Lương & KPI' },
    { id: 'cost', label: 'Cơ cấu chi phí' },
    { id: 'training', label: 'Đào tạo & Văn hóa' },
    { id: 'business', label: 'Kế hoạch kinh doanh' },
    { id: 'action-plan', label: 'Kế hoạch 4 tháng' },
    { id: 'products', label: 'Sản phẩm & Dịch vụ' },
    { id: 'users', label: 'Quản lý người dùng' },
    { id: 'tasks', label: 'Quản lý công việc' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
            Phân quyền & Người dùng
          </h2>
          <p className="text-slate-500 mt-2">Quản lý người dùng và cấu hình quyền truy cập theo vai trò.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Người dùng
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'roles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Phân quyền Vai trò
          </button>
        </div>
      </header>

      {activeSubTab === 'users' ? (
        <>
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo email, tên hoặc vai trò..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm shrink-0 max-w-[200px]"
            >
              <option value="all">Tất cả vai trò</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-5 h-5" />
              Thêm người dùng
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò / Chức vụ</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quản lý trực tiếp</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Đang tải...</td></tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy người dùng nào.</td></tr>
                  ) : paginatedUsers.map((user) => (
                    <tr key={user.email} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            {user.picture ? <img src={user.picture} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.manager_email ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {users.find(u => u.email === user.manager_email)?.name?.charAt(0) || user.manager_email.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm text-slate-700">
                              {users.find(u => u.email === user.manager_email)?.name || user.manager_email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          {user.email !== 'tuanci5@gmail.com' && (
                            <button onClick={() => handleDelete(user.email)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  Hiển thị <span className="font-bold text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</span> / <span className="font-bold text-slate-700">{filteredUsers.length}</span> người dùng
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹ Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${currentPage === page
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Vai trò / Chức vụ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quyền truy cập các mục</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ROLE_OPTIONS.map(role => {
                  const perms = rolePermissions.find(p => p.role === role);
                  let allowedTabs = perms ? (Array.isArray(perms.allowed_tabs) ? perms.allowed_tabs : []) : [];

                  if (perms && typeof perms.allowed_tabs === 'string') {
                    try {
                      allowedTabs = JSON.parse(perms.allowed_tabs);
                    } catch (e) {
                      allowedTabs = [];
                    }
                  }

                  const isEditing = editingRole === role;
                  const currentTabs = isEditing ? tempPermissions : allowedTabs;

                  return (
                    <tr key={role} className={`transition-colors ${isEditing ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-6 font-bold text-slate-700">{role}</td>
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-3">
                          {isEditing ? (
                            TABS_TO_MANAGE.map(tab => (
                              <label key={tab.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${currentTabs.includes(tab.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={currentTabs.includes(tab.id)}
                                  onChange={() => handleToggleTempPermission(tab.id)}
                                />
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${currentTabs.includes(tab.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                  {currentTabs.includes(tab.id) && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                </div>
                                <span className="text-xs font-bold">{tab.label}</span>
                              </label>
                            ))
                          ) : (
                            allowedTabs.length > 0 ? (
                              allowedTabs.map(tabId => {
                                const tab = TABS_TO_MANAGE.find(t => t.id === tabId);
                                return (
                                  <span key={tabId} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                    {tab ? tab.label : tabId}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa có quyền</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingRole(null)}
                              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                              title="Hủy"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleSaveRolePermissions}
                              className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                              title="Lưu thay đổi"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditRole(role, allowedTabs)}
                            className="inline-flex items-center gap-1 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all text-sm font-bold"
                          >
                            <Edit2 className="w-4 h-4" />
                            Sửa quyền
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal User (Updated) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email đăng nhập</label>
                  <input type="email" required disabled={!!editingUser} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all disabled:bg-slate-50" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Họ và tên</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Vai trò hệ thống</label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 appearance-none bg-white" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    {ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                {formData.role !== 'Quản trị' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Quản lý trực tiếp (Tùy chọn)</label>
                    <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 appearance-none bg-white" value={formData.manager_email} onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}>
                      <option value="">-- Không có quản lý trực tiếp --</option>
                      {users.filter(u => u.email !== formData.email).map(u => (
                        <option key={u.email} value={u.email}>{u.name} ({u.email}) - {u.role}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50">Hủy</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Lưu thông tin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
