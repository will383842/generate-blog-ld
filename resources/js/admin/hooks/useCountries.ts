// ═══════════════════════════════════════════════════════════════════════════
// COUNTRIES HOOKS - 197 Countries Data Management (AVEC FALLBACK STATIQUE)
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from './useApi';
import { STATIC_COUNTRIES, type StaticCountry, formatLocale } from '@/utils/staticCountries';
import type { ApiResponse } from '@/types/common';
import api from '@/utils/api';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 3166-1 alpha-2
  code3: string; // ISO 3166-1 alpha-3
  flag: string; // Emoji flag
  region: Region;
  continent: Continent;
  capital?: string;
  timezone?: string;
  isActive: boolean;
  articlesCount: number;
  coveragePercent: number;
}

export type Continent = 
  | 'Africa'
  | 'Antarctica'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America';

export type Region = 
  | 'Northern Africa'
  | 'Sub-Saharan Africa'
  | 'Central Asia'
  | 'Eastern Asia'
  | 'South-Eastern Asia'
  | 'Southern Asia'
  | 'Western Asia'
  | 'Eastern Europe'
  | 'Northern Europe'
  | 'Southern Europe'
  | 'Western Europe'
  | 'Caribbean'
  | 'Central America'
  | 'Northern America'
  | 'South America'
  | 'Australia and New Zealand'
  | 'Melanesia'
  | 'Micronesia'
  | 'Polynesia';

export interface CountryFilters {
  search?: string;
  continent?: Continent | Continent[];
  region?: Region | Region[];
  isActive?: boolean;
  hasCoverage?: boolean;
  sortBy?: 'name' | 'code' | 'articlesCount' | 'coveragePercent';
  sortOrder?: 'asc' | 'desc';
}

export interface CountryStats {
  totalCountries: number;
  activeCountries: number;
  coveredCountries: number;
  totalArticles: number;
  averageCoverage: number;
  byContinent: Record<Continent, { count: number; coverage: number }>;
  byRegion: Record<Region, { count: number; coverage: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const countryKeys = {
  all: ['countries'] as const,
  list: (filters?: CountryFilters) => [...countryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...countryKeys.all, 'detail', id] as const,
  byRegion: (region: Region) => [...countryKeys.all, 'region', region] as const,
  byContinent: (continent: Continent) => [...countryKeys.all, 'continent', continent] as const,
  stats: () => [...countryKeys.all, 'stats'] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const API = {
  countries: '/admin/countries',
  country: (id: string) => `/admin/countries/${id}`,
  countriesByRegion: (region: string) => `/admin/countries/region/${region}`,
  countriesByContinent: (continent: string) => `/admin/countries/continent/${continent}`,
  countriesStats: '/admin/countries/stats',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Convert static data to Country type
// ═══════════════════════════════════════════════════════════════════════════

function staticToCountry(staticCountry: StaticCountry): Country {
  return {
    id: staticCountry.code,
    name: staticCountry.name,
    code: staticCountry.code,
    code3: staticCountry.code3,
    flag: staticCountry.flag,
    region: staticCountry.region as Region,
    continent: staticCountry.continent as Continent,
    isActive: true,
    articlesCount: 0,
    coveragePercent: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all countries with optional filters
 * INCLUDES FALLBACK TO STATIC DATA IF API FAILS
 */
export function useCountries(filters?: CountryFilters) {
  const query = useApiQuery<ApiResponse<Country[]>>(
    countryKeys.list(filters),
    API.countries,
    {
      params: filters,
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes cache
      retry: 1, // Only retry once since we have fallback
    }
  );

  // FALLBACK: Use static data if API fails or returns empty
  const data = useMemo(() => {
    if (query.data?.data && query.data.data.length > 0) {
      return query.data.data;
    }
    
    // Convert static countries to Country type
    let countries = STATIC_COUNTRIES.map(staticToCountry);
    
    // Apply filters if provided
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      countries = countries.filter(
        c => c.name.toLowerCase().includes(searchLower) ||
             c.code.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters?.continent) {
      const continents = Array.isArray(filters.continent) 
        ? filters.continent 
        : [filters.continent];
      countries = countries.filter(c => continents.includes(c.continent));
    }
    
    if (filters?.region) {
      const regions = Array.isArray(filters.region) 
        ? filters.region 
        : [filters.region];
      countries = countries.filter(c => regions.includes(c.region));
    }
    
    // Sort
    if (filters?.sortBy) {
      countries.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * order;
        }
        return ((aVal as number) - (bVal as number)) * order;
      });
    }
    
    return countries;
  }, [query.data, filters]);

  return {
    ...query,
    data: { data, success: true } as ApiResponse<Country[]>,
    countries: data,
    isUsingFallback: !query.data?.data || query.data.data.length === 0,
  };
}

/**
 * Fetch single country details
 */
export function useCountry(id: string | undefined) {
  return useApiQuery<ApiResponse<Country>>(
    countryKeys.detail(id || ''),
    API.country(id || ''),
    undefined,
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Fetch countries by region
 */
export function useCountriesByRegion(region: Region | undefined) {
  return useApiQuery<ApiResponse<Country[]>>(
    countryKeys.byRegion(region || '' as Region),
    API.countriesByRegion(region || ''),
    undefined,
    {
      enabled: !!region,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Fetch countries by continent
 */
export function useCountriesByContinent(continent: Continent | undefined) {
  return useApiQuery<ApiResponse<Country[]>>(
    countryKeys.byContinent(continent || '' as Continent),
    API.countriesByContinent(continent || ''),
    undefined,
    {
      enabled: !!continent,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Fetch countries statistics
 */
export function useCountriesStats() {
  return useApiQuery<ApiResponse<CountryStats>>(
    countryKeys.stats(),
    API.countriesStats,
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
 * Get countries grouped by continent
 */
export function useCountriesByContinent_Grouped() {
  const { countries, ...rest } = useCountries();

  const grouped = useMemo(() => {
    return countries.reduce((acc, country) => {
      const continent = country.continent;
      if (!acc[continent]) {
        acc[continent] = [];
      }
      acc[continent].push(country);
      return acc;
    }, {} as Record<Continent, Country[]>);
  }, [countries]);

  return { data: grouped, ...rest };
}

/**
 * Get countries grouped by region
 */
export function useCountriesByRegion_Grouped() {
  const { countries, ...rest } = useCountries();

  const grouped = useMemo(() => {
    return countries.reduce((acc, country) => {
      const region = country.region;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(country);
      return acc;
    }, {} as Record<Region, Country[]>);
  }, [countries]);

  return { data: grouped, ...rest };
}

/**
 * Search countries by name or code
 */
export function useSearchCountries(query: string, limit?: number) {
  const { countries, ...rest } = useCountries();

  const results = useMemo(() => {
    if (!query) return [];
    
    const searchLower = query.toLowerCase();
    const filtered = countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase().includes(searchLower) ||
        country.code3.toLowerCase().includes(searchLower)
    );

    // Sort by relevance
    filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      if (aName === searchLower) return -1;
      if (bName === searchLower) return 1;
      if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
      if (!aName.startsWith(searchLower) && bName.startsWith(searchLower)) return 1;
      return aName.localeCompare(bName);
    });

    return limit ? filtered.slice(0, limit) : filtered;
  }, [countries, query, limit]);

  return { data: results, ...rest };
}

/**
 * Get active countries only
 */
export function useActiveCountries() {
  const { countries, ...rest } = useCountries({ isActive: true });
  return { data: countries, ...rest };
}

/**
 * Get countries with coverage
 */
export function useCoveredCountries() {
  const { countries, ...rest } = useCountries({ hasCoverage: true });
  return { data: countries.filter(c => c.coveragePercent > 0), ...rest };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get country options for select dropdowns
 */
export function useCountryOptions(filters?: CountryFilters) {
  const { countries, isLoading } = useCountries(filters);

  const options = useMemo(() => {
    return countries.map((country) => ({
      value: country.code,
      label: `${country.flag} ${country.name}`,
      searchLabel: `${country.name} ${country.code}`,
      country,
    }));
  }, [countries]);

  return { options, isLoading };
}

/**
 * Get grouped country options (by continent)
 */
export function useGroupedCountryOptions() {
  const { countries, isLoading } = useCountries();

  const groups = useMemo(() => {
    const grouped = countries.reduce((acc, country) => {
      const continent = country.continent;
      if (!acc[continent]) {
        acc[continent] = [];
      }
      acc[continent].push({
        value: country.code,
        label: `${country.flag} ${country.name}`,
        country,
      });
      return acc;
    }, {} as Record<string, Array<{ value: string; label: string; country: Country }>>);

    return Object.entries(grouped).map(([continent, options]) => ({
      label: continent,
      options: options.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [countries]);

  return { groups, isLoading };
}

/**
 * Get country by code
 */
export function useCountryByCode(code: string | undefined): Country | undefined {
  const { countries } = useCountries();
  
  if (!code) return undefined;
  return countries.find(
    (c) => c.code.toLowerCase() === code.toLowerCase() ||
           c.code3.toLowerCase() === code.toLowerCase()
  );
}

/**
 * Format locale for country/language combination
 */
export function useFormatLocale(languageCode: string, countryCode: string): string {
  return formatLocale(languageCode, countryCode);
}

/**
 * Prefetch countries data
 */
export function usePrefetchCountries() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: countryKeys.list(),
      queryFn: async () => {
        const { data } = await api.get<ApiResponse<Country[]>>(API.countries);
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
];

export const CONTINENT_LABELS: Record<Continent, string> = {
  'Africa': 'Afrique',
  'Antarctica': 'Antarctique',
  'Asia': 'Asie',
  'Europe': 'Europe',
  'North America': 'Amérique du Nord',
  'Oceania': 'Océanie',
  'South America': 'Amérique du Sud',
};

export const REGIONS: Region[] = [
  'Northern Africa',
  'Sub-Saharan Africa',
  'Central Asia',
  'Eastern Asia',
  'South-Eastern Asia',
  'Southern Asia',
  'Western Asia',
  'Eastern Europe',
  'Northern Europe',
  'Southern Europe',
  'Western Europe',
  'Caribbean',
  'Central America',
  'Northern America',
  'South America',
  'Australia and New Zealand',
  'Melanesia',
  'Micronesia',
  'Polynesia',
];

export const REGION_TO_CONTINENT: Record<Region, Continent> = {
  'Northern Africa': 'Africa',
  'Sub-Saharan Africa': 'Africa',
  'Central Asia': 'Asia',
  'Eastern Asia': 'Asia',
  'South-Eastern Asia': 'Asia',
  'Southern Asia': 'Asia',
  'Western Asia': 'Asia',
  'Eastern Europe': 'Europe',
  'Northern Europe': 'Europe',
  'Southern Europe': 'Europe',
  'Western Europe': 'Europe',
  'Caribbean': 'North America',
  'Central America': 'North America',
  'Northern America': 'North America',
  'South America': 'South America',
  'Australia and New Zealand': 'Oceania',
  'Melanesia': 'Oceania',
  'Micronesia': 'Oceania',
  'Polynesia': 'Oceania',
};
