import { useState } from 'react';
import { isSameRoleGroup } from '../auth/roleUtils';

export const useTaskForm = (currentUser: any, assignableUsers: any[]) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [currentUser?.email || ''],
    due_date: '',
    status: 'Cần làm',
    task_group: ''
  });

  const handleToggleAssignee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(email)
        ? prev.assignees.filter(e => e !== email)
        : [...prev.assignees, email]
    }));
  };

  const handleToggleRoleGroup = (role: string) => {
    const roleUsers = assignableUsers.filter(u => isSameRoleGroup(u.role, role)).map(u => u.email);
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignees: [currentUser?.email || ''],
      due_date: '',
      status: 'Cần làm',
      task_group: ''
    });
  };

  return { 
    formData, 
    setFormData, 
    handleToggleAssignee, 
    handleToggleRoleGroup, 
    handleToggleCustomTeamGroup,
    resetForm
  };
};
