import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  FileText,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Facebook,
  Globe,
  ChevronRight,
  X,
  Calendar,
  Building2,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Plus,
  User,
  Trash2
} from 'lucide-react';
import { settingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

interface Customer {
  id: number;
  skymobile_customer_id: number | null;
  customer_name: string;
  phone_number: string | null;
  email: string | null;
  avatar: string | null;
  sales_channel_id: number | null;
  sales_channel_name: string | null;
  sales_channel_type: string | null;
  facebook_uid: string | null;
  nationality_id: number | null;
  nationality_name: string | null;
  conversation_id: string | null;
  branch_id: number | null;
  branch_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string | null;
  source: string;
  notes: string | null;
  synced_at: string;
}

interface Order {
  id: number;
  skymobile_order_id: number;
  customer_id: string | null;
  customer_name: string | null;
  customer_avatar: string | null;
  branch_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  order_status: string | null;
  approval_status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total_amount: number;
  created_at: string;
  payment_message_sent: boolean;
  sales_type: number | null;
  product_quantity: number | null;
  commission_total: number | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  synced_at: string;
  items?: any[];
}

interface Stats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCommission: number;
  sources: { source: string; count: number }[];
  nationalities: { nationality: string; count: number }[];
}

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const canApproveOrders = user?.role === 'Quản trị' || user?.role === 'Trưởng phòng Kinh doanh Marketing';
  const [activeTab, setActiveTab] = useState<'customers' | 'orders' | 'approvals' | 'analytics'>('customers');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('');

  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [currencyUnit, setCurrencyUnit] = useState<string>('đ');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingService.getAll();
        if (data.commission_exchange_rate) {
          setExchangeRate(Number(data.commission_exchange_rate) || 1);
        }
        if (data.commission_currency_unit) {
          setCurrencyUnit(data.commission_currency_unit);
        }
      } catch (err) {
        console.error('Failed to load settings in CustomersPage:', err);
      }
    };
    loadSettings();
  }, []);

  const formatCommission = (val: number) => {
    const formattedNum = new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));
    return `${formattedNum} ${currencyUnit}`;
  };
  
  // Customers pagination
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Orders pagination
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Drawer & Sync States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);

  // Order Detail & Create States inside Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderBranch, setNewOrderBranch] = useState('Sky Mobile');
  const [newOrderTotal, setNewOrderTotal] = useState('');
  const [newOrderQty, setNewOrderQty] = useState('1');
  const [newOrderCommission, setNewOrderCommission] = useState('');
  const [newOrderStatus, setNewOrderStatus] = useState('Pending');
  const [newOrderPaymentStatus, setNewOrderPaymentStatus] = useState('Unpaid');
  const [newOrderFulfillmentStatus, setNewOrderFulfillmentStatus] = useState('Unfulfilled');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncProgressMsg, setSyncProgressMsg] = useState('');

  const fetchCustomers = async (page = 1) => {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams({
        search,
        source: sourceFilter,
        nationality: nationalityFilter,
        page: page.toString(),
        limit: '15'
      });
      const res = await fetch(`${API_BASE_URL}/api/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setCustomerPage(data.pagination.page);
        setCustomerTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchOrders = async (page = 1) => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        search,
        orderStatus: orderStatusFilter,
        paymentStatus: paymentStatusFilter,
        page: page.toString(),
        limit: '15'
      });
      if (activeTab === 'approvals') {
        params.set('approvalStatus', 'Pending');
      }
      const res = await fetch(`${API_BASE_URL}/api/customers/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setOrderPage(data.pagination.page);
        setOrderTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Error fetching customer stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers(1);
    } else if (activeTab === 'orders' || activeTab === 'approvals') {
      fetchOrders(1);
    } else {
      fetchStats();
    }
  }, [activeTab, search, sourceFilter, nationalityFilter, orderStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    if (activeTab === 'approvals' && !canApproveOrders) {
      setActiveTab('customers');
    }
  }, [activeTab, canApproveOrders]);

  const [loadingCustomerLookup, setLoadingCustomerLookup] = useState<number | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleOpenCustomerByOrder = async (order: Order) => {
    if (loadingCustomerLookup) return;
    setLoadingCustomerLookup(order.id);
    setLookupError(null);
    try {
      const params = new URLSearchParams();
      if (order.customer_id) {
        params.append('skymobileId', order.customer_id);
      }
      if (order.customer_name) {
        params.append('name', order.customer_name);
      }

      const res = await fetch(`${API_BASE_URL}/api/customers/lookup?${params}`);
      if (res.ok) {
        const customer = await res.json();
        handleOpenCustomer(customer);
      } else {
        const errData = await res.json().catch(() => ({}));
        setLookupError(errData.error || 'Không tìm thấy khách hàng tương ứng.');
        alert(errData.error || 'Không tìm thấy dữ liệu khách hàng này trong hệ thống. Vui lòng đồng bộ dữ liệu mới nhất.');
      }
    } catch (err) {
      console.error('Error looking up customer from order:', err);
      setLookupError('Lỗi kết nối máy chủ.');
      alert('Không thể kết nối đến máy chủ để lấy thông tin khách hàng.');
    } finally {
      setLoadingCustomerLookup(null);
    }
  };

  const handleOpenCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setSelectedOrder(null);
    setIsCreatingOrder(false);
    setLoadingCustomerOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${cust.id}/orders`);
      if (res.ok) {
        setCustomerOrders(await res.json());
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingCustomerOrders(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSubmittingOrder(true);
    try {
      const customerId = selectedCustomer.skymobile_customer_id || selectedCustomer.id;

      const res = await fetch(`${API_BASE_URL}/api/customers/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          customer_name: selectedCustomer.customer_name,
          customer_avatar: selectedCustomer.avatar,
          branch_name: newOrderBranch,
          order_status: newOrderStatus,
          approval_status: newOrderStatus,
          payment_status: newOrderPaymentStatus,
          fulfillment_status: newOrderFulfillmentStatus,
          total_amount: parseFloat(newOrderTotal) || 0,
          product_quantity: parseInt(newOrderQty) || 1,
          commission_total: parseFloat(newOrderCommission) || 0,
          created_by: 'system',
          created_by_name: 'Nhân viên',
        }),
      });

      if (res.ok) {
        // Fetch updated orders list for this customer
        const ordersRes = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/orders`);
        if (ordersRes.ok) {
          setCustomerOrders(await ordersRes.json());
        }
        // Reset form states
        setIsCreatingOrder(false);
        setNewOrderTotal('');
        setNewOrderQty('1');
        setNewOrderCommission('');
        setNewOrderStatus('Pending');
        setNewOrderPaymentStatus('Unpaid');
        setNewOrderFulfillmentStatus('Unfulfilled');
      } else {
        const err = await res.json();
        alert(err.error || 'Thêm đơn hàng thất bại.');
      }
    } catch (err) {
      console.error('Error creating manual order:', err);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá khách hàng này? Tất cả các đơn hàng liên quan cũng sẽ bị xoá vĩnh viễn và không thể khôi phục.')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Xoá khách hàng thành công!');
        setSelectedCustomer(null);
        // Refresh customer list
        fetchCustomers(customerPage);
        // If tab orders is active, also refresh orders
        fetchOrders(orderPage);
        // Refresh stats
        fetchStats();
      } else {
        const err = await res.json();
        alert(err.error || 'Xoá khách hàng thất bại.');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá đơn hàng này vĩnh viễn?')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/orders/${orderId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Xoá đơn hàng thành công!');
        setSelectedOrder(null);
        
        // Refresh customer orders inside drawer
        if (selectedCustomer) {
          const ordersRes = await fetch(`${API_BASE_URL}/api/customers/${selectedCustomer.id}/orders`);
          if (ordersRes.ok) {
            setCustomerOrders(await ordersRes.json());
          }
        }
        
        // Refresh lists in background
        fetchCustomers(customerPage);
        fetchOrders(orderPage);
        // Refresh stats
        fetchStats();
      } else {
        const err = await res.json();
        alert(err.error || 'Xoá đơn hàng thất bại.');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  const handleUpdateOrderApproval = async (order: Order, approvalStatus: 'Approved' | 'Rejected' | 'Cancelled') => {
    if (!canApproveOrders) {
      alert('Bạn không có quyền phê duyệt đơn hàng.');
      return;
    }

    const actionLabel = approvalStatus === 'Approved' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} đơn hàng #${order.skymobile_order_id}?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/orders/${order.id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_status: approvalStatus,
          approved_by: user?.email || null,
          approved_by_name: user?.name || null,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Cập nhật trạng thái phê duyệt thất bại.');
      }

      const updatedOrder = await res.json();
      setOrders(prev => prev.map(item => item.id === updatedOrder.id ? updatedOrder : item).filter(item => activeTab !== 'approvals' || item.id !== updatedOrder.id));
      if (selectedOrder?.id === updatedOrder.id) setSelectedOrder(updatedOrder);
      if (selectedCustomer) {
        setCustomerOrders(prev => prev.map(item => item.id === updatedOrder.id ? updatedOrder : item));
      }
      alert(approvalStatus === 'Approved' ? 'Đã duyệt đơn hàng thành công!' : 'Đã từ chối đơn hàng.');
    } catch (err: any) {
      console.error('Error updating order approval:', err);
      alert(err.message || 'Không thể kết nối đến máy chủ.');
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    setSyncLogs([]);
    setSyncProgressMsg('Đang khởi tạo kết nối đồng bộ...');

    const eventSource = new EventSource(`${API_BASE_URL}/api/customers/sync`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'progress') {
          setSyncProgressMsg(data.message);
          setSyncLogs(prev => [...prev, data.message]);
        } else if (data.status === 'success') {
          setSyncProgressMsg('🎉 Đồng bộ thành công hoàn toàn!');
          setSyncLogs(prev => [...prev, '🎉 Đồng bộ thành công cơ sở dữ liệu.']);
          eventSource.close();
          setTimeout(() => {
            setIsSyncing(false);
            if (activeTab === 'customers') fetchCustomers(1);
            else if (activeTab === 'orders') fetchOrders(1);
            else fetchStats();
          }, 2000);
        } else if (data.status === 'error') {
          setSyncProgressMsg(`❌ Lỗi đồng bộ: ${data.error}`);
          setSyncLogs(prev => [...prev, `❌ Thất bại: ${data.error}`]);
          eventSource.close();
          setIsSyncing(false);
        }
      } catch (err) {
        console.error('Error parsing sync event:', err);
        setSyncProgressMsg('❌ Lỗi xử lý phản hồi đồng bộ từ máy chủ.');
        eventSource.close();
        setIsSyncing(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource connection error:', err);
      setSyncProgressMsg('❌ Lỗi kết nối máy chủ đồng bộ.');
      eventSource.close();
      setIsSyncing(false);
    };
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val || 0);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'skymobile':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1 w-max"><Globe className="w-3.5 h-3.5" /> Sky Mobile</span>;
      case 'messenger':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1 w-max"><Facebook className="w-3.5 h-3.5" /> Ads Messenger</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100 flex items-center gap-1 w-max"><UserCheck className="w-3.5 h-3.5" /> Thủ công</span>;
    }
  };

  const getOrderStatusBadge = (status: string | null) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('pending') || s.includes('chờ')) {
      return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Chờ duyệt</span>;
    }
    if (s.includes('approve') || s.includes('đã') || s.includes('complete') || s.includes('success')) {
      return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Hoàn thành</span>;
    }
    if (s.includes('reject') || s.includes('cancel') || s.includes('hủy')) {
      return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Đã hủy</span>;
    }
    return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{status || 'Chờ'}</span>;
  };

  const getApprovalStatusBadge = (status: string | null) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s.includes('approve')) {
      return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã phê duyệt</span>;
    }
    if (s.includes('reject') || s.includes('cancel')) {
      return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Đã từ chối</span>;
    }
    return <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Chờ phê duyệt</span>;
  };

  const isApprovalView = activeTab === 'approvals';
  const pageContainerClass = isApprovalView ? 'max-w-[1600px] mx-auto space-y-5' : 'max-w-7xl mx-auto space-y-6';
  const headerClass = isApprovalView
    ? 'flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden'
    : 'flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden';
  const headerAccentClass = isApprovalView
    ? 'absolute right-0 top-0 h-full w-96 bg-gradient-to-l from-indigo-50 via-blue-50/70 to-transparent pointer-events-none opacity-80'
    : 'absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full pointer-events-none opacity-60';
  const titleClass = isApprovalView
    ? 'text-2xl md:text-3xl font-black text-slate-900 tracking-tight'
    : 'text-3xl md:text-4xl font-black text-slate-900 tracking-tight';
  const subtitleClass = isApprovalView
    ? 'text-slate-500 mt-1.5 max-w-2xl text-sm leading-relaxed'
    : 'text-slate-500 mt-2 max-w-xl text-sm md:text-base leading-relaxed';
  const syncButtonClass = isApprovalView
    ? 'flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300'
    : 'flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300';
  const filterBarClass = isApprovalView
    ? 'flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm'
    : 'flex flex-col sm:flex-row gap-3';
  const searchInputClass = isApprovalView
    ? 'w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent'
    : 'w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm';
  const tabButtonClass = (tab: 'customers' | 'orders' | 'approvals' | 'analytics') =>
    `flex items-center gap-2 ${isApprovalView ? 'px-3 py-2' : 'px-4 py-1.5'} rounded-lg text-xs font-bold transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
      activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;
  const orderCardClass = isApprovalView
    ? 'bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden'
    : 'bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden';
  const orderTableClass = isApprovalView
    ? 'w-full min-w-[1260px] table-fixed text-left border-collapse'
    : 'w-full text-left border-collapse';
  const orderHeaderCellClass = isApprovalView
    ? 'px-4 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wide whitespace-nowrap'
    : 'px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider';
  const orderCellClass = isApprovalView ? 'px-4 py-4 align-middle' : 'px-6 py-5';
  const orderStatusCellClass = isApprovalView ? 'px-3 py-4 align-middle' : 'px-6 py-5';
  const approvalActionCellClass = isApprovalView ? 'px-4 py-4 align-middle text-right' : 'px-6 py-5 text-right';
  const orderColumnCount = activeTab === 'approvals' ? 9 : 7;

  return (
    <div className={pageContainerClass}>
      {/* ─── HEADER ─── */}
      <div className={headerClass}>
        <div className={headerAccentClass} />
        
        <div className="relative z-10 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>CRM & Đồng bộ</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
              <button
                onClick={() => setActiveTab('customers')}
                className={tabButtonClass('customers')}
              >
                <Users className="w-3.5 h-3.5" />
                Khách hàng
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={tabButtonClass('orders')}
              >
                <FileText className="w-3.5 h-3.5" />
                Đơn hàng
              </button>
              {canApproveOrders && (
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={tabButtonClass('approvals')}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Phê duyệt đơn hàng
                </button>
              )}
              <button
                onClick={() => setActiveTab('analytics')}
                className={tabButtonClass('analytics')}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Báo cáo & Thống kê
              </button>
            </div>
          </div>
          <h1 className={titleClass}>
            {activeTab === 'customers' && 'Quản Lý Khách Hàng'}
            {activeTab === 'orders' && 'Lịch Sử Đơn Hàng'}
            {activeTab === 'approvals' && 'Phê Duyệt Đơn Hàng'}
            {activeTab === 'analytics' && 'Hiệu Suất Kinh Doanh'}
          </h1>
          <p className={subtitleClass}>
            {activeTab === 'customers' && 'Theo dõi danh sách khách hàng từ các kênh quảng cáo Messenger Ads và hệ thống bán hàng Sky Mobile.'}
            {activeTab === 'orders' && 'Lịch sử mua hàng, doanh số và hoa hồng nhận được từ đơn hàng đã chốt trực tiếp trên Sky Mobile.'}
            {activeTab === 'approvals' && 'Kiểm tra, phê duyệt hoặc từ chối các đơn hàng đang chờ xác nhận từ đội kinh doanh.'}
            {activeTab === 'analytics' && 'Phân tích cơ cấu khách hàng tiềm năng, hiệu suất kênh bán hàng và hoa hồng tích lũy.'}
          </p>
        </div>

        <div className="flex gap-4 relative z-10 shrink-0">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={syncButtonClass}
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            Đồng bộ từ Sky Mobile
          </button>
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      {activeTab !== 'analytics' && (
        <div className={filterBarClass}>
          <div className="relative flex-1">
            <Search className={`${isApprovalView ? 'left-3.5 w-4 h-4' : 'left-4 w-5 h-5'} absolute top-1/2 -translate-y-1/2 text-slate-400`} />
            <input
              type="text"
              placeholder={activeTab === 'customers' ? "Tìm khách hàng theo tên, SĐT, Facebook UID..." : "Tìm đơn hàng theo khách hàng, ID..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={searchInputClass}
            />
          </div>
          
          {activeTab === 'customers' && (
            <>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Tất cả Nguồn</option>
                <option value="skymobile">Sky Mobile</option>
                <option value="messenger">Ads Messenger</option>
                <option value="manual">Thêm thủ công</option>
              </select>

              <select
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
                className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Tất cả Quốc tịch</option>
                <option value="Việt Nam">Việt Nam</option>
                <option value="Nhật Bản">Nhật Bản</option>
                <option value="Philippines">Philippines</option>
                <option value="Nepal">Nepal</option>
              </select>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm appearance-none cursor-pointer"
              >
                <option value="">Trạng thái Đơn</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </>
          )}
        </div>
      )}

      {/* ─── CONTENT TABS ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'customers' && (
          <motion.div
            key="customers"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Facebook UID</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nguồn</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Quốc tịch</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày đồng bộ</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                          <p className="text-slate-500 font-medium">Đang tải danh sách khách hàng...</p>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-12 h-12 text-slate-300" />
                          <p className="text-slate-500 font-medium">Không tìm thấy khách hàng nào khớp.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenCustomer(c)}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0 border border-white">
                              {c.avatar ? <img src={c.avatar} alt={c.customer_name} className="w-full h-full object-cover" /> : c.customer_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-sm block group-hover:text-indigo-600 transition-colors">{c.customer_name}</span>
                              <span className="text-[11px] text-slate-400 font-semibold uppercase">ID: {c.skymobile_customer_id || 'Chưa đồng bộ'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1 text-xs">
                            {c.phone_number && <div className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{c.phone_number}</div>}
                            {c.email && <div className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{c.email}</div>}
                            {!c.phone_number && !c.email && <span className="text-slate-300 italic">Chưa cập nhật</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-slate-600">
                          {c.facebook_uid ? (
                            <span className="flex items-center gap-1.5 font-bold text-indigo-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/${c.facebook_uid}`, '_blank'); }}>
                              <Facebook className="w-3.5 h-3.5 shrink-0" />
                              {c.facebook_uid}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5">{getSourceBadge(c.source)}</td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 w-max">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {c.nationality_name || 'Không rõ'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-slate-500 font-medium">
                          {new Date(c.synced_at || c.created_at || '').toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenCustomer(c); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {customerTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500">Hiển thị trang {customerPage} / {customerTotalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={customerPage <= 1}
                    onClick={() => fetchCustomers(customerPage - 1)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const delta = 1;
                      const range = [];
                      const rangeWithDots: (number | string)[] = [];
                      let l: number | undefined;

                      for (let i = 1; i <= customerTotalPages; i++) {
                        if (i === 1 || i === customerTotalPages || (i >= customerPage - delta && i <= customerPage + delta)) {
                          range.push(i);
                        }
                      }

                      for (const i of range) {
                        if (l) {
                          if (i - l === 2) {
                            rangeWithDots.push(l + 1);
                          } else if (i - l > 2) {
                            rangeWithDots.push('...');
                          }
                        }
                        rangeWithDots.push(i);
                        l = i;
                      }

                      return rangeWithDots.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-xs select-none">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={`page-${p}`}
                            onClick={() => fetchCustomers(p as number)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              p === customerPage
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700'
                                : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  <button
                    disabled={customerPage >= customerTotalPages}
                    onClick={() => fetchCustomers(customerPage + 1)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {(activeTab === 'orders' || activeTab === 'approvals') && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={orderCardClass}
          >
            <div className="overflow-x-auto">
              <table className={orderTableClass}>
                {activeTab === 'approvals' && (
                  <colgroup>
                    <col style={{ width: '88px' }} />
                    <col style={{ width: '330px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '116px' }} />
                    <col style={{ width: '126px' }} />
                    <col style={{ width: '134px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '108px' }} />
                    <col style={{ width: '168px' }} />
                  </colgroup>
                )}
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className={orderHeaderCellClass}>Mã Đơn</th>
                    <th className={orderHeaderCellClass}>Khách hàng</th>
                    <th className={orderHeaderCellClass}>Tổng tiền</th>
                    <th className={orderHeaderCellClass}>Trạng thái</th>
                    <th className={orderHeaderCellClass}>Chi nhánh</th>
                    <th className={orderHeaderCellClass}>Người tạo</th>
                    {activeTab === 'approvals' && <th className={orderHeaderCellClass}>Phê duyệt</th>}
                    <th className={orderHeaderCellClass}>Ngày chốt</th>
                    {activeTab === 'approvals' && <th className={`${orderHeaderCellClass} text-right`}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={orderColumnCount} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                          <p className="text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={orderColumnCount} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-12 h-12 text-slate-300" />
                          <p className="text-slate-500 font-medium">Không tìm thấy đơn hàng nào khớp.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => handleOpenCustomerByOrder(o)}>
                        <td className={`${orderCellClass} font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors whitespace-nowrap`}>
                          #{o.skymobile_order_id}
                        </td>
                        <td className={orderCellClass}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-white shrink-0">
                              {loadingCustomerLookup === o.id ? (
                                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                              ) : o.customer_avatar ? (
                                <img src={o.customer_avatar} alt={o.customer_name || ''} className="w-full h-full object-cover" />
                              ) : (
                                (o.customer_name || 'KH').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-2 min-w-0">
                                <span className="truncate">{o.customer_name}</span>
                                {loadingCustomerLookup === o.id && (
                                  <span className="text-[10px] font-medium text-indigo-500 animate-pulse shrink-0">(đang tải...)</span>
                                )}
                              </span>
                              {o.items && o.items.length > 0 && (
                                <div className={`${isApprovalView ? 'max-w-[260px]' : 'max-w-[280px]'} text-[10px] text-slate-400 font-semibold mt-0.5 truncate bg-slate-50 border border-slate-100/50 px-1.5 py-0.5 rounded w-fit`} title={o.items.map((it: any) => `${it.product_name} (x${it.quantity})`).join(', ')}>
                                  {o.items.map((it: any) => `${it.product_name} (x${it.quantity})`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={orderCellClass}>
                          <div className="font-black text-slate-900 text-sm">{formatCurrency(o.total_amount)}</div>
                          {o.commission_total && (
                            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 whitespace-nowrap">
                              <TrendingUp className="w-3 h-3" />
                              Hoa hồng: {formatCommission(o.commission_total)}
                            </div>
                          )}
                        </td>
                        <td className={orderStatusCellClass}>
                          {getOrderStatusBadge(o.order_status)}
                        </td>
                        <td className={orderStatusCellClass}>
                          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {o.branch_name || 'Sky Mobile'}
                          </span>
                        </td>
                        <td className={`${orderCellClass} text-xs text-slate-600 font-medium`}>
                          <span className={isApprovalView ? 'line-clamp-2' : undefined}>{o.created_by_name || 'Nhân viên'}</span>
                        </td>
                        {activeTab === 'approvals' && (
                          <td className={orderStatusCellClass}>
                            {getApprovalStatusBadge(o.approval_status || o.order_status)}
                          </td>
                        )}
                        <td className={`${orderCellClass} text-xs text-slate-500 font-medium whitespace-nowrap`}>
                          {new Date(o.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        {activeTab === 'approvals' && (
                          <td className={approvalActionCellClass}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateOrderApproval(o, 'Approved'); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all active:scale-95 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Duyệt
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateOrderApproval(o, 'Rejected'); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all active:scale-95 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                              >
                                <X className="w-3.5 h-3.5" />
                                Từ chối
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {orderTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500">Hiển thị trang {orderPage} / {orderTotalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={orderPage <= 1}
                    onClick={() => fetchOrders(orderPage - 1)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const delta = 1;
                      const range = [];
                      const rangeWithDots: (number | string)[] = [];
                      let l: number | undefined;

                      for (let i = 1; i <= orderTotalPages; i++) {
                        if (i === 1 || i === orderTotalPages || (i >= orderPage - delta && i <= orderPage + delta)) {
                          range.push(i);
                        }
                      }

                      for (const i of range) {
                        if (l) {
                          if (i - l === 2) {
                            rangeWithDots.push(l + 1);
                          } else if (i - l > 2) {
                            rangeWithDots.push('...');
                          }
                        }
                        rangeWithDots.push(i);
                        l = i;
                      }

                      return rangeWithDots.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-xs select-none">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={`page-${p}`}
                            onClick={() => fetchOrders(p as number)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              p === orderPage
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700'
                                : 'text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  <button
                    disabled={orderPage >= orderTotalPages}
                    onClick={() => fetchOrders(orderPage + 1)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && stats && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tổng Khách Hàng</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalCustomers}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tổng Đơn Hàng</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrders}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Doanh Thu Tích Lũy</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                  {exchangeRate > 1 && (
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                      ~ {formatCommission(stats.totalRevenue * exchangeRate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tổng Hoa Hồng</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCommission(stats.totalCommission)}</h3>
                </div>
              </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Source Distribution */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Phân bổ nguồn khách hàng</h4>
                <div className="space-y-4">
                  {stats.sources.map(source => {
                    const pct = ((source.count / stats.totalCustomers) * 100).toFixed(1);
                    const sourceName = source.source === 'skymobile' ? 'Sky Mobile' : source.source === 'messenger' ? 'Messenger Ads' : 'Thủ công';
                    const barColor = source.source === 'skymobile' ? 'bg-blue-500' : source.source === 'messenger' ? 'bg-purple-500' : 'bg-slate-500';
                    return (
                      <div key={source.source} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{sourceName}</span>
                          <span className="text-slate-500 font-bold">{source.count} khách ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nationalities */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Quốc tịch phổ biến</h4>
                <div className="space-y-4">
                  {stats.nationalities.map(n => {
                    const pct = ((n.count / stats.totalCustomers) * 100).toFixed(1);
                    return (
                      <div key={n.nationality} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-xs font-bold border text-slate-600">🇻🇳</div>
                          <span className="font-bold text-slate-700 text-sm">{n.nationality}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{n.count} khách ({pct}%)</span>
                      </div>
                    );
                  })}
                  {stats.nationalities.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 italic">Chưa có thông tin quốc tịch.</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CUSTOMER PROFILE DRAWER ─── */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 bg-slate-900 z-50 pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col pointer-events-auto"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">Hồ Sơ Khách Hàng</h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isCreatingOrder ? (
                  /* ─── CREATE ORDER FORM ─── */
                  <form onSubmit={handleCreateOrder} className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setIsCreatingOrder(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h4 className="font-bold text-slate-800 text-sm">Tạo đơn hàng mới</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Chi nhánh */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Chi nhánh</label>
                        <select
                          value={newOrderBranch}
                          onChange={(e) => setNewOrderBranch(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-slate-700 text-sm font-semibold outline-none transition-all"
                        >
                          <option value="Sky Mobile">Sky Mobile (Trụ sở chính)</option>
                          <option value="Sky Mobile - Chi nhánh 1">Sky Mobile - Chi nhánh 1</option>
                          <option value="Sky Mobile - Chi nhánh 2">Sky Mobile - Chi nhánh 2</option>
                        </select>
                      </div>

                      {/* Số tiền & Số lượng */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng tiền (¥)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Ví dụ: 11480"
                            value={newOrderTotal}
                            onChange={(e) => setNewOrderTotal(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-slate-700 text-sm font-semibold outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Số lượng SP</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Ví dụ: 1"
                            value={newOrderQty}
                            onChange={(e) => setNewOrderQty(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-slate-700 text-sm font-semibold outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Tiền hoa hồng */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tiền hoa hồng (¥)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ví dụ: 1000"
                          value={newOrderCommission}
                          onChange={(e) => setNewOrderCommission(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-slate-700 text-sm font-semibold outline-none transition-all"
                        />
                      </div>

                      {/* Các trạng thái */}
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Trạng thái đơn</label>
                            <select
                              value={newOrderStatus}
                              onChange={(e) => setNewOrderStatus(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-700 text-xs font-semibold outline-none transition-all"
                            >
                              <option value="Approved">Đã duyệt (Approved)</option>
                              <option value="Pending">Chờ duyệt (Pending)</option>
                              <option value="Cancelled">Đã hủy (Cancelled)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Thanh toán</label>
                            <select
                              value={newOrderPaymentStatus}
                              onChange={(e) => setNewOrderPaymentStatus(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-700 text-xs font-semibold outline-none transition-all"
                            >
                              <option value="Paid">Đã thanh toán</option>
                              <option value="Unpaid">Chưa thanh toán</option>
                              <option value="Partial">Thanh toán 1 phần</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Giao hàng (Fulfillment)</label>
                          <select
                            value={newOrderFulfillmentStatus}
                            onChange={(e) => setNewOrderFulfillmentStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-slate-700 text-sm font-semibold outline-none transition-all"
                          >
                            <option value="Fulfilled">Đã giao hàng (Fulfilled)</option>
                            <option value="Unfulfilled">Chưa giao hàng (Unfulfilled)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsCreatingOrder(false)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all active:scale-98 shadow-sm"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={submittingOrder}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-2xl text-sm hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 active:scale-98 shadow-md flex items-center justify-center gap-2"
                      >
                        {submittingOrder ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Đang lưu...
                          </>
                        ) : 'Lưu đơn hàng'}
                      </button>
                    </div>
                  </form>
                ) : selectedOrder ? (
                  /* ─── ORDER DETAILS VIEW ─── */
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <h4 className="font-bold text-slate-800 text-sm">Chi tiết Đơn hàng #{selectedOrder.skymobile_order_id}</h4>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="p-6 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 border border-indigo-100/50 rounded-3xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị đơn</span>
                        <span className="text-xl font-black text-slate-900">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      
                      {selectedOrder.commission_total !== undefined && (
                        <div className="flex justify-between items-center border-t border-dashed border-indigo-100 pt-3">
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Tiền hoa hồng</span>
                          <span className="text-sm font-bold text-emerald-700">{formatCommission(selectedOrder.commission_total)}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badges Section */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Trạng thái đơn</span>
                        <span>{getOrderStatusBadge(selectedOrder.order_status)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Thanh toán</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          selectedOrder.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          selectedOrder.payment_status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {selectedOrder.payment_status === 'Paid' ? 'Đã thanh toán' :
                           selectedOrder.payment_status === 'Partial' ? 'Thanh toán 1 phần' :
                           'Chưa thanh toán'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Giao hàng</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          selectedOrder.fulfillment_status === 'Fulfilled' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {selectedOrder.fulfillment_status === 'Fulfilled' ? 'Đã giao hàng' : 'Chưa giao hàng'}
                        </span>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 text-xs text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Số lượng sản phẩm</span>
                        <span className="font-bold">{selectedOrder.product_quantity || 1} sản phẩm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Chi nhánh</span>
                        <span className="font-bold flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {selectedOrder.branch_name || 'Sky Mobile'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Nhân viên chốt</span>
                        <span className="font-bold flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {selectedOrder.created_by_name || 'Nhân viên'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold">Thời gian tạo</span>
                        <span className="font-bold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>

                    {/* Products List Breakdown */}
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sản phẩm trong đơn ({selectedOrder.items.length})</h5>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item: any) => (
                            <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                              <div className="flex justify-between items-start gap-3">
                                <span className="font-bold text-slate-800 text-xs leading-relaxed">{item.product_name}</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-black text-[10px] rounded-md shrink-0">x{item.quantity}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/50 text-[10.5px] font-semibold text-slate-500">
                                <div>
                                  Giá bán: <span className="font-bold text-slate-700">{formatCurrency(item.selling_price)}</span>
                                </div>
                                {Number(item.billing_rate) > 0 && (
                                  <div>
                                    Cước tháng: <span className="font-bold text-slate-700">{formatCurrency(item.billing_rate)}/tháng</span>
                                  </div>
                                )}
                                {Number(item.commission) > 0 && (
                                  <div className="col-span-2 text-emerald-600 font-bold flex items-center gap-0.5">
                                    <TrendingUp className="w-3.5 h-3.5" /> Hoa hồng: {formatCommission(item.commission)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-2xl text-sm transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xoá đơn hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        Quay lại hồ sơ
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── MAIN CUSTOMER PROFILE VIEW ─── */
                  <>
                    {/* Profile Card */}
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 rounded-3xl border border-indigo-50/50">
                      <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-sm border-2 border-white overflow-hidden mb-4">
                        {selectedCustomer.avatar ? <img src={selectedCustomer.avatar} alt="" className="w-full h-full object-cover" /> : selectedCustomer.customer_name.slice(0, 2).toUpperCase()}
                      </div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight">{selectedCustomer.customer_name}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Sky Mobile ID: {selectedCustomer.skymobile_customer_id || 'Chưa đồng bộ'}</p>
                      
                      <div className="mt-4 flex gap-2">
                        {selectedCustomer.facebook_uid && (
                          <button
                            onClick={() => window.open(`https://www.facebook.com/${selectedCustomer.facebook_uid}`, '_blank')}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                          >
                            <Facebook className="w-3.5 h-3.5" /> Profile FB
                          </button>
                        )}
                        {selectedCustomer.conversation_id && (
                          <button
                            onClick={() => window.open(`https://business.facebook.com/latest/inbox/messenger?selected_item_id=${selectedCustomer.facebook_uid || selectedCustomer.conversation_id}`, '_blank')}
                            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                          >
                            <Facebook className="w-3.5 h-3.5" /> Inbox Suite
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thông tin chi tiết</h5>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 text-xs text-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Số điện thoại</span>
                          <span className="font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.phone_number || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Email</span>
                          <span className="font-bold flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.email || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Quốc tịch</span>
                          <span className="font-bold flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.nationality_name || 'Chưa cập nhật'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Chi nhánh</span>
                          <span className="font-bold flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-400" />{selectedCustomer.branch_name || 'Sky Mobile'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Kênh bán</span>
                          <span className="font-bold">{selectedCustomer.sales_channel_name || 'Không rõ'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">Nguồn dữ liệu</span>
                          <span>{getSourceBadge(selectedCustomer.source)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-3">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Đơn hàng đã chốt ({customerOrders.length})</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600 mr-2">{formatCurrency(customerOrders.reduce((acc, cur) => acc + (Number(cur.total_amount) || 0), 0))}</span>
                          <button
                            onClick={() => setIsCreatingOrder(true)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Thêm đơn
                          </button>
                        </div>
                      </h5>
                      <div className="space-y-3.5">
                        {loadingCustomerOrders ? (
                          <div className="text-center py-6 text-xs text-slate-400">Đang tải lịch sử đơn hàng...</div>
                        ) : customerOrders.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-2xl">Chưa có đơn hàng nào được đồng bộ.</div>
                        ) : (
                          customerOrders.map(order => (
                            <div
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between group/order"
                            >
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-800 group-hover/order:text-indigo-600 transition-colors">Đơn hàng #{order.skymobile_order_id}</span>
                                {order.items && order.items.length > 0 && (
                                  <div className="text-[10px] text-slate-400 font-semibold max-w-[240px] truncate" title={order.items.map((it: any) => `${it.product_name} (x${it.quantity})`).join(', ')}>
                                    Sản phẩm: {order.items.map((it: any) => `${it.product_name} (x${it.quantity})`).join(', ')}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                  <span>• Quantity: {order.product_quantity || 1}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right flex flex-col items-end">
                                  <span className="font-black text-slate-900 text-sm block group-hover/order:text-indigo-600 transition-colors">{formatCurrency(order.total_amount)}</span>
                                  {getOrderStatusBadge(order.order_status)}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOrder(order.id);
                                  }}
                                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover/order:opacity-100 flex items-center justify-center border border-transparent hover:border-rose-100 shadow-sm shrink-0"
                                  title="Xoá đơn hàng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedCustomer.notes && (
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú từ Messenger/CSKH</h5>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-xs text-amber-900 leading-relaxed italic">
                          "{selectedCustomer.notes}"
                        </div>
                      </div>
                    )}

                    {/* Delete Customer Button */}
                    <div className="pt-4 border-t border-slate-100 mt-6">
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-2xl text-xs transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xoá hồ sơ khách hàng này
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── SYNC OVERLAY PROGRESS MODAL ─── */}
      <AnimatePresence>
        {isSyncing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-8 relative z-10 border border-slate-100 text-center space-y-6 overflow-hidden"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                <RefreshCw className="w-10 h-10 animate-spin" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800">Đồng Bộ Dữ Liệu Sky Mobile</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Hệ thống đang mở trình duyệt tự động để bắt token bảo mật và cào API đơn hàng/khách hàng.</p>
              </div>

              {/* Progress Bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-indigo-600 animate-pulse">
                {syncProgressMsg}
              </div>

              {/* Terminal Logs */}
              <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl text-left font-mono text-[11px] h-48 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                {syncLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-slate-500 select-none">[{index + 1}]</span>
                    <span className={log.includes('❌') ? 'text-rose-400 font-bold' : log.includes('✅') || log.includes('🎉') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {log}
                    </span>
                  </div>
                ))}
                {syncLogs.length === 0 && <span className="text-slate-500 italic">Đang khởi tạo các tác vụ...</span>}
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Vui lòng không tắt hoặc tải lại trang web trong quá trình đồng bộ này.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
