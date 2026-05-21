import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Activity, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const PERIOD_DATA: Record<string, any> = {
  'Hôm nay': { revenue: { current: 150000, previous: 120000 }, orders: { current: 24, previous: 20 }, customers: { current: 12, previous: 15 }, conversion: { current: 4.2, previous: 3.8 } },
  'Tuần này': { revenue: { current: 1250000, previous: 1100000 }, orders: { current: 185, previous: 160 }, customers: { current: 85, previous: 70 }, conversion: { current: 4.5, previous: 4.2 } },
  'Tháng này': { revenue: { current: 2450000, previous: 2100000 }, orders: { current: 342, previous: 310 }, customers: { current: 128, previous: 140 }, conversion: { current: 4.8, previous: 4.6 } },
  'Năm nay': { revenue: { current: 28450000, previous: 25000000 }, orders: { current: 4200, previous: 3800 }, customers: { current: 1540, previous: 1400 }, conversion: { current: 5.1, previous: 4.9 } },
};

export const MobileRevenuePage = ({ user }: { user?: any }) => {
  const [range, setRange] = useState('Tháng này');
  const d = PERIOD_DATA[range] || PERIOD_DATA['Tháng này'];
  const growth = (c: number, p: number) => { const g = ((c - p) / p) * 100; return { change: `${g >= 0 ? '+' : ''}${g.toFixed(1)}%`, up: g >= 0 }; };

  const stats = [
    { title: 'Doanh thu', value: `${d.revenue.current.toLocaleString()} ¥`, ...growth(d.revenue.current, d.revenue.previous), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Đơn hàng', value: d.orders.current.toLocaleString(), ...growth(d.orders.current, d.orders.previous), icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
    { title: 'Khách mới', value: d.customers.current.toLocaleString(), ...growth(d.customers.current, d.customers.previous), icon: Users, color: 'bg-rose-100 text-rose-600' },
    { title: 'Chuyển đổi', value: `${d.conversion.current}%`, ...growth(d.conversion.current, d.conversion.previous), icon: Activity, color: 'bg-amber-100 text-amber-600' },
  ];

  const topProducts = [
    { name: 'Sim Data SoftBank', sales: 156, revenue: '546.000 ¥', pct: 85 },
    { name: 'Pocket Wifi', sales: 89, revenue: '373.800 ¥', pct: 60 },
    { name: 'Wifi Cố Định', sales: 45, revenue: '225.000 ¥', pct: 35 },
    { name: 'Combo Sim + ĐT', sales: 24, revenue: '288.000 ¥', pct: 20 },
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
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <div><p className="font-bold text-xs text-slate-700">{p.name}</p><p className="text-[10px] text-slate-400">{p.sales} đơn</p></div>
                  <p className="font-bold text-xs text-slate-900">{p.revenue}</p>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
