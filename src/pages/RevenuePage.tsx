import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  MessageSquare,
  FileText,
  Inbox,
  Loader2,
  AlertCircle,
  Timer,
  Megaphone,
  BarChart3,
  Wallet,
  Receipt,
  Target
} from 'lucide-react';
import { API_BASE_URL } from '../components/messenger/api';
import {
  EMPTY_REVENUE_REPORT,
  calculateGrowth,
  fetchRevenueReport,
  formatYen,
  getOrderStatusBadgeClass,
  getOrderStatusLabel
} from '../services/revenueReport';

type PageReportType = 'page_overview';
type ReportType = 'revenue' | PageReportType | 'page_messages' | 'cskh_personal';

type ReportDefinition = {
  id: ReportType;
  label: string;
  description: string;
};

type MessageReportRow = {
  page_id: string;
  page_name: string;
  staff_key: string;
  staff_name: string;
  staff_email?: string | null;
  staff_role?: string;
  message_count: number;
  conversation_count: number;
  customer_count: number;
  response_count: number;
  total_response_seconds: number;
  average_response_seconds: number;
  first_message_at?: string | null;
  last_message_at?: string | null;
};

type MessageReportData = {
  rows: MessageReportRow[];
  summary: {
    message_count: number;
    conversation_count: number;
    customer_count: number;
    unassigned_customer_count: number;
    response_count: number;
    total_response_seconds: number;
    average_response_seconds: number;
    page_count: number;
    staff_count: number;
  };
};

type PageReportRow = {
  page_id: string;
  page_name: string;
  conversation_count: number;
  active_conversation_count: number;
  new_customer_count: number;
  message_count: number;
  inbound_message_count: number;
  human_message_count: number;
  ai_message_count: number;
  staff_count: number;
  order_count: number;
  revenue_customer_count: number;
  revenue: number;
  average_order_value: number;
  ad_cost: number;
  ad_conversation_count: number;
  ad_customer_count: number;
  ad_count: number;
  ad_click_count: number;
  roas: number;
  profit_after_ads: number;
  cost_per_customer: number;
  cost_per_message: number;
  last_activity_at?: string | null;
};

type PageReportData = {
  rows: PageReportRow[];
  summary: Omit<PageReportRow, 'page_id' | 'page_name' | 'last_activity_at'> & {
    page_count: number;
  };
};

type CskhPersonalPageRow = {
  page_id: string;
  page_name: string;
  new_customer_count: number;
  active_conversation_count: number;
  sent_message_count: number;
  note_count: number;
  last_activity_at?: string | null;
};

type CskhPersonalConversationRow = {
  id: number;
  customer_name: string;
  customer_id: string;
  page_id: string;
  page_name: string;
  customer_status?: string | null;
  last_message_at?: string | null;
  sent_message_count: number;
  note_count: number;
  last_activity_at?: string | null;
};

type CskhPersonalReportData = {
  byPage: CskhPersonalPageRow[];
  recentConversations: CskhPersonalConversationRow[];
  summary: {
    assigned_conversation_count: number;
    active_conversation_count: number;
    handled_conversation_count: number;
    new_customer_count: number;
    sent_message_count: number;
    note_count: number;
    order_count: number;
    revenue: number;
    page_count: number;
  };
};

const EMPTY_CSKH_PERSONAL_REPORT: CskhPersonalReportData = {
  byPage: [],
  recentConversations: [],
  summary: {
    assigned_conversation_count: 0,
    active_conversation_count: 0,
    handled_conversation_count: 0,
    new_customer_count: 0,
    sent_message_count: 0,
    note_count: 0,
    order_count: 0,
    revenue: 0,
    page_count: 0
  }
};

const EMPTY_PAGE_REPORT: PageReportData = {
  rows: [],
  summary: {
    page_count: 0,
    conversation_count: 0,
    active_conversation_count: 0,
    new_customer_count: 0,
    message_count: 0,
    inbound_message_count: 0,
    human_message_count: 0,
    ai_message_count: 0,
    staff_count: 0,
    order_count: 0,
    revenue_customer_count: 0,
    revenue: 0,
    average_order_value: 0,
    ad_cost: 0,
    ad_conversation_count: 0,
    ad_customer_count: 0,
    ad_count: 0,
    ad_click_count: 0,
    roas: 0,
    profit_after_ads: 0,
    cost_per_customer: 0,
    cost_per_message: 0
  }
};

const PAGE_REPORT_TYPES = ['page_overview'] as const;

const isPageReportType = (report: ReportType): report is PageReportType =>
  PAGE_REPORT_TYPES.includes(report as PageReportType);

const REPORTS: ReportDefinition[] = [
  {
    id: 'revenue',
    label: 'Doanh thu',
    description: 'Dòng tiền, đơn hàng, khách hàng và hiệu suất bán hàng.'
  },
  {
    id: 'page_overview',
    label: 'Báo cáo theo Page',
    description: 'Tin nhắn, doanh thu và chi phí quảng cáo trên cùng một màn hình, lọc theo Fanpage.'
  },
  {
    id: 'cskh_personal',
    label: 'Báo cáo cá nhân CSKH',
    description: 'Khách mới, hội thoại, tin nhắn và ghi chú của chính tài khoản CSKH đang đăng nhập.'
  },
  {
    id: 'page_messages',
    label: 'Khách mới nhắn Page theo nhân viên',
    description: 'Số khách nhắn tin lần đầu theo Fanpage và nhân sự phụ trách.'
  }
];

const normalizeRole = (role?: string | null) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const canViewRevenueReport = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized === 'quan tri'
    || normalized === 'admin'
    || normalized === 'head'
    || normalized.includes('kinh doanh')
    || normalized.includes('sale')
    || normalized.includes('ke toan')
    || normalized.includes('tai chinh');
};

const canViewMessageReport = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized === 'quan tri'
    || normalized === 'admin'
    || normalized === 'head'
    || normalized.includes('marketing')
    || normalized.includes('quang cao')
    || normalized.includes('ads')
    || normalized.includes('cskh')
    || normalized.includes('cham soc khach hang');
};

const canViewCskhPersonalReport = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized.includes('cskh') || normalized.includes('cham soc khach hang');
};

const canViewPageReport = (role?: string | null) =>
  canViewRevenueReport(role) || canViewMessageReport(role);

const getAllowedReports = (user?: any) => {
  const role = user?.role;
  const reports = REPORTS.filter(report => {
    if (report.id === 'revenue') return canViewRevenueReport(role);
    if (isPageReportType(report.id)) return canViewPageReport(role);
    if (report.id === 'cskh_personal') return canViewCskhPersonalReport(role);
    if (report.id === 'page_messages') return canViewMessageReport(role);
    return false;
  });
  return reports.length > 0 ? reports : [REPORTS[0]];
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString('vi-VN');

const formatRatio = (value: number) =>
  Number(value || 0).toFixed(2);

const formatDuration = (seconds?: number | null) => {
  const totalSeconds = Math.round(Number(seconds || 0));
  if (totalSeconds <= 0) return '-';

  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}p ${remainingSeconds}s` : `${minutes}p`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}g ${remainingMinutes}p` : `${hours}g`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}n ${remainingHours}g` : `${days}n`;
};

const buildPageReportSummary = (rows: PageReportRow[]): PageReportData['summary'] => {
  const totals = rows.reduce((acc, row) => {
    acc.page_count += row.page_id === 'unassigned' ? 0 : 1;
    acc.conversation_count += row.conversation_count;
    acc.active_conversation_count += row.active_conversation_count;
    acc.new_customer_count += row.new_customer_count;
    acc.message_count += row.message_count;
    acc.inbound_message_count += row.inbound_message_count;
    acc.human_message_count += row.human_message_count;
    acc.ai_message_count += row.ai_message_count;
    acc.staff_count += row.staff_count;
    acc.order_count += row.order_count;
    acc.revenue_customer_count += row.revenue_customer_count;
    acc.revenue += row.revenue;
    acc.ad_cost += row.ad_cost;
    acc.ad_conversation_count += row.ad_conversation_count;
    acc.ad_customer_count += row.ad_customer_count;
    acc.ad_count += row.ad_count;
    acc.ad_click_count += row.ad_click_count;
    acc.profit_after_ads += row.profit_after_ads;
    return acc;
  }, { ...EMPTY_PAGE_REPORT.summary });

  return {
    ...totals,
    average_order_value: totals.order_count > 0 ? Math.round(totals.revenue / totals.order_count) : 0,
    roas: totals.ad_cost > 0 ? Number((totals.revenue / totals.ad_cost).toFixed(2)) : 0,
    cost_per_customer: totals.new_customer_count > 0 ? Math.round(totals.ad_cost / totals.new_customer_count) : 0,
    cost_per_message: totals.message_count > 0 ? Math.round(totals.ad_cost / totals.message_count) : 0
  };
};

export const RevenuePage: React.FC<{ user?: any }> = ({ user }) => {
  const [dateRange, setDateRange] = useState('Tháng này');
  const allowedReports = useMemo(() => getAllowedReports(user), [user]);
  const [selectedReport, setSelectedReport] = useState<ReportType>(allowedReports[0]?.id || 'revenue');
  const [revenueReport, setRevenueReport] = useState(EMPTY_REVENUE_REPORT);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [revenueReportError, setRevenueReportError] = useState<string | null>(null);
  const [messageReport, setMessageReport] = useState<MessageReportData | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageReportError, setMessageReportError] = useState<string | null>(null);
  const [cskhPersonalReport, setCskhPersonalReport] = useState<CskhPersonalReportData>(EMPTY_CSKH_PERSONAL_REPORT);
  const [isLoadingCskhPersonal, setIsLoadingCskhPersonal] = useState(false);
  const [cskhPersonalError, setCskhPersonalError] = useState<string | null>(null);
  const [pageReport, setPageReport] = useState<PageReportData>(EMPTY_PAGE_REPORT);
  const [isLoadingPageReport, setIsLoadingPageReport] = useState(false);
  const [pageReportError, setPageReportError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState('all');
  const isPageReportSelected = isPageReportType(selectedReport);

  useEffect(() => {
    if (!allowedReports.some(report => report.id === selectedReport)) {
      setSelectedReport(allowedReports[0]?.id || 'revenue');
    }
  }, [allowedReports, selectedReport]);

  useEffect(() => {
    if (selectedReport !== 'revenue') return;

    const controller = new AbortController();
    let isActive = true;

    setIsLoadingRevenue(true);
    setRevenueReportError(null);
    fetchRevenueReport(dateRange, controller.signal)
      .then(data => {
        if (!isActive) return;
        setRevenueReport(data);
      })
      .catch(err => {
        if (!isActive || err.name === 'AbortError') return;
        console.error('Error loading revenue report:', err);
        setRevenueReportError(err.message || 'Không thể tải báo cáo doanh thu.');
        setRevenueReport(EMPTY_REVENUE_REPORT);
      })
      .finally(() => {
        if (isActive) setIsLoadingRevenue(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedReport, dateRange]);

  useEffect(() => {
    if (!isPageReportType(selectedReport)) return;

    const controller = new AbortController();
    const params = new URLSearchParams({ range: dateRange });
    const toNumber = (value: unknown) => Number(value || 0);

    setIsLoadingPageReport(true);
    setPageReportError(null);
    fetch(`${API_BASE_URL}/api/fb/reports/page-performance?${params.toString()}`, { signal: controller.signal })
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Không thể tải báo cáo theo Page.');

        const rows: PageReportRow[] = Array.isArray(data?.rows)
          ? data.rows.map((row: any) => ({
            page_id: String(row?.page_id || ''),
            page_name: String(row?.page_name || 'Fanpage'),
            conversation_count: toNumber(row?.conversation_count),
            active_conversation_count: toNumber(row?.active_conversation_count),
            new_customer_count: toNumber(row?.new_customer_count),
            message_count: toNumber(row?.message_count),
            inbound_message_count: toNumber(row?.inbound_message_count),
            human_message_count: toNumber(row?.human_message_count),
            ai_message_count: toNumber(row?.ai_message_count),
            staff_count: toNumber(row?.staff_count),
            order_count: toNumber(row?.order_count),
            revenue_customer_count: toNumber(row?.revenue_customer_count),
            revenue: toNumber(row?.revenue),
            average_order_value: toNumber(row?.average_order_value),
            ad_cost: toNumber(row?.ad_cost),
            ad_conversation_count: toNumber(row?.ad_conversation_count),
            ad_customer_count: toNumber(row?.ad_customer_count),
            ad_count: toNumber(row?.ad_count),
            ad_click_count: toNumber(row?.ad_click_count),
            roas: toNumber(row?.roas),
            profit_after_ads: toNumber(row?.profit_after_ads),
            cost_per_customer: toNumber(row?.cost_per_customer),
            cost_per_message: toNumber(row?.cost_per_message),
            last_activity_at: row?.last_activity_at ? String(row.last_activity_at) : null
          }))
          : [];

        setPageReport({
          rows,
          summary: {
            page_count: toNumber(data?.summary?.page_count),
            conversation_count: toNumber(data?.summary?.conversation_count),
            active_conversation_count: toNumber(data?.summary?.active_conversation_count),
            new_customer_count: toNumber(data?.summary?.new_customer_count),
            message_count: toNumber(data?.summary?.message_count),
            inbound_message_count: toNumber(data?.summary?.inbound_message_count),
            human_message_count: toNumber(data?.summary?.human_message_count),
            ai_message_count: toNumber(data?.summary?.ai_message_count),
            staff_count: toNumber(data?.summary?.staff_count),
            order_count: toNumber(data?.summary?.order_count),
            revenue_customer_count: toNumber(data?.summary?.revenue_customer_count),
            revenue: toNumber(data?.summary?.revenue),
            average_order_value: toNumber(data?.summary?.average_order_value),
            ad_cost: toNumber(data?.summary?.ad_cost),
            ad_conversation_count: toNumber(data?.summary?.ad_conversation_count),
            ad_customer_count: toNumber(data?.summary?.ad_customer_count),
            ad_count: toNumber(data?.summary?.ad_count),
            ad_click_count: toNumber(data?.summary?.ad_click_count),
            roas: toNumber(data?.summary?.roas),
            profit_after_ads: toNumber(data?.summary?.profit_after_ads),
            cost_per_customer: toNumber(data?.summary?.cost_per_customer),
            cost_per_message: toNumber(data?.summary?.cost_per_message)
          }
        });
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Error loading page report:', err);
        setPageReportError(err.message || 'Không thể tải báo cáo theo Page.');
        setPageReport(EMPTY_PAGE_REPORT);
      })
      .finally(() => setIsLoadingPageReport(false));

    return () => controller.abort();
  }, [selectedReport, dateRange]);

  useEffect(() => {
    if (selectedReport !== 'page_messages') return;

    const params = new URLSearchParams({ range: dateRange });
    if (user?.email) params.set('email', user.email);
    if (user?.name) params.set('name', user.name);
    if (user?.role) params.set('role', user.role);

    setIsLoadingMessages(true);
    setMessageReportError(null);
    fetch(`${API_BASE_URL}/api/fb/reports/new-messages?${params.toString()}`)
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Không thể tải báo cáo khách mới.');
        setMessageReport(data);
      })
      .catch(err => {
        console.error('Error loading message report:', err);
        setMessageReportError(err.message || 'Không thể tải báo cáo khách mới.');
        setMessageReport(null);
      })
      .finally(() => setIsLoadingMessages(false));
  }, [selectedReport, dateRange, user?.email, user?.name, user?.role]);

  useEffect(() => {
    if (selectedReport !== 'cskh_personal') return;

    const params = new URLSearchParams({ range: dateRange });
    if (user?.email) params.set('email', user.email);
    if (user?.name) params.set('name', user.name);

    setIsLoadingCskhPersonal(true);
    setCskhPersonalError(null);
    fetch(`${API_BASE_URL}/api/fb/reports/cskh-personal?${params.toString()}`)
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Không thể tải báo cáo cá nhân CSKH.');
        setCskhPersonalReport({
          summary: {
            assigned_conversation_count: Number(data?.summary?.assigned_conversation_count || 0),
            active_conversation_count: Number(data?.summary?.active_conversation_count || 0),
            handled_conversation_count: Number(data?.summary?.handled_conversation_count || 0),
            new_customer_count: Number(data?.summary?.new_customer_count || 0),
            sent_message_count: Number(data?.summary?.sent_message_count || 0),
            note_count: Number(data?.summary?.note_count || 0),
            order_count: Number(data?.summary?.order_count || 0),
            revenue: Number(data?.summary?.revenue || 0),
            page_count: Number(data?.summary?.page_count || 0)
          },
          byPage: Array.isArray(data?.byPage)
            ? data.byPage.map((row: any) => ({
              page_id: String(row?.page_id || ''),
              page_name: String(row?.page_name || 'Fanpage'),
              new_customer_count: Number(row?.new_customer_count || 0),
              active_conversation_count: Number(row?.active_conversation_count || 0),
              sent_message_count: Number(row?.sent_message_count || 0),
              note_count: Number(row?.note_count || 0),
              last_activity_at: row?.last_activity_at ? String(row.last_activity_at) : null
            }))
            : [],
          recentConversations: Array.isArray(data?.recentConversations)
            ? data.recentConversations.map((row: any) => ({
              id: Number(row?.id || 0),
              customer_name: String(row?.customer_name || 'Khách hàng'),
              customer_id: String(row?.customer_id || ''),
              page_id: String(row?.page_id || ''),
              page_name: String(row?.page_name || 'Fanpage'),
              customer_status: row?.customer_status ? String(row.customer_status) : null,
              last_message_at: row?.last_message_at ? String(row.last_message_at) : null,
              sent_message_count: Number(row?.sent_message_count || 0),
              note_count: Number(row?.note_count || 0),
              last_activity_at: row?.last_activity_at ? String(row.last_activity_at) : null
            }))
            : []
        });
      })
      .catch(err => {
        console.error('Error loading CSKH personal report:', err);
        setCskhPersonalError(err.message || 'Không thể tải báo cáo cá nhân CSKH.');
        setCskhPersonalReport(EMPTY_CSKH_PERSONAL_REPORT);
      })
      .finally(() => setIsLoadingCskhPersonal(false));
  }, [selectedReport, dateRange, user?.email, user?.name]);

  const currentData = revenueReport.summary;
  const selectedReportInfo = REPORTS.find(report => report.id === selectedReport) || REPORTS[0];
  const maxChartRevenue = Math.max(1, ...revenueReport.chart.map(item => item.revenue));
  const chartHasRevenue = revenueReport.chart.some(item => item.revenue > 0);

  const revenueStats = [
    {
      title: 'Tổng doanh thu',
      value: formatYen(currentData.revenue.current),
      ...calculateGrowth(currentData.revenue.current, currentData.revenue.previous),
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      color: 'bg-emerald-100'
    },
    {
      title: 'Đơn hàng mới',
      value: currentData.orders.current.toLocaleString(),
      ...calculateGrowth(currentData.orders.current, currentData.orders.previous),
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Khách hàng mới',
      value: currentData.customers.current.toLocaleString(),
      ...calculateGrowth(currentData.customers.current, currentData.customers.previous),
      icon: <Users className="w-6 h-6 text-rose-600" />,
      color: 'bg-rose-100'
    },
    {
      title: 'Giá trị đơn TB',
      value: formatYen(currentData.averageOrderValue.current),
      ...calculateGrowth(currentData.averageOrderValue.current, currentData.averageOrderValue.previous),
      icon: <Activity className="w-6 h-6 text-amber-600" />,
      color: 'bg-amber-100'
    }
  ];

  const messageRows = messageReport?.rows || [];
  const messageSummary = messageReport?.summary || {
    message_count: 0,
    conversation_count: 0,
    customer_count: 0,
    unassigned_customer_count: 0,
    response_count: 0,
    total_response_seconds: 0,
    average_response_seconds: 0,
    page_count: 0,
    staff_count: 0
  };
  const messagesPerConversation = messageSummary.conversation_count > 0
    ? messageSummary.message_count / messageSummary.conversation_count
    : 0;

  const staffTotals = useMemo(() => {
    const totals = new Map<string, { name: string; role: string; customers: number; conversations: number; messages: number; responseCount: number; responseSecondsTotal: number }>();
    messageRows.forEach(row => {
      const key = row.staff_email || row.staff_key || row.staff_name;
      const current = totals.get(key) || { name: row.staff_name, role: row.staff_role || '', customers: 0, conversations: 0, messages: 0, responseCount: 0, responseSecondsTotal: 0 };
      current.customers += Number(row.customer_count || 0);
      current.conversations += Number(row.conversation_count || 0);
      current.messages += Number(row.message_count || 0);
      current.responseCount += Number(row.response_count || 0);
      current.responseSecondsTotal += Number(row.total_response_seconds || 0);
      totals.set(key, current);
    });
    return Array.from(totals.values()).sort((a, b) => b.customers - a.customers);
  }, [messageRows]);

  const maxStaffCustomers = Math.max(1, ...staffTotals.map(item => item.customers));
  const cskhPersonalSummary = cskhPersonalReport.summary;
  const cskhPersonalRows = cskhPersonalReport.byPage;
  const cskhRecentConversations = cskhPersonalReport.recentConversations;
  const maxCskhPageMessages = Math.max(1, ...cskhPersonalRows.map(item => item.sent_message_count));
  const pageOptions = useMemo(
    () => pageReport.rows
      .filter(row => row.page_id && row.page_id !== 'unassigned')
      .sort((a, b) => a.page_name.localeCompare(b.page_name, 'vi')),
    [pageReport.rows]
  );
  const selectedPageRows = useMemo(() => {
    const rows = selectedPageId === 'all'
      ? [...pageReport.rows]
      : pageReport.rows.filter(row => row.page_id === selectedPageId);

    return rows.sort((a, b) => b.revenue - a.revenue || b.message_count - a.message_count || a.page_name.localeCompare(b.page_name, 'vi'));
  }, [pageReport.rows, selectedPageId]);
  const pageSummary = useMemo(
    () => selectedPageId === 'all' ? pageReport.summary : buildPageReportSummary(selectedPageRows),
    [pageReport.summary, selectedPageId, selectedPageRows]
  );
  const selectedPageName = selectedPageId === 'all'
    ? 'Tất cả Page'
    : pageOptions.find(page => page.page_id === selectedPageId)?.page_name || 'Fanpage';

  useEffect(() => {
    if (selectedPageId === 'all') return;
    if (!pageOptions.some(page => page.page_id === selectedPageId)) {
      setSelectedPageId('all');
    }
  }, [pageOptions, selectedPageId]);

  const renderPageReport = () => {
    const messageStats = [
      { title: 'Tổng tin nhắn', value: formatNumber(pageSummary.message_count), icon: <Inbox className="w-5 h-5 text-blue-600" />, color: 'bg-blue-100' },
      { title: 'Khách mới', value: formatNumber(pageSummary.new_customer_count), icon: <Users className="w-5 h-5 text-rose-600" />, color: 'bg-rose-100' },
      { title: 'Hội thoại', value: formatNumber(pageSummary.conversation_count), icon: <MessageSquare className="w-5 h-5 text-violet-600" />, color: 'bg-violet-100' },
      { title: 'Tin nhân viên', value: formatNumber(pageSummary.human_message_count), icon: <FileText className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-100' }
    ];
    const revenueStats = [
      { title: 'Doanh thu', value: formatYen(pageSummary.revenue), icon: <DollarSign className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-100' },
      { title: 'Đơn hàng', value: formatNumber(pageSummary.order_count), icon: <Receipt className="w-5 h-5 text-blue-600" />, color: 'bg-blue-100' },
      { title: 'Khách mua', value: formatNumber(pageSummary.revenue_customer_count), icon: <Users className="w-5 h-5 text-rose-600" />, color: 'bg-rose-100' },
      { title: 'Đơn TB', value: formatYen(pageSummary.average_order_value), icon: <Activity className="w-5 h-5 text-amber-600" />, color: 'bg-amber-100' }
    ];
    const adStats = [
      { title: 'Chi phí Ads', value: formatYen(pageSummary.ad_cost), icon: <Megaphone className="w-5 h-5 text-rose-600" />, color: 'bg-rose-100' },
      { title: 'Hội thoại Ads', value: formatNumber(pageSummary.ad_conversation_count), icon: <MessageSquare className="w-5 h-5 text-blue-600" />, color: 'bg-blue-100' },
      { title: 'Chi phí/khách', value: formatYen(pageSummary.cost_per_customer), icon: <Target className="w-5 h-5 text-amber-600" />, color: 'bg-amber-100' },
      { title: 'ROAS', value: `${formatRatio(pageSummary.roas)}x`, icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-100' }
    ];
    const overviewStats = [
      { title: 'Page đang xem', value: selectedPageId === 'all' ? formatNumber(pageSummary.page_count) : '1', icon: <BarChart3 className="w-6 h-6 text-blue-600" />, color: 'bg-blue-100' },
      { title: 'Tin nhắn', value: formatNumber(pageSummary.message_count), icon: <Inbox className="w-6 h-6 text-violet-600" />, color: 'bg-violet-100' },
      { title: 'Doanh thu', value: formatYen(pageSummary.revenue), icon: <DollarSign className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100' },
      { title: 'Lãi sau Ads', value: formatYen(pageSummary.profit_after_ads), icon: <Wallet className="w-6 h-6 text-amber-600" />, color: 'bg-amber-100' }
    ];

    const renderStatGroup = (title: string, subtitle: string, stats: typeof messageStats) => (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="mb-5">
          <h3 className="font-black text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map(stat => (
            <div key={stat.title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-full">{dateRange}</span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">{stat.title}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <>
        {pageReportError && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {pageReportError}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Báo cáo theo Fanpage</h3>
              <p className="text-sm text-slate-500 mt-1">
                Chọn một Page để toàn bộ chỉ số tin nhắn, doanh thu và chi phí quảng cáo bên dưới cập nhật theo Page đó.
              </p>
            </div>
            <div className="relative min-w-full sm:min-w-[320px] lg:min-w-[360px]">
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="all">Tất cả Page</option>
                {pageOptions.map(page => (
                  <option key={page.page_id} value={page.page_id}>{page.page_name}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {overviewStats.map((stat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              key={stat.title}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>{stat.icon}</div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">{dateRange}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {renderStatGroup('Tin nhắn', selectedPageName, messageStats)}
          {renderStatGroup('Doanh thu', selectedPageName, revenueStats)}
          {renderStatGroup('Chi phí quảng cáo', selectedPageName, adStats)}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Đối chiếu tổng hợp theo Fanpage</h3>
              <p className="text-slate-500 text-sm mt-1">
                Mỗi dòng hiển thị đủ ba nhóm dữ liệu để so sánh hiệu quả giữa các Page trong kỳ đang chọn.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">
              {selectedPageName}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Fanpage</th>
                  <th className="px-6 py-4 text-right">Khách mới</th>
                  <th className="px-6 py-4 text-right">Tin nhắn</th>
                  <th className="px-6 py-4 text-right">Đơn hàng</th>
                  <th className="px-6 py-4 text-right">Doanh thu</th>
                  <th className="px-6 py-4 text-right">Chi phí Ads</th>
                  <th className="px-6 py-4 text-right">Lãi sau Ads</th>
                  <th className="px-6 py-4 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPageReport ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : selectedPageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      Chưa có dữ liệu theo Page trong kỳ này.
                    </td>
                  </tr>
                ) : selectedPageRows.map(row => (
                  <tr key={row.page_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{row.page_name}</p>
                      {row.page_id !== 'unassigned' && <p className="text-xs text-slate-400">ID: {row.page_id}</p>}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-700">{formatNumber(row.new_customer_count)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">{formatNumber(row.message_count)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">{formatNumber(row.order_count)}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-700">{formatYen(row.revenue)}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">{formatYen(row.ad_cost)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatYen(row.profit_after_ads)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatRatio(row.roas)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderRevenueReport = () => (
    <>
      {revenueReportError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {revenueReportError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {revenueStats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.title}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>

            <div>
              <p className="text-slate-500 font-medium text-sm mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Biểu đồ doanh thu</h3>
              <p className="text-slate-500 text-sm">Doanh thu theo thời gian</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-4">
            {isLoadingRevenue ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
              </div>
            ) : revenueReport.chart.length === 0 || !chartHasRevenue ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Activity className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-medium">Chưa có doanh thu trong kỳ này.</p>
              </div>
            ) : (
              <div className="h-full flex items-end gap-2">
                {revenueReport.chart.map(point => {
                  const height = Math.max(4, (point.revenue / maxChartRevenue) * 100);
                  return (
                    <div key={point.label} className="flex-1 min-w-0 h-full flex flex-col justify-end gap-2 group">
                      <div className="relative flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-lg bg-blue-500/80 group-hover:bg-blue-600 transition-colors"
                          style={{ height: `${height}%` }}
                          title={`${point.label}: ${formatYen(point.revenue)} (${point.orders} đơn)`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 truncate text-center">{point.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="font-bold text-slate-800 text-lg mb-6">Sản phẩm bán chạy</h3>
          {isLoadingRevenue ? (
            <div className="h-52 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : revenueReport.topProducts.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400 text-center">
              Chưa có sản phẩm bán trong kỳ này.
            </div>
          ) : (
            <div className="space-y-6">
              {revenueReport.topProducts.map(prod => (
                <div key={prod.name}>
                  <div className="flex justify-between items-center mb-2 gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 text-sm truncate">{prod.name}</p>
                      <p className="text-xs text-slate-500">{prod.sales.toLocaleString('vi-VN')} đơn hàng</p>
                    </div>
                    <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{formatYen(prod.revenue)}</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${prod.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Đơn hàng gần đây</h3>
            <p className="text-slate-500 text-sm">Chi tiết các giao dịch mới nhất</p>
          </div>
          <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã ĐH</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingRevenue ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải dữ liệu...
                  </td>
                </tr>
              ) : revenueReport.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Chưa có đơn hàng trong kỳ này.
                  </td>
                </tr>
              ) : revenueReport.recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
                        {order.customer.charAt(0)}
                      </div>
                      <span className="text-slate-600">{order.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{order.product}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDateTime(order.date)}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{formatYen(order.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getOrderStatusBadgeClass(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderMessageReport = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {[
          { title: 'Khách mới nhắn tin', value: messageSummary.customer_count, icon: <MessageSquare className="w-6 h-6 text-blue-600" />, color: 'bg-blue-100' },
          { title: 'Số tin nhắn', value: messageSummary.message_count, icon: <Inbox className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100' },
          { title: 'Tin nhắn / Hội thoại', value: messagesPerConversation.toFixed(1), icon: <FileText className="w-6 h-6 text-violet-600" />, color: 'bg-violet-100' },
          { title: 'Phản hồi TB', value: formatDuration(messageSummary.average_response_seconds), icon: <Timer className="w-6 h-6 text-cyan-600" />, color: 'bg-cyan-100' },
          { title: 'Khách chưa giao', value: messageSummary.unassigned_customer_count, icon: <AlertCircle className="w-6 h-6 text-amber-600" />, color: 'bg-amber-100' }
        ].map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            key={stat.title}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>{stat.icon}</div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">{dateRange}</span>
            </div>
            <p className="text-slate-500 font-medium text-sm mb-1">{stat.title}</p>
            <h3 className="text-2xl font-black text-slate-800">
              {typeof stat.value === 'string' ? stat.value : Number(stat.value || 0).toLocaleString('vi-VN')}
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg">Khách mới nhắn tin theo Page và nhân viên</h3>
            <p className="text-slate-500 text-sm mt-1">Mỗi khách/Page chỉ tính một lần, tại thời điểm khách gửi tin đầu tiên trong kỳ đã chọn.</p>
          </div>

          {isLoadingMessages ? (
            <div className="h-72 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : messageReportError ? (
            <div className="m-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{messageReportError}</div>
          ) : messageRows.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-bold">Chưa có khách mới nhắn tin trong kỳ này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Fanpage</th>
                    <th className="px-6 py-4">Nhân viên</th>
                    <th className="px-6 py-4 text-right">Khách mới</th>
                    <th className="px-6 py-4 text-right">Tin nhắn</th>
                    <th className="px-6 py-4 text-right">Tin/Hội thoại</th>
                    <th className="px-6 py-4 text-right">Phản hồi TB</th>
                    <th className="px-6 py-4">Khách mới nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messageRows.map(row => (
                    <tr key={`${row.page_id}-${row.staff_key}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{row.page_name}</p>
                        <p className="text-xs text-slate-400">ID: {row.page_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{row.staff_name}</p>
                        <p className="text-xs text-slate-400">{row.staff_role || row.staff_email || 'Chưa có vai trò'}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-blue-700">{Number(row.customer_count || 0).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right text-slate-700 font-bold">{Number(row.message_count || 0).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right text-slate-700 font-bold">
                        {row.conversation_count > 0 ? (Number(row.message_count || 0) / Number(row.conversation_count)).toFixed(1) : '0.0'}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700 font-bold">{formatDuration(row.average_response_seconds)}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(row.last_message_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="font-bold text-slate-800 text-lg mb-1">Xếp hạng nhân viên</h3>
          <p className="text-slate-500 text-sm mb-6">Tổng khách mới nhắn tin theo người phụ trách.</p>
          {staffTotals.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400 text-center">
              Chưa có dữ liệu để xếp hạng.
            </div>
          ) : (
            <div className="space-y-5">
              {staffTotals.map(staff => (
                <div key={staff.name}>
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 text-sm truncate">{staff.name}</p>
                      <p className="text-xs text-slate-500">
                        {staff.customers.toLocaleString('vi-VN')} khách mới · {staff.messages.toLocaleString('vi-VN')} tin nhắn · {formatDuration(staff.responseCount > 0 ? staff.responseSecondsTotal / staff.responseCount : 0)} phản hồi TB
                      </p>
                    </div>
                    <p className="font-black text-slate-900 text-sm">{staff.customers.toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.max(4, (staff.customers / maxStaffCustomers) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderCskhPersonalReport = () => (
    <>
      {cskhPersonalError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {cskhPersonalError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: 'Khách mới cá nhân', value: cskhPersonalSummary.new_customer_count, icon: <MessageSquare className="w-6 h-6 text-blue-600" />, color: 'bg-blue-100' },
          { title: 'Hội thoại đã xử lý', value: cskhPersonalSummary.handled_conversation_count, icon: <Users className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100' },
          { title: 'Tin CSKH đã gửi', value: cskhPersonalSummary.sent_message_count, icon: <Inbox className="w-6 h-6 text-violet-600" />, color: 'bg-violet-100' },
          { title: 'Ghi chú cá nhân', value: cskhPersonalSummary.note_count, icon: <FileText className="w-6 h-6 text-amber-600" />, color: 'bg-amber-100' }
        ].map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            key={stat.title}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>{stat.icon}</div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">{dateRange}</span>
            </div>
            <p className="text-slate-500 font-medium text-sm mb-1">{stat.title}</p>
            <h3 className="text-2xl font-black text-slate-800">{Number(stat.value || 0).toLocaleString('vi-VN')}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg">Hiệu suất cá nhân theo Fanpage</h3>
            <p className="text-slate-500 text-sm mt-1">Chỉ tính dữ liệu gắn với tài khoản {user?.name || user?.email || 'CSKH'} trong kỳ đang chọn.</p>
          </div>

          {isLoadingCskhPersonal ? (
            <div className="h-72 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : cskhPersonalRows.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-bold">Chưa có dữ liệu cá nhân trong kỳ này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Fanpage</th>
                    <th className="px-6 py-4 text-right">Khách mới</th>
                    <th className="px-6 py-4 text-right">Hội thoại</th>
                    <th className="px-6 py-4 text-right">Tin đã gửi</th>
                    <th className="px-6 py-4 text-right">Ghi chú</th>
                    <th className="px-6 py-4">Hoạt động cuối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cskhPersonalRows.map(row => (
                    <tr key={row.page_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{row.page_name}</p>
                        <div className="mt-2 h-1.5 w-40 max-w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.max(4, (row.sent_message_count / maxCskhPageMessages) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-blue-700">{row.new_customer_count.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{row.active_conversation_count.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{row.sent_message_count.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{row.note_count.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(row.last_activity_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Hội thoại gần đây</h3>
              <p className="text-slate-500 text-sm">Các khách có hoạt động cá nhân mới nhất.</p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              {cskhPersonalSummary.page_count.toLocaleString('vi-VN')} Page
            </span>
          </div>

          {isLoadingCskhPersonal ? (
            <div className="h-52 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : cskhRecentConversations.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400 text-center">
              Chưa có hội thoại cá nhân trong kỳ này.
            </div>
          ) : (
            <div className="space-y-4">
              {cskhRecentConversations.map(conv => (
                <div key={conv.id} className="border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                      {conv.customer_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{conv.customer_name}</p>
                          <p className="text-xs text-slate-500 truncate">{conv.page_name}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md shrink-0">
                          {formatDateTime(conv.last_activity_at)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700">{conv.sent_message_count.toLocaleString('vi-VN')} tin gửi</span>
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700">{conv.note_count.toLocaleString('vi-VN')} ghi chú</span>
                        {conv.customer_status && (
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600">{conv.customer_status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none opacity-60" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>Báo cáo & Thống kê</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Báo cáo
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            Chọn loại báo cáo phù hợp với quyền của tài khoản để theo dõi tình hình vận hành.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
          <div className="relative">
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportType)}
              className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {allowedReports.map(report => (
                <option key={report.id} value={report.id}>{report.label}</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="Hôm nay">Hôm nay</option>
              <option value="Hôm qua">Hôm qua</option>
              <option value="Tuần này">Tuần này</option>
              <option value="Tháng này">Tháng này</option>
              <option value="Năm nay">Năm nay</option>
            </select>
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại báo cáo đang xem</p>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            {selectedReport === 'page_messages'
              ? <MessageSquare className="w-5 h-5" />
              : selectedReport === 'page_overview'
                ? <BarChart3 className="w-5 h-5" />
                : selectedReport === 'cskh_personal'
                  ? <Users className="w-5 h-5" />
                  : <DollarSign className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-black text-slate-900">{selectedReportInfo.label}</h2>
            <p className="text-sm text-slate-500">{selectedReportInfo.description}</p>
          </div>
        </div>
      </div>

      {isPageReportSelected
        ? renderPageReport()
        : selectedReport === 'page_messages'
          ? renderMessageReport()
          : selectedReport === 'cskh_personal'
            ? renderCskhPersonalReport()
            : renderRevenueReport()}
    </div>
  );
};
