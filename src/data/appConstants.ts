export const FILTER_DEPTS = [
  { id: 'all', label: 'Tất cả phòng ban' },
  { id: 'sales-mkt', label: 'Phòng KD - MKT - CSKH' },
  { id: 'comms-dept', label: 'Phòng Truyền thông' },
  { id: 'hr-dept', label: 'Hành chính - Nhân sự' },
  { id: 'finance-dept', label: 'Tài chính - Kế toán' },
  { id: 'technical', label: 'Kỹ thuật - Vận hành' }
];

export const DEPT_MAPPING: Record<string, string> = {
  'head': 'sales-mkt',
  'mkt_lead': 'sales-mkt',
  'sale_lead': 'sales-mkt',
  'cskh_lead': 'sales-mkt',
  'sale_staff': 'sales-mkt',
  'cskh_staff': 'sales-mkt',
  'mkt_ads': 'sales-mkt',
  'telesale': 'sales-mkt',
  'crm': 'sales-mkt',
  'ops': 'sales-mkt',
  'mkt_content': 'comms-dept',
  'mkt_media': 'comms-dept',
  'accountant': 'finance-dept',
  'hr_staff': 'hr-dept',
  'jp_support_after_sales': 'technical'
};

export const MASTER_PLAN_DATA = {
  months: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  operations: {
    teams: [1, 2, 4, 6, 8, 10, 10, 10, 10, 10, 10, 10],
    newOrders: [200, 360, 640, 840, 960, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
    churnOrders: [0, 0, 0, 0, 0, 0, -200, -360, -640, -840, -960, -1000],
    totalActive: [0, 200, 560, 1200, 2040, 3000, 3800, 4440, 4800, 4960, 5000, 5000],
  },
  grossRevenueByCohort: [310, 707, 1549, 2449, 3457, 4376, 5058, 5565, 5834, 5954, 5984, 5984],
  netCostsToProvider: [81, 249, 549, 961, 1445, 1959, 2373, 2705, 2891, 2974, 2995, 2995],
  operatingExpenses: {
    marketing: [199, 358, 636, 835, 955, 994, 994, 994, 994, 994, 994, 994],
    salary: [58, 116, 232, 348, 464, 580, 580, 580, 580, 580, 580, 580],
    fixed: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70],
    simRefill: [0, 0, 0, 0, 0, 0, 73, 131, 232, 305, 348, 363],
    total: [327, 544, 938, 1253, 1489, 1644, 1717, 1775, 1877, 1949, 1993, 2007],
  },
  finalNetProfit: [-98, -86, 62, 234, 523, 773, 968, 1085, 1066, 1031, 996, 982],
  finalProfitMargin: ['-31.6%', '-12.1%', '4.0%', '9.6%', '15.1%', '17.7%', '19.1%', '19.5%', '18.3%', '17.3%', '16.6%', '16.4%'],
};

export const BRAND_INVESTMENT_DATA = {
  items: [
    { label: '1. Triển khai Website (Domain, Hosting, Dev)', values: [50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], color: 'text-indigo-600' },
    { label: '2. Triển khai Mobile App (iOS/Android)', values: [150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], color: 'text-indigo-600' },
    { label: '3. Đầu tư Cơ sở vật chất (VP, Thiết bị)', values: [300, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], color: 'text-indigo-600' },
    { label: '4. Nhân sự Brand (Content, MKT - 20Tr/tháng)', values: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20], color: 'text-amber-600' },
  ]
};
