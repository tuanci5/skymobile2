import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useTeams = (email?: string) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = email ? `/api/teams?email=${email}` : '/api/teams';
      const data = await api.get(endpoint);
      setTeams(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const addTeam = async (teamData: any) => {
    const result = await api.post('/api/teams', teamData);
    await fetchTeams();
    return result;
  };

  const updateTeam = async (id: number, teamData: any) => {
    const result = await api.put(`/api/teams/${id}`, teamData);
    await fetchTeams();
    return result;
  };

  const deleteTeam = async (id: number) => {
    const result = await api.delete(`/api/teams/${id}`);
    await fetchTeams();
    return result;
  };

  return { teams, loading, error, refreshTeams: fetchTeams, addTeam, updateTeam, deleteTeam };
};
