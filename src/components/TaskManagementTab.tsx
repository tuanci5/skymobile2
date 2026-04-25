import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, Plus, Clock, AlertCircle, 
  CheckCircle2, ArrowRight, X, User as UserIcon,
  Calendar, GripVertical, Trash2, Send, MessageSquare, Users, Edit2, RotateCcw, Check
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  assigner_email: string;
  assignee_email?: string;
  assignees?: string[];
  status: string;
  due_date: string;
  created_at: string;
  result_handover?: string;
  report_url?: string;
  task_group?: string;
  progress?: number;
}

interface Team {
  id: number;
  name: string;
  members: string[];
}



interface User {
  email: string;
  name: string;
  role: string;
  picture?: string;
  manager_email?: string;
}

let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
if (API_BASE_URL === '/') API_BASE_URL = '';
else if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);

const COLUMNS = [
  { id: 'Cần làm', label: 'Cần làm', color: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  { id: 'Đang làm', label: 'Đang làm', color: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { id: 'Chờ duyệt', label: 'Chờ duyệt', color: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { id: 'Hoàn thành', label: 'Hoàn thành', color: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
];

export const TaskManagementTab = ({ currentUser }: { currentUser: any }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState({ name: '', members: [] as string[] });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [currentUser?.email || ''],
    due_date: '',
    status: 'Cần làm',
    task_group: ''
  });

  // Detail Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [parentTaskId, setParentTaskId] = useState<number | null>(null);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]); // navigation stack for subtask drill-down

  const fetchData = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      const [tasksRes, usersRes, teamsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks?email=${currentUser.email}&role=${currentUser.role}`),
        fetch(`${API_BASE_URL}/api/users`),
        fetch(`${API_BASE_URL}/api/teams?email=${currentUser.email}`)
      ]);
      
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Determine who the current user can assign tasks to
  // - Themselves
  // - Users who have manager_email === currentUser.email
  const assignableUsers = users.filter(
    u => u.email === currentUser.email || u.manager_email === currentUser.email
  );

  const assignableRoles = Array.from(new Set(assignableUsers.map(u => u.role))).filter(Boolean) as string[];

  const handleToggleAssignee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(email)
        ? prev.assignees.filter(e => e !== email)
        : [...prev.assignees, email]
    }));
  };

  const handleToggleRoleGroup = (role: string) => {
    const roleUsers = assignableUsers.filter(u => u.role === role).map(u => u.email);
    const allRoleUsersSelected = roleUsers.every(email => formData.assignees.includes(email));
    
    setFormData(prev => {
      let newAssignees = [...prev.assignees];
      if (allRoleUsersSelected) {
        newAssignees = newAssignees.filter(e => !roleUsers.includes(e));
      } else {
        roleUsers.forEach(email => {
          if (!newAssignees.includes(email)) newAssignees.push(email);
        });
      }
      return { ...prev, assignees: newAssignees };
    });
  };

  const handleToggleCustomTeamGroup = (teamMembers: string[], teamName: string) => {
    const allSelected = teamMembers.every(email => formData.assignees.includes(email));
    
    setFormData(prev => {
      let newAssignees = [...prev.assignees];
      if (allSelected) {
        newAssignees = newAssignees.filter(e => !teamMembers.includes(e));
      } else {
        teamMembers.forEach(email => {
          if (!newAssignees.includes(email)) newAssignees.push(email);
        });
      }
      return { ...prev, assignees: newAssignees, task_group: prev.task_group || teamName };
    });
  };

  const handleOpenTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamFormData({ name: team.name, members: team.members || [] });
    } else {
      setEditingTeam(null);
      setTeamFormData({ name: '', members: [] });
    }
  };

  const handleToggleTeamMember = (email: string) => {
    setTeamFormData(prev => ({
      ...prev,
      members: prev.members.includes(email) ? prev.members.filter(m => m !== email) : [...prev.members, email]
    }));
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTeam 
        ? `${API_BASE_URL}/api/teams/${editingTeam.id}`
        : `${API_BASE_URL}/api/teams`;
      const method = editingTeam ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamFormData, owner_email: currentUser.email })
      });

      if (res.ok) {
        setEditingTeam(null);
        setTeamFormData({ name: '', members: [] });
        fetchData();
      } else {
        alert('Có lỗi xảy ra khi lưu nhóm.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assigner_email: currentUser.email,
          parent_task_id: parentTaskId || null
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: '', description: '', assignees: [currentUser.email], due_date: '', status: 'Cần làm', task_group: '' });
        if (parentTaskId && selectedTask) {
          // Reload subtasks for the parent task
          fetchSubtasks(parentTaskId);
          setParentTaskId(null);
        } else {
          fetchData();
        }
      } else {
        alert('Có lỗi xảy ra khi tạo công việc.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: newStatus })
      });
    } catch (err) {
      console.error(err);
      fetchData(); // revert on failure
    }
  };

  const updateTaskDetails = async (taskId: number, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, ...updates })
      });
    } catch (err) {
      console.error(err);
      fetchData(); // revert on failure
    }
  };

  const deleteTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const canDelete = task.assigner_email === currentUser?.email || ['Quản trị', 'Quản lý'].includes(currentUser?.role);
    if (!canDelete) {
      alert('Chỉ người giao việc hoặc quản lý mới có quyền xóa công việc này.');
      return;
    }

    if (task.status === 'Đã xoá') {
      if (['Quản trị', 'Quản lý'].includes(currentUser?.role)) {
        if (!window.confirm('Bạn có chắc chắn muốn xóa VĨNH VIỄN công việc này? Hành động này không thể hoàn tác.')) return;
        try {
          const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, { method: 'DELETE' });
          if (res.ok) fetchData();
        } catch (err) {
          console.error(err);
        }
      } else {
        alert('Chỉ Quản lý hoặc Quản trị viên mới có quyền xóa vĩnh viễn công việc.');
      }
    } else {
      if (!window.confirm('Bạn có chắc chắn muốn chuyển công việc này vào thùng rác?')) return;
      updateTaskStatus(taskId, 'Đã xoá');
    }
  };

  const fetchComments = async (taskId: number) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/comments`);
      if (res.ok) setTaskComments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchSubtasks = async (taskId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/subtasks`);
      if (res.ok) setSubtasks(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: currentUser.email, content: newComment.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setTaskComments([...taskComments, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getUserName = (email: string) => users.find(u => u.email === email)?.name || email;
  const getUserPic = (email: string) => users.find(u => u.email === email)?.picture;

  const filteredTasks = tasks.filter(task => {
    if (employeeFilter !== 'all') {
      if (!task.assignees?.includes(employeeFilter)) return false;
    }
    
    if (timeFilter === 'all') return true;
    const date = new Date(task.created_at);
    const now = new Date();
    if (timeFilter === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (timeFilter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    }
    if (timeFilter === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'custom') {
      if (customStartDate && new Date(customStartDate) > date) return false;
      if (customEndDate) {
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < date) return false;
      }
      return true;
    }
    return true;
  });

  const activeColumns = ['Quản trị', 'Quản lý'].includes(currentUser?.role) && showDeleted
    ? [...COLUMNS, { id: 'Đã xoá', label: 'Đã xoá', color: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }]
    : COLUMNS;

  const handleColumnScroll = (e: React.UIEvent<HTMLDivElement>, colId: string) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 50;
    if (bottom) {
      setColumnLimits(prev => ({
        ...prev,
        [colId]: (prev[colId] || 10) + 10
      }));
    }
  };

  return (
    <div className="w-full space-y-4 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
            Quản lý Công việc
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1 hidden md:block">Theo dõi tiến độ, giao việc và cập nhật trạng thái.</p>
        </div>
        {/* Mobile action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="p-2.5 md:hidden bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            title="Quản lý nhóm"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Tạo công việc</span>
            <span className="sm:hidden">Tạo</span>
          </button>
        </div>
      </header>

      {/* Filters row — horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2 py-2 bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2 py-2 bg-white border border-slate-200 text-slate-700 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
        )}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm shrink-0"
        >
          <option value="all">Tất cả thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="custom">Tùy chỉnh...</option>
        </select>
        {['Quản trị', 'Quản lý'].includes(currentUser?.role) && (
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-sm shrink-0 max-w-[160px] truncate"
          >
            <option value="all">Tất cả nhân viên</option>
            {users.map(u => (
              <option key={`emp-filter-${u.email}`} value={u.email}>{u.name} - {u.role}</option>
            ))}
          </select>
        )}
        {/* Desktop-only team button */}
        <button
          onClick={() => setIsTeamModalOpen(true)}
          className="hidden md:flex px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all items-center gap-2 shadow-sm shrink-0"
        >
          <Users className="w-4 h-4" />
          Quản lý nhóm
        </button>
      </div>

      {/* Progress Summary */}
      {!loading && filteredTasks.length > 0 && (() => {
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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{todo}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">Cần làm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-700">{inProgress}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">Đang làm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-700">{pending}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">Chờ duyệt</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">{done}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">Hoàn thành</span>
                  </div>
                </div>
              </div>
              <span className={`text-2xl md:text-3xl font-black shrink-0 ${pct === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{pct}%</span>
            </div>
            <div className="relative h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Kanban Board */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 mb-6 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {activeColumns.map(col => (
          <div key={col.id} className="min-w-[220px] sm:min-w-[260px] xl:min-w-[280px] flex-1 flex flex-col snap-start">
            <div className={`px-3 md:px-4 py-2.5 md:py-3 rounded-t-2xl border-t border-x ${col.border} ${col.color} flex items-center justify-between`}>
              <h3 className={`font-bold text-sm md:text-base ${col.text}`}>{col.label}</h3>
              <span className={`text-xs px-2 py-1 rounded-full bg-white/50 font-bold ${col.text}`}>
                {filteredTasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div 
              onScroll={(e) => handleColumnScroll(e, col.id)}
              className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex-1 flex flex-col gap-3 h-[calc(100vh-220px)] overflow-y-auto"
            >
              {loading ? (
                <div className="text-center text-slate-400 py-8 text-sm">Đang tải...</div>
              ) : (
                filteredTasks.filter(t => t.status === col.id).slice(0, columnLimits[col.id] || 10).map(task => (
                  <motion.div 
                    layoutId={`task-${task.id}`}
                    key={task.id} 
                    onClick={() => { setSelectedTask(task); setSubtasks([]); fetchComments(task.id); fetchSubtasks(task.id); }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 line-clamp-2">{task.title}</h4>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {task.status === 'Đã xoá' && ['Quản trị', 'Quản lý'].includes(currentUser?.role) && (
                          <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'Cần làm'); }} className="text-slate-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Phục hồi công việc">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {(task.assigner_email === currentUser?.email || ['Quản trị', 'Quản lý'].includes(currentUser?.role)) && (
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title={task.status === 'Đã xoá' ? 'Xóa vĩnh viễn' : 'Xóa'}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {task.task_group && (
                      <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded mb-2">
                        {task.task_group}
                      </span>
                    )}
                    {task.description && (
                      <p className="text-sm text-slate-500 mb-4 line-clamp-3">{task.description}</p>
                    )}
                    
                    <div className="mt-4 space-y-2">
                      {/* Avatars row */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 flex-1">
                          {task.assignees?.slice(0, 3).map((email) => (
                            <div key={email} className="relative group/avatar">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white shadow-sm overflow-hidden z-[3] hover:z-[4] transition-all">
                                {getUserPic(email) ? (
                                  <img src={getUserPic(email)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getUserName(email).charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                Nhận: {getUserName(email)}
                              </div>
                            </div>
                          ))}
                          {(task.assignees?.length || 0) > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border-2 border-white shadow-sm z-[2]">
                              +{task.assignees!.length - 3}
                            </div>
                          )}
                        </div>
                        {task.assigner_email && (!task.assignees?.includes(task.assigner_email)) && (
                          <>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <div className="relative group/avatar">
                              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-white shadow-sm overflow-hidden">
                                {getUserPic(task.assigner_email) ? (
                                  <img src={getUserPic(task.assigner_email)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getUserName(task.assigner_email).charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                Giao bởi: {getUserName(task.assigner_email)}
                              </div>
                            </div>
                          </>
                        )}
                        {/* Due date — inline with avatars, shrinks properly */}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-1 rounded-md shrink-0 ml-auto">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="whitespace-nowrap">{new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Status Changer */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <select 
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const canComplete = task.assigner_email === currentUser?.email || ['Quản trị', 'Quản lý'].includes(currentUser?.role);
                          if (e.target.value === 'Hoàn thành' && !canComplete) {
                            alert("Vui lòng mở chi tiết công việc và chọn 'Gửi yêu cầu phê duyệt'.");
                            // Reset select value by forcing a re-render or letting React handle it since state won't change
                            e.target.value = task.status;
                            return;
                          }
                          updateTaskStatus(task.id, e.target.value);
                        }}
                        className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {COLUMNS.map(c => {
                          const isDoneOption = c.id === 'Hoàn thành';
                          const canComplete = task.assigner_email === currentUser?.email || ['Quản trị', 'Quản lý'].includes(currentUser?.role);
                          const isDisabled = isDoneOption && !canComplete;
                          
                          return (
                            <option key={c.id} value={c.id} disabled={isDisabled}>
                              Chuyển sang: {c.label} {isDisabled ? '(Cần phê duyệt)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </motion.div>
                ))
              )}
              {!loading && filteredTasks.filter(t => t.status === col.id).length > (columnLimits[col.id] || 10) && (
                <button 
                  onClick={() => setColumnLimits(prev => ({ ...prev, [col.id]: (prev[col.id] || 10) + 10 }))}
                  className="w-full py-3 mt-2 text-sm text-indigo-600 font-bold bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100 border-dashed shrink-0"
                >
                  Tải thêm công việc
                </button>
              )}
              {!loading && filteredTasks.filter(t => t.status === col.id).length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <CheckSquare className="w-8 h-8 mb-2 stroke-[1.5]" />
                  <span className="text-sm">Trống</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={`fixed inset-0 flex items-center justify-center p-4 ${parentTaskId ? 'z-[300]' : 'z-[100]'}`}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsModalOpen(false); setParentTaskId(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  {parentTaskId ? 'Tạo đầu việc con' : 'Giao việc mới'}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setParentTaskId(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <form onSubmit={handleSubmitTask} className="p-8 space-y-5">
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
                  <label className="text-sm font-bold text-slate-700">Ngày đến hạn</label>
                  <input type="date" className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setIsModalOpen(false); setParentTaskId(null); }} className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors">Hủy</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors">Tạo công việc</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Management Modal */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsTeamModalOpen(false); setEditingTeam(null); }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Quản lý nhóm làm việc
                </h3>
                <button onClick={() => { setIsTeamModalOpen(false); setEditingTeam(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                {/* Team List */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-slate-700">Danh sách nhóm</h4>
                  {teams.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Chưa có nhóm nào.</p>
                  ) : (
                    <div className="space-y-2">
                      {teams.map(team => (
                        <div key={team.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group">
                          <div>
                            <p className="font-bold text-sm text-slate-800">{team.name}</p>
                            <p className="text-xs text-slate-500">{team.members?.length || 0} thành viên</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenTeamModal(team)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team Form */}
                <form onSubmit={handleSubmitTeam} className="w-full md:w-1/2 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-slate-700">{editingTeam ? 'Sửa nhóm' : 'Tạo nhóm mới'}</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Tên nhóm</label>
                    <input required type="text" placeholder="VD: Dự án Alpha..." className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" value={teamFormData.name} onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
                    <label className="text-xs font-bold text-slate-500 flex justify-between">
                      Thành viên 
                      <span className="text-emerald-600 font-normal">{teamFormData.members.length} đã chọn</span>
                    </label>
                    <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-y-auto p-2 space-y-1 max-h-[300px]">
                      {users.map(u => (
                        <label key={u.email} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                          <input type="checkbox" checked={teamFormData.members.includes(u.email)} onChange={() => handleToggleTeamMember(u.email)} className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shrink-0">
                              {u.picture ? <img src={u.picture} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 truncate">{u.name}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    {editingTeam && (
                      <button type="button" onClick={() => handleOpenTeamModal()} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-white transition-colors">Hủy</button>
                    )}
                    <button type="submit" className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition-colors">{editingTeam ? 'Lưu' : 'Tạo mới'}</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 min-h-[64px]">
                <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                  <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                  {taskHistory.map((ancestorTask, idx) => (
                    <React.Fragment key={ancestorTask.id}>
                      <button
                        onClick={() => {
                          // Navigate back to this ancestor
                          const newHistory = taskHistory.slice(0, idx);
                          setTaskHistory(newHistory);
                          setSelectedTask(ancestorTask);
                          setSubtasks([]);
                          fetchComments(ancestorTask.id);
                          fetchSubtasks(ancestorTask.id);
                        }}
                        className="text-sm text-slate-400 hover:text-indigo-600 font-medium truncate max-w-[140px] transition-colors hover:underline underline-offset-2"
                        title={ancestorTask.title}
                      >
                        {ancestorTask.title}
                      </button>
                      <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                    </React.Fragment>
                  ))}
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]" title={selectedTask?.title}>
                    {selectedTask?.title}
                  </span>
                </div>
                <button onClick={() => { setSelectedTask(null); setTaskHistory([]); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0 ml-2"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                {/* Left side: Task Details */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-100 space-y-6 bg-slate-50/30">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedTask.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unified Status + Progress dropdown */}
                      {(() => {
                        const canEdit = selectedTask.assignees?.includes(currentUser?.email) || selectedTask.assigner_email === currentUser?.email || ['Quản trị', 'Quản lý'].includes(currentUser?.role);
                        // Determine current dropdown value
                        const pct = selectedTask.progress || 0;
                        let currentVal = selectedTask.status;
                        // Only map to doneX% if progress is exactly that value (not 0)
                        if (selectedTask.status === 'Đang làm' && pct === 25) currentVal = 'done25';
                        else if (selectedTask.status === 'Đang làm' && pct === 50) currentVal = 'done50';
                        else if (selectedTask.status === 'Đang làm' && pct === 75) currentVal = 'done75';
                        else if (selectedTask.status === 'Hoàn thành') currentVal = 'done100';
                        // else stays as the status string (Cần làm / Đang làm / Chờ duyệt)

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
                              if (!opt) return;
                              setSelectedTask({ ...selectedTask, status: opt.status, progress: opt.progress });
                              updateTaskDetails(selectedTask.id, { status: opt.status, progress: opt.progress });
                            }}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-400 appearance-none bg-indigo-50 text-indigo-700"
                            style={{ backgroundImage: 'none' }}
                          >
                            {Object.entries(OPTION_MAP).map(([val, opt]) => (
                              <option key={val} value={val}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${current.color}`}>
                            {current.label}
                          </span>
                        );
                      })()}

                      {selectedTask.due_date && (
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(selectedTask.due_date).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selectedTask.description && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Mô tả</h4>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-600 text-sm whitespace-pre-wrap">
                        {selectedTask.description}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Người giao</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden">
                          {getUserPic(selectedTask.assigner_email) ? (
                            <img src={getUserPic(selectedTask.assigner_email)} alt="" className="w-full h-full object-cover" />
                          ) : getUserName(selectedTask.assigner_email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{getUserName(selectedTask.assigner_email)}</p>
                          <p className="text-xs text-slate-500 truncate">{selectedTask.assigner_email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Người nhận ({selectedTask.assignees?.length || 0})</h4>
                      <div className="flex flex-col gap-2 max-h-24 overflow-y-auto pr-2">
                        {selectedTask.assignees?.map(email => (
                          <div key={email} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 overflow-hidden shrink-0">
                              {getUserPic(email) ? (
                                <img src={getUserPic(email)} alt="" className="w-full h-full object-cover" />
                              ) : getUserName(email).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{getUserName(email)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Đầu việc con */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                        Đầu việc con
                        {subtasks.length > 0 && (
                          <span className="text-xs text-slate-400 font-normal">
                            ({subtasks.filter(s => s.status === 'Hoàn thành').length}/{subtasks.length})
                          </span>
                        )}
                      </h4>
                      <button
                        onClick={() => {
                          setParentTaskId(selectedTask?.id || null);
                          setFormData({ title: '', description: '', assignees: [currentUser.email], due_date: '', status: 'Cần làm', task_group: '' });
                          setIsModalOpen(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"
                        title="Thêm đầu việc con"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Subtask list as compact task cards */}
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {subtasks.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2">Chưa có đầu việc con nào. Bấm dấu + để thêm.</p>
                      )}
                      {subtasks.map(sub => (
                        <div
                          key={sub.id}
                          onClick={() => {
                            // Navigate into subtask: push current task to history
                            setTaskHistory(h => [...h, selectedTask!]);
                            setSelectedTask(sub as Task);
                            setSubtasks([]);
                            fetchComments(sub.id);
                            fetchSubtasks(sub.id);
                          }}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40 group/sub transition-colors cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            sub.status === 'Hoàn thành' ? 'bg-emerald-500' :
                            sub.status === 'Chờ duyệt' ? 'bg-amber-400' :
                            sub.status === 'Đang làm' ? 'bg-blue-500' : 'bg-slate-300'
                          }`} />
                          <span className={`flex-1 text-sm font-medium truncate ${
                            sub.status === 'Hoàn thành' ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}>{sub.title}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {sub.assignees?.slice(0, 2).map((email: string) => (
                              <div key={email} className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600 overflow-hidden">
                                {getUserPic(email) ? <img src={getUserPic(email)} alt="" className="w-full h-full object-cover" /> : getUserName(email).charAt(0).toUpperCase()}
                              </div>
                            ))}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              sub.status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' :
                              sub.status === 'Chờ duyệt' ? 'bg-amber-50 text-amber-600' :
                              sub.status === 'Đang làm' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>{sub.status}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300 group-hover/sub:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bàn giao kết quả */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Bàn giao kết quả
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Nội dung bàn giao</label>
                        <textarea 
                          rows={3} 
                          placeholder="Mô tả kết quả công việc..." 
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                          value={selectedTask.result_handover || ''}
                          onChange={(e) => setSelectedTask({ ...selectedTask, result_handover: e.target.value })}
                          onBlur={(e) => updateTaskDetails(selectedTask.id, { result_handover: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">URL Báo cáo / Tài liệu (nếu có)</label>
                        <input 
                          type="text" 
                          placeholder="https://..." 
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                          value={selectedTask.report_url || ''}
                          onChange={(e) => setSelectedTask({ ...selectedTask, report_url: e.target.value })}
                          onBlur={(e) => updateTaskDetails(selectedTask.id, { report_url: e.target.value })}
                        />
                        {selectedTask.report_url && (
                          <a href={selectedTask.report_url.startsWith('http') ? selectedTask.report_url : `https://${selectedTask.report_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 inline-block truncate max-w-full">
                            Mở liên kết đính kèm &rarr;
                          </a>
                        )}
                      </div>

                      {/* Approval Actions */}
                      <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-3">
                        {selectedTask?.assignees?.includes(currentUser?.email) && selectedTask.status !== 'Hoàn thành' && selectedTask.status !== 'Chờ duyệt' && (() => {
                          // Self-assigned: assigner and all assignees include only the current user
                          const isSelfAssigned = selectedTask.assigner_email === currentUser?.email &&
                            selectedTask.assignees?.every(e => e === currentUser?.email);
                          return isSelfAssigned ? (
                            <button
                              onClick={() => {
                                updateTaskDetails(selectedTask.id, { status: 'Hoàn thành' });
                                setSelectedTask({ ...selectedTask, status: 'Hoàn thành' });
                              }}
                              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Hoàn thành
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                updateTaskDetails(selectedTask.id, { status: 'Chờ duyệt' });
                                setSelectedTask({ ...selectedTask, status: 'Chờ duyệt' });
                              }}
                              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Gửi yêu cầu phê duyệt
                            </button>
                          );
                        })()}

                        {(currentUser?.email === selectedTask?.assigner_email || ['Quản trị', 'Quản lý'].includes(currentUser?.role)) && selectedTask.status === 'Chờ duyệt' && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                updateTaskDetails(selectedTask.id, { status: 'Hoàn thành' });
                                setSelectedTask({ ...selectedTask, status: 'Hoàn thành' });
                              }}
                              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                            >
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => {
                                updateTaskDetails(selectedTask.id, { status: 'Đang làm' });
                                setSelectedTask({ ...selectedTask, status: 'Đang làm' });
                              }}
                              className="flex-1 px-4 py-3 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-200 transition-colors"
                            >
                              Yêu cầu làm lại
                            </button>
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
                      Ghi chú & Thảo luận
                    </h4>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loadingComments ? (
                      <div className="text-center text-slate-400 text-sm">Đang tải...</div>
                    ) : taskComments.length === 0 ? (
                      <div className="text-center text-slate-400 text-sm py-8">Chưa có ghi chú nào.</div>
                    ) : (
                      taskComments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden mt-1">
                            {comment.user_picture ? (
                              <img src={comment.user_picture} alt="" className="w-full h-full object-cover" />
                            ) : (comment.user_name || comment.user_email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                              <p className="text-xs font-bold text-slate-900 mb-1">{comment.user_name || comment.user_email}</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.content}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-2">
                              {new Date(comment.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết ghi chú..." 
                        className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                      />
                      <button 
                        type="submit" 
                        disabled={!newComment.trim()}
                        className="w-10 h-10 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
                      >
                        <Send className="w-4 h-4 -ml-0.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Deleted Toggle Button */}
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
