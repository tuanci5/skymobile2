import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Wifi, Router, Smartphone, Zap, Laptop, Share2, 
  Briefcase, Globe, Store, Network, Search, CheckCircle2,
  PackageSearch
} from 'lucide-react';
import { PRODUCTS, ProductItem } from '../data/productData';

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
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState<string>('Tất cả');

  // Lấy danh sách các Mục tiêu duy nhất từ dữ liệu
  const uniqueObjectives = useMemo(() => {
    const objs = new Set(PRODUCTS.map(p => p.objective));
    return ['Tất cả', ...Array.from(objs)];
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.assessment.join(' ').toLowerCase().includes(search.toLowerCase());
      const matchObj = filterObj === 'Tất cả' || p.objective === filterObj;
      return matchSearch && matchObj;
    });
  }, [search, filterObj]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Background Element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none opacity-60" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
            <PackageSearch className="w-4 h-4" />
            <span>Hệ sinh thái sản phẩm</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Danh Mục Khai Thác
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            Danh sách các sản phẩm/dịch vụ cốt lõi mà công ty đang triển khai, cùng các định hướng mục tiêu và đánh giá thị trường cụ thể.
          </p>
        </div>

        {/* Counters */}
        <div className="flex gap-4 relative z-10 shrink-0">
          <div className="bg-slate-50 rounded-2xl p-4 min-w-[120px] border border-slate-100">
            <p className="text-2xl font-black text-slate-800">{PRODUCTS.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Sản phẩm</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 min-w-[120px] border border-emerald-100">
            <p className="text-2xl font-black text-emerald-600">
              {PRODUCTS.filter(p => p.objective === 'Sản phẩm chủ lực').length}
            </p>
            <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mt-1">Chủ lực</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm hoặc từ khóa đánh giá..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
          />
        </div>
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
      </div>

      {/* ── Grid ── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {filteredProducts.map((product) => {
          const badgeClass = BADGE_COLOR[product.objective] || 'bg-slate-100 text-slate-700 border-slate-200';
          const gradientClass = COLOR_MAP[product.color] || COLOR_MAP['blue'];

          return (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="group bg-white rounded-[2rem] p-1 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
            >
              <div className="p-6 pb-5 flex gap-4 items-start border-b border-dashed border-slate-100">
                <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${gradientClass} shadow-lg flex items-center justify-center text-white transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {ICON_MAP[product.icon] || <PackageSearch className="w-7 h-7" />}
                </div>
                <div>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${badgeClass} mb-2`}>
                    {product.objective}
                  </div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {product.name}
                  </h3>
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

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy sản phẩm</h3>
          <p className="text-slate-500 mt-2">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
        </div>
      )}
    </div>
  );
};
