
export interface SubProductTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface SubProductInfoGroup {
  groupName: string;
  items: { label: string; value: string }[];
}

export interface SubProductDetails {
  tables?: SubProductTable[];
  infoGroups?: SubProductInfoGroup[];
}

export const SUB_PRODUCTS_DATA: Record<string, SubProductDetails> = {
  'wifi-co-dinh': {
    tables: [
      {
        title: 'Bộ Phát WiFi Tốc Độ Cao (Website SkyMobile)',
        headers: ['Sản phẩm', 'Giá bán (Hàng tháng) Giá gốc', 'Thương hiệu/Ghi chú'],
        rows: [
          ['SPEED WI-FI HOME 5G L13', '4,980 ¥ (Giá gốc: 5,200 ¥)', 'AU - Dòng cố định 5G, cắm điện dùng ngay.'],
          ['Speed Wi-Fi DOCK 5G 01', '4,980 ¥ (Giá gốc: 5,200 ¥)', 'AU - Router nhỏ gọn tiện dụng.']
        ]
      }
    ]
  },
  'dien-thoai-mtb': {
    tables: [
      {
        title: 'Điện Thoại Nhập Khẩu (Website SkyMobile)',
        headers: ['Sản phẩm', 'Giá bán Giá gốc', 'Tình trạng', 'Cấu hình nổi bật'],
        rows: [
          ['iPhone 13 Pro Max 128GB', '110,000 ¥ (Giá gốc: 120,000 ¥)', 'Cũ Đẹp (-8%)', 'Apple, Camera chuyên nghiệp, pin trâu.'],
          ['iPhone 14 Plus 128GB', '10,000,000 ¥ (Giá gốc: 15,000,000 ¥)', 'Cũ Đẹp (-33%)', 'Apple, Màn hình 6.7 inch. Giá tham khảo.']
        ]
      }
    ]
  },
  'wifi-cam-tay': {
    tables: [
      {
        title: 'Bảng Giá Pocket WiFi (Website SkyMobile)',
        headers: ['Sản phẩm', 'Giá bán (Hàng tháng)', 'Đặc điểm'],
        rows: [
          ['GlocalMe UPP U20 4G', '4,500 ¥', 'Giải pháp WiFi 4G di động kết nối linh hoạt, Data Only.']
        ]
      },
      {
        title: 'Bảng Giá Pocket WiFi AU',
        headers: ['Sản phẩm', 'Cước tháng (¥)', 'Thời gian mua', 'Giá bán (¥)', 'Ưu đãi'],
        rows: [
          ['Pocket WiFi AU', '4,980', 'Ngày 1 - 14', '10,950', 'Freeship + Tặng 1 tháng cước'],
          ['Pocket WiFi AU', '4,980', 'Ngày 15 - 20', '8,470', 'Freeship + Tặng 1 tháng cước'],
          ['Pocket WiFi AU', '4,980', 'Ngày 21 - 23', '13,450', 'Freeship + Tặng 2 tháng cước'],
          ['Pocket WiFi AU', '4,980', 'Ngày 24 - 31', '12,950', 'Freeship + Tặng 2 tháng cước'],
        ]
      }
    ]
  },
  'sim-data': {
    tables: [
      {
        title: 'SIM DATA 5G Bán Chạy Nhất (Website SkyMobile)',
        headers: ['Sản phẩm', 'Giá khuyến mãi Giá gốc', 'Ghi chú'],
        rows: [
          ['SIM DATA 5G SOFTBANK UNLIMITED', '4,950 ¥ (Giá gốc 5,280 ¥)', '30 Ngày, 5G, Tốc độ cao không giới hạn.'],
          ['SIM DATA 5G SOFTBANK 300GB', '4,800 ¥ (Giá gốc 5,100 ¥)', '30 Ngày, dung lượng cực lớn thay thế cáp quang.'],
          ['SIM DATA 5G SOFTBANK 100GB', '3,750 ¥', '30 Ngày, cân bằng giá cả và dung lượng.'],
          ['SIM DATA 5G SOFTBANK 50GB', '2,800 ¥ (Giá gốc 3,050 ¥)', '30 Ngày, tốc độ cao phủ sóng toàn quốc.'],
          ['SIM DATA 5G SOFTBANK 30GB', '2,650 ¥ (Giá gốc 2,800 ¥)', '30 Ngày, 5G, giá rẻ phù hợp nhu cầu vừa phải.']
        ]
      },
      {
        title: 'SOFTBANK - SIM DATA Thu Cước Hàng Tháng',
        headers: ['Gói Data/Tháng', 'Cước Thu/Tháng', 'Giá Bán (Ngày 25 đến 15)', 'Giá Bán (Ngày 16 đến 24)'],
        rows: [
          ['30GB', '2,650 ¥', '4,500 ¥ (- Freeship, Tặng cước tháng đ.ký)', '5,500 ¥ (- Freeship, tặng cước, tặng thêm 1 tháng)'],
          ['50GB', '2,800 ¥', '4,500 ¥', '6,000 ¥'],
          ['100GB', '3,500 ¥', '5,500 ¥', '7,000 ¥'],
          ['300GB', '4,800 ¥', '7,000 ¥', '8,500 ¥'],
          ['Unlimited', '4,950 ¥', '7,000 ¥', '8,500 ¥'],
        ]
      },
      {
        title: 'SOFTBANK - SIM DATA Bán Đứt 1 Năm',
        headers: ['Data/Tháng', 'Giá Bán', 'Giá TB/Tháng', 'Ghi Chú'],
        rows: [
          ['2GB', '6,050 ¥', '504 ¥', 'Gía bán đã bao gồm phí ship'],
          ['5GB', '10,500 ¥', '875 ¥', ''],
          ['10GB', '15,650 ¥', '1,304 ¥', ''],
          ['30GB', '25,000 ¥', '2,083 ¥', ''],
          ['50GB', '27,000 ¥', '2,250 ¥', ''],
          ['100GB', '33,000 ¥', '2,750 ¥', ''],
          ['300GB', '48,000 ¥', '4,000 ¥', ''],
        ]
      },
      {
        title: 'SIM Nghe Gọi DOCOMO (Giá Bán SIM + Gói Nghe Gọi)',
        headers: ['Gói Data', 'Cước Data (¥/tháng)', 'SIM + 0 phút (1)', 'SIM + 5 phút/cuộc (2)', 'SIM + 10 phút/cuộc (3)', 'SIM + 15 phút/cuộc (4)', 'SIM + 24/24 (5)'],
        rows: [
          ['200KB', '1,900 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['1GB', '2,000 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['3GB', '2,200 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['5GB', '2,300 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['7GB', '2,550 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['10GB', '2,750 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['20GB', '3,150 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['25GB', '3,550 ¥', '5,300 ¥', '5,795 ¥', '5,905 ¥', '6,400 ¥', '7,060 ¥'],
          ['50GB', '4,900 ¥', '5,900 ¥', '6,395 ¥', '6,505 ¥', '7,000 ¥', '7,660 ¥'],
        ]
      }
    ],
    infoGroups: [
      {
        groupName: 'Thông tin chung',
        items: [
          { label: 'Chức năng', value: 'Online mọi nơi tốc độ 5G/LTE, hết tốc độ cao vẫn dùng được tốc độ thường.' },
          { label: 'Khuyến mãi', value: 'Không mất phí ban đầu, không cần thông tin cá nhân (chỉ cần tên + địa chỉ nhận SIM).' },
          { label: 'Lưu ý', value: 'Thanh toán từ ngày 15-25 hàng tháng, sau ngày 25 chưa thanh toán sẽ khóa mạng tạm thời.' },
        ]
      },
      {
        groupName: 'Ghi chú gói DOCOMO',
        items: [
          { label: '(1)', value: 'Giá riêng: 0¥. Gọi vượt phí 16¥/phút' },
          { label: '(2)', value: 'Giá riêng: 495¥ (Free 5 phút/cuộc)' },
          { label: '(3)', value: 'Giá riêng: 605¥ (Free 10 phút/cuộc)' },
          { label: '(4)', value: 'Giá riêng: 1100¥ (Free 15 phút/cuộc)' },
          { label: '(5)', value: 'Giá riêng: 1760¥ (Free nghe gọi 24/24)' }
        ]
      }
    ]
  }
};
