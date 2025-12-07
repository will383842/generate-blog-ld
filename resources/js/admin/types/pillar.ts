/**
 * Pillar Types
 * Extended article types for pillar/cornerstone content
 */

import type { Article, ArticleStatus } from './article';
import type { PlatformId, LanguageCode } from './program';

// ============================================================================
// PILLAR
// ============================================================================

export interface Pillar extends Article {
  // Extended fields for pillar content
  tableOfContents: TableOfContentsItem[];
  statistics: PillarStatistic[];
  citations: PillarCitation[];
  
  // Pillar-specific metadata
  isPillar: true;
  pillarType: PillarType;
  parentPillarId?: string; // For cluster content
  childArticleIds: string[];
  
  // Research data
  researchQueries: string[];
  lastResearchAt?: string;
  sourcesCount: number;
  citationsCount: number;
}

export type PillarType = 'cornerstone' | 'hub' | 'cluster' | 'supporting';

export interface TableOfContentsItem {
  id: string;
  title: string;
  slug: string;
  level: 1 | 2 | 3 | 4;
  order: number;
  children?: TableOfContentsItem[];
}

export interface PillarStatistic {
  id: string;
  pillarId: string;
  label: string;
  value: string | number;
  unit?: string;
  source?: string;
  sourceUrl?: string;
  year?: number;
  order: number;
}

export interface PillarCitation {
  id: string;
  pillarId: string;
  text: string;
  author?: string;
  source: string;
  sourceUrl?: string;
  date?: string;
  order: number;
}

// ============================================================================
// PILLAR SCHEDULE
// ============================================================================

export interface PillarSchedule {
  id: string;
  platformId: PlatformId;
  themeId: string;
  countryId?: string;
  languageId?: LanguageCode;
  
  // Scheduling
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:mm
  
  // Status
  isActive: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  
  // Configuration
  pillarType: PillarType;
  autoGenerate: boolean;
  autoPublish: boolean;
  notifyOnComplete: boolean;
  
  // Stats
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  
  createdAt: string;
  updatedAt: string;
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface CreateScheduleInput {
  platformId: PlatformId;
  themeId: string;
  countryId?: string;
  languageId?: LanguageCode;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
  pillarType: PillarType;
  autoGenerate?: boolean;
  autoPublish?: boolean;
  notifyOnComplete?: boolean;
}

// ============================================================================
// PILLAR SOURCE (Research/Perplexity)
// ============================================================================

export interface PillarSource {
  id: string;
  pillarId: string;
  
  // Query
  query: string;
  queryType: SourceQueryType;
  
  // Results
  results: SourceResult[];
  totalResults: number;
  
  // Cache
  cachedAt: string;
  expiresAt: string;
  isExpired: boolean;
  
  // Metadata
  provider: 'perplexity' | 'google' | 'bing' | 'manual';
  costCredits: number;
  
  createdAt: string;
}

export type SourceQueryType = 'statistics' | 'citations' | 'facts' | 'news' | 'general';

export interface SourceResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedDate?: string;
  author?: string;
  
  // Reliability
  reliability: SourceReliability;
  reliabilityScore: number; // 0-100
  
  // Usage
  isUsed: boolean;
  usedInSection?: string;
  
  // Metadata
  favicon?: string;
  imageUrl?: string;
}

export type SourceReliability = 'high' | 'medium' | 'low' | 'unknown';

// ============================================================================
// FILTERS
// ============================================================================

export interface PillarFilters {
  status?: ArticleStatus[];
  platformId?: PlatformId;
  countryId?: string;
  languageId?: LanguageCode;
  themeId?: string;
  pillarType?: PillarType;
  
  minWordCount?: number;
  maxWordCount?: number;
  minSources?: number;
  
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'wordCount' | 'sourcesCount' | 'qualityScore';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PillarWithRelations extends Pillar {
  sources?: PillarSource[];
  schedule?: PillarSchedule;
  childArticles?: Article[];
  parentPillar?: Pillar;
}

export interface PillarListResponse {
  data: Pillar[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

export interface PillarScheduleListResponse {
  data: PillarSchedule[];
  meta: {
    total: number;
    activeCount: number;
    nextScheduled?: PillarSchedule;
  };
}
