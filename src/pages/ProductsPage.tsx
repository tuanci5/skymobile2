import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, Router, Smartphone, Zap, Laptop, Share2, 
  Briefcase, Globe, Store, Network, Search, CheckCircle2,
  PackageSearch, X, Eye, Info, Plus, Edit2, Trash2, Save,
  Calendar, Tag, User, DollarSign, ArrowLeft, MoreVertical,
  Layers, Package, TrendingUp, AlertCircle, RefreshCw, Building2,
  Phone, Mail, MapPin, Sparkles
} from 'lucide-react';
import { PRODUCTS, ProductItem } from '../data/productData';
import { SUB_PRODUCTS_DATA } from '../data/subProductsData';

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

interface MonthlyPayment {
  month: number;
  amount: number;
}

interface DetailedProduct {
  id: number;
  name: string;
  sale_price: number;
  import_price: number;
  import_date: string;
  seller: string;
  category: string;
  description: string;
  sale_type?: 'outright' | 'monthly';
  initial_payment?: number;
  monthly_payments?: MonthlyPayment[];
  created_at: string;
}

interface ProductSupplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Wifi: <Wifi className="w-8 h-8" />,
  Router: <Router className="w-8 h-8" />,
  Smartphone: <Smartphone className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Laptop: <Laptop className="w-8 h-8" />,
  Network: <Network className="w-8 h-8" />,
  Share2: <Share2 className="w-8 h-8" />,
  Briefcase: <Briefcase className="w-8 h-8" />,
  Globe: <Globe className="w-8 h-8" />,
  Store: <Store className="w-8 h-8" />
};

const COLOR_MAP: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
  emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
  violet: 'from-violet-500 to-violet-600 shadow-violet-500/30',
  amber: 'from-amber-500 to-orange-500 shadow-amber-500/30',
  cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
  rose: 'from-rose-500 to-rose-600 shadow-rose-500/30',
  slate: 'from-slate-500 to-slate-600 shadow-slate-500/30',
  fuchsia: 'from-fuchsia-500 to-fuchsia-600 shadow-fuchsia-500/30',
  orange: 'from-orange-500 to-orange-600 shadow-orange-500/30'
};

const BADGE_COLOR: Record<string, string> = {
  'Sản phẩm chủ lực': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Làm kèm kết hợp': 'bg-amber-100 text-amber-700 border-amber-200',
  'Mục tiêu lớn': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'Đang tìm kiếm phát triển': 'bg-blue-100 text-blue-700 border-blue-200',
  'Đang tìm kiếm, phát triển': 'bg-blue-100 text-blue-700 border-blue-200',
  'Đổ sỉ cho CTV và Đại lý': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Dự án tiềm năng': 'bg-slate-100 text-slate-700 border-slate-200'
};

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const ProductsPage: React.FC = () => {
  const [view, setView] = useState<'overview' | 'inventory' | 'suppliers' | 'promotions'>('overview');
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState<string>('Tất cả');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Inventory states
  const [detailedProducts, setDetailedProducts] = useState<DetailedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DetailedProduct | null>(null);

  // Supplier states
  const [suppliers, setSuppliers] = useState<ProductSupplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ProductSupplier | null>(null);
  const defaultSupplierFormData = () => ({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [supplierFormData, setSupplierFormData] = useState(defaultSupplierFormData());

  // Promotions states
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsSearch, setPromotionsSearch] = useState('');
  const [promotionsTypeFilter, setPromotionsTypeFilter] = useState('');
  const [promotionsPage, setPromotionsPage] = useState(1);
  const [promotionsTotalPages, setPromotionsTotalPages] = useState(1);
  const [isSyncingPromotions, setIsSyncingPromotions] = useState(false);

  const defaultProductFormData = () => ({
    name: '',
    sale_price: 0,
    import_price: 0,
    import_date: new Date().toISOString().split('T')[0],
    seller: '',
    category: 'Wifi Cầm Tay & Wifi Cắm điện Au',
    description: '',
    sale_type: 'outright' as 'outright' | 'monthly',
    initial_payment: 0,
    monthly_payments: [{ month: 1, amount: 0 }] as MonthlyPayment[]
  });

  const [productFormData, setProductFormData] = useState(defaultProductFormData());

  const fetchDetailedProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        setDetailedProducts(await res.json());
      }
    } catch (err) {
      console.error('Error fetching detailed products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/suppliers`);
      if (res.ok) {
        setSuppliers(await res.json());
      }
    } catch (err) {
      console.error('Error fetching product suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    if (view === 'inventory') {
      fetchDetailedProducts();
      fetchSuppliers();
    }
    if (view === 'suppliers') {
      fetchSuppliers();
    }
  }, [view]);

  const fetchPromotions = async (page = 1, searchVal = '', typeVal = '') => {
    setPromotionsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        search: searchVal,
        type: typeVal
      });
      const res = await fetch(`${API_BASE_URL}/api/products/promotions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.items || []);
        setPromotionsTotalPages(data.totalPages || 1);
        setPromotionsPage(data.currentPage || 1);
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setPromotionsLoading(false);
    }
  };

  const handleSyncPromotions = async () => {
    setIsSyncingPromotions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/promotions/sync`, {
        method: 'POST'
      });
      if (res.ok) {
        // Reload promotions
        await fetchPromotions(1, promotionsSearch, promotionsTypeFilter);
      }
    } catch (err) {
      console.error('Error syncing promotions:', err);
    } finally {
      setIsSyncingPromotions(false);
    }
  };

  useEffect(() => {
    if (view === 'promotions') {
      fetchPromotions(1, promotionsSearch, promotionsTypeFilter);
    }
  }, [view, promotionsSearch, promotionsTypeFilter]);

  const handleOpenModal = (product?: DetailedProduct) => {
    fetchSuppliers();
    if (product) {
      setEditingProduct(product);
      const monthlyPayments = Array.isArray(product.monthly_payments) && product.monthly_payments.length > 0
        ? product.monthly_payments.map((payment, index) => ({
            month: Number(payment.month || index + 1),
            amount: Number(payment.amount || 0)
          }))
        : [{ month: 1, amount: 0 }];
      setProductFormData({
        name: product.name,
        sale_price: Number(product.sale_price),
        import_price: Number(product.import_price),
        import_date: product.import_date || '',
        seller: product.seller || '',
        category: product.category || 'Wifi Cầm Tay & Wifi Cắm điện Au',
        description: product.description || '',
        sale_type: product.sale_type === 'monthly' ? 'monthly' : 'outright',
        initial_payment: Number(product.initial_payment || 0),
        monthly_payments: monthlyPayments
      });
    } else {
      setEditingProduct(null);
      setProductFormData(defaultProductFormData());
    }
    setIsModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct 
        ? `${API_BASE_URL}/api/products/${editingProduct.id}`
        : `${API_BASE_URL}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      
      const monthlyTotal = productFormData.initial_payment + productFormData.monthly_payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
      const payload = {
        ...productFormData,
        sale_price: productFormData.sale_type === 'monthly' ? monthlyTotal : productFormData.sale_price,
        monthly_payments: productFormData.sale_type === 'monthly' ? productFormData.monthly_payments : [],
        initial_payment: productFormData.sale_type === 'monthly' ? productFormData.initial_payment : 0
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchDetailedProducts();
      } else {
        alert('Có lỗi xảy ra khi lưu sản phẩm.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchDetailedProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSupplierModal = (supplier?: ProductSupplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setSupplierFormData(defaultSupplierFormData());
    }
    setIsSupplierModalOpen(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSupplier
        ? `${API_BASE_URL}/api/products/suppliers/${editingSupplier.id}`
        : `${API_BASE_URL}/api/products/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierFormData)
      });

      if (res.ok) {
        setIsSupplierModalOpen(false);
        fetchSuppliers();
      } else if (res.status === 409) {
        alert('Nhà cung cấp này đã tồn tại.');
      } else {
        alert('Có lỗi xảy ra khi lưu nhà cung cấp.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này? Sản phẩm cũ vẫn giữ tên người bán đã lưu.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  // Lấy danh sách các Mục tiêu duy nhất từ dữ liệu
  const uniqueObjectives = useMemo(() => {
    const objs = new Set(PRODUCTS.map(p => p.objective));
    return ['Tất cả', ...Array.from(objs)];
  }, []);

  const filteredStrategicProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.assessment.join(' ').toLowerCase().includes(search.toLowerCase());
      const matchObj = filterObj === 'Tất cả' || p.objective === filterObj;
      return matchSearch && matchObj;
    });
  }, [search, filterObj]);

  const filteredInventoryProducts = useMemo(() => {
    return detailedProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    );
  }, [detailedProducts, search]);

  const filteredSuppliers = useMemo(() => {
    const keyword = search.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(keyword) ||
      supplier.phone?.toLowerCase().includes(keyword) ||
      supplier.email?.toLowerCase().includes(keyword) ||
      supplier.address?.toLowerCase().includes(keyword) ||
      supplier.notes?.toLowerCase().includes(keyword)
    );
  }, [suppliers, search]);

  const supplierOptions = useMemo(() => {
    const options = [...suppliers];
    if (productFormData.seller && !options.some(supplier => supplier.name === productFormData.seller)) {
      options.unshift({
        id: -1,
        name: productFormData.seller,
        created_at: new Date().toISOString()
      });
    }
    return options;
  }, [suppliers, productFormData.seller]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };

  const getMonthlyPayments = (product: DetailedProduct) => {
    return Array.isArray(product.monthly_payments) ? product.monthly_payments : [];
  };

  const getTotalSalePrice = (product: DetailedProduct) => {
    if (product.sale_type !== 'monthly') return Number(product.sale_price || 0);
    return Number(product.initial_payment || 0) + getMonthlyPayments(product).reduce((total, payment) => total + Number(payment.amount || 0), 0);
  };

  const updateMonthlyPayment = (index: number, amount: number) => {
    const monthlyPayments = productFormData.monthly_payments.map((payment, paymentIndex) =>
      paymentIndex === index ? { ...payment, amount } : payment
    );
    setProductFormData({ ...productFormData, monthly_payments: monthlyPayments });
  };

  const addMonthlyPayment = () => {
    const nextMonth = productFormData.monthly_payments.length + 1;
    setProductFormData({
      ...productFormData,
      monthly_payments: [...productFormData.monthly_payments, { month: nextMonth, amount: 0 }]
    });
  };

  const removeMonthlyPayment = (index: number) => {
    const monthlyPayments = productFormData.monthly_payments
      .filter((_, paymentIndex) => paymentIndex !== index)
      .map((payment, paymentIndex) => ({ ...payment, month: paymentIndex + 1 }));
    setProductFormData({ ...productFormData, monthly_payments: monthlyPayments });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Background Element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none opacity-60" />
        
        <div className="relative z-10 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <PackageSearch className="w-4 h-4" />
              <span>Hệ sinh thái sản phẩm</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
              <button 
                onClick={() => setView('overview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Chiến lược
              </button>
              <button 
                onClick={() => setView('inventory')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Package className="w-3.5 h-3.5" />
                Kho sản phẩm
              </button>
              <button 
                onClick={() => setView('suppliers')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'suppliers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Người bán / Nhà cung cấp
              </button>
              <button 
                onClick={() => setView('promotions')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'promotions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Khuyến mại
              </button>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {view === 'overview' && 'Danh Mục Khai Thác'}
            {view === 'inventory' && 'Quản Lý Kho Sản Phẩm'}
            {view === 'suppliers' && 'Người Bán / Nhà Cung Cấp'}
            {view === 'promotions' && 'Khuyến Mại & Ưu Đãi'}
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            {view === 'overview' && 'Danh sách các sản phẩm/dịch vụ cốt lõi mà công ty đang triển khai, cùng các định hướng mục tiêu và đánh giá thị trường cụ thể.'}
            {view === 'inventory' && 'Quản lý chi tiết từng sản phẩm nhập kho, theo dõi giá nhập, giá bán, nhà cung cấp và ngày nhập hàng.'}
            {view === 'suppliers' && 'Quản lý danh sách người bán, đối tác và nhà cung cấp để dùng trực tiếp trong form thêm sản phẩm mới.'}
            {view === 'promotions' && 'Đồng bộ và quản lý các chương trình khuyến mại, chiết khấu giá cước hoặc giảm giá bán từ hệ thống Sky Mobile.'}
          </p>
        </div>

        {/* Action / Stats */}
        <div className="flex flex-wrap gap-4 relative z-10 shrink-0">
          {view === 'inventory' && (
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus className="w-5 h-5" />
              Thêm sản phẩm
            </button>
          )}
          {view === 'suppliers' && (
            <button 
              onClick={() => handleOpenSupplierModal()}
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-5 h-5" />
              Thêm nhà cung cấp
            </button>
          )}
          {view === 'promotions' && (
            <button 
              onClick={() => handleSyncPromotions()}
              disabled={isSyncingPromotions}
              className="flex items-center gap-2 px-6 py-3.5 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-lg shadow-amber-200"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncingPromotions ? 'animate-spin' : ''}`} />
              {isSyncingPromotions ? 'Đang đồng bộ...' : 'Đồng bộ Khuyến mại'}
            </button>
          )}
          <div className="hidden sm:flex gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 min-w-[120px] border border-slate-100">
              <p className="text-2xl font-black text-slate-800">
                {view === 'overview' 
                  ? PRODUCTS.length 
                  : view === 'inventory' 
                  ? detailedProducts.length 
                  : view === 'suppliers' 
                  ? suppliers.length 
                  : promotions.length}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                {view === 'suppliers' 
                  ? 'Nhà cung cấp' 
                  : view === 'promotions' 
                  ? 'Khuyến mại' 
                  : 'Sản phẩm'}
              </p>
            </div>
            {view === 'overview' && (
              <div className="bg-emerald-50 rounded-2xl p-4 min-w-[120px] border border-emerald-100">
                <p className="text-2xl font-black text-emerald-600">
                  {PRODUCTS.filter(p => p.objective === 'Sản phẩm chủ lực').length}
                </p>
                <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Chủ lực</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={view === 'overview' ? "Tìm kiếm sản phẩm hoặc từ khóa đánh giá..." : view === 'inventory' ? "Tìm tên sản phẩm, danh mục, người bán..." : "Tìm tên, SĐT, email, địa chỉ nhà cung cấp..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
          />
        </div>
        {view === 'overview' && (
          <div className="relative shrink-0 sm:w-64">
            <select
              value={filterObj}
              onChange={(e) => setFilterObj(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm appearance-none cursor-pointer"
            >
              {uniqueObjectives.map(obj => (
                <option key={obj} value={obj}>{obj}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        )}
        {(view === 'inventory' || view === 'suppliers') && (
          <button 
            onClick={view === 'inventory' ? fetchDetailedProducts : fetchSuppliers}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 ${(loadingProducts || loadingSuppliers) ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* ── View Content ── */}
      <AnimatePresence mode="wait">
        {view === 'overview' ? (
          <motion.div 
            key="overview"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredStrategicProducts.map((product) => {
              const badgeClass = BADGE_COLOR[product.objective] || 'bg-slate-100 text-slate-700 border-slate-200';
              const gradientClass = COLOR_MAP[product.color] || COLOR_MAP['blue'];

              return (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  onClick={() => setSelectedProduct(product)}
                  className="group bg-white rounded-[2rem] p-1 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer relative"
                >
                  <div className="p-6 pb-5 flex gap-4 items-start border-b border-dashed border-slate-100">
                    <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${gradientClass} shadow-lg flex items-center justify-center text-white transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      {ICON_MAP[product.icon] || <PackageSearch className="w-7 h-7" />}
                    </div>
                    <div className="flex-1 pr-6">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${badgeClass} mb-2`}>
                        {product.objective}
                      </div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors duration-300">
                        {product.name}
                      </h3>
                    </div>
                    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="p-6 pt-5 bg-slate-50/50 flex-1 rounded-b-[1.75rem]">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Đánh giá chung</h4>
                    <ul className="space-y-3">
                      {product.assessment.map((item, idx) => (
                        <li key={idx} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : view === 'inventory' ? (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá nhập</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá bán</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày nhập / Người bán</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-slate-500 font-medium">Đang tải danh sách sản phẩm...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInventoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <PackageSearch className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-500 font-medium">Chưa có sản phẩm nào trong kho.</p>
                          <button onClick={() => handleOpenModal()} className="text-blue-600 font-bold hover:underline text-sm">Thêm sản phẩm đầu tiên</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInventoryProducts.map((p) => {
                      const totalSalePrice = getTotalSalePrice(p);
                      const profit = totalSalePrice - Number(p.import_price || 0);
                      const monthlyPayments = getMonthlyPayments(p);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Package className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide border border-slate-200">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-medium text-slate-600">{formatPrice(Number(p.import_price))}</td>
                          <td className="px-6 py-5 font-bold text-slate-900">
                            {p.sale_type === 'monthly' ? (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-black uppercase tracking-wide">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Thu hàng tháng
                                </div>
                                <div>{formatPrice(totalSalePrice)}</div>
                                <div className="text-[11px] font-semibold text-slate-500">
                                  Lần đầu {formatPrice(Number(p.initial_payment || 0))} + {monthlyPayments.length} tháng
                                </div>
                              </div>
                            ) : (
                              formatPrice(totalSalePrice)
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {profit >= 0 ? '+' : ''}{formatPrice(profit)}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                {p.import_date}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <User className="w-3.5 h-3.5" />
                                {p.seller}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenModal(p)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : view === 'suppliers' ? (
          <motion.div
            key="suppliers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà cung cấp</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">SĐT</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingSuppliers ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-slate-500 font-medium">Đang tải danh sách...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Building2 className="w-10 h-10 text-slate-300" />
                          <p className="text-slate-500 font-medium">Chưa có nhà cung cấp nào.</p>
                          <button onClick={() => handleOpenSupplierModal()} className="text-blue-600 font-bold hover:underline text-sm">Thêm nhà cung cấp đầu tiên</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-600 text-sm">
                          {s.phone ? <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{s.phone}</div> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-5 text-slate-600 text-sm">
                          {s.email ? <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{s.email}</div> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-5 text-slate-600 text-sm max-w-[200px] truncate">
                          {s.address ? <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /><span className="truncate">{s.address}</span></div> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-5 text-slate-500 text-sm max-w-[180px] truncate">{s.notes || <span className="text-slate-300">—</span>}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenSupplierModal(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteSupplier(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          // Promotions tab
          <motion.div
            key="promotions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Promotions filter & actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm khuyến mại..."
                  value={promotionsSearch}
                  onChange={(e) => setPromotionsSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                />
              </div>
              <div className="relative min-w-[200px]">
                <select
                  value={promotionsTypeFilter}
                  onChange={(e) => setPromotionsTypeFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none shadow-sm font-bold"
                >
                  <option value="">Tất cả loại hình</option>
                  <option value="BillingRate">Chiết khấu giá cước</option>
                  <option value="SellingPrice">Giảm giá bán sản phẩm</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <button 
                onClick={() => fetchPromotions(1, promotionsSearch, promotionsTypeFilter)}
                className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
                title="Làm mới"
              >
                <RefreshCw className={`w-5 h-5 ${promotionsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Promotions Content */}
            {promotionsLoading ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-slate-500 font-medium">Đang tải danh sách khuyến mại...</p>
                </div>
              </div>
            ) : promotions.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <Sparkles className="w-12 h-12 text-slate-300 animate-pulse" />
                  <p className="text-slate-500 font-medium">Không tìm thấy khuyến mại nào.</p>
                  <button 
                    onClick={() => handleSyncPromotions()} 
                    disabled={isSyncingPromotions}
                    className="text-blue-600 font-bold hover:underline text-sm disabled:text-slate-400"
                  >
                    {isSyncingPromotions ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu từ Sky Mobile'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {promotions.map((p) => {
                  const isActive = new Date(p.end_date) >= new Date() && p.is_active !== false;
                  const discountDisplay = p.promotion_type === 'BillingRate' 
                    ? `Chiết khấu cước: -￥${Number(p.discount_amount).toLocaleString()}` 
                    : `Giảm giá bán: -￥${Number(p.discount_amount).toLocaleString()}`;
                  
                  return (
                    <div 
                      key={p.id}
                      className="group bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                    >
                      {/* Gradient Accent line */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${p.promotion_type === 'BillingRate' ? 'from-indigo-500 to-indigo-600' : 'from-emerald-500 to-emerald-600'}`} />

                      <div className="flex justify-between items-start gap-4 mb-4">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          p.promotion_type === 'BillingRate' 
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {p.promotion_type === 'BillingRate' ? 'Cước hàng tháng' : 'Giá bán thiết bị'}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {isActive ? 'Đang chạy' : 'Hết hạn'}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 flex-1 group-hover:text-blue-600 transition-colors duration-300">
                        {p.product_name}
                      </h3>

                      <div className="space-y-3 pt-4 border-t border-dashed border-slate-100 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">Mức ưu đãi:</span>
                          <span className={`text-base font-black ${p.promotion_type === 'BillingRate' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                            {discountDisplay}
                          </span>
                        </div>

                        {p.branch_shipping_method_name && p.branch_shipping_method_name !== 'N/A' && (
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold">Hình thức ship:</span>
                            <span className="font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{p.branch_shipping_method_name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 mt-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-600">Thời gian diễn ra:</p>
                            <p className="text-[10px] mt-0.5">
                              {new Date(p.start_date).toLocaleDateString('vi-VN')} - {new Date(p.end_date).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 text-right italic pt-2">
                          Đồng bộ: {new Date(p.synced_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {promotionsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-dashed border-slate-100 bg-white p-6 rounded-[2rem] shadow-sm">
                <p className="text-xs font-bold text-slate-500">
                  Trang {promotionsPage} trên {promotionsTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={promotionsPage <= 1}
                    onClick={() => fetchPromotions(promotionsPage - 1, promotionsSearch, promotionsTypeFilter)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trước
                  </button>
                  <button
                    disabled={promotionsPage >= promotionsTotalPages}
                    onClick={() => fetchPromotions(promotionsPage + 1, promotionsSearch, promotionsTypeFilter)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Chi tiết Chiến lược ── */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 sm:p-6 pb-0 flex-col overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-[2.5rem] shadow-2xl w-full max-w-5xl mx-auto h-[90vh] overflow-hidden relative z-10 flex flex-col border border-slate-200/50 mt-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${COLOR_MAP[selectedProduct.color] || COLOR_MAP['blue']} shadow-lg flex items-center justify-center text-white`}>
                    {ICON_MAP[selectedProduct.icon] || <PackageSearch className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">{selectedProduct.name}</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Hệ sinh thái sản phẩm • Chiến lược</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/50 flex-1">
                {SUB_PRODUCTS_DATA[selectedProduct.id] ? (
                  <div className="space-y-8 pb-10">
                    {/* Tables */}
                    {SUB_PRODUCTS_DATA[selectedProduct.id].tables?.map((table, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50/50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{table.title}</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                              <tr>
                                {table.headers.map((th, i) => (
                                  <th key={i} className="px-6 py-4 border-b border-slate-100">{th}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {table.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                  {row.map((cell, j) => (
                                    <td key={j} className={`px-6 py-4 ${j === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <PackageSearch className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có thông tin chi tiết</h3>
                    <p className="text-slate-500 max-w-sm text-center leading-relaxed">
                      Dữ liệu sản phẩm con cho danh mục này sẽ sớm được cập nhật. Vui lòng tiếp tục theo dõi.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Thêm/Sửa Sản phẩm ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <form onSubmit={handleSubmitProduct} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Tên sản phẩm</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="text" 
                        placeholder="Vd: Wifi Pocket 5G Pro..." 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                        value={productFormData.name} 
                        onChange={e => setProductFormData({...productFormData, name: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Giá nhập (JPY)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="number" 
                        placeholder="0" 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                        value={productFormData.import_price} 
                        onChange={e => setProductFormData({...productFormData, import_price: Number(e.target.value)})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Ngày nhập hàng</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="date" 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                        value={productFormData.import_date} 
                        onChange={e => setProductFormData({...productFormData, import_date: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Người bán / Nhà cung cấp</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      {suppliers.length > 0 ? (
                        <select
                          required
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none bg-white cursor-pointer"
                          value={productFormData.seller}
                          onChange={e => setProductFormData({...productFormData, seller: e.target.value})}
                        >
                          <option value="">-- Chọn nhà cung cấp --</option>
                          {supplierOptions.map(supplier => (
                            <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Nhập tên hoặc vào tab Người bán để thêm..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            value={productFormData.seller}
                            onChange={e => setProductFormData({...productFormData, seller: e.target.value})}
                          />
                          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Chưa có nhà cung cấp. Hãy vào tab &ldquo;Người bán / Nhà cung cấp&rdquo; để thêm trước.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Danh mục chiến lược</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none bg-white cursor-pointer"
                        value={productFormData.category}
                        onChange={e => setProductFormData({...productFormData, category: e.target.value})}
                      >
                        {PRODUCTS.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Mô tả / Ghi chú</label>
                    <textarea 
                      rows={3} 
                      placeholder="Thông tin thêm về sản phẩm..." 
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none" 
                      value={productFormData.description} 
                      onChange={e => setProductFormData({...productFormData, description: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-4 col-span-1 md:col-span-2 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-sm font-bold text-slate-700">Kiểu giá bán</label>
                        <p className="text-xs text-slate-500 mt-1">Chọn bán đứt hoặc thu tiền theo từng tháng.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setProductFormData({ ...productFormData, sale_type: 'outright' })}
                          className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all ${productFormData.sale_type === 'outright' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Bán đứt
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductFormData({ ...productFormData, sale_type: 'monthly' })}
                          className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all ${productFormData.sale_type === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Thu hàng tháng
                        </button>
                      </div>
                    </div>

                    {productFormData.sale_type === 'outright' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Giá bán (JPY)</label>
                        <div className="relative">
                          <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            required 
                            type="number" 
                            placeholder="0" 
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white" 
                            value={productFormData.sale_price} 
                            onChange={e => setProductFormData({...productFormData, sale_price: Number(e.target.value)})} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Thu tiền lần đầu (JPY)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              required
                              type="number"
                              placeholder="0"
                              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white"
                              value={productFormData.initial_payment}
                              onChange={e => setProductFormData({...productFormData, initial_payment: Number(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-sm font-bold text-slate-700">Thu tiền từng tháng</label>
                            <button
                              type="button"
                              onClick={addMonthlyPayment}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                              <Plus className="w-4 h-4" />
                              Thêm tháng
                            </button>
                          </div>

                          <div className="space-y-2">
                            {productFormData.monthly_payments.map((payment, index) => (
                              <div key={payment.month} className="grid grid-cols-[96px_1fr_auto] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
                                <div className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-black text-center">
                                  Tháng {index + 1}
                                </div>
                                <input
                                  required
                                  type="number"
                                  placeholder="Số tiền"
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                  value={payment.amount}
                                  onChange={e => updateMonthlyPayment(index, Number(e.target.value))}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeMonthlyPayment(index)}
                                  disabled={productFormData.monthly_payments.length === 1}
                                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                  title="Xóa tháng"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-200">
                          <div className="text-xs font-bold uppercase tracking-widest text-indigo-100">Tổng thu dự kiến</div>
                          <div className="mt-1 text-2xl font-black">
                            {formatPrice(productFormData.initial_payment + productFormData.monthly_payments.reduce((total, payment) => total + Number(payment.amount || 0), 0))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Save className="w-5 h-5" />
                    Lưu sản phẩm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Thêm/Sửa Nhà cung cấp ── */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSupplierModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
                </h3>
                <button onClick={() => setIsSupplierModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmitSupplier} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tên nhà cung cấp <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required type="text" placeholder="Vd: Công ty ABC..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={supplierFormData.name} onChange={e => setSupplierFormData({...supplierFormData, name: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" placeholder="0909..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={supplierFormData.phone} onChange={e => setSupplierFormData({...supplierFormData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="email@..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={supplierFormData.email} onChange={e => setSupplierFormData({...supplierFormData, email: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Địa chỉ công ty..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={supplierFormData.address} onChange={e => setSupplierFormData({...supplierFormData, address: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ghi chú</label>
                  <textarea rows={3} placeholder="Thông tin bổ sung..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none" value={supplierFormData.notes} onChange={e => setSupplierFormData({...supplierFormData, notes: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Hủy bỏ</button>
                  <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Save className="w-5 h-5" />
                    Lưu nhà cung cấp
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
