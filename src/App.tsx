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
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobDescription, Role, ProcessStep } from './types';
import { JD_DATA, ROLES } from './data/hrData';
import { PROCESS_STEPS, DEPARTMENTS } from './data/modelData';

// --- Types ---

type TabType = 'model' | 'hr' | 'salary';

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

const Sidebar = ({ activeTab, setActiveTab, activeDept, setActiveDept }: { activeTab: TabType, setActiveTab: (t: TabType) => void, activeDept: string | null, setActiveDept: (d: string | null) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'model', label: 'Mô hình Vận hành', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'sales-mkt', label: 'P. KD - MKT', icon: <MessageSquare className="w-4 h-4" />, indent: true, small: true },
    { id: 'hr-dept', label: 'P. HCNS', icon: <Briefcase className="w-4 h-4" />, indent: true, small: true },
    { id: 'finance-dept', label: 'P. Kế toán', icon: <DollarSign className="w-4 h-4" />, indent: true, small: true },
    { id: 'hr', label: 'Nhân sự & JD', icon: <UserCog className="w-5 h-5" /> },
    { id: 'salary', label: 'Lương & KPI', icon: <Wallet className="w-5 h-5" /> },
  ];

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

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (['sales-mkt', 'hr-dept', 'finance-dept'].includes(item.id)) {
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
                  (activeTab === item.id || (['sales-mkt', 'hr-dept', 'finance-dept'].includes(item.id) && activeDept === item.id))
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">Phiên bản</p>
            <p className="text-sm font-bold">v2.0 - Specialized</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const HRTab = ({ selectedRole, setSelectedRole, setActiveTab }: { selectedRole: string, setSelectedRole: (role: string) => void, setActiveTab: (tab: TabType) => void }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900">Mô tả công việc (JD)</h2>
        <p className="text-slate-600 mt-2">Chi tiết nhiệm vụ, quyền hạn và KPI cho từng vị trí trong phòng ban.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* JD List */}
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

        {/* JD Detail */}
        <div className="lg:col-span-3">
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

const SalaryTab = ({ selectedRole, setSelectedRole, setActiveTab }: { selectedRole: string, setSelectedRole: (role: string) => void, setActiveTab: (tab: TabType) => void }) => {
  const [selectedSalary, setSelectedSalary] = useState<string>('head');

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900">Cơ chế Lương & Thưởng</h2>
        <p className="text-slate-600 mt-2">Hệ thống đãi ngộ dựa trên hiệu suất và giá trị đóng góp dài hạn.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Salary List */}
        <div className="lg:col-span-1 space-y-2">
          {Object.entries(JD_DATA).map(([id, jd]) => (
            <button
              key={id}
              onClick={() => setSelectedSalary(id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                selectedSalary === id
                  ? 'bg-white border-2 border-blue-600 shadow-sm text-blue-700 font-bold'
                  : 'bg-transparent border-2 border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm">{jd.title}</div>
            </button>
          ))}
        </div>

        {/* Salary Detail */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSalary}
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
                  <h3 className="text-2xl font-bold text-slate-900">{JD_DATA[selectedSalary].title}</h3>
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
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2">Mức lương</h4>
                  <p className="text-2xl font-bold text-blue-700">{JD_DATA[selectedSalary].salaryRange}</p>
                </div>
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 mb-2">Cách tính</h4>
                  <p className="text-slate-700">{JD_DATA[selectedSalary].salaryCalculation}</p>
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('model');
  const [activeRole, setActiveRole] = useState<string>('head');
  const [activeTeam, setActiveTeam] = useState<string | null>(null);

  const teamDetails: Record<string, { title: string; objective: string; tasks: string[]; kpis: string[] }> = {
    'marketing': {
      title: 'Tổ Marketing',
      objective: 'Tổ chức và triển khai hoạt động marketing nhằm thu hút đúng khách hàng mục tiêu.',
      tasks: ['Xây dựng kế hoạch marketing', 'Triển khai quảng cáo', 'Sản xuất nội dung', 'Quản lý social media'],
      kpis: ['Số lượng lead', 'Chi phí/lead', 'Tỷ lệ chuyển đổi']
    },
    'sales': {
      title: 'Tổ Sale / Tư vấn',
      objective: 'Quản lý đội ngũ tư vấn, đảm bảo tiếp nhận khách nhanh và chốt đơn.',
      tasks: ['Phân chia lead', 'Giám sát phản hồi', 'Chuẩn hóa kịch bản tư vấn', 'Theo dõi tỷ lệ chốt'],
      kpis: ['Tỷ lệ phản hồi', 'Tỷ lệ chốt đơn', 'Doanh thu đội']
    },
    'cskh': {
      title: 'Tổ Chăm sóc khách hàng',
      objective: 'Tổ chức hoạt động chăm sóc sau bán đảm bảo khách hài lòng và gia hạn.',
      tasks: ['Quy trình CSKH', 'Theo dõi hỗ trợ', 'Nhắc gia hạn', 'Xử lý khiếu nại'],
      kpis: ['Tỷ lệ gia hạn', 'Tỷ lệ xử lý sự cố', 'Mức độ hài lòng']
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEPARTMENTS.map(dept => (
              <button key={dept.id} onClick={() => setActiveDept(dept.id)} className="p-8 bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all text-left">
                <div className={`p-4 rounded-2xl w-fit mb-6 text-white ${dept.color}`}>
                  {dept.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{dept.title}</h3>
                <p className="text-slate-500 text-sm">{dept.description}</p>
              </button>
            ))}
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
              <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg text-center mb-8 max-w-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Quản trị Doanh thu & Vòng đời</span>
                </div>
                <h3 className="text-xl font-bold">Trưởng phòng Kinh doanh – Marketing – CSKH</h3>
              </div>
              
              <div className="w-full h-px bg-slate-300 mb-8" />
              
              {!activeTeam ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[
                    { id: 'marketing', icon: Megaphone, color: 'indigo', title: 'Tổ Marketing' },
                    { id: 'sales', icon: MessageSquare, color: 'emerald', title: 'Tổ Sale / Tư vấn' },
                    { id: 'cskh', icon: HeartHandshake, color: 'rose', title: 'Tổ Chăm sóc khách hàng' }
                  ].map(team => (
                    <button key={team.id} onClick={() => setActiveTeam(team.id)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left">
                      <div className={`p-2 bg-${team.color}-100 text-${team.color}-600 rounded-lg w-fit mb-4`}>
                        <team.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{team.title}</h4>
                      <p className="text-slate-600 text-sm">Nhấp để xem chi tiết nhiệm vụ và KPI.</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm w-full">
                  <button onClick={() => setActiveTeam(null)} className="mb-4 text-blue-600 font-bold flex items-center gap-2 hover:underline">
                    &larr; Quay lại danh sách tổ
                  </button>
                  <h3 className="text-2xl font-bold mb-4">{teamDetails[activeTeam].title}</h3>
                  <p className="text-slate-600 mb-6">{teamDetails[activeTeam].objective}</p>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="font-bold text-slate-900 mb-3">Nhiệm vụ chính:</h5>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {teamDetails[activeTeam].tasks.map((task, i) => <li key={i}>{task}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 mb-3">Chỉ số đánh giá (KPI):</h5>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {teamDetails[activeTeam].kpis.map((kpi, i) => <li key={i}>{kpi}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    if (activeDept === 'hr-dept' || activeDept === 'finance-dept') {
      return (
        <>
          <button onClick={() => setActiveDept(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:underline">
            &larr; Quay lại sơ đồ công ty
          </button>
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Bộ phận: {DEPARTMENTS.find(d => d.id === activeDept)?.title}</h2>
            <p className="text-slate-500 mt-4">Nội dung chi tiết cho bộ phận này đang được cập nhật.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <button onClick={() => setActiveDept(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:underline">
          &larr; Quay lại sơ đồ công ty
        </button>
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Bộ phận: {DEPARTMENTS.find(d => d.id === activeDept)?.title}</h2>
          <p className="text-slate-500 mt-4">Nội dung chi tiết cho bộ phận này đang được cập nhật.</p>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} activeDept={activeDept} setActiveDept={setActiveDept} />
      
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
              {activeTab === 'hr' && <HRTab selectedRole={activeRole} setSelectedRole={setActiveRole} setActiveTab={setActiveTab} />}
              {activeTab === 'salary' && <SalaryTab selectedRole={activeRole} setSelectedRole={setActiveRole} setActiveTab={setActiveTab} />}
            </motion.div>
          </AnimatePresence>

          {/* Footer / Call to Action */}
          <footer className="mt-20 py-12 border-t border-slate-200 text-center">
            <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-xl">
              <h3 className="text-2xl font-bold mb-4">Tạo khách – Chốt khách – Giữ khách – Tăng doanh thu</h3>
              <p className="max-w-2xl mx-auto mb-8 opacity-80">
                Mô hình quản trị doanh thu theo vòng đời khách hàng, đặc biệt phù hợp với ngành viễn thông 
                bán theo hình thức quảng cáo – tư vấn – chốt đơn – hỗ trợ sử dụng – gia hạn.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                  Trình ký Đề án
                </button>
                <button className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                  Tải Slide Outline
                </button>
              </div>
            </div>
            <p className="mt-8 text-slate-400 text-sm">
              © 2026 Hệ thống Quản trị Doanh nghiệp Online. Thiết kế chuyên biệt cho ngành Viễn thông tại Nhật.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
