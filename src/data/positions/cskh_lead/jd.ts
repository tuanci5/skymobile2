import { JobDescription } from '../../../types';

export const cskhLeadJD: JobDescription = {
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
};
