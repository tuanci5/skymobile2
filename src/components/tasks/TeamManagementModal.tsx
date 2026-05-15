import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Edit2, Trash2 } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  members: string[];
}

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  users: any[];
  currentUser: any;
  onAddTeam: (data: any) => Promise<void>;
  onUpdateTeam: (id: number, data: any) => Promise<void>;
  onDeleteTeam: (id: number) => Promise<void>;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  teams,
  users,
  currentUser,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam
}) => {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState({ name: '', members: [] as string[] });

  const handleOpenTeamEdit = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamFormData({ name: team.name, members: team.members || [] });
    } else {
      setEditingTeam(null);
      setTeamFormData({ name: '', members: [] });
    }
  };

  const handleToggleMember = (email: string) => {
    setTeamFormData(prev => ({
      ...prev,
      members: prev.members.includes(email) ? prev.members.filter(m => m !== email) : [...prev.members, email]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      await onUpdateTeam(editingTeam.id, teamFormData);
    } else {
      await onAddTeam({ ...teamFormData, owner_email: currentUser.email });
    }
    handleOpenTeamEdit();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Quản lý nhóm làm việc
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
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
                          <button onClick={() => handleOpenTeamEdit(team)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDeleteTeam(team.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="w-full md:w-1/2 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-slate-700">{editingTeam ? 'Sửa nhóm' : 'Tạo nhóm mới'}</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Tên nhóm</label>
                  <input required type="text" placeholder="Tên nhóm..." className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm" value={teamFormData.name} onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} />
                </div>
                <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
                  <label className="text-xs font-bold text-slate-500">Thành viên ({teamFormData.members.length})</label>
                  <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-y-auto p-2 space-y-1">
                    {users.map(u => (
                      <label key={u.email} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={teamFormData.members.includes(u.email)} onChange={() => handleToggleMember(u.email)} className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingTeam && <button type="button" onClick={() => handleOpenTeamEdit()} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold">Hủy</button>}
                  <button type="submit" className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">{editingTeam ? 'Lưu' : 'Tạo mới'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
