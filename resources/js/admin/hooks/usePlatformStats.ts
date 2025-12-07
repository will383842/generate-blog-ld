import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { usePlatformStore } from '@/stores/platformStore';
import type { LanguageCode } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════════
// Query Keys Factory
// ═══════════════════════════════════════════════════════════════

export const platformStatsKeys = {
  all: ['stats', 'platform'] as const,
  byPlatform: (platformId?: number) => [...platformStatsKeys.all, platformId] as const,
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CountryCoverage {
  countryCode: string;
  countryName: string;
  flag: string;
  totalArticles: number;
  publishedArticles: number;
  coveragePercent: number;
  languages: LanguageCode[];
  lastPublished: string | null;
}

interface TopCountry {
  countryCode: string;
  countryName: string;
  flag: string;
  articlesCount: number;
  growthPercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface ContentGap {
  id: string;
  countryCode: string;
  countryName: string;
  language: LanguageCode;
  theme: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTraffic: number;
  competitorCount: number;
}

interface DailyEvolution {
  date: string;
  articles: number;
  published: number;
  traffic: number;
  cost: number;
}

interface LanguageDistribution {
  language: LanguageCode;
  languageName: string;
  flag: string;
  articlesCount: number;
  percent: number;
}

interface PlatformStats {
  overview: {
    totalArticles: number;
    totalCountries: number;
    totalLanguages: number;
    avgCoveragePercent: number;
  };
  countryCoverage: CountryCoverage[];
  topCountries: TopCountry[];
  gaps: ContentGap[];
  evolution: DailyEvolution[];
  languageDistribution: LanguageDistribution[];
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const REFRESH_INTERVAL = 60 * 1000; // 60 seconds
const STALE_TIME = 55 * 1000; // 55 seconds
const EVOLUTION_DAYS = 30;

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════

export function usePlatformStats() {
  const { activePlatform } = usePlatformStore();

  const query = useQuery<PlatformStats>({
    queryKey: platformStatsKeys.byPlatform(activePlatform?.id),
    queryFn: async (): Promise<PlatformStats> => {
      const response = await api.get<PlatformStats>('/admin/stats/platform', {
        params: { 
          platform_id: activePlatform?.id,
          evolution_days: EVOLUTION_DAYS
        }
      });
      return response.data;
    },
    enabled: !!activePlatform?.id,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true
  });

  // ─────────────────────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────────────────────

  // Countries with low coverage (< 30%)
  const lowCoverageCountries = useMemo(() => {
    if (!query.data?.countryCoverage) return [];
    return query.data.countryCoverage
      .filter(c => c.coveragePercent < 30)
      .sort((a, b) => a.coveragePercent - b.coveragePercent)
      .slice(0, 10);
  }, [query.data?.countryCoverage]);

  // High priority gaps
  const highPriorityGaps = useMemo(() => {
    if (!query.data?.gaps) return [];
    return query.data.gaps
      .filter(g => g.priority === 'high')
      .slice(0, 5);
  }, [query.data?.gaps]);

  // Total gaps count
  const totalGapsCount = query.data?.gaps.length ?? 0;

  // Evolution trends (compare last 7 days vs previous 7 days)
  const evolutionTrend = useMemo(() => {
    if (!query.data?.evolution || query.data.evolution.length < 14) {
      return { articles: 0, traffic: 0, direction: 'stable' as const };
    }

    const evolution = query.data.evolution;
    const recent = evolution.slice(-7);
    const previous = evolution.slice(-14, -7);

    const recentTotal = recent.reduce((sum, d) => sum + d.articles, 0);
    const previousTotal = previous.reduce((sum, d) => sum + d.articles, 0);

    const change = previousTotal > 0 
      ? ((recentTotal - previousTotal) / previousTotal) * 100 
      : 0;

    return {
      articles: change,
      traffic: 0, // Could calculate similarly
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    };
  }, [query.data?.evolution]);

  return {
    // Data
    stats: query.data,
    overview: query.data?.overview ?? null,
    countryCoverage: query.data?.countryCoverage ?? [],
    topCountries: query.data?.topCountries ?? [],
    gaps: query.data?.gaps ?? [],
    evolution: query.data?.evolution ?? [],
    languageDistribution: query.data?.languageDistribution ?? [],
    
    // Derived
    lowCoverageCountries,
    highPriorityGaps,
    totalGapsCount,
    evolutionTrend,
    
    // Platform info
    platform: activePlatform,
    
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
// SPECIFIC HOOKS
// ═══════════════════════════════════════════════════════════════

export function useCountryCoverage() {
  const { countryCoverage, lowCoverageCountries, isLoading, isError, refetch } = usePlatformStats();
  return { coverage: countryCoverage, lowCoverage: lowCoverageCountries, isLoading, isError, refetch };
}

export function useTopCountries(limit: number = 10) {
  const { topCountries, isLoading, isError, refetch } = usePlatformStats();
  return { 
    countries: topCountries.slice(0, limit), 
    isLoading, 
    isError, 
    refetch 
  };
}

export function useContentGaps() {
  const { gaps, highPriorityGaps, totalGapsCount, isLoading, isError, refetch } = usePlatformStats();
  return { 
    gaps, 
    highPriority: highPriorityGaps, 
    totalCount: totalGapsCount, 
    isLoading, 
    isError, 
    refetch 
  };
}

export function useEvolutionStats() {
  const { evolution, evolutionTrend, isLoading, isError, refetch } = usePlatformStats();
  return { 
    evolution, 
    trend: evolutionTrend, 
    isLoading, 
    isError, 
    refetch 
  };
}

export function useLanguageDistribution() {
  const { languageDistribution, isLoading, isError, refetch } = usePlatformStats();
  return { 
    distribution: languageDistribution, 
    isLoading, 
    isError, 
    refetch 
  };
}