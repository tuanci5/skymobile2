import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Target, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Trash2,
  Briefcase,
  TrendingUp,
  FileText,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JD_DATA } from '../data/hrData';

interface RecruitmentPlan {
  id: number;
  position: string;
  target_quantity: number;
  start_date: string;
  end_date: string;
  note: string;
  status: string;
  created_at: string;
}

interface Candidate {
  id: string;
  name: string;
  position: string;
  status: string;
  createdAt: string;
  phone?: string;
  interviewDate?: string;
  interviewTime?: string;
}

const formatPhone = (phone?: string) => {
  if (!phone) return '—';
  const cleanPhone = phone.toString().replace(/\s/g, '');
  if (cleanPhone.startsWith('0')) return cleanPhone;
  return '0' + cleanPhone;
};

interface Evaluation {
  decision: string;
  totalScore: number;
  notes: Record<string, string>;
  strengths: string;
  weaknesses: string;
  salaryNote?: string;
}

interface RecruitmentPlanTabProps {
  user: any;
}

export const RecruitmentPlanTab: React.FC<RecruitmentPlanTabProps> = ({ user }) => {
  const [plans, setPlans] = useState<RecruitmentPlan[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [cvData, setCvData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'week' | 'month' | 'range'>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [filterWeek, setFilterWeek] = useState<string>('');
  const [filterRange, setFilterRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });

  // Form state
  const [newPlan, setNewPlan] = useState({
    position: '',
    target_quantity: 1,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
    note: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, candidatesRes, evalsRes, cvsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/recruitment-plans`),
        fetch(`${API_BASE_URL}/api/candidates`),
        fetch(`${API_BASE_URL}/api/evaluations`),
        fetch(`${API_BASE_URL}/api/cvs`)
      ]);
      
      const [plansData, candidatesData, evalsData, cvsData] = await Promise.all([
        plansRes.json(),
        candidatesRes.json(),
        evalsRes.json(),
        cvsRes.json()
      ]);
      
      setPlans(plansData);
      setCandidates(candidatesData);
      setEvaluations(evalsData);
      setCvData(cvsData);
    } catch (error) {
      console.error('Error fetching recruitment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.position || newPlan.target_quantity <= 0) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/recruitment-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
      
      if (res.ok) {
        setNewPlan({ 
          position: '', 
          target_quantity: 1, 
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
          note: '' 
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding plan:', error);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kế hoạch này?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/recruitment-plans/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  // Helper to check if a date is within a week string (YYYY-Www)
  const isDateInWeek = (dateStr: string, weekStr: string) => {
    if (!weekStr) return true;
    const [year, week] = weekStr.split('-W').map(Number);
    const d = new Date(dateStr);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return d.getUTCFullYear() === year && weekNo === week;
  };

  // Report calculations
  const filteredCandidates = candidates.filter(c => {
    if (filterType === 'all') return true;
    if (!c.createdAt) return false;
    
    const candidateDate = c.createdAt.slice(0, 10);

    if (filterType === 'month') {
      return c.createdAt.startsWith(filterMonth);
    } else if (filterType === 'week') {
      return isDateInWeek(candidateDate, filterWeek);
    } else if (filterType === 'range') {
      return candidateDate >= filterRange.start && candidateDate <= filterRange.end;
    }
    return true;
  });

  const reportData = Object.keys(JD_DATA).map(posId => {
    const posTitle = JD_DATA[posId].title;
    const posCandidates = filteredCandidates.filter(c => c.position === posTitle || c.position === posId);
    
    const stats = {
      applied: posCandidates.length,
      interviewing: posCandidates.filter(c => c.status === 'Đang phỏng vấn' || c.status === 'Chờ phỏng vấn').length,
      hired: posCandidates.filter(c => c.status === 'Đã nhận việc' || c.status === 'Đạt').length,
      rejected: posCandidates.filter(c => c.status === 'Không đạt' || c.status === 'Không nhận việc').length
    };
    
    const plan = plans.find(p => p.position === posTitle || p.position === posId);
    const target = plan ? plan.target_quantity : 0;
    const progress = target > 0 ? Math.min(100, (stats.hired / target) * 100) : 0;

    return {
      id: posId,
      title: posTitle,
      stats,
      target,
      progress,
      hasPlan: !!plan
    };
  }).filter(item => item.hasPlan || item.stats.applied > 0);

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            Kế hoạch & Báo cáo tuyển dụng
          </h2>
          <p className="text-slate-600 mt-2">Quản lý mục tiêu tuyển dụng và theo dõi hiệu suất thực tế.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-lg">
          <div className="flex bg-slate-100 rounded-2xl p-1">
            {(['week', 'month', 'range'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  filterType === t 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'week' ? 'Tuần' : t === 'month' ? 'Tháng' : 'Khoảng ngày'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-2">
            {filterType === 'month' && (
              <input 
                type="month" 
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="px-4 py-1.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 outline-none"
              />
            )}
            {filterType === 'week' && (
              <input 
                type="week" 
                value={filterWeek}
                onChange={e => setFilterWeek(e.target.value)}
                className="px-4 py-1.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 outline-none"
              />
            )}
            {filterType === 'range' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={filterRange.start}
                  onChange={e => setFilterRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-700 outline-none"
                />
                <span className="text-slate-300 text-xs">—</span>
                <input 
                  type="date" 
                  value={filterRange.end}
                  onChange={e => setFilterRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-700 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Recruitment Plan Input Section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" />
          Thêm kế hoạch mới
        </h3>
        
        <form onSubmit={handleAddPlan} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vị trí</label>
            <select
              value={newPlan.position}
              onChange={e => setNewPlan({ ...newPlan, position: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            >
              <option value="">Chọn vị trí...</option>
              {Object.entries(JD_DATA).map(([id, jd]) => (
                <option key={id} value={jd.title}>{jd.title}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mục tiêu</label>
            <input
              type="number"
              min="1"
              value={newPlan.target_quantity}
              onChange={e => setNewPlan({ ...newPlan, target_quantity: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Từ ngày</label>
            <input
              type="date"
              value={newPlan.start_date}
              onChange={e => setNewPlan({ ...newPlan, start_date: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Đến ngày</label>
            <input
              type="date"
              value={newPlan.end_date}
              onChange={e => setNewPlan({ ...newPlan, end_date: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>
          
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Lưu
            </button>
          </div>

          <div className="md:col-span-6 mt-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ghi chú kế hoạch</label>
            <input
              type="text"
              value={newPlan.note}
              onChange={e => setNewPlan({ ...newPlan, note: e.target.value })}
              placeholder="Ví dụ: Cần gấp trong tháng 5, ưu tiên ứng viên có kinh nghiệm viễn thông"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </form>
      </section>

      {/* Unified Recruitment Dashboard Table */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Bảng theo dõi hiệu suất tuyển dụng tổng hợp
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Kế hoạch
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Đã đạt
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] w-64">Vị trí công việc</th>
                  <th className="px-4 py-5 font-bold uppercase tracking-wider text-[11px] text-center bg-slate-800">Mục tiêu</th>
                  <th className="px-4 py-5 font-bold uppercase tracking-wider text-[11px] text-center">Ứng tuyển</th>
                  <th className="px-4 py-5 font-bold uppercase tracking-wider text-[11px] text-center">Phòng vấn</th>
                  <th className="px-4 py-5 font-bold uppercase tracking-wider text-[11px] text-center">Đã nhận</th>
                  <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-center">Tiến độ (%)</th>
                  <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Thời gian & Ghi chú</th>
                  <th className="px-4 py-5 font-bold uppercase tracking-wider text-[11px] text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {reportData.map(item => {
                    const plan = plans.find(p => p.position === item.title || p.position === item.id);
                    return (
                      <motion.tr 
                        key={item.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900 leading-tight">{item.title}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">ID: {item.id}</div>
                        </td>
                        <td className="px-4 py-5 text-center font-black text-lg text-blue-600 bg-blue-50/20">
                          {item.target || <span className="text-slate-200 font-normal">0</span>}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs">{item.stats.applied}</span>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-bold text-xs">{item.stats.interviewing}</span>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold text-xs">{item.stats.hired}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5 w-32 mx-auto">
                            <div className="flex items-center justify-between text-[10px] font-black">
                              <span className={item.progress >= 100 ? 'text-emerald-600' : 'text-blue-600'}>
                                {item.progress.toFixed(0)}%
                              </span>
                              <span className="text-slate-400">{item.stats.hired}/{item.target || 0}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  item.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {plan ? (
                            <div className="space-y-1.5">
                              {(plan.start_date && plan.end_date) ? (
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold">
                                    {new Date(plan.start_date).toLocaleDateString('vi-VN')} - {new Date(plan.end_date).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">Chưa cập nhật thời hạn</div>
                              )}
                              
                              {plan.note ? (
                                <p className="text-xs text-slate-600 leading-relaxed max-w-[200px]">{plan.note}</p>
                              ) : (
                                <p className="text-[10px] text-slate-300 italic">Không có ghi chú</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Chưa lập kế hoạch</span>
                          )}
                        </td>
                        <td className="px-4 py-5 text-center">
                          {plan && (
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Xóa kế hoạch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {reportData.length === 0 && (
            <div className="py-24 text-center text-slate-300">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="text-lg font-medium">Chưa có dữ liệu tuyển dụng cho thời gian này</p>
            </div>
          )}
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 opacity-80" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Tổng ứng viên</span>
          </div>
          <div className="text-4xl font-black">{filteredCandidates.length}</div>
          <p className="text-xs text-blue-100 mt-2 italic">Dữ liệu theo bộ lọc thời gian hiện tại</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 opacity-80" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Đã tuyển dụng</span>
          </div>
          <div className="text-4xl font-black">
            {filteredCandidates.filter(c => c.status === 'Đã nhận việc' || c.status === 'Đạt').length}
          </div>
          <p className="text-xs text-emerald-100 mt-2 italic">Ứng viên đã đạt trạng thái "Đã nhận việc"</p>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 opacity-80" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Tỷ lệ chuyển đổi</span>
          </div>
          <div className="text-4xl font-black">
            {filteredCandidates.length > 0 
              ? ((filteredCandidates.filter(c => c.status === 'Đã nhận việc' || c.status === 'Đạt').length / filteredCandidates.length) * 100).toFixed(1)
              : 0}%
          </div>
          <p className="text-xs text-indigo-100 mt-2 italic">Hired / Filtered Applicants</p>
        </div>
      </div>

      {/* Detailed Candidate List Section */}
      <section className="pt-10 border-t border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-600" />
            Báo cáo chi tiết ứng viên
          </h3>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
            Tổng số: {filteredCandidates.length} ứng viên
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredCandidates.map((candidate, index) => {
              const evaluation = evaluations[candidate.id];
              const hrInfo = cvData[candidate.id];
              const isHired = candidate.status === 'Đã nhận việc' || candidate.status === 'Đạt';
              
              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all ${
                    isHired ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Column 1: Basic Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-black text-slate-900 truncate mb-3">{candidate.name}</h4>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500">
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                          <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-bold text-slate-700">{candidate.position}</span>
                        </span>
                        
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              Thời gian PV:
                            </span>
                            <span className="font-medium text-slate-600">
                              {candidate.interviewDate 
                                ? `${new Date(candidate.interviewDate).toLocaleDateString('vi-VN')}${candidate.interviewTime ? ` (${candidate.interviewTime})` : ''}`
                                : candidate.createdAt && candidate.createdAt !== 'Invalid Date'
                                  ? new Date(candidate.createdAt).toLocaleDateString('vi-VN')
                                  : '—'}
                            </span>
                          </span>
                        </span>
                        
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-600">{formatPhone(candidate.phone)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Evaluation Notes */}
                    <div className="flex-1 border-l border-slate-100 pl-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Đánh giá chuyên môn</span>
                      {evaluation ? (
                        <div className="space-y-2">
                          {evaluation.strengths && (
                            <p className="text-xs text-slate-600 line-clamp-2">
                              <span className="font-bold text-emerald-600">Ưu điểm:</span> {evaluation.strengths}
                            </p>
                          )}
                          {evaluation.weaknesses && (
                            <p className="text-xs text-slate-600 line-clamp-2">
                              <span className="font-bold text-amber-600">Hạn chế:</span> {evaluation.weaknesses}
                            </p>
                          )}
                          {!evaluation.strengths && !evaluation.weaknesses && (
                            <p className="text-xs text-slate-400 italic">Chưa có nhận xét chi tiết</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 italic">Chưa có dữ liệu phỏng vấn</p>
                      )}
                    </div>

                    {/* Column 3: HR Notes */}
                    <div className="flex-1 border-l border-slate-100 pl-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ghi chú nhân sự</span>
                      {hrInfo?.hrNotes ? (
                        <div className="space-y-1">
                          {Array.isArray(hrInfo.hrNotes) ? (
                            hrInfo.hrNotes.map((note: any, i: number) => (
                              <p key={i} className="text-xs text-slate-600 flex gap-2">
                                <span className="text-slate-300">•</span> {note.content || note}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-slate-600">{hrInfo.hrNotes}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 italic">Không có ghi chú HR</p>
                      )}
                    </div>

                    {/* Column 4: Status & Salary (Far Right) */}
                    <div className="flex flex-col items-center justify-start min-w-[140px] gap-3">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm text-center w-full ${
                        candidate.status === 'Đã nhận việc' ? 'bg-emerald-500 text-white' :
                        candidate.status === 'Đạt' ? 'bg-emerald-100 text-emerald-600' :
                        candidate.status === 'Không đạt' ? 'bg-red-100 text-red-600' :
                        candidate.status === 'Không nhận việc' ? 'bg-slate-800 text-white' :
                        candidate.status === 'Cân nhắc' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {candidate.status}
                      </span>
                      
                      {evaluation?.salaryNote && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-full text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mức lương</span>
                          <p className="text-[11px] font-bold text-slate-700 leading-tight">
                            {evaluation.salaryNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredCandidates.length === 0 && (
            <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">Không có ứng viên nào trong khoảng thời gian này</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
