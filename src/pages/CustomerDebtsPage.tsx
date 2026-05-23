import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from 'lucide-react';

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

type DebtOrder = {
  id: number;
  skymobile_order_id: number | null;
  customer_id: string | null;
  customer_name: string | null;
  branch_name: string | null;
  created_by_name: string | null;
  order_status: string | null;
  approval_status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total_amount: number | string;
  created_at: string | null;
  product_quantity: number | null;
};

type DebtCustomer = {
  customer_key: string;
  customer_local_id: number | null;
  skymobile_customer_id: number | null;
  customer_name: string;
  customer_avatar: string | null;
  phone_number: string | null;
  email: string | null;
  debt_order_count: number;
  total_debt: number | string;
  oldest_debt_at: string | null;
  latest_order_at: string | null;
  orders: DebtOrder[];
};

type DebtSummary = {
  totalDebt: number;
  overdueDebt: number;
  debtOrderCount: number;
  debtCustomerCount: number;
};

const formatCurrency = (value: number | string) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value || 0))} ¥`;

const formatDate = (date?: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN');
};

const getDebtAge = (date?: string | null) => {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
};

const paymentStatusLabel: Record<string, string> = {
  Unpaid: 'Chưa thanh toán',
  Partial: 'Thanh toán một phần',
  'Partially Paid': 'Thanh toán một phần',
  Paid: 'Đã thanh toán',
  Refunded: 'Hoàn tiền',
};

export const CustomerDebtsPage: React.FC = () => {
  const [debts, setDebts] = useState<DebtCustomer[]>([]);
  const [summary, setSummary] = useState<DebtSummary>({ totalDebt: 0, overdueDebt: 0, debtOrderCount: 0, debtCustomerCount: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchDebts = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: '12',
        search: debouncedSearch,
        paymentStatus,
      });
      const res = await fetch(`${API_BASE_URL}/api/customers/debts?${params}`);
      if (!res.ok) throw new Error('Không tải được dữ liệu công nợ');
      const data = await res.json();
      setDebts(data.debts || []);
      setSummary(data.summary || { totalDebt: 0, overdueDebt: 0, debtOrderCount: 0, debtCustomerCount: 0 });
      setPage(data.pagination?.page || nextPage);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching debts:', error);
      alert('Không thể tải dữ liệu công nợ khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts(1);
  }, [debouncedSearch, paymentStatus]);

  const markAsPaid = async (order: DebtOrder) => {
    const orderId = order.id || order.skymobile_order_id;
    if (!orderId) return;
    if (!confirm(`Xác nhận đánh dấu đơn #${order.skymobile_order_id || order.id} là đã thanh toán?`)) return;

    setUpdatingOrderId(order.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'Paid' }),
      });
      if (!res.ok) throw new Error('Cập nhật thất bại');
      await fetchDebts(page);
    } catch (error) {
      console.error('Error marking order as paid:', error);
      alert('Không thể cập nhật trạng thái thanh toán.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const collectionRate = useMemo(() => {
    const overdue = Number(summary.overdueDebt || 0);
    const total = Number(summary.totalDebt || 0);
    return total > 0 ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100;
  }, [summary]);

  const statCards = [
    { label: 'Tổng công nợ', value: formatCurrency(summary.totalDebt), icon: WalletCards, color: 'bg-rose-500', hint: 'Đơn chưa thanh toán' },
    { label: 'Nợ quá 30 ngày', value: formatCurrency(summary.overdueDebt), icon: AlertCircle, color: 'bg-amber-500', hint: 'Cần ưu tiên thu hồi' },
    { label: 'Khách đang nợ', value: summary.debtCustomerCount.toLocaleString('vi-VN'), icon: UserRound, color: 'bg-blue-500', hint: `${summary.debtOrderCount} đơn hàng` },
    { label: 'Tỷ lệ nợ mới', value: `${collectionRate}%`, icon: Banknote, color: 'bg-emerald-500', hint: 'Chưa quá 30 ngày' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold mb-3">
            <ReceiptText className="w-4 h-4" /> Quản lý công nợ
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Công nợ khách hàng</h1>
          <p className="text-slate-500 mt-1">Theo dõi khách hàng còn nợ, đơn quá hạn và cập nhật trạng thái thanh toán.</p>
        </div>
        <button
          onClick={() => fetchDebts(page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${card.color} text-white flex items-center justify-center shadow-lg`}><Icon className="w-6 h-6" /></div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">{card.hint}</span>
              </div>
              <p className="text-sm font-bold text-slate-500">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khách hàng, mã khách, mã đơn..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm"
            />
          </div>
          <select
            title="Lọc trạng thái công nợ"
            aria-label="Lọc trạng thái công nợ"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-semibold text-slate-700"
          >
            <option value="">Tất cả trạng thái nợ</option>
            <option value="Unpaid">Chưa thanh toán</option>
            <option value="Partial">Thanh toán một phần</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Refunded">Hoàn tiền</option>
          </select>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" /> Đang tải công nợ...
          </div>
        ) : debts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-4" />
            <h3 className="text-lg font-black text-slate-900">Không có công nợ phù hợp</h3>
            <p className="text-slate-500 text-sm mt-1">Các đơn chưa thanh toán sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {debts.map(customer => {
              const isExpanded = expanded[customer.customer_key];
              const age = getDebtAge(customer.oldest_debt_at);
              return (
                <div key={customer.customer_key} className="p-4 md:p-5 hover:bg-slate-50/60 transition-colors">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [customer.customer_key]: !prev[customer.customer_key] }))}
                    className="w-full flex flex-col lg:flex-row lg:items-center gap-4 text-left"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 overflow-hidden">
                        {customer.customer_avatar ? <img src={customer.customer_avatar} alt="" className="w-full h-full object-cover" /> : customer.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 truncate">{customer.customer_name}</h3>
                          {age > 30 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">Quá hạn</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>#{customer.skymobile_customer_id || customer.customer_local_id || customer.customer_key}</span>
                          {customer.phone_number && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone_number}</span>}
                          <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" />Nợ lâu nhất {age} ngày</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:w-[560px]">
                      <div><p className="text-[11px] text-slate-400 font-bold uppercase">Tổng nợ</p><p className="font-black text-rose-600">{formatCurrency(customer.total_debt)}</p></div>
                      <div><p className="text-[11px] text-slate-400 font-bold uppercase">Số đơn</p><p className="font-black text-slate-800">{customer.debt_order_count}</p></div>
                      <div><p className="text-[11px] text-slate-400 font-bold uppercase">Gần nhất</p><p className="font-bold text-slate-700">{formatDate(customer.latest_order_at)}</p></div>
                      <div className="flex items-center justify-end text-slate-400">{isExpanded ? <ChevronDown /> : <ChevronRight />}</div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 rounded-2xl border border-slate-100 overflow-hidden bg-white">
                          {customer.orders.map(order => (
                            <div key={order.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-50 last:border-b-0">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-slate-900">Đơn #{order.skymobile_order_id || order.id}</span>
                                  <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold">{paymentStatusLabel[order.payment_status || 'Unpaid'] || order.payment_status || 'Chưa thanh toán'}</span>
                                  {order.approval_status && <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{order.approval_status}</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{order.branch_name || 'Sky Mobile'} • {order.created_by_name || 'Nhân viên'} • {formatDate(order.created_at)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-[11px] text-slate-400 font-bold uppercase">Còn nợ</p>
                                  <p className="font-black text-slate-900">{formatCurrency(order.total_amount)}</p>
                                </div>
                                <button
                                  onClick={() => markAsPaid(order)}
                                  disabled={updatingOrderId === order.id}
                                  className="px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-1.5"
                                >
                                  {updatingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                  Đã thu
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={() => fetchDebts(Math.max(1, page - 1))} disabled={page <= 1 || loading} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold disabled:opacity-40">Trước</button>
          <span className="text-sm font-bold text-slate-500">Trang {page} / {totalPages}</span>
          <button onClick={() => fetchDebts(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold disabled:opacity-40">Sau</button>
        </div>
      </div>
    </div>
  );
};
