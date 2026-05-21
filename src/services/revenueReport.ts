import { API_BASE_URL } from '../components/messenger/api';

export type RevenueMetric = {
  current: number;
  previous: number;
};

export type RevenueReportData = {
  summary: {
    revenue: RevenueMetric;
    orders: RevenueMetric;
    customers: RevenueMetric;
    averageOrderValue: RevenueMetric;
    conversion: RevenueMetric;
  };
  chart: Array<{
    label: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    percent: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    product: string;
    amount: number;
    status: string;
    date: string | null;
  }>;
};

export const EMPTY_REVENUE_REPORT: RevenueReportData = {
  summary: {
    revenue: { current: 0, previous: 0 },
    orders: { current: 0, previous: 0 },
    customers: { current: 0, previous: 0 },
    averageOrderValue: { current: 0, previous: 0 },
    conversion: { current: 0, previous: 0 }
  },
  chart: [],
  topProducts: [],
  recentOrders: []
};

const toNumber = (value: unknown) => Number(value || 0);

export const formatYen = (value: number) =>
  `${Math.round(Number(value || 0)).toLocaleString('vi-VN')} ¥`;

export const calculateGrowth = (current: number, previous: number) => {
  let growth = 0;
  if (previous === 0) {
    growth = current > 0 ? 100 : 0;
  } else {
    growth = ((current - previous) / previous) * 100;
  }

  return {
    change: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
    isPositive: growth >= 0
  };
};

export const getOrderStatusLabel = (status: string | null | undefined) => {
  const raw = String(status || '').trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes('approve') || normalized.includes('complete') || normalized.includes('success')) {
    return 'Hoàn thành';
  }
  if (normalized.includes('reject') || normalized.includes('cancel') || normalized.includes('hủy')) {
    return 'Đã hủy';
  }
  if (normalized.includes('pending') || normalized.includes('process') || normalized.includes('chờ')) {
    return 'Chờ xử lý';
  }
  return raw || 'Chưa rõ';
};

export const getOrderStatusBadgeClass = (status: string | null | undefined) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('approve') || normalized.includes('complete') || normalized.includes('success')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (normalized.includes('reject') || normalized.includes('cancel') || normalized.includes('hủy')) {
    return 'bg-rose-100 text-rose-700';
  }
  if (normalized.includes('pending') || normalized.includes('process') || normalized.includes('chờ')) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-slate-100 text-slate-700';
};

const normalizeRevenueReport = (data: any): RevenueReportData => ({
  summary: {
    revenue: {
      current: toNumber(data?.summary?.revenue?.current),
      previous: toNumber(data?.summary?.revenue?.previous)
    },
    orders: {
      current: toNumber(data?.summary?.orders?.current),
      previous: toNumber(data?.summary?.orders?.previous)
    },
    customers: {
      current: toNumber(data?.summary?.customers?.current),
      previous: toNumber(data?.summary?.customers?.previous)
    },
    averageOrderValue: {
      current: toNumber(data?.summary?.averageOrderValue?.current),
      previous: toNumber(data?.summary?.averageOrderValue?.previous)
    },
    conversion: {
      current: toNumber(data?.summary?.conversion?.current),
      previous: toNumber(data?.summary?.conversion?.previous)
    }
  },
  chart: Array.isArray(data?.chart)
    ? data.chart.map((item: any) => ({
      label: String(item?.label || ''),
      revenue: toNumber(item?.revenue),
      orders: toNumber(item?.orders)
    }))
    : [],
  topProducts: Array.isArray(data?.topProducts)
    ? data.topProducts.map((item: any) => ({
      name: String(item?.name || 'Không rõ sản phẩm'),
      sales: toNumber(item?.sales),
      revenue: toNumber(item?.revenue),
      percent: Math.max(0, Math.min(100, toNumber(item?.percent)))
    }))
    : [],
  recentOrders: Array.isArray(data?.recentOrders)
    ? data.recentOrders.map((item: any) => ({
      id: String(item?.id || ''),
      customer: String(item?.customer || 'Khách hàng'),
      product: String(item?.product || '-'),
      amount: toNumber(item?.amount),
      status: String(item?.status || ''),
      date: item?.date ? String(item.date) : null
    }))
    : []
});

export const fetchRevenueReport = async (range: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ range });
  const response = await fetch(`${API_BASE_URL}/api/customers/revenue-report?${params.toString()}`, { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Không thể tải báo cáo doanh thu.');
  }

  return normalizeRevenueReport(data);
};
