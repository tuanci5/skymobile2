import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  CheckCircle2,
  ShoppingCart,
  PieChart,
  Menu,
} from 'lucide-react';
import type { TabType } from '../types';

type BottomNavProps = {
  activeTab: TabType;
  unreadCount?: number;
};

const NAV_ITEMS = [
  { id: 'messenger', label: 'Tin nhắn', icon: MessageSquare, path: '/messenger' },
  { id: 'tasks', label: 'Công việc', icon: CheckCircle2, path: '/tasks' },
  { id: 'products', label: 'Sản phẩm', icon: ShoppingCart, path: '/products' },
  { id: 'revenue', label: 'Báo cáo', icon: PieChart, path: '/revenue' },
  { id: 'menu', label: 'Menu', icon: Menu, path: '/mobile-menu' },
] as const;

export const BottomNav = ({ activeTab, unreadCount = 0 }: BottomNavProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (id: string) => {
    if (id === 'menu') {
      return pathname === '/mobile-menu' || ['model', 'hr', 'training', 'business', 'users', 'settings'].includes(activeTab);
    }
    return activeTab === id;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full relative transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5.5 h-5.5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.id === 'messenger' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-600 rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
