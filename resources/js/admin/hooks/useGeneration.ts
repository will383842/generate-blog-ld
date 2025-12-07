import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { toast } from './useToast';
import type { ApiErrorResponse } from '@/types/common';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const generationKeys = {
  all: ['generation'] as const,
  queue: () => [...generationKeys.all, 'queue'] as const,
  articles: () => ['articles'] as const,
  stats: () => ['stats'] as const,
};

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

// Response types
interface GenerateArticleResponse {
  id: number;
  title: string;
  word_count: number;
  status: string;
}

interface GenerateBulkResponse {
  count: number;
  job_ids: number[];
}

interface GenerationQueueItem {
  id: number;
  article_id?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  created_at: string;
}

interface EstimateCostResponse {
  estimated_cost: number;
  estimated_tokens: number;
  article_count: number;
}

export function useGenerateArticle() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams): Promise<GenerateArticleResponse> => {
      const { data } = await api.post<GenerateArticleResponse>('/admin/generate/article', params);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Article généré avec succès ! (${data.word_count} mots)`);
      queryClient.invalidateQueries({ queryKey: generationKeys.articles() });
      queryClient.invalidateQueries({ queryKey: generationKeys.stats() });
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    },
  });
}

export function useGenerateBulk() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateBulkParams): Promise<GenerateBulkResponse> => {
      const { data } = await api.post<GenerateBulkResponse>('/admin/generate/bulk', params);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.count} articles en cours de génération !`);
      queryClient.invalidateQueries({ queryKey: generationKeys.queue() });
    },
    onError: (error: ApiErrorResponse) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    },
  });
}

export function useGenerationQueue() {
  const api = useApi();

  return useQuery<GenerationQueueItem[]>({
    queryKey: generationKeys.queue(),
    queryFn: async (): Promise<GenerationQueueItem[]> => {
      const { data } = await api.get<GenerationQueueItem[]>('/admin/queue');
      return data;
    },
    refetchInterval: 5000, // Refresh toutes les 5 secondes
  });
}

interface EstimateCostParams {
  platform_id?: number;
  countries?: number[];
  themes?: number[];
  provider_types?: number[];
  languages?: string[];
  count?: number;
}

export function useEstimateCost() {
  const api = useApi();

  return useMutation({
    mutationFn: async (params: EstimateCostParams): Promise<EstimateCostResponse> => {
      const { data } = await api.post<EstimateCostResponse>('/admin/generate/estimate', params);
      return data;
    },
  });
}