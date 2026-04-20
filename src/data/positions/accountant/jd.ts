import { JobDescription } from '../../../types';

export const accountantJD: JobDescription = {
  title: 'Nhân viên kế toán tổng hợp',
  objective: 'Quản lý toàn bộ hệ thống số liệu kế toán, kiểm soát dòng tiền, đối soát nhà mạng và hỗ trợ quản trị tài chính doanh nghiệp.',
  tasks: [
    'Đối soát doanh thu chi tiết từ hệ thống CRM với báo cáo nhà mạng và đối tác thanh toán',
    'Quản lý và thu hồi công nợ khách hàng, đối soát công nợ phải trả cho nhà cung cấp',
    'Theo dõi và báo cáo dòng tiền thực tế hàng ngày (VNĐ và JPY)',
    'Tính toán lương, thưởng, hoa hồng cho đội ngũ Sale và CSKH theo cơ chế công ty',
    'Kiểm kê kho SIM, Pocket WiFi định kỳ và đối soát với báo cáo vận hành',
    'Lập báo cáo tài chính nội bộ, báo cáo lời lỗ (P&L) hàng tháng trình Ban Giám Đốc',
    'Thực hiện các nghiệp vụ thuế, bảo hiểm và hồ sơ pháp lý liên quan tại Nhật/Việt Nam'
  ],
  powers: [
    'Truy xuất dữ liệu doanh thu và khách hàng trên hệ thống CRM',
    'Đề xuất cải tiến quy trình kiểm soát tài chính và tiết giảm chi phí vận hành',
    'Yêu cầu các bộ phận cung cấp chứng từ, số liệu liên quan đến thu chi kịp thời',
    'Từ chối thanh toán các khoản chi không đúng quy định hoặc thiếu chứng từ hợp lệ'
  ],
  kpis: [
    'Độ chính xác của số liệu đối soát (Sai số < 0.5%)',
    'Thời hạn hoàn thành báo cáo tài chính tháng (Trước ngày 5 hàng tháng)',
    'Tỷ lệ thu hồi công nợ đúng hạn',
    'Tính lương thưởng chính xác và đúng thời hạn cam kết'
  ],
  salaryRange: 'Thỏa thuận',
  baseSalary: 'Thỏa thuận',
  salaryCalculation: 'Lương cứng thỏa thuận + Thưởng hiệu quả định kỳ'
};
