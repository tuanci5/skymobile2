/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobDescription, Role, ProcessStep } from './types';
import { JD_DATA, ROLES } from './data/hrData';
import { PROCESS_STEPS, DEPARTMENTS } from './data/modelData';
import { TRAINING_GROUPS, CULTURE_PILLARS, CORE_VALUES } from './data/trainingData';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './components/LoginPage';

const GOOGLE_CLIENT_ID = '637002508826-b7jmlrenhbagrh6rjp4m4uq8n210fq9a.apps.googleusercontent.com';

// --- Types ---

type TabType = 'model' | 'hr' | 'salary' | 'cost' | 'training';

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
                className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                  activeRole === role.id 
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

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  activeDept, 
  setActiveDept,
  onLogout,
  user
}: { 
  activeTab: TabType, 
  setActiveTab: (t: TabType) => void, 
  activeDept: string | null, 
  setActiveDept: (d: string | null) => void,
  onLogout: () => void,
  user: any
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const baseMenuItems = [
    { id: 'model', label: 'Mô hình Vận hành', icon: <Users className="w-5 h-5" /> },
    { id: 'hr', label: 'Nhân sự & JD', icon: <UserCog className="w-5 h-5" /> },
    { id: 'salary', label: 'Lương & KPI', icon: <Wallet className="w-5 h-5" /> },
    { id: 'cost', label: 'Cơ cấu chi phí', icon: <PieChart className="w-5 h-5" />, adminOnly: true },
    { id: 'training', label: 'Đào tạo & Văn hóa', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  // Dynamic department links based on role
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

  // Combine menus: Model (Main) -> Dept Links -> Other Tabs
  const filteredMenuItems: any[] = [];
  baseMenuItems.forEach(item => {
    if (item.adminOnly && user.role !== 'Quản trị') return;
    filteredMenuItems.push(item);
    if (item.id === 'model') {
      filteredMenuItems.push(...deptLinks);
    }
  });

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
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'].includes(item.id)) {
                    setActiveTab('model');
                    setActiveDept(item.id);
                  } else if (item.id === 'model') {
                    setActiveTab('model');
                    setActiveDept(null);
                  } else {
                    setActiveTab(item.id as TabType);
                    setActiveDept(null);
                  }
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${item.indent ? 'ml-6' : ''} ${item.small ? 'text-sm' : ''} ${
                  (activeTab === item.id || (['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'].includes(item.id) && activeDept === item.id))
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
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

const HRTab = ({ selectedRole, setSelectedRole, setActiveTab, restricted }: { selectedRole: string, setSelectedRole: (role: string) => void, setActiveTab: (tab: TabType) => void, restricted?: boolean }) => {
  return (
    <div className="max-w-6xl mx-auto">
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
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  selectedRole === id
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
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  selectedRole === id
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2">Tổng thu nhập</h4>
                  <p className="text-2xl font-bold text-blue-700">{JD_DATA[selectedRole].salaryRange}</p>
                </div>
                {JD_DATA[selectedRole].baseSalary && (
                  <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h4 className="font-bold text-rose-900 mb-2">Lương cứng</h4>
                    <p className="text-2xl font-bold text-rose-700">{JD_DATA[selectedRole].baseSalary}</p>
                  </div>
                )}
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 mb-2">Cách tính</h4>
                  <p className="text-sm text-slate-700">{JD_DATA[selectedRole].salaryCalculation}</p>
                </div>
              </div>
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
                    <span className="text-white font-medium">Bán đứt:</span> Nhận ngay lợi nhuận ở giao dịch mua mới đầu tiên.<br/>
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
  'Quản lý': 'head'
};

function AppContent() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('sky_mobile_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const internalRoleId = user?.role ? (ROLE_MAPPING[user.role] || 'guest') : null;
  const isAdmin = internalRoleId === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('model');
  const [activeRole, setActiveRole] = useState<string>(internalRoleId || 'head');
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<'marketing' | 'sale' | 'cskh' | null>(null);

  // Sync activeRole with user's role when login happens
  React.useEffect(() => {
    if (user && !isAdmin) {
      setActiveRole(internalRoleId || 'head');
    }
  }, [user, internalRoleId, isAdmin]);

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
                      onClick={() => setActiveDept(dept.id)}
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
          <button onClick={() => { setActiveDept(null); setActiveTeam(null); }} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:underline">
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
                          <button key={teamId} onClick={() => setActiveTeam(teamId)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 group transition-all duration-300 text-left relative overflow-hidden">
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
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0"/> Quảng cáo online</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0"/> Social media và nội dung</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0"/> Landing page, form, inbox</li>
                          </ul>
                        </div>
                        
                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-emerald-200 shadow-lg shadow-emerald-100/40">
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Tư vấn & chốt đơn</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Nhận lead chat, call</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Định vị nhu cầu, gợi ý gói</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Giải thích ưu đãi, kích hoạt</li>
                          </ul>
                        </div>
                        
                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-blue-200 shadow-lg shadow-blue-100/40">
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Hỗ trợ sau bán</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> Kiểm tra nhận hàng</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> Hỗ trợ cài đặt, APN</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"/> Giải quyết sự cố cơ bản</li>
                          </ul>
                        </div>

                        <div className="relative z-10 bg-white p-6 rounded-3xl border border-rose-200 shadow-lg shadow-rose-100/40">
                          <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center mb-4 mx-auto border-4 border-white shadow-md">
                            <RefreshCcw className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-center mb-4">Tái khai thác khách</h3>
                          <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0"/> Nhắc gia hạn đúng hạn</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0"/> Upsell gói cao hơn</li>
                            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500 mt-0.5 shrink-0"/> Khai thác giới thiệu</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>
              </div>
              ) : (
                <div className="space-y-8 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-3xl border border-slate-200 shadow-xl border-t-4 border-t-blue-500">
                    <button onClick={() => setActiveTeam(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl w-fit">
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
          <button onClick={() => setActiveDept(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors w-fit">
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
        setActiveTab={(tab) => {
          if (!canAccessSensitive && (tab === 'salary' || tab === 'cost')) {
            alert('Bạn không có quyền truy cập mục này.');
            return;
          }
          setActiveTab(tab);
        }} 
        activeDept={activeDept} 
        setActiveDept={setActiveDept} 
        onLogout={handleLogout}
        user={user}
      />
      
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'model' && <ModelTab />}
              {activeTab === 'hr' && (
                <HRTab 
                  selectedRole={restrictedView ? internalRoleId : activeRole} 
                  setSelectedRole={restrictedView ? () => {} : setActiveRole} 
                  setActiveTab={setActiveTab} 
                  restricted={restrictedView}
                />
              )}
              {activeTab === 'salary' && (
                <SalaryTab 
                  selectedRole={restrictedView ? internalRoleId : activeRole} 
                  setSelectedRole={restrictedView ? () => {} : setActiveRole} 
                  setActiveTab={setActiveTab} 
                  restricted={restrictedView}
                />
              )}
              {activeTab === 'cost' && (isAdmin ? <CostTab /> : <div className="text-center py-20 text-slate-400">Bạn không có quyền truy cập mục này.</div>)}
              {activeTab === 'training' && <TrainingTab />}
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
