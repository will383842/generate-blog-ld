/**
 * INTELLIGENT COVERAGE - REACT QUERY HOOKS
 * 
 * Hooks pour les appels API du système de couverture intelligent
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  ApiResponse,
  CoverageDashboard,
  CountryCoverageScore,
  CountryListItem,
  LanguageStats,
  Recommendation,
  CoverageMatrix,
  GenerationPlan,
  GenerationRequest,
  CoverageFilters,
  RecommendationFilters,
  FounderGlobalData,
  RecruitmentBreakdown,
  AwarenessBreakdown,
  FounderBreakdown,
  SpecialtyBreakdown,
} from '@/types/intelligentCoverage';

const API_BASE = '/admin/coverage/intelligent';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const intelligentCoverageKeys = {
  all: ['coverage'] as const,
  dashboard: (platformId: number) => [...intelligentCoverageKeys.all, 'dashboard', platformId] as const,
  countries: (filters: CoverageFilters) => [...intelligentCoverageKeys.all, 'countries', filters] as const,
  country: (platformId: number, countryId: number | null) => [...intelligentCoverageKeys.all, 'country', platformId, countryId] as const,
  countryRecruitment: (platformId: number, countryId: number | null) => [...intelligentCoverageKeys.all, 'country', 'recruitment', platformId, countryId] as const,
  countryAwareness: (platformId: number, countryId: number | null) => [...intelligentCoverageKeys.all, 'country', 'awareness', platformId, countryId] as const,
  countryFounder: (countryId: number | null) => [...intelligentCoverageKeys.all, 'country', 'founder', countryId] as const,
  founderGlobal: () => [...intelligentCoverageKeys.all, 'founder', 'global'] as const,
  languages: (platformId: number) => [...intelligentCoverageKeys.all, 'languages', platformId] as const,
  specialties: (platformId: number, type?: string) => [...intelligentCoverageKeys.all, 'specialties', platformId, type] as const,
  recommendations: (filters: RecommendationFilters) => [...intelligentCoverageKeys.all, 'recommendations', filters] as const,
  matrix: (platformId: number, type: string, region?: string) => [...intelligentCoverageKeys.all, 'matrix', platformId, type, region] as const,
};

// ============================================================================
// DASHBOARD
// ============================================================================

export function useCoverageDashboard(platformId: number = 1) {
  return useQuery({
    queryKey: intelligentCoverageKeys.dashboard(platformId),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<CoverageDashboard>>(
        `${API_BASE}/dashboard`,
        { params: { platform_id: platformId } }
      );
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================================
// COUNTRIES
// ============================================================================

export function useCoverageCountries(filters: CoverageFilters = {}) {
  return useQuery({
    queryKey: intelligentCoverageKeys.countries(filters),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<CountryListItem[]>>(
        `${API_BASE}/countries`,
        { params: filters }
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCountryDetails(platformId: number, countryId: number | null) {
  return useQuery({
    queryKey: intelligentCoverageKeys.country(platformId, countryId),
    queryFn: async () => {
      if (!countryId) return null;
      const response = await axios.get<ApiResponse<CountryCoverageScore>>(
        `${API_BASE}/countries/${countryId}`,
        { params: { platform_id: platformId } }
      );
      return response.data;
    },
    enabled: !!countryId,
    staleTime: 60 * 1000,
  });
}

export function useCountryRecruitment(platformId: number, countryId: number | null) {
  return useQuery({
    queryKey: intelligentCoverageKeys.countryRecruitment(platformId, countryId),
    queryFn: async () => {
      if (!countryId) return null;
      const response = await axios.get<ApiResponse<RecruitmentBreakdown>>(
        `${API_BASE}/countries/${countryId}/recruitment`,
        { params: { platform_id: platformId } }
      );
      return response.data;
    },
    enabled: !!countryId,
    staleTime: 60 * 1000,
  });
}

export function useCountryAwareness(platformId: number, countryId: number | null) {
  return useQuery({
    queryKey: intelligentCoverageKeys.countryAwareness(platformId, countryId),
    queryFn: async () => {
      if (!countryId) return null;
      const response = await axios.get<ApiResponse<AwarenessBreakdown>>(
        `${API_BASE}/countries/${countryId}/awareness`,
        { params: { platform_id: platformId } }
      );
      return response.data;
    },
    enabled: !!countryId,
    staleTime: 60 * 1000,
  });
}

export function useCountryFounder(countryId: number | null) {
  return useQuery({
    queryKey: intelligentCoverageKeys.countryFounder(countryId),
    queryFn: async () => {
      if (!countryId) return null;
      const response = await axios.get<ApiResponse<FounderBreakdown>>(
        `${API_BASE}/countries/${countryId}/founder`
      );
      return response.data;
    },
    enabled: !!countryId,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// FOUNDER (WILLIAMS JULLIN)
// ============================================================================

export function useFounderGlobal() {
  return useQuery({
    queryKey: intelligentCoverageKeys.founderGlobal(),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<FounderGlobalData>>(
        `${API_BASE}/founder`
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// LANGUAGES
// ============================================================================

export function useCoverageLanguages(platformId: number = 1) {
  return useQuery({
    queryKey: intelligentCoverageKeys.languages(platformId),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<Record<string, LanguageStats>>>(
        `${API_BASE}/languages`,
        { params: { platform_id: platformId } }
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// SPECIALTIES
// ============================================================================

export function useCoverageSpecialties(platformId: number = 1, type?: string) {
  return useQuery({
    queryKey: intelligentCoverageKeys.specialties(platformId, type),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<SpecialtyBreakdown>>(
        `${API_BASE}/specialties`,
        { params: { platform_id: platformId, type } }
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export function useCoverageRecommendations(filters: RecommendationFilters = {}) {
  return useQuery({
    queryKey: intelligentCoverageKeys.recommendations(filters),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<Recommendation[]>>(
        `${API_BASE}/recommendations`,
        { params: filters }
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// MATRIX
// ============================================================================

export function useCoverageMatrix(platformId: number = 1, type: string = 'language', region?: string) {
  return useQuery({
    queryKey: intelligentCoverageKeys.matrix(platformId, type, region),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<CoverageMatrix>>(
        `${API_BASE}/matrix`,
        { params: { platform_id: platformId, type, region } }
      );
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// GENERATION
// ============================================================================

export function useGenerateMissingContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: GenerationRequest) => {
      const response = await axios.post<ApiResponse<GenerationPlan>>(
        `${API_BASE}/generate`,
        request
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalider le cache après génération
      queryClient.invalidateQueries({ queryKey: intelligentCoverageKeys.all });
    },
  });
}

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

export function useInvalidateCoverageCache() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { platform_id?: number; country_id?: number } = {}) => {
      const response = await axios.post<ApiResponse<{ message: string }>>(
        `${API_BASE}/invalidate-cache`,
        params
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intelligentCoverageKeys.all });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook pour obtenir les pays prioritaires
 */
export function usePriorityCountries(platformId: number = 1, limit: number = 10) {
  const { data, ...rest } = useCoverageDashboard(platformId);
  
  return {
    ...rest,
    data: data?.data?.priority_countries?.slice(0, limit) || [],
  };
}

/**
 * Hook pour obtenir les recommandations critiques
 */
export function useCriticalRecommendations(platformId: number = 1, limit: number = 5) {
  const { data, ...rest } = useCoverageRecommendations({
    platform_id: platformId,
    priority: 'critical',
    limit,
  });
  
  return {
    ...rest,
    data: data?.data || [],
  };
}

/**
 * Hook pour obtenir un résumé de la couverture
 */
export function useCoverageSummary(platformId: number = 1) {
  const { data, ...rest } = useCoverageDashboard(platformId);
  
  return {
    ...rest,
    data: data?.data?.summary || null,
    distribution: data?.data?.distribution || null,
  };
}

/**
 * Hook pour la recherche de pays
 */
export function useSearchCountries(platformId: number, search: string) {
  return useCoverageCountries({
    platform_id: platformId,
    search: search.length >= 2 ? search : undefined,
    per_page: 20,
  });
}

/**
 * Hook pour obtenir les top pays
 */
export function useTopCountries(platformId: number = 1, limit: number = 10) {
  const { data, ...rest } = useCoverageDashboard(platformId);
  
  return {
    ...rest,
    data: data?.data?.top_countries?.slice(0, limit) || [],
  };
}

/**
 * Hook pour obtenir les statistiques de distribution
 */
export function useCoverageDistribution(platformId: number = 1) {
  const { data, ...rest } = useCoverageDashboard(platformId);
  
  return {
    ...rest,
    data: data?.data?.distribution || null,
    total: data?.data?.total_countries || 0,
  };
}
