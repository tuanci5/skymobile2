import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';

const PERIOD_DATA: Record<string, any> = {
  'Hôm nay': {
    revenue: { current: 150000, previous: 120000 },
    orders: { current: 24, previous: 20 },
    customers: { current: 12, previous: 15 },
    conversion: { current: 4.2, previous: 3.8 }
  },
  'Tuần này': {
    revenue: { current: 1250000, previous: 1100000 },
    orders: { current: 185, previous: 160 },
    customers: { current: 85, previous: 70 },
    conversion: { current: 4.5, previous: 4.2 }
  },
  'Tháng này': {
    revenue: { current: 2450000, previous: 2100000 },
    orders: { current: 342, previous: 310 },
    customers: { current: 128, previous: 140 },
    conversion: { current: 4.8, previous: 4.6 }
  },
  'Năm nay': {
    revenue: { current: 28450000, previous: 25000000 },
    orders: { current: 4200, previous: 3800 },
    customers: { current: 1540, previous: 1400 },
    conversion: { current: 5.1, previous: 4.9 }
  }
};

export const RevenueReportTab: React.FC = () => {
  const [dateRange, setDateRange] = useState('Tháng này');

  const calculateGrowth = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return {
      change: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      isPositive: growth >= 0
    };
  };

  const currentData = PERIOD_DATA[dateRange] || PERIOD_DATA['Tháng này'];

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: `${currentData.revenue.current.toLocaleString()} ¥`,
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
      title: 'Tỷ lệ chuyển đổi',
      value: `${currentData.conversion.current}%`,
      ...calculateGrowth(currentData.conversion.current, currentData.conversion.previous),
      icon: <Activity className="w-6 h-6 text-amber-600" />,
      color: 'bg-amber-100'
    }
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'Nguyễn Văn A', product: 'Sim Data SoftBank', amount: '3500 ¥', status: 'Hoàn thành', date: '04/05/2026' },
    { id: 'ORD-002', customer: 'Trần Thị B', product: 'Pocket Wifi', amount: '4200 ¥', status: 'Đang xử lý', date: '04/05/2026' },
    { id: 'ORD-003', customer: 'Lê Văn C', product: 'Wifi Cố Định', amount: '5000 ¥', status: 'Hoàn thành', date: '03/05/2026' },
    { id: 'ORD-004', customer: 'Phạm Thị D', product: 'Combo Sim + Điện Thoại', amount: '12000 ¥', status: 'Đã hủy', date: '02/05/2026' },
    { id: 'ORD-005', customer: 'Hoàng Văn E', product: 'Sim Data SoftBank', amount: '3500 ¥', status: 'Hoàn thành', date: '01/05/2026' },
  ];


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full pointer-events-none opacity-60" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-4">
            <TrendingUp className="w-4 h-4" />
            <span>Báo cáo & Thống kê</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Doanh thu tổng hợp
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            Theo dõi dòng tiền, tình hình kinh doanh và hiệu suất bán hàng của các sản phẩm/dịch vụ theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="Hôm nay">Hôm nay</option>
              <option value="Tuần này">Tuần này</option>
              <option value="Tháng này">Tháng này</option>
              <option value="Năm nay">Năm nay</option>
            </select>
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
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

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
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
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 border-dashed flex flex-col items-center justify-center text-slate-400">
            <Activity className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-medium">Khu vực hiển thị biểu đồ</p>
            <p className="text-xs mt-1">Sử dụng Recharts hoặc Chart.js để render</p>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="font-bold text-slate-800 text-lg mb-6">Sản phẩm bán chạy</h3>
          <div className="space-y-6">
            {[
              { name: 'Sim Data SoftBank', sales: '156', revenue: '546.000 ¥', percent: 85 },
              { name: 'Pocket Wifi', sales: '89', revenue: '373.800 ¥', percent: 60 },
              { name: 'Wifi Cố Định', sales: '45', revenue: '225.000 ¥', percent: 35 },
              { name: 'Combo Sim + ĐT', sales: '24', revenue: '288.000 ¥', percent: 20 },
            ].map((prod, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{prod.name}</p>
                    <p className="text-xs text-slate-500">{prod.sales} đơn hàng</p>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{prod.revenue}</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${prod.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
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
              {recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
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
                  <td className="px-6 py-4 text-slate-600">{order.date}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      order.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'Đang xử lý' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
