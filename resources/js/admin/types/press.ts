/**
 * Press Module Types
 * Types for press releases, dossiers, templates, and media
 */

import type { PlatformId, LanguageCode } from './program';

// ============================================================================
// ENUMS
// ============================================================================

export type PressStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';

export type PressMediaType = 'photo' | 'chart' | 'infographic' | 'video' | 'document';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

export type DossierSectionType = 
  | 'introduction'
  | 'chapter'
  | 'statistics'
  | 'gallery'
  | 'quote'
  | 'conclusion'
  | 'custom';

export type PressTemplateType = 'release' | 'dossier';

export type ExportFormat = 'pdf' | 'word' | 'html';

// ============================================================================
// PRESS RELEASE
// ============================================================================

export interface PressRelease {
  id: string;
  uuid: string;
  platformId: PlatformId;
  
  // Content
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  
  // Template
  templateId?: string;
  
  // Status
  status: PressStatus;
  publishedAt?: string;
  scheduledAt?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  
  // Quality
  qualityScore: number;
  
  // Relations
  translations?: PressReleaseTranslation[];
  media?: PressReleaseMedia[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PressReleaseTranslation {
  id: string;
  pressReleaseId: string;
  languageCode: LanguageCode;
  
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  
  metaTitle?: string;
  metaDescription?: string;
  
  status: 'draft' | 'pending' | 'done';
  translatedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PressReleaseMedia {
  id: string;
  pressReleaseId: string;
  
  type: PressMediaType;
  url: string;
  thumbnailUrl?: string;
  
  // Metadata
  title?: string;
  caption?: string;
  alt?: string;
  
  // Attribution (Unsplash, etc.)
  attribution?: string;
  attributionUrl?: string;
  photographer?: string;
  
  // Chart data (if type === 'chart')
  chartData?: ChartData;
  
  // Order
  order: number;
  isFeatured: boolean;
  
  createdAt: string;
}

// ============================================================================
// CHART DATA
// ============================================================================

export interface ChartData {
  type: ChartType;
  title?: string;
  
  labels: string[];
  datasets: ChartDataset[];
  
  options?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showValues?: boolean;
    animate?: boolean;
    colors?: string[];
  };
  
  source?: string;
  sourceUrl?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
  backgroundColor?: string;
}

// ============================================================================
// PRESS DOSSIER
// ============================================================================

export interface PressDossier {
  id: string;
  uuid: string;
  platformId: PlatformId;
  
  // Content
  title: string;
  slug: string;
  description?: string;
  
  // Structure
  sections: DossierSection[];
  
  // Status
  status: PressStatus;
  publishedAt?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  
  // Quality
  qualityScore: number;
  
  // Translations
  translations?: PressDossierTranslation[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PressDossierTranslation {
  id: string;
  dossierId: string;
  languageCode: LanguageCode;
  
  title: string;
  slug: string;
  description?: string;
  
  metaTitle?: string;
  metaDescription?: string;
  
  status: 'draft' | 'pending' | 'done';
  translatedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DOSSIER SECTION
// ============================================================================

export interface DossierSection {
  id: string;
  dossierId: string;
  
  type: DossierSectionType;
  title: string;
  content: string;
  
  order: number;
  
  // Media
  media?: DossierSectionMedia[];
  
  // Config for specific types
  config?: Record<string, unknown>;
  
  // Translations
  translations?: DossierSectionTranslation[];
  
  createdAt: string;
  updatedAt: string;
}

export interface DossierSectionTranslation {
  id: string;
  sectionId: string;
  languageCode: LanguageCode;
  
  title: string;
  content: string;
  
  status: 'draft' | 'pending' | 'done';
  
  createdAt: string;
  updatedAt: string;
}

export interface DossierSectionMedia {
  id: string;
  sectionId: string;
  
  type: PressMediaType;
  url: string;
  thumbnailUrl?: string;
  
  title?: string;
  caption?: string;
  alt?: string;
  
  attribution?: string;
  attributionUrl?: string;
  
  chartData?: ChartData;
  
  order: number;
  
  createdAt: string;
}

// ============================================================================
// PRESS TEMPLATE
// ============================================================================

export interface PressTemplate {
  id: string;
  
  name: string;
  type: PressTemplateType;
  description?: string;
  
  content: string;
  variables: TemplateVariable[];
  
  // Preview
  previewImage?: string;
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  
  // Usage
  usageCount: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'media';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
  placeholder?: string;
}

// ============================================================================
// FILTERS
// ============================================================================

export interface PressReleaseFilters {
  search?: string;
  status?: PressStatus[];
  platformId?: PlatformId;
  templateId?: string;
  hasMedia?: boolean;
  
  dateFrom?: string;
  dateTo?: string;
  publishedFrom?: string;
  publishedTo?: string;
  
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'qualityScore';
  sortOrder?: 'asc' | 'desc';
}

export interface DossierFilters {
  search?: string;
  status?: PressStatus[];
  platformId?: PlatformId;
  minSections?: number;
  
  dateFrom?: string;
  dateTo?: string;
  
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'qualityScore';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreatePressReleaseInput {
  platformId: PlatformId;
  templateId?: string;
  
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  
  status?: PressStatus;
  scheduledAt?: string;
}

export interface UpdatePressReleaseInput extends Partial<CreatePressReleaseInput> {
  id?: string;
}

export interface AddPressMediaInput {
  pressReleaseId: string;
  type: PressMediaType;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  caption?: string;
  alt?: string;
  attribution?: string;
  attributionUrl?: string;
  photographer?: string;
  chartData?: ChartData;
  isFeatured?: boolean;
}

export interface GenerateChartInput {
  type: ChartType;
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartData['options'];
  source?: string;
}

export interface CreateDossierInput {
  platformId: PlatformId;
  
  title: string;
  slug?: string;
  description?: string;
  
  metaTitle?: string;
  metaDescription?: string;
  
  status?: PressStatus;
}

export interface UpdateDossierInput extends Partial<CreateDossierInput> {
  id?: string;
}

export interface AddDossierSectionInput {
  dossierId: string;
  type: DossierSectionType;
  title: string;
  content: string;
  order?: number;
  config?: Record<string, unknown>;
}

export interface UpdateDossierSectionInput {
  id: string;
  title?: string;
  content?: string;
  order?: number;
  config?: Record<string, unknown>;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  format: ExportFormat;
  languageCode?: LanguageCode;
  
  includeMedia?: boolean;
  includeCharts?: boolean;
  
  layout?: 'standard' | 'compact' | 'presentation';
  
  // PDF specific
  paperSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  headerLogo?: string;
  footerText?: string;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  format: ExportFormat;
  expiresAt: string;
}

// ============================================================================
// STATS
// ============================================================================

export interface PressStats {
  releases: {
    total: number;
    published: number;
    draft: number;
    thisMonth: number;
    avgQualityScore: number;
  };
  dossiers: {
    total: number;
    published: number;
    draft: number;
    thisMonth: number;
    avgQualityScore: number;
  };
  media: {
    totalPhotos: number;
    totalCharts: number;
    totalVideos: number;
  };
  byPlatform: Record<PlatformId, {
    releases: number;
    dossiers: number;
  }>;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PressReleaseWithRelations extends PressRelease {
  template?: PressTemplate;
  platform?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface PressDossierWithRelations extends PressDossier {
  platform?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface PressReleaseListResponse {
  data: PressRelease[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
  stats?: PressStats;
}

export interface DossierListResponse {
  data: PressDossier[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}
