import { JobDescription } from '../../../types';

export const cskhStaffJD: JobDescription = {
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
};
