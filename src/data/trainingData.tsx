import React from 'react';
import { Target, Monitor, Users, Settings, UserPlus, HeartHandshake, Globe2, Layers, Smartphone, Lightbulb, Wifi, Briefcase, Network, ShieldCheck, FileText, Lock, Clock, CalendarCheck } from 'lucide-react';
import docomoLogo from '../assets/logos/docomo.svg';
import softbankLogo from '../assets/logos/softbank.svg';
import auLogo from '../assets/logos/au.svg';
import rakutenLogo from '../assets/logos/rakuten.svg';

export const TRAINING_GROUPS = [
  {
    id: 'A',
    title: 'Đào tạo Hội nhập',
    desc: 'Hiểu về công ty, mô hình và nội quy cơ bản',
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-50 border-indigo-100',
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    courses: [
      'Giới thiệu công ty và mô hình doanh thu',
      'Cơ cấu tổ chức & Vai trò các phòng ban',
      'Nội quy, quy trình báo cáo & bảo mật'
    ]
  },
  {
    id: 'B',
    title: 'Đào tạo Sản phẩm',
    desc: 'Kiến thức cốt lõi về sản phẩm viễn thông',
    color: 'bg-emerald-600',
    lightColor: 'bg-emerald-50 border-emerald-100',
    icon: <Monitor className="w-6 h-6 text-emerald-600" />,
    courses: [
      'Tổng quan SIM Data/Voice và Pocket WiFi',
      'Chi tiết gói cước từng nhà mạng (Softbank, Docomo, Rakuten, v.v)',
      'Kỹ năng chọn gói cước phù hợp nhu cầu khách',
      'Lỗi thường gặp ở Pocket WiFi & cách xử lý',
      'Phí phát sinh và điều khoản hợp đồng'
    ]
  },
  {
    id: 'C',
    title: 'Quy trình Vận hành',
    desc: 'Từ tiếp nhận lead đến hỗ trợ sau bán',
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50 border-blue-100',
    icon: <Settings className="w-6 h-6 text-blue-600" />,
    courses: [
      'Quy trình từ lead đến chốt đơn',
      'Quy trình lên đơn, giao hàng, kích hoạt',
      'Quy trình chăm sóc sau bán & nhắc gia hạn',
      'Quy trình khiếu nại & xử lý sự cố',
      'Quy trình giữ khách và tái khai thác'
    ]
  },
  {
    id: 'D',
    title: 'Kỹ năng Vị trí',
    desc: 'Bổ trợ kỹ năng chuyên sâu theo từng phòng ban',
    color: 'bg-amber-600',
    lightColor: 'bg-amber-50 border-amber-100',
    icon: <Target className="w-6 h-6 text-amber-600" />,
    courses: [
      'Kỹ năng chốt đơn, upsell, xử lý từ chối (Sale)',
      'Content insight, chạy Ads chuyển đổi (MKT)',
      'Xử lý khách khó, giao tiếp dịch vụ chuẩn (CSKH)',
      'Cấu hình APN, xử lý lỗi thiết bị (Kỹ thuật)',
      'Giao việc, coaching, quản lý KPI (Cấp quản lý)'
    ]
  },
  {
    id: 'E',
    title: 'Văn hóa & Thái độ',
    desc: 'Chuẩn mực tác phong và tư duy làm việc',
    color: 'bg-rose-600',
    lightColor: 'bg-rose-50 border-rose-100',
    icon: <HeartHandshake className="w-6 h-6 text-rose-600" />,
    courses: [
      'Tư duy phục vụ khách hàng tận tâm',
      'Tư duy trách nhiệm: Không đổ lỗi, không né việc',
      'Tư duy học tập liên tục để thích nghi',
      'Tác phong làm việc chuyên nghiệp, có checklist'
    ]
  },
  {
    id: 'F',
    title: 'Phát triển Quản lý',
    desc: 'Quy hoạch đội kế cận và thúc đẩy năng suất',
    color: 'bg-fuchsia-600',
    lightColor: 'bg-fuchsia-50 border-fuchsia-100',
    icon: <UserPlus className="w-6 h-6 text-fuchsia-600" />,
    courses: [
      'Lộ trình thăng tiến cán bộ nòng cốt',
      'Lập kế hoạch và đo lường hiệu suất (SLA, Tỉ lệ chốt...)',
      'Văn hoá coaching nâng chuẩn đội ngũ'
    ]
  }
];

export const CULTURE_PILLARS = [
  {
    title: 'Học để làm được',
    desc: 'Đào tạo phải tăng số, giảm lỗi, giữ khách. Không học lý thuyết suông.'
  },
  {
    title: 'Hiệu quả đo lường',
    desc: 'Đánh giá dựa trên năng lực giải quyết công việc, không theo cảm tính.'
  },
  {
    title: 'Thưởng số thực tế',
    desc: 'Thưởng theo KPIs rõ ràng: tỷ lệ chốt, gia hạn, giảm đổi trả.'
  },
  {
    title: 'Không đổ lỗi',
    desc: 'Nhận theo dõi việc là làm tới cùng, phối hợp để cùng chung mục tiêu.'
  },
  {
    title: 'Vòng đời Khách hàng',
    desc: 'Giữ chân khách cũ cũng mang lại lợi nhuận tương đương có khách mới.'
  },
  {
    title: 'Cơ hội phát triển',
    desc: 'Minh bạch số liệu và KPI, ai tạo ra giá trị lớn sẽ có lộ trình thăng tiến.'
  }
];

export const CORE_VALUES = [
  { id: '1', title: 'Chủ động', desc: 'Nhìn việc là làm, không chờ giao.' },
  { id: '2', title: 'Chính xác', desc: 'Thông tin và quy trình luôn chuẩn.' },
  { id: '3', title: 'Trách nhiệm', desc: 'Có lỗi tự nhận và khắc phục triệt để.' },
  { id: '4', title: 'Học hỏi', desc: 'Liên tục cập nhật kiến thức SIM/Wifi.' },
  { id: '5', title: 'Hiệu quả', desc: 'Tất cả hoạt động đều đo bằng năng suất.' }
];

export const ONBOARDING_CONTENT: Record<string, { title: string, content: React.ReactNode }> = {
  'Giới thiệu công ty và mô hình doanh thu': {
    title: 'Giới thiệu công ty và Hệ sinh thái dịch vụ',
    content: (
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Globe2 className="w-5 h-5" /></div>
            <h5 className="font-bold text-slate-900 text-lg">1. Tầm nhìn & Sứ mệnh</h5>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-100">
            Khởi đầu từ dịch vụ viễn thông, <strong className="text-slate-800">Sky Mobile Japan</strong> định hướng trở thành <strong className="text-blue-600">Doanh nghiệp Thương mại Việt - Nhật</strong> hàng đầu. 
            Sứ mệnh của chúng tôi là xây dựng một hệ sinh thái dịch vụ toàn diện, giúp cộng đồng người Việt tại Nhật Bản an cư, lạc nghiệp và tận hưởng cuộc sống tiện nghi không rào cản ngôn ngữ hay thủ tục pháp lý.
          </p>
        </section>
        
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Layers className="w-5 h-5" /></div>
            <h5 className="font-bold text-slate-900 text-lg">2. Hệ sinh thái Dịch vụ (Đang dạng hóa)</h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-2 bg-blue-500 text-white text-[10px] font-bold rounded-bl-lg">CORE</div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h6 className="font-bold text-slate-800 mb-2">Viễn thông Di động</h6>
              <p className="text-xs text-slate-500 mb-4 flex-grow">Cung cấp SIM Data, SIM Nghe gọi, Pocket Wifi 5G. Nhóm sản phẩm "trải đường" tạo phễu khách hàng khổng lồ.</p>
              
              <div className="pt-3 border-t border-slate-100 mt-auto">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Mạng lưới Đối tác</p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-2 py-1 bg-white rounded border border-slate-100 flex items-center justify-center">
                    <img src={docomoLogo} alt="docomo" className="h-3 md:h-4 w-auto object-contain" />
                  </div>
                  <div className="px-2 py-1 bg-white rounded border border-slate-100 flex items-center justify-center">
                    <img src={softbankLogo} alt="SoftBank" className="h-3 md:h-4 w-auto object-contain" />
                  </div>
                  <div className="px-2 py-1 bg-white rounded border border-slate-100 flex items-center justify-center">
                    <img src={auLogo} alt="au" className="h-3 md:h-4 w-auto object-contain" />
                  </div>
                  <div className="px-2 py-1 bg-white rounded border border-slate-100 flex items-center justify-center">
                    <img src={rakutenLogo} alt="Rakuten" className="h-3 md:h-4 w-auto object-contain max-w-[60px]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-amber-500 text-white text-[10px] font-bold rounded-bl-lg">NEW</div>
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h6 className="font-bold text-slate-800 mb-2">Tiện ích Đời sống (Điện, Nước)</h6>
              <p className="text-xs text-slate-500">Hỗ trợ trọn gói thủ tục đăng ký, thiết lập thanh toán các dịch vụ Điện, Nước, Ga tại Nhật bằng tiếng Việt.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-indigo-500 text-white text-[10px] font-bold rounded-bl-lg">NEW</div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Wifi className="w-5 h-5" />
              </div>
              <h6 className="font-bold text-slate-800 mb-2">Viễn thông Cố định (Hikari)</h6>
              <p className="text-xs text-slate-500">Lắp đặt Internet cáp quang tốc độ cao (Hikari) và điện thoại bàn, bảo mật hạ tầng mạng hộ gia đình.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-rose-200 shadow-sm opacity-80">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h6 className="font-bold text-slate-800 mb-2">Thương mại B2B & Tuyển dụng</h6>
              <p className="text-xs text-slate-500">Tầm nhìn dài hạn: Cầu nối giao thương, hỗ trợ việc làm và các dịch vụ định cư cho người Việt tại Nhật.</p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  'Cơ cấu tổ chức & Vai trò các phòng ban': {
    title: 'Cơ cấu tổ chức & Vai trò các phòng ban',
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 text-sm">Với tầm nhìn mới, hệ thống chúng ta vận hành tối ưu phễu khách hàng qua mô hình phối hợp 3 chân kiềng vững chắc cho mảng Viễn thông cốt lõi:</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="font-bold text-slate-900">MKT</div>
            <div className="text-slate-500 mt-1">Tìm khách (Lead)</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-bold text-blue-700">SALE</div>
            <div className="text-blue-500 mt-1">Chốt đơn</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="font-bold text-emerald-700">CSKH</div>
            <div className="text-emerald-500 mt-1">Gia hạn</div>
          </div>
        </div>
        <section>
          <h5 className="font-bold text-slate-900 mb-2">Đội ngũ Vận hành</h5>
          <p className="text-slate-600 text-sm">Ban Giám đốc định hướng chiến lược. Khối Hành chính - Nhân sự, Tài chính - Kế toán, và Kỹ thuật & Hạ tầng sẽ đóng vai trò hỗ trợ, đảm bảo vận hành linh hoạt cho cả giải pháp SIM/WiFi và các dịch vụ tương lai.</p>
        </section>
      </div>
    )
  },
  'Nội quy, quy trình báo cáo & bảo mật': {
    title: 'Nội quy, quy trình báo cáo & bảo mật',
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">🕒</div>
            <div>
              <h6 className="font-bold text-slate-900 text-sm">Giờ giấc & Báo cáo</h6>
              <p className="text-slate-600 text-xs mt-1">Báo cáo chỉ số KPI ngày trước 18h hàng ngày trên nhóm Slack chính thức. Dù phát triển đa ngành, tính kỷ luật vẫn là yếu tố tiên quyết.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center shrink-0">🔒</div>
            <div>
              <h6 className="font-bold text-slate-900 text-sm">Bảo mật thông tin</h6>
              <p className="text-slate-600 text-xs mt-1">Cấm tuyệt đối tiết lộ thông tin khách hàng, kịch bản tư vấn và danh sách giá nhập. Thông tin khách hàng chính là tài sản quý giá nhất để khai thác đa dịch vụ.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
};
