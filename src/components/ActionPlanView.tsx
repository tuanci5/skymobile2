import React from 'react';
import { motion } from 'motion/react';
import { Clock, Rocket, TrendingUp } from 'lucide-react';
import { ACTION_PLAN_4_MONTHS } from '../data/actionPlanData';

export const ActionPlanView = () => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {ACTION_PLAN_4_MONTHS.map((plan, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col h-full"
          >
            {/* Month Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300">
              <div className={`p-6 text-white relative overflow-hidden ${idx === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' :
                idx === 1 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
                  idx === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-indigo-700 to-purple-800'
                }`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                  {idx === 0 ? <Clock className="w-24 h-24" /> : <Rocket className="w-24 h-24" />}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold tracking-widest uppercase opacity-80">{plan.label}</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase">{plan.phase}</span>
                  </div>
                  <h3 className="text-2xl font-black">{plan.month}</h3>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-6">
                <p className="text-slate-500 text-sm italic leading-relaxed">
                  "{plan.description}"
                </p>

                <div className="space-y-6">
                  {Object.entries(plan.actions).map(([key, action], aIdx) => (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${action.color}`}>
                          {React.cloneElement(action.icon as React.ReactElement, { className: 'w-4 h-4' })}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{action.title}</h4>
                      </div>
                      <ul className="space-y-2 ml-1">
                        {action.items.map((item, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2 text-[13px] text-slate-600 leading-tight">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <TrendingUp className="w-64 h-64 translate-x-20 -translate-y-20" />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Thời gian áp dụng</p>
            <p className="text-2xl font-bold">16/04 - 31/07</p>
            <p className="text-slate-400 text-sm">Giai đoạn kiến tạo nền móng</p>
          </div>
          <div className="space-y-2">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Mục tiêu Quy mô</p>
            <p className="text-2xl font-bold">10 Team full-stack</p>
            <p className="text-slate-400 text-sm">50+ nhân sự được đào tạo chuẩn</p>
          </div>
          <div className="space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Sản phẩm trọng tâm</p>
            <p className="text-2xl font-bold">SIM Data & Pocket WiFi</p>
            <p className="text-slate-400 text-sm">Thị trường người Việt tại Nhật</p>
          </div>
          <div className="space-y-2">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-widest">Cam kết văn hóa</p>
            <p className="text-2xl font-bold">Hiệu quả & Tận tâm</p>
            <p className="text-slate-400 text-sm">Đo lường bằng sự hài lòng khách</p>
          </div>
        </div>
      </div>
    </div>
  );
};
