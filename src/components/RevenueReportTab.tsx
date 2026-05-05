import React, { useState, useEffect } from 'react';
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

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

export const RevenueReportTab: React.FC = () => {
  const [dateRange, setDateRange] = useState('Tháng này');
  const [statsData, setStatsData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/orders/stats?range=${encodeURIComponent(dateRange)}`),
          fetch(`${API_BASE_URL}/api/orders`)
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStatsData(data);
        }

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: statsData ? `${parseFloat(statsData.stats.total_revenue).toLocaleString()} ¥` : '0 ¥',
      change: '+12.5%',
      isPositive: true,
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      color: 'bg-emerald-100'
    },
    {
      title: 'Đơn hàng mới',
      value: statsData ? statsData.stats.order_count : '0',
      change: '+8.2%',
      isPositive: true,
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Khách hàng mới',
      value: statsData ? statsData.stats.customer_count : '0',
      change: '-2.4%',
      isPositive: false,
      icon: <Users className="w-6 h-6 text-rose-600" />,
      color: 'bg-rose-100'
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      value: '4.8%',
      change: '+1.2%',
      isPositive: true,
      icon: <Activity className="w-6 h-6 text-amber-600" />,
      color: 'bg-amber-100'
    }
  ];

  const topProducts = statsData?.topProducts || [];

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
              <h3 className="text-2xl font-black text-slate-800">{isLoading ? '...' : stat.value}</h3>
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
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Đang tải...</div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm italic">Chưa có dữ liệu sản phẩm</div>
            ) : topProducts.map((prod: any, i: number) => {
              const maxRevenue = Math.max(...topProducts.map((p: any) => parseFloat(p.revenue)));
              const percent = (parseFloat(prod.revenue) / maxRevenue) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{prod.name}</p>
                      <p className="text-xs text-slate-500">{prod.sales} đơn hàng</p>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{parseFloat(prod.revenue).toLocaleString()} ¥</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu đơn hàng...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chưa có đơn hàng nào được tạo.</td>
                </tr>
              ) : orders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">ORD-{order.id.toString().padStart(3, '0')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
                        {order.customer_name?.charAt(0) || 'K'}
                      </div>
                      <span className="text-slate-600">{order.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{order.product_name}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{parseFloat(order.amount).toLocaleString()} ¥</td>
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
