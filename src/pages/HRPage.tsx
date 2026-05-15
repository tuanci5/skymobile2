import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Briefcase, 
  UserCog, 
  FileText, 
  CheckCircle2, 
  Zap, 
  Award, 
  DollarSign, 
  BarChart3, 
  PieChart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JD_DATA } from '../data/hrData';
import { TabType } from '../types';
import { InterviewPage as InterviewTab } from './InterviewPage';
import { RecruitmentPlanPage as RecruitmentPlanTab } from './RecruitmentPlanPage';

import { FILTER_DEPTS, DEPT_MAPPING } from '../data/appConstants';


interface HRPageProps {
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  setActiveTab: (tab: TabType) => void;
  restricted?: boolean;
  hrSubTab?: string;
  user: any;
}

export const HRPage = ({ selectedRole, setSelectedRole, setActiveTab, restricted, hrSubTab, user }: HRPageProps) => {
  const navigate = useNavigate();
  const currentSubTab = hrSubTab === 'interview' ? 'interview' : (hrSubTab === 'plan' ? 'plan' : 'jd');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const filteredRoles = Object.entries(JD_DATA).filter(([id]) => {
    if (selectedDept === 'all') return true;
    return DEPT_MAPPING[id] === selectedDept;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Interview sub-tab ── */}
      {currentSubTab === 'interview' && (
        <motion.div
          key="interview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <InterviewTab
            sheetCsvUrl={import.meta.env.VITE_SHEET_CSV_URL}
            appsScriptUrl={import.meta.env.VITE_APPS_SCRIPT_URL}
            resultSheetCsvUrl={import.meta.env.VITE_RESULT_SHEET_CSV_URL}
            user={user}
          />
        </motion.div>
      )}

      {/* ── Recruitment Plan sub-tab ── */}
      {currentSubTab === 'plan' && (
        <motion.div
          key="plan"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <RecruitmentPlanTab user={user} />
        </motion.div>
      )}

      {/* ── JD sub-tab ── */}
      {currentSubTab === 'jd' && (
        <motion.div
          key="jd"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <header className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Mô tả công việc (JD)</h2>
            <p className="text-slate-600 mt-2">Chi tiết nhiệm vụ, quyền hạn và KPI cho từng vị trí trong phòng ban.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* JD List */}
            {!restricted && (
              <div className="lg:col-span-1 space-y-4">
                <div className="relative">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 appearance-none shadow-sm"
                  >
                    {FILTER_DEPTS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                {/* Mobile: Horizontal Scroll Role List */}
                <div className="flex lg:hidden overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                  {filteredRoles.map(([id, jd]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedRole(id);
                        const detailsEl = document.getElementById('jd-details');
                        if (detailsEl) detailsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`min-w-[160px] max-w-[200px] flex-shrink-0 text-left p-4 rounded-2xl transition-all snap-start border-2 ${selectedRole === id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                        }`}
                    >
                      <div className={`p-2 rounded-lg w-fit mb-3 ${selectedRole === id ? 'bg-white/20' : 'bg-slate-50'}`}>
                        <Briefcase className={`w-4 h-4 ${selectedRole === id ? 'text-white' : 'text-blue-500'}`} />
                      </div>
                      <div className="text-xs font-bold leading-snug line-clamp-2 h-8 uppercase tracking-wider">{jd.title}</div>
                    </button>
                  ))}
                </div>

                {/* Desktop: Vertical Role List */}
                <div className="hidden lg:block space-y-2 h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {filteredRoles.length > 0 ? filteredRoles.map(([id, jd]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedRole(id)}
                      className={`w-full text-left px-5 py-4 rounded-2xl transition-all border-2 ${selectedRole === id
                        ? 'bg-blue-50 border-blue-600 shadow-sm text-blue-700 font-bold'
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedRole === id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="text-sm">{jd.title}</div>
                      </div>
                    </button>
                  )) : (
                    <div className="text-sm text-slate-400 text-center py-4">Chưa có vị trí nào</div>
                  )}
                </div>
              </div>
            )}

            {/* JD Detail */}
            <div className={restricted ? "lg:col-span-4" : "lg:col-span-3"} id="jd-details">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
                >
                  {!JD_DATA[selectedRole] ? (
                    <div className="py-20 text-center text-slate-400">
                      <div className="p-4 bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <UserCog className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Đang tải dữ liệu...</h3>
                      <p className="text-sm">Thông tin vị trí ({selectedRole}) đang được cập nhật hoặc không tồn tại.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0 mt-1">
                            <Briefcase className="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{JD_DATA[selectedRole].title}</h3>
                            <p className="text-slate-500 italic text-sm mt-2 leading-relaxed">
                              <span className="font-bold not-italic text-slate-700">Mục tiêu:</span> {JD_DATA[selectedRole].objective}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <section>
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                              <FileText className="w-5 h-5 text-blue-500" />
                              Nhiệm vụ chính
                            </h4>
                            <ul className="space-y-3">
                              {JD_DATA[selectedRole].tasks.map((task, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </section>

                          {JD_DATA[selectedRole].powers && (
                            <section>
                              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Quyền hạn
                              </h4>
                              <ul className="space-y-3">
                                {JD_DATA[selectedRole].powers?.map((power, i) => (
                                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                                    <span>{power}</span>
                                  </li>
                                ))}
                              </ul>
                            </section>
                          )}
                        </div>

                        <div className="space-y-6">
                          <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                              <Award className="w-5 h-5 text-indigo-500" />
                              Chỉ số đánh giá (KPI)
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {JD_DATA[selectedRole].kpis.map((kpi, i) => (
                                <div key={i} className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700">
                                  {kpi}
                                </div>
                              ))}
                            </div>
                          </section>

                          <div className="p-6 bg-blue-600 rounded-2xl text-white">
                            <h4 className="font-bold mb-2">Yêu cầu chung</h4>
                            <p className="text-sm text-blue-100 leading-relaxed">
                              Nắm chắc sản phẩm, phản hồi nhanh, giao tiếp khéo léo và luôn đặt lợi ích kết nối của khách hàng lên hàng đầu.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <section className="xl:col-span-2 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                              <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-900">Cơ cấu Thu nhập</h4>
                              <p className="text-sm text-slate-500">Thông tin lương được gắn trực tiếp với vị trí JD.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-white/80 rounded-2xl border border-white shadow-sm">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Mức lương khoảng</span>
                              <p className="mt-2 text-xl font-black text-slate-900">{JD_DATA[selectedRole].salaryRange}</p>
                            </div>
                            <div className="p-5 bg-white/80 rounded-2xl border border-white shadow-sm">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Lương cứng / Base</span>
                              <p className="mt-2 text-xl font-black text-emerald-600">{JD_DATA[selectedRole].baseSalary || 'Theo thỏa thuận'}</p>
                            </div>
                            <div className="md:col-span-2 p-5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
                              <span className="text-xs text-blue-100 font-bold uppercase tracking-wide">Cách thức tính</span>
                              <p className="mt-2 text-sm leading-relaxed font-medium">{JD_DATA[selectedRole].salaryCalculation}</p>
                            </div>
                          </div>
                        </section>

                        <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
                          <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-5">
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                            Trọng số KPI thưởng
                          </h4>
                          <div className="space-y-5">
                            {[
                              ['Chuyên môn / Hiệu suất', '40%', 'bg-blue-600', 'w-[40%]'],
                              ['Sale / Doanh thu mới', '40%', 'bg-emerald-600', 'w-[40%]'],
                              ['CSKH / Tỷ lệ gia hạn', '20%', 'bg-rose-600', 'w-[20%]']
                            ].map(([label, value, color, width]) => (
                              <div key={label}>
                                <div className="flex justify-between mb-2 text-sm">
                                  <span className="font-medium text-slate-700">{label}</span>
                                  <span className="font-black text-slate-900">{value}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${color} ${width}`} />
                                </div>
                              </div>
                            ))}
                            <p className="text-xs text-slate-400 italic pt-1">
                              * Trọng số có thể điều chỉnh theo chiến lược từng tháng.
                            </p>
                          </div>
                        </section>
                      </div>

                      <div className="mt-6 p-6 bg-slate-900 rounded-3xl text-white">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-blue-400" />
                          Công thức tính thu nhập
                        </h4>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-blue-400 font-mono text-xs mb-2">THU NHẬP TỔNG =</p>
                          <p className="text-sm md:text-base font-bold leading-relaxed">Lương cứng + Doanh số mới × %HH + Doanh số gia hạn × %Thưởng + Thưởng KPI</p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};