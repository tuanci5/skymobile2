import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, RefreshCcw, Search, Filter, Briefcase, Calendar, 
  Loader2, AlertCircle, UserPlus 
} from 'lucide-react';

import { useCandidates } from '../hooks/useCandidates';
import { candidateService } from '../services/api';

import { CandidateEvalModal, Candidate } from '../components/modals/CandidateEvalModal';
import { EvalReportModal, EvaluationData } from '../components/modals/EvalReportModal';
import { AddCandidateModal } from '../components/modals/AddCandidateModal';
import { CVEditModal, CVData } from '../components/modals/CVEditModal';
import { JD_DATA } from '../data/hrData';

import { StatsBar } from '../components/hr/StatsBar';
import { CandidateCard } from '../components/hr/CandidateCard';

const ALL_STATUSES = ['Tất cả', 'Chờ phỏng vấn', 'Đang phỏng vấn', 'Đã phỏng vấn', 'Không PV', 'Cân nhắc (Vòng 2)', 'Đạt', 'Không đạt', 'Đã nhận việc', 'Không nhận việc', 'Đã nghỉ việc'] as const;
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const InterviewPage = ({ user, appsScriptUrl }: { user: any; appsScriptUrl?: string }) => {
  const { candidates, loading, error, refreshCandidates, updateCandidateStatus, deleteCandidate } = useCandidates();
  
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationData>>({});
  const [cvData, setCvData] = useState<Record<string, CVData>>({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [positionFilter, setPositionFilter] = useState<string>('Tất cả vị trí');
  const [datePreset, setDatePreset] = useState<string>('Tuần này');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalMode, setModalMode] = useState<'eval' | 'report' | 'add' | 'cv' | null>(null);

  const fetchEvaluationsAndCVs = useCallback(async () => {
    try {
      const resEval = await fetch(`${API_BASE_URL}/api/evaluations`);
      if (resEval.ok) {
        const evalMap = await resEval.json();
        setEvaluations(evalMap);
      }
      const resCV = await fetch(`${API_BASE_URL}/api/cvs`);
      if (resCV.ok) {
        const cvMap = await resCV.json();
        setCvData(cvMap);
      }
    } catch (err) {
      console.warn('Cannot fetch evaluations or CVs:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvaluationsAndCVs();
  }, [fetchEvaluationsAndCVs]);

  const handleRefresh = () => {
    refreshCandidates();
    fetchEvaluationsAndCVs();
  };

  const statsCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.position.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (positionFilter !== 'Tất cả vị trí' && c.position !== positionFilter) return false;
      
      const pvDate = new Date(c.interviewDate);
      const now = new Date();
      if (datePreset === '7 ngày gần nhất') {
        const diff = (now.getTime() - pvDate.getTime()) / (1000 * 3600 * 24);
        if (diff > 7 || diff < 0) return false;
      } else if (datePreset === 'Hôm nay') {
        if (pvDate.toDateString() !== now.toDateString()) return false;
      } else if (datePreset === 'Tuần này') {
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        if (pvDate < startOfWeek) return false;
      } else if (datePreset === 'Tháng này') {
        if (pvDate.getMonth() !== now.getMonth() || pvDate.getFullYear() !== now.getFullYear()) return false;
      }

      return true;
    });
  }, [candidates, search, positionFilter, datePreset]);

  const filteredCandidates = useMemo(() => {
    return statsCandidates.filter(c => {
      if (statusFilter !== 'Tất cả' && c.status !== statusFilter) return false;
      return true;
    });
  }, [statsCandidates, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">Tuyển dụng & Phỏng vấn</h3>
            <p className="text-slate-500 text-sm mt-0.5">Quản lý ứng viên và kết quả đánh giá</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalMode('add')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
            <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm ứng viên</span>
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-slate-600 font-bold">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600" /> {error}
        </div>
      )}

      {!loading && <StatsBar candidates={statsCandidates} onFilter={setStatusFilter} />}

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm ứng viên..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <select value={datePreset} onChange={e => setDatePreset(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer">
            {['7 ngày gần nhất', 'Hôm nay', 'Tuần này', 'Tháng này', 'Tất cả'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer">
            {['Tất cả vị trí', ...Array.from(new Set(Object.values(JD_DATA).map(jd => jd.title)))].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer">
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" /><p>Đang tải...</p></div>
      ) : filteredCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Users className="w-12 h-12 mb-4 opacity-20" /><p>Không có ứng viên nào.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCandidates.map(c => (
            <CandidateCard 
              key={c.id} 
              candidate={c} 
              user={user} 
              evalData={evaluations[c.id]}
              onEvaluate={() => { setSelectedCandidate(c); setModalMode('eval'); }} 
              onViewReport={() => { setSelectedCandidate(c); setModalMode('report'); }} 
              onStatusChange={updateCandidateStatus} 
              onDelete={deleteCandidate} 
              onEditCV={() => { setSelectedCandidate(c); setModalMode('cv'); }} 
            />
          ))}
        </div>
      )}

      {selectedCandidate && modalMode === 'eval' && <CandidateEvalModal candidate={selectedCandidate} onClose={() => { setSelectedCandidate(null); setModalMode(null); }} initialEvalData={evaluations[selectedCandidate.id] || null} onSubmitSuccess={() => handleRefresh()} appsScriptUrl={appsScriptUrl} />}
      {selectedCandidate && modalMode === 'report' && <EvalReportModal candidate={selectedCandidate} onClose={() => { setSelectedCandidate(null); setModalMode(null); }} evaluation={evaluations[selectedCandidate.id] || null} onEdit={() => setModalMode('eval')} />}
      {modalMode === 'add' && <AddCandidateModal isOpen={true} onClose={() => setModalMode(null)} onSubmitSuccess={() => handleRefresh()} appsScriptUrl={appsScriptUrl} />}
      {selectedCandidate && modalMode === 'cv' && <CVEditModal candidate={selectedCandidate} onClose={() => { setSelectedCandidate(null); setModalMode(null); }} initialCVData={cvData[selectedCandidate.id] || null} onSubmitSuccess={() => handleRefresh()} appsScriptUrl={appsScriptUrl} />}
    </div>
  );
};
