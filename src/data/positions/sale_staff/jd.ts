import { JobDescription } from '../../../types';

export const saleStaffJD: JobDescription = {
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
};
