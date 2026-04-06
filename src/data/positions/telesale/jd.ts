import { JobDescription } from '../../../types';

export const telesaleJD: JobDescription = {
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
};
