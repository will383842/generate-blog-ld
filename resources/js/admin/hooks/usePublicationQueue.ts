/**
 * Publication Queue Hooks
 * File 367 - Hooks for publication queue management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  PublicationQueueItem,
  PublicationQueueFilters,
  PublicationQueueStats,
  PublicationHistoryFilters,
  SchedulePreview,
  ScheduleArticleInput,
  ScheduleBatchInput,
  UpdatePriorityInput,
  QueuePriority,
  BulkActionResult,
} from '@/types/automation';

// ============================================================================
// Query Keys
// ============================================================================

export const publicationQueueKeys = {
  all: ['publication-queue'] as const,
  list: (filters: PublicationQueueFilters) => [...publicationQueueKeys.all, 'list', filters] as const,
  stats: () => [...publicationQueueKeys.all, 'stats'] as const,
  history: (filters: PublicationHistoryFilters) => [...publicationQueueKeys.all, 'history', filters] as const,
  preview: (platformId: number, days: number) => [...publicationQueueKeys.all, 'preview', platformId, days] as const,
  item: (id: number) => [...publicationQueueKeys.all, 'item', id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchPublicationQueue(filters: PublicationQueueFilters): Promise<{
  data: PublicationQueueItem[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: PublicationQueueItem[];
    total: number;
    page: number;
    per_page: number;
  }>('/admin/publication-queue', { params: filters });
  return data;
}

async function fetchPublicationQueueStats(): Promise<PublicationQueueStats> {
  const { data } = await api.get<PublicationQueueStats>('/admin/publication-queue/stats');
  return data;
}

async function fetchPublicationHistory(filters: PublicationHistoryFilters): Promise<{
  data: PublicationQueueItem[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: PublicationQueueItem[];
    total: number;
    page: number;
    per_page: number;
  }>('/admin/publication-queue/history', { params: filters });
  return data;
}

async function fetchSchedulePreview(platformId: number, days: number): Promise<SchedulePreview[]> {
  const { data } = await api.get<SchedulePreview[]>('/admin/publication-queue/preview', {
    params: { platform_id: platformId, days }
  });
  return data;
}

async function scheduleArticle(input: ScheduleArticleInput): Promise<PublicationQueueItem> {
  const { data } = await api.post<PublicationQueueItem>('/admin/publication-queue', input);
  return data;
}

async function scheduleBatch(input: ScheduleBatchInput): Promise<BulkActionResult> {
  const { data } = await api.post<BulkActionResult>('/admin/publication-queue/batch', input);
  return data;
}

async function cancelPublication(id: number): Promise<void> {
  await api.post(`/admin/publication-queue/${id}/cancel`);
}

async function retryPublication(id: number): Promise<PublicationQueueItem> {
  const { data } = await api.post<PublicationQueueItem>(`/admin/publication-queue/${id}/retry`);
  return data;
}

async function publishNow(id: number): Promise<PublicationQueueItem> {
  const { data } = await api.post<PublicationQueueItem>(`/admin/publication-queue/${id}/publish-now`);
  return data;
}

async function updatePriority(input: UpdatePriorityInput): Promise<PublicationQueueItem> {
  const { data } = await api.patch<PublicationQueueItem>(`/admin/publication-queue/${input.id}/priority`, {
    priority: input.priority
  });
  return data;
}

async function bulkCancel(ids: number[]): Promise<BulkActionResult> {
  const { data } = await api.post<BulkActionResult>('/admin/publication-queue/bulk/cancel', { ids });
  return data;
}

async function bulkUpdatePriority(ids: number[], priority: QueuePriority): Promise<BulkActionResult> {
  const { data } = await api.post<BulkActionResult>('/admin/publication-queue/bulk/priority', {
    ids,
    priority
  });
  return data;
}

async function bulkPublishNow(ids: number[]): Promise<BulkActionResult> {
  const { data } = await api.post<BulkActionResult>('/admin/publication-queue/bulk/publish-now', { ids });
  return data;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get publication queue with filters
 * Auto-refresh every 30 seconds
 */
export function usePublicationQueue(filters: PublicationQueueFilters = {}) {
  return useQuery({
    queryKey: publicationQueueKeys.list(filters),
    queryFn: () => fetchPublicationQueue(filters),
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 15 * 1000,
  });
}

/**
 * Get publication queue stats (real-time)
 * Auto-refresh every 30 seconds
 */
export function usePublicationQueueStats() {
  return useQuery({
    queryKey: publicationQueueKeys.stats(),
    queryFn: fetchPublicationQueueStats,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });
}

/**
 * Get publication history
 */
export function usePublicationHistory(filters: PublicationHistoryFilters = {}) {
  return useQuery({
    queryKey: publicationQueueKeys.history(filters),
    queryFn: () => fetchPublicationHistory(filters),
    staleTime: 60 * 1000,
  });
}

/**
 * Get schedule preview for a platform
 */
export function useSchedulePreview(platformId: number, days: number = 7) {
  return useQuery({
    queryKey: publicationQueueKeys.preview(platformId, days),
    queryFn: () => fetchSchedulePreview(platformId, days),
    enabled: platformId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Schedule an article for publication
 */
export function useScheduleArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: scheduleArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Article planifié',
        description: 'L\'article a été ajouté à la queue de publication.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de planifier l\'article.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Schedule multiple articles
 */
export function useScheduleBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: scheduleBatch,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Articles planifiés',
        description: `${result.success} article(s) planifié(s)${result.failed > 0 ? `, ${result.failed} erreur(s)` : ''}.`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de planifier les articles.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Cancel a publication
 */
export function useCancelPublication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: cancelPublication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Publication annulée',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la publication.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Retry a failed publication
 */
export function useRetryPublication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: retryPublication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Nouvelle tentative',
        description: 'La publication sera réessayée.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de réessayer.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Publish immediately (bypass queue)
 */
export function usePublishNow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: publishNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Publication en cours',
        description: 'L\'article est en cours de publication.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de publier.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update publication priority
 */
export function useUpdatePriority() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updatePriority,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Priorité mise à jour',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la priorité.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk cancel publications
 */
export function useBulkCancel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bulkCancel,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Publications annulées',
        description: `${result.success} publication(s) annulée(s).`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler les publications.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk update priority
 */
export function useBulkUpdatePriority() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ids, priority }: { ids: number[]; priority: QueuePriority }) =>
      bulkUpdatePriority(ids, priority),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Priorités mises à jour',
        description: `${result.success} publication(s) modifiée(s).`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier les priorités.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk publish now
 */
export function useBulkPublishNow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bulkPublishNow,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: publicationQueueKeys.all });
      toast({
        title: 'Publications en cours',
        description: `${result.success} article(s) en cours de publication.`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de publier.',
        variant: 'destructive',
      });
    },
  });
}
