import React from 'react';
import { ShieldCheck, Megaphone, MessageSquare, HeartHandshake } from 'lucide-react';
import { JobDescription, Role } from '../types';

export const JD_DATA: Record<string, JobDescription> = {
  'head': {
    title: 'Trưởng phòng Kinh doanh – Marketing – CSKH',
    objective: 'Chịu trách nhiệm quản lý toàn bộ hoạt động marketing, tư vấn/chốt đơn, chăm sóc sau bán, gia hạn và phát triển doanh thu.',
    tasks: [
      'Xây dựng kế hoạch doanh thu theo tuần/tháng/quý',
      'Lập kế hoạch marketing và phân bổ ngân sách quảng cáo',
      'Quản lý hoạt động tiếp nhận khách hàng từ các kênh online',
      'Tổ chức quy trình tư vấn, chốt đơn và chăm sóc khách hàng',
      'Phối hợp giữa marketing, sale và CSKH để tối ưu hiệu quả toàn phòng',
      'Theo dõi chất lượng lead, tỷ lệ chốt, tỷ lệ gia hạn',
      'Phân tích dữ liệu vận hành để phát hiện điểm nghẽn',
      'Tuyển dụng, đào tạo, phân công và đánh giá nhân sự'
    ],
    powers: [
      'Phân công và điều phối công việc trong phòng',
      'Đề xuất tuyển dụng, điều chuyển, khen thưởng, kỷ luật',
      'Đề xuất ngân sách marketing, thưởng doanh số'
    ],
    kpis: [
      'Tổng doanh thu',
      'Doanh thu khách mới',
      'Doanh thu gia hạn/tái mua',
      'Tỷ lệ chuyển đổi từ lead sang đơn hàng',
      'Hiệu quả chi phí marketing (ROI)'
    ],
    salaryRange: '25M - 40M VNĐ',
    salaryCalculation: 'Lương cứng + % Doanh thu toàn phòng + Thưởng KPI tổng'
  },
  'mkt_lead': {
    title: 'Trưởng nhóm Marketing',
    objective: 'Tổ chức và triển khai hoạt động marketing thu hút đúng khách hàng mục tiêu là người nước ngoài tại Nhật.',
    tasks: [
      'Xây dựng kế hoạch marketing theo tuần/tháng',
      'Triển khai quảng cáo trên FB, TikTok, Google, Instagram',
      'Định hướng nội dung truyền thông theo từng nhóm khách hàng',
      'Theo dõi số lượng và chất lượng lead từ từng kênh',
      'Tổ chức sản xuất nội dung: bài viết, hình ảnh, video, landing page',
      'Quản lý fanpage, social media, group cộng đồng'
    ],
    kpis: [
      'Số lượng lead/inbox/form',
      'Chi phí trên mỗi lead',
      'Tỷ lệ lead đúng tệp',
      'Tỷ lệ chuyển đổi từ lead sang tư vấn'
    ],
    salaryRange: '20M - 30M VNĐ',
    salaryCalculation: 'Lương cứng + Thưởng theo số lượng Lead chất lượng'
  },
  'sale_lead': {
    title: 'Trưởng nhóm Sale/Tư vấn',
    objective: 'Quản lý đội ngũ tư vấn, đảm bảo tiếp nhận khách nhanh, tư vấn đúng nhu cầu và đạt tỷ lệ chốt đơn.',
    tasks: [
      'Phân chia lead cho nhân viên tư vấn',
      'Giám sát tốc độ phản hồi khách hàng',
      'Theo dõi tỷ lệ chốt đơn của từng nhân viên',
      'Chuẩn hóa kịch bản tư vấn theo từng nhóm nhu cầu',
      'Hướng dẫn nhân viên xử lý tình huống khó',
      'Phối hợp với marketing để phản hồi chất lượng lead'
    ],
    kpis: [
      'Tỷ lệ phản hồi khách hàng đúng thời gian',
      'Tỷ lệ chốt đơn của đội',
      'Doanh thu của đội tư vấn',
      'Chất lượng cập nhật thông tin khách hàng'
    ],
    salaryRange: '20M - 30M VNĐ',
    salaryCalculation: 'Lương cứng + % Doanh thu đội + Thưởng KPI đội'
  },
  'cskh_lead': {
    title: 'Trưởng nhóm Chăm sóc khách hàng',
    objective: 'Tổ chức hoạt động chăm sóc sau bán đảm bảo khách sử dụng ổn định, hài lòng và phát sinh gia hạn/tái mua.',
    tasks: [
      'Xây dựng quy trình CSKH sau bán',
      'Phân công danh sách khách cần chăm sóc',
      'Theo dõi tỷ lệ hỗ trợ thành công',
      'Kiểm soát việc nhắc gia hạn, đổi gói',
      'Theo dõi phản hồi và khiếu nại',
      'Tổng hợp các lỗi, vấn đề khách thường gặp'
    ],
    kpis: [
      'Tỷ lệ khách được chăm sóc đúng hạn',
      'Tỷ lệ gia hạn',
      'Tỷ lệ xử lý vấn đề thành công',
      'Doanh thu từ khách cũ'
    ],
    salaryRange: '18M - 25M VNĐ',
    salaryCalculation: 'Lương cứng + % Doanh thu gia hạn toàn đội + Thưởng KPI CSKH'
  },
  'sale_staff': {
    title: 'Nhân viên Sale/Chat Tư vấn',
    objective: 'Tiếp nhận khách hàng, xác định nhu cầu và tư vấn gói SIM Data hoặc Pocket WiFi phù hợp để chốt đơn.',
    tasks: [
      'Trả lời inbox, chat, điện thoại, form đăng ký',
      'Xác định nhu cầu: Mới sang Nhật? Cá nhân/Nhóm? Ngắn/Dài hạn?',
      'Tư vấn gói phù hợp theo nhu cầu và ngân sách',
      'Giải thích bảng giá, ưu đãi, cách tính cước',
      'Chốt đơn, lấy thông tin nhận hàng, xác nhận thanh toán',
      'Theo dõi lại khách chưa chốt (Follow-up)'
    ],
    kpis: [
      'Thời gian phản hồi (< 2 phút)',
      'Số khách được tư vấn',
      'Tỷ lệ chốt đơn',
      'Doanh thu cá nhân'
    ],
    salaryRange: '10M - 15M VNĐ + Hoa hồng',
    salaryCalculation: 'Lương cứng + % Hoa hồng trên đơn hàng mới'
  },
  'cskh_staff': {
    title: 'Nhân viên Chăm sóc khách hàng',
    objective: 'Hỗ trợ khách hàng sau bán, đảm bảo khách sử dụng được dịch vụ và duy trì mối quan hệ để gia hạn.',
    tasks: [
      'Xác nhận khách đã nhận hàng và hướng dẫn lắp SIM/WiFi',
      'Hỗ trợ cài đặt APN, xử lý lỗi kết nối cơ bản',
      'Nhắc gia hạn trước kỳ cước',
      'Tư vấn đổi gói nếu nhu cầu khách thay đổi',
      'Xin đánh giá, phản hồi, lời giới thiệu từ khách hàng'
    ],
    kpis: [
      'Tỷ lệ khách sử dụng thành công sau mua',
      'Tỷ lệ gia hạn',
      'Số khách tái mua/giới thiệu thêm',
      'Mức độ hài lòng của khách hàng'
    ],
    salaryRange: '10M - 15M VNĐ + Thưởng gia hạn',
    salaryCalculation: 'Lương cứng + % Thưởng trên doanh thu gia hạn'
  },
  'mkt_ads': {
    title: 'Nhân viên Marketing Ads',
    objective: 'Triển khai và tối ưu hoạt động quảng cáo để tạo ra khách hàng tiềm năng chất lượng.',
    tasks: [
      'Thiết lập và vận hành chiến dịch quảng cáo',
      'Theo dõi ngân sách, hiệu suất quảng cáo hàng ngày',
      'Tối ưu tệp khách hàng mục tiêu',
      'Tối ưu mẫu quảng cáo, nội dung, chi phí',
      'Phối hợp với content để cải thiện thông điệp'
    ],
    kpis: [
      'Số lead thu về',
      'Giá mỗi lead',
      'Tỷ lệ lead hợp lệ',
      'Hiệu suất ngân sách quảng cáo'
    ],
    salaryRange: '12M - 18M VNĐ',
    salaryCalculation: 'Lương cứng + Thưởng theo hiệu quả Ads (Lead/Cost)'
  },
  'mkt_content': {
    title: 'Nhân viên Content Marketing',
    objective: 'Xây dựng nội dung thu hút đúng nhu cầu khách hàng, giúp tăng lượng khách quan tâm.',
    tasks: [
      'Viết nội dung quảng cáo, bài đăng fanpage, bài social',
      'Xây dựng nội dung theo từng nhóm khách (Mới sang, ở KTX...)',
      'Phối hợp với sale để cập nhật câu hỏi thường gặp',
      'Viết nội dung cho các chương trình khuyến mãi, gia hạn',
      'Hỗ trợ viết kịch bản video ngắn, tin nhắn mẫu'
    ],
    kpis: [
      'Số lượng nội dung triển khai đúng kế hoạch',
      'Mức độ tương tác của nội dung',
      'Tỷ lệ chuyển đổi từ nội dung sang inbox/form'
    ],
    salaryRange: '10M - 15M VNĐ',
    salaryCalculation: 'Lương cứng + Thưởng theo tương tác/chuyển đổi nội dung'
  },
  'mkt_media': {
    title: 'Nhân viên Media/Thiết kế',
    objective: 'Thiết kế hình ảnh, video, ấn phẩm truyền thông phục vụ quảng bá sản phẩm.',
    tasks: [
      'Thiết kế banner, hình ảnh quảng cáo, bài đăng social',
      'Dựng video ngắn giới thiệu sản phẩm, hướng dẫn sử dụng',
      'Thiết kế hình ảnh bảng giá, infographic, hướng dẫn cài đặt',
      'Hỗ trợ chỉnh sửa ấn phẩm theo từng chiến dịch'
    ],
    kpis: [
      'Tiến độ hoàn thành ấn phẩm',
      'Chất lượng hình ảnh/video',
      'Mức độ phù hợp với khách hàng mục tiêu'
    ],
    salaryRange: '10M - 15M VNĐ',
    salaryCalculation: 'Lương cứng + Thưởng theo tiến độ/chất lượng ấn phẩm'
  },
  'telesale': {
    title: 'Nhân viên Telesales',
    objective: 'Gọi điện cho khách hàng để xác nhận nhu cầu, tư vấn và chốt đơn.',
    tasks: [
      'Gọi điện cho khách hàng ngay sau khi nhận lead',
      'Xác minh nhu cầu sử dụng và tư vấn gói phù hợp',
      'Chốt đơn qua điện thoại',
      'Theo dõi khách chưa chốt và nhắc khách hoàn tất đơn hàng'
    ],
    kpis: [
      'Tỷ lệ gọi thành công',
      'Tỷ lệ chốt qua điện thoại',
      'Doanh thu từ data telesales'
    ],
    salaryRange: '8M - 12M VNĐ + Hoa hồng',
    salaryCalculation: 'Lương cứng + % Hoa hồng trên đơn hàng chốt được'
  },
  'crm': {
    title: 'Nhân viên Quản lý dữ liệu / CRM',
    objective: 'Quản lý dữ liệu khách hàng xuyên suốt để hỗ trợ việc vận hành và báo cáo.',
    tasks: [
      'Nhập và cập nhật dữ liệu khách hàng từ các nguồn',
      'Theo dõi trạng thái lead, đơn hàng, gia hạn',
      'Phân loại khách mới, khách cũ, khách cần follow-up',
      'Lập báo cáo dữ liệu định kỳ'
    ],
    kpis: [
      'Tỷ lệ chính xác dữ liệu',
      'Tỷ lệ cập nhật đúng hạn',
      'Chất lượng báo cáo'
    ],
    salaryRange: '10M - 15M VNĐ',
    salaryCalculation: 'Lương cứng + Thưởng KPI vận hành/báo cáo'
  },
  'ops': {
    title: 'Nhân viên Xử lý đơn hàng / Vận hành',
    objective: 'Đảm bảo đơn hàng được xác nhận, chuẩn bị và bàn giao đúng, đủ, nhanh chóng.',
    tasks: [
      'Tiếp nhận thông tin đơn hàng từ sale',
      'Kiểm tra thông tin khách hàng, sản phẩm, địa chỉ',
      'Phối hợp chuẩn bị SIM/Pocket WiFi theo đơn',
      'Theo dõi tình trạng giao hàng và cập nhật trạng thái'
    ],
    kpis: [
      'Tỷ lệ xử lý đơn đúng hạn',
      'Tỷ lệ sai sót đơn hàng',
      'Tốc độ xử lý đơn'
    ],
    salaryRange: '8M - 12M VNĐ',
    salaryCalculation: 'Lương cứng + Thưởng KPI vận hành'
  }
};

export const ROLES: Role[] = [
  {
    id: 'head',
    title: 'Trưởng phòng Kinh doanh – Marketing – CSKH',
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'bg-blue-600',
    description: 'Quản lý tổng thể chuỗi thu hút khách, chốt đơn và chăm sóc sau bán.',
    tasks: [
      'Xây dựng kế hoạch doanh thu và ngân sách marketing',
      'Giám sát quy trình tiếp nhận và xử lý khách hàng online',
      'Phối hợp giữa các tổ để tối ưu tỷ lệ chuyển đổi (CR)',
      'Phân tích dữ liệu doanh thu, gia hạn và tái mua',
      'Đảm bảo chất lượng phục vụ khách hàng người nước ngoài'
    ],
    kpis: [
      { label: 'Tổng doanh thu', value: 'Yên/VNĐ' },
      { label: 'Doanh thu gia hạn', value: 'Yên/VNĐ' },
      { label: 'Tỷ lệ chuyển đổi phễu', value: '%' },
      { label: 'ROI Marketing', value: 'x Lần' }
    ]
  },
  {
    id: 'marketing',
    title: 'Tổ Marketing',
    icon: <Megaphone className="w-6 h-6" />,
    color: 'bg-indigo-500',
    focusArea: 'Người mới sang Nhật, Thực tập sinh, Du học sinh',
    description: 'Tạo khách hàng tiềm năng và đưa khách vào các kênh tư vấn (Inbox/LINE).',
    tasks: [
      'Chạy Ads (FB, TikTok, Google) nhắm đúng tệp người Việt tại Nhật',
      'Xây dựng nội dung cho fanpage, hội nhóm, landing page',
      'Seeding trong cộng đồng người nước ngoài tại Nhật',
      'Thiết kế hình ảnh/video giới thiệu SIM/WiFi trực quan',
      'Đo lường chất lượng khách hàng từ từng kênh quảng cáo'
    ],
    kpis: [
      { label: 'Số lead/inbox/form', value: 'Leads' },
      { label: 'Chi phí mỗi lead', value: 'Yên' },
      { label: 'Tỷ lệ lead đúng tệp', value: '%' }
    ]
  },
  {
    id: 'sales',
    title: 'Tổ Sale / Tư vấn',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'bg-emerald-500',
    focusArea: 'Tư vấn giải pháp viễn thông theo hoàn cảnh',
    description: 'Tiếp nhận khách hàng từ Marketing và chuyển đổi thành đơn hàng.',
    tasks: [
      'Phản hồi siêu tốc tin nhắn, cuộc gọi, form đăng ký',
      'Hỏi nhu cầu: Mới sang Nhật? Cá nhân/Nhóm? Ngắn/Dài hạn?',
      'Tư vấn gói SIM hoặc Pocket WiFi phù hợp nhất',
      'Giải thích giá, ưu đãi, cách tính cước và thời điểm mua',
      'Chốt đơn và xác nhận thông tin giao hàng/thanh toán'
    ],
    kpis: [
      { label: 'Tỷ lệ chốt đơn', value: '%' },
      { label: 'Thời gian phản hồi', value: '< 2 Phút' },
      { label: 'Doanh thu cá nhân', value: 'Yên' }
    ]
  },
  {
    id: 'cskh',
    title: 'Tổ Chăm sóc khách hàng',
    icon: <HeartHandshake className="w-6 h-6" />,
    color: 'bg-rose-500',
    focusArea: 'Hỗ trợ kỹ thuật & Gia hạn doanh thu',
    description: 'Đảm bảo khách dùng được dịch vụ và phát sinh doanh thu tiếp theo.',
    tasks: [
      'Xác nhận nhận hàng và hướng dẫn cài đặt APN/kích hoạt',
      'Hỗ trợ xử lý lỗi kết nối mạng cơ bản cho khách',
      'Nhắc gia hạn cước trước hạn để tránh gián đoạn',
      'Tư vấn đổi gói data khi nhu cầu khách thay đổi',
      'Khai thác giới thiệu khách mới từ khách hàng cũ'
    ],
    kpis: [
      { label: 'Tỷ lệ gia hạn', value: '%' },
      { label: 'Số lượt giới thiệu', value: 'Referrals' },
      { label: 'Tỷ lệ xử lý sự cố', value: '%' }
    ]
  }
];
