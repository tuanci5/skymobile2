import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, RefreshCcw, Search, Filter, ExternalLink,
  Calendar, User, Briefcase, Clock, ChevronRight,
  AlertCircle, Loader2, CheckCircle2, XCircle, Eye,
  ClipboardList, BarChart2, UserPlus, Trash2,
} from 'lucide-react';
import { CandidateEvalModal, Candidate } from './CandidateEvalModal';
import { EvalReportModal, EvaluationData } from './EvalReportModal';
import { AddCandidateModal } from './AddCandidateModal';

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
  'Đã phỏng vấn':  { label: 'Đã phỏng vấn',   dot: 'bg-violet-400',             badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: <ClipboardList className="w-3 h-3" /> },
  'Cân nhắc (Vòng 2)': { label: 'Cân nhắc (Vòng 2)', dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Filter className="w-3 h-3" /> },
  'Đạt':           { label: 'Đạt',             dot: 'bg-emerald-500',            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  'Không đạt':     { label: 'Không đạt',       dot: 'bg-red-400',                badge: 'bg-red-50 text-red-700 border-red-200',         icon: <XCircle    className="w-3 h-3" /> },
};

const ALL_STATUSES = ['Tất cả', 'Chờ phỏng vấn', 'Đã phỏng vấn', 'Cân nhắc (Vòng 2)', 'Đạt', 'Không đạt'] as const;

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ candidates }: { candidates: Candidate[] }) => {
  const stats = useMemo(() => {
    const waiting = candidates.filter(c => c.status === 'Chờ phỏng vấn').length;
    const considering = candidates.filter(c => c.status === 'Cân nhắc (Vòng 2)').length;
    const passed = candidates.filter(c => c.status === 'Đạt').length;
    const failed = candidates.filter(c => c.status === 'Không đạt').length;
    const genericDone = candidates.filter(c => c.status === 'Đã phỏng vấn').length;

    return {
      total: candidates.length,
      waiting,
      // Đã PV = Tổng tất cả các trường hợp không phải đang chờ
      done: genericDone + considering + passed + failed,
      considering,
      passed,
      failed,
    };
  }, [candidates]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {[
        { label: 'Tổng',      value: stats.total,      color: 'text-slate-700',   bg: 'bg-slate-100' },
        { label: 'Chờ PV',    value: stats.waiting,    color: 'text-amber-700',   bg: 'bg-amber-50' },
        { label: 'Đã PV',     value: stats.done,       color: 'text-violet-700',  bg: 'bg-violet-50' },
        { label: 'Cân nhắc',  value: stats.considering,color: 'text-orange-700',  bg: 'bg-orange-50' },
        { label: 'Đạt',       value: stats.passed,     color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Không đạt', value: stats.failed,     color: 'text-red-700',     bg: 'bg-red-50' },
      ].map(s => (
        <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          <p className={`text-xs font-semibold ${s.color} opacity-70 mt-0.5`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Candidate Card ───────────────────────────────────────────────────────────
const CandidateCard = ({
  candidate, onEvaluate, onViewReport, evalData, onStatusChange, onDelete, user,
}: {
  candidate: Candidate;
  onEvaluate: (c: Candidate) => void;
  onViewReport: (c: Candidate) => void;
  evalData?: EvaluationData;
  onStatusChange: (candidate: Candidate, newStatus: string) => void;
  onDelete: (id: string) => void;
  user: any;
}) => {
  const statusCfg   = STATUS_CONFIG[candidate.status];
  const hasEvalData = !!evalData;

  const isAdmin = user?.role === 'Quản trị';
  const isHR = user?.role?.includes('Hành chính - Nhân sự');
  const isManager = user?.role?.includes('Trưởng phòng') || user?.role?.includes('Trưởng nhóm');
  const canModify = isAdmin || isHR;
  const canEvaluate = isAdmin || isHR || isManager;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
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
            <span className="text-slate-700">{candidate.interviewDate}</span>
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
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  appsScriptUrl: string;
  sheetCsvUrl: string;
  resultSheetCsvUrl: string;
  user: any;
}

type ModalMode = 'eval' | 'report' | 'add' | null;

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
  const [datePreset,       setDatePreset]       = useState<string>('Tất cả thời gian');
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
    if (!appsScriptUrl && !resultSheetCsvUrl) return;
    
    try {
      let sheetEvals: Record<string, EvaluationData & { _localTimestamp?: number }> = {};
      
      // 1. ƯU TIÊN: Thử lấy dữ liệu thời gian thực từ Apps Script API (không bị cache)
      if (appsScriptUrl) {
        try {
          const apiRes = await fetch(`${appsScriptUrl}?action=getEvaluations`);
          const apiData = await apiRes.json();
          
          if (Array.isArray(apiData)) {
            apiData.forEach(item => {
              const scoresObj: any = {};
              const notesObj: any = {};
              item.scores.forEach((s: any, i: number) => scoresObj[`c${i+1}`] = Number(s) || 0);
              item.notes.forEach((n: any, i: number) => notesObj[`c${i+1}`] = n || "");
              
              // Đảm bảo ID luôn là String để so khớp chính xác
              const cId = String(item.candidateId);
              sheetEvals[cId] = {
                scores: scoresObj,
                notes: notesObj,
                totalScore: Number(item.totalScore) || 0,
                strengths: item.strengths || "",
                weaknesses: item.weaknesses || "",
                decision: item.decision || "",
                salaryNote: item.salaryNote || "",
                submittedAt: item.submittedAt
              };
            });
          }
        } catch (apiErr) {
          console.warn("Apps Script API (GET) failed, falling back to CSV", apiErr);
        }
      }

      // 2. DỰ PHÒNG: Nếu API không trả về dữ liệu, dùng link CSV (có thể trễ 5-10p)
      if (Object.keys(sheetEvals).length === 0 && resultSheetCsvUrl) {
        const res = await fetch(resultSheetCsvUrl);
        const csv = await res.text();
        const rows = csv.trim().split('\n').slice(1);
        
        for (const row of rows) {
          const cols = parseCSVRow(row);
          const candidateId = cols[1]?.trim();
          if (!candidateId) continue;

          const scores: Record<string, number> = {};
          for (let i = 0; i < 12; i++) scores[`c${i + 1}`] = Number(cols[10 + i]) || 0;
          const notes: Record<string, string> = {};
          for (let i = 0; i < 12; i++) notes[`c${i + 1}`] = cols[22 + i]?.trim() || '';

          sheetEvals[candidateId] = {
            scores, notes,
            totalScore:  Number(cols[5]) || 0,
            strengths:   cols[6]?.trim() || '',
            weaknesses:  cols[7]?.trim() || '',
            decision:    cols[8]?.trim() || '',
            salaryNote:  cols[9]?.trim() || '',
            submittedAt: cols[0]?.trim() || new Date().toISOString(),
          };
        }
      }
      
      setEvaluations(prev => {
        const now = Date.now();
        // Nguồn tin cậy chính là dữ liệu từ Sheet
        const next = { ...sheetEvals };
        
        // Chỉ giữ lại các bản ghi cục bộ nếu chúng MỚI (dưới 1 phút) và CHƯA có trên Sheet
        Object.keys(prev).forEach(id => {
          const item = prev[id];
          if (item._localTimestamp && (now - item._localTimestamp < 60000) && !sheetEvals[id]) {
            next[id] = item;
          }
        });

        try { localStorage.setItem('sky_mobile_evaluations', JSON.stringify(next)); } catch {}
        return next;
      });
    } catch (err) { console.warn('Không thể tải đánh giá:', err); }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let parsed: Candidate[] = [];

      // 1. ƯU TIÊN: Apps Script API (Real-time)
      if (appsScriptUrl) {
        try {
          const apiRes = await fetch(`${appsScriptUrl}?action=getCandidates`);
          const apiData = await apiRes.json();
          if (Array.isArray(apiData)) {
            parsed = apiData.map((c: any) => ({ ...c, id: String(c.id) }));
          }
        } catch (e) {
          console.warn("Apps Script API (GET Candidates) failed", e);
        }
      }

      // 2. DỰ PHÒNG: CSV Link
      if (parsed.length === 0 && sheetCsvUrl) {
        const res  = await fetch(sheetCsvUrl);
        const csv  = await res.text();
        const rows = csv.trim().split('\n').slice(1);
        parsed = rows.map((row, i) => {
          const cols = parseCSVRow(row);
          return {
            id:            cols[0] || String(i + 1),
            name:          cols[1] || '',
            position:      cols[2] || '',
            interviewDate: cols[3] || '',
            interviewer:   cols[4] || '',
            status:        (cols[5] as Candidate['status']) || 'Chờ phỏng vấn',
            cvLink:        cols[6] || undefined,
            phone:         cols[7] || undefined,
            source:        cols[8] || undefined,
          };
        });
      }
      
      if (parsed.length > 0) {
        setCandidates(parsed);
        // Clear local cache if already on server
        setLocalAdded(prev => {
          const filtered = prev.filter(item => !parsed.some(c => c.id === item.data.id));
          if (filtered.length !== prev.length) {
            localStorage.setItem('sky_mobile_local_added_uv', JSON.stringify(filtered));
          }
          return filtered;
        });
      }
    } catch { setFetchError('Không thể tải dữ liệu.'); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchCandidates(); 
    fetchEvaluations();

    // Tự động lấy dữ liệu mỗi 10 phút
    const pollInterval = setInterval(() => {
      fetchCandidates();
      fetchEvaluations();
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

  const getPresetRange = (preset: string): [Date | null, Date | null] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset === 'Hôm nay') {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return [today, end];
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

  const finalFiltered = useMemo(() =>
    searchFiltered.filter(c => statusFilter === 'Tất cả' || c.status === statusFilter),
  [searchFiltered, statusFilter]);

  const openEval   = (c: Candidate) => { setSelectedCandidate(c); setModalMode('eval'); };
  const openReport = (c: Candidate) => { setSelectedCandidate(c); setModalMode('report'); };
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
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteCandidate', candidateId: id })
      });
    } catch (err) { console.error(err); }
  };

  const updateCandidateStatus = async (candidate: Candidate, newStatus: string) => {
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: newStatus as any } : c));
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', candidateId: candidate.id, status: newStatus })
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
              {sheetCsvUrl ? 'Dữ liệu từ Google Sheet' : 'Dữ liệu mẫu – kết nối Google Sheet để đồng bộ'}
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

        {!loading && <StatsBar candidates={searchFiltered} />}

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
                {['Tất cả thời gian', 'Hôm nay', 'Tuần này', 'Tháng này', 'Tùy chỉnh'].map(s => <option key={s} value={s}>{s}</option>)}
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

          <AnimatePresence>
            {datePreset === 'Tùy chỉnh' && (
              <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
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
              </motion.div>
            )}
          </AnimatePresence>
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
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                />
              ))}
            </motion.div>
          </AnimatePresence>
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
