import { Role } from '../../../types';
import { HeadphonesIcon } from 'lucide-react';
import React from 'react';

export const jpSupportAfterSalesRole: Role = {
  id: 'jp_support_after_sales',
  title: 'Nhân viên tiếng Nhật (Hậu mãi)',
  icon: React.createElement(HeadphonesIcon, { className: 'w-6 h-6' }),
  color: 'bg-red-500',
  description: 'Thực hiện 100% dịch vụ sau bán cho khách hàng WiFi, Điện, Ga, làm việc với nhà mạng Nhật.',
  tasks: [
    'Xử lý hồ sơ và tiến độ với nhà mạng',
    'Chăm sóc khách hàng và hạn chế hủy',
    'Theo dõi công nợ, lắp đặt, hoàn tiền',
    'Tham gia phát triển dự án tệp khách Nhật'
  ],
  kpis: [
    { label: 'Chỉ tiêu hồ sơ tháng', value: '≥ 80' },
    { label: 'Tỷ lệ CSKH trong 24h', value: '100%' },
    { label: 'Tỷ lệ khách hủy đơn', value: '%' }
  ]
};
