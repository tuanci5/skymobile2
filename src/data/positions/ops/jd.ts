import { JobDescription } from '../../../types';

export const opsJD: JobDescription = {
  title: 'Nhân viên Xử lý đơn hàng / Vận hành',
  objective: 'Đảm bảo đơn hàng được xác nhận, chuẩn bị và bàn giao đúng, đủ, nhanh chóng.',
  tasks: [
    'Tiếp nhận thông tin đơn hàng từ sale',
    'Kiểm tra thông tin khách hàng, sản phẩm, địa chỉ',
    'Phối hợp chuẩn bị SIM/Pocket WiFi theo đơn',
    'Theo dõi tình trạng giao hàng và cập nhật trạng thái'
  ],
  kpis: [
    'Tỷ lệ xử lý đơn đúng hạn',
    'Tỷ lệ sai sót đơn hàng',
    'Tốc độ xử lý đơn'
  ],
  salaryRange: '8M - 12M VNĐ',
  salaryCalculation: 'Lương cứng + Thưởng KPI vận hành'
};
