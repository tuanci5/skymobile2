import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Activity, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { EMPTY_REVENUE_REPORT, calculateGrowth, fetchRevenueReport, formatYen } from '../../services/revenueReport';

export const MobileRevenuePage = ({ user }: { user?: any }) => {
  const [range, setRange] = useState('Tháng này');
  const [report, setReport] = useState(EMPTY_REVENUE_REPORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const d = report.summary;

  useEffect(() => {
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
  }, [range]);

  const growth = (current: number, previous: number) => {
    const result = calculateGrowth(current, previous);
    return { change: result.change, up: result.isPositive };
  };

  const stats = [
    { title: 'Doanh thu', value: formatYen(d.revenue.current), ...growth(d.revenue.current, d.revenue.previous), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Đơn hàng', value: d.orders.current.toLocaleString(), ...growth(d.orders.current, d.orders.previous), icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
    { title: 'Khách mới', value: d.customers.current.toLocaleString(), ...growth(d.customers.current, d.customers.previous), icon: Users, color: 'bg-rose-100 text-rose-600' },
    { title: 'Đơn TB', value: formatYen(d.averageOrderValue.current), ...growth(d.averageOrderValue.current, d.averageOrderValue.previous), icon: Activity, color: 'bg-amber-100 text-amber-600' },
  ];

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
              <option>Hôm nay</option><option>Tuần này</option><option>Tháng này</option><option>Năm nay</option>
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
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                    {s.up ? <ArrowUpRight className="w-2.5 h-2.5 inline" /> : <ArrowDownRight className="w-2.5 h-2.5 inline" />} {s.change}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{s.title}</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{s.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Sản phẩm bán chạy</h3>
          {isLoading ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400">Đang tải dữ liệu...</div>
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
