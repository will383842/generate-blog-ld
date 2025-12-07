/**
 * usePlatform Hook
 * Manage current platform context and platform-specific operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useLocalStorage } from './useUtils';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export interface Platform {
  id: number;
  name: string;
  slug: string;
  domain: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  languages: string[];
  defaultLanguage: string;
  settings: PlatformSettings;
  stats: PlatformStats;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettings {
  seo: {
    titleSuffix: string;
    defaultDescription: string;
    ogImage?: string;
  };
  content: {
    defaultArticleLength: number;
    defaultTone: string;
    categories: string[];
  };
  publishing: {
    autoPublish: boolean;
    scheduledPublishTime?: string;
    requireReview: boolean;
  };
  indexing: {
    autoIndex: boolean;
    sitemapEnabled: boolean;
  };
}

export interface PlatformStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  avgSeoScore: number;
}

export interface CreatePlatformInput {
  name: string;
  slug: string;
  domain: string;
  languages: string[];
  defaultLanguage: string;
}

export interface UpdatePlatformInput {
  id: number;
  name?: string;
  domain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive?: boolean;
  languages?: string[];
  defaultLanguage?: string;
  settings?: Partial<PlatformSettings>;
}

// ============================================================================
// Query Keys
// ============================================================================

export const platformKeys = {
  all: ['platforms'] as const,
  list: () => [...platformKeys.all, 'list'] as const,
  detail: (id: number) => [...platformKeys.all, 'detail', id] as const,
  stats: (id: number) => [...platformKeys.all, 'stats', id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchPlatforms(): Promise<Platform[]> {
  const { data } = await api.get<Platform[]>('/admin/platforms');
  return data;
}

async function fetchPlatform(id: number): Promise<Platform> {
  const { data } = await api.get<Platform>(`/admin/platforms/${id}`);
  return data;
}

async function createPlatform(input: CreatePlatformInput): Promise<Platform> {
  const { data } = await api.post<Platform>('/admin/platforms', input);
  return data;
}

async function updatePlatform(input: UpdatePlatformInput): Promise<Platform> {
  const { id, ...updateData } = input;
  const { data } = await api.put<Platform>(`/admin/platforms/${id}`, updateData);
  return data;
}

async function deletePlatform(id: number): Promise<void> {
  await api.delete(`/admin/platforms/${id}`);
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all platforms
 */
export function usePlatforms() {
  return useQuery({
    queryKey: platformKeys.list(),
    queryFn: fetchPlatforms,
    staleTime: 60000,
  });
}

/**
 * Fetch a single platform by ID
 */
export function usePlatformById(id: number) {
  return useQuery({
    queryKey: platformKeys.detail(id),
    queryFn: () => fetchPlatform(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Get current platform context (or fetch by ID if provided)
 * When called without arguments, returns the current platform context
 * When called with an ID, fetches that specific platform
 */
export function usePlatform(id?: number) {
  const currentPlatformContext = useCurrentPlatform();
  const platformQuery = usePlatformById(id || 0);

  // If ID is provided, return the query result
  if (id !== undefined) {
    return platformQuery;
  }

  // Otherwise return the current platform context
  return currentPlatformContext;
}

/**
 * Create a new platform
 */
export function useCreatePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.all });
    },
  });
}

/**
 * Update a platform
 */
export function useUpdatePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlatform,
    onSuccess: (platform) => {
      queryClient.setQueryData(platformKeys.detail(platform.id), platform);
      queryClient.invalidateQueries({ queryKey: platformKeys.list() });
    },
  });
}

/**
 * Delete a platform
 */
export function useDeletePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.all });
    },
  });
}

/**
 * Manage current platform selection
 */
export function useCurrentPlatform() {
  const [currentPlatformId, setCurrentPlatformId] = useLocalStorage<number | null>(
    'ce-current-platform',
    null
  );
  const { data: platforms } = usePlatforms();

  const currentPlatform = platforms?.find((p) => p.id === currentPlatformId) || platforms?.[0] || null;

  const selectPlatform = useCallback(
    (platformId: number | null) => {
      setCurrentPlatformId(platformId);
    },
    [setCurrentPlatformId]
  );

  const selectPlatformBySlug = useCallback(
    (slug: string) => {
      const platform = platforms?.find((p) => p.slug === slug);
      if (platform) {
        setCurrentPlatformId(platform.id);
      }
    },
    [platforms, setCurrentPlatformId]
  );

  return {
    currentPlatform,
    currentPlatformId: currentPlatform?.id || null,
    platforms: platforms || [],
    selectPlatform,
    selectPlatformBySlug,
    isAllPlatforms: currentPlatformId === null,
    setAllPlatforms: () => setCurrentPlatformId(null),
  };
}

/**
 * Get platform by slug
 */
export function usePlatformBySlug(slug: string) {
  const { data: platforms } = usePlatforms();
  return platforms?.find((p) => p.slug === slug);
}

/**
 * Get active platforms only
 */
export function useActivePlatforms() {
  const { data: platforms, ...rest } = usePlatforms();
  return {
    ...rest,
    data: platforms?.filter((p) => p.isActive),
  };
}

// Default export that returns currentPlatform context (for compatibility)
export default useCurrentPlatform;
