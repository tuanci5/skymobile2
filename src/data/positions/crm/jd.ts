import { JobDescription } from '../../../types';

export const crmJD: JobDescription = {
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
};
