import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import toast from 'react-hot-toast';

interface GenerateArticleParams {
  platform_id: number;
  country_id: number;
  theme_id: number;
  provider_type_id: number;
  language_code: string;
}

interface GenerateBulkParams {
  platform_id: number;
  countries: number[];
  themes: number[];
  provider_types: number[];
  languages: string[];
}

export function useGenerateArticle() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      const { data } = await api.post('/generate/article', params);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Article généré avec succès ! (${data.word_count} mots)`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    },
  });
}

export function useGenerateBulk() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateBulkParams) => {
      const { data } = await api.post('/generate/bulk', params);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.count} articles en cours de génération !`);
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    },
  });
}

export function useGenerationQueue() {
  const api = useApi();

  return useQuery({
    queryKey: ['generation-queue'],
    queryFn: async () => {
      const { data } = await api.get('/queue');
      return data;
    },
    refetchInterval: 5000, // Refresh toutes les 5 secondes
  });
}

export function useEstimateCost() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await api.post('/generate/estimate', params);
      return data;
    },
  });
}