import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, RefreshCcw, Search, Filter, ExternalLink,
  Calendar, User, Briefcase, Clock, ChevronRight,
  AlertCircle, Loader2, CheckCircle2, XCircle, Eye,
  ClipboardList, BarChart2, UserPlus, Trash2, FileText, Edit,
} from 'lucide-react';
import { CandidateEvalModal, Candidate } from './CandidateEvalModal';
import { EvalReportModal, EvaluationData } from './EvalReportModal';
import { AddCandidateModal } from './AddCandidateModal';
import { CVEditModal, CVData } from './CVEditModal';
import { JD_DATA } from '../data/hrData';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CANDIDATES: Candidate[] = [
  { id: '001', name: 'Nguyễn Văn An',    position: 'Nhân viên Sale',      interviewDate: '2026-04-10', interviewer: 'Trần Thị Bích',    status: 'Chờ phỏng vấn', cvLink: 'https://drive.google.com/file/d/example1', phone: '0901 234 567', source: 'Facebook' },
  { id: '002', name: 'Lê Thị Mai',       position: 'Nhân viên Marketing', interviewDate: '2026-04-10', interviewer: 'Nguyễn Minh Khoa', status: 'Đang phỏng vấn', cvLink: 'https://drive.google.com/file/d/example2', phone: '0912 345 678', source: 'TopCV' },
  { id: '003', name: 'Phạm Quốc Hùng',   position: 'Nhân viên CSKH',      interviewDate: '2026-04-09', interviewer: 'Trần Thị Bích',    status: 'Đã phỏng vấn', cvLink: 'https://drive.google.com/file/d/example3', phone: '0933 456 789', source: 'Giới thiệu nội bộ' },
  { id: '004', name: 'Hoàng Thị Lan',    position: 'Nhân viên Sale',      interviewDate: '2026-04-08', interviewer: 'Nguyễn Minh Khoa', status: 'Đạt',           cvLink: 'https://drive.google.com/file/d/example4', phone: '0945 567 890', source: 'LinkedIn' },
  { id: '005', name: 'Trần Minh Tuấn',   position: 'Nhân viên Kỹ thuật',  interviewDate: '2026-04-08', interviewer: 'Trần Thị Bích',    status: 'Không đạt',     cvLink: undefined,                                  phone: '0956 678 901', source: 'Facebook' },
  { id: '006', name: 'Vũ Thị Hoa',       position: 'Nhân viên Content',   interviewDate: '2026-04-11', interviewer: 'Nguyễn Minh Khoa', status: 'Chờ phỏng vấn', cvLink: 'https://drive.google.com/file/d/example6', phone: '0967 789 012', source: 'TopCV' },
  { id: '007', name: 'Đinh Công Sơn',    position: 'Telesale',            interviewDate: '2026-04-11', interviewer: 'Trần Thị Bích',    status: 'Chờ phỏng vấn', cvLink: 'https://drive.google.com/file/d/example7', phone: '0978 890 123', source: 'Facebook' },
  { id: '008', name: 'Bùi Thị Ngọc',     position: 'Nhân viên Marketing', interviewDate: '2026-04-09', interviewer: 'Nguyễn Minh Khoa', status: 'Đã phỏng vấn', cvLink: 'https://drive.google.com/file/d/example8', phone: '0989 901 234', source: 'Giới thiệu nội bộ' },
];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
  'Chờ phỏng vấn': { label: 'Chờ phỏng vấn',  dot: 'bg-amber-400',              badge: 'bg-amber-50 text-amber-700 border-amber-200',    icon: <Clock      className="w-3 h-3" /> },
  'Đang phỏng vấn': { label: 'Đang phỏng vấn', dot: 'bg-blue-400',               badge: 'bg-blue-50 text-blue-700 border-blue-200',       icon: <Clock      className="w-3 h-3" /> },
  'Đã phỏng vấn':  { label: 'Đã phỏng vấn',   dot: 'bg-violet-400',             badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: <ClipboardList className="w-3 h-3" /> },
  'Cân nhắc (Vòng 2)': { label: 'Cân nhắc (Vòng 2)', dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Filter className="w-3 h-3" /> },
  'Đạt':           { label: 'Đạt',             dot: 'bg-emerald-500',            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  'Không đạt':     { label: 'Không đạt',       dot: 'bg-red-400',                badge: 'bg-red-50 text-red-700 border-red-200',         icon: <XCircle    className="w-3 h-3" /> },
  'Đã nhận việc':   { label: 'Đã nhận việc',    dot: 'bg-emerald-500',            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  'Không nhận việc':{ label: 'Không nhận việc', dot: 'bg-red-400',                badge: 'bg-red-50 text-red-700 border-red-200',         icon: <XCircle    className="w-3 h-3" /> },
  'Đã nghỉ việc':   { label: 'Đã nghỉ việc',    dot: 'bg-emerald-500',            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
};

const ALL_STATUSES = ['Tất cả', 'Chờ phỏng vấn', 'Đang phỏng vấn', 'Đã phỏng vấn', 'Cân nhắc (Vòng 2)', 'Đạt', 'Không đạt', 'Đã nhận việc', 'Không nhận việc', 'Đã nghỉ việc'] as const;

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ candidates, onFilter }: { candidates: Candidate[], onFilter: (status: string) => void }) => {
  const stats = useMemo(() => {
    const waiting = candidates.filter(c => c.status === 'Chờ phỏng vấn').length;
    const considering = candidates.filter(c => c.status === 'Cân nhắc (Vòng 2)').length;
    const passed = candidates.filter(c => c.status === 'Đạt' || c.status === 'Đã nhận việc' || c.status === 'Đã nghỉ việc' || c.status === 'Không nhận việc').length;
    const received = candidates.filter(c => c.status === 'Đã nhận việc').length;
    const resigned = candidates.filter(c => c.status === 'Đã nghỉ việc').length;
    const refused = candidates.filter(c => c.status === 'Không nhận việc').length;
    const failed = candidates.filter(c => c.status === 'Không đạt').length;

    return {
      total: candidates.length,
      waiting,
      // Đã PV = Tất cả các trạng thái trừ "Chờ phỏng vấn"
      done: candidates.length - waiting,
      considering,
      passed,
      received,
      refused,
      resigned,
      failed,
    };
  }, [candidates]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
      {[
        { label: 'Tổng',          value: stats.total,      color: 'text-slate-700',   bg: 'bg-slate-100', filter: 'Tất cả' },
        { label: 'Chờ PV',        value: stats.waiting,    color: 'text-amber-700',   bg: 'bg-amber-50', filter: 'Chờ phỏng vấn' },
        { label: 'Đã PV',         value: stats.done,       color: 'text-violet-700',  bg: 'bg-violet-50', filter: 'Đã phỏng vấn' },
        { label: 'Cân nhắc',      value: stats.considering,color: 'text-orange-700',  bg: 'bg-orange-50', filter: 'Cân nhắc (Vòng 2)' },
        { label: 'Đạt',           value: stats.passed,     color: 'text-emerald-700', bg: 'bg-emerald-50', filter: 'Đạt' },
        { label: 'Không đạt',     value: stats.failed,     color: 'text-red-700',     bg: 'bg-red-50', filter: 'Không đạt' },
        { label: 'Nhận việc',     value: stats.received,   color: 'text-emerald-700', bg: 'bg-emerald-50', filter: 'Đã nhận việc' },
        { label: 'Từ chối',       value: stats.refused,    color: 'text-red-700',     bg: 'bg-red-50', filter: 'Không nhận việc' },
        { label: 'Đã nghỉ',       value: stats.resigned,   color: 'text-slate-700',   bg: 'bg-slate-50', filter: 'Đã nghỉ việc' },
      ].map(s => (
        <div 
          key={s.label} 
          onClick={() => onFilter(s.filter)}
          className={`${s.bg} rounded-2xl p-4 text-center cursor-pointer hover:scale-105 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md`}
        >
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          <p className={`text-xs font-semibold ${s.color} opacity-70 mt-0.5`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Candidate Card ───────────────────────────────────────────────────────────
const CandidateCard: React.FC<{
  candidate: Candidate;
  onEvaluate: (c: Candidate) => void;
  onViewReport: (c: Candidate) => void;
  evalData?: EvaluationData;
  onStatusChange: (candidate: Candidate, newStatus: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  user: any;
  onEditCV: (c: Candidate) => void;
}> = ({
  candidate, onEvaluate, onViewReport, evalData, onStatusChange, onDelete, user, onEditCV,
}) => {
  const statusCfg   = STATUS_CONFIG[candidate.status];
  const hasEvalData = !!evalData;

  const isAdmin = user?.role === 'Quản trị';
  const isHR = user?.role?.includes('Hành chính - Nhân sự');
  const isManager = user?.role?.includes('Trưởng phòng') || user?.role?.includes('Trưởng nhóm');
  const canModify = isAdmin || isHR;
  const canEvaluate = isAdmin || isHR || isManager;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group relative"
    >

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 shadow-sm">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">{candidate.name}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{candidate.source || '—'}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="relative group/status flex items-center">
              <select
                value={candidate.status}
                onChange={(e) => onStatusChange(candidate, e.target.value)}
                className={`appearance-none flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-400/20 transition-all outline-none pr-1 ${statusCfg.badge}`}
              >
                {ALL_STATUSES.filter(s => s !== 'Tất cả').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* Evaluated ribbon - Moved below status select */}
            {hasEvalData && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" /> Đã đánh giá · {evalData.totalScore}/60
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5 text-[12px] border-t border-slate-50 pt-3">
          <div className="flex items-center gap-2 text-slate-600">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 w-24">Vị trí ứng tuyển:</span>
            <span className="font-semibold text-slate-700">{candidate.position}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 w-24">Thời gian PV:</span>
            <span className="text-slate-700 whitespace-nowrap">
              {new Date(candidate.interviewDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }).replace(',', '')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 w-24">Người PV:</span>
            <span className="text-slate-700">{candidate.interviewer}</span>
          </div>
          {candidate.phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-4 h-4 flex items-center justify-center text-slate-400">
                <span className="text-[14px]">📞</span>
              </div>
              <span className="text-slate-400 w-24">Liên hệ:</span>
              <span className="font-medium text-blue-600">
                {(() => {
                  const p = String(candidate.phone).trim();
                  return p.startsWith('0') ? p : '0' + p;
                })()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          {canModify && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(candidate.id); }}
              className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
              title="Xóa ứng viên"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {canModify && (
            <button onClick={(e) => { e.stopPropagation(); onEditCV(candidate); }}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
              title="Sửa thông tin CV">
              <Edit className="w-4 h-4" />
            </button>
          )}

          {candidate.cvLink && (
            <a href={candidate.cvLink} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-semibold shrink-0">
              <ExternalLink className="w-3.5 h-3.5" /> CV
            </a>
          )}

          {hasEvalData ? (
            <>
              <button onClick={() => onViewReport(candidate)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-bold shadow-sm shadow-emerald-600/20">
                <BarChart2 className="w-3.5 h-3.5" />
                Xem báo cáo
              </button>
              {canEvaluate && (
                <button onClick={() => onEvaluate(candidate)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-semibold shrink-0">
                  Sửa
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onEvaluate(candidate)}
              disabled={!canEvaluate}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold shadow-sm ${
                canEvaluate 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              {canEvaluate ? 'Đánh giá ngay' : 'Chờ đánh giá'}
              {canEvaluate && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  appsScriptUrl: string;
  sheetCsvUrl: string;
  resultSheetCsvUrl: string;
  user: any;
}

type ModalMode = 'eval' | 'report' | 'add' | 'cv' | null;

export const InterviewTab: React.FC<Props> = ({ appsScriptUrl, sheetCsvUrl, resultSheetCsvUrl, user }) => {
  const [candidates,       setCandidates]       = useState<Candidate[]>([]);
  
  // localAdded sẽ lưu dạng { data: Candidate, timestamp: number }
  const [localAdded,       setLocalAdded]       = useState<{data: Candidate, timestamp: number}[]>(() => {
    try {
      const stored = localStorage.getItem('sky_mobile_local_added_uv');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Chỉ lấy những mục chưa quá 1 phút
      const now = Date.now();
      return parsed.filter((item: any) => now - item.timestamp < 60000);
    } catch { return []; }
  });
  const [loading,          setLoading]          = useState(true);
  const [fetchError,       setFetchError]       = useState('');
  const [search,           setSearch]           = useState('');
  const [statusFilter,     setStatusFilter]     = useState<string>('Tất cả');
  const [positionFilter,   setPositionFilter]   = useState<string>('Tất cả vị trí');
  const [datePreset,       setDatePreset]       = useState<string>('Tuần này');
  const [fromDate,         setFromDate]         = useState<string>('');
  const [toDate,           setToDate]           = useState<string>('');

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalMode,          setModalMode]          = useState<ModalMode>(null);

  const isAdmin = user?.role === 'Quản trị';
  const isHR = user?.role?.includes('Hành chính - Nhân sự');
  const isManager = user?.role?.includes('Trưởng phòng') || user?.role?.includes('Trưởng nhóm');
  const canModify = isAdmin || isHR;
  const canEvaluate = isAdmin || isHR || isManager;

  const [evaluations, setEvaluations] = useState<Record<string, EvaluationData & { _localTimestamp?: number }>>(() => {
    try {
      const saved = localStorage.getItem('sky_mobile_evaluations');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      const now = Date.now();
      // Lọc bỏ những đánh giá local đã quá 1 phút (nếu cần)
      const cleaned: any = {};
      Object.keys(parsed).forEach(id => {
        const item = parsed[id];
        if (!item._localTimestamp || (now - item._localTimestamp < 60000)) {
          cleaned[id] = item;
        }
      });
      return cleaned;
    } catch { return {}; }
  });

  const [cvData, setCvData] = useState<Record<string, CVData>>({});

  // localStatusUpdates lưu trạng thái mới nhất được chỉnh ở local (trong 5 phút)
  // giúp tránh việc bị ghi đè bởi dữ liệu cũ từ CSV (do Google cache)
  const [localStatusUpdates, setLocalStatusUpdates] = useState<Record<string, { status: string, timestamp: number }>>(() => {
    try {
      const stored = localStorage.getItem('sky_mobile_status_updates');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      const now = Date.now();
      const cleaned: any = {};
      Object.keys(parsed).forEach(id => {
        if (now - parsed[id].timestamp < 30000) { // 30 giây
          cleaned[id] = parsed[id];
        }
      });
      return cleaned;
    } catch { return {}; }
  });

  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  };

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(resultSheetCsvUrl);
      const text = await res.text();
      const rows = text.split('\n').map(parseCSVRow);
      
      const evalMap: Record<string, EvaluationData> = {};
      // Skip header
      rows.slice(1).forEach(row => {
        if (row.length < 10) return;
        const candidateId = row[1]; // ID is at index 1
        if (!candidateId) return;

        try {
          // Individual scores are at index 10 to 21 (12 criteria)
          const scores: Record<string, number> = {};
          const critIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'];
          critIds.forEach((id, i) => {
            scores[id] = parseInt(row[10 + i] || '0');
          });

          // Notes are likely at index 22+ (though structure may vary, we take what we can)
          const notes: Record<string, string> = {};
          critIds.forEach((id, i) => {
             // In the current sheet, notes seem to follow scores or be in a specific range
             // For now, we take from index 22 onwards if available
             notes[id] = row[22 + i] || '';
          });

          evalMap[candidateId] = {
            candidateId,
            scores,
            notes,
            totalScore: parseInt(row[5] || '0'), // Total score at index 5
            strengths: row[6],
            weaknesses: row[7],
            decision: row[8],
            salaryNote: row[9],
            submittedAt: row[0] // Timestamp at index 0
          };
        } catch(e) {
          console.warn('Error parsing row for candidate', candidateId, e);
        }
      });
      setEvaluations(prev => ({...prev, ...evalMap}));
    } catch (err) { console.warn('Không thể tải đánh giá:', err); }
  };

  const fetchCVData = async () => {
    // CV data fetching not strictly required for view, but can be added if needed
    // Usually combined or handled in CVModal
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const urlWithCache = `${sheetCsvUrl}&t=${Date.now()}`;
      const res = await fetch(urlWithCache);
      const text = await res.text();
      const rawRows = text.split('\n').map(parseCSVRow);
      
      // Header: 0:id, 1:name, 2:position, 3:date, 4:interviewer, 5:status, 6:cv, 7:phone, 8:source
      const parsed: Candidate[] = rawRows.slice(1)
        .filter(row => row.length >= 6 && row[0])
        .map(row => ({
          id: row[0],
          name: row[1],
          position: row[2],
          interviewDate: row[3],
          interviewer: row[4],
          status: row[5],
          cvLink: row[6] || undefined,
          phone: row[7] || '',
          source: row[8] || ''
        }));

      // Merge local status updates
      const merged = parsed.map(c => {
        const local = localStatusUpdates[c.id];
        if (local && (Date.now() - local.timestamp < 30000)) {
          return { ...c, status: local.status as any };
        }
        return c;
      });

      setCandidates(merged);
      
      // Cleanup localAdded
      setLocalAdded(prev => {
        const filtered = prev.filter(item => !parsed.some(c => c.id === item.data.id));
        if (filtered.length !== prev.length) {
          localStorage.setItem('sky_mobile_local_added_uv', JSON.stringify(filtered));
        }
        return filtered;
      });
    } catch (e) {
      console.warn("Fetch Candidates failed", e);
      setFetchError('Không thể tải dữ liệu từ Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCandidates(); 
    fetchEvaluations();
    fetchCVData();

    // Tự động lấy dữ liệu mỗi 10 phút
    const pollInterval = setInterval(() => {
      fetchCandidates();
      fetchEvaluations();
      fetchCVData();
    }, 10 * 60 * 1000);

    // Dọn dẹp cache quá hạn 1 phút mỗi 30 giây
    const cacheCleanup = setInterval(() => {
      const now = Date.now();
      setLocalAdded(prev => {
        const filtered = prev.filter(item => now - item.timestamp < 60000);
        if (filtered.length !== prev.length) {
          localStorage.setItem('sky_mobile_local_added_uv', JSON.stringify(filtered));
        }
        return filtered;
      });
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(cacheCleanup);
    };
  }, []);

  // Sync localStatusUpdates to localStorage
  useEffect(() => {
    localStorage.setItem('sky_mobile_status_updates', JSON.stringify(localStatusUpdates));
  }, [localStatusUpdates]);

  const getPresetRange = (preset: string): [Date | null, Date | null] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset === 'Hôm nay') {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return [today, end];
    }
    if (preset === '7 ngày gần nhất') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    if (preset === 'Tuần này') {
      const start = new Date(today);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    if (preset === 'Tháng này') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    return [null, null];
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const dateFiltered = useMemo(() => {
    let [startRange, endRange] = getPresetRange(datePreset);
    if (datePreset === 'Tùy chỉnh') {
        startRange = fromDate ? new Date(fromDate) : null;
        if (startRange) startRange.setHours(0, 0, 0, 0);
        endRange = toDate ? new Date(toDate) : null;
        if (endRange) endRange.setHours(23, 59, 59, 999);
    }
    if (!startRange && !endRange) return candidates;
    return candidates.filter(c => {
       const cDate = parseDate(c.interviewDate);
       if (!cDate) return false;
       if (startRange && cDate < startRange) return false;
       if (endRange && cDate > endRange) return false;
       return true;
    });
  }, [candidates, datePreset, fromDate, toDate]);

  const searchFiltered = useMemo(() => {
    // Gộp dữ liệu từ Sheet và dữ liệu tạm thời (chưa quá 1 phút)
    const now = Date.now();
    const validLocal = localAdded
      .filter(item => now - item.timestamp < 60000 && !candidates.some(c => c.id === item.data.id))
      .map(item => item.data);

    const merged = [...validLocal, ...dateFiltered];

    return merged.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.position.toLowerCase().includes(search.toLowerCase()) ||
        c.interviewer.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [dateFiltered, candidates, localAdded, search]);

  const finalFiltered = useMemo(() => {
    const filtered = searchFiltered.filter(c => {
      if (statusFilter !== 'Tất cả') {
        if (statusFilter === 'Đã phỏng vấn') {
          if (c.status === 'Chờ phỏng vấn') return false;
        } else if (c.status !== statusFilter) {
          return false;
        }
      }
      
      if (positionFilter !== 'Tất cả vị trí') {
        if (c.position !== positionFilter) return false;
      }
      return true;
    });
    
    // Sắp xếp theo vị trí từ cao xuống thấp (giả định dựa trên thứ tự trong JD hoặc độ dài tên vị trí)
    // Ở đây ta sẽ sắp xếp theo thứ tự bảng chữ cái giảm dần của position để minh họa "cao xuống thấp" 
    // hoặc nếu có một danh sách ưu tiên vị trí thì sẽ dùng danh sách đó.
    return [...filtered].sort((a, b) => b.position.localeCompare(a.position));
  }, [searchFiltered, statusFilter, positionFilter]);

  const openEval   = (c: Candidate) => { setSelectedCandidate(c); setModalMode('eval'); };
  const openReport = (c: Candidate) => { setSelectedCandidate(c); setModalMode('report'); };
  const openCV     = (c: Candidate) => { setSelectedCandidate(c); setModalMode('cv'); };
  const closeModal = ()             => { setSelectedCandidate(null); setModalMode(null); };

  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ứng viên này?')) return;
    
    setCandidates(prev => prev.filter(c => c.id !== id));
    setLocalAdded(prev => {
      const filtered = prev.filter(item => item.data.id !== id);
      localStorage.setItem('sky_mobile_local_added_uv', JSON.stringify(filtered));
      return filtered;
    });

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'deleteCandidate');
      formData.append('id', id);

      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    } catch (err) { console.error(err); }
  };

  const updateCandidateStatus = async (candidate: Candidate, newStatus: string) => {
    // 1. Cập nhật state candidates ngay lập tức để UI mượt mà
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: newStatus as any } : c));
    
    // 2. Lưu vào localStatusUpdates để tránh bị fetch cũ ghi đè
    setLocalStatusUpdates(prev => ({
      ...prev,
      [candidate.id]: { status: newStatus, timestamp: Date.now() }
    }));

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'updateStatus');
      formData.append('id', candidate.id);
      formData.append('status', newStatus);

      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    } catch (err) { console.error(err); }
  };

  const handleSubmitSuccess = (id: string, evalData: EvaluationData) => {
    setEvaluations(prev => {
      const updated = { ...prev, [id]: { ...evalData, _localTimestamp: Date.now() } };
      try { localStorage.setItem('sky_mobile_evaluations', JSON.stringify(updated)); } catch {}
      return updated;
    });
    const candidate = candidates.find(c => c.id === id) || localAdded.find(l => l.data.id === id)?.data;
    if (candidate) {
      let finalStatus = 'Đã phỏng vấn';
      if (evalData.decision === 'accept') finalStatus = 'Đạt';
      if (evalData.decision === 'reject') finalStatus = 'Không đạt';
      if (evalData.decision === 'consider') finalStatus = 'Cân nhắc (Vòng 2)';
      updateCandidateStatus(candidate, finalStatus);
    }
    setModalMode('report');
  };

  const handleAddCandidateSuccess = (newCandidate: Candidate) => {
    const now = Date.now();
    const newItem = { data: newCandidate, timestamp: now };
    const updatedLocal = [newItem, ...localAdded];
    setLocalAdded(updatedLocal);
    localStorage.setItem('sky_mobile_local_added_uv', JSON.stringify(updatedLocal));
  };

  const openCVEdit = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalMode('cv');
  };

  const handleSubmitCVSuccess = (candidateId: string, cvData: CVData) => {
    setCvData(prev => {
      const updated = { ...prev, [candidateId]: cvData };
      try { localStorage.setItem('sky_mobile_cv_data', JSON.stringify(updated)); } catch {}
      return updated;
    });
    closeModal();
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Danh sách ứng viên phỏng vấn
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Đồng bộ dữ liệu thời gian thực từ Google Sheets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalMode('add')} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg shadow-blue-600/20 flex-1 sm:flex-none justify-center">
              <UserPlus className="w-4 h-4" />
              Thêm ứng viên
            </button>
            <button onClick={() => { fetchCandidates(); fetchEvaluations(); }} disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-semibold shrink-0 disabled:opacity-50 flex-1 sm:flex-none">
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            {fetchError}
          </div>
        )}

        {!loading && <StatsBar candidates={searchFiltered} onFilter={setStatusFilter} />}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Tìm theo tên, vị trí, người PV..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm" />
            </div>

            <div className="relative shrink-0">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={datePreset} onChange={e => setDatePreset(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm appearance-none cursor-pointer">
                {['7 ngày gần nhất', 'Tất cả thời gian', 'Hôm nay', 'Tuần này', 'Tháng này', 'Tùy chỉnh'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="relative shrink-0">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm appearance-none cursor-pointer sm:max-w-xs truncate">
                {['Tất cả vị trí', ...Array.from(new Set(Object.values(JD_DATA).map(jd => jd.title))).sort()].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="relative shrink-0">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm appearance-none cursor-pointer">
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {datePreset === 'Tùy chỉnh' && (
            <div 
               className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-slate-600 font-bold min-w-[65px]">Từ ngày:</span>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                     className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none bg-slate-50"/>
              </div>
              <div className="hidden sm:block text-slate-300">-</div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-slate-600 font-bold min-w-[65px]">Đến ngày:</span>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                     className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none bg-slate-50"/>
              </div>
            </div>
          )}
        </div>

        {/* Card grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="font-medium">Đang tải danh sách ứng viên...</p>
          </div>
        ) : finalFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Users className="w-12 h-12 mb-4 text-slate-300" />
            <p className="font-bold text-slate-500">Không tìm thấy ứng viên</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {finalFiltered.map(c => (
              <CandidateCard
                key={c.id}
                candidate={c}
                onEvaluate={openEval}
                onViewReport={openReport}
                evalData={evaluations[c.id]}
                onStatusChange={updateCandidateStatus}
                onDelete={handleDeleteCandidate}
                user={user}
                onEditCV={openCVEdit}
              />
            ))}
          </div>
        )}

        {!loading && !sheetCsvUrl && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <strong>Chế độ demo</strong> – Dữ liệu hiển thị là mẫu. Cung cấp{' '}
              <code className="bg-blue-100 px-1 rounded">sheetCsvUrl</code> và{' '}
              <code className="bg-blue-100 px-1 rounded">appsScriptUrl</code> để kết nối thật.
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Form Modal */}
      {selectedCandidate && modalMode === 'eval' && (
        <CandidateEvalModal
          candidate={selectedCandidate}
          onClose={closeModal}
          initialEvalData={evaluations[selectedCandidate.id]}
          onSubmitSuccess={handleSubmitSuccess}
          appsScriptUrl={appsScriptUrl}
        />
      )}

      {/* Report Modal */}
      {selectedCandidate && modalMode === 'report' && (
        <EvalReportModal
          candidate={selectedCandidate}
          evaluation={evaluations[selectedCandidate.id] ?? null}
          onClose={closeModal}
          onEdit={() => setModalMode('eval')}
        />
      )}

      {/* CV Edit Modal */}
      {selectedCandidate && modalMode === 'cv' && (
        <CVEditModal
          candidate={selectedCandidate}
          onClose={closeModal}
          initialCVData={cvData[selectedCandidate.id]}
          onSubmitSuccess={handleSubmitCVSuccess}
          appsScriptUrl={appsScriptUrl}
        />
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={modalMode === 'add'}
        onClose={closeModal}
        onSubmitSuccess={handleAddCandidateSuccess}
        appsScriptUrl={appsScriptUrl}
      />
    </>
  );
};
