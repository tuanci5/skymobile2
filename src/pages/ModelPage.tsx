import React from 'react';
import {
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  DollarSign,
  Headphones,
  HeartHandshake,
  Info,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DEPARTMENTS, PROCESS_STEPS } from '../data/modelData';
import { ROLES } from '../data/hrData';
import type { Role } from '../types';
import { OrganizationChartPage } from './OrganizationChartPage';

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

type ModelTeam = 'marketing' | 'sale' | 'cskh';

type ModelPageProps = {
  activeDept: string | null;
  activeTeam: ModelTeam | null;
  activeRole: string;
  setActiveRole: (role: string) => void;
  goToDept: (dept: string | null) => void;
  goToTeam: (team: string | null) => void;
};

export const ModelPage = ({
  activeDept,
  activeTeam,
  activeRole,
  setActiveRole,
  goToDept,
  goToTeam,
}: ModelPageProps) => {
  const currentRole = ROLES.find(r => r.id === activeRole) || ROLES[0];

  if (activeDept === 'org-chart') {
    return (
      <div>
        <button onClick={() => goToDept(null)} className="mb-8 text-blue-600 font-bold flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors w-fit">
          &larr; Quay lại Mô hình vận hành
        </button>
        <OrganizationChartPage />
      </div>
    );
  }

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

  const OTHER_DEPTS_DATA: Record<string, { title: string, objective: string, teams: (string | {name: string, desc: string})[], icon: any, color: string }> = {
    'hr-dept': {
      title: 'Hành chính – Nhân sự',
      objective: 'Tuyển đúng người, đào tạo nhanh, giữ người và chuẩn hóa vận hành nội quy nội bộ.',
      color: 'text-emerald-600 bg-emerald-100',
      icon: <Briefcase className="w-8 h-8" />,
      teams: [
        { name: 'Tuyển dụng', desc: 'Lập kế hoạch tuyển dụng, đăng tuyển, sơ vấn và phỏng vấn ứng viên các bộ phận.' },
        { name: 'Đào tạo nội bộ', desc: 'Lên chương trình hội nhập nhân sự mới, tổ chức các khóa nâng cao kỹ năng mềm, nghiệp vụ.' },
        { name: 'Hành chính văn phòng', desc: 'Quản lý thiết bị, văn phòng phẩm, chấm công, quản lý môi trường làm việc trực tiếp.' },
        { name: 'Quản lý hồ sơ nhân sự', desc: 'Quản lý hợp đồng lao động, bảo hiểm, đánh giá năng lực và các thủ tục nhân sự.' },
        { name: 'Văn hóa doanh nghiệp / nội quy', desc: 'Tổ chức sự kiện nội bộ, teambuilding, giám sát việc tuân thủ nội quy công ty.' }
      ]
    },
    'finance-dept': {
      title: 'Tài chính – Kế toán',
      objective: 'Kiểm soát dòng tiền, báo cáo lời lỗ và cập nhật lương thưởng doanh thu.',
      color: 'text-rose-600 bg-rose-100',
      icon: <DollarSign className="w-8 h-8" />,
      teams: [
        { name: 'Nhân viên kế toán tổng hợp', desc: 'Lập báo cáo tài chính, quyết toán thuế, đối soát số liệu tổng hợp toàn công ty.' },
        { name: 'Kế toán doanh thu', desc: 'Ghi nhận doanh thu từ các kênh, đối soát giao dịch thẻ, chuyển khoản ngân hàng.' },
        { name: 'Kế toán chi phí', desc: 'Theo dõi hạn mức ngân sách, kiểm soát và duyệt chi phí vận hành, marketing đúng quy định.' },
        { name: 'Kế toán công nợ', desc: 'Quản lý thu hồi công nợ khách hàng, đối soát và thanh toán công nợ nhà cung cấp/nhà mạng.' },
        { name: 'Theo dõi dòng tiền', desc: 'Lập kế hoạch thu chi, báo cáo Cashflow, cân đối ngoại tệ JPY - VND cập nhật hàng ngày.' },
        { name: 'Lương – thưởng – hoa hồng', desc: 'Chấm công, tính lương, thưởng KPI và hoa hồng cho Sale, CSKH chính xác hàng tháng.' }
      ]
    },
    'comms-dept': {
      title: 'Truyền thông & Thương hiệu',
      objective: 'Xây dựng hình ảnh chuyên nghiệp, Viral content và nhận diện thương hiệu cộng đồng người nước ngoài.',
      color: 'text-amber-600 bg-amber-100',
      icon: <Megaphone className="w-8 h-8" />,
      teams: [
        { name: 'Nhóm Content & PR (Viral)', desc: 'Sáng tạo nội dung trên Fanpage, Tiktok, báo chí kết nối với cộng đồng.' },
        { name: 'Nhóm Media & Thiết kế (Video, Ảnh)', desc: 'Quay chụp, dựng video, thiết kế hình ảnh cho quảng cáo và truyền thông.' },
        { name: 'Nhóm Quản trị Thương hiệu & Cộng đồng', desc: 'Xây dựng Group, hỗ trợ giải đáp thành viên, định vị hình ảnh thương hiệu trong cộng đồng.' },
        { name: 'Sản xuất ấn phẩm & POSM', desc: 'Thiết kế, in ấn bao bì, ấn phẩm đóng gói sản phẩm, standee, tờ rơi sự kiện.' },
        { name: 'Xử lý khủng hoảng truyền thông', desc: 'Theo dõi dư luận, kịp thời kiểm soát và xử lý các phản hồi tiêu cực trên mạng xã hội.' }
      ]
    },
    'technical': {
      title: 'Kỹ thuật – Vận hành hạ tầng',
      objective: 'Đảm bảo hoạt động hạ tầng, quản lý thiết bị, cấu hình SIM và hỗ trợ kỹ thuật chuyên sâu.',
      color: 'text-indigo-600 bg-indigo-100',
      icon: <Cpu className="w-8 h-8" />,
      teams: [
        { name: 'Nhóm quản lý SIM / nhà mạng / cấu hình gói', desc: 'Đăng ký SIM với nhà mạng, thiết lập và thay đổi gói cước theo nhu cầu khách hàng.' },
        { name: 'Nhóm hỗ trợ kỹ thuật khách hàng', desc: 'Hỗ trợ khách hàng xử lý lỗi kỹ thuật, mất kết nối, cài đặt APN nhanh chóng.' },
        { name: 'Nhóm quản lý thiết bị Pocket WiFi', desc: 'Kiểm tra, bảo trì, thay thế các thiết bị Pocket WiFi trước và sau khi khách hàng sử dụng.' },
        { name: 'Nhóm kiểm tra chất lượng / kích hoạt / đổi lỗi', desc: 'Test thiết bị và SIM trước xuất kho, tiếp nhận xử lý đổi trả bảo hành.' },
        { name: 'Nhóm vận hành kho thiết bị – SIM', desc: 'Quản lý tồn kho, nhập hàng, kiểm soát luân chuyển hàng hóa liên tục.' }
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
                {deptData.teams.map((team, idx) => {
                  const isObj = typeof team === 'object' && team !== null;
                  const teamName = isObj ? (team as any).name : team;
                  const teamDesc = isObj ? (team as any).desc : null;
                  return (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow hover:-translate-y-0.5 group">
                    <div className="w-10 h-10 rounded-full bg-slate-50 shadow-sm border border-slate-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-1 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-snug mb-1.5">{teamName as string}</h4>
                      {teamDesc && <p className="text-sm text-slate-600 leading-relaxed">{teamDesc}</p>}
                    </div>
                  </div>
                )})}
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
