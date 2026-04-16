/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Target,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Zap,
  Search,
  Megaphone,
  ChevronDown,
  Info,
  HeartHandshake,
  Wifi,
  ShoppingCart,
  RefreshCcw,
  Clock,
  Smartphone,
  Headphones,
  LayoutDashboard,
  UserCog,
  Wallet,
  Menu,
  X,
  FileText,
  Briefcase,
  Award,
  DollarSign,
  PieChart,
  AlertCircle,
  Cpu,
  GraduationCap,
  BookOpen,
  Star,
  Sparkles,
  Calendar,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobDescription, Role, ProcessStep } from './types';
import { JD_DATA, ROLES } from './data/hrData';
import { PROCESS_STEPS, DEPARTMENTS } from './data/modelData';
import { TRAINING_GROUPS, CULTURE_PILLARS, CORE_VALUES } from './data/trainingData';
import { ACTION_PLAN_4_MONTHS } from './data/actionPlanData';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './components/LoginPage';
import { InterviewTab } from './components/InterviewTab';

const GOOGLE_CLIENT_ID = '637002508826-b7jmlrenhbagrh6rjp4m4uq8n210fq9a.apps.googleusercontent.com';

// --- Types ---

type TabType = 'model' | 'hr' | 'salary' | 'cost' | 'training' | 'business' | 'action-plan';

// --- Components ---

const Header = () => (
  <header className="mb-12 text-center">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Wifi className="w-6 h-6 text-blue-600" />
        <span className="px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-100 rounded-full">
          Dịch vụ Viễn thông tại Nhật
        </span>
      </div>
      <h1 id="main-title" className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Phòng Kinh doanh – Marketing – CSKH
      </h1>
      <p className="max-w-3xl mx-auto mt-4 text-lg text-slate-600">
        Mô hình quản trị vòng đời khách hàng chuyên biệt cho <span className="font-bold text-blue-600">SIM Data & Pocket WiFi</span>.
        Tối ưu hóa từ lúc tìm khách đến khi gia hạn và giới thiệu.
      </p>
    </motion.div>
  </header>
);

const OrgChart = ({ activeRole, setActiveRole }: { activeRole: string, setActiveRole: (id: string) => void }) => (
  <section className="relative py-12 mb-16 overflow-hidden bg-white border rounded-3xl border-slate-200 shadow-sm">
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', size: '20px 20px' }} />

    <div className="relative z-10 flex flex-col items-center">
      {/* Head of Dept */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setActiveRole('head')}
        className={`relative p-6 text-white rounded-2xl shadow-xl transition-all duration-300 ${activeRole === 'head' ? 'ring-4 ring-blue-200' : ''} ${ROLES[0].color}`}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8" />
          <div className="text-left">
            <p className="text-xs font-medium opacity-80">Quản trị Doanh thu & Vòng đời</p>
            <h3 className="text-lg font-bold">Trưởng phòng Kinh doanh – Marketing – CSKH</h3>
          </div>
        </div>
      </motion.button>

      {/* Vertical Line */}
      <div className="w-px h-12 bg-slate-200" />

      {/* Horizontal Connector */}
      <div className="relative w-full max-w-5xl px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] h-px bg-slate-200" />

        <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3">
          {ROLES.slice(1).map((role, idx) => (
            <div key={role.id} className="relative flex flex-col items-center">
              {/* Vertical Connector to Horizontal Line */}
              <div className="absolute top-[-48px] w-px h-12 bg-slate-200" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveRole(role.id)}
                className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${activeRole === role.id
                    ? `border-transparent text-white shadow-lg ${role.color}`
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${activeRole === role.id ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    {React.cloneElement(role.icon as React.ReactElement, {
                      className: `w-5 h-5 ${activeRole === role.id ? 'text-white' : 'text-slate-600'}`
                    })}
                  </div>
                  <h4 className="font-bold leading-tight">{role.title}</h4>
                </div>
                <p className={`text-xs line-clamp-2 ${activeRole === role.id ? 'text-white/80' : 'text-slate-500'}`}>
                  {role.description}
                </p>
              </motion.button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const RoleDetailPanel = ({ role }: { role: Role }) => (
  <motion.div
    key={role.id}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-16"
  >
    <div className="p-8 bg-white border rounded-3xl border-slate-200 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 text-white rounded-xl ${role.color}`}>
          {role.icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{role.title}</h3>
          <p className="text-slate-500">{role.description}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="flex items-center gap-2 mb-3 font-semibold text-slate-800">
            <Zap className="w-4 h-4 text-amber-500" />
            Nhiệm vụ trọng tâm
          </h4>
          <ul className="space-y-2">
            {role.tasks.map((task, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-600">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>

        {role.focusArea && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
              <Target className="w-4 h-4 text-blue-500" />
              Trọng tâm:
            </h4>
            <p className="text-slate-600 text-sm italic">{role.focusArea}</p>
          </div>
        )}
      </div>
    </div>

    <div className="p-8 bg-slate-900 rounded-3xl shadow-xl text-white">
      <h4 className="flex items-center gap-2 mb-6 text-lg font-bold">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        Chỉ số đo lường (KPIs)
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {role.kpis.map((kpi, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-slate-400">{kpi.label}</p>
            <p className="text-xl font-bold text-blue-400">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <p className="font-bold text-blue-100 mb-1">Tư duy ngành Viễn thông</p>
            <p className="text-sm text-blue-200/80 italic">
              "Bán SIM/WiFi không chỉ là bán sản phẩm, mà là bán giải pháp kết nối và sự hỗ trợ kịp thời cho người xa xứ."
            </p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const WhySection = () => (
  <section className="py-16">
    <div className="flex flex-col items-center mb-12 text-center">
      <h2 className="text-3xl font-bold text-slate-900">Tại sao mô hình này phù hợp?</h2>
      <p className="mt-2 text-slate-600">Đặc thù kinh doanh SIM/WiFi tại Nhật đòi hỏi sự liên kết chặt chẽ.</p>
    </div>

    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {[
        {
          title: 'Sản phẩm cần tư vấn sâu',
          desc: 'Khách không chỉ mua giá, họ mua sự phù hợp (SIM vs WiFi, gói tháng vs năm).',
          icon: <Headphones className="w-6 h-6" />,
          color: 'bg-emerald-100 text-emerald-600'
        },
        {
          title: 'Khách hàng cần phản hồi nhanh',
          desc: 'Người mới sang Nhật cần internet ngay để liên lạc, tra cứu. Chậm 5 phút là mất khách.',
          icon: <Clock className="w-6 h-6" />,
          color: 'bg-blue-100 text-blue-600'
        },
        {
          title: 'Hỗ trợ liên tục sau bán',
          desc: 'Cài đặt APN, lỗi mạng, gia hạn hàng tháng là mắt xích giữ chân khách lâu dài.',
          icon: <RefreshCcw className="w-6 h-6" />,
          color: 'bg-rose-100 text-rose-600'
        }
      ].map((item, i) => (
        <div key={i} className="p-8 bg-white border rounded-3xl border-slate-200 shadow-sm">
          <div className={`p-3 rounded-2xl w-fit mb-6 ${item.color}`}>
            {item.icon}
          </div>
          <h3 className="text-xl font-bold mb-3">{item.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const ProcessSection = () => (
  <section className="py-16">
    <div className="flex flex-col items-center mb-12 text-center">
      <h2 className="text-3xl font-bold text-slate-900">Quy trình vận hành chuẩn</h2>
      <p className="mt-2 text-slate-600">Chuỗi giá trị: Tạo khách – Chốt khách – Giữ khách – Tăng doanh thu.</p>
    </div>

    <div className="relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 hidden lg:block" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {PROCESS_STEPS.map((step, idx) => (
          <motion.div
            key={step.id}
            whileHover={{ y: -5 }}
            className="relative z-10 p-6 bg-white border rounded-2xl border-slate-200 shadow-sm text-center group"
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 text-blue-600 bg-blue-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              {step.icon}
            </div>
            <div className="absolute top-4 right-4 text-xs font-bold text-slate-200">0{step.id}</div>
            <h4 className="mb-2 font-bold text-slate-900">{step.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>

            {idx < PROCESS_STEPS.length - 1 && (
              <div className="flex justify-center mt-4 lg:hidden">
                <ChevronDown className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const ValueSection = () => (
  <section className="grid grid-cols-1 gap-8 py-16 lg:grid-cols-2">
    <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
      <h3 className="flex items-center gap-2 mb-6 text-xl font-bold text-emerald-900">
        <TrendingUp className="w-6 h-6" />
        Ưu điểm cho Doanh nghiệp
      </h3>
      <ul className="space-y-4">
        {[
          { title: 'Đồng bộ toàn bộ quá trình', desc: 'Giảm đứt gãy thông tin từ lúc khách thấy Ads đến khi dùng mạng.' },
          { title: 'Tăng tỷ lệ chốt đơn', desc: 'Khách được tư vấn theo nhu cầu thực tế thay vì chỉ nhận bảng giá.' },
          { title: 'Tăng tỷ lệ gia hạn', desc: 'CSKH theo sát giúp duy trì khách cũ và tạo doanh thu dài hạn ổn định.' },
          { title: 'Lan truyền qua giới thiệu', desc: 'Khách hài lòng sẽ giới thiệu cho bạn cùng phòng, đồng nghiệp.' }
        ].map((item, i) => (
          <li key={i} className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">{item.title}</p>
              <p className="text-sm text-emerald-700">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
      <h3 className="flex items-center gap-2 mb-6 text-xl font-bold text-blue-900">
        <Target className="w-6 h-6" />
        Mục tiêu vận hành cốt lõi
      </h3>
      <ul className="space-y-4">
        {[
          { title: 'Phản hồi siêu tốc', desc: 'Thiết lập ca trực chat/inbox để không bỏ sót khách hàng cần gấp.' },
          { title: 'Kịch bản tư vấn chuẩn', desc: 'Mẫu hỏi nhu cầu và tư vấn theo từng trường hợp (Mới sang, ở KTX...).' },
          { title: 'Bảng giá & Ưu đãi rõ ràng', desc: 'Tránh gây nhầm lẫn về điều kiện áp dụng hoặc thời gian tặng cước.' },
          { title: 'Hệ thống theo dõi khách', desc: 'Lưu trữ lịch sử gia hạn và chăm sóc để tái khai thác hiệu quả.' }
        ].map((item, i) => (
          <li key={i} className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </div>
            <div>
              <p className="font-bold text-blue-900">{item.title}</p>
              <p className="text-sm text-blue-700">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

// --- Main App ---

const TAB_TO_PATH: Record<TabType, string> = {
  model: '/model',
  hr: '/hr',
  salary: '/salary',
  cost: '/cost',
  training: '/training',
  business: '/business',
  'action-plan': '/action-plan',
};

const Sidebar = ({
  activeTab,
  activeDept,
  hrSubTab,
  onLogout,
  user,
}: {
  activeTab: TabType;
  activeDept: string | null;
  hrSubTab?: string;
  onLogout: () => void;
  user: any;
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const baseMenuItems = [
    { id: 'model', label: 'Mô hình Vận hành', icon: <Users className="w-5 h-5" /> },
    { id: 'hr', label: 'Nhân sự & JD', icon: <UserCog className="w-5 h-5" /> },
    { id: 'salary', label: 'Lương & KPI', icon: <Wallet className="w-5 h-5" /> },
    { id: 'cost', label: 'Cơ cấu chi phí', icon: <PieChart className="w-5 h-5" />, adminOnly: true },
    { id: 'training', label: 'Đào tạo & Văn hóa', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'business', label: 'Kế hoạch kinh doanh', icon: <TrendingUp className="w-5 h-5" />, adminOnly: true },
    { id: 'action-plan', label: 'Kế hoạch 4 tháng', icon: <Calendar className="w-5 h-5" />, adminOnly: true },
  ];

  const deptLinks = DEPARTMENTS.map(dept => ({
    id: dept.id,
    label: `P. ${dept.title.replace('Phòng ', '')}`,
    icon: dept.icon,
    indent: true,
    small: true,
  })).filter(link => {
    if (user.role === 'Quản trị') return true;
    if (user.role === 'Trưởng nhóm Marketing' && link.id === 'sales-mkt') return true;
    if (user.role === 'Trưởng nhóm Sale' && link.id === 'sales-mkt') return true;
    if (user.role === 'Trưởng nhóm CSKH' && link.id === 'sales-mkt') return true;
    return false;
  });

  const isAdmin = user?.role === 'Quản trị';
  const isHR = user?.role?.includes('Hành chính - Nhân sự');
  const isManager = user?.role?.includes('Trưởng phòng') || user?.role?.includes('Trưởng nhóm');

  const hrLinks = [
    { id: 'hr-jd', label: 'Mô tả công việc', icon: <FileText className="w-5 h-5" />, indent: true, small: true },
    { id: 'hr-interview', label: 'Danh sách PV', icon: <Users className="w-5 h-5" />, indent: true, small: true, visible: isAdmin || isHR || isManager },
  ];

  const filteredMenuItems: any[] = [];
  baseMenuItems.forEach(item => {
    if (item.adminOnly && user.role !== 'Quản trị') return;
    filteredMenuItems.push(item);
    if (item.id === 'model') filteredMenuItems.push(...deptLinks);
    if (item.id === 'hr') filteredMenuItems.push(...hrLinks.filter(l => l.visible !== false));
  });

  const handleNavigate = (item: any) => {
    const DEPT_IDS = ['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'];
    if (DEPT_IDS.includes(item.id)) {
      navigate(`/model/${item.id}`);
    } else if (item.id === 'hr-jd') {
      navigate('/hr');
    } else if (item.id === 'hr-interview') {
      navigate('/hr/interview');
    } else if (item.id === 'model') {
      navigate('/model');
    } else {
      navigate(TAB_TO_PATH[item.id as TabType] || `/${item.id}`);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Wifi className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-slate-800">Telecom Japan</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Overlay */}
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

      {/* Sidebar Content */}
      <motion.aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6">
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
            <div className="mb-6 mx-2 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full border border-blue-500/30" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-blue-400 font-medium">{user.role}</p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {filteredMenuItems.map((item) => {
              const DEPT_IDS = ['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'];
              const HR_IDS = ['hr-jd', 'hr-interview'];
              let isActive = false;

              if (DEPT_IDS.includes(item.id)) {
                isActive = activeDept === item.id;
              } else if (HR_IDS.includes(item.id)) {
                if (item.id === 'hr-jd') isActive = activeTab === 'hr' && hrSubTab !== 'interview';
                if (item.id === 'hr-interview') isActive = activeTab === 'hr' && hrSubTab === 'interview';
              } else if (item.id === 'model') {
                isActive = activeTab === 'model' && !activeDept;
              } else if (item.id === 'hr') {
                isActive = activeTab === 'hr' && !hrSubTab; // Only active if no sub-tab is particularly selected (but in our case, one defaults)
                // If we want the parent to stay active as well, we could do `activeTab === 'hr'`. Let's just highlight the parent if NO child is active.
                // Wait, default is 'jd', so parent is never active except if we want it to be. Let's make parent not active.
                isActive = false;
              } else {
                isActive = activeTab === item.id;
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left ${item.indent ? 'pl-9' : ''} ${item.small ? 'text-[13px]' : 'text-sm'} ${isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: item.small ? 'w-4 h-4 shrink-0' : 'w-5 h-5 shrink-0'
                  })}
                  <span className="font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/20"
            >
              <X className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">Đăng xuất</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const HRTab = ({ selectedRole, setSelectedRole, setActiveTab, restricted, hrSubTab, user }: { selectedRole: string, setSelectedRole: (role: string) => void, setActiveTab: (tab: TabType) => void, restricted?: boolean, hrSubTab?: string, user: any }) => {
  const navigate = useNavigate();
  const currentSubTab = hrSubTab === 'interview' ? 'interview' : 'jd';

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Interview sub-tab ── */}
      {currentSubTab === 'interview' && (
        <motion.div
          key="interview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <InterviewTab
            sheetCsvUrl={import.meta.env.VITE_SHEET_CSV_URL}
            appsScriptUrl={import.meta.env.VITE_APPS_SCRIPT_URL}
            resultSheetCsvUrl={import.meta.env.VITE_RESULT_SHEET_CSV_URL}
            user={user}
          />
        </motion.div>
      )}

      {/* ── JD sub-tab ── */}
      {currentSubTab === 'jd' && (
        <motion.div
          key="jd"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <header className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Mô tả công việc (JD)</h2>
            <p className="text-slate-600 mt-2">Chi tiết nhiệm vụ, quyền hạn và KPI cho từng vị trí trong phòng ban.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* JD List */}
            {!restricted && (
              <div className="lg:col-span-1 space-y-2">
                {Object.entries(JD_DATA).map(([id, jd]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedRole(id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedRole === id
                        ? 'bg-white border-2 border-blue-600 shadow-sm text-blue-700 font-bold'
                        : 'bg-transparent border-2 border-transparent text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <div className="text-sm">{jd.title}</div>
                  </button>
                ))}
              </div>
            )}

            {/* JD Detail */}
            <div className={restricted ? "lg:col-span-4" : "lg:col-span-3"}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
                >
                  {!JD_DATA[selectedRole] ? (
                    <div className="py-20 text-center text-slate-400">
                      <div className="p-4 bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <UserCog className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Đang tải dữ liệu...</h3>
                      <p className="text-sm">Thông tin vị trí ({selectedRole}) đang được cập nhật hoặc không tồn tại.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                          <Briefcase className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900">{JD_DATA[selectedRole].title}</h3>
                          <p className="text-slate-500 italic">Mục tiêu: {JD_DATA[selectedRole].objective}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('salary')}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Xem Lương & KPI
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <section>
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                              <FileText className="w-5 h-5 text-blue-500" />
                              Nhiệm vụ chính
                            </h4>
                            <ul className="space-y-3">
                              {JD_DATA[selectedRole].tasks.map((task, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </section>

                          {JD_DATA[selectedRole].powers && (
                            <section>
                              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Quyền hạn
                              </h4>
                              <ul className="space-y-3">
                                {JD_DATA[selectedRole].powers?.map((power, i) => (
                                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                                    <span>{power}</span>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                        </div>

                        <div className="space-y-6">
                          <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                              <Award className="w-5 h-5 text-indigo-500" />
                              Chỉ số đánh giá (KPI)
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {JD_DATA[selectedRole].kpis.map((kpi, i) => (
                                <div key={i} className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700">
                                  {kpi}
                                </div>
                              ))}
                            </div>
                          </section>

                          <div className="p-6 bg-blue-600 rounded-2xl text-white">
                            <h4 className="font-bold mb-2">Yêu cầu chung</h4>
                            <p className="text-sm text-blue-100 leading-relaxed">
                              Nắm chắc sản phẩm, phản hồi nhanh, giao tiếp khéo léo và luôn đặt lợi ích kết nối của khách hàng lên hàng đầu.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Staffing Scale Section */}
          <section className="mt-16 p-8 bg-blue-50 border border-blue-100 rounded-3xl">
            <h3 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gợi ý cơ cấu nhân sự theo quy mô
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Quy mô nhỏ',
                  staff: ['1 Trưởng phòng', '1 Marketing Ads/Content', '1–2 Sale/Chat tư vấn', '1 CSKH kiêm xử lý đơn']
                },
                {
                  title: 'Quy mô vừa',
                  staff: ['1 Trưởng phòng', '1 Trưởng nhóm Marketing (1 Ads, 1 Content)', '2–4 Sale/Chat tư vấn', '1 Trưởng nhóm CSKH (1–2 NV)', '1 Xử lý đơn/CRM']
                },
                {
                  title: 'Quy mô lớn',
                  staff: ['1 Trưởng phòng', '1 Trưởng nhóm MKT (2-3 NV)', '1 Trưởng nhóm Sale (4-8 NV)', '1 Trưởng nhóm CSKH (2-4 NV)', '1 CRM + 1-2 Vận hành đơn']
                }
              ].map((scale, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-4 pb-2 border-b border-blue-50">{scale.title}</h4>
                  <ul className="space-y-2">
                    {scale.staff.map((s, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
};

const SalaryTab = ({ selectedRole, setSelectedRole, setActiveTab, restricted }: { selectedRole: string, setSelectedRole: (role: string) => void, setActiveTab: (tab: TabType) => void, restricted?: boolean }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900">Cơ chế Lương & Thưởng</h2>
        <p className="text-slate-600 mt-2">Hệ thống đãi ngộ dựa trên hiệu suất và giá trị đóng góp dài hạn.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Role Selector */}
        {!restricted && (
          <div className="lg:col-span-1 space-y-2">
            {Object.entries(JD_DATA).map(([id, jd]) => (
              <button
                key={id}
                onClick={() => setSelectedRole(id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedRole === id
                    ? 'bg-white border-2 border-blue-600 shadow-sm text-blue-700 font-bold'
                    : 'bg-transparent border-2 border-transparent text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {jd.title}
              </button>
            ))}
          </div>
        )}

        {/* Salary Details */}
        <div className={restricted ? "lg:col-span-4" : "lg:col-span-3"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
            >
              {!JD_DATA[selectedRole] ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="p-4 bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Đang tải dữ liệu...</h3>
                  <p className="text-sm">Thông tin cơ chế (vị trí: {selectedRole}) đang được cập nhật hoặc không tồn tại.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                      <DollarSign className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900">{JD_DATA[selectedRole].title}</h3>
                      <p className="text-slate-500 italic">Cơ chế đãi ngộ</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('hr')}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      <Briefcase className="w-4 h-4" />
                      Xem lại JD
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-6">
                          <DollarSign className="w-5 h-5 text-emerald-500" />
                          Cơ cấu Thu nhập
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200">
                            <span className="text-sm text-slate-500">Mức lương (Khoảng)</span>
                            <span className="font-bold text-slate-900">{JD_DATA[selectedRole].salaryRange}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200">
                            <span className="text-sm text-slate-500">Lương cứng (Base)</span>
                            <span className="font-bold text-emerald-600">{JD_DATA[selectedRole].baseSalary}</span>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <span className="text-xs text-blue-600 font-bold uppercase block mb-2">Cách thức tính</span>
                            <p className="text-sm text-blue-900 font-medium leading-relaxed">
                              {JD_DATA[selectedRole].salaryCalculation}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 h-full">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-6">
                          <TrendingUp className="w-5 h-5 text-indigo-500" />
                          Trọng số KPI thưởng
                        </h4>
                        <div className="space-y-6">
                          {/* Progressive weights based on role */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-slate-700">Chuyên môn / Hiệu suất</span>
                              <span className="text-blue-600 font-bold">40%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 w-[40%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-slate-700">Sale (Doanh thu mới)</span>
                              <span className="text-emerald-600 font-bold">40%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600 w-[40%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-slate-700">CSKH (Tỷ lệ gia hạn)</span>
                              <span className="text-rose-600 font-bold">20%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-600 w-[20%]" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-4 italic">
                            * Trọng số có thể điều chỉnh theo chiến lược từng tháng (Ưu tiên tìm khách mới hay giữ khách cũ).
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-400" />
            Công thức tính thu nhập
          </h3>
          <div className="space-y-6">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-blue-400 font-mono text-sm mb-2">THU NHẬP TỔNG =</p>
              <p className="text-lg font-bold">Lương cứng + (Doanh số mới × %HH) + (Doanh số gia hạn × %Thưởng) + Thưởng KPI</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <span className="text-slate-400">Đạt 80% KPI</span>
                <span className="font-bold">Nhận 100% Lương cứng</span>
              </div>
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <span className="text-slate-400">Đạt 100% KPI</span>
                <span className="font-bold text-emerald-400">+ Thưởng 2M - 5M</span>
              </div>
              <div className="flex justify-between items-center p-4">
                <span className="text-slate-400">Vượt 120% KPI</span>
                <span className="font-bold text-amber-400">Thưởng nóng + Vinh danh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Trọng số KPI theo bộ phận
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">Marketing (Lead & Cost)</span>
                <span className="text-blue-600 font-bold">40%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[40%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">Sale (Doanh thu mới)</span>
                <span className="text-emerald-600 font-bold">40%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-[40%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-slate-700">CSKH (Tỷ lệ gia hạn)</span>
                <span className="text-rose-600 font-bold">20%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600 w-[20%]" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 italic">
              * Trọng số có thể điều chỉnh theo chiến lược từng tháng (Ưu tiên tìm khách mới hay giữ khách cũ).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CostTab = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-600" />
            Cơ cấu Chi phí & Biên Lợi nhuận
          </h2>
          <p className="text-slate-600 mt-2">Đề xuất mô hình tài chính phân loại theo nhóm sản phẩm cốt lõi.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* A. Nhóm SIM Data bán đứt 1 năm */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">A. Nhóm SIM Data bán đứt 1 năm</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6 italic">Ví dụ: 5GB giá vốn ~65%, 10GB giá vốn ~71%</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold"><span className="text-slate-600">Hạng mục</span><span className="text-slate-900">Tỷ lệ</span></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-xl"><span>Giá vốn trực tiếp</span><span className="font-bold">65% – 72%</span></div>
                <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-700 rounded-xl"><span>Marketing</span><span className="font-bold">4% – 6%</span></div>
                <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-xl"><span>Phòng KD-Marketing-CSKH</span><span className="font-bold">6% – 8%</span></div>
                <div className="flex items-center justify-between p-3 bg-slate-50 text-slate-700 rounded-xl"><span>Cố định & Rủi ro</span><span className="font-bold">4% – 6%</span></div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center p-8 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5"><ShoppingCart className="w-48 h-48" /></div>
              <TrendingUp className="w-12 h-12 text-emerald-500 mb-4 z-10" />
              <div className="text-center z-10">
                <span className="block text-sm text-emerald-800 font-bold mb-1">LỢI NHUẬN RÒNG LẦN MUA</span>
                <span className="text-4xl font-black text-emerald-600">8% - 15%</span>
              </div>
              <p className="text-xs text-emerald-600/80 mt-4 text-center z-10">Thu tiền ngay 1 lần, biên lợi nhuận nằm gọn ở giao dịch đầu.</p>
            </div>
          </div>
        </div>

        {/* B. Nhóm SIM Data thu cước hàng tháng */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">B. Nhóm SIM Data Thu cước hàng tháng</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6 italic">Ví dụ: Softbank 30GB giá vốn ~76%, Rakuten 100GB giá vốn ~80%</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold"><span className="text-slate-600">Hạng mục</span><span className="text-slate-900">Tỷ lệ</span></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-xl"><span>Giá vốn trực tiếp</span><span className="font-bold">74% – 80%</span></div>
                <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-700 rounded-xl"><span>Marketing</span><span className="font-bold">3% – 5%</span></div>
                <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-xl"><span>Phòng KD-Marketing-CSKH</span><span className="font-bold">6% – 8%</span></div>
                <div className="flex items-center justify-between p-3 bg-slate-50 text-slate-700 rounded-xl"><span>Cố định & Rủi ro</span><span className="font-bold">4% – 6%</span></div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center p-8 bg-emerald-50 rounded-2xl border border-emerald-100 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]">
              <div className="absolute -right-4 -bottom-4 opacity-5"><RefreshCcw className="w-48 h-48" /></div>
              <div className="text-center z-10">
                <span className="block text-sm text-emerald-800 font-bold mb-1">LỢI NHUẬN RÒNG (MỖI THÁNG)</span>
                <span className="text-4xl font-black text-emerald-600">3% - 8%</span>
              </div>
              <div className="mt-6 p-4 bg-emerald-100/50 rounded-xl border border-emerald-200 z-10 flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-800 font-medium">Lợi nhuận thật sự đến từ: Số tháng duy trì, Phí phạt hủy sớm, Gia hạn vòng đời.</p>
              </div>
            </div>
          </div>
        </div>

        {/* C. Nhóm Data + Voice */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">C. Nhóm Data + Voice</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6 italic">Ví dụ: Docomo/Rakuten Voice thường có biên lợi nhuận cao hơn Data thuần.</p>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold"><span className="text-slate-600">Hạng mục</span><span className="text-slate-900">Tỷ lệ</span></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-xl"><span>Giá vốn trực tiếp</span><span className="font-bold">60% – 70%</span></div>
                <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-700 rounded-xl"><span>Marketing</span><span className="font-bold">4% – 6%</span></div>
                <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-xl"><span>Phòng KD-Marketing-CSKH</span><span className="font-bold">7% – 9%</span></div>
                <div className="flex items-center justify-between p-3 bg-slate-50 text-slate-700 rounded-xl"><span>Cố định & Rủi ro</span><span className="font-bold">4% – 6%</span></div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center p-8 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5"><Smartphone className="w-48 h-48" /></div>
              <TrendingUp className="w-12 h-12 text-emerald-500 mb-4 z-10" />
              <div className="text-center z-10">
                <span className="block text-sm text-emerald-800 font-bold mb-1">LỢI NHUẬN RÒNG</span>
                <span className="text-4xl font-black text-emerald-600">8% - 15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Kết luận cuối cùng */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10"><PieChart className="w-64 h-64 -translate-y-10 translate-x-10" /></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              Kết luận quản trị trọng tâm
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex flex-col items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Mức giá vốn 70% chỉ là trung bình chung</h4>
                  <p className="text-slate-400">Thực tế phải phân mảnh: <span className="text-white">65-72%</span> (bán đứt), <span className="text-white">74-80%</span> (thu cước), <span className="text-white">60-70%</span> (data+voice). Việc gộp chung sẽ làm sai số chiến lược về giá.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex flex-col items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Bản chất dòng thu nhập rất khác biệt</h4>
                  <p className="text-slate-400">
                    <span className="text-white font-medium">Bán đứt:</span> Nhận ngay lợi nhuận ở giao dịch mua mới đầu tiên.<br />
                    <span className="text-white font-medium">Thu cước:</span> Lợi nhuận nằm rải rác ở số tháng duy trì, phí báo hủy, phí làm lại sim.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex flex-col items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Thiết kế KPI phải tách rời</h4>
                  <p className="text-slate-400">Tuyệt đối không dùng 1 cơ cấu KPI chung. Chuyên viên đánh vào nhóm bán đứt thiên về <span className="text-white">tốc độ & số lượng</span>, đánh vào nhóm thu cước phải thiên về <span className="text-white">chăm sóc & tỷ lệ tái gia hạn</span>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainingTab = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-6 shadow-sm">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          Hệ thống Đào tạo & Văn hoá
        </h2>
        <p className="text-slate-600 max-w-2xl text-lg relative">
          Mô hình <span className="font-bold text-slate-800">"Học để làm được – Đo bằng hiệu quả – Thưởng theo giá trị"</span>.
          Bám sát thực chiến từ Marketing, Sale, CSKH đến Kỹ thuật.
        </p>
      </div>

      {/* Section 1: Khung chương trình đào tạo */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h3 className="text-3xl font-bold text-slate-900">Khung chương trình Đào tạo</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_GROUPS.map((group) => (
            <div key={group.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl shadow-sm ${group.lightColor}`}>
                  {group.icon}
                </div>
                <div className="text-5xl font-black text-slate-100/60 drop-shadow-sm">{group.id}</div>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{group.title}</h4>
              <p className="text-slate-500 text-sm mb-6 pb-4 border-b border-slate-100 min-h-[40px]">{group.desc}</p>
              <ul className="space-y-3 flex-1">
                {group.courses.map((course, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm font-medium">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="leading-snug">{course}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Trụ cột Văn hoá */}
      <section className="py-4">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <Star className="w-8 h-8 text-amber-500" />
          <h3 className="text-3xl font-bold text-slate-900">6 Trụ cột Văn hoá Doanh nghiệp</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {CULTURE_PILLARS.map((pillar, i) => (
            <div key={i} className="flex items-start gap-5 p-6 bg-amber-50/60 rounded-3xl border border-amber-100 hover:bg-amber-50 hover:shadow-md hover:border-amber-200 transition-all">
              <div className="w-12 h-12 rounded-full bg-white text-amber-600 flex items-center justify-center font-bold shrink-0 text-xl shadow-sm border border-amber-100">
                {i + 1}
              </div>
              <div className="pt-1">
                <h4 className="font-bold text-slate-900 text-lg mb-2">{pillar.title}</h4>
                <p className="text-slate-600 leading-relaxed text-sm">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Giá trị cốt lõi */}
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden mt-12">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none hidden md:block">
          <Sparkles className="w-96 h-96 -translate-y-20 translate-x-10" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Bộ 5 Giá trị Cốt lõi</h3>
            <p className="text-slate-400 text-lg italic tracking-wide">"Đúng sản phẩm – Đúng quy trình – Đúng trách nhiệm – Đúng kết quả"</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {CORE_VALUES.map((val) => (
              <div key={val.id} className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm text-center hover:bg-white/10 transition-colors shadow-inner col-span-1">
                <div className="text-amber-400 font-black text-2xl mb-3 drop-shadow-md">{val.title}</div>
                <p className="text-slate-300 text-sm leading-snug">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const ActionPlanView = () => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {ACTION_PLAN_4_MONTHS.map((plan, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col h-full"
          >
            {/* Month Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300">
              <div className={`p-6 text-white relative overflow-hidden ${
                idx === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' :
                idx === 1 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
                idx === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                'bg-gradient-to-br from-indigo-700 to-purple-800'
              }`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                  {idx === 0 ? <Clock className="w-24 h-24" /> : <Rocket className="w-24 h-24" />}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold tracking-widest uppercase opacity-80">{plan.label}</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase">{plan.phase}</span>
                  </div>
                  <h3 className="text-2xl font-black">{plan.month}</h3>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-6">
                <p className="text-slate-500 text-sm italic leading-relaxed">
                  "{plan.description}"
                </p>

                <div className="space-y-6">
                  {Object.entries(plan.actions).map(([key, action], aIdx) => (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${action.color}`}>
                          {React.cloneElement(action.icon as React.ReactElement, { className: 'w-4 h-4' })}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{action.title}</h4>
                      </div>
                      <ul className="space-y-2 ml-1">
                        {action.items.map((item, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2 text-[13px] text-slate-600 leading-tight">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <TrendingUp className="w-64 h-64 translate-x-20 -translate-y-20" />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Thời gian áp dụng</p>
            <p className="text-2xl font-bold">16/04 - 31/07</p>
            <p className="text-slate-400 text-sm">Giai đoạn kiến tạo nền móng</p>
          </div>
          <div className="space-y-2">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Mục tiêu Quy mô</p>
            <p className="text-2xl font-bold">10 Team full-stack</p>
            <p className="text-slate-400 text-sm">50+ nhân sự được đào tạo chuẩn</p>
          </div>
          <div className="space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Sản phẩm trọng tâm</p>
            <p className="text-2xl font-bold">SIM Data & Pocket WiFi</p>
            <p className="text-slate-400 text-sm">Thị trường người Việt tại Nhật</p>
          </div>
          <div className="space-y-2">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-widest">Cam kết văn hóa</p>
            <p className="text-2xl font-bold">Hiệu quả & Tận tâm</p>
            <p className="text-slate-400 text-sm">Đo lường bằng sự hài lòng khách</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Business Plan Tab ───────────────────────────────────────────────────────

const MASTER_PLAN_DATA = {
  months: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  operations: {
    teams:        [1, 2, 4, 6, 8, 10, 10, 10, 10, 10, 10, 10],
    newOrders:    [200, 360, 640, 840, 960, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
    churnOrders:  [0, 0, 0, 0, 0, 0, -200, -360, -640, -840, -960, -1000],
    totalActive:  [0, 200, 560, 1200, 2040, 3000, 3800, 4440, 4800, 4960, 5000, 5000],
  },
  grossRevenueByCohort: [310, 707, 1549, 2449, 3457, 4376, 5058, 5565, 5834, 5954, 5984, 5984],
  netCostsToProvider: [81, 249, 549, 961, 1445, 1959, 2373, 2705, 2891, 2974, 2995, 2995],
  operatingExpenses: {
    marketing:    [199, 358, 636, 835, 955, 994, 994, 994, 994, 994, 994, 994],
    salary:       [58, 116, 232, 348, 464, 580, 580, 580, 580, 580, 580, 580],
    fixed:        [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70],
    simRefill:    [0, 0, 0, 0, 0, 0, 73, 131, 232, 305, 348, 363],
    total:        [327, 544, 938, 1253, 1489, 1644, 1717, 1775, 1877, 1949, 1993, 2007],
  },
  finalNetProfit: [-98, -86, 62, 234, 523, 773, 968, 1085, 1066, 1031, 996, 982],
  finalProfitMargin: ['-31.6%', '-12.1%', '4.0%', '9.6%', '15.1%', '17.7%', '19.1%', '19.5%', '18.3%', '17.3%', '16.6%', '16.4%'],
};

const BRAND_INVESTMENT_DATA = {
  items: [
    { label: '1. Triển khai Website (Domain, Hosting, Dev)', values: [50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], color: 'text-indigo-600' },
    { label: '2. Triển khai Mobile App (iOS/Android)', values: [150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], color: 'text-indigo-600' },
    { label: '3. Đầu tư Cơ sở vật chất (VP, Thiết bị)', values: [300, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], color: 'text-indigo-600' },
    { label: '4. Nhân sự Brand (Content, MKT - 20Tr/tháng)', values: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20], color: 'text-amber-600' },
  ]
};

function fmt(n: number) {
  if (n === 0) return '0';
  if (n < 0) return `(${Math.abs(n).toLocaleString('vi-VN')})`;
  return `+${n.toLocaleString('vi-VN')}`;
}
function fmtPos(n: number) {
  return n.toLocaleString('vi-VN');
}

// Helper handles dynamic financial calculations for any given data set
const calculateFinancials = (d: any) => {
  const opProfitArray = d.months.map((_, i: number) => d.grossRevenueByCohort[i] - d.netCostsToProvider[i] - d.operatingExpenses.total[i]);
  
  let cumOpProfit = 0;
  const kpiBonusArray = opProfitArray.map((p, i) => {
    cumOpProfit += p;
    return cumOpProfit > 0 ? Math.round(d.grossRevenueByCohort[i] * 0.05) : 0;
  });

  const pbtArray = opProfitArray.map((p, i) => p - kpiBonusArray[i]);

  let cumPBT = 0;
  let cumTaxPaid = 0;
  const taxArray = pbtArray.map((pbt) => {
    cumPBT += pbt;
    if (cumPBT > 0) {
      const totalTaxDue = Math.round(cumPBT * 0.2);
      const taxThisMonth = Math.max(0, totalTaxDue - cumTaxPaid);
      cumTaxPaid += taxThisMonth;
      return taxThisMonth;
    }
    return 0;
  });

  const patArray = pbtArray.map((pbt, i) => pbt - taxArray[i]);

  const patMarginArray = patArray.map((pat, i) => {
    const rev = d.grossRevenueByCohort[i];
    return rev > 0 ? ((pat / rev) * 100).toFixed(1) + '%' : '0%';
  });

  return { opProfitArray, kpiBonusArray, pbtArray, taxArray, patArray, patMarginArray };
};

const FinancialMasterTable = ({ title, data: d, results, badge, badgeColor }: { title: string, data: any, results: any, badge?: string, badgeColor?: string }) => {
  const months = d.months;
  const sectionHeaderClass = 'bg-slate-800 text-white text-xs font-bold uppercase tracking-wider';
  const cellClass = 'text-center text-sm font-medium tabular-nums whitespace-nowrap';
  const totalCellClass = 'text-center text-sm font-bold tabular-nums whitespace-nowrap bg-slate-50';
  const { opProfitArray, kpiBonusArray, pbtArray, taxArray, patArray, patMarginArray } = results;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        {badge && (
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-lg ${badgeColor || 'bg-blue-600'}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 bg-slate-50 border-b border-r border-slate-200 w-64 sticky left-0 z-10">Chỉ số quản trị (Triệu VNĐ)</th>
              {months.map((m: string) => (
                <th key={m} className="px-3 py-3 text-center text-xs font-bold text-blue-700 bg-blue-50 border-b border-slate-200 min-w-[72px]">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* I. Vận hành */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                I. Chỉ số vận hành
              </td>
            </tr>
            {[
              { label: '1. Quy mô nhân sự (Số Team)', data: d.operations.teams, suffix: ' team' },
              { label: '2. Số đơn mới chốt', data: d.operations.newOrders },
              { label: '3. Khách rụng (Hết hạn 6 tháng)', data: d.operations.churnOrders, negative: true },
              { label: '4. Tổng khách cũ đang đóng cước', data: d.operations.totalActive, bold: true },
            ].map((row, i) => (
              <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${row.bold ? 'bg-blue-50/40' : ''}`}>
                <td className={`px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px] ${row.bold ? 'font-semibold bg-blue-50/40' : ''}`}>{row.label}</td>
                {row.data.map((v: number, mi: number) => (
                  <td key={mi} className={`${cellClass} py-2.5 px-2 ${v < 0 ? 'text-red-500' : row.bold ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>
                    {v < 0 ? `(${Math.abs(v).toLocaleString()})` : v === 0 ? '—' : fmtPos(v)}{row.suffix || ''}
                  </td>
                ))}
              </tr>
            ))}

            {/* II. Doanh thu */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                II. Tổng doanh thu thu từ khách hàng (Thu tiền) [A]
              </td>
            </tr>
            <tr className="border-b border-slate-100 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
              <td className="px-4 py-2.5 text-indigo-800 font-semibold border-r border-slate-100 sticky left-0 bg-indigo-50/30 text-[13px]">Tổng tiền thực thu</td>
              {d.grossRevenueByCohort.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-indigo-700 font-semibold`}>{fmtPos(v)}</td>
              ))}
            </tr>

            {/* III. Chi phí nét */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                III. Chi phí nét trả nhà mạng (Gốc/COGS) [B]
              </td>
            </tr>
            <tr className="border-b border-slate-100 bg-red-50/20 hover:bg-red-50/40 transition-colors">
              <td className="px-4 py-2.5 text-red-800 font-semibold border-r border-slate-100 sticky left-0 bg-red-50/20 text-[13px]">Tổng phí trả nhà mạng</td>
              {d.netCostsToProvider.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-red-600`}>{v === 0 ? '—' : fmtPos(v)}</td>
              ))}
            </tr>

            {/* IV. Chi phí vận hành */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                IV. Chi phí vận hành & Marketing (Cash Out) [C]
              </td>
            </tr>
            {[
              { label: '1. Ngân sách MKT (Tiền chạy QC)', data: d.operatingExpenses.marketing },
              { label: '2. Lương các Team (58tr/Team)', data: d.operatingExpenses.salary },
              { label: '3. Chi phí Cố định (VP, Kế toán…)', data: d.operatingExpenses.fixed },
              { label: '4. Phí cấp lại SIM (Xoay vòng phôi)', data: d.operatingExpenses.simRefill },
            ].map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">{row.label}</td>
                {row.data.map((v: number, mi: number) => (
                  <td key={mi} className={`${cellClass} py-2.5 px-2 text-red-600`}>{v === 0 ? '—' : fmtPos(v)}</td>
                ))}
              </tr>
            ))}
            <tr className="border-b-2 border-red-200 bg-red-50/40">
              <td className="px-4 py-3 text-red-800 font-bold border-r border-slate-100 sticky left-0 bg-red-50/40 text-[13px]">Tổng chi vận hành [C]</td>
              {d.operatingExpenses.total.map((v: number, mi: number) => (
                <td key={mi} className={`${totalCellClass} py-3 px-2 text-red-700 bg-red-50/40`}>{fmtPos(v)}</td>
              ))}
            </tr>

            {/* V. Hiệu quả */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass} bg-emerald-800`}>
                V. Hiệu quả quản trị dòng tiền cuối cùng
              </td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">1. Lợi nhuận vận hành (A - B - C)</td>
              {opProfitArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 ${v < 0 ? 'text-red-500' : 'text-emerald-700'}`}>{fmt(v)}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">2. Thưởng KPI (5% Doanh thu | Khi lãi lũy kế)</td>
              {kpiBonusArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-rose-600`}>{v === 0 ? '—' : `(${fmtPos(v)})`}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-100 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
              <td className="px-4 py-2.5 text-blue-800 font-semibold border-r border-slate-100 sticky left-0 bg-blue-50/30 text-[13px]">3. Lợi nhuận trước thuế TNDN (Lũy kế bù lỗ)</td>
              {pbtArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 ${v < 0 ? 'text-red-500' : 'text-blue-700'}`}>{fmt(v)}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">4. Thuế TNDN (20% trên lãi lũy kế)</td>
              {taxArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-rose-600`}>{v === 0 ? '—' : `(${fmtPos(v)})`}</td>
              ))}
            </tr>
            <tr className="border-b border-emerald-200 bg-emerald-900 shadow-inner">
              <td className="px-4 py-4 text-white font-bold border-r border-emerald-700 sticky left-0 bg-emerald-900 text-[14px]">LỢI NHUẬN RÒNG SAU THUẾ TNDN</td>
              {patArray.map((v: number, mi: number) => (
                <td key={mi} className="text-center py-4 px-2 text-emerald-400 font-black text-base tabular-nums whitespace-nowrap">
                  {fmt(v)}
                </td>
              ))}
            </tr>
            <tr className="bg-emerald-800/90 h-12">
              <td className="px-4 py-2 text-emerald-100 font-semibold border-r border-emerald-700 sticky left-0 bg-emerald-800/90 text-[13px]">Biên lợi nhuận ròng / Doanh thu</td>
              {patMarginArray.map((v: string, mi: number) => (
                <td key={mi} className="text-center py-2 px-2 text-amber-300 font-bold text-sm whitespace-nowrap">{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const InvestmentTable = ({ data }: { data: typeof BRAND_INVESTMENT_DATA }) => {
  const months = MASTER_PLAN_DATA.months;
  
  const calculateTotal = (values: number[]) => values.reduce((sum, v) => sum + v, 0);
  const grandTotal = data.items.reduce((sum, item) => sum + calculateTotal(item.values), 0);

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-indigo-50 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-300" />
          <div>
            <h3 className="text-xl font-bold text-white">Ngân Sách Đầu Tư Thương Hiệu & Cơ Sở Vật Chất</h3>
            <p className="text-indigo-200 text-xs mt-0.5">Khoản chi đầu tư (CAPEX) — Theo dõi độc lập với kịch bản vận hành</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 backdrop-blur-sm">
          <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Tổng mức đầu tư dự kiến:</span>
          <span className="text-xl font-black text-white">{grandTotal.toLocaleString('vi-VN')} Tr</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-indigo-50/50">
              <th className="text-left px-5 py-4 text-xs font-bold text-indigo-900 border-b border-r border-indigo-100 w-80 sticky left-0 z-10 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Hạng mục đầu tư</th>
              {months.map((m) => (
                <th key={m} className="px-3 py-4 text-center text-xs font-bold text-indigo-700 border-b border-indigo-100 min-w-[72px]">{m}</th>
              ))}
              <th className="px-4 py-4 text-center text-xs font-bold text-white bg-indigo-600 border-b border-indigo-700 min-w-[100px] sticky right-0 z-10">TỔNG CỘNG</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-indigo-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-slate-800 font-semibold border-r border-indigo-50 sticky left-0 bg-white z-10 shadow-[1px_0_3px_rgba(0,0,0,0.02)]">{item.label}</td>
                {item.values.map((v, mi) => (
                  <td key={mi} className={`text-center py-4 px-2 tabular-nums text-sm font-medium ${item.color}`}>
                    {v === 0 ? <span className="text-slate-200">—</span> : v.toLocaleString('vi-VN')}
                  </td>
                ))}
                <td className="text-center py-4 px-2 font-bold bg-indigo-50/50 border-l border-indigo-100 sticky right-0 z-10 backdrop-blur-sm">
                  {calculateTotal(item.values).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
            <tr className="bg-indigo-900 text-white font-bold">
              <td className="px-5 py-4 border-r border-indigo-700 sticky left-0 bg-indigo-900">TỔNG CHI THEO THÁNG</td>
              {months.map((_, mi) => {
                const monthSum = data.items.reduce((sum, item) => sum + item.values[mi], 0);
                return (
                  <td key={mi} className="text-center py-4 px-2 tabular-nums">
                    {monthSum === 0 ? '—' : monthSum.toLocaleString('vi-VN')}
                  </td>
                );
              })}
              <td className="text-center py-4 px-2 font-black text-amber-300 sticky right-0 bg-indigo-950">
                {grandTotal.toLocaleString('vi-VN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const BusinessPlanTab = ({ initialSubTab }: { initialSubTab?: 'finance' | 'action' }) => {
  // Define Scenario 1: Marketing cost is 20% of monthly revenue
  const d1 = JSON.parse(JSON.stringify(MASTER_PLAN_DATA));
  d1.operatingExpenses.marketing = d1.grossRevenueByCohort.map((v: number) => Math.round(v * 0.2));
  d1.operatingExpenses.total = d1.months.map((_: any, i: number) => 
    d1.operatingExpenses.marketing[i] + 
    d1.operatingExpenses.salary[i] + 
    d1.operatingExpenses.fixed[i] + 
    d1.operatingExpenses.simRefill[i]
  );
  const results1 = calculateFinancials(d1);

  // Define Scenario 2: Marketing cost is reduced to flat 10% of monthly revenue
  const SCENARIO_2_DATA = JSON.parse(JSON.stringify(MASTER_PLAN_DATA));
  SCENARIO_2_DATA.operatingExpenses.marketing = SCENARIO_2_DATA.grossRevenueByCohort.map((v: number) => Math.round(v * 0.1));
  SCENARIO_2_DATA.operatingExpenses.total = SCENARIO_2_DATA.months.map((_: any, i: number) => 
    SCENARIO_2_DATA.operatingExpenses.marketing[i] + 
    SCENARIO_2_DATA.operatingExpenses.salary[i] + 
    SCENARIO_2_DATA.operatingExpenses.fixed[i] + 
    SCENARIO_2_DATA.operatingExpenses.simRefill[i]
  );
  
  const results2 = calculateFinancials(SCENARIO_2_DATA);

  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'action'>(initialSubTab || 'finance');

  // Sync state with prop if it changes via URL
  React.useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="max-w-full mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="text-center flex flex-col items-center mb-4">
        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full mb-6 shadow-sm">
          <TrendingUp className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Kế hoạch Kinh doanh</h2>
        <p className="text-slate-600 max-w-3xl text-lg">
          Chiến lược vận hành và Dự báo tài chính <span className="font-bold text-slate-800">Sky Mobile Japan</span>.
        </p>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl mt-8 w-fit">
          <button
            onClick={() => setActiveSubTab('finance')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'finance'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dự báo Tài chính
          </button>
          <button
            onClick={() => setActiveSubTab('action')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'action'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Kế hoạch 4 tháng
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'finance' ? (
          <motion.div
            key="finance"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-16"
          >
            {/* Part 1: Brand Investment Table (CAPEX) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                <h4 className="text-2xl font-bold text-slate-800">Phần 1: Ngân sách đầu tư thương hiệu & Cơ sở vật chất</h4>
              </div>
              <InvestmentTable data={BRAND_INVESTMENT_DATA} />
            </div>

            {/* Comparison Divider */}
            <div className="py-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <div className="px-6 py-2 bg-slate-100 rounded-full text-slate-500 text-sm font-bold uppercase tracking-widest">Phần 2: Kịch bản kinh doanh vận hành (OPEX)</div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Table 1: Original */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                <h4 className="text-2xl font-bold text-slate-800">Phương án 1: Kế hoạch kinh doanh dựa trên phương án chi phí Marketing chiếm 20% doanh thu</h4>
              </div>
              <FinancialMasterTable title="Bảng Dự Toán Phương Án 1" data={d1} results={results1} badge="MKT 20%" badgeColor="bg-blue-600" />
            </div>

            {/* Table 2: Scenario 2 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                <h4 className="text-2xl font-bold text-slate-800">Phương án 2: Tối ưu Marketing (10% Doanh thu)</h4>
              </div>
              <FinancialMasterTable title="Bảng Dự Toán Phương Án 2" data={SCENARIO_2_DATA} results={results2} badge="TỐI ƯU MKT" badgeColor="bg-emerald-600" />
            </div>

            {/* Summary comparison cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
              {[
                { label: 'LN Sau Thuế (PA 1)', value: `~${results1.patArray[11].toLocaleString('vi-VN')} Tr`, sub: 'Giai đoạn ổn định (MKT 20%)', color: 'bg-blue-600', icon: <TrendingUp className="w-6 h-6" /> },
                { label: 'LN Sau Thuế (PA 2)', value: `~${results2.patArray[11].toLocaleString('vi-VN')} Tr`, sub: 'Giai đoạn ổn định (MKT 10%)', color: 'bg-emerald-600', icon: <TrendingUp className="w-6 h-6" /> },
                { label: 'Chênh lệch lợi nhuận', value: `+${(results2.patArray[11] - results1.patArray[11]).toLocaleString('vi-VN')} Tr`, sub: 'Mỗi tháng khi tối ưu MKT', color: 'bg-amber-600', icon: <TrendingUp className="w-6 h-6" /> },
                { label: 'Biên LN PA2 ổn định', value: results2.patMarginArray[11], sub: 'Hiệu suất vận hành tối đa', color: 'bg-indigo-600', icon: <BarChart3 className="w-6 h-6" /> },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`p-3 rounded-xl w-fit mb-4 text-white ${card.color}`}>{card.icon}</div>
                  <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-black text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* 3 management insights */}
            <div className="space-y-6 mt-16">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <Star className="w-7 h-7 text-amber-500" />
                <h3 className="text-2xl font-bold text-slate-900">3 Điểm sáng Quản trị từ Master Plan</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  {
                    num: '01',
                    title: 'Giai đoạn "Thung lũng chết" T1 - T2',
                    color: 'from-blue-600 to-indigo-700',
                    highlight: '-98 triệu VNĐ trong tháng đầu',
                    body: 'Do chi phí Marketing và lương đội ngũ được chi trả ngay từ đầu trong khi doanh thu tích lũy chưa đủ lớn, dòng tiền sẽ âm nhẹ trong 2 tháng đầu. Đây là giai đoạn đầu tư nền móng cực kỳ quan trọng.',
                    tag: 'Đầu tư chiến lược',
                  },
                  {
                    num: '02',
                    title: 'Điểm hòa vốn và Bùng nổ từ Tháng 4',
                    color: 'from-emerald-600 to-teal-700',
                    highlight: 'Bầu trời lợi nhuận sau bù lỗ',
                    body: 'Từ tháng thứ 4, sau khi đã bù xong các khoản lỗ vận hành ban đầu, hệ thống bắt đầu trích thưởng KPI 5% và thực hiện nghĩa vụ thuế 20%, dòng tiền thực nhận vẫn cực kỳ mạnh mẽ.',
                    tag: 'Thu hoạch quả ngọt',
                  },
                  {
                    num: '03',
                    title: 'Cơ chế "Payback" nhanh và biên LN thực',
                    color: 'from-amber-500 to-orange-600',
                    highlight: `Biên LN ròng thực ~${results2.patMarginArray[11]}`,
                    body: 'Nhờ tối ưu hóa phí đầu vào và tập trung vào các dòng sản phẩm có biên lợi nhuận cao, tỷ suất lợi nhuận sau cùng (đã trừ mọi chi phí vận hành, KPI và Thuế) duy trì mức cực kỳ ấn tượng.',
                    tag: 'Mô hình tối ưu',
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                    <div className={`p-6 text-white bg-gradient-to-br ${item.color} relative overflow-hidden`}>
                      <div className="absolute right-4 top-2 font-black text-8xl opacity-10 select-none">{item.num}</div>
                      <div className="relative z-10">
                        <span className="text-xs font-bold tracking-widest opacity-80 uppercase">Điểm sáng {item.num}</span>
                        <h4 className="text-lg font-bold mt-2 leading-snug">{item.title}</h4>
                        <span className="mt-3 inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">{item.highlight}</span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {item.body} <span className="font-bold text-slate-900">{item.tag}</span>.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="action"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <ActionPlanView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assumptions footnote */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Giả định tính toán thực tế (Cập nhật lịch trình dòng tiền)</p>
          <p>• Phí thu khách hàng: Month 1: 9.980 JPY | Month 2-6: 4.980 JPY | Hoa hồng nhà mạng (M3): 6.000 JPY</p>
          <p>• Phí trả nhà mạng: Month 1-6: 3.500 JPY (Dock) | Month 7+: 3.880 JPY</p>
          <p>• Marketing & Vận hành: Mkt 1st Month (6.252 JPY) | Lương 58tr/Team | Định mức LN tính theo chu kỳ 6 tháng.</p>
          <p>• Tất cả số liệu đã làm tròn. Mô hình dựa trên giả định 70% Dock – 30% SIM và tỷ giá 165 VNĐ/JPY.</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ROLE_MAPPING: Record<string, string> = {
  'Quản trị': 'admin',
  'Trưởng nhóm Marketing': 'mkt_lead',
  'Trưởng nhóm Sale': 'sale_lead',
  'Trưởng nhóm CSKH': 'cskh_lead',
  'Nhân viên Quảng cáo': 'mkt_ads',
  'Nhân viên Content': 'mkt_content',
  'Nhân viên Media': 'mkt_media',
  'Nhân viên Sale': 'sale_staff',
  'Nhân viên CSKH': 'cskh_staff',
  'Telesale': 'telesale',
  'Nhân viên Kỹ thuật': 'ops',
  'Quản lý': 'head',
  'Trưởng phòng Kinh doanh – Marketing – CSKH': 'head'
};

function AppContent() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('sky_mobile_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ── Derive all navigation state from URL ────────────────────────────────
  // /model              → model tab, no dept
  // /model/sales-mkt    → model tab, dept = 'sales-mkt'
  // /model/sales-mkt/marketing → model, dept='sales-mkt', team='marketing'
  // /hr                 → hr, sub='jd'
  // /hr/interview       → hr, sub='interview'
  // /salary /cost /training → respective tabs

  const pathParts = pathname.replace(/^\//, '').split('/');
  const rootSeg = pathParts[0] || 'model';
  const subSeg = pathParts[1] || '';
  const teamSeg = pathParts[2] || '';

  const PATH_TO_TAB: Record<string, TabType> = {
    model: 'model', hr: 'hr', salary: 'salary', cost: 'cost', training: 'training',
    business: 'business', 'action-plan': 'action-plan',
  };
  const DEPT_IDS = ['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'];

  const activeTab: TabType = PATH_TO_TAB[rootSeg] ?? 'model';
  const activeDept: string | null = activeTab === 'model' && DEPT_IDS.includes(subSeg) ? subSeg : null;
  const activeTeam: 'marketing' | 'sale' | 'cskh' | null =
    activeDept === 'sales-mkt' && ['marketing', 'sale', 'cskh'].includes(teamSeg)
      ? teamSeg as 'marketing' | 'sale' | 'cskh'
      : null;
  const hrSubTab = activeTab === 'hr' && subSeg === 'interview' ? 'interview' : 'jd';

  const internalRoleId = user?.role ? (ROLE_MAPPING[user.role] || 'guest') : null;
  const isAdmin = internalRoleId === 'admin';
  const [activeRole, setActiveRole] = useState<string>(isAdmin ? 'head' : (internalRoleId || 'head'));

  React.useEffect(() => {
    if (user && !isAdmin) setActiveRole(internalRoleId || 'head');
  }, [user, internalRoleId, isAdmin]);

  // Redirect bare '/' to '/model'
  React.useEffect(() => {
    if (pathname === '/' || pathname === '') navigate('/model', { replace: true });
  }, [pathname]);

  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('sky_mobile_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('sky_mobile_user');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const canAccessSensitive = isAdmin;
  const restrictedView = !isAdmin;

  // Navigate helpers that enforce RBAC
  const goToTab = (tab: TabType) => {
    if (!canAccessSensitive && (tab === 'salary' || tab === 'cost')) {
      alert('Bạn không có quyền truy cập mục này.');
      return;
    }
    navigate(TAB_TO_PATH[tab]);
  };
  const goToDept = (dept: string | null) => {
    navigate(dept ? `/model/${dept}` : '/model');
  };
  const goToTeam = (team: string | null) => {
    if (team) navigate(`/model/sales-mkt/${team}`);
    else navigate('/model/sales-mkt');
  };

  type TeamDetail = {
    title: string;
    objective: string;
    summary: string;
    tasks: string[];
    kpis: string[];
    roles: Array<{ title: string; description: string; items: string[] }>;
  };

  const teamDetails: Record<'marketing' | 'sale' | 'cskh', TeamDetail> = {
    marketing: {
      title: 'Tổ Marketing',
      objective: 'Tổ chức và triển khai hoạt động marketing nhằm thu hút đúng khách hàng mục tiêu là người nước ngoài tại Nhật có nhu cầu SIM Data, Pocket WiFi và dịch vụ viễn thông.',
      summary: 'Xây dựng hệ thống lead chất lượng qua quảng cáo, nội dung và thông điệp phù hợp để hỗ trợ sale chốt đơn nhanh chóng.',
      tasks: [
        'Xây dựng kế hoạch marketing theo tuần/tháng',
        'Triển khai quảng cáo trên Facebook, TikTok, Google, Instagram và nền tảng phù hợp',
        'Định hướng nội dung theo từng nhóm khách hàng',
        'Phối hợp với sale để tối ưu thông điệp và chất lượng lead',
        'Theo dõi số lượng và chất lượng lead từ từng kênh',
        'Sản xuất nội dung bài viết, hình ảnh, video và landing page',
        'Quản lý fanpage, social media và cộng đồng khách hàng',
        'Đề xuất chương trình khuyến mãi, ưu đãi truyền thông',
        'Báo cáo hiệu quả chiến dịch marketing định kỳ',
        'Cập nhật xu hướng và hành vi khách hàng người nước ngoài tại Nhật'
      ],
      kpis: [
        'Số lead/inbox/form',
        'Giá mỗi lead (CPL)',
        'Tỷ lệ lead đúng tệp',
        'Tỷ lệ chuyển đổi lead sang tư vấn',
        'Hiệu quả chiến dịch quảng cáo (% chi phí quảng cáo / Doanh thu)'
      ],
      roles: [
        {
          title: 'Trưởng nhóm Marketing',
          description: 'Quản lý chiến dịch, điều phối ngân sách và kết nối với sale.',
          items: [
            'Xây dựng kế hoạch marketing theo tuần/tháng',
            'Phân bổ ngân sách quảng cáo',
            'Theo dõi hiệu suất lead và chiến dịch',
            'Phối hợp với sale để nâng cao tỷ lệ chuyển đổi'
          ]
        },
        {
          title: 'Nhân viên Marketing Ads',
          description: 'Vận hành quảng cáo và tối ưu tệp mục tiêu để thu lead chất lượng.',
          items: [
            'Thiết lập và vận hành chiến dịch quảng cáo',
            'Giám sát ngân sách và hiệu suất hàng ngày',
            'Tối ưu mẫu quảng cáo và chi phí',
            'Phân tích chỉ số, giá lead và đề xuất điều chỉnh'
          ]
        },
      ]
    },
    sale: {
      title: 'Tổ Sale / Tư vấn',
      objective: 'Quản lý đội tư vấn, đảm bảo tiếp nhận khách nhanh và tư vấn đúng nhu cầu để chốt đơn hiệu quả.',
      summary: 'Đội tư vấn lấy lead từ marketing, xác định nhu cầu và thuyết phục khách chốt gói SIM hoặc Pocket WiFi phù hợp.',
      tasks: [
        'Phân chia lead cho nhân viên tư vấn',
        'Giám sát tốc độ phản hồi khách hàng',
        'Theo dõi tỷ lệ chốt đơn từng nhân viên',
        'Chuẩn hóa kịch bản tư vấn theo nhu cầu khách',
        'Hướng dẫn nhân viên xử lý khách khó chốt',
        'Kiểm tra chất lượng tư vấn và cuộc trò chuyện',
        'Phối hợp với marketing phản hồi chất lượng lead',
        'Tổng hợp lý do khách không mua',
        'Đề xuất cải tiến quy trình tư vấn và chốt đơn'
      ],
      kpis: [
        'Tỷ lệ phản hồi nhanh',
        'Tỷ lệ chốt đơn của đội',
        'Doanh thu từ đội tư vấn',
        'Tỷ lệ khách bị bỏ sót',
        'Độ chính xác dữ liệu khách hàng'
      ],
      roles: [
        {
          title: 'Trưởng nhóm Sale/Tư vấn',
          description: 'Quản lý quy trình tư vấn, phân bổ lead và nâng cao tỷ lệ chốt.',
          items: [
            'Phân chia lead và giám sát phản hồi',
            'Theo dõi tỷ lệ chốt đơn cá nhân',
            'Chuẩn hóa kịch bản tư vấn',
            'Huấn luyện nhân viên xử lý tình huống khó'
          ]
        },
        {
          title: 'Nhân viên Sale/Chat Tư vấn',
          description: 'Tiếp nhận lead online, xác định nhu cầu và tư vấn gói phù hợp.',
          items: [
            'Trả lời inbox, chat và form khách hàng',
            'Xác định nhu cầu và mức sử dụng',
            'Tư vấn gói và chốt đơn',
            'Cập nhật dữ liệu khách và lý do không mua'
          ]
        },
        {
          title: 'Nhân viên Telesales',
          description: 'Gọi điện cho lead để xác nhận nhu cầu và chốt đơn qua điện thoại.',
          items: [
            'Gọi khách ngay sau khi có lead',
            'Xác minh nhu cầu và tư vấn gói',
            'Chốt đơn qua điện thoại',
            'Theo dõi khách chưa chốt'
          ]
        }
      ]
    },
    cskh: {
      title: 'Tổ Chăm sóc khách hàng',
      objective: 'Tổ chức chăm sóc sau bán để khách dùng dịch vụ ổn định, hài lòng và gia hạn/tái mua.',
      summary: 'Đội CSKH đảm bảo khách được hỗ trợ sau mua, giải quyết sự cố và được nhắc gia hạn đúng hạn.',
      tasks: [
        'Xây dựng quy trình CSKH sau bán',
        'Phân công danh sách khách cần chăm sóc',
        'Theo dõi tỷ lệ hỗ trợ thành công',
        'Kiểm soát nhắc gia hạn và đổi gói',
        'Theo dõi phản hồi và khiếu nại',
        'Hướng dẫn nhân viên xử lý tình huống khó',
        'Phối hợp với sale và marketing cải thiện trải nghiệm',
        'Tổng hợp lỗi và vấn đề khách thường gặp'
      ],
      kpis: [
        'Tỷ lệ chăm sóc đúng hạn',
        'Tỷ lệ gia hạn',
        'Tỷ lệ xử lý vấn đề thành công',
        'Mức độ hài lòng khách hàng',
        'Doanh thu từ khách cũ'
      ],
      roles: [
        {
          title: 'Trưởng nhóm Chăm sóc khách hàng',
          description: 'Tổ chức hoạt động chăm sóc, nhắc gia hạn và đảm bảo chất lượng xử lý sự vụ.',
          items: [
            'Xây dựng quy trình CSKH sau bán',
            'Phân công khách cần chăm sóc',
            'Theo dõi tiến độ gia hạn và hỗ trợ',
            'Phối hợp với sale để cải thiện trải nghiệm khách'
          ]
        },
        {
          title: 'Nhân viên Chăm sóc khách hàng',
          description: 'Hỗ trợ khách sau bán, xử lý lỗi cơ bản và nhắc gia hạn đúng hạn.',
          items: [
            'Gọi/nhắn tin xác nhận khách nhận hàng',
            'Hướng dẫn lắp SIM và cài APN',
            'Xử lý lỗi cơ bản và hỗ trợ gia hạn',
            'Thu thập phản hồi và đề xuất cải tiến'
          ]
        }
      ]
    }
  };

  const currentRole = ROLES.find(r => r.id === activeRole) || ROLES[0];

  const ModelTab = () => {
    if (!activeDept) {
      return (
        <>
          <header className="mb-12 text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Wifi className="w-6 h-6 text-blue-600" />
                <span className="px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-100 rounded-full">
                  Hệ thống Quản trị Doanh nghiệp
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Sơ đồ tổ chức Công ty
              </h1>
            </motion.div>
          </header>

          <div className="relative py-12 flex flex-col items-center overflow-x-auto w-full">
            {/* Giám Đốc/CEO Node */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-6 bg-slate-900 border-4 border-slate-200 text-white rounded-3xl shadow-xl flex items-center gap-4 w-72 md:w-80 justify-center relative">
                <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0" />
                <div className="text-left w-full">
                  <h3 className="font-bold text-xl">GIÁM ĐỐC / CEO</h3>
                  <p className="text-sm text-slate-400">Ban Điều Hành</p>
                </div>
              </div>
              {/* Cột dọc xuống */}
              <div className="w-1 bg-slate-300 h-12"></div>
            </div>

            {/* Trục ngang cho 4 phòng */}
            <div className="relative w-full max-w-7xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300 hidden lg:block"></div>

              {/* 5 Phòng */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 pt-0 lg:pt-12 w-full">
                {[
                  {
                    id: 'sales-mkt', label: 'PHÒNG KD – MKT (ADS)', icon: <MessageSquare className="w-6 h-6" />, color: 'bg-blue-600',
                    teams: ['Chạy Ads chuyển đổi', 'Bộ phận Sale / Tư vấn', 'Chăm sóc khách hàng', 'Tối ưu giá Lead']
                  },
                  {
                    id: 'comms-dept', label: 'PHÒNG TRUYỀN THÔNG', icon: <Megaphone className="w-6 h-6" />, color: 'bg-amber-600',
                    teams: ['Content & Viral PR', 'Thiết kế & Media', 'Kịch bản thương hiệu', 'Xử lý khủng hoảng']
                  },
                  {
                    id: 'hr-dept', label: 'HÀNH CHÍNH – NHÂN SỰ', icon: <Briefcase className="w-6 h-6" />, color: 'bg-emerald-600',
                    teams: ['Tuyển dụng & Đào tạo', 'Hành chính văn phòng', 'Quản lý nhân sự', 'Văn hóa doanh nghiệp']
                  },
                  {
                    id: 'finance-dept', label: 'TÀI CHÍNH – KẾ TOÁN', icon: <DollarSign className="w-6 h-6" />, color: 'bg-rose-600',
                    teams: ['Kế toán doanh thu', 'Kế toán chi phí', 'Công nợ đối tác', 'Lương, thưởng, hoa hồng']
                  },
                  {
                    id: 'technical', label: 'KỸ THUẬT – VẬN HÀNH', icon: <Cpu className="w-6 h-6" />, color: 'bg-indigo-600',
                    teams: ['Quản lý SIM & Gói cước', 'Quản lý kho Pocket WiFi', 'Hỗ trợ sự cố kỹ thuật', 'Kiểm tra & Kích hoạt']
                  }
                ].map((dept, idx) => (
                  <div key={dept.id} className="relative flex flex-col items-center group w-full">
                    {/* Đường cắm từ trục ngang xuống khối */}
                    <div className="absolute top-[-48px] w-1 bg-slate-300 h-12 hidden lg:block"></div>

                    {/* Đường cắm cho màn mobile/tablet (không có trục ngang chung) */}
                    <div className="w-1 bg-slate-300 h-6 lg:hidden"></div>

                    <button
                      onClick={() => goToDept(dept.id)}
                      className="w-full h-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden flex flex-col group/btn"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                        <span className="text-slate-400 font-bold">&rarr;</span>
                      </div>
                      <div className={`p-4 rounded-2xl w-fit mb-5 text-white ${dept.color} shadow-md`}>
                        {dept.icon}
                      </div>
                      <h4 className="font-bold text-slate-800 mb-4 h-12 flex items-center leading-snug">{dept.label}</h4>

                      <div className="w-[80%] bg-slate-100 h-px mb-5"></div>

                      <ul className="space-y-3 flex-1 w-full">
                        {dept.teams.map((t, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dept.color.replace('bg-', 'bg-').replace('-600', '-400')}`} />
                            <span className="leading-tight pt-0.5">{t}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 pt-4 border-t border-slate-100 w-full text-left">
                        <span className={`text-xs font-bold inline-flex items-center gap-1 ${dept.id === 'sales-mkt' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {dept.id === 'sales-mkt' ? 'Xem chi tiết vận hành' : 'Đang cập nhật'}
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeDept === 'sales-mkt') {
      return (
        <>
          <button onClick={() => { goToDept(null); goToTeam(null); }} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:underline">
            &larr; Quay lại sơ đồ công ty
          </button>
          <Header />
          <div className="mb-12">
            <div className="flex flex-col items-center">
              {!activeTeam ? (
                <div className="w-full flex flex-col items-center animate-in zoom-in-95 fade-in duration-300">
                  {/* 1. Đề xuất mô hình tổ chức */}
                  <section className="w-full mb-12">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                      <h2 className="text-2xl font-bold text-slate-900">Đề xuất mô hình tổ chức</h2>
                    </div>
                    <p className="text-slate-600 mb-8 max-w-3xl">
                      Đề xuất tập trung vào mô hình Phòng Kinh doanh – Marketing – Chăm sóc khách hàng, chịu trách nhiệm trọn hành trình khách hàng từ tiếp cận đến sau bán.
                    </p>

                    {/* Vẫn giữ lại khả năng bấm vào 3 Tổ Chiến Lược */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
                      {(['marketing', 'sale', 'cskh'] as const).map(teamId => {
                        const team = teamDetails[teamId];
                        const icon = teamId === 'marketing' ? Megaphone : teamId === 'sale' ? MessageSquare : HeartHandshake;
                        const color = teamId === 'marketing' ? 'bg-indigo-100 text-indigo-600' : teamId === 'sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600';
                        return (
                          <button key={teamId} onClick={() => goToTeam(teamId)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 group transition-all duration-300 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                              <span className="text-blue-600 font-bold">&rarr;</span>
                            </div>
                            <div className={`p-3 rounded-2xl w-fit mb-5 ${color}`}>
                              {React.createElement(icon, { className: 'w-6 h-6' })}
                            </div>
                            <h4 className="font-bold text-xl mb-3">{team.title}</h4>
                            <p className="text-slate-600 text-sm mb-5">{team.summary}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-wrap gap-4 justify-between items-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
                      <div className="flex-1 min-w-[200px] flex gap-3 items-center">
                        <Search className="w-6 h-6 text-indigo-400 shrink-0" />
                        <span className="font-medium text-sm">Tìm khách hàng đúng tệp</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-600 hidden md:block -rotate-90 shrink-0" />
                      <div className="flex-1 min-w-[200px] flex gap-3 items-center">
                        <MessageSquare className="w-6 h-6 text-emerald-400 shrink-0" />
                        <span className="font-medium text-sm">Tư vấn và chốt đơn theo nhu cầu</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-600 hidden md:block -rotate-90 shrink-0" />
                      <div className="flex-1 min-w-[200px] flex gap-3 items-center">
                        <Clock className="w-6 h-6 text-rose-400 shrink-0" />
                        <span className="font-medium text-sm">Giao hàng/hỗ trợ sử dụng</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-600 hidden md:block -rotate-90 shrink-0" />
                      <div className="flex-1 min-w-[200px] flex gap-3 items-center">
                        <RefreshCcw className="w-6 h-6 text-blue-400 shrink-0" />
                        <span className="font-medium text-sm">Chăm sóc sau bán, giới thiệu</span>
                      </div>
                    </div>
                  </section>

                  {/* 2. Tóm tắt mô hình */}
                  <section className="w-full mb-12">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
                          <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-indigo-950">2. Tóm tắt mô hình</h2>
                          <p className="text-indigo-700/80 mt-1">Vận hành trọn chuỗi khách hàng cho SIM Data, Pocket WiFi tại Nhật</p>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-3 mt-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
                          <Target className="w-5 h-5 text-rose-500 mb-3" />
                          <h3 className="font-bold text-slate-900 mb-2">Phạm vi</h3>
                          <p className="text-sm text-slate-600">SIM Data, Pocket WiFi, gói cước internet di động và dịch vụ hỗ trợ khách hàng người nước ngoài tại Nhật.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
                          <RefreshCcw className="w-5 h-5 text-blue-500 mb-3" />
                          <h3 className="font-bold text-slate-900 mb-2">Chuỗi hoạt động</h3>
                          <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Marketing kéo lead</li>
                            <li>• Sale tư vấn & chốt đơn</li>
                            <li>• CSKH hỗ trợ sau bán & gia hạn</li>
                          </ul>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
                          <Award className="w-5 h-5 text-amber-500 mb-3" />
                          <h3 className="font-bold text-slate-900 mb-2">Mục tiêu chính</h3>
                          <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Kéo đúng khách hàng mục tiêu</li>
                            <li>• Chốt đơn nhanh, giảm thất thoát</li>
                            <li>• Gia hạn, tái mua, tăng giới thiệu</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. Bối cảnh và khách hàng */}
                  <section className="w-full mb-12">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">3</div>
                      <h2 className="text-2xl font-bold text-slate-900">Bối cảnh & Khách hàng</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                        <Users className="w-8 h-8 text-emerald-600 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Khách hàng mục tiêu</h3>
                        <ul className="space-y-3">
                          {[
                            'Người nước ngoài mới sang Nhật',
                            'Thực tập sinh, kỹ sư, du học sinh',
                            'Lao động thời vụ, người chuyển vùng',
                            'Nhóm cần kết nối nhanh, tiện lợi'
                          ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-600">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                        <Zap className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Nhu cầu đặc thù</h3>
                        <ul className="space-y-3">
                          {[
                            'Internet nhanh, dễ đăng ký',
                            'Hỗ trợ tiếng Việt/tiếng Anh rõ ràng',
                            'Giao hàng nhanh và kích hoạt dễ',
                            'Giải quyết sự cố kịp thời'
                          ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-600">
                              <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 4. Tại sao phù hợp với SIM Data & Pocket WiFi */}
                  <section className="w-full mb-12">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">4</div>
                      <h2 className="text-2xl font-bold text-slate-900">Tại sao phù hợp với SIM/WiFi?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/50">
                        <div className="p-3 bg-rose-50 text-rose-600 w-fit rounded-2xl mb-4">
                          <Headphones className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-3 text-lg">Cần tư vấn</h3>
                        <ul className="text-sm text-slate-600 space-y-2">
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />Chọn SIM hay Pocket WiFi</li>
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />Chọn gói tháng, dài hạn hay 1 năm</li>
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />Phù hợp với số người và nhu cầu</li>
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm shadow-amber-100/50">
                        <div className="p-3 bg-amber-50 text-amber-600 w-fit rounded-2xl mb-4">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-3 text-lg">Cần phản hồi nhanh</h3>
                        <ul className="text-sm text-slate-600 space-y-2">
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />Lead cần được xử lý ngay</li>
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />Sale tư vấn nhanh, chính xác</li>
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />CSKH giải quyết sự cố kịp thời</li>
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm shadow-blue-100/50">
                        <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-2xl mb-4">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-3 text-lg">Cần chăm sóc sau bán</h3>
                        <ul className="text-sm text-slate-600 space-y-2">
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />Hướng dẫn cài đặt/kích hoạt</li>
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />Hỗ trợ lỗi kết nối</li>
                          <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />Nhắc gia hạn và đổi gói</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 5. Luồng công việc chính */}
                  <section className="w-full mb-8">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">5</div>
                      <h2 className="text-2xl font-bold text-slate-900">Luồng công việc chính</h2>
                    </div>

                    <div className="relative">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-indigo-100 via-emerald-100 to-rose-100 -translate-y-1/2 hidden lg:block rounded-full" />
                      <div className="grid gap-6 lg:grid-cols-4">
                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-indigo-200 shadow-lg shadow-indigo-100/40">
                          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <Megaphone className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Thu hút khách</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Quảng cáo online</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Social media và nội dung</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" /> Landing page, form, inbox</li>
                          </ul>
                        </div>

                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-emerald-200 shadow-lg shadow-emerald-100/40">
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Tư vấn & chốt đơn</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Nhận lead chat, call</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Định vị nhu cầu, gợi ý gói</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> Giải thích ưu đãi, kích hoạt</li>
                          </ul>
                        </div>

                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-blue-200 shadow-lg shadow-blue-100/40">
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Hỗ trợ sau bán</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Kiểm tra nhận hàng</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Hỗ trợ cài đặt, APN</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> Giải quyết sự cố cơ bản</li>
                          </ul>
                        </div>

                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-rose-200 shadow-lg shadow-rose-100/40">
                          <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <RefreshCcw className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Tái khai thác khách</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> Nhắc gia hạn đúng hạn</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> Upsell gói cao hơn</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> Khai thác giới thiệu</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-8 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500">
                    <button onClick={() => goToTeam(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl w-fit">
                      &larr; Quay lại danh sách tổ
                    </button>
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <h3 className="text-3xl font-bold mb-3">{teamDetails[activeTeam].title}</h3>
                        <p className="text-slate-600 mb-6">{teamDetails[activeTeam].objective}</p>
                        <div className="grid gap-6">
                          <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-4">Nhiệm vụ chính</h4>
                            <ul className="space-y-3 text-slate-600 list-disc list-inside">
                              {teamDetails[activeTeam].tasks.map((task, i) => (
                                <li key={i}>{task}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-4">Vai trò chính trong tổ</h4>
                            <div className="space-y-5">
                              {teamDetails[activeTeam].roles.map((role, idx) => (
                                <div key={idx}>
                                  <h5 className="font-semibold text-slate-900 mb-2">{role.title}</h5>
                                  <p className="text-slate-600 mb-3">{role.description}</p>
                                  <ul className="space-y-2 text-slate-600 list-disc list-inside">
                                    {role.items.map((item, itemIdx) => (
                                      <li key={itemIdx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="rounded-3xl bg-blue-50 p-6 border border-blue-100">
                          <h4 className="font-bold text-blue-900 mb-4">Chỉ số đánh giá (KPI)</h4>
                          <ul className="space-y-3 text-slate-700 list-disc list-inside">
                            {teamDetails[activeTeam].kpis.map((kpi, i) => (
                              <li key={i}>{kpi}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-3xl bg-white p-6 border border-slate-200">
                          <h4 className="font-bold text-slate-900 mb-4">Tổng quan</h4>
                          <p className="text-slate-600 leading-relaxed">
                            {teamDetails[activeTeam].summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    const OTHER_DEPTS_DATA: Record<string, { title: string, objective: string, teams: string[], icon: any, color: string }> = {
      'hr-dept': {
        title: 'Hành chính – Nhân sự',
        objective: 'Tuyển đúng người, đào tạo nhanh, giữ người và chuẩn hóa vận hành nội quy nội bộ.',
        color: 'text-emerald-600 bg-emerald-100',
        icon: <Briefcase className="w-8 h-8" />,
        teams: [
          'Tuyển dụng',
          'Đào tạo nội bộ',
          'Hành chính văn phòng',
          'Quản lý hồ sơ nhân sự',
          'Văn hóa doanh nghiệp / nội quy'
        ]
      },
      'finance-dept': {
        title: 'Tài chính – Kế toán',
        objective: 'Kiểm soát dòng tiền, báo cáo lời lỗ và cập nhật lương thưởng doanh thu.',
        color: 'text-rose-600 bg-rose-100',
        icon: <DollarSign className="w-8 h-8" />,
        teams: [
          'Kế toán doanh thu',
          'Kế toán chi phí',
          'Kế toán công nợ',
          'Theo dõi dòng tiền',
          'Lương – thưởng – hoa hồng'
        ]
      },
      'comms-dept': {
        title: 'Truyền thông & Thương hiệu',
        objective: 'Xây dựng hình ảnh chuyên nghiệp, Viral content và nhận diện thương hiệu cộng đồng người nước ngoài.',
        color: 'text-amber-600 bg-amber-100',
        icon: <Megaphone className="w-8 h-8" />,
        teams: [
          'Nhóm Content & PR (Viral)',
          'Nhóm Media & Thiết kế (Video, Ảnh)',
          'Nhóm Quản trị Thương hiệu & Cộng đồng',
          'Sản xuất ấn phẩm & POSM',
          'Xử lý khủng hoảng truyền thông'
        ]
      },
      'technical': {
        title: 'Kỹ thuật – Vận hành hạ tầng',
        objective: 'Đảm bảo hoạt động hạ tầng, quản lý thiết bị, cấu hình SIM và hỗ trợ kỹ thuật chuyên sâu.',
        color: 'text-indigo-600 bg-indigo-100',
        icon: <Cpu className="w-8 h-8" />,
        teams: [
          'Nhóm quản lý SIM / nhà mạng / cấu hình gói',
          'Nhóm hỗ trợ kỹ thuật khách hàng',
          'Nhóm quản lý thiết bị Pocket WiFi',
          'Nhóm kiểm tra chất lượng / kích hoạt / đổi lỗi',
          'Nhóm vận hành kho thiết bị – SIM'
        ]
      }
    };

    if (activeDept && activeDept !== 'sales-mkt') {
      const deptData = OTHER_DEPTS_DATA[activeDept];
      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-12 w-full">
          <button onClick={() => goToDept(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors w-fit">
            &larr; Quay lại sơ đồ công ty
          </button>

          {deptData ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full">
              <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5 -translate-y-10 translate-x-10 pointer-events-none hidden md:block">
                  {React.cloneElement(deptData.icon as React.ReactElement, { className: 'w-64 h-64' })}
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className={`p-4 rounded-2xl shadow-sm ${deptData.color}`}>
                    {deptData.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{deptData.title}</h2>
                    <p className="text-slate-600 max-w-2xl">{deptData.objective}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 relative overflow-hidden">
                <div className="absolute left-1/2 top-0 w-px bg-slate-100 h-full hidden md:block" />
                <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3 relative z-10 bg-white w-fit pr-4">
                  <Target className="w-6 h-6 text-blue-500" />
                  Cơ cấu Nhân sự
                </h3>
                <div className="grid md:grid-cols-2 gap-x-16 gap-y-6 relative z-10">
                  {deptData.teams.map((team, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow hover:-translate-y-0.5">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <h4 className="font-bold text-slate-800 leading-snug">{team}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center w-full">
              <h2 className="text-2xl font-bold text-slate-900">Bộ phận: {DEPARTMENTS.find(d => d.id === activeDept)?.title}</h2>
              <p className="text-slate-500 mt-4">Nội dung chi tiết cho bộ phận này đang được cập nhật.</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Sidebar
        activeTab={activeTab}
        activeDept={activeDept}
        hrSubTab={hrSubTab}
        onLogout={handleLogout}
        user={user}
      />

      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'model' && <ModelTab />}
              {activeTab === 'hr' && (
                <HRTab
                  selectedRole={restrictedView ? internalRoleId : activeRole}
                  setSelectedRole={restrictedView ? () => { } : setActiveRole}
                  setActiveTab={goToTab}
                  restricted={restrictedView}
                  hrSubTab={hrSubTab}
                  user={user}
                />
              )}
              {activeTab === 'salary' && (
                <SalaryTab
                  selectedRole={restrictedView ? internalRoleId : activeRole}
                  setSelectedRole={restrictedView ? () => { } : setActiveRole}
                  setActiveTab={goToTab}
                  restricted={restrictedView}
                />
              )}
              {activeTab === 'cost' && (isAdmin ? <CostTab /> : <div className="text-center py-20 text-slate-400">Bạn không có quyền truy cập mục này.</div>)}
              {activeTab === 'training' && <TrainingTab />}
              {activeTab === 'business' && (isAdmin ? <BusinessPlanTab initialSubTab="finance" /> : <div className="text-center py-20 text-slate-400">Bạn không có quyền truy cập mục này.</div>)}
              {activeTab === 'action-plan' && (isAdmin ? <BusinessPlanTab initialSubTab="action" /> : <div className="text-center py-20 text-slate-400">Bạn không có quyền truy cập mục này.</div>)}
            </motion.div>

          </AnimatePresence>

          {/* Footer / Call to Action */}
          <footer className="mt-20 py-12 border-t border-slate-200 text-center">
            <p className="mt-8 text-slate-400 text-sm">
              © 2026 Hệ thống Quản trị Doanh nghiệp Online. Thiết kế chuyên biệt cho ngành Viễn thông tại Nhật.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}
