import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Info, 
  Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MASTER_PLAN_DATA, BRAND_INVESTMENT_DATA } from '../data/appConstants';
import { calculateFinancials } from '../utils/calculations';
import { FinancialMasterTable } from '../components/business/FinancialMasterTable';
import { InvestmentTable } from '../components/business/InvestmentTable';
import { ActionPlanView } from '../components/ActionPlanView';

export const BusinessPlanPage = ({ initialSubTab }: { initialSubTab?: 'finance' | 'action' }) => {
  // Define Scenario 1: Marketing cost is 20% of monthly revenue
  const d1 = JSON.parse(JSON.stringify(MASTER_PLAN_DATA));
  d1.operatingExpenses.marketing = d1.grossRevenueByCohort.map((v: number) => Math.round(v * 0.2));
  d1.operatingExpenses.total = d1.months.map((_: any, i: number) =>
    d1.operatingExpenses.marketing[i] +
    d1.operatingExpenses.salary[i] +
    d1.operatingExpenses.fixed[i] +
    d1.operatingExpenses.simRefill[i]
  );
  const results1 = calculateFinancials(d1);

  // Define Scenario 2: Marketing cost is reduced to flat 10% of monthly revenue
  const SCENARIO_2_DATA = JSON.parse(JSON.stringify(MASTER_PLAN_DATA));
  SCENARIO_2_DATA.operatingExpenses.marketing = SCENARIO_2_DATA.grossRevenueByCohort.map((v: number) => Math.round(v * 0.1));
  SCENARIO_2_DATA.operatingExpenses.total = SCENARIO_2_DATA.months.map((_: any, i: number) =>
    SCENARIO_2_DATA.operatingExpenses.marketing[i] +
    SCENARIO_2_DATA.operatingExpenses.salary[i] +
    SCENARIO_2_DATA.operatingExpenses.fixed[i] +
    SCENARIO_2_DATA.operatingExpenses.simRefill[i]
  );

  const results2 = calculateFinancials(SCENARIO_2_DATA);

  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'action'>(initialSubTab || 'finance');

  // Sync state with prop if it changes via URL
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="max-w-full mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="text-center flex flex-col items-center mb-4">
        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full mb-6 shadow-sm">
          <TrendingUp className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Kế hoạch Kinh doanh</h2>
        <p className="text-slate-600 max-w-3xl text-lg">
          Chiến lược vận hành và Dự báo tài chính <span className="font-bold text-slate-800">Sky Mobile Japan</span>.
        </p>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl mt-8 w-fit">
          <button
            onClick={() => navigate('/business')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'finance'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dự báo Tài chính
          </button>
          <button
            onClick={() => navigate('/action-plan')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'action'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Calendar className="w-4 h-4" />
            Kế hoạch 4 tháng
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'finance' ? (
          <motion.div
            key="finance"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-16"
          >
            {/* Part 1: Brand Investment Table (CAPEX) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                <h4 className="text-2xl font-bold text-slate-800">Phần 1: Ngân sách đầu tư thương hiệu & Cơ sở vật chất</h4>
              </div>
              <InvestmentTable data={BRAND_INVESTMENT_DATA} />
            </div>

            {/* Comparison Divider */}
            <div className="py-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <div className="px-6 py-2 bg-slate-100 rounded-full text-slate-500 text-sm font-bold uppercase tracking-widest">Phần 2: Kịch bản kinh doanh vận hành (OPEX)</div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Table 1: Original */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full" />
                <h4 className="text-2xl font-bold text-slate-800">Phương án 1: Kế hoạch kinh doanh dựa trên phương án chi phí Marketing chiếm 20% doanh thu</h4>
              </div>
              <FinancialMasterTable title="Bảng Dự Toán Phương Án 1" data={d1} results={results1} badge="MKT 20%" badgeColor="bg-blue-600" />
            </div>

            {/* Table 2: Scenario 2 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-600 rounded-full" />
                <h4 className="text-2xl font-bold text-slate-800">Phương án 2: Tối ưu Marketing (10% Doanh thu)</h4>
              </div>
              <FinancialMasterTable title="Bảng Dự Toán Phương Án 2" data={SCENARIO_2_DATA} results={results2} badge="TỐI ƯU MKT" badgeColor="bg-emerald-600" />
            </div>

            {/* Summary comparison cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
              {[
                { label: 'LN Sau Thuế (PA 1)', value: `~${results1.patArray[11].toLocaleString('vi-VN')} Tr`, sub: 'Giai đoạn ổn định (MKT 20%)', color: 'bg-blue-600', icon: <TrendingUp className="w-6 h-6" /> },
                { label: 'LN Sau Thuế (PA 2)', value: `~${results2.patArray[11].toLocaleString('vi-VN')} Tr`, sub: 'Giai đoạn ổn định (MKT 10%)', color: 'bg-emerald-600', icon: <TrendingUp className="w-6 h-6" /> },
                { label: 'Chênh lệch lợi nhuận', value: `+${(results2.patArray[11] - results1.patArray[11]).toLocaleString('vi-VN')} Tr`, sub: 'Mỗi tháng khi tối ưu MKT', color: 'bg-amber-600', icon: <TrendingUp className="w-6 h-6" /> },
                { label: 'Biên LN PA2 ổn định', value: results2.patMarginArray[11], sub: 'Hiệu suất vận hành tối đa', color: 'bg-indigo-600', icon: <BarChart3 className="w-6 h-6" /> },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`p-3 rounded-xl w-fit mb-4 text-white ${card.color}`}>{card.icon}</div>
                  <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-black text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* 3 management insights */}
            <div className="space-y-6 mt-16">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <Star className="w-7 h-7 text-amber-500" />
                <h3 className="text-2xl font-bold text-slate-900">3 Điểm sáng Quản trị từ Master Plan</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  {
                    num: '01',
                    title: 'Giai đoạn "Thung lũng chết" T1 - T2',
                    color: 'from-blue-600 to-indigo-700',
                    highlight: '-98 triệu VNĐ trong tháng đầu',
                    body: 'Do chi phí Marketing và lương đội ngũ được chi trả ngay từ đầu trong khi doanh thu tích lũy chưa đủ lớn, dòng tiền sẽ âm nhẹ trong 2 tháng đầu. Đây là giai đoạn đầu tư nền móng cực kỳ quan trọng.',
                    tag: 'Đầu tư chiến lược',
                  },
                  {
                    num: '02',
                    title: 'Điểm hòa vốn và Bùng nổ từ Tháng 4',
                    color: 'from-emerald-600 to-teal-700',
                    highlight: 'Bầu trời lợi nhuận sau bù lỗ',
                    body: 'Từ tháng thứ 4, sau khi đã bù xong các khoản lỗ vận hành ban đầu, hệ thống bắt đầu trích thưởng KPI 5% và thực hiện nghĩa vụ thuế 20%, dòng tiền thực nhận vẫn cực kỳ mạnh mẽ.',
                    tag: 'Thu hoạch quả ngọt',
                  },
                  {
                    num: '03',
                    title: 'Cơ chế "Payback" nhanh và biên LN thực',
                    color: 'from-amber-500 to-orange-600',
                    highlight: `Biên LN ròng thực ~${results2.patMarginArray[11]}`,
                    body: 'Nhờ tối ưu hóa phí đầu vào và tập trung vào các dòng sản phẩm có biên lợi nhuận cao, tỷ suất lợi nhuận sau cùng (đã trừ mọi chi phí vận hành, KPI và Thuế) duy trì mức cực kỳ ấn tượng.',
                    tag: 'Mô hình tối ưu',
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                    <div className={`p-6 text-white bg-gradient-to-br ${item.color} relative overflow-hidden`}>
                      <div className="absolute right-4 top-2 font-black text-8xl opacity-10 select-none">{item.num}</div>
                      <div className="relative z-10">
                        <span className="text-xs font-bold tracking-widest opacity-80 uppercase">Điểm sáng {item.num}</span>
                        <h4 className="text-lg font-bold mt-2 leading-snug">{item.title}</h4>
                        <span className="mt-3 inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">{item.highlight}</span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {item.body} <span className="font-bold text-slate-900">{item.tag}</span>.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="action"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <ActionPlanView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assumptions footnote */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Giả định tính toán thực tế (Cập nhật lịch trình dòng tiền)</p>
          <p>• Phí thu khách hàng: Month 1: 9.980 JPY | Month 2-6: 4.980 JPY | Hoa hồng nhà mạng (M3): 6.000 JPY</p>
          <p>• Phí trả nhà mạng: Month 1-6: 3.500 JPY (Dock) | Month 7+: 3.880 JPY</p>
          <p>• Marketing & Vận hành: Mkt 1st Month (6.252 JPY) | Lương 58tr/Team | Định mức LN tính theo chu kỳ 6 tháng.</p>
          <p>• Tất cả số liệu đã làm tròn. Mô hình dựa trên giả định 70% Dock – 30% SIM và tỷ giá 165 VNĐ/JPY.</p>
        </div>
      </div>
    </div>
  );
};