import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Activity, ArrowUpRight, ArrowDownRight, Calendar, MessageSquare, Inbox, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { EMPTY_REVENUE_REPORT, calculateGrowth, fetchRevenueReport, formatYen } from '../../services/revenueReport';
import { API_BASE_URL } from '../../components/messenger/api';

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

const EMPTY_CSKH_PERSONAL_REPORT: CskhPersonalMobileReport = {
  summary: {
    new_customer_count: 0,
    handled_conversation_count: 0,
    sent_message_count: 0,
    note_count: 0
  },
  byPage: []
};

const normalizeRole = (role?: string | null) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const MobileRevenuePage = ({ user }: { user?: any }) => {
  const [range, setRange] = useState('Tháng này');
  const [report, setReport] = useState(EMPTY_REVENUE_REPORT);
  const [cskhReport, setCskhReport] = useState<CskhPersonalMobileReport>(EMPTY_CSKH_PERSONAL_REPORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const d = report.summary;
  const normalizedRole = normalizeRole(user?.role);
  const isCskhPersonal = normalizedRole.includes('cskh') || normalizedRole.includes('cham soc khach hang');

  useEffect(() => {
    if (isCskhPersonal) return;

    const controller = new AbortController();
    let isActive = true;

    setIsLoading(true);
    setError(null);
    fetchRevenueReport(range, controller.signal)
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
  }, [range, isCskhPersonal]);

  useEffect(() => {
    if (!isCskhPersonal) return;

    if (!user?.email) {
      setError('Không xác định được email nhân viên CSKH.');
      setCskhReport(EMPTY_CSKH_PERSONAL_REPORT);
      return;
    }

    let isActive = true;
    const params = new URLSearchParams({ range, email: user.email });
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
  }, [range, isCskhPersonal, user?.email, user?.name]);

  const growth = (current: number, previous: number) => {
    const result = calculateGrowth(current, previous);
    return { change: result.change, up: result.isPositive };
  };

  const stats = isCskhPersonal
    ? [
      { title: 'Khách mới', value: cskhReport.summary.new_customer_count.toLocaleString('vi-VN'), badge: range, icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
      { title: 'Hội thoại', value: cskhReport.summary.handled_conversation_count.toLocaleString('vi-VN'), badge: range, icon: Users, color: 'bg-emerald-100 text-emerald-600' },
      { title: 'Tin đã gửi', value: cskhReport.summary.sent_message_count.toLocaleString('vi-VN'), badge: range, icon: Inbox, color: 'bg-violet-100 text-violet-600' },
      { title: 'Ghi chú', value: cskhReport.summary.note_count.toLocaleString('vi-VN'), badge: range, icon: FileText, color: 'bg-amber-100 text-amber-600' },
    ]
    : [
      { title: 'Doanh thu', value: formatYen(d.revenue.current), ...growth(d.revenue.current, d.revenue.previous), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
      { title: 'Đơn hàng', value: d.orders.current.toLocaleString(), ...growth(d.orders.current, d.orders.previous), icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
      { title: 'Khách mới', value: d.customers.current.toLocaleString(), ...growth(d.customers.current, d.customers.previous), icon: Users, color: 'bg-rose-100 text-rose-600' },
      { title: 'Đơn TB', value: formatYen(d.averageOrderValue.current), ...growth(d.averageOrderValue.current, d.averageOrderValue.previous), icon: Activity, color: 'bg-amber-100 text-amber-600' },
    ];
  const maxMobileCskhMessages = Math.max(1, ...cskhReport.byPage.map(page => page.sent_message_count));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Báo cáo
          </h1>
          <div className="relative">
            <select value={range} onChange={e => setRange(e.target.value)}
              className="bg-slate-100 border-none rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-700 outline-none appearance-none">
              <option>Hôm nay</option><option>Hôm qua</option><option>Tuần này</option><option>Tháng này</option><option>Năm nay</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
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
          <h3 className="font-bold text-sm text-slate-800 mb-4">{isCskhPersonal ? 'Hiệu suất theo Fanpage' : 'Sản phẩm bán chạy'}</h3>
          {isLoading ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400">Đang tải dữ liệu...</div>
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
