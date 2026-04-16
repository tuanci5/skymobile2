import React from 'react';
import { Target, Monitor, Users, Settings, UserPlus, HeartHandshake, Globe2, Layers, Smartphone, Lightbulb, Wifi, Briefcase, Network, ShieldCheck, FileText, Lock, Clock, CalendarCheck } from 'lucide-react';

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
            <div className="p-5 bg-white rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-blue-500 text-white text-[10px] font-bold rounded-bl-lg">CORE</div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h6 className="font-bold text-slate-800 mb-2">Viễn thông Di động</h6>
              <p className="text-xs text-slate-500">Cung cấp SIM Data, SIM Nghe gọi, Pocket Wifi 5G. Nhóm sản phẩm "trải đường" tạo phễu khách hàng khổng lồ.</p>
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
    title: 'Cơ cấu Khối vận hành Thương mại',
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 text-sm mb-4">Với việc mở rộng hệ sinh thái dịch vụ, cấu trúc tổ chức của chúng ta hoạt động như một cỗ máy liên hoàn (Cross-selling):</p>
        
        <div className="space-y-4">
          <div className="flex gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Network className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h6 className="font-bold text-slate-900">Phòng MKT (Marketing & Lead Gen)</h6>
              <p className="text-xs text-slate-600 mt-1">Đảm nhiệm vai trò hút <strong className="text-blue-600">Khách hàng mới</strong>. Chạy chiến dịch phủ sóng cho không chỉ mảng SIM/Wifi mà còn tiếp cận các nhu cầu cấp thiết như chuyển nhà cần Cáp quang, Điện nước.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h6 className="font-bold text-blue-900">Phòng KD (Sales & Cross-sell)</h6>
              <p className="text-xs text-blue-800 mt-1">Thay vì chỉ tư vấn 1 sản phẩm rời rạc, <strong className="text-blue-600">Sale phải là một Cố vấn Giải pháp</strong>. Khách hỏi SIM &rarr; Tư vấn luôn combo Internet không giới hạn. Khách cần Internet nhà &rarr; Nhắc nhở thủ tục Điện/Nước.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h6 className="font-bold text-emerald-900">Phòng CSKH & Vận hành (Ops/Nghiệp vụ)</h6>
              <p className="text-xs text-emerald-800 mt-1">Quản lý vòng đời khách hàng. Phối hợp với nhà mạng, công ty điện nước để hoàn tất hồ sơ, cài đặt thiết bị và <strong className="text-emerald-700">duy trì tỷ lệ gia hạn/thanh toán cước liên tục.</strong></p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  'Nội quy, quy trình báo cáo & bảo mật': {
    title: 'Nội quy & Quy chế cốt lõi',
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 text-sm">Việc mở rộng đa ngành (đặc biệt liên quan hợp đồng Điện, Nước, Internet cáp quang) đòi hỏi tính chuyên nghiệp và nghiêm ngặt cực cao.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
            <div className="mb-3"><Lock className="w-6 h-6 text-red-600" /></div>
            <h6 className="font-bold text-red-900 mb-2">Bảo mật thông tin tuyệt đối</h6>
            <ul className="text-xs text-red-800 space-y-2 list-disc list-inside">
              <li>Không lộ thông tin cá nhân (Thẻ ngoại kiều, MyNumber, thẻ ngân hàng).</li>
              <li>Thông tin hợp đồng đa dịch vụ là tài sản công ty.</li>
              <li>Vi phạm có thể bị xử lý pháp lý.</li>
            </ul>
          </div>

          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="mb-3"><FileText className="w-6 h-6 text-indigo-600" /></div>
            <h6 className="font-bold text-indigo-900 mb-2">Độ chuẩn xác Hồ sơ (Ops)</h6>
            <ul className="text-xs text-indigo-800 space-y-2 list-disc list-inside">
              <li>Khai báo sai thông tin điện nước có thể dẫn đến cắt dịch vụ của khách.</li>
              <li>Phải đối chiếu giấy tờ gốc 100% trước khi submit hệ thống mạng.</li>
            </ul>
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 md:col-span-2">
            <div className="flex gap-3">
              <Clock className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h6 className="font-bold text-amber-900 mb-1">Văn hoá báo cáo KPIs & Slack</h6>
                <p className="text-xs text-amber-800">Cập nhật số liệu minh bạch trước 18:00 hàng ngày. Sử dụng Slack làm công cụ làm việc chính thức, không nhắn việc qua tin nhắn cá nhân để đảm bảo mọi đội nhóm (Cross-team) nắm bắt được luồng xử lý đa dịch vụ.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
};
