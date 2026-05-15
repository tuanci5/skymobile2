import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  ArrowLeft, 
  Star, 
  Sparkles 
} from 'lucide-react';
import { TRAINING_GROUPS, CULTURE_PILLARS, CORE_VALUES, ONBOARDING_CONTENT } from '../data/trainingData';
import { LectureViewer } from '../components/LectureViewer';

interface TrainingPageProps {
  courseSlug?: string | null;
  lectureSlug?: string | null;
  lectureData?: any;
}

export const TrainingPage = ({ courseSlug, lectureSlug, lectureData }: TrainingPageProps) => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<any | null>(null);

  // Course Slug Mapping
  const COURSE_MAP: Record<string, string> = {
    'gioi-thieu': 'Giới thiệu công ty và mô hình doanh thu',
    'co-cau': 'Cơ cấu tổ chức & Vai trò các phòng ban',
    'noi-quy': 'Nội quy, quy trình báo cáo & bảo mật',
    'marketing-ai': 'AI trong tối ưu nội dung & Marketing',
    'sale-ai': 'Sử dụng AI hỗ trợ tư vấn & chốt đơn',
    'data-ai': 'Tự động hóa báo cáo & quản lý dữ liệu bằng AI',
  };

  useEffect(() => {
    if (lectureData) {
      setSelectedLecture(lectureData);
      setSelectedCourse(null);
    } else if (courseSlug && COURSE_MAP[courseSlug]) {
      setSelectedCourse(COURSE_MAP[courseSlug]);
      setSelectedLecture(null);
    } else {
      setSelectedCourse(null);
      setSelectedLecture(null);
    }
  }, [courseSlug, lectureData]);

  if (selectedLecture) {
    return (
      <LectureViewer 
        lecture={selectedLecture} 
        onBack={() => navigate('/training')} 
      />
    );
  }

  if (selectedCourse) {
    const data = ONBOARDING_CONTENT[selectedCourse];
    if (!data) {
      navigate('/training');
      return null;
    }

    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
        <button
          onClick={() => navigate('/training')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group font-medium"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách khóa học
        </button>

        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">Tài liệu đào tạo</p>
              <h2 className="text-3xl font-bold text-slate-900">{data.title}</h2>
            </div>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
            {data.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-6 shadow-sm">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          Hệ thống Đào tạo & Văn hoá
        </h2>
        <p className="text-slate-600 max-w-2xl text-lg relative">
          Mô hình <span className="font-bold text-slate-800">"Học để làm được – Đo bằng hiệu quả – Thưởng theo giá trị"</span>.
          Bám sát thực chiến từ Marketing, Sale, CSKH đến Kỹ thuật.
        </p>
      </div>

      {/* Section 1: Khung chương trình đào tạo */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h3 className="text-3xl font-bold text-slate-900">Khung chương trình Đào tạo</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_GROUPS.map((group) => (
            <div key={group.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl shadow-sm ${group.lightColor}`}>
                  {group.icon}
                </div>
                <div className="text-5xl font-black text-slate-100/60 drop-shadow-sm">{group.id}</div>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{group.title}</h4>
              <p className="text-slate-500 text-sm mb-6 pb-4 border-b border-slate-100 min-h-[40px]">{group.desc}</p>
              <ul className="space-y-3 flex-1">
                {group.courses.map((course, idx) => {
                  const hasContent = !!ONBOARDING_CONTENT[course];
                  
                  const lectureMap: Record<string, string> = {
                    'Tư duy trách nhiệm: Không đổ lỗi, không né việc': 'trach-nhiem',
                    'Văn hóa & Thái độ': 'van-hoa',
                    'Tác phong làm việc chuyên nghiệp, có checklist': 'tac-phong',
                  };
                  
                  const contentMap: Record<string, string> = {
                    'Giới thiệu công ty và mô hình doanh thu': 'gioi-thieu',
                    'Cơ cấu tổ chức & Vai trò các phòng ban': 'co-cau',
                    'Nội quy, quy trình báo cáo & bảo mật': 'noi-quy',
                    'AI trong tối ưu nội dung & Marketing': 'marketing-ai',
                    'Sử dụng AI hỗ trợ tư vấn & chốt đơn': 'sale-ai',
                    'Tự động hóa báo cáo & quản lý dữ liệu bằng AI': 'data-ai',
                  };

                  const lectureSlug = lectureMap[course];
                  const contentSlug = contentMap[course];
                  const isCultureGroup = group.id === 'E';

                  return (
                    <li
                      key={idx}
                      onClick={() => {
                        if (lectureSlug) {
                          navigate(`/training/lecture/${lectureSlug}`);
                        } else if (isCultureGroup) {
                          navigate(`/training/lecture/van-hoa`);
                        } else if (contentSlug) {
                          navigate(`/training/course/${contentSlug}`);
                        }
                      }}
                      className={`flex items-start gap-3 text-sm font-medium transition-all ${
                        (hasContent || isCultureGroup)
                          ? 'text-indigo-600 cursor-pointer hover:translate-x-1 hover:text-indigo-800'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                        (hasContent || isCultureGroup) ? 'bg-indigo-400 animate-pulse' : 'bg-blue-400'
                      }`} />
                      <span className="leading-snug underline-offset-4 hover:underline decoration-indigo-300">
                        {course}
                        {(hasContent || isCultureGroup) && (
                          <span className="ml-2 text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-500 font-bold uppercase tracking-wider">
                            Xem ngay
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Trụ cột Văn hoá */}
      <section className="py-4">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <Star className="w-8 h-8 text-amber-500" />
          <h3 className="text-3xl font-bold text-slate-900">6 Trụ cột Văn hoá Doanh nghiệp</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {CULTURE_PILLARS.map((pillar, i) => (
            <div key={i} className="flex items-start gap-5 p-6 bg-amber-50/60 rounded-3xl border border-amber-100 hover:bg-amber-50 hover:shadow-md hover:border-amber-200 transition-all">
              <div className="w-12 h-12 rounded-full bg-white text-amber-600 flex items-center justify-center font-bold shrink-0 text-xl shadow-sm border border-amber-100">
                {i + 1}
              </div>
              <div className="pt-1">
                <h4 className="font-bold text-slate-900 text-lg mb-2">{pillar.title}</h4>
                <p className="text-slate-600 leading-relaxed text-sm">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Giá trị cốt lõi */}
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden mt-12">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none hidden md:block">
          <Sparkles className="w-96 h-96 -translate-y-20 translate-x-10" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Bộ 5 Giá trị Cốt lõi</h3>
            <p className="text-slate-400 text-lg italic tracking-wide">"Đúng sản phẩm – Đúng quy trình – Đúng trách nhiệm – Đúng kết quả"</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {CORE_VALUES.map((val) => (
              <div key={val.id} className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm text-center hover:bg-white/10 transition-colors shadow-inner col-span-1">
                <div className="text-amber-400 font-black text-2xl mb-3 drop-shadow-md">{val.title}</div>
                <p className="text-slate-300 text-sm leading-snug">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
