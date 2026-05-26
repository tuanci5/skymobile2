import React, { useState } from 'react';
import { 
  User, Briefcase, Calendar, Clock, ClipboardList, 
  CheckCircle2, XCircle, ExternalLink, Trash2, Edit, BarChart2, Loader2 
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  position: string;
  interviewDate: string;
  interviewer: string;
  status: string;
  cvLink?: string;
  phone?: string;
  source?: string;
  interviewTime?: string;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  'Chờ phỏng vấn': { label: 'Chờ phỏng vấn', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
  'Đang phỏng vấn': { label: 'Đang phỏng vấn', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> },
  'Đã phỏng vấn': { label: 'Đã phỏng vấn', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: <ClipboardList className="w-3 h-3" /> },
  'Đạt': { label: 'Đạt', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  'Không đạt': { label: 'Không đạt', badge: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
};

const ALL_STATUSES = ['Chờ phỏng vấn', 'Đang phỏng vấn', 'Đã phỏng vấn', 'Cân nhắc (Vòng 2)', 'Đạt', 'Không PV', 'Không đạt', 'Đã nhận việc', 'Không nhận việc', 'Đã nghỉ việc'];

export const CandidateCard: React.FC<{
  candidate: Candidate;
  user: any;
  evalData?: any;
  onEvaluate: (c: Candidate) => void;
  onViewReport: (c: Candidate) => void;
  onStatusChange: (id: string, status: string) => Promise<any> | any;
  onDelete: (id: string) => void;
  onEditCV: (c: Candidate) => void;
}> = ({ candidate, user, evalData, onEvaluate, onViewReport, onStatusChange, onDelete, onEditCV }) => {
  const [savingStatus, setSavingStatus] = useState(false);
  const statusCfg = STATUS_CONFIG[candidate.status] || STATUS_CONFIG['Chờ phỏng vấn'];
  const canModify = user?.role === 'Quản trị' || user?.role?.includes('Hành chính - Nhân sự') || user?.role?.includes('Hành chính & Nhân sự');

  const handleStatusChange = async (nextStatus: string) => {
    if (!nextStatus || nextStatus === candidate.status || savingStatus) return;
    try {
      setSavingStatus(true);
      await onStatusChange(candidate.id, nextStatus);
    } catch (error: any) {
      console.error('Failed to update candidate status:', error);
      alert(error?.message || 'Không thể lưu trạng thái ứng viên. Vui lòng thử lại.');
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">{candidate.name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{candidate.source || '—'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="relative">
            <select
              value={candidate.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={savingStatus || !canModify}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold outline-none ${savingStatus || !canModify ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${statusCfg.badge}`}
              title={canModify ? 'Chọn nhanh trạng thái và lưu ngay' : 'Bạn không có quyền đổi trạng thái'}
            >
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {savingStatus && (
              <Loader2 className="absolute -right-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
          {evalData && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              Đã đánh giá - {evalData.totalScore || 0}/50
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-[12px] pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span className="w-16 shrink-0">Vị trí:</span>
          <span className="font-semibold text-slate-700 truncate">{candidate.position}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="w-16 shrink-0">Thời gian:</span>
          <span className="text-slate-700">
            {new Date(candidate.interviewDate).toLocaleDateString('vi-VN')} {candidate.interviewTime ? `- ${candidate.interviewTime}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="w-16 shrink-0">Người PV:</span>
          <span className="text-slate-700">{candidate.interviewer}</span>
        </div>
        {candidate.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span className="w-16 shrink-0">Liên hệ:</span>
            <span className="text-blue-600 font-medium">{candidate.phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {canModify && <button onClick={() => onDelete(candidate.id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>}
          {canModify && <button onClick={() => onEditCV(candidate)} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" title="Sửa thông tin"><Edit className="w-3.5 h-3.5" /></button>}
          {candidate.cvLink && <a href={candidate.cvLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" title="Xem CV gốc"><ExternalLink className="w-3.5 h-3.5" /></a>}
        </div>
        {evalData ? (
          <button onClick={() => onViewReport(candidate)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition-all flex justify-center items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Xem báo cáo
          </button>
        ) : (
          <button onClick={() => onEvaluate(candidate)} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md transition-all">Đánh giá ngay</button>
        )}
      </div>
    </div>
  );
};
