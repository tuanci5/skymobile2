import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/api';

export const useUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = async (userData: any) => {
    const result = await userService.create(userData);
    await fetchUsers();
    return result;
  };

  const updateUser = async (email: string, userData: any) => {
    const result = await userService.update(email, userData);
    await fetchUsers();
    return result;
  };

  const deleteUser = async (email: string) => {
    const result = await userService.delete(email);
    await fetchUsers();
    return result;
  };

  return { users, loading, error, refreshUsers: fetchUsers, addUser, updateUser, deleteUser };
};
