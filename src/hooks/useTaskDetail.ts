import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/api';

export const useTaskDetail = (taskId: number | null, currentUser: any) => {
  const [comments, setComments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const data = await taskService.getComments(taskId.toString());
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [taskId]);

  const fetchSubtasks = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await taskService.getSubtasks(taskId.toString());
      setSubtasks(data);
    } catch (err) {
      console.error('Error fetching subtasks:', err);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchComments();
      fetchSubtasks();
    }
  }, [taskId, fetchComments, fetchSubtasks]);

  const addComment = async (content: string) => {
    if (!taskId || !content.trim()) return;
    try {
      const result = await taskService.addComment(taskId.toString(), currentUser.email, content.trim());
      setComments(prev => [...prev, result.comment]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  return {
    comments,
    subtasks,
    loadingComments,
    newComment,
    setNewComment,
    addComment,
    refreshSubtasks: fetchSubtasks,
    refreshComments: fetchComments
  };
};
