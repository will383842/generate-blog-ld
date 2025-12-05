import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useDashboardStats() {
  const api = useApi();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/dashboard');
      return data;
    },
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });
}

export function useCostStats(period = 'month') {
  const api = useApi();

  return useQuery({
    queryKey: ['cost-stats', period],
    queryFn: async () => {
      const { data } = await api.get('/stats/costs', { params: { period } });
      return data;
    },
  });
}

export function useProductionStats(period = 'month') {
  const api = useApi();

  return useQuery({
    queryKey: ['production-stats', period],
    queryFn: async () => {
      const { data } = await api.get('/stats/production', { params: { period } });
      return data;
    },
  });
}

export function useCoverageStats() {
  const api = useApi();

  return useQuery({
    queryKey: ['coverage-stats'],
    queryFn: async () => {
      const { data } = await api.get('/coverage/by-platform');
      return data;
    },
  });
}