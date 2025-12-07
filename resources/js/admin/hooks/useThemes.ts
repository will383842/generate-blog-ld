// ═══════════════════════════════════════════════════════════════════════════
// THEMES HOOKS - Content Themes Management by Platform
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type { PlatformId } from '@/utils/constants';
import type { ApiResponse, ApiErrorResponse, PaginatedResponse, Theme as BaseTheme } from '@/types/common';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Theme extends BaseTheme {
  platformId: PlatformId;
  platformName: string;
  parentId?: string;
  parent?: Theme;
  children?: Theme[];
  level: number; // Hierarchy depth (0 = root)
  path: string[]; // Full path from root
  isActive: boolean;
  isSystem: boolean; // Cannot be deleted
  articlesCount: number;
  publishedCount: number;
  coveragePercent: number;
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  icon?: string;
  color?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeStats {
  totalThemes: number;
  activeThemes: number;
  totalArticles: number;
  byPlatform: Record<PlatformId, {
    themes: number;
    articles: number;
  }>;
  topThemes: Array<{
    id: string;
    name: string;
    articles: number;
    platform: PlatformId;
  }>;
}

export interface ThemeFilters {
  platformId?: PlatformId | PlatformId[];
  parentId?: string | null; // null = root themes only
  search?: string;
  isActive?: boolean;
  hasArticles?: boolean;
  level?: number;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'articlesCount' | 'order' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateThemeInput {
  name: string;
  slug?: string;
  description?: string;
  platformId: PlatformId;
  parentId?: string;
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
  icon?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateThemeInput extends Partial<CreateThemeInput> {
  id: string;
}

export interface ThemeTreeNode extends Theme {
  children: ThemeTreeNode[];
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const themeKeys = {
  all: ['themes'] as const,
  lists: () => [...themeKeys.all, 'list'] as const,
  list: (filters?: ThemeFilters) => [...themeKeys.lists(), filters] as const,
  detail: (id: string) => [...themeKeys.all, 'detail', id] as const,
  byPlatform: (platformId: PlatformId) => [...themeKeys.all, 'platform', platformId] as const,
  tree: (platformId?: PlatformId) => [...themeKeys.all, 'tree', platformId] as const,
  stats: () => [...themeKeys.all, 'stats'] as const,
  search: (query: string, platformId?: PlatformId) => 
    [...themeKeys.all, 'search', query, platformId] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const API = {
  themes: '/admin/themes',
  theme: (id: string) => `/admin/themes/${id}`,
  themesByPlatform: (platformId: string) => `/admin/themes/platform/${platformId}`,
  themesTree: '/admin/themes/tree',
  themesStats: '/admin/themes/stats',
  themeReorder: (id: string) => `/admin/themes/${id}/reorder`,
  themeMove: (id: string) => `/admin/themes/${id}/move`,
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch themes with filters
 */
export function useThemes(filters?: ThemeFilters) {
  return useApiQuery<PaginatedResponse<Theme>>(
    themeKeys.list(filters),
    API.themes,
    {
      params: filters,
    },
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
}

/**
 * Fetch all themes for a platform (no pagination)
 */
export function useThemesByPlatform(platformId: PlatformId | undefined) {
  return useApiQuery<ApiResponse<Theme[]>>(
    themeKeys.byPlatform(platformId || '' as PlatformId),
    API.themesByPlatform(platformId || ''),
    undefined,
    {
      enabled: !!platformId,
      staleTime: 60 * 1000,
    }
  );
}

/**
 * Fetch single theme details
 */
export function useTheme(id: string | undefined) {
  return useApiQuery<ApiResponse<Theme>>(
    themeKeys.detail(id || ''),
    API.theme(id || ''),
    undefined,
    {
      enabled: !!id,
      staleTime: 60 * 1000,
    }
  );
}

/**
 * Fetch themes as hierarchical tree
 */
export function useThemesTree(platformId?: PlatformId) {
  return useApiQuery<ApiResponse<ThemeTreeNode[]>>(
    themeKeys.tree(platformId),
    API.themesTree,
    {
      params: platformId ? { platformId } : undefined,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Fetch themes statistics
 */
export function useThemesStats() {
  return useApiQuery<ApiResponse<ThemeStats>>(
    themeKeys.stats(),
    API.themesStats,
    undefined,
    {
      staleTime: 60 * 1000,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new theme
 */
export function useCreateTheme() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Theme>, CreateThemeInput>(
    async (variables: CreateThemeInput) => (
      await api.post<ApiResponse<Theme>>(API.themes, variables)
    ).data,
    {
      onSuccess: (data: ApiResponse<Theme>) => {
        success('Thème créé', `Le thème "${data.data.name}" a été créé.`);
        queryClient.invalidateQueries({ queryKey: themeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: themeKeys.byPlatform(data.data.platformId) });
        queryClient.invalidateQueries({ queryKey: themeKeys.tree(data.data.platformId) });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de créer le thème');
      },
    }
  );
}

/**
 * Update an existing theme
 */
export function useUpdateTheme() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Theme>, UpdateThemeInput>(
    async (variables: UpdateThemeInput) => (
      await api.put<ApiResponse<Theme>>(API.theme(variables.id), variables)
    ).data,
    {
      onSuccess: (data: ApiResponse<Theme>) => {
        success('Thème mis à jour', 'Les modifications ont été enregistrées.');
        queryClient.invalidateQueries({ queryKey: themeKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: themeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: themeKeys.byPlatform(data.data.platformId) });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de mettre à jour');
      },
    }
  );
}

/**
 * Delete a theme
 */
export function useDeleteTheme() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<void>, { id: string; platformId: PlatformId }>(
    async (variables: { id: string; platformId: PlatformId }) => (
      await api.delete<ApiResponse<void>>(API.theme(variables.id))
    ).data,
    {
      onSuccess: (_: ApiResponse<void>, variables) => {
        success('Thème supprimé', 'Le thème a été supprimé.');
        queryClient.invalidateQueries({ queryKey: themeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: themeKeys.byPlatform(variables.platformId) });
        queryClient.invalidateQueries({ queryKey: themeKeys.tree(variables.platformId) });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de supprimer');
      },
    }
  );
}

/**
 * Reorder themes
 */
export function useReorderTheme() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  return useApiMutation<
    ApiResponse<Theme>,
    { id: string; newOrder: number; platformId: PlatformId }
  >(
    async (variables) => (
      await api.post<ApiResponse<Theme>>(API.themeReorder(variables.id), {
        newOrder: variables.newOrder,
      })
    ).data,
    {
      onSuccess: (_: ApiResponse<Theme>, variables) => {
        queryClient.invalidateQueries({ queryKey: themeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: themeKeys.byPlatform(variables.platformId) });
        queryClient.invalidateQueries({ queryKey: themeKeys.tree(variables.platformId) });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de réordonner');
      },
    }
  );
}

/**
 * Move theme to different parent
 */
export function useMoveTheme() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<
    ApiResponse<Theme>,
    { id: string; newParentId: string | null; platformId: PlatformId }
  >(
    async (variables) => (
      await api.post<ApiResponse<Theme>>(API.themeMove(variables.id), {
        newParentId: variables.newParentId,
      })
    ).data,
    {
      onSuccess: (_: ApiResponse<Theme>, variables) => {
        success('Thème déplacé', 'Le thème a été déplacé.');
        queryClient.invalidateQueries({ queryKey: themeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: themeKeys.byPlatform(variables.platformId) });
        queryClient.invalidateQueries({ queryKey: themeKeys.tree(variables.platformId) });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de déplacer');
      },
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get root themes only (no parent)
 */
export function useRootThemes(platformId?: PlatformId) {
  const { data, ...rest } = useThemes({
    platformId,
    parentId: null,
    sortBy: 'order',
    sortOrder: 'asc',
  });

  return { data: data?.data || [], ...rest };
}

/**
 * Get child themes for a parent
 */
export function useChildThemes(parentId: string | undefined) {
  const { data, ...rest } = useThemes({
    parentId,
    sortBy: 'order',
    sortOrder: 'asc',
  });

  return { data: data?.data || [], ...rest };
}

/**
 * Search themes across platforms
 */
export function useSearchThemes(query: string, platformId?: PlatformId, limit = 10) {
  const { data, ...rest } = useThemes({
    search: query,
    platformId,
    perPage: limit,
    isActive: true,
  });

  return { 
    data: data?.data || [], 
    total: data?.meta?.total || 0,
    ...rest 
  };
}

/**
 * Get active themes for a platform
 */
export function useActiveThemes(platformId: PlatformId) {
  const { data, ...rest } = useThemesByPlatform(platformId);

  const activeThemes = useMemo(() => {
    return (data?.data || []).filter((t) => t.isActive);
  }, [data]);

  return { data: activeThemes, ...rest };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get theme options for select dropdowns
 */
export function useThemeOptions(platformId?: PlatformId) {
  const { data, isLoading } = useThemesByPlatform(platformId);

  const options = useMemo(() => {
    if (!data?.data) return [];

    return data.data
      .filter((t) => t.isActive)
      .map((theme) => ({
        value: theme.id,
        label: theme.level > 0 ? `${'  '.repeat(theme.level)}└ ${theme.name}` : theme.name,
        searchLabel: theme.path.join(' > '),
        theme,
      }))
      .sort((a, b) => {
        // Sort by path to maintain hierarchy
        return a.theme.path.join('/').localeCompare(b.theme.path.join('/'));
      });
  }, [data]);

  return { options, isLoading };
}

/**
 * Get grouped theme options (by parent)
 */
export function useGroupedThemeOptions(platformId: PlatformId) {
  const { data, isLoading } = useThemesTree(platformId);

  const groups = useMemo(() => {
    if (!data?.data) return [];

    const result: Array<{
      label: string;
      options: Array<{ value: string; label: string; theme: Theme }>;
    }> = [];

    const processNode = (node: ThemeTreeNode, parentLabel?: string) => {
      const groupLabel = parentLabel || node.name;
      const options: Array<{ value: string; label: string; theme: Theme }> = [];

      if (node.children?.length) {
        node.children.forEach((child) => {
          options.push({
            value: child.id,
            label: child.name,
            theme: child,
          });
        });

        if (options.length > 0) {
          result.push({ label: groupLabel, options });
        }

        node.children.forEach((child) => {
          if (child.children?.length) {
            processNode(child, `${groupLabel} > ${child.name}`);
          }
        });
      }
    };

    data.data.forEach((rootNode) => processNode(rootNode));
    return result;
  }, [data]);

  return { groups, isLoading };
}

/**
 * Get theme by ID from cache
 */
export function useThemeById(id: string | undefined): Theme | undefined {
  const queryClient = useQueryClient();
  
  // Try to find in any cached list
  const lists = queryClient.getQueriesData<PaginatedResponse<Theme>>({
    queryKey: themeKeys.lists(),
  });

  for (const [, data] of lists) {
    const theme = data?.data?.find((t) => t.id === id);
    if (theme) return theme;
  }

  return undefined;
}

/**
 * Get theme breadcrumb path
 */
export function useThemeBreadcrumb(themeId: string | undefined): Theme[] {
  const theme = useThemeById(themeId);
  const { data } = useThemesByPlatform(theme?.platformId);

  return useMemo(() => {
    if (!theme || !data?.data) return [];

    const path: Theme[] = [];
    let current: Theme | undefined = theme;

    while (current) {
      path.unshift(current);
      current = data.data.find((t) => t.id === current?.parentId);
    }

    return path;
  }, [theme, data]);
}

/**
 * Prefetch themes for a platform
 */
export function usePrefetchThemes() {
  const queryClient = useQueryClient();

  return useCallback(
    (platformId: PlatformId) => {
      queryClient.prefetchQuery({
        queryKey: themeKeys.byPlatform(platformId),
        queryFn: async () => {
          const { data } = await api.get<ApiResponse<Theme[]>>(API.themesByPlatform(platformId));
          return data;
        },
        staleTime: 60 * 1000,
      });
    },
    [queryClient]
  );
}

/**
 * Invalidate all theme caches
 */
export function useInvalidateThemes() {
  const queryClient = useQueryClient();

  return useCallback(
    (platformId?: PlatformId) => {
      if (platformId) {
        queryClient.invalidateQueries({ queryKey: themeKeys.byPlatform(platformId) });
        queryClient.invalidateQueries({ queryKey: themeKeys.tree(platformId) });
      } else {
        queryClient.invalidateQueries({ queryKey: themeKeys.all });
      }
    },
    [queryClient]
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build flat list from tree
 */
export function flattenThemeTree(nodes: ThemeTreeNode[], level = 0): Theme[] {
  const result: Theme[] = [];

  nodes.forEach((node) => {
    result.push({ ...node, level });
    if (node.children?.length) {
      result.push(...flattenThemeTree(node.children, level + 1));
    }
  });

  return result;
}

/**
 * Build tree from flat list
 */
export function buildThemeTree(themes: Theme[]): ThemeTreeNode[] {
  const map = new Map<string, ThemeTreeNode>();
  const roots: ThemeTreeNode[] = [];

  // First pass: create nodes
  themes.forEach((theme) => {
    map.set(theme.id, { ...theme, children: [] });
  });

  // Second pass: build tree
  themes.forEach((theme) => {
    const node = map.get(theme.id)!;
    if (theme.parentId) {
      const parent = map.get(theme.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Get all descendant IDs for a theme
 */
export function getThemeDescendantIds(themes: Theme[], parentId: string): string[] {
  const ids: string[] = [];
  
  const collect = (pid: string) => {
    themes.forEach((t) => {
      if (t.parentId === pid) {
        ids.push(t.id);
        collect(t.id);
      }
    });
  };

  collect(parentId);
  return ids;
}