/**
 * Article Types
 * Types for articles, translations, and related entities
 */

import type { PlatformId, ContentTypeId, LanguageCode } from './program';

// ============================================================================
// ENUMS
// ============================================================================

export type ArticleStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'approved' 
  | 'scheduled' 
  | 'published' 
  | 'unpublished'
  | 'archived';

export type TranslationStatus = 
  | 'missing' 
  | 'pending' 
  | 'in_progress' 
  | 'done' 
  | 'needs_update';

export type SourceReliability = 'high' | 'medium' | 'low' | 'unknown';

// ============================================================================
// ARTICLE
// ============================================================================

export interface Article {
  id: string;
  uuid: string;
  
  // Context
  platformId: PlatformId;
  countryId: string;
  languageId: LanguageCode;
  type: ContentTypeId;
  
  // Content
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  
  // Metrics
  wordCount: number;
  readingTime: number; // minutes
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  
  // Media
  imageUrl?: string;
  imageAlt?: string;
  imageAttribution?: string;
  galleryImages?: ArticleImage[];
  
  // Relations
  themeId?: string;
  authorId?: string;
  categoryId?: string;
  tags?: string[];
  
  // Quality
  qualityScore: number; // 0-100
  seoScore?: number; // 0-100
  readabilityScore?: number; // 0-100
  
  // Status
  status: ArticleStatus;
  publishedAt?: string;
  scheduledAt?: string;
  
  // Generation
  generatedBy?: 'ai' | 'manual' | 'hybrid';
  generationJobId?: string;
  templateId?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ArticleImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  order: number;
}

// ============================================================================
// ARTICLE TRANSLATION
// ============================================================================

export interface ArticleTranslation {
  id: string;
  articleId: string;
  languageId: LanguageCode;
  
  // Content
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Status
  status: TranslationStatus;
  translatedBy?: 'ai' | 'manual' | 'hybrid';
  translatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  
  // Quality
  qualityScore?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ARTICLE FAQ
// ============================================================================

export interface ArticleFaq {
  id: string;
  articleId: string;
  
  question: string;
  answer: string;
  order: number;
  
  // Optional for translations
  languageId?: LanguageCode;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ARTICLE SOURCE
// ============================================================================

export interface ArticleSource {
  id: string;
  articleId: string;
  
  title: string;
  url: string;
  domain?: string;
  author?: string;
  publishedDate?: string;
  accessedDate?: string;
  
  reliability: SourceReliability;
  description?: string;
  
  order: number;
  createdAt: string;
}

// ============================================================================
// ARTICLE VERSION
// ============================================================================

export interface ArticleVersion {
  id: string;
  articleId: string;
  
  // Snapshot
  title: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  
  // Metadata
  versionNumber: number;
  changeType: 'create' | 'update' | 'publish' | 'unpublish' | 'restore';
  changeSummary?: string;
  
  // Author
  createdBy?: string;
  createdByName?: string;
  
  createdAt: string;
}

// ============================================================================
// ARTICLE FILTERS
// ============================================================================

export interface ArticleFilters {
  status?: ArticleStatus[];
  platformId?: PlatformId;
  countryId?: string;
  languageId?: LanguageCode;
  themeId?: string;
  type?: ContentTypeId;
  authorId?: string;
  
  // Quality
  minQualityScore?: number;
  maxQualityScore?: number;
  
  // Date
  dateFrom?: string;
  dateTo?: string;
  publishedFrom?: string;
  publishedTo?: string;
  
  // Search
  search?: string;
  
  // Pagination
  page?: number;
  perPage?: number;
  
  // Sort
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'qualityScore' | 'wordCount';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// ARTICLE STATS
// ============================================================================

export interface ArticleStats {
  totalCount: number;
  draftCount: number;
  publishedCount: number;
  scheduledCount: number;
  archivedCount: number;
  
  totalWordCount: number;
  avgWordCount: number;
  avgQualityScore: number;
  avgSeoScore: number;
  
  byPlatform: Record<string, number>;
  byCountry: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<ArticleStatus, number>;
  
  translationCoverage: Record<LanguageCode, {
    done: number;
    pending: number;
    missing: number;
  }>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateArticleInput {
  platformId: PlatformId;
  countryId: string;
  languageId: LanguageCode;
  type: ContentTypeId;
  
  title: string;
  slug?: string; // Auto-generated if not provided
  excerpt?: string;
  content: string;
  
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  
  imageUrl?: string;
  imageAlt?: string;
  
  themeId?: string;
  authorId?: string;
  tags?: string[];
  
  status?: ArticleStatus;
  scheduledAt?: string;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  // Additional fields for update
  faqs?: Array<{
    id?: string;
    question: string;
    answer: string;
    order: number;
  }>;
  sources?: Array<{
    id?: string;
    title: string;
    url: string;
    reliability?: SourceReliability;
  }>;
}

export interface TranslateArticleInput {
  articleId: string;
  targetLanguageId: LanguageCode;
  useAI?: boolean;
  copyFromLanguageId?: LanguageCode;
}

export interface PublishArticleInput {
  articleId: string;
  publishAt?: string; // If provided, schedule instead of immediate publish
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ArticleWithRelations extends Article {
  translations?: ArticleTranslation[];
  faqs?: ArticleFaq[];
  sources?: ArticleSource[];
  latestVersion?: ArticleVersion;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  theme?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ArticleListResponse {
  data: Article[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
  stats?: ArticleStats;
}
