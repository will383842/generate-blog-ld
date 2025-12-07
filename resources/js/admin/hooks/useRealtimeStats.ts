import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { usePlatformStore } from '@/stores/platformStore';

// ═══════════════════════════════════════════════════════════════
// Query Keys Factory
// ═══════════════════════════════════════════════════════════════

export const realtimeStatsKeys = {
  all: ['stats', 'realtime'] as const,
  byPlatform: (platformId?: number) => [...realtimeStatsKeys.all, platformId] as const,
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ArticleStats {
  total: number;
  today: number;
  week: number;
  month: number;
  byStatus: {
    draft: number;
    pending: number;
    published: number;
    failed: number;
  };
}

interface CostStats {
  today: number;
  week: number;
  month: number;
  budgetTotal: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number; // seconds
}

interface CoverageStats {
  totalCountries: number;
  coveredCountries: number;
  coveragePercent: number;
  totalLanguages: number;
  activeLanguages: number;
}

interface RealtimeStats {
  articles: ArticleStats;
  costs: CostStats;
  queue: QueueStats;
  coverage: CoverageStats;
  lastUpdated: string;
}

interface BudgetAlert {
  level: 'none' | 'warning' | 'danger' | 'critical';
  percent: number;
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds
const STALE_TIME = 25 * 1000; // 25 seconds

const BUDGET_THRESHOLDS = {
  warning: 80,
  danger: 90,
  critical: 100
};

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════

export function useRealtimeStats() {
  const { activePlatform } = usePlatformStore();

  const query = useQuery<RealtimeStats>({
    queryKey: realtimeStatsKeys.byPlatform(activePlatform?.id),
    queryFn: async (): Promise<RealtimeStats> => {
      const response = await api.get<RealtimeStats>('/stats/realtime', {
        params: { platform_id: activePlatform?.id }
      });
      return response.data;
    },
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true
  });

  // ─────────────────────────────────────────────────────────────
  // BUDGET ALERT CALCULATION
  // ─────────────────────────────────────────────────────────────

  const budgetAlert = useMemo((): BudgetAlert => {
    if (!query.data) {
      return { level: 'none', percent: 0, message: '' };
    }

    const { budgetUsedPercent } = query.data.costs;

    if (budgetUsedPercent >= BUDGET_THRESHOLDS.critical) {
      return {
        level: 'critical',
        percent: budgetUsedPercent,
        message: 'Budget épuisé ! La génération est suspendue.'
      };
    }

    if (budgetUsedPercent >= BUDGET_THRESHOLDS.danger) {
      return {
        level: 'danger',
        percent: budgetUsedPercent,
        message: `Attention : ${budgetUsedPercent.toFixed(0)}% du budget utilisé`
      };
    }

    if (budgetUsedPercent >= BUDGET_THRESHOLDS.warning) {
      return {
        level: 'warning',
        percent: budgetUsedPercent,
        message: `${budgetUsedPercent.toFixed(0)}% du budget mensuel utilisé`
      };
    }

    return { level: 'none', percent: budgetUsedPercent, message: '' };
  }, [query.data]);

  // ─────────────────────────────────────────────────────────────
  // DERIVED STATS
  // ─────────────────────────────────────────────────────────────

  const queueTotal = useMemo(() => {
    if (!query.data) return 0;
    const { pending, processing } = query.data.queue;
    return pending + processing;
  }, [query.data]);

  const hasQueueItems = queueTotal > 0;
  const hasFailedItems = (query.data?.queue.failed ?? 0) > 0;

  return {
    // Data
    stats: query.data,
    articles: query.data?.articles ?? null,
    costs: query.data?.costs ?? null,
    queue: query.data?.queue ?? null,
    coverage: query.data?.coverage ?? null,
    
    // Derived
    budgetAlert,
    queueTotal,
    hasQueueItems,
    hasFailedItems,
    
    // Query state
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
    lastUpdated: query.data?.lastUpdated ?? null
  };
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL STAT HOOKS (pour composants spécifiques)
// ═══════════════════════════════════════════════════════════════

export function useArticleStats() {
  const { articles, isLoading, isError, refetch } = useRealtimeStats();
  return { stats: articles, isLoading, isError, refetch };
}

export function useCostStats() {
  const { costs, budgetAlert, isLoading, isError, refetch } = useRealtimeStats();
  return { stats: costs, budgetAlert, isLoading, isError, refetch };
}

export function useQueueStats() {
  const { queue, queueTotal, hasQueueItems, hasFailedItems, isLoading, isError, refetch } = useRealtimeStats();
  return { stats: queue, queueTotal, hasQueueItems, hasFailedItems, isLoading, isError, refetch };
}

export function useCoverageStats() {
  const { coverage, isLoading, isError, refetch } = useRealtimeStats();
  return { stats: coverage, isLoading, isError, refetch };
}