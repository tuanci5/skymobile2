import { JobDescription } from '../../../types';

export const saleLeadJD: JobDescription = {
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
  salaryRange: '12M - 18M VNĐ',
  baseSalary: '8M - 10M VNĐ',
  salaryCalculation: 'Lương cứng + % Doanh thu đội + Thưởng KPI đội'
};
