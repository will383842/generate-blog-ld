/**
 * useFactCheck Hook
 * AI-powered fact-checking for article content
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export interface FactCheckResult {
  id: string;
  articleId: number;
  status: FactCheckStatus;
  overallScore: number; // 0-100
  claims: FactCheckClaim[];
  sources: FactCheckSource[];
  summary: string;
  checkedAt: string;
  checkedBy: 'ai' | 'manual';
}

export type FactCheckStatus =
  | 'pending'
  | 'processing'
  | 'verified'
  | 'partially_verified'
  | 'unverified'
  | 'error';

export interface FactCheckClaim {
  id: string;
  text: string;
  location: {
    start: number;
    end: number;
    paragraph: number;
  };
  verdict: ClaimVerdict;
  confidence: number; // 0-100
  explanation: string;
  sources: string[]; // IDs referencing FactCheckSource
  suggestedCorrection?: string;
}

export type ClaimVerdict =
  | 'true'
  | 'mostly_true'
  | 'mixed'
  | 'mostly_false'
  | 'false'
  | 'unverifiable';

export interface FactCheckSource {
  id: string;
  url: string;
  title: string;
  domain: string;
  reliability: 'high' | 'medium' | 'low' | 'unknown';
  snippet?: string;
  accessedAt: string;
}

export interface FactCheckRequest {
  articleId: number;
  content?: string; // Optional, uses article content if not provided
  focusAreas?: string[]; // Specific claims to focus on
  thoroughness?: 'quick' | 'standard' | 'deep';
}

export interface FactCheckSettings {
  autoCheck: boolean;
  thoroughness: 'quick' | 'standard' | 'deep';
  minConfidence: number;
  trustedDomains: string[];
  blockedDomains: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const factCheckKeys = {
  all: ['fact-check'] as const,
  result: (articleId: number) => [...factCheckKeys.all, 'result', articleId] as const,
  history: (articleId: number) => [...factCheckKeys.all, 'history', articleId] as const,
  settings: () => [...factCheckKeys.all, 'settings'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchFactCheckResult(articleId: number): Promise<FactCheckResult | null> {
  try {
    const { data } = await api.get<FactCheckResult>(`/admin/articles/${articleId}/fact-check`);
    return data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) return null;
    }
    throw error;
  }
}

async function fetchFactCheckHistory(articleId: number): Promise<FactCheckResult[]> {
  const { data } = await api.get<FactCheckResult[]>(`/admin/articles/${articleId}/fact-check/history`);
  return data;
}

async function runFactCheck(request: FactCheckRequest): Promise<FactCheckResult> {
  const { data } = await api.post<FactCheckResult>(`/admin/articles/${request.articleId}/fact-check`, request);
  return data;
}

async function updateClaimVerdict(
  articleId: number,
  claimId: string,
  verdict: ClaimVerdict,
  explanation?: string
): Promise<FactCheckClaim> {
  const { data } = await api.put<FactCheckClaim>(`/admin/articles/${articleId}/fact-check/claims/${claimId}`, { verdict, explanation });
  return data;
}

async function fetchFactCheckSettings(): Promise<FactCheckSettings> {
  const { data } = await api.get<FactCheckSettings>('/admin/settings/fact-check');
  return data;
}

async function updateFactCheckSettings(settings: Partial<FactCheckSettings>): Promise<FactCheckSettings> {
  const { data } = await api.put<FactCheckSettings>('/admin/settings/fact-check', settings);
  return data;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get the latest fact-check result for an article
 */
export function useFactCheckResult(articleId: number) {
  return useQuery({
    queryKey: factCheckKeys.result(articleId),
    queryFn: () => fetchFactCheckResult(articleId),
    enabled: !!articleId,
    staleTime: 60000,
  });
}

/**
 * Get fact-check history for an article
 */
export function useFactCheckHistory(articleId: number) {
  return useQuery({
    queryKey: factCheckKeys.history(articleId),
    queryFn: () => fetchFactCheckHistory(articleId),
    enabled: !!articleId,
  });
}

/**
 * Run a fact-check on an article
 */
export function useRunFactCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runFactCheck,
    onSuccess: (result) => {
      queryClient.setQueryData(factCheckKeys.result(result.articleId), result);
      queryClient.invalidateQueries({ queryKey: factCheckKeys.history(result.articleId) });
    },
  });
}

/**
 * Update a claim's verdict manually
 */
export function useUpdateClaimVerdict(articleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, verdict, explanation }: {
      claimId: string;
      verdict: ClaimVerdict;
      explanation?: string;
    }) => updateClaimVerdict(articleId, claimId, verdict, explanation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factCheckKeys.result(articleId) });
    },
  });
}

/**
 * Get fact-check settings
 */
export function useFactCheckSettings() {
  return useQuery({
    queryKey: factCheckKeys.settings(),
    queryFn: fetchFactCheckSettings,
    staleTime: 300000,
  });
}

/**
 * Update fact-check settings
 */
export function useUpdateFactCheckSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFactCheckSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factCheckKeys.settings() });
    },
  });
}

/**
 * Get verdict color for UI
 */
export function getVerdictColor(verdict: ClaimVerdict): string {
  switch (verdict) {
    case 'true':
      return 'text-green-600 bg-green-50';
    case 'mostly_true':
      return 'text-green-500 bg-green-50';
    case 'mixed':
      return 'text-yellow-600 bg-yellow-50';
    case 'mostly_false':
      return 'text-orange-600 bg-orange-50';
    case 'false':
      return 'text-red-600 bg-red-50';
    case 'unverifiable':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
}

/**
 * Get verdict label for UI
 */
export function getVerdictLabel(verdict: ClaimVerdict): string {
  switch (verdict) {
    case 'true':
      return 'Vrai';
    case 'mostly_true':
      return 'Plutot vrai';
    case 'mixed':
      return 'Mitige';
    case 'mostly_false':
      return 'Plutot faux';
    case 'false':
      return 'Faux';
    case 'unverifiable':
      return 'Non verifiable';
    default:
      return 'Inconnu';
  }
}

export default useFactCheckResult;
