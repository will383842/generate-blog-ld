/**
 * Articles Hooks
 * Comprehensive article management with optimistic updates
 */

import { useApiQuery, useApiMutation } from './useApi';
import api from '@/utils/api';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import type {
  Article,
  ArticleWithRelations,
  ArticleFilters,
  ArticleVersion,
  ArticleStats,
  CreateArticleInput,
  UpdateArticleInput,
  TranslateArticleInput,
  PublishArticleInput,
  ArticleListResponse,
} from '@/types/article';
import type { ApiResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const articleKeys = {
  all: ['articles'] as const,
  list: () => [...articleKeys.all, 'list'] as const,
  listFiltered: (filters: ArticleFilters) => [...articleKeys.list(), filters] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
  versions: (id: string) => [...articleKeys.all, 'versions', id] as const,
  stats: () => [...articleKeys.all, 'stats'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get paginated list of articles
 */
export function useArticles(filters: ArticleFilters = {}) {
  return useApiQuery<ArticleListResponse>(
    articleKeys.listFiltered(filters),
    '/admin/articles',
    { params: filters },
    { staleTime: 30000 }
  );
}

/**
 * Get single article with all relations
 */
export function useArticle(id: string) {
  return useApiQuery<ApiResponse<ArticleWithRelations>>(
    articleKeys.detail(id),
    `/admin/articles/${id}`,
    undefined,
    {
      enabled: !!id,
      staleTime: 30000,
    }
  );
}

/**
 * Get article version history
 */
export function useArticleVersions(id: string) {
  return useApiQuery<ApiResponse<ArticleVersion[]>>(
    articleKeys.versions(id),
    `/admin/articles/${id}/versions`,
    undefined,
    {
      enabled: !!id,
      staleTime: 60000,
    }
  );
}

/**
 * Get global article stats
 */
export function useArticleStats() {
  return useApiQuery<ApiResponse<ArticleStats>>(
    articleKeys.stats(),
    '/admin/articles/stats',
    undefined,
    { staleTime: 60000 }
  );
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new article
 */
export function useCreateArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<Article>, CreateArticleInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<Article>>('/admin/articles', input);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Article créé');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Update an article with optimistic update
 */
export function useUpdateArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Article>,
    { id: string; data: UpdateArticleInput }
  >(
    async ({ id, data: updateData }) => {
      const { data } = await api.put<ApiResponse<Article>>(`/admin/articles/${id}`, updateData);
      return data;
    },
    {
      // Optimistic update
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: articleKeys.detail(id) });
        const previous = queryClient.getQueryData<ApiResponse<ArticleWithRelations>>(articleKeys.detail(id));

        queryClient.setQueryData(articleKeys.detail(id), (old: ApiResponse<ArticleWithRelations> | undefined) => ({
          ...old,
          data: { ...old?.data, ...data },
        }));

        return { previous };
      },
      onError: (error, variables, context) => {
        const ctx = context as { previous?: ApiResponse<ArticleWithRelations> } | undefined;
        if (ctx?.previous) {
          queryClient.setQueryData(
            articleKeys.detail(variables.id),
            ctx.previous
          );
        }
        toast.error(`Erreur: ${error.message}`);
      },
      onSuccess: () => {
        toast.success('Article mis à jour');
      },
      onSettled: (_, __, { id }) => {
        queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: articleKeys.list() });
      },
    }
  );
}

/**
 * Delete an article
 */
export function useDeleteArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/articles/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Article supprimé');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Publish an article
 */
export function usePublishArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<Article>, PublishArticleInput>(
    async ({ articleId, publishAt }) => {
      const { data } = await api.post<ApiResponse<Article>>(`/admin/articles/${articleId}/publish`, { publishAt });
      return data;
    },
    {
      onSuccess: (_, { publishAt }) => {
        toast.success(publishAt ? 'Article programmé' : 'Article publié');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Unpublish an article
 */
export function useUnpublishArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<Article>, string>(
    async (id) => {
      const { data } = await api.post<ApiResponse<Article>>(`/admin/articles/${id}/unpublish`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Article dépublié');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Duplicate an article
 */
export function useDuplicateArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<Article>, string>(
    async (id) => {
      const { data } = await api.post<ApiResponse<Article>>(`/admin/articles/${id}/duplicate`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Article dupliqué');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Translate an article
 */
export function useTranslateArticle() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<Article>, TranslateArticleInput>(
    async ({ articleId, targetLanguageId, useAI, copyFromLanguageId }) => {
      const { data } = await api.post<ApiResponse<Article>>(`/admin/articles/${articleId}/translate`, { targetLanguageId, useAI, copyFromLanguageId });
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Traduction lancée');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Restore a version
 */
export function useRestoreVersion() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Article>,
    { articleId: string; versionId: string }
  >(
    async ({ articleId, versionId }) => {
      const { data } = await api.post<ApiResponse<Article>>(`/admin/articles/${articleId}/versions/${versionId}/restore`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Version restaurée');
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Bulk delete articles
 */
export function useBulkDeleteArticles() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (ids) => {
      const { data } = await api.delete<ApiResponse<{ count: number }>>('/articles/bulk-delete', { data: { ids } });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} articles supprimés`);
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Bulk publish articles
 */
export function useBulkPublishArticles() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (ids) => {
      const { data } = await api.post<ApiResponse<{ count: number }>>('/articles/bulk-publish', { ids });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} articles publiés`);
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get recent articles
 */
export function useRecentArticles(limit = 10) {
  return useArticles({
    perPage: limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
}

/**
 * Get articles by status
 */
export function useArticlesByStatus(status: Article['status']) {
  return useArticles({ status: [status] });
}

/**
 * Calculate reading time from word count
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200); // 200 words per minute
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
