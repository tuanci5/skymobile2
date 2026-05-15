import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckSquare } from 'lucide-react';
import { useTaskForm } from '../../hooks/useTaskForm';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  currentUser: any;
  assignableUsers: any[];
  assignableRoles: string[];
  teams: any[];
  parentTaskId: number | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  assignableUsers,
  assignableRoles,
  teams,
  parentTaskId
}) => {
  const { 
    formData, 
    setFormData, 
    handleToggleAssignee, 
    handleToggleRoleGroup, 
    handleToggleCustomTeamGroup,
    resetForm
  } = useTaskForm(currentUser, assignableUsers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      assigner_email: currentUser?.email,
      parent_task_id: parentTaskId
    });
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 flex items-center justify-center p-4 ${parentTaskId ? 'z-[300]' : 'z-[100]'}`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                {parentTaskId ? 'Tạo đầu việc con' : 'Giao việc mới'}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tên công việc</label>
                  <input required type="text" placeholder="Vd: Chuẩn bị báo cáo doanh thu..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nhóm công việc (Dự án)</label>
                  <input type="text" placeholder="Vd: Marketing T4, Event..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={formData.task_group} onChange={e => setFormData({...formData, task_group: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mô tả chi tiết</label>
                <textarea rows={3} placeholder="Mô tả công việc cần làm..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex justify-between">
                  Người thực hiện
                  <span className="text-xs text-indigo-600 font-normal">{formData.assignees.length} người</span>
                </label>
                <div className="p-3 border border-slate-200 rounded-2xl max-h-40 overflow-y-auto space-y-3 bg-slate-50">
                  {(assignableRoles.length > 0 || teams.length > 0) && (
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
                      {assignableRoles.map(role => (
                        <button key={role} type="button" onClick={() => handleToggleRoleGroup(role)} className="px-2 py-1 text-[10px] bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
                          + Nhóm {role}
                        </button>
                      ))}
                      {teams.map(team => (
                        <button key={`team-${team.id}`} type="button" onClick={() => handleToggleCustomTeamGroup(team.members, team.name)} className="px-2 py-1 text-[10px] bg-emerald-50 text-emerald-700 rounded-lg font-bold hover:bg-emerald-100 transition-colors">
                          + Nhóm {team.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignableUsers.map(u => (
                      <label key={u.email} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors">
                        <input type="checkbox" checked={formData.assignees.includes(u.email)} onChange={() => handleToggleAssignee(u.email)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shrink-0">
                            {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{u.email === currentUser.email ? 'Chính mình' : u.name}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Hạn chót</label>
                <input type="date" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Hủy bỏ</button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Giao việc</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
