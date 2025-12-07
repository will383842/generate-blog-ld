/**
 * Research Hooks
 * File 285 - TanStack Query hooks for research and fact-checking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  ResearchQuery,
  ResearchSource,
  ResearchDashboardStats,
  CacheStats,
  FactCheckResult,
  ClaimExtraction,
  MiningConfig,
  MiningRunResult,
  ResearchQueryFilters,
  SearchInput,
  CreateSourceInput,
  UpdateSourceInput,
  FactCheckInput,
  ExtractClaimsInput,
} from '@/types/research';

const API_BASE = '/admin/research';

// Query keys factory
export const researchKeys = {
  all: ['research'] as const,
  dashboard: (platformId: number) => [...researchKeys.all, 'dashboard', platformId] as const,
  queries: () => [...researchKeys.all, 'queries'] as const,
  queriesList: (filters: ResearchQueryFilters) => [...researchKeys.queries(), 'list', filters] as const,
  queryDetail: (id: number) => [...researchKeys.queries(), 'detail', id] as const,
  sources: () => [...researchKeys.all, 'sources'] as const,
  sourcesList: (platformId: number) => [...researchKeys.sources(), 'list', platformId] as const,
  sourceDetail: (id: number) => [...researchKeys.sources(), 'detail', id] as const,
  cache: () => [...researchKeys.all, 'cache'] as const,
  cacheStats: (platformId: number) => [...researchKeys.cache(), 'stats', platformId] as const,
  factChecks: () => [...researchKeys.all, 'factChecks'] as const,
  factCheckHistory: (platformId: number) => [...researchKeys.factChecks(), 'history', platformId] as const,
  mining: () => [...researchKeys.all, 'mining'] as const,
  miningConfigs: (platformId: number) => [...researchKeys.mining(), 'configs', platformId] as const,
  miningRuns: (configId: number) => [...researchKeys.mining(), 'runs', configId] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchResearchDashboard(platformId: number): Promise<ResearchDashboardStats> {
  const { data } = await api.get<ResearchDashboardStats>(`${API_BASE}/dashboard`, { params: { platform_id: platformId } });
  return data;
}

async function fetchResearchQueries(filters: ResearchQueryFilters): Promise<{
  data: ResearchQuery[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{ data: ResearchQuery[]; total: number; page: number; per_page: number }>(`${API_BASE}/queries`, { params: filters });
  return data;
}

async function fetchResearchQuery(id: number): Promise<ResearchQuery> {
  const { data } = await api.get<ResearchQuery>(`${API_BASE}/queries/${id}`);
  return data;
}

async function performSearch(input: SearchInput): Promise<ResearchQuery> {
  const { data } = await api.post<ResearchQuery>(`${API_BASE}/search`, input);
  return data;
}

async function deleteQuery(id: number): Promise<void> {
  await api.delete(`${API_BASE}/queries/${id}`);
}

async function fetchSources(platformId: number): Promise<ResearchSource[]> {
  const { data } = await api.get<ResearchSource[]>(`${API_BASE}/sources`, { params: { platform_id: platformId } });
  return data;
}

async function fetchSource(id: number): Promise<ResearchSource> {
  const { data } = await api.get<ResearchSource>(`${API_BASE}/sources/${id}`);
  return data;
}

async function createSource(input: CreateSourceInput): Promise<ResearchSource> {
  const { data } = await api.post<ResearchSource>(`${API_BASE}/sources`, input);
  return data;
}

async function updateSource(id: number, input: UpdateSourceInput): Promise<ResearchSource> {
  const { data } = await api.put<ResearchSource>(`${API_BASE}/sources/${id}`, input);
  return data;
}

async function deleteSource(id: number): Promise<void> {
  await api.delete(`${API_BASE}/sources/${id}`);
}

async function reorderSources(sourceIds: number[]): Promise<void> {
  await api.post(`${API_BASE}/sources/reorder`, { source_ids: sourceIds });
}

async function fetchCacheStats(platformId: number): Promise<CacheStats> {
  const { data } = await api.get<CacheStats>(`${API_BASE}/cache/stats`, { params: { platform_id: platformId } });
  return data;
}

async function clearCache(platformId: number, source?: string): Promise<{ cleared: number }> {
  const { data } = await api.delete<{ cleared: number }>(`${API_BASE}/cache`, { params: { platform_id: platformId, source } });
  return data;
}

async function performFactCheck(input: FactCheckInput): Promise<FactCheckResult[]> {
  const { data } = await api.post<FactCheckResult[]>(`${API_BASE}/fact-check`, input);
  return data;
}

async function fetchFactCheckHistory(platformId: number): Promise<FactCheckResult[]> {
  const { data } = await api.get<FactCheckResult[]>(`${API_BASE}/fact-check/history`, { params: { platform_id: platformId } });
  return data;
}

async function extractClaims(input: ExtractClaimsInput): Promise<ClaimExtraction> {
  const { data } = await api.post<ClaimExtraction>(`${API_BASE}/claims/extract`, input);
  return data;
}

async function fetchMiningConfigs(platformId: number): Promise<MiningConfig[]> {
  const { data } = await api.get<MiningConfig[]>(`${API_BASE}/mining/configs`, { params: { platform_id: platformId } });
  return data;
}

async function createMiningConfig(config: Partial<MiningConfig>): Promise<MiningConfig> {
  const { data } = await api.post<MiningConfig>(`${API_BASE}/mining/configs`, config);
  return data;
}

async function updateMiningConfig(id: number, config: Partial<MiningConfig>): Promise<MiningConfig> {
  const { data } = await api.put<MiningConfig>(`${API_BASE}/mining/configs/${id}`, config);
  return data;
}

async function deleteMiningConfig(id: number): Promise<void> {
  await api.delete(`${API_BASE}/mining/configs/${id}`);
}

async function runMining(configId: number): Promise<MiningRunResult> {
  const { data } = await api.post<MiningRunResult>(`${API_BASE}/mining/configs/${configId}/run`);
  return data;
}

async function fetchMiningRuns(configId: number): Promise<MiningRunResult[]> {
  const { data } = await api.get<MiningRunResult[]>(`${API_BASE}/mining/configs/${configId}/runs`);
  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useResearchDashboard(platformId: number) {
  return useQuery({
    queryKey: researchKeys.dashboard(platformId),
    queryFn: () => fetchResearchDashboard(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useResearchQueries(filters: ResearchQueryFilters) {
  return useQuery({
    queryKey: researchKeys.queriesList(filters),
    queryFn: () => fetchResearchQueries(filters),
    staleTime: 30000,
  });
}

export function useResearchQuery(id: number) {
  return useQuery({
    queryKey: researchKeys.queryDetail(id),
    queryFn: () => fetchResearchQuery(id),
    enabled: id > 0,
  });
}

export function useSources(platformId: number) {
  return useQuery({
    queryKey: researchKeys.sourcesList(platformId),
    queryFn: () => fetchSources(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useSource(id: number) {
  return useQuery({
    queryKey: researchKeys.sourceDetail(id),
    queryFn: () => fetchSource(id),
    enabled: id > 0,
  });
}

export function useCacheStats(platformId: number) {
  return useQuery({
    queryKey: researchKeys.cacheStats(platformId),
    queryFn: () => fetchCacheStats(platformId),
    enabled: platformId > 0,
    staleTime: 30000,
  });
}

export function useFactCheckHistory(platformId: number) {
  return useQuery({
    queryKey: researchKeys.factCheckHistory(platformId),
    queryFn: () => fetchFactCheckHistory(platformId),
    enabled: platformId > 0,
  });
}

export function useMiningConfigs(platformId: number) {
  return useQuery({
    queryKey: researchKeys.miningConfigs(platformId),
    queryFn: () => fetchMiningConfigs(platformId),
    enabled: platformId > 0,
  });
}

export function useMiningRuns(configId: number) {
  return useQuery({
    queryKey: researchKeys.miningRuns(configId),
    queryFn: () => fetchMiningRuns(configId),
    enabled: configId > 0,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useSearch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: performSearch,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: researchKeys.queries() });
      queryClient.invalidateQueries({ queryKey: researchKeys.dashboard(data.platform_id) });
      toast({
        title: t('research.messages.searchCompleted'),
        description: `${data.results_count} résultat(s) trouvé(s)`,
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.searchError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteQuery() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteQuery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.queries() });
      toast({ title: t('research.messages.queryDeleted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.deleteError'),
        variant: 'destructive',
      });
    },
  });
}

export function useAddSource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.sources() });
      toast({ title: t('research.messages.sourceAdded') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.addSourceError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & UpdateSourceInput) =>
      updateSource(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: researchKeys.sources() });
      queryClient.invalidateQueries({ queryKey: researchKeys.sourceDetail(data.id) });
      toast({ title: t('research.messages.sourceUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.updateSourceError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.sources() });
      toast({ title: t('research.messages.sourceDeleted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.deleteSourceError'),
        variant: 'destructive',
      });
    },
  });
}

export function useReorderSources() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: reorderSources,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.sources() });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de réorganiser les sources',
        variant: 'destructive',
      });
    },
  });
}

export function useClearCache() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ platformId, source }: { platformId: number; source?: string }) =>
      clearCache(platformId, source),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: researchKeys.cache() });
      toast({
        title: t('research.messages.cacheCleared'),
        description: `${data.cleared} entrée(s) supprimée(s)`,
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.clearCacheError'),
        variant: 'destructive',
      });
    },
  });
}

export function useFactCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: performFactCheck,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: researchKeys.factChecks() });
      toast({
        title: t('research.messages.factCheckCompleted'),
        description: `${data.length} affirmation(s) vérifiée(s)`,
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.factCheckError'),
        variant: 'destructive',
      });
    },
  });
}

export function useExtractClaims() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: extractClaims,
    onSuccess: (data) => {
      toast({
        title: t('research.messages.claimsExtracted'),
        description: `${data.claims.length} affirmation(s) extraite(s)`,
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.extractClaimsError'),
        variant: 'destructive',
      });
    },
  });
}

export function useCreateMiningConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createMiningConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.mining() });
      toast({ title: t('research.messages.miningConfigCreated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.createMiningConfigError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMiningConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, ...config }: { id: number } & Partial<MiningConfig>) =>
      updateMiningConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.mining() });
      toast({ title: t('research.messages.miningConfigUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.updateMiningConfigError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMiningConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteMiningConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchKeys.mining() });
      toast({ title: t('research.messages.miningConfigDeleted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.deleteMiningConfigError'),
        variant: 'destructive',
      });
    },
  });
}

export function useRunMining() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: runMining,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: researchKeys.mining() });
      toast({
        title: t('research.messages.miningStarted'),
        description: `ID: ${data.id}`,
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('research.messages.runMiningError'),
        variant: 'destructive',
      });
    },
  });
}
