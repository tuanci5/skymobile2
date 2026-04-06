import { Role } from '../../../types';
import { ShieldCheck } from 'lucide-react';
import React from 'react';

export const headRole: Role = {
  id: 'head',
  title: 'Trưởng phòng Kinh doanh – Marketing – CSKH',
  icon: React.createElement(ShieldCheck, { className: 'w-6 h-6' }),
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
};
