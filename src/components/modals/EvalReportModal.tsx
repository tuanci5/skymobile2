import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Star, CheckCircle, XCircle, AlertCircle, ExternalLink,
  User, Calendar, Briefcase, Clock, FileText, Edit3, Printer,
  TrendingUp, Award, MessageSquare,
} from 'lucide-react';
import { Candidate } from './CandidateEvalModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationData {
  scores:     Record<string, number>;
  notes:      Record<string, string>;
  strengths:  string;
  weaknesses: string;
  decision:   string;
  salaryNote: string;
  totalScore: number;
  submittedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRITERIA_GROUPS = [
  {
    key: 'I',
    title: 'Kiến thức & Chuyên môn',
    color: 'blue',
    criteria: [
      { id: 'c1', label: 'Trình độ học vấn / Bằng cấp phù hợp' },
      { id: 'c2', label: 'Kiến thức chuyên môn về ngành/vị trí' },
      { id: 'c3', label: 'Kinh nghiệm làm việc thực tế' },
      { id: 'c4', label: 'Khả năng xử lý tình huống chuyên môn' },
    ],
  },
  {
    key: 'II',
    title: 'Kỹ năng mềm',
    color: 'emerald',
    criteria: [
      { id: 'c5', label: 'Kỹ năng giao tiếp & Trình bày' },
      { id: 'c6', label: 'Kỹ năng làm việc nhóm / Độc lập' },
      { id: 'c7', label: 'Kỹ năng quản lý thời gian & Chịu áp lực' },
      { id: 'c8', label: 'Tư duy logic & Phân tích vấn đề' },
    ],
  },
  {
    key: 'III',
    title: 'Thái độ & Phù hợp văn hóa',
    color: 'violet',
    criteria: [
      { id: 'c9',  label: 'Tác phong chuyên nghiệp, sự tự tin' },
      { id: 'c10', label: 'Mức độ quan tâm và nhiệt huyết với công việc' },
      { id: 'c11', label: 'Sự trung thực, thái độ cầu thị, ham học hỏi' },
      { id: 'c12', label: 'Mức độ phù hợp với văn hóa công ty' },
    ],
  },
];

const SCORE_LABELS: Record<number, string> = {
  1: 'Kém', 2: 'Yếu', 3: 'Trung bình', 4: 'Khá', 5: 'Xuất sắc',
};

const DECISION_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  accept: {
    label: 'Đồng ý tuyển dụng',
    icon: <CheckCircle className="w-5 h-5" />,
    bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600',
  },
  consider: {
    label: 'Cân nhắc thêm (Vòng 2 / Bài test)',
    icon: <AlertCircle className="w-5 h-5" />,
    bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600',
  },
  reject: {
    label: 'Không tuyển dụng / Lưu hồ sơ',
    icon: <XCircle className="w-5 h-5" />,
    bg: 'bg-red-500', text: 'text-white', border: 'border-red-600',
  },
};

const COLOR_MAP: Record<string, { bar: string; bg: string; text: string; border: string; light: string }> = {
  blue:    { bar: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    light: 'bg-blue-100' },
  emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-100' },
  violet:  { bar: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  light: 'bg-violet-100' },
};

// ─── Score dot ────────────────────────────────────────────────────────────────

const ScoreDot: React.FC<{ value: number; active: boolean }> = ({ value, active }) => {
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-emerald-500'];
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
      active
        ? `${colors[value]} text-white border-transparent shadow-md scale-110`
        : 'bg-slate-100 text-slate-300 border-slate-200'
    }`}>
      {value}
    </div>
  );
};

// ─── Overall score badge ──────────────────────────────────────────────────────

const getOverallRating = (pct: number) => {
  if (pct >= 85) return { label: 'Xuất sắc', color: 'text-emerald-400', ring: 'ring-emerald-500/30' };
  if (pct >= 70) return { label: 'Tốt',      color: 'text-blue-400',    ring: 'ring-blue-500/30' };
  if (pct >= 55) return { label: 'Khá',      color: 'text-amber-400',   ring: 'ring-amber-500/30' };
  if (pct >= 40) return { label: 'TB',        color: 'text-orange-400',  ring: 'ring-orange-500/30' };
  return            { label: 'Yếu',           color: 'text-red-400',     ring: 'ring-red-500/30' };
};

// ─── Group score bar ──────────────────────────────────────────────────────────

const GroupScoreBar: React.FC<{
  group: typeof CRITERIA_GROUPS[0];
  scores: Record<string, number>;
}> = ({
  group, scores,
}) => {
  const c = COLOR_MAP[group.color];
  const groupTotal = group.criteria.reduce((s, cr) => s + (scores[cr.id] ?? 0), 0);
  const groupMax   = group.criteria.length * 5;
  const pct        = Math.round((groupTotal / groupMax) * 100);

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
      {/* Group header */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${c.border}`}>
        <span className={`font-bold text-sm ${c.text}`}>{group.key}. {group.title}</span>
        <span className={`text-xs font-bold ${c.text}`}>{groupTotal}/{groupMax} điểm</span>
      </div>

      {/* Criteria rows */}
      <div className="divide-y divide-white/60">
        {group.criteria.map((cr, idx) => {
          const score = scores[cr.id] ?? 0;
          return (
            <div key={cr.id} className="px-5 py-3 bg-white/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-600 font-medium">
                  <span className="text-slate-400 mr-1">#{idx + (group.key === 'I' ? 1 : group.key === 'II' ? 5 : 9)}</span>
                  {cr.label}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>
                  {score > 0 ? `${score}/5 – ${SCORE_LABELS[score]}` : '—'}
                </span>
              </div>
              {/* Score bar */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / 5) * 100}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                    className={`h-full rounded-full ${c.bar}`}
                  />
                </div>
                <div className="flex gap-1 shrink-0">
                  {[1,2,3,4,5].map(v => <ScoreDot key={v} value={v} active={score === v} />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group total bar */}
      <div className={`px-5 py-3 flex items-center gap-3 border-t ${c.border}`}>
        <div className="flex-1 h-2 bg-white/80 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${c.bar}`}
          />
        </div>
        <span className={`text-xs font-bold ${c.text}`}>{pct}%</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  candidate: Candidate | null;
  evaluation: EvaluationData | null;
  onClose: () => void;
  onEdit: () => void;
}

export const EvalReportModal: React.FC<Props> = ({ candidate, evaluation, onClose, onEdit }) => {
  if (!candidate || !evaluation) return null;

  const { scores, notes, strengths, weaknesses, decision, salaryNote, totalScore, submittedAt } = evaluation;
  const maxScore = 60;
  const pct      = Math.round((totalScore / maxScore) * 100);
  const rating   = getOverallRating(pct);
  const decCfg   = DECISION_CONFIG[decision] ?? DECISION_CONFIG.consider;

  // Group subtotals for summary
  const groupTotals = CRITERIA_GROUPS.map(g => ({
    ...g,
    total: g.criteria.reduce((s, cr) => s + (scores[cr.id] ?? 0), 0),
    max:   g.criteria.length * 5,
  }));

  const handlePrint = () => window.print();

  return (
    <AnimatePresence>
      <motion.div
        key="report-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-sm py-6 px-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-auto"
        >
          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white overflow-hidden">
            {/* dot grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button onClick={handlePrint}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                title="In phiếu">
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/30 transition-colors text-sm font-bold">
                <Edit3 className="w-4 h-4" />
                Sửa đánh giá
              </button>
              <button onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pt-8 pb-6 relative z-10">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-blue-300" />
                <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">
                  Phiếu Đánh Giá Ứng Viên
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Candidate info */}
                <div className="flex-1">
                  <h2 className="text-3xl font-black mb-1">{candidate.name}</h2>
                  <p className="text-blue-200 font-medium mb-4">{candidate.position}</p>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { icon: <Calendar className="w-3.5 h-3.5" />, label: candidate.interviewDate },
                      { icon: <User className="w-3.5 h-3.5" />, label: candidate.interviewer },
                      { icon: <Clock className="w-3.5 h-3.5" />, label: `Đánh giá lúc ${new Date(submittedAt).toLocaleString('vi-VN')}` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium border border-white/20">
                        {item.icon}<span>{item.label}</span>
                      </div>
                    ))}
                    {candidate.cvLink && (
                      <a href={candidate.cvLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/30 rounded-full text-xs font-bold border border-blue-400/40 hover:bg-blue-500/50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /><span>Xem CV</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Score circle */}
                <div className={`shrink-0 w-36 h-36 rounded-full border-4 border-white/20 flex flex-col items-center justify-center ring-8 ${rating.ring} bg-white/5 backdrop-blur-sm`}>
                  <span className={`text-4xl font-black ${rating.color}`}>{totalScore}</span>
                  <span className="text-white/60 text-xs">/ {maxScore} điểm</span>
                  <span className={`text-sm font-bold mt-1 ${rating.color}`}>{rating.label}</span>
                </div>
              </div>

              {/* Group summary strip */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {groupTotals.map(g => {
                  const c = COLOR_MAP[g.color];
                  const gPct = Math.round((g.total / g.max) * 100);
                  return (
                    <div key={g.key} className="bg-white/10 rounded-xl p-3 border border-white/15">
                      <p className="text-white/60 text-[11px] font-semibold mb-1">{g.key}. {g.title}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${gPct}%` }} />
                        </div>
                        <span className="text-white text-xs font-bold">{g.total}/{g.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decision banner */}
            <div className={`px-8 py-4 ${decCfg.bg} flex items-center gap-3`}>
              {decCfg.icon}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Đề xuất của người phỏng vấn</p>
                <p className="font-bold text-lg leading-tight">{decCfg.label}</p>
              </div>
              {salaryNote && (
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Lương đề xuất</p>
                  <p className="font-bold">{salaryNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── BODY ───────────────────────────────────────────────────────── */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh]">

            {/* Score breakdown */}
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-blue-600" />
                Bảng điểm chi tiết
              </h3>
              <div className="space-y-4">
                {CRITERIA_GROUPS.map(group => (
                  <GroupScoreBar key={group.key} group={group} scores={scores} />
                ))}
              </div>
            </div>

            {/* Notes per criteria (only those filled) */}
            {Object.entries(notes).some(([, v]: [string, string]) => v.trim()) && (
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-slate-500" />
                  Ghi chú tiêu chí
                </h3>
                <div className="space-y-2">
                  {CRITERIA_GROUPS.flatMap(g => g.criteria).map((cr, globalIdx) => {
                    const note = notes[cr.id];
                    if (!note?.trim()) return null;
                    return (
                      <div key={cr.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                        <span className="text-slate-400 font-bold shrink-0">#{globalIdx + 1}</span>
                        <span className="text-slate-600 flex-1">{cr.label}</span>
                        <span className="text-slate-800 font-medium text-right max-w-[40%]">{note}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths / Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" /> Điểm mạnh
                </h4>
                <p className="text-emerald-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {strengths || <span className="italic text-emerald-500/60">Chưa ghi nhận</span>}
                </p>
              </div>
              <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4" /> Điểm yếu / Cần lưu ý
                </h4>
                <p className="text-red-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {weaknesses || <span className="italic text-red-500/60">Chưa ghi nhận</span>}
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                Đóng
              </button>
              <button onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                <Edit3 className="w-4 h-4" />
                Sửa / Cập nhật đánh giá
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
