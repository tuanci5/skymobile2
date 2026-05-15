import React from 'react';
import { BarChart3 } from 'lucide-react';
import { fmt, fmtPos } from '../../utils/formatters';

interface FinancialMasterTableProps {
  title: string;
  data: any;
  results: any;
  badge?: string;
  badgeColor?: string;
}

export const FinancialMasterTable = ({ title, data: d, results, badge, badgeColor }: FinancialMasterTableProps) => {
  const months = d.months;
  const sectionHeaderClass = 'bg-slate-800 text-white text-xs font-bold uppercase tracking-wider';
  const cellClass = 'text-center text-sm font-medium tabular-nums whitespace-nowrap';
  const totalCellClass = 'text-center text-sm font-bold tabular-nums whitespace-nowrap bg-slate-50';
  const { opProfitArray, kpiBonusArray, pbtArray, taxArray, patArray, patMarginArray } = results;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        {badge && (
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-lg ${badgeColor || 'bg-blue-600'}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 bg-slate-50 border-b border-r border-slate-200 w-64 sticky left-0 z-10">Chỉ số quản trị (Triệu VNĐ)</th>
              {months.map((m: string) => (
                <th key={m} className="px-3 py-3 text-center text-xs font-bold text-blue-700 bg-blue-50 border-b border-slate-200 min-w-[72px]">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* I. Vận hành */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                I. Chỉ số vận hành
              </td>
            </tr>
            {[
              { label: '1. Quy mô nhân sự (Số Team)', data: d.operations.teams, suffix: ' team' },
              { label: '2. Số đơn mới chốt', data: d.operations.newOrders },
              { label: '3. Khách rụng (Hết hạn 6 tháng)', data: d.operations.churnOrders, negative: true },
              { label: '4. Tổng khách cũ đang đóng cước', data: d.operations.totalActive, bold: true },
            ].map((row, i) => (
              <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${row.bold ? 'bg-blue-50/40' : ''}`}>
                <td className={`px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px] ${row.bold ? 'font-semibold bg-blue-50/40' : ''}`}>{row.label}</td>
                {row.data.map((v: number, mi: number) => (
                  <td key={mi} className={`${cellClass} py-2.5 px-2 ${v < 0 ? 'text-red-500' : row.bold ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>
                    {v < 0 ? `(${Math.abs(v).toLocaleString()})` : v === 0 ? '—' : fmtPos(v)}{row.suffix || ''}
                  </td>
                ))}
              </tr>
            ))}

            {/* II. Doanh thu */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                II. Tổng doanh thu thu từ khách hàng (Thu tiền) [A]
              </td>
            </tr>
            <tr className="border-b border-slate-100 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
              <td className="px-4 py-2.5 text-indigo-800 font-semibold border-r border-slate-100 sticky left-0 bg-indigo-50/30 text-[13px]">Tổng tiền thực thu</td>
              {d.grossRevenueByCohort.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-indigo-700 font-semibold`}>{fmtPos(v)}</td>
              ))}
            </tr>

            {/* III. Chi phí nét */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                III. Chi phí nét trả nhà mạng (Gốc/COGS) [B]
              </td>
            </tr>
            <tr className="border-b border-slate-100 bg-red-50/20 hover:bg-red-50/40 transition-colors">
              <td className="px-4 py-2.5 text-red-800 font-semibold border-r border-slate-100 sticky left-0 bg-red-50/20 text-[13px]">Tổng phí trả nhà mạng</td>
              {d.netCostsToProvider.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-red-600`}>{v === 0 ? '—' : fmtPos(v)}</td>
              ))}
            </tr>

            {/* IV. Chi phí vận hành */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass}`}>
                IV. Chi phí vận hành & Marketing (Cash Out) [C]
              </td>
            </tr>
            {[
              { label: '1. Ngân sách MKT (Tiền chạy QC)', data: d.operatingExpenses.marketing },
              { label: '2. Lương các Team (58tr/Team)', data: d.operatingExpenses.salary },
              { label: '3. Chi phí Cố định (VP, Kế toán…)', data: d.operatingExpenses.fixed },
              { label: '4. Phí cấp lại SIM (Xoay vòng phôi)', data: d.operatingExpenses.simRefill },
            ].map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">{row.label}</td>
                {row.data.map((v: number, mi: number) => (
                  <td key={mi} className={`${cellClass} py-2.5 px-2 text-red-600`}>{v === 0 ? '—' : fmtPos(v)}</td>
                ))}
              </tr>
            ))}
            <tr className="border-b-2 border-red-200 bg-red-50/40">
              <td className="px-4 py-3 text-red-800 font-bold border-r border-slate-100 sticky left-0 bg-red-50/40 text-[13px]">Tổng chi vận hành [C]</td>
              {d.operatingExpenses.total.map((v: number, mi: number) => (
                <td key={mi} className={`${totalCellClass} py-3 px-2 text-red-700 bg-red-50/40`}>{fmtPos(v)}</td>
              ))}
            </tr>

            {/* V. Hiệu quả */}
            <tr>
              <td colSpan={13} className={`px-4 py-2 ${sectionHeaderClass} bg-emerald-800`}>
                V. Hiệu quả quản trị dòng tiền cuối cùng
              </td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">1. Lợi nhuận vận hành (A - B - C)</td>
              {opProfitArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 ${v < 0 ? 'text-red-500' : 'text-emerald-700'}`}>{fmt(v)}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">2. Thưởng KPI (5% Doanh thu | Khi lãi lũy kế)</td>
              {kpiBonusArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-rose-600`}>{v === 0 ? '—' : `(${fmtPos(v)})`}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-100 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
              <td className="px-4 py-2.5 text-blue-800 font-semibold border-r border-slate-100 sticky left-0 bg-blue-50/30 text-[13px]">3. Lợi nhuận trước thuế TNDN (Lũy kế bù lỗ)</td>
              {pbtArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 ${v < 0 ? 'text-red-500' : 'text-blue-700'}`}>{fmt(v)}</td>
              ))}
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 sticky left-0 bg-white text-[13px]">4. Thuế TNDN (20% trên lãi lũy kế)</td>
              {taxArray.map((v: number, mi: number) => (
                <td key={mi} className={`${cellClass} py-2.5 px-2 text-rose-600`}>{v === 0 ? '—' : `(${fmtPos(v)})`}</td>
              ))}
            </tr>
            <tr className="border-b border-emerald-200 bg-emerald-900 shadow-inner">
              <td className="px-4 py-4 text-white font-bold border-r border-emerald-700 sticky left-0 bg-emerald-900 text-[14px]">LỢI NHUẬN RÒNG SAU THUẾ TNDN</td>
              {patArray.map((v: number, mi: number) => (
                <td key={mi} className="text-center py-4 px-2 text-emerald-400 font-black text-base tabular-nums whitespace-nowrap">
                  {fmt(v)}
                </td>
              ))}
            </tr>
            <tr className="bg-emerald-800/90 h-12">
              <td className="px-4 py-2 text-emerald-100 font-semibold border-r border-emerald-700 sticky left-0 bg-emerald-800/90 text-[13px]">Biên lợi nhuận ròng / Doanh thu</td>
              {patMarginArray.map((v: string, mi: number) => (
                <td key={mi} className="text-center py-2 px-2 text-amber-300 font-bold text-sm whitespace-nowrap">{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
