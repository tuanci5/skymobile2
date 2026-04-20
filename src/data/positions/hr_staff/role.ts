import { Role } from '../../../types';
import { UserCheck } from 'lucide-react';
import React from 'react';

export const hrStaffRole: Role = {
  id: 'hr_staff',
  title: 'Nhân viên Hành chính & Nhân sự',
  icon: React.createElement(UserCheck, { className: 'w-6 h-6' }),
  color: 'bg-emerald-600',
  description: 'Quản lý tuyển dụng, hồ sơ nhân sự, duy trì văn hóa công ty và môi trường văn phòng.',
  tasks: [
    'Thực hiện quy trình tuyển dụng và hội nhập',
    'Quản lý hồ sơ, hợp đồng và bảo hiểm nhân sự',
    'Theo dõi ngày công và hỗ trợ quản lý phúc lợi',
    'Quản lý thiết bị và vật tư văn phòng',
    'Tổ chức sự kiện và xây dựng văn hóa doanh nghiệp'
  ],
  kpis: [
    { label: 'Tỉ lệ lấp đầy nhân sự (Tuyển dụng)', value: '%' },
    { label: 'Độ chính xác hồ sơ & công điểm', value: '%' },
    { label: 'Mức độ hài lòng nội bộ (eNPS)', value: '/10' }
  ]
};
