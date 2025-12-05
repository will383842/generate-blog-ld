import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import toast from 'react-hot-toast';

export function useLandings(filters = {}) {
  const api = useApi();

  return useQuery({
    queryKey: ['landings', filters],
    queryFn: async () => {
      const { data } = await api.get('/landings', { params: filters });
      return data;
    },
  });
}

export function useGenerateLanding() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await api.post('/landings/generate', params);
      return data;
    },
    onSuccess: () => {
      toast.success('Landing page générée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['landings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    },
  });
}