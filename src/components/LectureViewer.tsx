import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, BookOpen, 
  CheckCircle2, Clock, Target, Lightbulb, 
  AlertCircle, MessageSquare, ArrowRight 
} from 'lucide-react';

interface LectureProps {
  lecture: any;
  onBack: () => void;
}

export const LectureViewer: React.FC<LectureProps> = ({ lecture, onBack }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  const currentSection = lecture.sections[currentSectionIdx];
  const totalSections = lecture.sections.length;

  const nextSection = () => {
    if (currentSectionIdx < totalSections - 1) {
      setCurrentSectionIdx(prev => prev + 1);
    }
  };

  const prevSection = () => {
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group font-medium"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Quay lại danh sách khóa học
      </button>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-slate-900 truncate">{lecture.title}</h3>
            </div>
            
            <div className="space-y-2">
              {lecture.sections.map((section: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSectionIdx(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentSectionIdx === idx 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{section.title}</span>
                    {currentSectionIdx === idx && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
                <Clock className="w-3 h-3" /> Thời lượng
              </div>
              <p className="text-slate-700 font-bold">{lecture.duration} phút</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 min-h-[600px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Phần {currentSectionIdx + 1} / {totalSections}
              </span>
            </div>

            <motion.div 
              key={currentSectionIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{currentSection.title}</h2>
              </div>

              <div className="space-y-10">
                {currentSection.content.map((item: any, idx: number) => (
                  <div key={idx} className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">{item.topic}</h4>
                      <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {item.time} phút
                      </span>
                    </div>

                    <div className="ml-11 space-y-4">
                      <ul className="grid md:grid-cols-2 gap-3">
                        {item.points.map((point: string, pIdx: number) => (
                          <li key={pIdx} className="flex items-start gap-3 text-slate-600 leading-relaxed text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:border-indigo-200 transition-colors">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>

                      {item.examples && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-800 italic">
                            {item.examples.map((ex: string, eIdx: number) => (
                              <p key={eIdx}>{ex}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-12 mt-12 border-t border-slate-100">
                <button
                  onClick={prevSection}
                  disabled={currentSectionIdx === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50 font-bold text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>
                <button
                  onClick={nextSection}
                  disabled={currentSectionIdx === totalSections - 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 font-bold text-sm shadow-lg shadow-indigo-200"
                >
                  Tiếp theo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
