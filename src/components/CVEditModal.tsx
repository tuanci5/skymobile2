import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Calendar, Mail, Phone, BookOpen, Briefcase, Code, AlertCircle, CheckCircle, Award, FileText, User, MessageSquare, Clock, Plus, Trash2, History } from 'lucide-react';
import { Candidate } from './CandidateEvalModal';

import { crmJD } from '../data/positions/crm/jd';
import { cskhLeadJD } from '../data/positions/cskh_lead/jd';
import { cskhStaffJD } from '../data/positions/cskh_staff/jd';
import { headJD } from '../data/positions/head/jd';
import { mktAdsJD } from '../data/positions/mkt_ads/jd';
import { mktContentJD } from '../data/positions/mkt_content/jd';
import { mktLeadJD } from '../data/positions/mkt_lead/jd';
import { mktMediaJD } from '../data/positions/mkt_media/jd';
import { opsJD } from '../data/positions/ops/jd';
import { saleLeadJD } from '../data/positions/sale_lead/jd';
import { saleStaffJD } from '../data/positions/sale_staff/jd';
import { telesaleJD } from '../data/positions/telesale/jd';
import { accountantJD } from '../data/positions/accountant/jd';
import { hrStaffJD } from '../data/positions/hr_staff/jd';
import { jpSupportAfterSalesJD } from '../data/positions/jp_support_after_sales/jd';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CVData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  education: string;
  experience: string;
  skills: string;
  certifications: string;
  languages: string;
  cvLink?: string;
  notes: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewer?: string;
  position?: string;
  status?: string;
  hrNotes?: Array<{ id: string; date: string; content: string }>;
  submittedAt?: string;
}

const POSITION_OPTIONS = [
  headJD.title,
  cskhLeadJD.title,
  mktLeadJD.title,
  saleLeadJD.title,
  crmJD.title,
  cskhStaffJD.title,
  mktAdsJD.title,
  mktContentJD.title,
  mktMediaJD.title,
  opsJD.title,
  saleStaffJD.title,
  telesaleJD.title,
  accountantJD.title,
  hrStaffJD.title,
  jpSupportAfterSalesJD.title
];

interface Props {
  candidate: Candidate | null;
  onClose: () => void;
  initialCVData?: CVData;
  onSubmitSuccess: (candidateId: string, cvData: CVData) => void;
  appsScriptUrl?: string; // Deprecated, kept for backward compatibility
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');


// ─── Main Component ───────────────────────────────────────────────────────────

export const CVEditModal: React.FC<Props> = ({
  candidate,
  onClose,
  initialCVData,
  onSubmitSuccess,
  appsScriptUrl,
}) => {
  if (!candidate) return null;

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('');
  const [cvLink, setCvLink] = useState('');
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('');
  const [hrNotes, setHrNotes] = useState<Array<{ id: string; date: string; content: string }>>([]);

  const STATUS_OPTIONS = [
    'Chờ phỏng vấn',
    'Đang phỏng vấn',
    'Đã phỏng vấn',
    'Cân nhắc (Vòng 2)',
    'Đạt',
    'Không đạt',
    'Đã nhận việc',
    'Đã nghỉ việc',
    'Không nhận việc'
  ];

  // UI state
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load initial CV data
  useEffect(() => {
    console.log('CVEditModal - Loading initial data:', { 
      candidateId: candidate?.id, 
      candidateName: candidate?.name,
      candidatePos: candidate?.position,
      hasInitialCVData: !!initialCVData,
      initialCVDataKeys: initialCVData ? Object.keys(initialCVData) : []
    });
    const fallbackPos = candidate?.position || '';
    const fallbackCv = candidate?.cvLink || '';
    const fallbackDate = candidate?.interviewDate || '';
    const fallbackTime = candidate?.interviewTime || '';
    const fallbackInterviewer = candidate?.interviewer || '';

    if (initialCVData && (initialCVData.fullName || initialCVData.position || initialCVData.cvLink)) {
      setFullName(initialCVData.fullName || candidate?.name || '');
      setEmail(initialCVData.email || '');
      setPhone(initialCVData.phone || candidate?.phone || '');
      setDateOfBirth(initialCVData.dateOfBirth || '');
      setAddress(initialCVData.address || '');
      setEducation(initialCVData.education || '');
      setExperience(initialCVData.experience || '');
      setSkills(initialCVData.skills || '');
      setCertifications(initialCVData.certifications || '');
      setLanguages(initialCVData.languages || '');
      setCvLink((initialCVData.cvLink || fallbackCv || '').trim());
      setNotes(initialCVData.notes || '');
      setInterviewDate(initialCVData.interviewDate || fallbackDate || '');
      setInterviewTime(initialCVData.interviewTime || fallbackTime || '');
      setInterviewer(initialCVData.interviewer || fallbackInterviewer || '');
      setPosition((initialCVData.position || fallbackPos || '').trim());
      setStatus(initialCVData.status || candidate?.status || '');
      
      // Handle hrNotes which might be a JSON string from the database
      let notes = initialCVData.hrNotes || [];
      if (typeof notes === 'string') {
        try {
          notes = JSON.parse(notes);
        } catch (e) {
          console.error('Failed to parse hrNotes string:', e);
          notes = [];
        }
      }
      setHrNotes(notes);
    } else if (candidate) {
      // Load draft from localStorage
      const draft = localStorage.getItem(`draft_cv_${candidate.id}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFullName(parsed.fullName || '');
          setEmail(parsed.email || '');
          setPhone(parsed.phone || '');
          setDateOfBirth(parsed.dateOfBirth || '');
          setAddress(parsed.address || '');
          setEducation(parsed.education || '');
          setExperience(parsed.experience || '');
          setSkills(parsed.skills || '');
          setCertifications(parsed.certifications || '');
          setLanguages(parsed.languages || '');
          setCvLink(parsed.cvLink || '');
          setNotes(parsed.notes || '');
          setInterviewDate(parsed.interviewDate || '');
          setInterviewTime(parsed.interviewTime || '');
          setInterviewer(parsed.interviewer || '');
          setPosition(parsed.position || '');
          setStatus(parsed.status || '');
          setHrNotes(parsed.hrNotes || []);
        } catch (e) {
          console.error('Failed to parse CV draft:', e);
        }
      } else {
        // Initialize with candidate data if available
        setFullName(candidate.name || '');
        setPhone(candidate.phone || '');
        setInterviewDate(candidate.interviewDate || '');
        setInterviewTime(candidate.interviewTime || '');
        setInterviewer(candidate.interviewer || '');
        setPosition((candidate.position || '').trim());
        setStatus(candidate.status || '');
        setCvLink((candidate.cvLink || '').trim());
        setHrNotes([]);
      }
    }
  }, [initialCVData, candidate?.id, candidate?.name, candidate?.phone, candidate?.interviewDate, candidate?.interviewTime, candidate?.interviewer, candidate?.position, candidate?.status, candidate?.cvLink]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!candidate) return;
    const interval = setInterval(() => {
      const cvDraft: CVData = {
        fullName,
        email,
        phone,
        dateOfBirth,
        address,
        education,
        experience,
        skills,
        certifications,
        languages,
        cvLink,
        notes,
        interviewDate,
        interviewTime,
        interviewer,
        position,
        status,
        hrNotes,
      };
      try {
        localStorage.setItem(`draft_cv_${candidate.id}`, JSON.stringify(cvDraft));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (e) {
        console.error('Failed to auto-save CV draft:', e);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, position, status, hrNotes, candidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const cvData: CVData = {
        fullName,
        email,
        phone,
        dateOfBirth,
        address,
        education,
        experience,
        skills,
        certifications,
        languages,
        cvLink,
        notes,
        interviewDate,
        interviewTime,
        interviewer,
        position,
        status,
        hrNotes,
        submittedAt: new Date().toISOString(),
      };

      // Save to local storage first
      try {
        const existing = localStorage.getItem('sky_mobile_cv_data');
        const cvStorage: Record<string, CVData> = existing ? JSON.parse(existing) : {};
        cvStorage[candidate.id] = cvData;
        localStorage.setItem('sky_mobile_cv_data', JSON.stringify(cvStorage));
        // Clear draft
        localStorage.removeItem(`draft_cv_${candidate.id}`);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }

      // Save to database via API
      try {
        const res = await fetch(`${API_BASE_URL}/api/cvs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: candidate.id,
            ...cvData
          })
        });

        if (!res.ok) {
          throw new Error('Failed to save CV to database');
        }
      } catch (e) {
        console.error('Failed to submit to database:', e);
        throw e;
      }

      setSubmitted(true);
      onSubmitSuccess(candidate.id, cvData);
      // Removed the redundant onClose() call here since onSubmitSuccess already calls closeModal()
      // which handles the modal unmounting safely.
    } catch (err) {
      console.error('Submit error:', err);
      setError((err as Error).message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const isModified =
    fullName !== (initialCVData?.fullName || candidate.name || '') ||
    email !== (initialCVData?.email || '') ||
    phone !== (initialCVData?.phone || candidate.phone || '') ||
    dateOfBirth !== (initialCVData?.dateOfBirth || '') ||
    address !== (initialCVData?.address || '') ||
    education !== (initialCVData?.education || '') ||
    experience !== (initialCVData?.experience || '') ||
    skills !== (initialCVData?.skills || '') ||
    certifications !== (initialCVData?.certifications || '') ||
    languages !== (initialCVData?.languages || '') ||
    cvLink !== (initialCVData?.cvLink || '') ||
    notes !== (initialCVData?.notes || '') ||
    interviewDate !== (initialCVData?.interviewDate || candidate?.interviewDate || '') ||
    interviewTime !== (initialCVData?.interviewTime || candidate?.interviewTime || '') ||
    interviewer !== (initialCVData?.interviewer || candidate?.interviewer || '') ||
    position !== (initialCVData?.position || candidate?.position || '') ||
    status !== (initialCVData?.status || candidate?.status || '') ||
    JSON.stringify(hrNotes) !== JSON.stringify(initialCVData?.hrNotes || []);

  // Field component
  const Field = ({
    icon: Icon,
    label,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    multiline = false,
    rows = 3,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
  }) => (
    <div className="flex gap-3 items-start">
      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-slate-400 mt-2.5">
        {Icon}
      </div>
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-700 resize-none transition-all"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-700 transition-all"
          />
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 400 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sửa thông tin CV</h2>
                <p className="text-xs text-slate-600 mt-0.5">{candidate.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saved' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 text-xs text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg"
                >
                  <CheckCircle className="w-3 h-3" />
                  Đã lưu
                </motion.div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-sm text-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Lưu thông tin CV thành công!</span>
              </motion.div>
            )}

            {/* Personal Information Section */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">📋 Thông tin cá nhân</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<User className="w-4 h-4" />}
                  label="Họ và tên"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Nhập họ và tên"
                />
                <Field
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="example@email.com"
                />
                <Field
                  icon={<Phone className="w-4 h-4" />}
                  label="Số điện thoại"
                  value={phone}
                  onChange={setPhone}
                  placeholder="0xxxxxxxxx"
                />
                <Field
                  icon={<Calendar className="w-4 h-4" />}
                  label="Ngày sinh"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  type="date"
                />
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 text-slate-400 mt-2.5">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vị trí ứng tuyển</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-700 transition-all appearance-none bg-white"
                    >
                      <option value="" disabled>-- Chọn vị trí --</option>
                      {POSITION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <Field
                icon={<Briefcase className="w-4 h-4" />}
                label="Địa chỉ"
                value={address}
                onChange={setAddress}
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">📅 Lịch phỏng vấn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<Calendar className="w-4 h-4" />}
                  label="Ngày phỏng vấn"
                  value={interviewDate}
                  onChange={setInterviewDate}
                  type="date"
                />
                <Field
                  icon={<Clock className="w-4 h-4" />}
                  label="Giờ phỏng vấn"
                  value={interviewTime}
                  onChange={setInterviewTime}
                  type="time"
                />
              </div>
              <Field
                icon={<User className="w-4 h-4" />}
                label="Người phỏng vấn"
                value={interviewer}
                onChange={setInterviewer}
                placeholder="Nhập tên người phỏng vấn"
              />
            </div>

            {/* Education & Experience Section */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">🎓 Học vấn & Kinh nghiệm</h3>
              <Field
                icon={<BookOpen className="w-4 h-4" />}
                label="Học vấn"
                value={education}
                onChange={setEducation}
                multiline
                rows={3}
                placeholder="VD: Đại học FPT, Chuyên ngành CNTT, 2018-2022"
              />
              <Field
                icon={<Briefcase className="w-4 h-4" />}
                label="Kinh nghiệm làm việc"
                value={experience}
                onChange={setExperience}
                multiline
                rows={4}
                placeholder="VD: Công ty ABC, Vị trí XYZ, 2022-2024\n- Mô tả công việc\n- Thành tích đạt được"
              />
            </div>

            {/* Skills Section */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">💡 Kỹ năng & Chứng chỉ</h3>
              <Field
                icon={<Code className="w-4 h-4" />}
                label="Kỹ năng"
                value={skills}
                onChange={setSkills}
                multiline
                rows={3}
                placeholder="VD: • Excel\n• SQL\n• JavaScript"
              />
              <Field
                icon={<Award className="w-4 h-4" />}
                label="Chứng chỉ & Giải thưởng"
                value={certifications}
                onChange={setCertifications}
                multiline
                rows={2}
                placeholder="VD: Chứng chỉ IELTS 7.0, Giải thưởng nhân viên xuất sắc 2023"
              />
              <Field
                icon={<Briefcase className="w-4 h-4" />}
                label="Ngôn ngữ"
                value={languages}
                onChange={setLanguages}
                placeholder="VD: Tiếng Anh (Thành thạo), Tiếng Pháp (Cơ bản)"
              />
            </div>

            {/* CV Link & Notes */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">📎 Tài liệu & Ghi chú</h3>
              <Field
                icon={<FileText className="w-4 h-4" />}
                label="Link CV"
                value={cvLink}
                onChange={setCvLink}
                type="url"
                placeholder="https://..."
              />
              <Field
                icon={<MessageSquare className="w-4 h-4" />}
                label="Ghi chú thêm"
                value={notes}
                onChange={setNotes}
                multiline
                rows={2}
                placeholder="Ghi chú về ứng viên, điểm đặc biệt..."
              />
            </div>

            {/* Recruitment Status Section */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Trạng thái tuyển dụng hiện tại
              </h3>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 flex items-center justify-center shrink-0 text-blue-400 mt-2.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-blue-600 mb-1.5">Chọn trạng thái mới</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-700 transition-all appearance-none font-medium shadow-sm"
                  >
                    <option value="" disabled>-- Chọn trạng thái --</option>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* HR Interaction History Section */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Lịch sử trao đổi với nhân sự
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const newNote = {
                      id: Date.now().toString(),
                      date: new Date().toISOString().split('T')[0],
                      content: '',
                    };
                    setHrNotes([...hrNotes, newNote]);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold"
                >
                  <Plus className="w-3 h-3" />
                  Thêm ghi chú
                </button>
              </div>

              {hrNotes.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                  Chưa có ghi chú trao đổi nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {hrNotes.map((note, index) => (
                    <div key={note.id} className="relative group p-3 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md">
                          Lần {index + 1} – {new Date(note.date).toLocaleDateString('vi-VN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setHrNotes(hrNotes.filter(n => n.id !== note.id))}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          title="Xóa ghi chú"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={note.content}
                        onChange={(e) => {
                          const updated = [...hrNotes];
                          updated[index].content = e.target.value;
                          setHrNotes(updated);
                        }}
                        placeholder="Nhập nội dung trao đổi..."
                        rows={2}
                        className="w-full text-sm text-slate-700 bg-transparent border-none focus:ring-0 resize-none p-0 placeholder:text-slate-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || !isModified}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                  submitting || !isModified
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu thông tin CV
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
