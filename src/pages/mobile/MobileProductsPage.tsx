import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Calendar, User, Layers, ShoppingCart } from 'lucide-react';

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

interface Product { id: number; name: string; sale_price: number; import_price: number; import_date: string; seller: string; category: string; sale_type?: string; }

export const MobileProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetch_ = async () => {
    setLoading(true);
    try { const r = await fetch(`${API_BASE_URL}/api/products`); if (r.ok) setProducts(await r.json()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch_(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.seller?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" /> Sản phẩm
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">{products.length} SP</span>
            <button onClick={fetch_} className="p-2 text-slate-500 active:bg-slate-100 rounded-xl">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
            className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? <div className="text-center text-slate-400 py-10 text-sm">Đang tải...</div> :
         filtered.length === 0 ? <div className="text-center text-slate-400 py-10"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Chưa có sản phẩm</p></div> :
         filtered.map(p => {
           const profit = Number(p.sale_price || 0) - Number(p.import_price || 0);
           return (
             <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                   <Package className="w-5 h-5" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-sm text-slate-800 truncate">{p.name}</h4>
                   <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 inline-block mt-1">{p.category}</span>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-50">
                 <div><p className="text-[10px] text-slate-400 mb-0.5">Giá nhập</p><p className="text-xs font-bold text-slate-600">{fmt(Number(p.import_price))}</p></div>
                 <div><p className="text-[10px] text-slate-400 mb-0.5">Giá bán</p><p className="text-xs font-bold text-slate-900">{fmt(Number(p.sale_price))}</p></div>
                 <div><p className="text-[10px] text-slate-400 mb-0.5">Lợi nhuận</p><p className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{profit >= 0 ? '+' : ''}{fmt(profit)}</p></div>
               </div>
               <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                 {p.import_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.import_date}</span>}
                 {p.seller && <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.seller}</span>}
               </div>
             </div>
           );
         })}
      </div>
    </div>
  );
};
