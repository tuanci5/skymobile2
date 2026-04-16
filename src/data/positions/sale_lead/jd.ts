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
  salaryCalculation: 'Lương cứng + % Doanh thu đội + Thưởng KPI đội',
  salaryDetail: {
    formula: 'Lương cứng + (Doanh thu đội × %HH) + Thưởng KPI theo hiệu suất đội',
    commissions: [
      { label: '% Hoa hồng doanh thu đội', value: '1.0% - 1.5%' }
    ],
    bonuses: [
      { label: 'Đạt 100% KPI đội', value: '+ Thưởng 2M - 4M' },
      { label: 'Vượt 120% KPI đội', value: 'Thưởng nóng đặc biệt' }
    ]
  },
  kpiWeights: [
    { label: 'Doanh thu (Số đơn mới)', weight: 70, color: 'bg-emerald-600' },
    { label: 'Tỷ lệ phản hồi đúng hạn', weight: 20, color: 'bg-blue-600' },
    { label: 'Chất lượng tư vấn', weight: 10, color: 'bg-indigo-600' }
  ]
};
