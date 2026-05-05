import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, Router, Smartphone, Zap, Laptop, Share2, 
  Briefcase, Globe, Store, Network, Search, CheckCircle2,
  PackageSearch, X, Eye, Info, Plus, Edit2, Trash2, Save,
  Calendar, Tag, User, DollarSign, ArrowLeft, MoreVertical,
  Layers, Package, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { PRODUCTS, ProductItem } from '../data/productData';
import { SUB_PRODUCTS_DATA } from '../data/subProductsData';

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

interface DetailedProduct {
  id: number;
  name: string;
  sale_price: number;
  import_price: number;
  import_date: string;
  seller: string;
  category: string;
  description: string;
  created_at: string;
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

export const ProductsTab: React.FC = () => {
  const [view, setView] = useState<'overview' | 'inventory'>('overview');
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState<string>('Tất cả');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Inventory states
  const [detailedProducts, setDetailedProducts] = useState<DetailedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DetailedProduct | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    sale_price: 0,
    import_price: 0,
    import_date: new Date().toISOString().split('T')[0],
    seller: '',
    category: 'Wifi Cầm Tay & Wifi Cắm điện Au',
    description: ''
  });

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

  useEffect(() => {
    if (view === 'inventory') {
      fetchDetailedProducts();
    }
  }, [view]);

  const handleOpenModal = (product?: DetailedProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        sale_price: Number(product.sale_price),
        import_price: Number(product.import_price),
        import_date: product.import_date || '',
        seller: product.seller || '',
        category: product.category || 'Wifi Cầm Tay & Wifi Cắm điện Au',
        description: product.description || ''
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        name: '',
        sale_price: 0,
        import_price: 0,
        import_date: new Date().toISOString().split('T')[0],
        seller: '',
        category: 'Wifi Cầm Tay & Wifi Cắm điện Au',
        description: ''
      });
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
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
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
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setView('overview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                Chiến lược
              </button>
              <button 
                onClick={() => setView('inventory')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Package className="w-3.5 h-3.5" />
                Kho sản phẩm
              </button>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {view === 'overview' ? 'Danh Mục Khai Thác' : 'Quản Lý Kho Sản Phẩm'}
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            {view === 'overview' 
              ? 'Danh sách các sản phẩm/dịch vụ cốt lõi mà công ty đang triển khai, cùng các định hướng mục tiêu và đánh giá thị trường cụ thể.'
              : 'Quản lý chi tiết từng sản phẩm nhập kho, theo dõi giá nhập, giá bán, nhà cung cấp và ngày nhập hàng.'
            }
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
          <div className="hidden sm:flex gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 min-w-[120px] border border-slate-100">
              <p className="text-2xl font-black text-slate-800">
                {view === 'overview' ? PRODUCTS.length : detailedProducts.length}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Sản phẩm</p>
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
            placeholder={view === 'overview' ? "Tìm kiếm sản phẩm hoặc từ khóa đánh giá..." : "Tìm tên sản phẩm, danh mục, người bán..."}
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
        {view === 'inventory' && (
          <button 
            onClick={fetchDetailedProducts}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 ${loadingProducts ? 'animate-spin' : ''}`} />
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
        ) : (
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
                      const profit = p.sale_price - p.import_price;
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
                          <td className="px-6 py-5 font-bold text-slate-900">{formatPrice(Number(p.sale_price))}</td>
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
                    <label className="text-sm font-bold text-slate-700">Giá bán (JPY)</label>
                    <div className="relative">
                      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="number" 
                        placeholder="0" 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                        value={productFormData.sale_price} 
                        onChange={e => setProductFormData({...productFormData, sale_price: Number(e.target.value)})} 
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
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="text" 
                        placeholder="Tên đối tác..." 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                        value={productFormData.seller} 
                        onChange={e => setProductFormData({...productFormData, seller: e.target.value})} 
                      />
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
    </div>
  );
};
