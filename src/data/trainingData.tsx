import React from 'react';
import { Target, Monitor, Users, Settings, UserPlus, HeartHandshake, Globe2, Layers, Smartphone, Lightbulb, Wifi, Briefcase, Network, ShieldCheck, FileText, Lock, Clock, CalendarCheck, AlertTriangle, Scale, Sparkles, Bot, Zap, Cpu } from 'lucide-react';

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
  },
  {
    id: 'G',
    title: 'Ứng dụng AI',
    desc: 'Tối ưu hiệu quả Marketing, Sale và CSKH bằng AI',
    color: 'bg-violet-600',
    lightColor: 'bg-violet-50 border-violet-100',
    icon: <Sparkles className="w-6 h-6 text-violet-600" />,
    courses: [
      'AI trong tối ưu nội dung & Marketing',
      'Sử dụng AI hỗ trợ tư vấn & chốt đơn',
      'Tự động hóa báo cáo & quản lý dữ liệu bằng AI'
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
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">docomo</span>
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded border border-slate-200">SoftBank</span>
                  <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">au</span>
                  <span className="px-2.5 py-1 bg-pink-50 text-pink-600 text-[10px] font-bold rounded border border-pink-100">Rakuten</span>
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
      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Clock className="w-6 h-6" /></div>
            <h4 className="text-xl font-bold text-slate-900">1. Ý thức kỷ luật & Báo cáo</h4>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
                <div>
                  <span className="font-bold text-slate-800">Báo cáo KPI định kỳ:</span>
                  <p className="text-slate-600 text-sm mt-1">Gửi báo cáo chỉ số mỗi ngày trước 18h00 trên nhóm Slack của bộ phận. Nội dung báo cáo phải trung thực, chính xác.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
                <div>
                  <span className="font-bold text-slate-800">Tác phong làm việc:</span>
                  <p className="text-slate-600 text-sm mt-1">Dù làm việc tại văn phòng hay từ xa, tính kỷ luật và sự cam kết về thời gian là yếu tố tiên quyết để đảm bảo sự phát triển của công ty đa ngành.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl"><ShieldCheck className="w-6 h-6" /></div>
            <h4 className="text-xl font-bold text-slate-900">2. Bảo mật thông tin (Tuyệt mật)</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-rose-600">
                <Lock className="w-5 h-5" />
                <h5 className="font-bold">Tài sản cần bảo vệ</h5>
              </div>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-x-3">
                    <span className="font-bold text-slate-800">Thông tin khách hàng:</span>
                    <span className="text-slate-600">Tên, SĐT, địa chỉ, ảnh giấy tờ tùy thân (thẻ ngoại kiều) - Đây là tài sản nhạy cảm nhất.</span>
                  </div>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-x-3">
                    <span className="font-bold text-slate-800">Bí mật kinh doanh:</span>
                    <span className="text-slate-600">Kịch bản chốt đơn, danh sách giá nhập, biên lợi nhuận, chiến lược Marketing.</span>
                  </div>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-x-3">
                    <span className="font-bold text-slate-800">Dữ liệu hệ thống:</span>
                    <span className="text-slate-600">Tài khoản quản trị, mã nguồn, mật khẩu công cụ công ty.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
              <div className="flex items-center gap-2 mb-4 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h5 className="font-bold">Quy tắc "4 KHÔNG"</h5>
              </div>
              <ul className="space-y-3 text-sm text-rose-800 font-medium">
                <li className="flex items-center gap-2">1. KHÔNG chụp màn hình thông tin nhạy cảm gửi ra bên ngoài.</li>
                <li className="flex items-center gap-2">2. KHÔNG lưu trữ dữ liệu công ty trên các thiết bị cá nhân.</li>
                <li className="flex items-center gap-2">3. KHÔNG chia sẻ dữ liệu khách hàng chéo giữa các bộ phận.</li>
                <li className="flex items-center gap-2">4. KHÔNG sử dụng máy tính công cộng để login hệ thống.</li>
              </ul>
            </div>
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
              <Scale className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <h5 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-400">
                <Scale className="w-5 h-5" />
                Trách nhiệm & Cam kết pháp lý
              </h5>
              <div className="space-y-4 text-slate-300 text-sm">
                <p>Mỗi nhân viên khi gia nhập **Sky Mobile Japan** đều đã ký vào biên bản cam kết bảo mật thông tin (NDA). Bất kể hành vi vi phạm nào dù là vô tình hay hữu ý đều sẽ bị xử lý nghiêm khắc:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic">
                    "Đình chỉ công tác ngay lập tức và sa thải không bồi thường nếu phát hiện hành vi tuồn dữ liệu ra ngoài."
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic">
                    "Truy cứu trách nhiệm hình sự và dân sự (bồi thường thiệt hại) theo luật pháp Nhật Bản & Việt Nam."
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 leading-relaxed italic">
                  * Hệ thống CRM và Slack có cơ chế giám sát tự động việc xuất dữ liệu và tần suất xem thông tin nhạy cảm. Hãy tự bảo vệ mình bằng cách tuân thủ tuyệt đối quy định của công ty.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
  'AI trong tối ưu nội dung & Marketing': {
    title: 'AI trong tối ưu nội dung & Marketing',
    content: (
      <div className="space-y-8">
        <section className="bg-gradient-to-br from-violet-50 to-white p-8 rounded-3xl border border-violet-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-600/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Sáng tạo nội dung bứt phá</h4>
          </div>
          <p className="text-slate-600 mb-6 italic">"Đừng làm việc chăm chỉ, hãy làm việc thông minh với sự hỗ trợ của trí tuệ nhân tạo."</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm leading-relaxed">
              <h5 className="font-bold text-violet-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Viết kịch bản & Content
              </h5>
              <p className="text-sm text-slate-600">Sử dụng **ChatGPT/Gemini** để lên ý tưởng vỉal video, kịch bản chốt đơn và bài viết quảng cáo chuẩn insight người Việt tại Nhật.</p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm leading-relaxed">
              <h5 className="font-bold text-violet-700 mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Thiết kế & Media AI
              </h5>
              <p className="text-sm text-slate-600">Tạo hình ảnh quảng cáo chuyên nghiệp với **Canva AI/Midjourney** và video người ảo nói tiếng Việt với **D-ID/HeyGen**.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h5 className="font-bold text-slate-900 border-l-4 border-violet-600 pl-3">Quy trình thực hiện</h5>
          <div className="space-y-3">
            {[
              { t: 'Nghiên cứu thị trường', d: 'Dùng AI phân tích hành vi khách hàng và các gói cước đối thủ.' },
              { t: 'Tạo nội dung thô', d: 'Yêu cầu AI đưa ra 5-10 phương án tiêu đề và nội dung bài viết.' },
              { t: 'Tối ưu và Kiểm tra', d: 'Con người kiểm tra tính xác thực, chỉnh sửa văn phong cho phù hợp văn hóa.' }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 font-bold text-sm">{i+1}</div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{step.t}</div>
                  <div className="text-slate-500 text-xs mt-1">{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  },
  'Sử dụng AI hỗ trợ tư vấn & chốt đơn': {
    title: 'Sử dụng AI hỗ trợ tư vấn & chốt đơn',
    content: (
      <div className="space-y-8">
        <section className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
              <Bot className="w-7 h-7" />
            </div>
            <h5 className="font-bold text-slate-900 mb-2">Trợ lý AI 24/7</h5>
            <p className="text-xs text-slate-600 leading-relaxed">Chatbot tự động trả lời các câu hỏi thường gặp về gói cước, thủ tục và phí phát sinh.</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
              <Globe2 className="w-7 h-7" />
            </div>
            <h5 className="font-bold text-slate-900 mb-2">Dịch thuật tức thì</h5>
            <p className="text-xs text-slate-600 leading-relaxed">Xử lý tài liệu tiếng Nhật, giao tiếp với nhà mạng hoặc hỗ trợ khách nước ngoài chuyên nghiệp.</p>
          </div>
          <div className="p-6 bg-violet-50 rounded-3xl border border-violet-100 text-center">
            <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/20">
              <Lightbulb className="w-7 h-7" />
            </div>
            <h5 className="font-bold text-slate-900 mb-2">Gợi ý kịch bản</h5>
            <p className="text-xs text-slate-600 leading-relaxed">AI phân tích nhu cầu và gợi ý gói cước tối ưu cùng cách thuyết phục phù hợp nhất cho từng khách.</p>
          </div>
        </section>

        <section className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 italic">
            <Zap className="w-5 h-5 text-amber-500" /> Lưu ý: AI không thay thế con người trong cảm xúc và sự chân thành.
          </h5>
          <p className="text-sm text-slate-600">Hãy sử dụng AI như một công cụ hỗ trợ thông tin nhanh, nhưng việc chốt đơn cuối cùng phụ thuộc vào sự tin tưởng và thái độ phục vụ của chính bạn.</p>
        </section>
      </div>
    )
  },
  'Tự động hóa báo cáo & quản lý dữ liệu bằng AI': {
    title: 'Tự động hóa báo cáo & quản lý dữ liệu bằng AI',
    content: (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-900 text-white p-10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />
          <div className="relative z-10 flex-1">
            <h4 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-violet-400" /> Quản trị bằng dữ liệu AI
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">Tự động hóa các tác vụ lặp đi lặp lại để dành thời gian cho những chiến lược quan trọng hơn.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span>Tự động phân tích KPI từ file Excel/Google Sheets.</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span>Dự báo xu hướng doanh thu và số lượng lead.</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span>Kết nối các công cụ làm việc (Slack, CRM, Mail) bằng AI.</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 hidden lg:block">
            <div className="w-48 h-48 rounded-full border-8 border-violet-500/20 flex items-center justify-center animate-pulse">
              <Zap className="w-24 h-24 text-violet-400 shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }
};
