import React, { useMemo } from 'react';

interface Candidate {
  id: string;
  name: string;
  status: string;
}

export const StatsBar = ({ candidates, onFilter }: { candidates: Candidate[], onFilter: (status: string) => void }) => {
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      waiting: candidates.filter(c => c.status === 'Chờ phỏng vấn').length,
      interviewed: candidates.filter(c => c.status === 'Đã phỏng vấn' || c.status === 'Đang phỏng vấn').length,
      considering: candidates.filter(c => c.status === 'Cân nhắc (Vòng 2)').length,
      passed: candidates.filter(c => c.status === 'Đạt').length,
      noInterview: candidates.filter(c => c.status === 'Không PV').length,
      failed: candidates.filter(c => c.status === 'Không đạt').length,
      accepted: candidates.filter(c => c.status === 'Đã nhận việc').length,
      rejected: candidates.filter(c => c.status === 'Không nhận việc').length,
      quit: candidates.filter(c => c.status === 'Đã nghỉ việc').length,
    };
  }, [candidates]);

  const items = [
    { label: 'Tổng', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-100', filter: 'Tất cả' },
    { label: 'Chờ PV', value: stats.waiting, color: 'text-amber-700', bg: 'bg-amber-50', filter: 'Chờ phỏng vấn' },
    { label: 'Đã PV', value: stats.interviewed, color: 'text-violet-700', bg: 'bg-violet-50', filter: 'Đã phỏng vấn' },
    { label: 'Cân nhắc', value: stats.considering, color: 'text-orange-700', bg: 'bg-orange-50', filter: 'Cân nhắc (Vòng 2)' },
    { label: 'Đạt', value: stats.passed, color: 'text-emerald-700', bg: 'bg-emerald-50', filter: 'Đạt' },
    { label: 'Không PV', value: stats.noInterview, color: 'text-slate-500', bg: 'bg-slate-50', filter: 'Không PV' },
    { label: 'Không đạt', value: stats.failed, color: 'text-red-700', bg: 'bg-red-50', filter: 'Không đạt' },
    { label: 'Nhận việc', value: stats.accepted, color: 'text-teal-700', bg: 'bg-teal-50', filter: 'Đã nhận việc' },
    { label: 'Từ chối', value: stats.rejected, color: 'text-rose-700', bg: 'bg-rose-50', filter: 'Không nhận việc' },
    { label: 'Đã nghỉ', value: stats.quit, color: 'text-slate-400', bg: 'bg-slate-50', filter: 'Đã nghỉ việc' },
  ];

  return (
    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
      {items.map(s => (
        <div key={s.label} onClick={() => onFilter(s.filter)} className={`${s.bg} rounded-2xl p-4 text-center cursor-pointer hover:scale-105 transition-all shadow-sm min-w-[80px] flex-1 border border-white/50`}>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          <p className={`text-xs font-semibold ${s.color} opacity-80 mt-1 whitespace-nowrap`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
};
