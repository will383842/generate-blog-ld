/**
 * Publishing Hooks
 * File 375 - Hooks for external publishing API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  ExternalPlatform,
  CreatePlatformInput,
  UpdatePlatformInput,
  PublishingEndpoint,
  CreateEndpointInput,
  UpdateEndpointInput,
  PublishQueue,
  PublishQueueFilters,
  PublishLog,
  ConnectionTestResult,
  PublishingStats,
} from '@/types/publishing';

// ============================================================================
// Query Keys
// ============================================================================

export const publishingKeys = {
  all: ['publishing'] as const,
  platforms: () => [...publishingKeys.all, 'platforms'] as const,
  platform: (id: number) => [...publishingKeys.platforms(), id] as const,
  endpoints: (platformId: number) => [...publishingKeys.all, 'endpoints', platformId] as const,
  endpoint: (id: number) => [...publishingKeys.all, 'endpoint', id] as const,
  queue: (filters: PublishQueueFilters) => [...publishingKeys.all, 'queue', filters] as const,
  history: (filters: PublishQueueFilters) => [...publishingKeys.all, 'history', filters] as const,
  logs: (queueId: number) => [...publishingKeys.all, 'logs', queueId] as const,
  stats: () => [...publishingKeys.all, 'stats'] as const,
};

// ============================================================================
// API Functions - Platforms
// ============================================================================

async function fetchPlatforms(): Promise<ExternalPlatform[]> {
  const { data } = await api.get<ExternalPlatform[]>('/admin/publishing/platforms');
  return data;
}

async function fetchPlatform(id: number): Promise<ExternalPlatform> {
  const { data } = await api.get<ExternalPlatform>(`/admin/publishing/platforms/${id}`);
  return data;
}

async function createPlatform(input: CreatePlatformInput): Promise<ExternalPlatform> {
  const { data } = await api.post<ExternalPlatform>('/admin/publishing/platforms', input);
  return data;
}

async function updatePlatform(input: UpdatePlatformInput): Promise<ExternalPlatform> {
  const { data } = await api.put<ExternalPlatform>(`/admin/publishing/platforms/${input.id}`, input);
  return data;
}

async function deletePlatform(id: number): Promise<void> {
  await api.delete(`/admin/publishing/platforms/${id}`);
}

async function testConnection(id: number): Promise<ConnectionTestResult> {
  const { data } = await api.post<ConnectionTestResult>(`/admin/publishing/platforms/${id}/test`);
  return data;
}

// ============================================================================
// API Functions - Endpoints
// ============================================================================

async function fetchEndpoints(platformId: number): Promise<PublishingEndpoint[]> {
  const { data } = await api.get<PublishingEndpoint[]>(`/admin/publishing/platforms/${platformId}/endpoints`);
  return data;
}

async function createEndpoint(input: CreateEndpointInput): Promise<PublishingEndpoint> {
  const { data } = await api.post<PublishingEndpoint>(`/admin/publishing/platforms/${input.platformId}/endpoints`, input);
  return data;
}

async function updateEndpoint(input: UpdateEndpointInput): Promise<PublishingEndpoint> {
  const { data } = await api.put<PublishingEndpoint>(`/admin/publishing/endpoints/${input.id}`, input);
  return data;
}

async function deleteEndpoint(id: number): Promise<void> {
  await api.delete(`/admin/publishing/endpoints/${id}`);
}

async function testEndpoint(id: number): Promise<{ success: boolean; response: unknown; error?: string }> {
  const { data } = await api.post<{ success: boolean; response: unknown; error?: string }>(`/admin/publishing/endpoints/${id}/test`);
  return data;
}

// ============================================================================
// API Functions - Queue
// ============================================================================

async function fetchPublishQueue(filters: PublishQueueFilters): Promise<{
  data: PublishQueue[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: PublishQueue[];
    total: number;
    page: number;
    per_page: number;
  }>('/admin/publishing/queue', { params: filters });
  return data;
}

async function fetchPublishHistory(filters: PublishQueueFilters): Promise<{
  data: PublishQueue[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: PublishQueue[];
    total: number;
    page: number;
    per_page: number;
  }>('/admin/publishing/history', { params: filters });
  return data;
}

async function fetchPublishLogs(queueId: number): Promise<PublishLog[]> {
  const { data } = await api.get<PublishLog[]>(`/admin/publishing/queue/${queueId}/logs`);
  return data;
}

async function publishContent(contentId: number, platformId: number): Promise<PublishQueue> {
  const { data } = await api.post<PublishQueue>('/admin/publishing/publish', { contentId, platformId });
  return data;
}

async function schedulePublish(input: {
  contentId: number;
  platformId: number;
  scheduledAt: string;
}): Promise<PublishQueue> {
  const { data } = await api.post<PublishQueue>('/admin/publishing/schedule', input);
  return data;
}

async function cancelPublish(id: number): Promise<void> {
  await api.post(`/admin/publishing/queue/${id}/cancel`);
}

async function retryPublish(id: number, payload?: Record<string, unknown>): Promise<PublishQueue> {
  const { data } = await api.post<PublishQueue>(`/admin/publishing/queue/${id}/retry`, { payload });
  return data;
}

async function fetchPublishingStats(): Promise<PublishingStats> {
  const { data } = await api.get<PublishingStats>('/admin/publishing/stats');
  return data;
}

// ============================================================================
// Platform Queries & Mutations
// ============================================================================

export function usePlatforms() {
  return useQuery({
    queryKey: publishingKeys.platforms(),
    queryFn: fetchPlatforms,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlatform(id: number) {
  return useQuery({
    queryKey: publishingKeys.platform(id),
    queryFn: () => fetchPlatform(id),
    enabled: id > 0,
  });
}

export function useCreatePlatform() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createPlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.platforms() });
      toast({ title: 'Plateforme créée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer la plateforme', variant: 'destructive' });
    },
  });
}

export function useUpdatePlatform() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updatePlatform,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.platforms() });
      queryClient.setQueryData(publishingKeys.platform(data.id), data);
      toast({ title: 'Plateforme mise à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
    },
  });
}

export function useDeletePlatform() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deletePlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.platforms() });
      toast({ title: 'Plateforme supprimée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    },
  });
}

export function useTestConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: testConnection,
    onSuccess: (result) => {
      toast({
        title: result.success ? 'Connexion réussie' : 'Connexion échouée',
        description: result.error || `Latence: ${result.latency}ms`,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Test impossible', variant: 'destructive' });
    },
  });
}

// ============================================================================
// Endpoint Queries & Mutations
// ============================================================================

export function useEndpoints(platformId: number) {
  return useQuery({
    queryKey: publishingKeys.endpoints(platformId),
    queryFn: () => fetchEndpoints(platformId),
    enabled: platformId > 0,
  });
}

export function useCreateEndpoint() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createEndpoint,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.endpoints(data.platformId) });
      toast({ title: 'Endpoint créé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer l\'endpoint', variant: 'destructive' });
    },
  });
}

export function useUpdateEndpoint() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      toast({ title: 'Endpoint mis à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
    },
  });
}

export function useDeleteEndpoint() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      toast({ title: 'Endpoint supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    },
  });
}

export function useTestEndpoint() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: testEndpoint,
    onSuccess: (result) => {
      toast({
        title: result.success ? 'Test réussi' : 'Test échoué',
        description: result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Test impossible', variant: 'destructive' });
    },
  });
}

// ============================================================================
// Queue Queries & Mutations
// ============================================================================

export function usePublishQueue(filters: PublishQueueFilters = {}) {
  return useQuery({
    queryKey: publishingKeys.queue(filters),
    queryFn: () => fetchPublishQueue(filters),
    refetchInterval: 30 * 1000,
  });
}

export function usePublishHistory(filters: PublishQueueFilters = {}) {
  return useQuery({
    queryKey: publishingKeys.history(filters),
    queryFn: () => fetchPublishHistory(filters),
  });
}

export function usePublishLogs(queueId: number) {
  return useQuery({
    queryKey: publishingKeys.logs(queueId),
    queryFn: () => fetchPublishLogs(queueId),
    enabled: queueId > 0,
  });
}

export function usePublishContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ contentId, platformId }: { contentId: number; platformId: number }) =>
      publishContent(contentId, platformId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      toast({ title: 'Publication en cours' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de publier', variant: 'destructive' });
    },
  });
}

export function useSchedulePublish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: schedulePublish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      toast({ title: 'Publication planifiée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de planifier', variant: 'destructive' });
    },
  });
}

export function useCancelPublish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: cancelPublish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      toast({ title: 'Publication annulée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'annuler', variant: 'destructive' });
    },
  });
}

export function useRetryPublish() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: Record<string, unknown> }) =>
      retryPublish(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishingKeys.all });
      toast({ title: 'Nouvelle tentative lancée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de réessayer', variant: 'destructive' });
    },
  });
}

export function usePublishingStats() {
  return useQuery({
    queryKey: publishingKeys.stats(),
    queryFn: fetchPublishingStats,
    staleTime: 60 * 1000,
  });
}

/**
 * Combined publishing hook for dashboard
 */
export function usePublishing() {
  const statsQuery = usePublishingStats();
  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    refetch: statsQuery.refetch,
    error: statsQuery.error,
  };
}
