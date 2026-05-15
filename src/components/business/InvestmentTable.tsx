import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { MASTER_PLAN_DATA } from '../../data/appConstants';

interface InvestmentTableProps {
  data: {
    items: Array<{
      label: string;
      values: number[];
      color: string;
    }>;
  };
}

export const InvestmentTable = ({ data }: InvestmentTableProps) => {
  const months = MASTER_PLAN_DATA.months;

  const calculateTotal = (values: number[]) => values.reduce((sum, v) => sum + v, 0);
  const grandTotal = data.items.reduce((sum, item) => sum + calculateTotal(item.values), 0);

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-indigo-50 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-300" />
          <div>
            <h3 className="text-xl font-bold text-white">Ngân Sách Đầu Tư Thương Hiệu & Cơ Sở Vật Chất</h3>
            <p className="text-indigo-200 text-xs mt-0.5">Khoản chi đầu tư (CAPEX) — Theo dõi độc lập với kịch bản vận hành</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 backdrop-blur-sm">
          <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Tổng mức đầu tư dự kiến:</span>
          <span className="text-xl font-black text-white">{grandTotal.toLocaleString('vi-VN')} Tr</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-indigo-50/50">
              <th className="text-left px-5 py-4 text-xs font-bold text-indigo-900 border-b border-r border-indigo-100 w-80 sticky left-0 z-10 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Hạng mục đầu tư</th>
              {months.map((m) => (
                <th key={m} className="px-3 py-4 text-center text-xs font-bold text-indigo-700 border-b border-indigo-100 min-w-[72px]">{m}</th>
              ))}
              <th className="px-4 py-4 text-center text-xs font-bold text-white bg-indigo-600 border-b border-indigo-700 min-w-[100px] sticky right-0 z-10">TỔNG CỘNG</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-indigo-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-slate-800 font-semibold border-r border-indigo-50 sticky left-0 bg-white z-10 shadow-[1px_0_3px_rgba(0,0,0,0.02)]">{item.label}</td>
                {item.values.map((v, mi) => (
                  <td key={mi} className={`text-center py-4 px-2 tabular-nums text-sm font-medium ${item.color}`}>
                    {v === 0 ? <span className="text-slate-200">—</span> : v.toLocaleString('vi-VN')}
                  </td>
                ))}
                <td className="text-center py-4 px-2 font-bold bg-indigo-50/50 border-l border-indigo-100 sticky right-0 z-10 backdrop-blur-sm">
                  {calculateTotal(item.values).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
            <tr className="bg-indigo-900 text-white font-bold">
              <td className="px-5 py-4 border-r border-indigo-700 sticky left-0 bg-indigo-900">TỔNG CHI THEO THÁNG</td>
              {months.map((_, mi) => {
                const monthSum = data.items.reduce((sum, item) => sum + item.values[mi], 0);
                return (
                  <td key={mi} className="text-center py-4 px-2 tabular-nums">
                    {monthSum === 0 ? '—' : monthSum.toLocaleString('vi-VN')}
                  </td>
                );
              })}
              <td className="text-center py-4 px-2 font-black text-amber-300 sticky right-0 bg-indigo-950">
                {grandTotal.toLocaleString('vi-VN')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
