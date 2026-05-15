import { useState, useEffect, useCallback } from 'react';
import { candidateService } from '../services/api';

export const useCandidates = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await candidateService.getAll();
      setCandidates(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const updateCandidateStatus = async (id: string, status: string) => {
    const result = await candidateService.updateStatus(id, status);
    await fetchCandidates();
    return result;
  };

  const deleteCandidate = async (id: string) => {
    const result = await candidateService.delete(id);
    await fetchCandidates();
    return result;
  };

  return { candidates, loading, error, refreshCandidates: fetchCandidates, updateCandidateStatus, deleteCandidate };
};
