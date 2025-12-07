/**
 * Webhooks Hooks
 * File 376 - Hooks for webhook management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  Webhook,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookLog,
  WebhookLogFilters,
} from '@/types/publishing';

// ============================================================================
// Query Keys
// ============================================================================

export const webhooksKeys = {
  all: ['webhooks'] as const,
  list: () => [...webhooksKeys.all, 'list'] as const,
  detail: (id: number) => [...webhooksKeys.all, 'detail', id] as const,
  logs: (id: number, filters: WebhookLogFilters) => [...webhooksKeys.all, 'logs', id, filters] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchWebhooks(): Promise<Webhook[]> {
  const { data } = await api.get<Webhook[]>('/admin/webhooks');
  return data;
}

async function fetchWebhook(id: number): Promise<Webhook> {
  const { data } = await api.get<Webhook>(`/admin/webhooks/${id}`);
  return data;
}

async function createWebhook(webhookData: CreateWebhookInput): Promise<Webhook> {
  const { data } = await api.post<Webhook>('/admin/webhooks', webhookData);
  return data;
}

async function updateWebhook(webhookData: UpdateWebhookInput): Promise<Webhook> {
  const { data } = await api.put<Webhook>(`/admin/webhooks/${webhookData.id}`, webhookData);
  return data;
}

async function deleteWebhook(id: number): Promise<void> {
  await api.delete(`/admin/webhooks/${id}`);
}

async function testWebhook(id: number): Promise<{ success: boolean; statusCode?: number; error?: string; duration: number }> {
  const { data } = await api.post<{ success: boolean; statusCode?: number; error?: string; duration: number }>(`/admin/webhooks/${id}/test`);
  return data;
}

async function toggleWebhook(id: number, isActive: boolean): Promise<Webhook> {
  const { data } = await api.post<Webhook>(`/admin/webhooks/${id}/toggle`, { isActive });
  return data;
}

async function regenerateSecret(id: number): Promise<{ secret: string }> {
  const { data } = await api.post<{ secret: string }>(`/admin/webhooks/${id}/regenerate-secret`);
  return data;
}

async function fetchWebhookLogs(id: number, filters: WebhookLogFilters): Promise<{
  data: WebhookLog[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{ data: WebhookLog[]; total: number; page: number; per_page: number }>(`/admin/webhooks/${id}/logs`, { params: filters });
  return data;
}

async function retryWebhookLog(logId: number): Promise<WebhookLog> {
  const { data } = await api.post<WebhookLog>(`/admin/webhooks/logs/${logId}/retry`);
  return data;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all webhooks
 */
export function useWebhooks() {
  return useQuery({
    queryKey: webhooksKeys.list(),
    queryFn: fetchWebhooks,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get single webhook
 */
export function useWebhook(id: number) {
  return useQuery({
    queryKey: webhooksKeys.detail(id),
    queryFn: () => fetchWebhook(id),
    enabled: id > 0,
  });
}

/**
 * Get webhook logs with filters
 */
export function useWebhookLogs(id: number, filters: WebhookLogFilters = {}) {
  return useQuery({
    queryKey: webhooksKeys.logs(id, filters),
    queryFn: () => fetchWebhookLogs(id, filters),
    enabled: id > 0,
    refetchInterval: 30 * 1000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create webhook
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.list() });
      toast({ title: 'Webhook créé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer le webhook', variant: 'destructive' });
    },
  });
}

/**
 * Update webhook
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateWebhook,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.list() });
      queryClient.setQueryData(webhooksKeys.detail(data.id), data);
      toast({ title: 'Webhook mis à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
    },
  });
}

/**
 * Delete webhook
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.list() });
      toast({ title: 'Webhook supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    },
  });
}

/**
 * Test webhook
 */
export function useTestWebhook() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: testWebhook,
    onSuccess: (result) => {
      toast({
        title: result.success ? 'Test réussi' : 'Test échoué',
        description: result.success
          ? `Status: ${result.statusCode} - ${result.duration}ms`
          : result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Test impossible', variant: 'destructive' });
    },
  });
}

/**
 * Toggle webhook active state
 */
export function useToggleWebhook() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleWebhook(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: webhooksKeys.list() });
      const previousWebhooks = queryClient.getQueryData<Webhook[]>(webhooksKeys.list());
      
      if (previousWebhooks) {
        queryClient.setQueryData(webhooksKeys.list(),
          previousWebhooks.map(w => w.id === id ? { ...w, isActive } : w)
        );
      }
      
      return { previousWebhooks };
    },
    onError: (error, variables, context) => {
      if (context?.previousWebhooks) {
        queryClient.setQueryData(webhooksKeys.list(), context.previousWebhooks);
      }
      toast({ title: 'Erreur', description: 'Impossible de modifier', variant: 'destructive' });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(webhooksKeys.detail(data.id), data);
      toast({
        title: data.isActive ? 'Webhook activé' : 'Webhook désactivé',
      });
    },
  });
}

/**
 * Regenerate webhook secret
 */
export function useRegenerateSecret() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: regenerateSecret,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.detail(id) });
      toast({ title: 'Secret régénéré' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de régénérer', variant: 'destructive' });
    },
  });
}

/**
 * Retry failed webhook log
 */
export function useRetryWebhookLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: retryWebhookLog,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: webhooksKeys.all });
      toast({
        title: data.success ? 'Webhook réessayé avec succès' : 'Échec du retry',
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de réessayer', variant: 'destructive' });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Generate a random secret
 */
export function generateWebhookSecret(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get webhook health status
 */
export function useWebhookHealth(webhook: Webhook | undefined) {
  if (!webhook) return { status: 'unknown', color: 'gray' };

  if (!webhook.isActive) {
    return { status: 'Inactif', color: 'gray' };
  }

  if (webhook.successRate >= 95) {
    return { status: 'Excellent', color: 'green' };
  } else if (webhook.successRate >= 80) {
    return { status: 'Bon', color: 'yellow' };
  } else if (webhook.successRate >= 50) {
    return { status: 'Dégradé', color: 'orange' };
  } else {
    return { status: 'Critique', color: 'red' };
  }
}
