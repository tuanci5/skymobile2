import React from 'react';
import { Target, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { ProcessStep } from '../types';

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 1,
    title: 'Tiếp cận (Marketing)',
    description: 'Chạy quảng cáo, xây dựng nội dung, thu hút khách hàng tiềm năng từ các kênh online.',
    icon: <Target className="w-6 h-6" />
  },
  {
    id: 2,
    title: 'Tư vấn & Chốt đơn (Sale)',
    description: 'Tiếp nhận khách, tư vấn gói cước phù hợp, chốt đơn hàng và xác nhận thanh toán.',
    icon: <MessageSquare className="w-6 h-6" />
  },
  {
    id: 3,
    title: 'Chăm sóc sau bán (CSKH)',
    description: 'Hỗ trợ kỹ thuật, nhắc gia hạn, duy trì mối quan hệ và phát sinh doanh thu tái mua.',
    icon: <Users className="w-6 h-6" />
  },
  {
    id: 4,
    title: 'Phát triển doanh thu',
    description: 'Tối ưu quy trình, nâng cao tỷ lệ gia hạn và khai thác giới thiệu khách mới.',
    icon: <TrendingUp className="w-6 h-6" />
  }
];
