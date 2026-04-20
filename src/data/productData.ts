export interface ProductItem {
  id: string;
  name: string;
  objective: string;
  assessment: string[];
  icon: string;
  color: string;
}

export const PRODUCTS: ProductItem[] = [
  {
    id: 'wifi-co-dinh',
    name: 'WIFI Cố định',
    objective: 'Làm kèm kết hợp',
    assessment: [
      'Doanh thu hoa hồng 1 lần cao',
      'Nhà cung cấp siết chặt, thay đổi chính sách thường xuyên',
      'Dễ vi phạm chính sách bị bùng hoa hồng',
      'Thị trường cạnh tranh mạnh đòi hỏi khuyến mãi giá cước ảo'
    ],
    icon: 'Wifi',
    color: 'blue'
  },
  {
    id: 'wifi-cam-tay',
    name: 'Wifi Cầm Tay & Wifi Cắm điện Au',
    objective: 'Sản phẩm chủ lực',
    assessment: [
      'Nhu cầu sản phẩm cao, tiện lợi',
      'Thu được đầu vào, có dòng tiền ngay sau bán, ít rủi ro',
      'Thu cước hàng tháng, có khả năng đẩy số lượng lớn',
      'Mấu chốt nằm ở phần quản lý, khả năng bán hàng và đẩy hàng tồn kho, hoàn hàng'
    ],
    icon: 'Router',
    color: 'emerald'
  },
  {
    id: 'sim-data',
    name: 'Sim Data',
    objective: 'Làm kèm kết hợp',
    assessment: [
      'Thị trường cạnh tranh mạnh, tỷ lệ hoàn hàng và dùng ngắn hạn cao',
      'Doanh thu thu cước giảm, biên lợi nhuận nhỏ',
      'Không thu được đầu vào, chi phí bán hàng đang cao',
      'Có phí làm lại chờ sim cấp lại và quay vòng chi phí',
      'Doanh thu vượt chi => Không phù hợp làm chuyên sim hiện tại',
      'Phù hợp kết hợp cùng sản phẩm chính cùng quảng cáo, hoặc bán chéo'
    ],
    icon: 'Smartphone',
    color: 'violet'
  },
  {
    id: 'dien-gas',
    name: 'Điện Gas',
    objective: 'Làm kèm kết hợp',
    assessment: [
      'Có thể làm chính sau khi test ra kết quả phù hợp và vận hành trơn tru dễ chạy đơn',
      'Nhu cầu thiết yếu, tỷ lệ có thể sử dụng dịch vụ trên 95% toàn Nhật Bản',
      'Xử lý 100% online thuận tiện, nhanh chóng',
      'Doanh thu một lần, chỉ cần đăng ký hoàn thành trong ngày, không phải xử lý phức tạp về sau',
      'Rất tốt để bán kèm, bán chéo cho khách hàng đang dùng sản phẩm của công ty'
    ],
    icon: 'Zap',
    color: 'amber'
  },
  {
    id: 'dien-thoai-mtb',
    name: 'Điện thoại, Máy tính bảng',
    objective: 'Sản phẩm chủ lực',
    assessment: [
      'Giá nhập rẻ cạnh tranh, sản phẩm đa dạng, ít lỗi hỏng (dù là đồ cũ)',
      'Bán tại thị trường Nhật và Việt Nam (người nước ngoài và người Việt)',
      'Bán chéo kèm với tệp khách có sẵn, đổ sỉ cho CTV đại lý',
      'Khả năng bán ra 1.000 sản phẩm/tháng',
      'Không cần quản lý vận hành về sau, vấn đề cần tập trung là giải quyết tồn kho và hàng lỗi hỏng'
    ],
    icon: 'Laptop',
    color: 'cyan'
  },
  {
    id: 'tplink',
    name: 'Thiết bị phát TP-Link',
    objective: 'Đổ sỉ cho CTV và Đại lý',
    assessment: [
      'Biên lợi nhuận nhỏ trên từng sản phẩm nhưng có thể đẩy một lần số lượng lớn',
      'Khách hàng đặt đều theo tháng, năm',
      'Xuất nhập hàng đơn giản không tốn nhiều công sức, không phải quản lý về sau',
      'Dễ dàng bàn giao cho kế toán chăm sóc và quản lý công nợ'
    ],
    icon: 'Network',
    color: 'indigo'
  },
  {
    id: 'ban-le-affiliate',
    name: 'Bán lẻ, AFFILIATE',
    objective: 'Đang tìm kiếm phát triển',
    assessment: [
      'Bán cho người Việt tại nước ngoài',
      'Tệp khách có khả năng chi trả cao hơn so với người Việt trong nước'
    ],
    icon: 'Share2',
    color: 'rose'
  },
  {
    id: 'viec-lam',
    name: 'Giới thiệu việc làm, Du học XKLD',
    objective: 'Dự án tiềm năng',
    assessment: [
      'Chưa có đánh giá cụ thể',
      'Ngành dịch vụ có nhu cầu cao trong tương lai'
    ],
    icon: 'Briefcase',
    color: 'slate'
  },
  {
    id: 'dich-vu-nhat',
    name: 'Sản phẩm dịch vụ cho người Nhật',
    objective: 'Mục tiêu lớn',
    assessment: [
      'Dân số lớn, thông thái',
      'Khả năng chi trả cao',
      'Thị trường bản địa đầy tiềm năng'
    ],
    icon: 'Globe',
    color: 'fuchsia'
  },
  {
    id: 'ban-le-vn',
    name: 'Bán lẻ Việt Nam',
    objective: 'Đang tìm kiếm, phát triển',
    assessment: [
      'Cần thời gian nghiên cứu thị hiếu và thói quen mua sắm nội địa'
    ],
    icon: 'Store',
    color: 'orange'
  }
];
