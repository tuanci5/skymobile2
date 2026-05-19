import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TabType } from '../types';
import { ScrollToTop } from './ScrollToTop';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Eye, Shield, ChevronDown, Check, Sparkles } from 'lucide-react';

type AppShellProps = {
  activeTab: TabType;
  activeDept: string | null;
  hrSubTab?: string;
  onLogout: () => void;
  user: any;
  allowedTabs: string[];
  isSystemAdmin: boolean;
  routeKey: string;
  children: React.ReactNode;
};

const ROLE_OPTIONS = [
  'Quản trị',
  'Trưởng phòng Kinh doanh Marketing',
  'Trưởng nhóm Marketing',
  'Trưởng nhóm Sale',
  'Trưởng nhóm CSKH',
  'Nhân viên Quảng cáo',
  'Nhân viên CSKH',
  'Nhân viên Sale',
  'Nhân viên Chăm sóc khách hàng',
  'Nhân viên Kỹ thuật',
  'Nhân viên Đào tạo',
  'Trưởng phòng Hành chính - Nhân sự',
  'Nhân viên Hành chính - Nhân sự',
  'Trưởng phòng Tài chính - Kế toán',
  'Nhân viên Tài chính - Kế toán',
];

export const AppShell = ({
  activeTab,
  activeDept,
  hrSubTab,
  onLogout,
  user,
  allowedTabs,
  isSystemAdmin,
  routeKey,
  children,
}: AppShellProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { realUser, simulatedRole, setSimulatedRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRealAdmin = realUser ? (realUser.role === 'Quản trị') : false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: string) => {
    if (role === 'Quản trị') {
      setSimulatedRole(null);
    } else {
      setSimulatedRole(role);
    }
    setDropdownOpen(false);
  };

  const currentDisplayRole = simulatedRole || 'Quản trị';

  return (
    <div className={`flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 ${activeTab === 'messenger' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Sidebar
        activeTab={activeTab}
        activeDept={activeDept}
        hrSubTab={hrSubTab}
        onLogout={onLogout}
        user={user}
        allowedTabs={allowedTabs}
        isSystemAdmin={isSystemAdmin}
      />

      <main
        ref={scrollContainerRef}
        className={`flex-1 relative ${activeTab === 'messenger' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6 lg:p-8'}`}
      >
        {/* Impersonation Selector for Admins */}
        {isRealAdmin && (
          <div ref={dropdownRef} className="absolute top-4 right-4 md:right-8 z-[100] flex flex-col items-end">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black border transition-all active:scale-95 shadow-sm ${
                simulatedRole
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/75'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {simulatedRole ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="max-w-[150px] md:max-w-[200px] truncate">Xem quyền: {simulatedRole}</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quyền: Quản trị</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-185' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl py-2 overflow-hidden flex flex-col max-h-[350px]"
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> Giả lập vai trò
                    </span>
                    {simulatedRole && (
                      <button
                        onClick={() => handleRoleSelect('Quản trị')}
                        className="text-[10px] font-black text-rose-500 hover:underline"
                      >
                        Khôi phục
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {ROLE_OPTIONS.map((role) => {
                      const isSelected = currentDisplayRole === role;
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleSelect(role)}
                          className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{role}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={`w-full ${activeTab === 'messenger' ? 'h-full max-w-none' : 'max-w-[1800px] mx-auto'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={activeTab === 'messenger' ? 'h-full' : undefined}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </div>
  );
};
