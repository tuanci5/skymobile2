import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/api';

export const useTasks = (email: string, role: string) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getAll(email, role);
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, role]);

  useEffect(() => {
    if (email && role) {
      fetchTasks();
    }
  }, [fetchTasks, email, role]);

  const addTask = async (taskData: any) => {
    const result = await taskService.create(taskData);
    await fetchTasks();
    return result;
  };

  const updateTask = async (id: string, taskData: any) => {
    const result = await taskService.update(id, taskData);
    await fetchTasks();
    return result;
  };

  const deleteTask = async (id: string) => {
    const result = await taskService.delete(id);
    await fetchTasks();
    return result;
  };

  return { tasks, loading, error, refreshTasks: fetchTasks, addTask, updateTask, deleteTask };
};
