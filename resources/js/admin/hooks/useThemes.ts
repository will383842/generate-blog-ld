import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useThemes() {
  const api = useApi();

  return useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get('/themes');
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}