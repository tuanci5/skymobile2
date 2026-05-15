import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  MessageSquare,
  PieChart,
  Settings,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  UserCog,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DEPARTMENTS } from '../data/modelData';
import type { TabType } from '../types';
import { TAB_TO_PATH } from '../routing/navigation';
import { isAdminRole, isHrRole, isManagerRole } from '../auth/roleUtils';

type SidebarProps = {
  activeTab: TabType;
  activeDept: string | null;
  hrSubTab?: string;
  onLogout: () => void;
  user: any;
  allowedTabs: string[];
  isSystemAdmin: boolean;
};

export const Sidebar = ({
  activeTab,
  activeDept,
  hrSubTab,
  onLogout,
  user,
  allowedTabs,
  isSystemAdmin,
}: SidebarProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const baseMenuItems = [
    { id: 'model', label: 'Mô hình Vận hành', icon: <Users className="w-5 h-5" /> },
    { id: 'hr', label: 'Nhân sự & JD', icon: <UserCog className="w-5 h-5" /> },
    { id: 'training', label: 'Đào tạo & Văn hóa', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'business', label: 'Kế hoạch kinh doanh', icon: <TrendingUp className="w-5 h-5" />, adminOnly: true },
    { id: 'tasks', label: 'Quản lý công việc', icon: <CheckCircle2 className="w-5 h-5" /> },
    { id: 'messenger', label: 'CSKH Messenger', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'revenue', label: 'Báo cáo doanh thu', icon: <PieChart className="w-5 h-5" /> },
    { id: 'users', label: 'Quản lý người dùng', icon: <UserCog className="w-5 h-5" />, adminOnly: true },
    { id: 'accounts', label: 'Quản lý Tài khoản', icon: <ShieldAlert className="w-5 h-5" />, adminOnly: true },
    { id: 'products', label: 'Sản phẩm & Dịch vụ', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: <Settings className="w-5 h-5" />, adminOnly: true },
  ];

  const deptLinks = DEPARTMENTS.map(dept => ({
    id: dept.id,
    label: `P. ${dept.title.replace('Phòng ', '')}`,
    icon: dept.icon,
    indent: true,
    small: true,
  })).filter(link => {
    if (isAdminRole(user.role)) return true;
    if (user.role === 'Trưởng nhóm Marketing' && link.id === 'sales-mkt') return true;
    if (user.role === 'Trưởng nhóm CSKH' && link.id === 'sales-mkt') return true;
    if (user.role === 'Trưởng nhóm Sale' && link.id === 'sales-mkt') return true;
    return false;
  });

  const isAdmin = isAdminRole(user?.role);
  const isHR = isHrRole(user?.role);
  const isManager = isManagerRole(user?.role);

  const hrLinks = [
    { id: 'hr-jd', label: 'Mô tả công việc', icon: <FileText className="w-5 h-5" />, indent: true, small: true },
    { id: 'hr-plan', label: 'Kế hoạch tuyển dụng', icon: <ClipboardList className="w-5 h-5" />, indent: true, small: true, visible: isAdmin || isHR || isManager },
    { id: 'hr-interview', label: 'Danh sách PV', icon: <Users className="w-5 h-5" />, indent: true, small: true, visible: isAdmin || isHR || isManager },
  ];

  const handleNavigate = (item: any) => {
    const hasSubItems = (item.id === 'model' && deptLinks.length > 0) || (item.id === 'hr' && hrLinks.some(l => l.visible !== false));

    const DEPT_IDS = ['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'];
    if (DEPT_IDS.includes(item.id)) {
      navigate(`/model/${item.id}`);
    } else if (item.id === 'hr-jd') {
      navigate('/hr');
    } else if (item.id === 'hr-plan') {
      navigate('/hr/plan');
    } else if (item.id === 'hr-interview') {
      navigate('/hr/interview');
    } else if (item.id === 'model') {
      navigate('/model');
    } else if (item.id === 'hr') {
      navigate('/hr');
    } else {
      navigate(TAB_TO_PATH[item.id as TabType] || `/${item.id}`);
    }

    if (!hasSubItems || window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Wifi className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-slate-800">Telecom Japan</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed inset-y-0 left-0 w-[80%] md:w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Telecom</h2>
              <p className="text-xs text-slate-400">Business Model</p>
            </div>
          </div>

          {user && (
            <div className="mb-6 mx-2 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 overflow-hidden">
                <img src={user.picture} alt="" className="w-9 h-9 rounded-full border border-blue-500/30 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-blue-400 font-medium">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <nav className="space-y-1 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {baseMenuItems.map((item) => {
              if (item.adminOnly && !isSystemAdmin) return null;
              if (!isSystemAdmin && !allowedTabs.includes(item.id)) return null;

              const subItems = item.id === 'model' ? deptLinks : (item.id === 'hr' ? hrLinks.filter(l => l.visible !== false) : []);
              const hasSubItems = subItems.length > 0;
              const isExpanded = expanded[item.id];
              const isActive = activeTab === item.id && (item.id !== 'hr' || !hrSubTab);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                      } else {
                        handleNavigate(item);
                      }
                    }}
                    className={`w-full flex items-center justify-between pl-4 pr-2 py-2.5 rounded-xl transition-all duration-200 text-left group ${isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {React.cloneElement(item.icon as React.ReactElement, {
                        className: 'w-5 h-5 shrink-0'
                      })}
                      <span className="font-bold text-sm truncate">{item.label}</span>
                    </div>
                    {hasSubItems && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      </motion.div>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {hasSubItems && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-1"
                      >
                        {subItems.map(subItem => {
                          const DEPT_IDS = ['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'];
                          const HR_IDS = ['hr-jd', 'hr-plan', 'hr-interview'];
                          let isSubActive = false;

                          if (DEPT_IDS.includes(subItem.id)) {
                            isSubActive = activeDept === subItem.id;
                          } else if (HR_IDS.includes(subItem.id)) {
                            if (subItem.id === 'hr-jd') isSubActive = activeTab === 'hr' && hrSubTab !== 'interview' && hrSubTab !== 'plan';
                            if (subItem.id === 'hr-plan') isSubActive = activeTab === 'hr' && hrSubTab === 'plan';
                            if (subItem.id === 'hr-interview') isSubActive = activeTab === 'hr' && hrSubTab === 'interview';
                          }

                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleNavigate(subItem)}
                              className={`w-full flex items-center gap-3 pl-11 pr-4 py-2 rounded-xl transition-all duration-200 text-left text-[13px] ${isSubActive
                                ? 'text-blue-400 font-bold bg-blue-500/5'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                              {React.cloneElement(subItem.icon as React.ReactElement, {
                                className: 'w-4 h-4 shrink-0'
                              })}
                              <span className="truncate">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>
      </motion.aside>
    </>
  );
};
