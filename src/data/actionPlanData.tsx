import React from 'react';
import { Users, GraduationCap, TrendingUp, Settings, Megaphone, HeartHandshake, Zap, Clock, Workflow, FileText, Sparkles } from 'lucide-react';

export interface ActionItem {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}

export interface MonthPlan {
  month: string;
  label: string;
  phase: string;
  description: string;
  actions: {
    recruitment: ActionItem;
    training: ActionItem;
    process: ActionItem;
    ai?: ActionItem;
    business: ActionItem;
    culture: ActionItem;
  };
}

export const ACTION_PLAN_4_MONTHS: MonthPlan[] = [
  {
    month: 'Tháng 4',
    label: '16/04 - 30/04',
    phase: 'Giai đoạn Chuẩn bị',
    description: 'Thiết lập nền móng, hoàn thiện bộ máy nòng cốt và chuẩn bị hạ tầng vận hành.',
    actions: {
      recruitment: {
        title: 'Tuyển dụng & Nhân sự',
        icon: <Users className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-600',
        items: [
          'Tuyển 2 Trưởng nhóm (Leads) nòng cốt',
          'Tuyển 4-6 Nhân viên tư vấn đợt 1',
          'Hoàn thiện JD và cơ chế lương thưởng (KPI)'
        ]
      },
      training: {
        title: 'Đào tạo',
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'bg-indigo-100 text-indigo-600',
        items: [
          'Đào tạo hội nhập về công ty & mô hình',
          'Đào tạo kiến thức sản phẩm SIM/WiFi Nhật',
          'Hướng dẫn sử dụng CRM, Slack, Công cụ chat'
        ]
      },
      process: {
        title: 'Quy trình làm việc',
        icon: <Workflow className="w-5 h-5" />,
        color: 'bg-purple-100 text-purple-600',
        items: [
          'Quy trình Tuyển dụng & Onboarding chuẩn',
          'Quy trình Phối hợp liên phòng ban (Slack)',
          'Quy trình Quản lý kho & Thiết bị ban đầu'
        ]
      },
      ai: {
        title: 'Triển khai AI',
        icon: <Sparkles className="w-5 h-5" />,
        color: 'bg-cyan-100 text-cyan-600',
        items: [
          'Lựa chọn nền tảng AI Chatbot (ManyChat/Gemini)',
          'Training dữ liệu SIM/WiFi Nhật cho hệ thống AI',
          'Setup AI hỗ trợ viết Content Ads & Visual'
        ]
      },
      business: {
        title: 'Kinh doanh & Vận hành',
        icon: <Settings className="w-5 h-5" />,
        color: 'bg-slate-100 text-slate-600',
        items: [
          'Setup hạ tầng: Fanpage, Tài khoản QC, Website',
          'Hoàn thiện kịch bản tư vấn & chốt đơn',
          'Setup quy trình phối hợp Sale - MKT - CSKH'
        ]
      },
      culture: {
        title: 'Văn hóa & Truyền thông',
        icon: <Megaphone className="w-5 h-5" />,
        color: 'bg-amber-100 text-amber-600',
        items: [
          'Truyền thông 5 Giá trị cốt lõi cho nhóm nòng cốt',
          'Thiết lập văn hóa "Chủ động" ngay từ ngày đầu',
          'Họp khởi động (Kick-off) chiến dịch 3.5 tháng'
        ]
      }
    }
  },
  {
    month: 'Tháng 5',
    label: 'Khởi động',
    phase: 'Thực chiến & Khai thác',
    description: 'Tung chiến dịch Marketing, bắt đầu thu lead và chốt doanh thu những khách hàng đầu tiên.',
    actions: {
      recruitment: {
        title: 'Tuyển dụng & Nhân sự',
        icon: <Users className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-600',
        items: [
          'Mở rộng quy mô lên 4-5 Team (20-25 NV)',
          'Đánh giá năng lực nhóm nòng cốt sau 2 tuần',
          'Xây dựng đội ngũ dự phòng (Talent Pool)'
        ]
      },
      training: {
        title: 'Đào tạo',
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'bg-indigo-100 text-indigo-600',
        items: [
          'Đào tạo kỹ năng xử lý từ chối (Sale)',
          'Hướng dẫn cài đặt APN & hỗ trợ kỹ thuật',
          'Đào tạo quy trình nhắc phí & giữ chân khách'
        ]
      },
      process: {
        title: 'Quy trình làm việc',
        icon: <FileText className="w-5 h-5" />,
        color: 'bg-purple-100 text-purple-600',
        items: [
          'Quy trình Lead-to-Sale (Tư vấn -> Chốt đợn)',
          'Quy trình Giao hàng & Kích hoạt SIM/WiFi',
          'Quy trình Bảo mật thông tin khách hàng'
        ]
      },
      ai: {
        title: 'Triển khai AI',
        icon: <Sparkles className="w-5 h-5" />,
        color: 'bg-cyan-100 text-cyan-600',
        items: [
          'Kích hoạt AI Chatbot tư vấn 24/7 & Lọc Lead',
          'Ứng dụng AI phân tích và tối ưu giá Lead Ads',
          'A/B Testing hiệu quả Content AI vs Content Người'
        ]
      },
      business: {
        title: 'Kinh doanh & Vận hành',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-emerald-100 text-emerald-600',
        items: [
          'Mục tiêu: Đạt ~200 đơn hàng đầu tiên',
          'Tối ưu hóa giá Lead (CPL) từ quảng cáo',
          'Theo dõi tỷ lệ chốt đơn (Conversion Rate)'
        ]
      },
      culture: {
        title: 'Văn hóa & Truyền thông',
        icon: <HeartHandshake className="w-5 h-5" />,
        color: 'bg-rose-100 text-rose-600',
        items: [
          'Workshop: "Thái độ phục vụ tận tâm"',
          'Hệ thống thưởng nóng cho đơn hàng đầu tiên',
          'Truyền cảm hứng về mục tiêu kinh doanh tháng 5'
        ]
      }
    }
  },
  {
    month: 'Tháng 6',
    label: 'Tăng tốc',
    phase: 'Mở rộng quy mô',
    description: 'Đẩy mạnh tốc độ tăng trưởng, tối ưu hóa quy trình và chuyên nghiệp hóa đội ngũ.',
    actions: {
      recruitment: {
        title: 'Tuyển dụng & Nhân sự',
        icon: <Users className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-600',
        items: [
          'Hoàn thiện 8-10 Team ( ~40-50 NV)',
          'Bổ nhiệm các Leader triển vọng từ nhóm cũ',
          'Chuẩn hóa sơ đồ tổ chức chi tiết'
        ]
      },
      training: {
        title: 'Đào tạo',
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'bg-indigo-100 text-indigo-600',
        items: [
          'Đào tạo kỹ năng quản lý cho đội ngũ Leader',
          'Huấn luyện nâng cao về Content Viral cho MKT',
          'Chia sẻ Case Study khách hàng khó chốt'
        ]
      },
      process: {
        title: 'Quy trình làm việc',
        icon: <Workflow className="w-5 h-5" />,
        color: 'bg-purple-100 text-purple-600',
        items: [
          'Quy trình Kiểm soát chất lượng (QC) tư vấn',
          'Quy trình Nhắc phí & Gia hạn tự động',
          'Quy trình Xử lý khiếu nại (CSKH Level 2)'
        ]
      },
      business: {
        title: 'Kinh doanh & Vận hành',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-emerald-100 text-emerald-600',
        items: [
          'Mục tiêu: Đạt ~360 - 500 đơn hàng',
          'Triển khai chương trình Referral (Giới thiệu)',
          'Tối ưu hóa quy trình kho & giao vận Japan'
        ]
      },
      culture: {
        title: 'Văn hóa & Truyền thông',
        icon: <Zap className="w-5 h-5" />,
        color: 'bg-amber-100 text-amber-600',
        items: [
          'Lễ vinh danh "Chiến binh chốt đơn" tháng 5',
          'Truyền bá văn hóa "Không đổ lỗi" (Core Value)',
          'Hoạt động gắn kết Team Building nội bộ'
        ]
      }
    }
  },
  {
    month: 'Tháng 7',
    label: 'Ổn định',
    phase: 'Tối ưu hiệu quả',
    description: 'Duy trì quy mô, tập trung vào tỷ lệ gia hạn và tối ưu hóa lợi nhuận ròng.',
    actions: {
      recruitment: {
        title: 'Tuyển dụng & Nhân sự',
        icon: <Users className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-600',
        items: [
          'Ổn định nhân sự 10 Team',
          'Đánh giá hiệu suất (Performance Review) quý',
          'Xây dựng lộ trình thăng tiến cán bộ nòng cốt'
        ]
      },
      training: {
        title: 'Đào tạo',
        icon: <GraduationCap className="w-5 h-5" />,
        color: 'bg-indigo-100 text-indigo-600',
        items: [
          'Đào tạo kỹ năng CSKH nâng cao',
          'Hướng dẫn đọc báo cáo tài chính cho Leader',
          'Workshop tối ưu hóa năng suất làm việc'
        ]
      },
      process: {
        title: 'Quy trình làm việc',
        icon: <FileText className="w-5 h-5" />,
        color: 'bg-purple-100 text-purple-600',
        items: [
          'Quy trình Đối soát Tài chính & Hoa hồng',
          'Quy trình Tối ưu hóa ngân sách Marketing',
          'Quy trình Đào tạo & Bổ nhiệm nhân sự kế cận'
        ]
      },
      business: {
        title: 'Kinh doanh & Vận hành',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-emerald-100 text-emerald-600',
        items: [
          'Mục tiêu: Đạt ~640+ đơn hàng',
          'Tập trung tối đa vào tỷ lệ gia hạn (Retention)',
          'Tối ưu hóa chi phí vận hành (OPEX)'
        ]
      },
      culture: {
        title: 'Văn hóa & Truyền thông',
        icon: <HeartHandshake className="w-5 h-5" />,
        color: 'bg-rose-100 text-rose-600',
        items: [
          'Truyền thông kết quả kinh doanh 3.5 tháng',
          'Phần thưởng lớn cho Team đạt mục tiêu Master Plan',
          'Củng cố văn hóa "Học hỏi & Hiệu quả"'
        ]
      }
    }
  }
];
