import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

// ═══════════════════════════════════════════════════════════════
// Query Keys Factory
// ═══════════════════════════════════════════════════════════════

export const statsKeys = {
  all: ['stats'] as const,
  dashboard: (platformId?: string) => [...statsKeys.all, 'dashboard', platformId] as const,
  costs: (period: string) => [...statsKeys.all, 'costs', period] as const,
  production: (days: number) => [...statsKeys.all, 'production', days] as const,
  costsTimeline: (days: number) => [...statsKeys.all, 'costs-timeline', days] as const,
  activity: (limit: number) => [...statsKeys.all, 'activity', limit] as const,
  coverage: () => [...statsKeys.all, 'coverage'] as const,
  heatmap: () => [...statsKeys.all, 'heatmap'] as const,
  gaps: (platformId?: string) => [...statsKeys.all, 'gaps', platformId] as const,
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ProductionData {
  date: string;
  articles: number;
  piliers: number;
  landings: number;
  press: number;
}

export interface CostsData {
  date: string;
  gpt4: number;
  gpt35: number;
  dalle: number;
  perplexity: number;
}

export interface Activity {
  id: string;
  type: 'generation' | 'publication' | 'error' | 'system';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  articles_count: number;
  articles_this_month: number;
  total_words: number;
  languages_count: number;
  costs_this_month: number;
  budget_limit: number;
}

export interface CostStatsResponse {
  total_cost: number;
  by_service: Record<string, number>;
  timeline: Record<string, { total_cost: number; by_service: Record<string, number> }>;
}

export interface ProductionStatsResponse {
  data: {
    daily_breakdown: Array<{ date: string; count: number; total_words: number }>;
  };
}

export interface CoverageStatsResponse {
  platforms: Array<{
    id: number;
    name: string;
    coverage: number;
    articles_count: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

export function useDashboardStats(platformId?: string) {
  const api = useApi();

  return useQuery<DashboardStats>({
    queryKey: statsKeys.dashboard(platformId),
    queryFn: async (): Promise<DashboardStats> => {
      const { data } = await api.get<DashboardStats>('/stats/dashboard', {
        params: { platform_id: platformId }
      });
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useCostStats(period = 'month') {
  const api = useApi();

  return useQuery<CostStatsResponse>({
    queryKey: statsKeys.costs(period),
    queryFn: async (): Promise<CostStatsResponse> => {
      const { data } = await api.get<CostStatsResponse>('/stats/costs', { params: { period } });
      return data;
    },
  });
}

export function useProductionStats(days = 7) {
  const api = useApi();

  return useQuery<ProductionStatsResponse>({
    queryKey: statsKeys.production(days),
    queryFn: async (): Promise<ProductionStatsResponse> => {
      const { data } = await api.get<ProductionStatsResponse>('/stats/production', { params: { days } });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCostsTimeline(days = 7) {
  const api = useApi();

  return useQuery<CostStatsResponse>({
    queryKey: statsKeys.costsTimeline(days),
    queryFn: async (): Promise<CostStatsResponse> => {
      const period = days <= 7 ? 'week' : days <= 30 ? 'month' : 'year';
      const { data } = await api.get<CostStatsResponse>('/stats/costs', { params: { period } });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface MonitoringErrorItem {
  id: string;
  message: string;
  created_at: string;
  context?: Record<string, unknown>;
}

interface MonitoringErrorsResponse {
  data: MonitoringErrorItem[];
}

export function useActivityStream(limit = 20) {
  const api = useApi();

  return useQuery<{ data: Activity[] }>({
    queryKey: statsKeys.activity(limit),
    queryFn: async (): Promise<{ data: Activity[] }> => {
      const { data } = await api.get<MonitoringErrorsResponse>('/monitoring/errors', { params: { limit } });
      // Transform monitoring data to activities format
      const activities: Activity[] = (data.data || []).map((item: MonitoringErrorItem, index: number) => ({
        id: item.id || `activity-${index}`,
        type: 'error' as const,
        title: 'Erreur système',
        description: item.message || 'Erreur inconnue',
        timestamp: item.created_at,
        metadata: item.context,
      }));
      return { data: activities };
    },
    refetchInterval: 10000,
  });
}

export function useCoverageStats() {
  const api = useApi();

  return useQuery<CoverageStatsResponse>({
    queryKey: statsKeys.coverage(),
    queryFn: async (): Promise<CoverageStatsResponse> => {
      const { data } = await api.get<CoverageStatsResponse>('/coverage/by-platform');
      return data;
    },
  });
}

export interface HeatmapItem {
  country_code: string;
  country_name: string;
  coverage: number;
  articles: number;
  flag?: string;
}

export function useCoverageHeatmap() {
  const api = useApi();

  return useQuery<{ data: HeatmapItem[] }>({
    queryKey: statsKeys.heatmap(),
    queryFn: async (): Promise<{ data: HeatmapItem[] }> => {
      const { data } = await api.get<{ data: HeatmapItem[] }>('/coverage/heatmap');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export interface GapItem {
  id: string;
  countryName?: string;
  country?: string;
  language: string;
  theme: string;
  priority: string;
  estimatedTraffic?: number;
}

export function useCoverageGaps(platformId?: string) {
  const api = useApi();

  return useQuery<{ data: GapItem[] }>({
    queryKey: statsKeys.gaps(platformId),
    queryFn: async (): Promise<{ data: GapItem[] }> => {
      const { data } = await api.get<{ data: GapItem[] }>('/coverage/gaps', {
        params: { platform_id: platformId }
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}