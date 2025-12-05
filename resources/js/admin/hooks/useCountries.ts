import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useCountries() {
  const api = useApi();

  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data } = await api.get('/countries');
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 heure (data statique)
  });
}

export function useCountry(id: number) {
  const api = useApi();

  return useQuery({
    queryKey: ['country', id],
    queryFn: async () => {
      const { data } = await api.get(`/countries/${id}`);
      return data;
    },
    enabled: !!id,
  });
}