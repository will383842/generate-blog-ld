/**
 * Coverage Types
 * Content coverage analysis across countries, languages, and themes
 */

import type { PlatformId, ContentTypeId, LanguageCode } from './program';

// ============================================================================
// COVERAGE DATA
// ============================================================================

export interface CoverageData {
  countryId: string;
  languageId: LanguageCode;
  contentType: ContentTypeId;
  platformId: PlatformId;
  
  // Counts
  count: number;
  target: number;
  
  // Percentage
  percentage: number;
  
  // Status
  status: CoverageStatus;
  
  // Trends
  trend: 'up' | 'down' | 'stable';
  previousCount?: number;
  changePercent?: number;
}

export type CoverageStatus = 'complete' | 'partial' | 'minimal' | 'missing';

// ============================================================================
// COVERAGE SUMMARY
// ============================================================================

export interface CoverageSummary {
  // Global stats
  totalCountries: number;
  coveredCountries: number;
  totalLanguages: number;
  coveredLanguages: number;
  totalContentTypes: number;
  
  // Overall percentage
  globalPercentage: number;
  
  // By dimension
  byPlatform: Record<PlatformId, PlatformCoverage>;
  byCountry: Record<string, CountryCoverage>;
  byLanguage: Record<LanguageCode, LanguageCoverage>;
  byContentType: Record<ContentTypeId, ContentTypeCoverage>;
  byTheme: Record<string, ThemeCoverage>;
  
  // Trends
  weeklyChange: number;
  monthlyChange: number;
}

export interface PlatformCoverage {
  platformId: PlatformId;
  totalArticles: number;
  coveredCountries: number;
  coveredLanguages: number;
  percentage: number;
}

export interface CountryCoverage {
  countryId: string;
  countryName: string;
  region: string;
  totalArticles: number;
  byLanguage: Record<LanguageCode, number>;
  byContentType: Record<ContentTypeId, number>;
  percentage: number;
  missingTypes: ContentTypeId[];
  missingLanguages: LanguageCode[];
  priority: CoveragePriority;
}

export interface LanguageCoverage {
  languageId: LanguageCode;
  languageName: string;
  totalArticles: number;
  coveredCountries: number;
  percentage: number;
}

export interface ContentTypeCoverage {
  contentType: ContentTypeId;
  totalArticles: number;
  coveredCountries: number;
  coveredLanguages: number;
  percentage: number;
}

export interface ThemeCoverage {
  themeId: string;
  themeName: string;
  totalArticles: number;
  byCountry: Record<string, number>;
  byLanguage: Record<LanguageCode, number>;
  percentage: number;
}

// ============================================================================
// COVERAGE GAPS
// ============================================================================

export interface CoverageGap {
  id: string;
  
  // Context
  countryId: string;
  countryName: string;
  languageId: LanguageCode;
  contentType?: ContentTypeId;
  themeId?: string;
  platformId: PlatformId;
  
  // Analysis
  priority: CoveragePriority;
  priorityScore: number; // 0-100
  
  // Suggestions
  suggestedThemes: string[];
  suggestedTitles: string[];
  
  // Estimation
  estimatedArticles: number;
  estimatedCost: number;
  estimatedDuration: string;
  
  // Reasons
  reasons: GapReason[];
  
  createdAt: string;
}

export type CoveragePriority = 'critical' | 'high' | 'medium' | 'low';

export type GapReason = 
  | 'no_content'
  | 'missing_language'
  | 'missing_type'
  | 'outdated_content'
  | 'competitor_gap'
  | 'traffic_opportunity'
  | 'user_requested';

// ============================================================================
// COVERAGE OBJECTIVES
// ============================================================================

export interface CoverageObjective {
  id: string;
  
  // Scope
  countryId?: string;
  languageId?: LanguageCode;
  contentType?: ContentTypeId;
  themeId?: string;
  platformId?: PlatformId;
  
  // Target
  target: number;
  current: number;
  baseline: number; // Starting point when objective was created
  
  // Progress
  percentage: number;
  status: ObjectiveStatus;
  
  // Timeline
  deadline: string;
  createdAt: string;
  updatedAt: string;
  
  // Metadata
  name: string;
  description?: string;
  createdBy: string;
  
  // History
  history: ObjectiveProgress[];
}

export type ObjectiveStatus = 'not_started' | 'on_track' | 'behind' | 'at_risk' | 'achieved' | 'cancelled';

export interface ObjectiveProgress {
  date: string;
  value: number;
  note?: string;
}

export interface CreateObjectiveInput {
  name: string;
  description?: string;
  countryId?: string;
  languageId?: LanguageCode;
  contentType?: ContentTypeId;
  themeId?: string;
  platformId?: PlatformId;
  target: number;
  deadline: string;
}

export interface UpdateObjectiveInput {
  name?: string;
  description?: string;
  target?: number;
  deadline?: string;
  status?: ObjectiveStatus;
}

// ============================================================================
// COVERAGE MATRIX
// ============================================================================

export interface CoverageMatrixConfig {
  rowAxis: 'country' | 'language' | 'contentType' | 'theme';
  colAxis: 'country' | 'language' | 'contentType' | 'theme';
  valueType: 'count' | 'percentage';
  platformId?: PlatformId;
}

export interface CoverageMatrixCell {
  rowId: string;
  colId: string;
  value: number;
  percentage: number;
  status: CoverageStatus;
}

export interface CoverageMatrixData {
  config: CoverageMatrixConfig;
  rows: { id: string; label: string }[];
  cols: { id: string; label: string }[];
  cells: CoverageMatrixCell[];
  totals: {
    byRow: Record<string, number>;
    byCol: Record<string, number>;
    overall: number;
  };
}

// ============================================================================
// FILTERS
// ============================================================================

export interface CoverageFilters {
  platformId?: PlatformId;
  countryIds?: string[];
  languageIds?: LanguageCode[];
  contentTypes?: ContentTypeId[];
  themeIds?: string[];
  region?: string;
  status?: CoverageStatus[];
  priority?: CoveragePriority[];
  minPercentage?: number;
  maxPercentage?: number;
}

export interface GapFilters extends CoverageFilters {
  sortBy?: 'priority' | 'country' | 'language' | 'estimatedCost';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface CoverageGlobalResponse {
  summary: CoverageSummary;
  topCountries: CountryCoverage[];
  bottomCountries: CountryCoverage[];
  recentProgress: { date: string; count: number }[];
}

export interface CoverageGapsResponse {
  data: CoverageGap[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
    totalByCritical: number;
    totalByHigh: number;
    totalByMedium: number;
    totalByLow: number;
  };
}

export interface CoverageObjectivesResponse {
  data: CoverageObjective[];
  meta: {
    total: number;
    achieved: number;
    onTrack: number;
    behind: number;
    atRisk: number;
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

export function getCoverageStatus(percentage: number): CoverageStatus {
  if (percentage >= 90) return 'complete';
  if (percentage >= 50) return 'partial';
  if (percentage >= 10) return 'minimal';
  return 'missing';
}

export function getCoverageColor(status: CoverageStatus): string {
  switch (status) {
    case 'complete': return 'bg-green-500';
    case 'partial': return 'bg-yellow-500';
    case 'minimal': return 'bg-orange-500';
    case 'missing': return 'bg-red-500';
  }
}

export function getPriorityColor(priority: CoveragePriority): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-gray-100 text-gray-700';
  }
}

export function getObjectiveStatusColor(status: ObjectiveStatus): string {
  switch (status) {
    case 'achieved': return 'bg-green-100 text-green-700';
    case 'on_track': return 'bg-blue-100 text-blue-700';
    case 'behind': return 'bg-yellow-100 text-yellow-700';
    case 'at_risk': return 'bg-red-100 text-red-700';
    case 'not_started': return 'bg-gray-100 text-gray-700';
    case 'cancelled': return 'bg-gray-100 text-gray-500';
  }
}
