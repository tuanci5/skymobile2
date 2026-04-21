import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, FileText, Phone, Briefcase, Calendar, Link as LinkIcon, Usb, Clock } from 'lucide-react';
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (candidate: Candidate) => void;
  appsScriptUrl?: string; // Tích hợp gửi data về Google Sheet
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

export const AddCandidateModal: React.FC<Props> = ({ isOpen, onClose, onSubmitSuccess, appsScriptUrl }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    position: '',
    source: '',
    cvLink: '',
    interviewDate: '',
    interviewTime: '',
    interviewer: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newCandidate: Candidate = {
        id: 'UV' + Date.now().toString().slice(-6),
        name: formData.name,
        phone: formData.phone,
        position: formData.position,
        source: formData.source,
        cvLink: formData.cvLink,
        interviewDate: formData.interviewDate,
        interviewTime: formData.interviewTime,
        interviewer: formData.interviewer,
        status: 'Chờ phỏng vấn',
      };

      if (appsScriptUrl) {
        // Gửi data sang Node API
        fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCandidate),
        }).catch(err => console.warn('Lỗi khi lưu lên DB:', err));
      }

      // Giả lập độ trễ mạng
      await new Promise(r => setTimeout(r, 600));

      onSubmitSuccess(newCandidate);
      setFormData({ name: '', phone: '', position: '', source: '', cvLink: '', interviewDate: '', interviewTime: '', interviewer: '' });
      onClose();
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-blue-600 px-6 py-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Thêm mới ứng viên</h3>
                <p className="text-blue-200 text-sm">Nhập thông tin hồ sơ ứng viên</p>
              </div>
            </div>
            <button onClick={onClose} disabled={loading} title="Đóng" className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Cột 1 */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" /> Tên ứng viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    required name="name" value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" /> Số điện thoại
                  </label>
                  <input
                    name="phone" value={formData.phone} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" /> Nguồn ứng viên
                  </label>
                  <select
                    name="source" value={formData.source} onChange={handleChange}
                    title="Chọn nguồn ứng viên"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">-- Chọn nguồn --</option>
                    <option value="TopCV">TopCV</option>
                    <option value="VietnamWorks">VietnamWorks</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Tự nộp">Tự nộp</option>
                    <option value="Giới thiệu nội bộ">Giới thiệu nội bộ</option>
                  </select>
                </div>
              </div>

              {/* Cột 2 */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" /> Vị trí ứng tuyển <span className="text-red-500">*</span>
                  </label>
                  <select
                    required name="position" value={formData.position} onChange={handleChange}
                    title="Chọn vị trí ứng tuyển"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>-- Chọn vị trí --</option>
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-slate-400" /> Link CV (Google Drive/Canva...)
                  </label>
                  <input
                    type="url" name="cvLink" value={formData.cvLink} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" /> Ngày PV
                    </label>
                    <input
                      required type="date" name="interviewDate" value={formData.interviewDate} onChange={handleChange}
                      title="Ngày phỏng vấn"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> Giờ PV
                    </label>
                    <input
                      type="time" name="interviewTime" value={formData.interviewTime} onChange={handleChange}
                      title="Giờ phỏng vấn"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" /> Người PV
                  </label>
                  <input
                    required name="interviewer" value={formData.interviewer} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên ND"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Đang lưu...' : 'Lưu ứng viên'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
