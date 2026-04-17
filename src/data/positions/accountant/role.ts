import { Role } from '../../../types';
import { Calculator } from 'lucide-react';
import React from 'react';

export const accountantRole: Role = {
  id: 'accountant',
  title: 'Kế toán tổng hợp',
  icon: React.createElement(Calculator, { className: 'w-6 h-6' }),
  color: 'bg-rose-600',
  description: 'Quản lý tài chính, đối soát doanh thu và kiểm soát dòng tiền.',
  tasks: [
    'Đối soát doanh thu nhà mạng và các cổng thanh toán',
    'Quản lý công nợ khách hàng và đối tác',
    'Tính lương, thưởng và hoa hồng định kỳ',
    'Lập báo cáo P&L và cân đối dòng tiền hàng tháng',
    'Kiểm soát chi phí vận hành và định mức tồn kho'
  ],
  kpis: [
    { label: 'Độ chính xác dữ liệu', value: '%' },
    { label: 'Tiến độ báo cáo tháng', value: 'Ngày' },
    { label: 'Hiệu quả thu hồi công nợ', value: '%' }
  ]
};
