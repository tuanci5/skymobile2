import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, CheckCircle, AlertCircle, Clock, FileText, User, Briefcase, Send, Loader2, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationData {
  scores: Record<string, number>;
  notes: Record<string, string>;
  strengths: string;
  weaknesses: string;
  decision: string;
  salaryNote: string;
  totalScore: number;
  submittedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  interviewDate: string;
  interviewTime?: string;
  interviewer: string;
  status: 'Chờ phỏng vấn' | 'Đang phỏng vấn' | 'Đã phỏng vấn' | 'Cân nhắc (Vòng 2)' | 'Đạt' | 'Không đạt' | 'Đã nhận việc' | 'Đã nghỉ việc' | 'Không nhận việc';
  cvLink?: string;
  phone?: string;
  source?: string;
}

interface EvalCriteria {
  id: string;
  label: string;
  group: string;
}

const CRITERIA: EvalCriteria[] = [
  // I. Kiến thức & Chuyên môn
  { id: 'c1', label: 'Trình độ học vấn / Bằng cấp phù hợp', group: 'I' },
  { id: 'c2', label: 'Kiến thức chuyên môn về ngành/vị trí', group: 'I' },
  { id: 'c3', label: 'Kinh nghiệm làm việc thực tế', group: 'I' },
  { id: 'c4', label: 'Khả năng xử lý tình huống chuyên môn', group: 'I' },
  // II. Kỹ năng mềm
  { id: 'c5', label: 'Kỹ năng giao tiếp & Trình bày', group: 'II' },
  { id: 'c6', label: 'Kỹ năng làm việc nhóm / Độc lập', group: 'II' },
  { id: 'c7', label: 'Kỹ năng quản lý thời gian & Chịu áp lực', group: 'II' },
  { id: 'c8', label: 'Tư duy logic & Phân tích vấn đề', group: 'II' },
  // III. Thái độ & Phù hợp văn hóa
  { id: 'c9', label: 'Tác phong chuyên nghiệp, sự tự tin', group: 'III' },
  { id: 'c10', label: 'Mức độ quan tâm và nhiệt huyết với công việc', group: 'III' },
  { id: 'c11', label: 'Sự trung thực, thái độ cầu thị, ham học hỏi', group: 'III' },
  { id: 'c12', label: 'Mức độ phù hợp với văn hóa công ty', group: 'III' },
];

const GROUPS: Record<string, { title: string; color: string; bg: string; border: string }> = {
  I:   { title: 'Kiến thức & Chuyên môn',     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  II:  { title: 'Kỹ năng mềm',                color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  III: { title: 'Thái độ & Phù hợp văn hóa',  color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
};

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Kém',      color: 'bg-red-500' },
  2: { label: 'Yếu',      color: 'bg-orange-500' },
  3: { label: 'Trung bình', color: 'bg-yellow-500' },
  4: { label: 'Khá',      color: 'bg-blue-500' },
  5: { label: 'Xuất sắc', color: 'bg-emerald-500' },
};

const DECISION_OPTIONS = [
  { value: 'accept',    label: '✅ Đồng ý tuyển dụng',                          color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
  { value: 'consider',  label: '🤔 Cân nhắc thêm (Vòng 2 / Bài test)',         color: 'border-amber-400 bg-amber-50 text-amber-800' },
  { value: 'reject',    label: '❌ Không tuyển dụng / Lưu hồ sơ',              color: 'border-red-300 bg-red-50 text-red-800' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const ScoreButton: React.FC<{ value: number; selected: boolean; onChange: () => void }> = ({
  value, selected, onChange,
}) => {
  const info = SCORE_LABELS[value];
  return (
    <button
      type="button"
      onClick={onChange}
      title={`${value} – ${info.label}`}
      className={`
        w-9 h-9 rounded-full border-2 font-bold text-sm transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
        ${selected
          ? `${info.color} border-transparent text-white shadow-lg scale-110`
          : 'border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700 hover:scale-105'
        }
      `}
    >
      {value}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  candidate: Candidate | null;
  onClose: () => void;
  initialEvalData?: EvaluationData;
  onSubmitSuccess?: (candidateId: string, evalData: {
    scores: Record<string, number>;
    notes: Record<string, string>;
    strengths: string;
    weaknesses: string;
    decision: string;
    salaryNote: string;
    totalScore: number;
    submittedAt: string;
  }) => void;
  /** Google Apps Script Web App URL — để trống nếu chưa có */
  appsScriptUrl?: string;
}

export const CandidateEvalModal: React.FC<Props> = ({
  candidate,
  onClose,
  initialEvalData,
  onSubmitSuccess,
  appsScriptUrl,
}) => {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes]   = useState<Record<string, string>>({});
  const [strengths,  setStrengths]  = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [decision,   setDecision]   = useState('');
  const [salaryNote, setSalaryNote] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Load initial evaluation data on mount ──────────────────────────────────
  useEffect(() => {
    if (initialEvalData) {
      setScores(initialEvalData.scores || {});
      setNotes(initialEvalData.notes || {});
      setStrengths(initialEvalData.strengths || '');
      setWeaknesses(initialEvalData.weaknesses || '');
      setDecision(initialEvalData.decision || '');
      setSalaryNote(initialEvalData.salaryNote || '');
    }
  }, [initialEvalData]);

  // ── Load draft from localStorage when candidate changes ──────────────────────
  useEffect(() => {
    if (candidate && !initialEvalData) {
      const draft = localStorage.getItem(`draft_eval_${candidate.id}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setScores(parsed.scores || {});
          setNotes(parsed.notes || {});
          setStrengths(parsed.strengths || '');
          setWeaknesses(parsed.weaknesses || '');
          setDecision(parsed.decision || '');
          setSalaryNote(parsed.salaryNote || '');
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }
    }
  }, [candidate?.id, initialEvalData]);

  // ── Auto-save to localStorage every 60 seconds ───────────────────────────────
  useEffect(() => {
    if (!candidate) return;

    const interval = setInterval(() => {
      const draft = {
        scores,
        notes,
        strengths,
        weaknesses,
        decision,
        salaryNote,
        timestamp: Date.now(),
      };
      localStorage.setItem(`draft_eval_${candidate.id}`, JSON.stringify(draft));
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [scores, notes, strengths, weaknesses, decision, salaryNote, candidate]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalScore  = useMemo(
    () => (Object.values(scores) as number[]).reduce((a, b) => a + b, 0),
    [scores],
  );
  const maxScore    = CRITERIA.length * 5; // 60
  const scoredCount = Object.keys(scores).length;
  const pct         = Math.round((totalScore / maxScore) * 100);

  const scoreColor =
    pct >= 80 ? 'text-emerald-600' :
    pct >= 60 ? 'text-blue-600'    :
    pct >= 40 ? 'text-amber-600'   : 'text-red-600';

  const barColor =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-blue-500'    :
    pct >= 40 ? 'bg-amber-500'   : 'bg-red-500';

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleScore = (criteriaId: string, val: number) =>
    setScores(prev => ({ ...prev, [criteriaId]: val }));

  const handleNote = (criteriaId: string, val: string) =>
    setNotes(prev => ({ ...prev, [criteriaId]: val }));

  const handleSubmit = async () => {
    if (!decision) {
      setError('Vui lòng chọn đề xuất của người phỏng vấn.');
      return;
    }
    setError('');
    setSubmitting(true);

    const evalData = {
      totalScore,
      strengths,
      weaknesses,
      decision,
      salaryNote,
      scores: Object.fromEntries(CRITERIA.map(c => [c.id, scores[c.id] ?? 0])),
      notes: Object.fromEntries(CRITERIA.map(c => [c.id, notes[c.id] ?? ''])),
    };

    const payload = {
      action: 'saveEvaluation',
      candidate: {
        id: candidate!.id,
        name: candidate!.name,
        position: candidate!.position,
        status: candidate!.status,
      },
      evaluation: evalData,
    };

    try {
      if (appsScriptUrl) {
        await fetch('/api/evaluations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: candidate!.id,
            scores,
            notes,
            totalScore,
            strengths,
            weaknesses,
            decision,
            salaryNote,
            submittedAt: new Date().toISOString()
          })
        });
      } else {
        await new Promise(r => setTimeout(r, 1200));
        console.log('[MOCK] Evaluation payload:', payload);
      }
      const finalEvalData = {
        scores, notes, strengths, weaknesses, decision, salaryNote,
        totalScore,
        submittedAt: new Date().toISOString(),
      };
      setSubmitted(true);
      onSubmitSuccess?.(candidate!.id, finalEvalData);
    } catch (e) {
      setError('Có lỗi khi gửi dữ liệu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!candidate) return null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm py-6 px-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden my-auto"
        >
          {/* ── Header ── */}
          <div className="relative bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-6 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-blue-500/30 rounded-2xl border border-blue-400/30">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Phiếu Đánh Giá Ứng Viên</p>
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                <p className="text-blue-200 text-sm mt-1">{candidate.position}</p>
              </div>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-3 mt-5 relative z-10">
              {(() => {
                const formatDate = (dateStr: string) => {
                  if (!dateStr) return '—';
                  try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    return d.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', '');
                  } catch {
                    return dateStr;
                  }
                };

                return [
                  { icon: <Clock className="w-3.5 h-3.5" />, label: formatDate(candidate.interviewDate) },
                  { icon: <User className="w-3.5 h-3.5" />, label: candidate.interviewer },
                  { icon: <Briefcase className="w-3.5 h-3.5" />, label: candidate.position },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium border border-white/20">
                    {item.icon}<span>{item.label}</span>
                  </div>
                ));
              })()}
              {candidate.cvLink && (
                <a
                  href={candidate.cvLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/30 rounded-full text-xs font-bold border border-blue-400/40 hover:bg-blue-500/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /><span>Xem CV</span>
                </a>
              )}
            </div>
          </div>

          {/* ── Success State ── */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Đã ghi nhận đánh giá!</h3>
              <p className="text-slate-500 mb-2">Phiếu đánh giá cho <strong>{candidate.name}</strong> đã được lưu thành công.</p>
              <p className="text-slate-400 text-sm mb-8">Tổng điểm: <strong className="text-blue-600">{totalScore}/{maxScore}</strong></p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors"
              >
                Xem báo cáo đánh giá →
              </button>
            </div>
          ) : (
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[70vh]">

              {/* ── Score Summary Bar ── */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">Tổng điểm hiện tại</span>
                  <span className={`text-2xl font-black ${scoreColor}`}>
                    {totalScore} <span className="text-slate-400 text-base font-normal">/ {maxScore}</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                  <span>Đã chấm {scoredCount}/{CRITERIA.length} tiêu chí</span>
                  <span>{pct}%</span>
                </div>
              </div>

              {/* ── Scale Legend ── */}
              <div className="flex flex-wrap gap-2">
                {([1,2,3,4,5] as const).map(n => (
                  <div key={n} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <div className={`w-5 h-5 rounded-full ${SCORE_LABELS[n].color} text-white flex items-center justify-center font-bold text-[10px]`}>{n}</div>
                    <span>{SCORE_LABELS[n].label}</span>
                  </div>
                ))}
              </div>

              {/* ── Criteria Groups ── */}
              {Object.entries(GROUPS).map(([groupKey, groupMeta]) => {
                const groupCriteria = CRITERIA.filter(c => c.group === groupKey);
                return (
                  <div key={groupKey} className={`rounded-2xl border ${groupMeta.border} overflow-hidden`}>
                    <div className={`px-6 py-4 ${groupMeta.bg} border-b ${groupMeta.border}`}>
                      <h3 className={`font-bold text-sm uppercase tracking-wider ${groupMeta.color}`}>
                        {groupKey}. {groupMeta.title}
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupCriteria.map((criterion, idx) => {
                        const globalIdx = CRITERIA.findIndex(c => c.id === criterion.id) + 1;
                        return (
                          <div key={criterion.id} className="px-6 py-4 bg-white hover:bg-slate-50/50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1">
                                <span className="text-xs text-slate-400 font-bold mr-2">#{globalIdx}</span>
                                <span className="text-sm font-medium text-slate-700">{criterion.label}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {[1,2,3,4,5].map(val => (
                                  <ScoreButton
                                    key={val}
                                    value={val}
                                    selected={scores[criterion.id] === val}
                                    onChange={() => handleScore(criterion.id, val)}
                                  />
                                ))}
                                {scores[criterion.id] && (
                                  <span className="text-xs font-semibold text-slate-500 ml-1 w-16 text-right">
                                    {SCORE_LABELS[scores[criterion.id]].label}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Note input */}
                            <div className="mt-2">
                              <input
                                type="text"
                                placeholder="Ghi chú / Dẫn chứng (tuỳ chọn)"
                                value={notes[criterion.id] ?? ''}
                                onChange={e => handleNote(criterion.id, e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* ── Conclusion ── */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Tổng kết & Kết luận
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Điểm mạnh</label>
                    <textarea
                      rows={3}
                      placeholder="Nêu điểm mạnh nổi bật của ứng viên..."
                      value={strengths}
                      onChange={e => setStrengths(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-rose-300 font-bold uppercase tracking-wider mb-2">Điểm yếu / Cần lưu ý</label>
                    <textarea
                      rows={3}
                      placeholder="Nêu điểm yếu hoặc vấn đề cần cân nhắc..."
                      value={weaknesses}
                      onChange={e => setWeaknesses(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                    />
                  </div>
                </div>

                {/* Decision */}
                <div>
                  <label className="block text-xs text-amber-300 font-bold uppercase tracking-wider mb-3">Đề xuất của người phỏng vấn *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {DECISION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDecision(opt.value)}
                        className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 text-left ${
                          decision === opt.value
                            ? opt.color + ' scale-[1.02] shadow-lg'
                            : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salary suggestion */}
                <div>
                  <label className="block text-xs text-emerald-300 font-bold uppercase tracking-wider mb-2">Mức lương đề xuất (nếu có)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 12.000.000 – 15.000.000 VNĐ"
                    value={salaryNote}
                    onChange={e => setSalaryNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* ── Error ── */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </motion.div>
              )}

              {/* ── Actions ── */}
              <div className="flex flex-col sm:flex-row gap-3 pb-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Gửi đánh giá</>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
