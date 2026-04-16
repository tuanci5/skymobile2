import React from 'react';
import { Target, Monitor, Users, Settings, UserPlus, HeartHandshake } from 'lucide-react';

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
    title: 'Giới thiệu công ty và mô hình doanh thu',
    content: (
      <div className="space-y-6">
        <section>
          <h5 className="font-bold text-slate-900 mb-2">1. Sứ mệnh & Tầm nhìn</h5>
          <p className="text-slate-600 text-sm leading-relaxed">
            Sky Mobile Japan là đơn vị viễn thông hàng đầu cung cấp giải pháp kết nối (SIM, Wifi) cho cộng đồng người nước ngoài tại Nhật Bản. Sứ mệnh của chúng tôi là "Kết nối không rào cản", giúp mỗi người Việt sang Nhật đều dễ dàng tiếp cận internet.
          </p>
        </section>
        <section>
          <h5 className="font-bold text-slate-900 mb-2">2. Mô hình doanh thu cốt lõi</h5>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <li className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="font-bold text-blue-700 block text-xs uppercase mb-1">Dòng thu nhập A</span>
              <span className="text-sm">Bán lẻ thiết bị SIM Data & Pocket Wifi (Dòng tiền ngay)</span>
            </li>
            <li className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-700 block text-xs uppercase mb-1">Dòng thu nhập B</span>
              <span className="text-sm">Thu cước hàng tháng (Dòng tiền định kỳ & bền vững)</span>
            </li>
          </ul>
        </section>
      </div>
    )
  },
  'Cơ cấu tổ chức & Vai trò các phòng ban': {
    title: 'Cơ cấu tổ chức & Vai trò các phòng ban',
    content: (
      <div className="space-y-6">
        <p className="text-slate-600 text-sm">Vận hành theo mô hình phối hợp 3 chân kiềng để tối ưu phễu khách hàng:</p>
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
          <h5 className="font-bold text-slate-900 mb-2">Quản trị nòng cốt</h5>
          <p className="text-slate-600 text-sm">Ban Giám đốc định hướng chiến lược và hỗ trợ nguồn lực (Hành chính, Tài chính, Kỹ thuật).</p>
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
              <p className="text-slate-600 text-xs mt-1">Báo cáo chỉ số KPI ngày trước 18h hàng ngày trên nhóm Slack chính thức.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center shrink-0">🔒</div>
            <div>
              <h6 className="font-bold text-slate-900 text-sm">Bảo mật thông tin</h6>
              <p className="text-slate-600 text-xs mt-1">Tuyệt đối không tiết lộ thông tin khách hàng, kịch bản tư vấn và danh sách giá nhập ra bên ngoài.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
};
