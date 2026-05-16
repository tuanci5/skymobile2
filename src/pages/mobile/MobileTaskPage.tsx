import React, { useState } from 'react';
import { CheckSquare, Plus, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useTasks } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useTeams } from '../../hooks/useTeams';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';

const STATUS_COLORS: Record<string, string> = {
  'Cần làm': 'bg-slate-100 text-slate-700 border-slate-200',
  'Đang làm': 'bg-blue-50 text-blue-700 border-blue-200',
  'Chờ duyệt': 'bg-amber-50 text-amber-700 border-amber-200',
  'Hoàn thành': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const MobileTaskPage = ({ currentUser }: { currentUser: any }) => {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks(currentUser?.email, currentUser?.role);
  const { users } = useUsers();
  const { teams, addTeam, updateTeam, deleteTeam } = useTeams(currentUser?.email);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const assignableUsers = users.filter(u => u.email === currentUser.email || u.manager_email === currentUser.email);
  const assignableRoles = Array.from(new Set(assignableUsers.map(u => u.role))).filter(Boolean) as string[];
  const getUserName = (email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase())?.name || email;

  const filtered = tasks.filter(t => {
    if (t.parent_task_id) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const total = tasks.filter(t => !t.parent_task_id && t.status !== 'Đã xoá').length;
  const done = tasks.filter(t => !t.parent_task_id && t.status === 'Hoàn thành').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" /> Công việc
          </h1>
          <button onClick={() => setIsCreateOpen(true)} className="p-2.5 bg-indigo-600 text-white rounded-xl">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700">{done}/{total} hoàn thành</span>
              <span className="font-bold text-emerald-600">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        {/* Status filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[{ id: 'all', label: 'Tất cả' }, { id: 'Cần làm', label: 'Cần làm' }, { id: 'Đang làm', label: 'Đang làm' }, { id: 'Chờ duyệt', label: 'Chờ duyệt' }, { id: 'Hoàn thành', label: 'Xong' }].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full shrink-0 ${statusFilter === f.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="p-4 space-y-3">
        {loading ? <div className="text-center text-slate-400 py-10 text-sm">Đang tải...</div> : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-10"><CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Không có công việc</p></div>
        ) : filtered.map(task => (
          <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedTask(task)}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-800 line-clamp-2 flex-1">{task.title}</h4>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${STATUS_COLORS[task.status] || STATUS_COLORS['Cần làm']}`}>{task.status}</span>
            </div>
            {task.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>}
            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5">
                {task.assignees?.slice(0, 3).map((email: string) => (
                  <div key={email} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                    {getUserName(email).charAt(0)}
                  </div>
                ))}
              </div>
              {task.due_date && <div className="flex items-center gap-1 text-[10px] text-slate-400"><Calendar className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString('vi-VN')}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={async (data) => { await addTask(data); }}
        currentUser={currentUser} assignableUsers={assignableUsers} assignableRoles={assignableRoles} teams={teams} parentTaskId={null} />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} currentUser={currentUser} users={users} allTasks={tasks}
        onUpdateTask={async (id, updates) => { await updateTask(id.toString(), updates); setSelectedTask((p: any) => p ? { ...p, ...updates } : null); }}
        onNavigateToTask={(t) => setSelectedTask(t)} onAddSubtask={() => {}} taskHistory={[]} onPopHistory={() => {}} />
    </div>
  );
};
