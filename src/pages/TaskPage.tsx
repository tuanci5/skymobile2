import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckSquare, Plus, Trash2, Users, LayoutList, Calendar, ArrowRight
} from 'lucide-react';

import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useTeams } from '../hooks/useTeams';

import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { TeamManagementModal } from '../components/tasks/TeamManagementModal';

import { TabType } from '../types';

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

const COLUMNS = [
  { id: 'Cần làm', label: 'Cần làm', color: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  { id: 'Đang làm', label: 'Đang làm', color: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { id: 'Chờ duyệt', label: 'Chờ duyệt', color: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { id: 'Hoàn thành', label: 'Hoàn thành', color: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
];

export const TaskPage = ({ currentUser }: { currentUser: any }) => {
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useTasks(currentUser?.email, currentUser?.role);
  const { users } = useUsers();
  const { teams, addTeam, updateTeam, deleteTeam } = useTeams(currentUser?.email);

  const [timeFilter, setTimeFilter] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [hideSubtasks, setHideSubtasks] = useState(true);
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [parentTaskId, setParentTaskId] = useState<number | null>(null);

  const assignableUsers = users.filter(u => u.email === currentUser.email || u.manager_email === currentUser.email);
  const assignableRoles = Array.from(new Set(assignableUsers.map(u => u.role))).filter(Boolean) as string[];

  const getUserName = (email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase())?.name || email;
  const getUserPic = (email: string) => users.find(u => u.email.toLowerCase() === email.toLowerCase())?.picture;

  const filteredTasks = tasks.filter(task => {
    if (employeeFilter !== 'all' && !task.assignees?.includes(employeeFilter)) return false;
    if (hideSubtasks && task.parent_task_id) return false;
    
    if (timeFilter === 'all') return true;
    const date = new Date(task.created_at);
    const now = new Date();
    if (timeFilter === 'today') return date.toDateString() === now.toDateString();
    if (timeFilter === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (timeFilter === 'custom' && customStartDate && customEndDate) {
      const d = new Date(date.toDateString());
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      return d >= s && d <= e;
    }
    
    return true;
  });

  const activeColumns = ['Quản trị', 'Quản lý'].includes(currentUser?.role) && showDeleted
    ? [...COLUMNS, { id: 'Đã xoá', label: 'Đã xoá', color: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }]
    : COLUMNS;

  const handleColumnScroll = (e: React.UIEvent<HTMLDivElement>, colId: string) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 50;
    if (bottom) {
      setColumnLimits(prev => ({ ...prev, [colId]: (prev[colId] || 10) + 10 }));
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-indigo-600" />
            Quản lý Công việc
          </h2>
          <p className="text-slate-500 text-sm mt-1">Theo dõi tiến độ, giao việc và cập nhật trạng thái.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsTeamModalOpen(true)} className="p-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Users className="w-5 h-5" />
          </button>
          <button onClick={() => { setParentTaskId(null); setIsCreateModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Plus className="w-5 h-5" />
            Tạo công việc
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs shadow-sm outline-none">
          <option value="all">Tất cả thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="month">Tháng này</option>
          <option value="custom">Tùy chỉnh</option>
        </select>
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
            <span className="text-slate-400">-</span>
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
          </div>
        )}
        {['Quản trị', 'Quản lý'].includes(currentUser?.role) && (
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs shadow-sm outline-none">
            <option value="all">Tất cả nhân viên</option>
            {users.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
          </select>
        )}
        <button onClick={() => setHideSubtasks(!hideSubtasks)} className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${hideSubtasks ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'}`}>
          <LayoutList className="w-4 h-4" />
          {hideSubtasks ? 'Chỉ việc chính' : 'Tất cả việc'}
        </button>
      </div>

      {!tasksLoading && filteredTasks.length > 0 && (() => {
        const total = filteredTasks.filter(t => t.status !== 'Đã xoá').length;
        const done = filteredTasks.filter(t => t.status === 'Hoàn thành').length;
        const inProgress = filteredTasks.filter(t => t.status === 'Đang làm').length;
        const pending = filteredTasks.filter(t => t.status === 'Chờ duyệt').length;
        const todo = filteredTasks.filter(t => t.status === 'Cần làm').length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black text-slate-900">{total}</div>
                  <div className="text-xs text-slate-500 font-medium">Tổng</div>
                </div>
                <div className="w-px h-7 bg-slate-200 hidden sm:block" />
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black text-emerald-600">{done}</div>
                  <div className="text-xs text-emerald-600/70 font-medium">Hoàn thành</div>
                </div>
                <div className="w-px h-7 bg-slate-200 hidden sm:block" />
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black text-blue-600">{inProgress}</div>
                  <div className="text-xs text-blue-600/70 font-medium">Đang làm</div>
                </div>
                <div className="w-px h-7 bg-slate-200 hidden sm:block" />
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black text-amber-600">{pending}</div>
                  <div className="text-xs text-amber-600/70 font-medium">Chờ duyệt</div>
                </div>
                <div className="w-px h-7 bg-slate-200 hidden sm:block" />
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black text-slate-600">{todo}</div>
                  <div className="text-xs text-slate-500 font-medium">Cần làm</div>
                </div>
              </div>
              <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">Tiến độ</div>
                  <div className="text-xs text-slate-500">{done}/{total} việc</div>
                </div>
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path strokeDasharray={`${pct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" className="transition-all duration-1000" />
                  </svg>
                  <span className="absolute text-xs font-bold text-emerald-700">{pct}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {activeColumns.map(col => (
          <div key={col.id} className="min-w-[300px] flex-1 flex flex-col">
            <div className={`px-4 py-3 rounded-t-2xl border-t border-x ${col.border} ${col.color} flex items-center justify-between`}>
              <h3 className={`font-bold text-sm ${col.text}`}>{col.label}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-white/50 font-bold ${col.text}`}>
                {filteredTasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <div 
              onScroll={(e) => handleColumnScroll(e, col.id)}
              className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex-1 flex flex-col gap-3 h-[calc(100vh-220px)] overflow-y-auto"
            >
              {tasksLoading ? <div className="text-center text-slate-400 py-10 text-sm">Đang tải...</div> : filteredTasks.filter(t => t.status === col.id).slice(0, columnLimits[col.id] || 10).map(task => (
                <motion.div 
                  layoutId={`task-${task.id}`}
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 line-clamp-2">{task.title}</h4>
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id.toString()); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {task.description && <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex -space-x-2">
                      {task.assignees?.slice(0, 3).map(email => (
                        <div key={email} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white overflow-hidden">
                          {getUserPic(email) ? <img src={getUserPic(email)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-600">{getUserName(email).charAt(0)}</div>}
                        </div>
                      ))}
                    </div>
                    {task.due_date && <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Calendar className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString('vi-VN')}</div>}
                  </div>
                </motion.div>
              ))}
              {!tasksLoading && filteredTasks.filter(t => t.status === col.id).length > (columnLimits[col.id] || 10) && (
                <button 
                  onClick={() => setColumnLimits(prev => ({ ...prev, [col.id]: (prev[col.id] || 10) + 10 }))}
                  className="w-full py-3 mt-2 text-sm text-indigo-600 font-bold bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100 border-dashed shrink-0"
                >
                  Tải thêm công việc
                </button>
              )}
              {!tasksLoading && filteredTasks.filter(t => t.status === col.id).length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <CheckSquare className="w-8 h-8 mb-2 stroke-[1.5]" />
                  <span className="text-sm">Trống</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={async (data) => { await addTask(data); }}
        currentUser={currentUser}
        assignableUsers={assignableUsers}
        assignableRoles={assignableRoles}
        teams={teams}
        parentTaskId={parentTaskId}
      />

      <TaskDetailModal 
        task={selectedTask}
        onClose={() => { setSelectedTask(null); setTaskHistory([]); }}
        currentUser={currentUser}
        users={users}
        allTasks={tasks}
        onUpdateTask={async (id, updates) => { await updateTask(id.toString(), updates); setSelectedTask(prev => prev ? {...prev, ...updates} : null); }}
        onNavigateToTask={(task) => { setTaskHistory(h => [...h, selectedTask!]); setSelectedTask(task); }}
        onAddSubtask={(parentId) => { setParentTaskId(parentId); setIsCreateModalOpen(true); }}
        taskHistory={taskHistory}
        onPopHistory={(idx) => { const newHistory = taskHistory.slice(0, idx); setTaskHistory(newHistory); setSelectedTask(taskHistory[idx]); }}
      />

      <TeamManagementModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)}
        teams={teams}
        users={users}
        currentUser={currentUser}
        onAddTeam={addTeam}
        onUpdateTeam={updateTeam}
        onDeleteTeam={deleteTeam}
      />

      {['Quản trị', 'Quản lý'].includes(currentUser?.role) && (
        <button 
          onClick={() => setShowDeleted(!showDeleted)}
          className={`fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full transition-all shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 ${showDeleted ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
          title={showDeleted ? 'Ẩn công việc đã xóa' : 'Hiển thị công việc đã xóa'}
        >
          <Trash2 className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
