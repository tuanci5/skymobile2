import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Activity, ArrowUpRight, ArrowDownRight, Calendar, MessageSquare, Inbox, FileText, BarChart3, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { EMPTY_REVENUE_REPORT, calculateGrowth, fetchRevenueReport, formatYen } from '../../services/revenueReport';
import { API_BASE_URL } from '../../components/messenger/api';
import { useAuth } from '../../context/AuthContext';

type MobileReportType = 'revenue' | 'page_overview' | 'cskh_personal' | 'page_messages';

type MobileReportDefinition = {
  id: MobileReportType;
  label: string;
  description: string;
};

const REPORT_PERMISSION_PREFIX = 'report:';

const MOBILE_REPORTS: MobileReportDefinition[] = [
  {
    id: 'revenue',
    label: 'Doanh thu',
    description: 'Dòng tiền, đơn hàng, khách hàng và sản phẩm bán chạy.'
  },
  {
    id: 'page_overview',
    label: 'Báo cáo theo Page',
    description: 'Tin nhắn, doanh thu và chi phí quảng cáo theo từng Fanpage.'
  },
  {
    id: 'cskh_personal',
    label: 'Báo cáo cá nhân CSKH',
    description: 'Khách mới, hội thoại, tin nhắn và ghi chú của tài khoản đang đăng nhập.'
  },
  {
    id: 'page_messages',
    label: 'Khách mới nhắn Page theo nhân viên',
    description: 'Số khách nhắn tin lần đầu theo Fanpage và nhân sự phụ trách.'
  }
];

type CskhPersonalMobileReport = {
  summary: {
    new_customer_count: number;
    handled_conversation_count: number;
    sent_message_count: number;
    note_count: number;
  };
  byPage: Array<{
    page_id: string;
    page_name: string;
    new_customer_count: number;
    active_conversation_count: number;
    sent_message_count: number;
    note_count: number;
  }>;
};

type PageMobileReport = {
  summary: {
    page_count: number;
    conversation_count: number;
    new_customer_count: number;
    message_count: number;
    order_count: number;
    revenue: number;
    ad_cost: number;
    profit_after_ads: number;
  };
  rows: Array<{
    page_id: string;
    page_name: string;
    message_count: number;
    new_customer_count: number;
    order_count: number;
    revenue: number;
    ad_cost: number;
  }>;
};

type MessageMobileReport = {
  summary: {
    message_count: number;
    conversation_count: number;
    customer_count: number;
    page_count: number;
    staff_count: number;
  };
  rows: Array<{
    page_id: string;
    page_name: string;
    staff_key: string;
    staff_name: string;
    message_count: number;
    conversation_count: number;
    customer_count: number;
  }>;
};

const EMPTY_CSKH_PERSONAL_REPORT: CskhPersonalMobileReport = {
  summary: {
    new_customer_count: 0,
    handled_conversation_count: 0,
    sent_message_count: 0,
    note_count: 0
  },
  byPage: []
};

const EMPTY_PAGE_REPORT: PageMobileReport = {
  summary: {
    page_count: 0,
    conversation_count: 0,
    new_customer_count: 0,
    message_count: 0,
    order_count: 0,
    revenue: 0,
    ad_cost: 0,
    profit_after_ads: 0
  },
  rows: []
};

const EMPTY_MESSAGE_REPORT: MessageMobileReport = {
  summary: {
    message_count: 0,
    conversation_count: 0,
    customer_count: 0,
    page_count: 0,
    staff_count: 0
  },
  rows: []
};

const normalizeRole = (role?: string | null) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const parseAllowedPermissions = (allowedTabs: any): string[] => {
  if (Array.isArray(allowedTabs)) return allowedTabs;
  if (typeof allowedTabs === 'string') {
    try {
      const parsed = JSON.parse(allowedTabs);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Invalid mobile report permissions format:', error);
    }
  }
  return [];
};

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

const canViewCskhPersonalReport = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized.includes('cskh') || normalized.includes('cham soc khach hang');
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

const canViewPageReport = (role?: string | null) =>
  canViewRevenueReport(role) || canViewMessageReport(role);

const getAllowedMobileReports = (user?: any, rolePermissions: any[] = []) => {
  const role = user?.role;
  const roleConfig = rolePermissions.find(permission => permission.role === role);
  const allowedPermissions = parseAllowedPermissions(roleConfig?.allowed_tabs);
  const configuredReportPermissions = allowedPermissions.filter(permission => permission.startsWith(REPORT_PERMISSION_PREFIX));

  if (configuredReportPermissions.length > 0) {
    return MOBILE_REPORTS.filter(report => configuredReportPermissions.includes(`${REPORT_PERMISSION_PREFIX}${report.id}`));
  }

  return MOBILE_REPORTS.filter(report => {
    if (report.id === 'revenue') return canViewRevenueReport(role);
    if (report.id === 'page_overview') return canViewPageReport(role);
    if (report.id === 'cskh_personal') return canViewCskhPersonalReport(role);
    if (report.id === 'page_messages') return canViewMessageReport(role);
    return false;
  });
};

export const MobileRevenuePage = ({ user }: { user?: any }) => {
  const { rolePermissions } = useAuth();
  const [range, setRange] = useState('Tháng này');
  const [customStartDate, setCustomStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const allowedReports = useMemo(() => getAllowedMobileReports(user, rolePermissions), [user, rolePermissions]);
  const [selectedReport, setSelectedReport] = useState<MobileReportType>(allowedReports[0]?.id || 'revenue');
  const hasAllowedReports = allowedReports.length > 0;
  const [report, setReport] = useState(EMPTY_REVENUE_REPORT);
  const [cskhReport, setCskhReport] = useState<CskhPersonalMobileReport>(EMPTY_CSKH_PERSONAL_REPORT);
  const [pageReport, setPageReport] = useState<PageMobileReport>(EMPTY_PAGE_REPORT);
  const [messageReport, setMessageReport] = useState<MessageMobileReport>(EMPTY_MESSAGE_REPORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const d = report.summary;
  const isCskhPersonal = selectedReport === 'cskh_personal';
  const isPageOverview = selectedReport === 'page_overview';
  const isPageMessages = selectedReport === 'page_messages';
  const selectedReportInfo = MOBILE_REPORTS.find(report => report.id === selectedReport) || allowedReports[0] || MOBILE_REPORTS[0];
  const isCustomRange = range === 'Khoảng ngày';
  const customRangeParams = useMemo(() => (
    isCustomRange && customStartDate && customEndDate
      ? { startDate: customStartDate, endDate: customEndDate }
      : undefined
  ), [isCustomRange, customStartDate, customEndDate]);
  const rangeLabel = isCustomRange && customStartDate && customEndDate
    ? `${customStartDate.split('-').reverse().join('/')} - ${customEndDate.split('-').reverse().join('/')}`
    : range;

  useEffect(() => {
    if (!hasAllowedReports) return;
    if (!allowedReports.some(report => report.id === selectedReport)) {
      setSelectedReport(allowedReports[0]?.id || 'revenue');
    }
  }, [allowedReports, hasAllowedReports, selectedReport]);

  useEffect(() => {
    if (!hasAllowedReports) return;
    if (selectedReport !== 'revenue') return;

    const controller = new AbortController();
    let isActive = true;

    setIsLoading(true);
    setError(null);
    fetchRevenueReport(range, controller.signal, customRangeParams)
      .then(data => {
        if (isActive) setReport(data);
      })
      .catch(err => {
        if (!isActive || err.name === 'AbortError') return;
        console.error('Error loading mobile revenue report:', err);
        setError(err.message || 'Không thể tải báo cáo doanh thu.');
        setReport(EMPTY_REVENUE_REPORT);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [range, customRangeParams, selectedReport, hasAllowedReports]);

  useEffect(() => {
    if (!hasAllowedReports) return;
    if (selectedReport !== 'cskh_personal') return;

    if (!user?.email) {
      setError('Không xác định được email nhân viên CSKH.');
      setCskhReport(EMPTY_CSKH_PERSONAL_REPORT);
      return;
    }

    let isActive = true;
    const params = new URLSearchParams({ range, email: user.email });
    if (customRangeParams) {
      params.set('startDate', customRangeParams.startDate);
      params.set('endDate', customRangeParams.endDate);
    }
    if (user?.name) params.set('name', user.name);

    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/fb/reports/cskh-personal?${params.toString()}`)
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Không thể tải báo cáo cá nhân CSKH.');
        if (!isActive) return;
        setCskhReport({
          summary: {
            new_customer_count: Number(data?.summary?.new_customer_count || 0),
            handled_conversation_count: Number(data?.summary?.handled_conversation_count || 0),
            sent_message_count: Number(data?.summary?.sent_message_count || 0),
            note_count: Number(data?.summary?.note_count || 0)
          },
          byPage: Array.isArray(data?.byPage)
            ? data.byPage.map((row: any) => ({
              page_id: String(row?.page_id || ''),
              page_name: String(row?.page_name || 'Fanpage'),
              new_customer_count: Number(row?.new_customer_count || 0),
              active_conversation_count: Number(row?.active_conversation_count || 0),
              sent_message_count: Number(row?.sent_message_count || 0),
              note_count: Number(row?.note_count || 0)
            }))
            : []
        });
      })
      .catch(err => {
        if (!isActive) return;
        console.error('Error loading mobile CSKH personal report:', err);
        setError(err.message || 'Không thể tải báo cáo cá nhân CSKH.');
        setCskhReport(EMPTY_CSKH_PERSONAL_REPORT);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [range, customRangeParams, selectedReport, hasAllowedReports, user?.email, user?.name]);

  useEffect(() => {
    if (!hasAllowedReports) return;
    if (selectedReport !== 'page_overview') return;

    const controller = new AbortController();
    const params = new URLSearchParams({ range });
    if (customRangeParams) {
      params.set('startDate', customRangeParams.startDate);
      params.set('endDate', customRangeParams.endDate);
    }
    const toNumber = (value: unknown) => Number(value || 0);

    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/fb/reports/page-performance?${params.toString()}`, { signal: controller.signal })
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Không thể tải báo cáo theo Page.');
        setPageReport({
          summary: {
            page_count: toNumber(data?.summary?.page_count),
            conversation_count: toNumber(data?.summary?.conversation_count),
            new_customer_count: toNumber(data?.summary?.new_customer_count),
            message_count: toNumber(data?.summary?.message_count),
            order_count: toNumber(data?.summary?.order_count),
            revenue: toNumber(data?.summary?.revenue),
            ad_cost: toNumber(data?.summary?.ad_cost),
            profit_after_ads: toNumber(data?.summary?.profit_after_ads)
          },
          rows: Array.isArray(data?.rows)
            ? data.rows.map((row: any) => ({
              page_id: String(row?.page_id || ''),
              page_name: String(row?.page_name || 'Fanpage'),
              message_count: toNumber(row?.message_count),
              new_customer_count: toNumber(row?.new_customer_count),
              order_count: toNumber(row?.order_count),
              revenue: toNumber(row?.revenue),
              ad_cost: toNumber(row?.ad_cost)
            }))
            : []
        });
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Error loading mobile page report:', err);
        setError(err.message || 'Không thể tải báo cáo theo Page.');
        setPageReport(EMPTY_PAGE_REPORT);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [range, customRangeParams, selectedReport, hasAllowedReports]);

  useEffect(() => {
    if (!hasAllowedReports) return;
    if (selectedReport !== 'page_messages') return;

    const params = new URLSearchParams({ range });
    if (customRangeParams) {
      params.set('startDate', customRangeParams.startDate);
      params.set('endDate', customRangeParams.endDate);
    }
    if (user?.email) params.set('email', user.email);
    if (user?.name) params.set('name', user.name);
    if (user?.role) params.set('role', user.role);
    const toNumber = (value: unknown) => Number(value || 0);

    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/fb/reports/new-messages?${params.toString()}`)
      .then(async res => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Không thể tải báo cáo khách mới.');
        setMessageReport({
          summary: {
            message_count: toNumber(data?.summary?.message_count),
            conversation_count: toNumber(data?.summary?.conversation_count),
            customer_count: toNumber(data?.summary?.customer_count),
            page_count: toNumber(data?.summary?.page_count),
            staff_count: toNumber(data?.summary?.staff_count)
          },
          rows: Array.isArray(data?.rows)
            ? data.rows.map((row: any) => ({
              page_id: String(row?.page_id || ''),
              page_name: String(row?.page_name || 'Fanpage'),
              staff_key: String(row?.staff_key || ''),
              staff_name: String(row?.staff_name || 'Chưa phân công'),
              message_count: toNumber(row?.message_count),
              conversation_count: toNumber(row?.conversation_count),
              customer_count: toNumber(row?.customer_count)
            }))
            : []
        });
      })
      .catch(err => {
        console.error('Error loading mobile message report:', err);
        setError(err.message || 'Không thể tải báo cáo khách mới.');
        setMessageReport(EMPTY_MESSAGE_REPORT);
      })
      .finally(() => setIsLoading(false));
  }, [range, customRangeParams, selectedReport, hasAllowedReports, user?.email, user?.name, user?.role]);

  const growth = (current: number, previous: number) => {
    const result = calculateGrowth(current, previous);
    return { change: result.change, up: result.isPositive };
  };

  const stats = isPageOverview
    ? [
      { title: 'Fanpage', value: pageReport.summary.page_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
      { title: 'Tin nhắn', value: pageReport.summary.message_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: MessageSquare, color: 'bg-violet-100 text-violet-600' },
      { title: 'Doanh thu', value: formatYen(pageReport.summary.revenue), badge: rangeLabel, icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
      { title: 'Chi phí Ads', value: formatYen(pageReport.summary.ad_cost), badge: rangeLabel, icon: Megaphone, color: 'bg-amber-100 text-amber-600' },
    ]
    : isPageMessages
      ? [
        { title: 'Khách mới', value: messageReport.summary.customer_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: Users, color: 'bg-rose-100 text-rose-600' },
        { title: 'Hội thoại', value: messageReport.summary.conversation_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
        { title: 'Tin nhắn', value: messageReport.summary.message_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: Inbox, color: 'bg-violet-100 text-violet-600' },
        { title: 'Nhân viên', value: messageReport.summary.staff_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
      ]
      : isCskhPersonal
    ? [
      { title: 'Khách mới', value: cskhReport.summary.new_customer_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
      { title: 'Hội thoại', value: cskhReport.summary.handled_conversation_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
      { title: 'Tin đã gửi', value: cskhReport.summary.sent_message_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: Inbox, color: 'bg-violet-100 text-violet-600' },
      { title: 'Ghi chú', value: cskhReport.summary.note_count.toLocaleString('vi-VN'), badge: rangeLabel, icon: FileText, color: 'bg-amber-100 text-amber-600' },
    ]
    : [
      { title: 'Doanh thu', value: formatYen(d.revenue.current), ...growth(d.revenue.current, d.revenue.previous), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
      { title: 'Đơn hàng', value: d.orders.current.toLocaleString(), ...growth(d.orders.current, d.orders.previous), icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
      { title: 'Khách mới', value: d.customers.current.toLocaleString(), ...growth(d.customers.current, d.customers.previous), icon: Users, color: 'bg-rose-100 text-rose-600' },
      { title: 'Đơn TB', value: formatYen(d.averageOrderValue.current), ...growth(d.averageOrderValue.current, d.averageOrderValue.previous), icon: Activity, color: 'bg-amber-100 text-amber-600' },
    ];
  const maxMobileCskhMessages = Math.max(1, ...cskhReport.byPage.map(page => page.sent_message_count));
  const maxPageRevenue = Math.max(1, ...pageReport.rows.map(page => page.revenue));
  const maxMessageCustomers = Math.max(1, ...messageReport.rows.map(row => row.customer_count));

  if (!hasAllowedReports) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-white px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 border-b border-slate-200">
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Báo cáo
          </h1>
        </div>
        <div className="p-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            Chức vụ của bạn chưa được phân quyền xem loại báo cáo nào.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Báo cáo
          </h1>
          <div className="relative">
            <select aria-label="Chọn khoảng thời gian báo cáo" value={range} onChange={e => setRange(e.target.value)}
              className="bg-slate-100 border-none rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-700 outline-none appearance-none">
              <option>Hôm nay</option><option>Hôm qua</option><option>Tuần này</option><option>Tháng này</option><option>Năm nay</option><option>Khoảng ngày</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        {isCustomRange && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">
              Từ ngày
              <input
                aria-label="Từ ngày"
                type="date"
                value={customStartDate}
                max={customEndDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              />
            </label>
            <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">
              Đến ngày
              <input
                aria-label="Đến ngày"
                type="date"
                value={customEndDate}
                min={customStartDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              />
            </label>
          </div>
        )}
        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <label className="text-[10px] uppercase tracking-wider font-black text-slate-400">Loại báo cáo</label>
          <div className="relative mt-1.5">
            <select
              aria-label="Chọn loại báo cáo"
              value={selectedReport}
              onChange={e => setSelectedReport(e.target.value as MobileReportType)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-black text-slate-800 outline-none appearance-none shadow-sm"
            >
              {allowedReports.map(report => (
                <option key={report.id} value={report.id}>{report.label}</option>
              ))}
            </select>
            {isCskhPersonal
              ? <Users className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              : isPageMessages
                ? <MessageSquare className="w-4 h-4 text-violet-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              : <BarChart3 className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-500 font-medium">{selectedReportInfo.description}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${s.color}`}><Icon className="w-4 h-4" /></div>
                  {(s as any).change ? (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${(s as any).up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                      {(s as any).up ? <ArrowUpRight className="w-2.5 h-2.5 inline" /> : <ArrowDownRight className="w-2.5 h-2.5 inline" />} {(s as any).change}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-slate-500 bg-slate-50">{(s as any).badge}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{s.title}</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{s.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Detail List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-slate-800 mb-4">
            {isPageOverview ? 'Hiệu quả theo Fanpage' : isPageMessages ? 'Khách mới theo nhân viên' : isCskhPersonal ? 'Hiệu suất theo Fanpage' : 'Sản phẩm bán chạy'}
          </h3>
          {isLoading ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400">Đang tải dữ liệu...</div>
          ) : isPageOverview ? (
            pageReport.rows.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400">Chưa có dữ liệu Page trong kỳ này.</div>
            ) : (
              <div className="space-y-4">
                {pageReport.rows.map((page, i) => (
                  <div key={`${page.page_id}-${i}`}>
                    <div className="flex justify-between items-center mb-1.5 gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-700 truncate">{page.page_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {page.message_count.toLocaleString('vi-VN')} tin · {page.new_customer_count.toLocaleString('vi-VN')} khách · {page.order_count.toLocaleString('vi-VN')} đơn
                        </p>
                      </div>
                      <p className="font-bold text-xs text-slate-900 whitespace-nowrap">{formatYen(page.revenue)}</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(4, (page.revenue / maxPageRevenue) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : isPageMessages ? (
            messageReport.rows.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400">Chưa có khách mới nhắn Page trong kỳ này.</div>
            ) : (
              <div className="space-y-4">
                {messageReport.rows.map((row, i) => (
                  <div key={`${row.page_id}-${row.staff_key}-${i}`}>
                    <div className="flex justify-between items-center mb-1.5 gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-700 truncate">{row.staff_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {row.page_name} · {row.conversation_count.toLocaleString('vi-VN')} hội thoại · {row.message_count.toLocaleString('vi-VN')} tin
                        </p>
                      </div>
                      <p className="font-bold text-xs text-slate-900 whitespace-nowrap">{row.customer_count.toLocaleString('vi-VN')} khách</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${Math.max(4, (row.customer_count / maxMessageCustomers) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : isCskhPersonal ? (
            cskhReport.byPage.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400">Chưa có dữ liệu cá nhân trong kỳ này.</div>
            ) : (
              <div className="space-y-4">
                {cskhReport.byPage.map((page, i) => (
                  <div key={`${page.page_id}-${i}`}>
                    <div className="flex justify-between items-center mb-1.5 gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-700 truncate">{page.page_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {page.active_conversation_count.toLocaleString('vi-VN')} hội thoại · {page.note_count.toLocaleString('vi-VN')} ghi chú
                        </p>
                      </div>
                      <p className="font-bold text-xs text-slate-900 whitespace-nowrap">{page.sent_message_count.toLocaleString('vi-VN')} tin</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.max(4, (page.sent_message_count / maxMobileCskhMessages) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : report.topProducts.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400">Chưa có sản phẩm bán trong kỳ này.</div>
          ) : (
            <div className="space-y-4">
              {report.topProducts.map((p, i) => (
                <div key={`${p.name}-${i}`}>
                  <div className="flex justify-between items-center mb-1.5 gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-700 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.sales.toLocaleString('vi-VN')} đơn</p>
                    </div>
                    <p className="font-bold text-xs text-slate-900 whitespace-nowrap">{formatYen(p.revenue)}</p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
