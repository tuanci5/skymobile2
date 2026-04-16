import { JobDescription } from '../../../types';

export const headJD: JobDescription = {
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
  salaryRange: '15M - 25M VNĐ',
  baseSalary: '10M - 12M VNĐ',
  salaryCalculation: 'Lương cứng + % Doanh thu toàn phòng + Thưởng KPI tổng',
  salaryDetail: {
    formula: 'Lương cứng + (Doanh số mới × %HH) + (Doanh số gia hạn × %Thưởng) + Thưởng KPI',
    commissions: [
      { label: '% Doanh số mới (Toàn bộ lead phòng)', value: '0.5%' },
      { label: '% Doanh số gia hạn (Kế thừa data phòng)', value: '1.0%' }
    ],
    bonuses: [
      { label: 'Đạt 80% KPI', value: '100% Lương cứng' },
      { label: 'Đạt 100% KPI', value: '+ Thưởng 3M - 5M' },
      { label: 'Vượt 120% KPI', value: 'Thưởng nóng + Vinh danh' }
    ]
  },
  kpiWeights: [
    { label: 'Marketing (Lead & Cost)', weight: 40, color: 'bg-blue-600' },
    { label: 'Sale (Doanh thu mới)', weight: 40, color: 'bg-emerald-600' },
    { label: 'CSKH (Tỷ lệ gia hạn)', weight: 20, color: 'bg-rose-600' }
  ]
};
