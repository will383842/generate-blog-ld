/**
 * useApiKeys Hook
 * Manage API keys for external services (OpenAI, Perplexity, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export interface ApiKey {
  id: number;
  name: string;
  service: ApiService;
  keyPreview: string; // Last 4 characters only
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApiService =
  | 'openai'
  | 'perplexity'
  | 'dalle'
  | 'unsplash'
  | 'google_indexing'
  | 'google_analytics'
  | 'custom';

export interface ApiKeyUsage {
  service: ApiService;
  date: string;
  requests: number;
  tokens?: number;
  cost?: number;
}

export interface CreateApiKeyInput {
  name: string;
  service: ApiService;
  key: string;
  usageLimit?: number;
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  id: number;
  name?: string;
  isActive?: boolean;
  usageLimit?: number;
  expiresAt?: string;
}

export interface RotateApiKeyInput {
  id: number;
  newKey: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const apiKeyKeys = {
  all: ['api-keys'] as const,
  list: () => [...apiKeyKeys.all, 'list'] as const,
  detail: (id: number) => [...apiKeyKeys.all, 'detail', id] as const,
  usage: (service?: ApiService) => [...apiKeyKeys.all, 'usage', service] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchApiKeys(): Promise<ApiKey[]> {
  const { data } = await api.get<ApiKey[]>('/admin/api-keys');
  return data;
}

async function fetchApiKeyUsage(service?: ApiService): Promise<ApiKeyUsage[]> {
  const { data } = await api.get<ApiKeyUsage[]>('/admin/api-keys/usage', {
    params: service ? { service } : undefined,
  });
  return data;
}

async function createApiKey(input: CreateApiKeyInput): Promise<ApiKey> {
  const { data } = await api.post<ApiKey>('/admin/api-keys', input);
  return data;
}

async function updateApiKey(input: UpdateApiKeyInput): Promise<ApiKey> {
  const { id, ...updateData } = input;
  const { data } = await api.put<ApiKey>(`/admin/api-keys/${id}`, updateData);
  return data;
}

async function deleteApiKey(id: number): Promise<void> {
  await api.delete(`/admin/api-keys/${id}`);
}

async function rotateApiKey(input: RotateApiKeyInput): Promise<ApiKey> {
  const { data } = await api.post<ApiKey>(`/admin/api-keys/${input.id}/rotate`, { key: input.newKey });
  return data;
}

async function validateApiKey(service: ApiService): Promise<{ valid: boolean; message?: string }> {
  const { data } = await api.post<{ valid: boolean; message?: string }>(`/admin/api-keys/validate/${service}`);
  return data;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all API keys
 */
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.list(),
    queryFn: fetchApiKeys,
    staleTime: 60000,
  });
}

/**
 * Fetch API key usage statistics
 */
export function useApiKeyUsage(service?: ApiService) {
  return useQuery({
    queryKey: apiKeyKeys.usage(service),
    queryFn: () => fetchApiKeyUsage(service),
    staleTime: 30000,
  });
}

/**
 * Create a new API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}

/**
 * Update an API key
 */
export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}

/**
 * Delete an API key
 */
export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}

/**
 * Rotate an API key (update the secret)
 */
export function useRotateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rotateApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
    },
  });
}

/**
 * Validate an API key by testing the connection
 */
export function useValidateApiKey() {
  return useMutation({
    mutationFn: validateApiKey,
  });
}

/**
 * Get API key for a specific service
 */
export function useApiKeyForService(service: ApiService) {
  const { data: keys } = useApiKeys();
  return keys?.find((key) => key.service === service && key.isActive);
}

/**
 * Check if a service has a valid API key configured
 */
export function useHasApiKey(service: ApiService) {
  const key = useApiKeyForService(service);
  return !!key;
}

export default useApiKeys;
