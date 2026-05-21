import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCog, GraduationCap, TrendingUp, Settings, LogOut, Wifi, ChevronRight
} from 'lucide-react';

type Props = { user: any; onLogout: () => void; isSystemAdmin: boolean; allowedTabs: string[] };

const MENU_ITEMS = [
  { id: 'model', label: 'Mô hình Vận hành', icon: Users, path: '/model' },
  { id: 'hr', label: 'Nhân sự & JD', icon: UserCog, path: '/hr' },
  { id: 'training', label: 'Đào tạo & Văn hóa', icon: GraduationCap, path: '/training' },
  { id: 'business', label: 'Kế hoạch kinh doanh', icon: TrendingUp, path: '/business', adminOnly: true },
  { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/settings', adminOnly: true },
  { id: 'settings-users', label: 'Quản lý người dùng', icon: UserCog, path: '/settings/users', adminOnly: true, child: true },
];

export const MobileMenuPage = ({ user, onLogout, isSystemAdmin, allowedTabs }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 px-5 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg"><Wifi className="w-5 h-5 text-white" /></div>
          <span className="font-bold text-white text-lg">Telecom</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <img src={user.picture} alt="" className="w-12 h-12 rounded-full border-2 border-blue-500/30" />
            <div>
              <p className="font-bold text-white">{user.name}</p>
              <p className="text-xs text-blue-400">{user.role}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        {MENU_ITEMS.map(item => {
          if (item.adminOnly && !isSystemAdmin) return null;
          const permissionId = item.id === 'settings-users' ? 'users' : item.id;
          if (!isSystemAdmin && !allowedTabs.includes(permissionId)) return null;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 ${item.child ? 'ml-4 w-[calc(100%-1rem)]' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`${item.child ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl bg-slate-100 flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-bold text-sm text-slate-800">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      <div className="p-4 pt-2">
        <button onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white rounded-2xl border border-rose-100 text-rose-600 font-bold text-sm active:bg-rose-50">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
};
