/**
 * SEO Types
 * File 311 - Types and interfaces for SEO features
 */

// ============================================
// Indexing Status Types
// ============================================

export type IndexingStatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'failed_permanent';

export type GoogleIndexingStatus = 'pending' | 'submitted' | 'indexed' | 'failed' | 'not_found';

export type IndexNowStatus = 'pending' | 'submitted' | 'accepted' | 'failed';

export type BingStatus = 'pending' | 'submitted' | 'indexed' | 'failed';

// ============================================
// SEO Data Interfaces
// ============================================

export interface SeoData {
  url: string;
  score: number;
  title: string;
  description: string;
  canonical?: string;
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
  keywords: string[];
  lastAnalyzed: string;
}

export interface SeoIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'meta' | 'content' | 'technical' | 'performance' | 'mobile' | 'security';
  message: string;
  details?: string;
  impact: 'high' | 'medium' | 'low';
  fixable: boolean;
}

export interface SeoSuggestion {
  id: string;
  category: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

// ============================================
// Schema Markup
// ============================================

export interface SchemaMarkup {
  id: number;
  type: SchemaType;
  data: Record<string, unknown>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  articleId?: number;
  createdAt: string;
  updatedAt: string;
}

export type SchemaType = 
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'FAQPage'
  | 'HowTo'
  | 'LocalBusiness'
  | 'Organization'
  | 'Person'
  | 'Product'
  | 'Review'
  | 'BreadcrumbList'
  | 'WebPage';

export interface SchemaTemplate {
  id: number;
  name: string;
  type: SchemaType;
  template: Record<string, unknown>;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  isDefault: boolean;
}

// ============================================
// Redirects
// ============================================

export interface Redirect {
  id: number;
  from: string;
  to: string;
  type: RedirectType;
  hits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastHitAt?: string;
  notes?: string;
}

export type RedirectType = '301' | '302' | '307' | '308';

export interface RedirectStats {
  total: number;
  active: number;
  totalHits: number;
  brokenCount: number;
  recentHits: number;
}

// ============================================
// Indexing
// ============================================

export interface IndexingStatus {
  url: string;
  status: IndexingStatusType;
  googleStatus: GoogleIndexingStatus;
  indexnowStatus: IndexNowStatus;
  bingStatus: BingStatus;
  lastChecked: string;
  error?: string;
}

export interface IndexingQueueItem {
  id: number;
  articleId: number;
  articleTitle: string;
  url: string;
  status: IndexingStatusType;
  googleStatus: GoogleIndexingStatus;
  indexnowStatus: IndexNowStatus;
  bingStatus: BingStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IndexingStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  googleSuccess: number;
  googleFailed: number;
  indexnowSuccess: number;
  indexnowFailed: number;
  bingSuccess: number;
  bingFailed: number;
  todaySubmitted: number;
  notIndexedCount: number;
  googleQuota: {
    used: number;
    limit: number;
  };
  bingQuota: {
    used: number;
    limit: number;
  };
}

export interface NotIndexedArticle {
  id: number;
  title: string;
  slug: string;
  url: string;
  platformId: number;
  platformName: string;
  publishedAt: string;
  daysSincePublish: number;
}

// ============================================
// Internal Linking (Maillage)
// ============================================

export interface InternalLink {
  id: number;
  fromArticleId: number;
  fromArticleTitle: string;
  fromArticleUrl: string;
  toArticleId: number;
  toArticleTitle: string;
  toArticleUrl: string;
  anchorText: string;
  pageRank: number;
  position: 'content' | 'sidebar' | 'footer' | 'related';
  isAutomatic: boolean;
  createdAt: string;
}

export interface LinkOpportunity {
  id: string;
  fromArticleId: number;
  fromArticleTitle: string;
  toArticleId: number;
  toArticleTitle: string;
  suggestedAnchor: string;
  relevanceScore: number;
  reason: string;
}

export interface MaillageStats {
  totalLinks: number;
  averageLinksPerPage: number;
  orphanPages: number;
  topLinkedPages: {
    articleId: number;
    title: string;
    incomingLinks: number;
  }[];
  linkDistribution: {
    range: string;
    count: number;
  }[];
}

// ============================================
// Technical SEO
// ============================================

export interface CoreWebVitals {
  lcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  fid: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  cls: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  ttfb: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  fcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
}

export interface TechnicalSeoData {
  coreWebVitals: CoreWebVitals;
  mobileScore: number;
  desktopScore: number;
  structuredDataValid: boolean;
  structuredDataErrors: number;
  crawlIssues: CrawlIssue[];
  sitemapStatus: 'ok' | 'warning' | 'error';
  robotsTxtStatus: 'ok' | 'warning' | 'error';
  httpsStatus: boolean;
  canonicalIssues: number;
}

export interface CrawlIssue {
  id: string;
  url: string;
  type: 'broken_link' | 'redirect_chain' | 'duplicate_content' | 'missing_meta' | 'slow_page' | 'blocked';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  detectedAt: string;
  fixed: boolean;
}

// ============================================
// Dashboard
// ============================================

export interface SeoDashboardData {
  overallScore: number;
  indexedPages: number;
  totalPages: number;
  featuredSnippets: number;
  averagePosition: number;
  coreWebVitals: CoreWebVitals;
  recentIssues: SeoIssue[];
  indexingStats: IndexingStats;
  maillageStats: MaillageStats;
  redirectStats: RedirectStats;
}

// ============================================
// Filters
// ============================================

export interface IndexingQueueFilters {
  status?: IndexingStatusType;
  google_status?: GoogleIndexingStatus;
  platform_id?: number;
  per_page?: number;
  page?: number;
}

export interface NotIndexedFilters {
  platform_id?: number;
  days_since_publish?: number;
  per_page?: number;
  page?: number;
}

// ============================================
// Constants
// ============================================

export const SCHEMA_TYPES: { value: SchemaType; label: string; description: string }[] = [
  { value: 'Article', label: 'Article', description: 'Article générique' },
  { value: 'NewsArticle', label: 'Article actualité', description: 'Article de presse/actualité' },
  { value: 'BlogPosting', label: 'Blog Post', description: 'Article de blog' },
  { value: 'FAQPage', label: 'FAQ', description: 'Page de questions fréquentes' },
  { value: 'HowTo', label: 'How-To', description: 'Guide étape par étape' },
  { value: 'LocalBusiness', label: 'Commerce local', description: 'Entreprise locale' },
  { value: 'Organization', label: 'Organisation', description: 'Entreprise ou organisation' },
  { value: 'Person', label: 'Personne', description: 'Profil de personne' },
  { value: 'Product', label: 'Produit', description: 'Fiche produit' },
  { value: 'Review', label: 'Avis', description: 'Avis ou critique' },
  { value: 'BreadcrumbList', label: 'Fil d\'Ariane', description: 'Navigation breadcrumb' },
  { value: 'WebPage', label: 'Page Web', description: 'Page web générique' },
];

export const REDIRECT_TYPES: { value: RedirectType; label: string; description: string }[] = [
  { value: '301', label: '301 - Permanent', description: 'Redirection permanente (SEO friendly)' },
  { value: '302', label: '302 - Temporaire', description: 'Redirection temporaire' },
  { value: '307', label: '307 - Temporaire', description: 'Redirection temporaire (préserve méthode)' },
  { value: '308', label: '308 - Permanent', description: 'Redirection permanente (préserve méthode)' },
];

export const INDEXING_STATUS_LABELS: Record<IndexingStatusType, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'yellow' },
  processing: { label: 'En cours', color: 'blue' },
  completed: { label: 'Terminé', color: 'green' },
  failed: { label: 'Échoué', color: 'red' },
  failed_permanent: { label: 'Échec permanent', color: 'gray' },
};

export const GOOGLE_STATUS_LABELS: Record<GoogleIndexingStatus, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'yellow' },
  submitted: { label: 'Soumis', color: 'blue' },
  indexed: { label: 'Indexé', color: 'green' },
  failed: { label: 'Échoué', color: 'red' },
  not_found: { label: 'Non trouvé', color: 'gray' },
};
