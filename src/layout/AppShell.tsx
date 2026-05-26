import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TabType } from '../types';
import { ScrollToTop } from './ScrollToTop';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { isAdminRole, isSameRoleGroup } from '../auth/roleUtils';
import { Eye, Shield, ChevronDown, Check, Sparkles, ArrowLeft, Loader2, Search, UserRound } from 'lucide-react';

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

type ImpersonationUser = {
  email: string;
  name: string;
  role: string;
  picture?: string;
  permissions?: string[];
  manager_email?: string;
  created_at?: string;
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

const normalizeSearchText = (value?: string | null) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

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
  const { realUser, simulatedRole, simulatedUser, setSimulatedUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState<'role' | 'staff'>('role');
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<ImpersonationUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRealAdmin = realUser ? isAdminRole(realUser.role) : false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) {
      setSelectionStep('role');
      setPendingRole(null);
      setStaffSearch('');
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen || !isRealAdmin || staffList.length > 0) return;

    let active = true;
    setStaffLoading(true);
    setStaffError(null);

    userService.getAll()
      .then((data) => {
        if (!active) return;
        setStaffList(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!active) return;
        setStaffError(error?.message || 'Không thể tải danh sách nhân viên.');
      })
      .finally(() => {
        if (active) setStaffLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dropdownOpen, isRealAdmin, staffList.length]);

  const handleRoleSelect = (role: string) => {
    setPendingRole(role);
    setSelectionStep('staff');
    setStaffSearch('');
  };

  const handleStaffSelect = (staff: ImpersonationUser) => {
    setSimulatedUser({
      email: staff.email,
      name: staff.name || staff.email.split('@')[0],
      picture: staff.picture,
      role: staff.role || pendingRole || 'Thành viên',
      permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
      manager_email: staff.manager_email,
      created_at: staff.created_at,
    });
    setDropdownOpen(false);
  };

  const handleRestoreAdmin = () => {
    setSimulatedUser(null);
    setDropdownOpen(false);
  };

  const staffRoles: string[] = staffList.map((staff) => staff.role).filter((role) => role.trim().length > 0);
  const extraRoles: string[] = Array.from(new Set<string>(staffRoles))
    .filter((role) => !ROLE_OPTIONS.includes(role))
    .sort((a, b) => a.localeCompare(b, 'vi'));
  const roleOptions: string[] = [...ROLE_OPTIONS, ...extraRoles];
  const currentDisplayRole = simulatedRole || 'Quản trị';
  const roleStaffList = pendingRole
    ? staffList.filter((staff) => isSameRoleGroup(staff.role, pendingRole))
    : [];
  const filteredStaffList = roleStaffList.filter((staff) => {
    const query = normalizeSearchText(staffSearch);
    if (!query) return true;
    return normalizeSearchText(`${staff.name} ${staff.email} ${staff.role}`).includes(query);
  });

  const renderStaffStep = () => {
    const selectedEmail = simulatedUser?.email;

    return (
      <>
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-xs font-black text-slate-700 truncate">{pendingRole}</p>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={staffSearch}
              onChange={(event) => setStaffSearch(event.target.value)}
              placeholder="Tìm nhân viên..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
          {staffLoading && (
            <div className="px-4 py-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải nhân viên
            </div>
          )}

          {!staffLoading && staffError && (
            <div className="px-4 py-6 text-xs font-semibold text-rose-600">{staffError}</div>
          )}

          {!staffLoading && !staffError && filteredStaffList.length === 0 && (
            <div className="px-4 py-6 text-xs font-semibold text-slate-500">
              Không có nhân viên thuộc vai trò này.
            </div>
          )}

          {!staffLoading && !staffError && filteredStaffList.map((staff) => {
            const isSelected = selectedEmail === staff.email;
            return (
              <button
                key={staff.email}
                onClick={() => handleStaffSelect(staff)}
                className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {staff.picture ? (
                  <img src={staff.picture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <UserRound className="w-4 h-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black truncate">{staff.name || staff.email}</span>
                  <span className="block text-[11px] font-semibold text-slate-400 truncate">{staff.email}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderRoleStep = () => (
    <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
      {roleOptions.map((role) => {
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
  );

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
                  <span className="max-w-[150px] md:max-w-[220px] truncate">Xem: {simulatedUser?.name || simulatedRole}</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quyền: Quản trị</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl py-2 overflow-hidden flex flex-col max-h-[420px]"
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-2">
                      {selectionStep === 'staff' && (
                        <button
                          onClick={() => setSelectionStep('role')}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Quay lại chọn vai trò"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 truncate">
                        <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                        {selectionStep === 'staff' ? 'Bước 2: Chọn nhân viên' : 'Giả lập vai trò'}
                      </span>
                    </div>
                    {simulatedRole && (
                      <button
                        onClick={handleRestoreAdmin}
                        className="ml-3 text-[10px] font-black text-rose-500 hover:underline shrink-0"
                      >
                        Khôi phục
                      </button>
                    )}
                  </div>
                  {selectionStep === 'staff' ? renderStaffStep() : renderRoleStep()}
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
