import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import toast from 'react-hot-toast';

interface ArticleFilters {
  platform_id?: number;
  country_id?: number;
  theme_id?: number;
  language_code?: string;
  status?: 'draft' | 'published' | 'archived';
  page?: number;
  per_page?: number;
}



export function useArticles(filters: ArticleFilters = {}) {
  const api = useApi();

  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      const { data } = await api.get('/articles', { params: filters });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useArticle(id: number) {
  const api = useApi();

  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const { data } = await api.get(`/articles/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: any) => {
      const { data } = await api.post('/articles', params);
      return data;
    },
    onSuccess: () => {
      toast.success('Article créé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });
}

export function useUpdateArticle() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: any) => {
      const { data } = await api.put(`/articles/${id}`, params);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Article mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
}

export function useDeleteArticle() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/articles/${id}`);
    },
    onSuccess: () => {
      toast.success('Article supprimé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });
}

export function usePublishArticle() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/articles/${id}/publish`);
      return data;
    },
    onSuccess: (_, id) => {
      toast.success('Article publié avec succès !');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la publication');
    },
  });
}