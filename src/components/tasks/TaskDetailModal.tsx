import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckSquare, ArrowRight, Edit2, FileText, 
  UserPlus, Plus, MessageSquare, Send, Calendar, Check, CheckCircle2 
} from 'lucide-react';
import { useTaskDetail } from '../../hooks/useTaskDetail';

interface Task {
  id: number;
  title: string;
  description: string;
  assigner_email: string;
  assignees?: string[];
  status: string;
  due_date: string;
  created_at: string;
  result_handover?: string;
  report_url?: string;
  task_group?: string;
  progress?: number;
  parent_task_id?: number | null;
}

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  currentUser: any;
  users: any[];
  allTasks: Task[];
  onUpdateTask: (id: number, updates: any) => Promise<void>;
  onNavigateToTask: (task: Task) => void;
  onAddSubtask: (parentTaskId: number) => void;
  taskHistory: Task[];
  onPopHistory: (idx: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  currentUser,
  users,
  allTasks,
  onUpdateTask,
  onNavigateToTask,
  onAddSubtask,
  taskHistory,
  onPopHistory
}) => {
  const { 
    comments, 
    subtasks, 
    loadingComments, 
    newComment, 
    setNewComment, 
    addComment 
  } = useTaskDetail(task?.id || null, currentUser);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingAssignees, setIsEditingAssignees] = useState(false);

  if (!task) return null;

  const getUserName = (email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase())?.name || email;
  const getUserPic = (email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase())?.picture;
  const isAssigner = task.assigner_email === currentUser?.email || ['Quản trị', 'Quản lý'].includes(currentUser?.role);

  return (
    <AnimatePresence>
      {task && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-[1000px] h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 min-h-[64px]">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                {taskHistory.map((ancestorTask, idx) => (
                  <React.Fragment key={ancestorTask.id}>
                    <button
                      onClick={() => onPopHistory(idx)}
                      className="text-sm text-slate-400 hover:text-indigo-600 font-medium truncate max-w-[140px] transition-colors hover:underline underline-offset-2"
                      title={ancestorTask.title}
                    >
                      {ancestorTask.title}
                    </button>
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                  </React.Fragment>
                ))}
                <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]" title={task?.title}>
                  {task?.title}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0 ml-2"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Left side: Task Details */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-100 space-y-6 bg-slate-50/30">
                <div>
                  {task.parent_task_id && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Phần việc con của</span>
                      <button 
                        onClick={() => {
                          const parent = allTasks.find(t => t.id === task.parent_task_id);
                          if (parent) onNavigateToTask(parent);
                        }}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition-all"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        {allTasks.find(t => t.id === task.parent_task_id)?.title || 'Công việc cha'}
                      </button>
                    </div>
                  )}
                  
                  {isEditingTitle ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        autoFocus
                        className="flex-1 text-2xl font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent"
                        value={task.title}
                        onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{task.title}</h2>
                      {isAssigner && (
                        <button onClick={() => setIsEditingTitle(true)} className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const canEdit = task.assignees?.includes(currentUser?.email) || isAssigner;
                      const pct = task.progress || 0;
                      let currentVal = task.status;
                      if (task.status === 'Đang làm' && pct === 25) currentVal = 'done25';
                      else if (task.status === 'Đang làm' && pct === 50) currentVal = 'done50';
                      else if (task.status === 'Đang làm' && pct === 75) currentVal = 'done75';
                      else if (task.status === 'Hoàn thành') currentVal = 'done100';

                      const OPTION_MAP: Record<string, { label: string; status: string; progress: number; color: string }> = {
                        'Cần làm':   { label: 'Cần làm',         status: 'Cần làm',   progress: 0,   color: 'bg-slate-100 text-slate-700' },
                        'Đang làm':  { label: 'Đang làm',        status: 'Đang làm',  progress: 0,   color: 'bg-blue-50 text-blue-700' },
                        'Chờ duyệt': { label: 'Chờ duyệt',       status: 'Chờ duyệt', progress: pct, color: 'bg-amber-50 text-amber-700' },
                        'done25':    { label: 'Hoàn thành 25%',  status: 'Đang làm',  progress: 25,  color: 'bg-indigo-50 text-indigo-700' },
                        'done50':    { label: 'Hoàn thành 50%',  status: 'Đang làm',  progress: 50,  color: 'bg-indigo-50 text-indigo-700' },
                        'done75':    { label: 'Hoàn thành 75%',  status: 'Đang làm',  progress: 75,  color: 'bg-violet-50 text-violet-700' },
                        'done100':   { label: 'Hoàn thành 100%', status: 'Hoàn thành',progress: 100, color: 'bg-emerald-50 text-emerald-700' },
                      };
                      const current = OPTION_MAP[currentVal] || OPTION_MAP['Cần làm'];

                      return canEdit ? (
                        <select
                          value={currentVal}
                          onChange={(e) => {
                            const opt = OPTION_MAP[e.target.value];
                            if (opt) onUpdateTask(task.id, { status: opt.status, progress: opt.progress });
                          }}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer appearance-none bg-indigo-50 text-indigo-700"
                        >
                          {Object.entries(OPTION_MAP).map(([val, opt]) => (
                            <option key={val} value={val}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${current.color}`}>{current.label}</span>
                      );
                    })()}

                    {task.due_date && (
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.due_date).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Mô tả công việc
                    </h4>
                    {isAssigner && (
                      <button onClick={() => setIsEditingDesc(!isEditingDesc)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                        {isEditingDesc ? 'Xong' : 'Chỉnh sửa'}
                      </button>
                    )}
                  </div>
                  
                  {isEditingDesc ? (
                    <textarea
                      className="w-full h-32 p-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 outline-none text-sm text-slate-700 resize-none transition-all"
                      value={task.description}
                      onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
                      onBlur={() => setIsEditingDesc(false)}
                      placeholder="Thêm mô tả chi tiết..."
                    />
                  ) : (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-600 text-sm whitespace-pre-wrap min-h-[100px]" onClick={() => isAssigner && setIsEditingDesc(true)}>
                      {task.description || <span className="text-slate-400 italic">Chưa có mô tả.</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Người giao</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0">
                        {getUserPic(task.assigner_email) ? <img src={getUserPic(task.assigner_email)} alt="" className="w-full h-full object-cover" /> : getUserName(task.assigner_email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{getUserName(task.assigner_email)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người nhận</h4>
                      {isAssigner && (
                        <div className="relative">
                          <button onClick={() => setIsEditingAssignees(!isEditingAssignees)} className="p-1 text-indigo-600"><UserPlus className="w-4 h-4" /></button>
                          {isEditingAssignees && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 max-h-48 overflow-y-auto">
                              {users.filter(u => !task.assignees?.includes(u.email)).map(u => (
                                <button
                                  key={u.email}
                                  onClick={() => {
                                    const newAssignees = [...(task.assignees || []), u.email];
                                    onUpdateTask(task.id, { assignees: newAssignees });
                                  }}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                    {u.picture ? <img src={u.picture} className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{u.name}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-24 overflow-y-auto pr-2">
                      {task.assignees?.map(email => (
                        <div key={email} className="flex items-center gap-3 group/assignee">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shrink-0">
                            {getUserPic(email) ? <img src={getUserPic(email)} alt="" className="w-full h-full object-cover" /> : getUserName(email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{getUserName(email)}</p>
                          </div>
                          {isAssigner && (
                            <button 
                              onClick={() => {
                                const newAssignees = task.assignees?.filter(e => e !== email) || [];
                                onUpdateTask(task.id, { assignees: newAssignees });
                              }}
                              className="opacity-0 group-hover/assignee:opacity-100 p-1 text-slate-400 hover:text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                      Đầu việc con
                    </h4>
                    <button onClick={() => onAddSubtask(task.id)} className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {subtasks.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có đầu việc con.</p>}
                    {subtasks.map(sub => (
                      <div key={sub.id} onClick={() => onNavigateToTask(sub)} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-300 transition-colors cursor-pointer group">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${sub.status === 'Hoàn thành' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`flex-1 text-sm font-medium truncate ${sub.status === 'Hoàn thành' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Bàn giao kết quả
                  </h4>
                  <div className="space-y-3">
                    <textarea 
                      rows={3} 
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none"
                      value={task.result_handover || ''}
                      onChange={(e) => onUpdateTask(task.id, { result_handover: e.target.value })}
                      placeholder="Mô tả kết quả..."
                    />
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none"
                      value={task.report_url || ''}
                      onChange={(e) => onUpdateTask(task.id, { report_url: e.target.value })}
                      placeholder="URL báo cáo..."
                    />
                    
                    <div className="pt-4 flex flex-col gap-3">
                      {task.assignees?.includes(currentUser?.email) && task.status !== 'Hoàn thành' && task.status !== 'Chờ duyệt' && (
                        <button
                          onClick={() => {
                            const isSelf = task.assigner_email === currentUser?.email && task.assignees?.every(e => e === currentUser?.email);
                            onUpdateTask(task.id, { status: isSelf ? 'Hoàn thành' : 'Chờ duyệt' });
                          }}
                          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
                        >
                          {task.assigner_email === currentUser?.email ? 'Hoàn thành' : 'Gửi phê duyệt'}
                        </button>
                      )}
                      
                      {isAssigner && task.status === 'Chờ duyệt' && (
                        <div className="flex gap-3">
                          <button onClick={() => onUpdateTask(task.id, { status: 'Hoàn thành' })} className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">Phê duyệt</button>
                          <button onClick={() => onUpdateTask(task.id, { status: 'Đang làm' })} className="flex-1 px-4 py-3 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm">Yêu cầu lại</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Comments */}
              <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Thảo luận
                  </h4>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {loadingComments ? <div className="text-center text-slate-400">Đang tải...</div> : comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 mt-1">
                        {comment.user_picture ? <img src={comment.user_picture} className="w-full h-full object-cover" /> : (comment.user_name || comment.user_email).charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                          <p className="text-xs font-bold text-slate-900 mb-1">{comment.user_name || comment.user_email}</p>
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 ml-2">{new Date(comment.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); addComment(newComment); }} className="p-4 border-t border-slate-100 bg-slate-50">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Viết ghi chú..." 
                      className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 outline-none text-sm"
                    />
                    <button type="submit" disabled={!newComment.trim()} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center"><Send className="w-4 h-4" /></button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
