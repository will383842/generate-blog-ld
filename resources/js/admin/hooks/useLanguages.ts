// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGES HOOKS - 9 Languages Data Management
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApi';
import { LANGUAGES as STATIC_LANGUAGES } from '@/utils/constants';
import type { ApiResponse } from '@/types/common';
import api from '@/utils/api';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Language {
  id: string;
  code: string; // ISO 639-1
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  isActive: boolean;
  isDefault: boolean;
  articlesCount: number;
  coveragePercent: number;
  translationQuality?: number; // 0-100
}

export interface LanguageStats {
  totalLanguages: number;
  activeLanguages: number;
  totalArticles: number;
  averageCoverage: number;
  byLanguage: Record<string, {
    articles: number;
    coverage: number;
    lastGenerated?: string;
  }>;
}

export interface LanguageFilters {
  isActive?: boolean;
  hasArticles?: boolean;
  sortBy?: 'name' | 'code' | 'articlesCount' | 'coveragePercent';
  sortOrder?: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const languageKeys = {
  all: ['languages'] as const,
  list: (filters?: LanguageFilters) => [...languageKeys.all, 'list', filters] as const,
  detail: (code: string) => [...languageKeys.all, 'detail', code] as const,
  stats: () => [...languageKeys.all, 'stats'] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const API = {
  languages: '/admin/languages',
  language: (code: string) => `/admin/languages/${code}`,
  languagesStats: '/admin/languages/stats',
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all languages
 * Falls back to static data if API fails
 */
export function useLanguages(filters?: LanguageFilters) {
  const query = useApiQuery<ApiResponse<Language[]>>(
    languageKeys.list(filters),
    API.languages,
    {
      params: filters,
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - languages rarely change
      gcTime: 60 * 60 * 1000, // 1 hour cache
      retry: 1, // Only retry once since we have fallback
    }
  );

  // Fallback to static data if query fails or while loading
  const data = useMemo(() => {
    if (query.data?.data) {
      return query.data.data;
    }
    
    // Convert static languages to full Language type
    return STATIC_LANGUAGES.map((lang) => ({
      id: lang.code,
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flag: lang.flag,
      dir: lang.dir as 'ltr' | 'rtl',
      isActive: true,
      isDefault: lang.isDefault,
      articlesCount: 0,
      coveragePercent: 0,
    }));
  }, [query.data]);

  return {
    ...query,
    data: { data, success: true } as ApiResponse<Language[]>,
    languages: data,
  };
}

/**
 * Fetch single language details
 */
export function useLanguage(code: string | undefined) {
  return useApiQuery<ApiResponse<Language>>(
    languageKeys.detail(code || ''),
    API.language(code || ''),
    undefined,
    {
      enabled: !!code,
      staleTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Fetch languages statistics
 */
export function useLanguagesStats() {
  return useApiQuery<ApiResponse<LanguageStats>>(
    languageKeys.stats(),
    API.languagesStats,
    undefined,
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get active languages only
 */
export function useActiveLanguages() {
  const { languages, data: _apiData, ...rest } = useLanguages({ isActive: true });
  const active = languages.filter((l) => l.isActive);
  return { data: active, languages: active, ...rest };
}

/**
 * Get default language
 */
export function useDefaultLanguage(): Language | undefined {
  const { languages } = useLanguages();
  return languages.find((l) => l.isDefault);
}

/**
 * Get RTL languages
 */
export function useRTLLanguages(): Language[] {
  const { languages } = useLanguages();
  return languages.filter((l) => l.dir === 'rtl');
}

/**
 * Check if a language code is RTL
 */
export function useIsRTL(code: string | undefined): boolean {
  const { languages } = useLanguages();
  if (!code) return false;
  const lang = languages.find((l) => l.code === code);
  return lang?.dir === 'rtl';
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get language options for select dropdowns
 */
export function useLanguageOptions(filters?: LanguageFilters) {
  const { languages, isLoading } = useLanguages(filters);

  const options = useMemo(() => {
    return languages.map((lang) => ({
      value: lang.code,
      label: `${lang.flag} ${lang.nativeName}`,
      sublabel: lang.name,
      language: lang,
    }));
  }, [languages]);

  return { options, isLoading };
}

/**
 * Get language by code from cache
 */
export function useLanguageByCode(code: string | undefined): Language | undefined {
  const { languages } = useLanguages();
  if (!code) return undefined;
  return languages.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

/**
 * Get multiple languages by codes
 */
export function useLanguagesByCodes(codes: string[]): Language[] {
  const { languages } = useLanguages();
  const codesLower = codes.map((c) => c.toLowerCase());
  return languages.filter((l) => codesLower.includes(l.code.toLowerCase()));
}

/**
 * Format language for display
 */
export function useFormatLanguage(code: string | undefined): string {
  const lang = useLanguageByCode(code);
  if (!lang) return code || '';
  return `${lang.flag} ${lang.nativeName}`;
}

/**
 * Prefetch languages data
 */
export function usePrefetchLanguages() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: languageKeys.list(),
      queryFn: async () => {
        const { data } = await api.get<ApiResponse<Language[]>>(API.languages);
        return data;
      },
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);
}

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate if a language code is valid
 */
export function useValidateLanguageCode(code: string | undefined): boolean {
  const { languages } = useLanguages();
  if (!code) return false;
  return languages.some((l) => l.code.toLowerCase() === code.toLowerCase());
}

/**
 * Get language quality score
 * Higher score = better translation/content quality for this language
 */
export function useLanguageQuality(code: string | undefined): number {
  const lang = useLanguageByCode(code);
  if (!lang) return 0;
  
  // Default quality scores based on content availability
  const baseQuality: Record<string, number> = {
    'fr': 95, // French - primary language
    'en': 90, // English - widely supported
    'de': 85, // German - good support
    'es': 85, // Spanish - good support
    'pt': 80, // Portuguese - good support
    'ru': 70, // Russian - moderate
    'zh': 65, // Chinese - complex
    'ar': 60, // Arabic - RTL complexity
    'hi': 55, // Hindi - less content
  };

  return lang.translationQuality ?? baseQuality[lang.code] ?? 50;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & STATIC DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * All supported language codes
 */
export const LANGUAGE_CODES = STATIC_LANGUAGES.map((l) => l.code);

/**
 * Default language code
 */
export const DEFAULT_LANGUAGE_CODE = 
  STATIC_LANGUAGES.find((l) => l.isDefault)?.code || 'fr';

/**
 * RTL language codes
 */
export const RTL_LANGUAGE_CODES = 
  STATIC_LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code);

/**
 * Get language name by code (static, no hooks)
 */
export function getLanguageName(code: string): string {
  const lang = STATIC_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
  return lang?.name || code;
}

/**
 * Get language flag by code (static, no hooks)
 */
export function getLanguageFlag(code: string): string {
  const lang = STATIC_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
  return lang?.flag || '🏳️';
}

/**
 * Format language code to display string (static)
 */
export function formatLanguage(code: string): string {
  const lang = STATIC_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
  return lang ? `${lang.flag} ${lang.nativeName}` : code;
}