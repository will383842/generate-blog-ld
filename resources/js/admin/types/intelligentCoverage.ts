/**
 * INTELLIGENT COVERAGE - TYPESCRIPT TYPES
 * 
 * Types pour le système de couverture intelligent
 * Supporte SOS-Expat, Ulixai et thème Williams Jullin
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type SupportedLanguage = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ar' | 'hi';

export type CoverageStatus = 'excellent' | 'good' | 'partial' | 'minimal' | 'missing';

export type ArticleStatus = 'published' | 'unpublished' | 'missing';

export type RecommendationType = 'critical' | 'high' | 'medium' | 'low';

export type ContentType = 'recruitment' | 'awareness' | 'founder';

export type TargetType = 'lawyer_specialty' | 'expat_domain' | 'ulixai_service' | 'founder';

export type PlatformCode = 'sos-expat' | 'ulixai' | 'ulysse';

// ============================================================================
// PLATEFORMES
// ============================================================================

export interface Platform {
  id: number;
  code: PlatformCode;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  disabled?: boolean;
  recruitment: PlatformRecruitmentConfig;
  awareness: PlatformAwarenessConfig;
}

export interface PlatformRecruitmentConfig {
  name: string;
  items: PlatformRecruitmentItem[];
}

export interface PlatformRecruitmentItem {
  type: TargetType;
  name: string;
  count: number;
  icon: string;
  description?: string;
}

export interface PlatformAwarenessConfig {
  name: string;
  items: PlatformAwarenessItem[];
}

export interface PlatformAwarenessItem {
  name: string;
  count: number;
  description: string;
}

// ============================================================================
// SCORES PAR PAYS
// ============================================================================

export interface CountryCoverageScore {
  country_id: number;
  country_name: string;
  country_code: string;
  region: string;
  recruitment_score: number;
  awareness_score: number;
  founder_score: number;
  overall_score: number;
  recruitment_breakdown: RecruitmentBreakdown;
  awareness_breakdown: AwarenessBreakdown;
  founder_breakdown: FounderBreakdown;
  language_scores: Record<SupportedLanguage, LanguageScore>;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  total_targets: number;
  completed_targets: number;
  missing_targets: number;
  priority_score: number;
  recommendations: Recommendation[];
  status: CoverageStatus;
}

export interface CountryListItem {
  id: number;
  name: string;
  code: string;
  region: string;
  recruitment_score: number;
  awareness_score: number;
  founder_score: number;
  overall_score: number;
  status: CoverageStatus;
  priority_score: number;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  missing_targets: number;
}

// ============================================================================
// BREAKDOWN RECRUTEMENT
// ============================================================================

export interface RecruitmentBreakdown {
  lawyer_specialties?: SpecialtyBreakdown;
  expat_domains?: SpecialtyBreakdown;
  ulixai_services?: SpecialtyBreakdown;
}

export interface SpecialtyBreakdown {
  score: number;
  articles_count: number;
  total_targets: number;
  completed_targets: number;
  missing_targets: number;
  specialties_count?: number;
  domains_count?: number;
  services_count?: number;
  details: SpecialtyDetail[];
}

export interface SpecialtyDetail {
  id: number;
  code: string;
  name: string;
  category?: string;
  parent_name?: string;
  languages: Record<SupportedLanguage, LanguageStatus>;
  completed_count: number;
  progress: number;
}

export interface LanguageStatus {
  completed: boolean;
  status: ArticleStatus;
}

// ============================================================================
// BREAKDOWN NOTORIÉTÉ
// ============================================================================

export interface AwarenessBreakdown {
  themes: ContentTypeBreakdown;
  comparatives: ContentTypeBreakdown;
  landings: ContentTypeBreakdown;
}

export interface ContentTypeBreakdown {
  score: number;
  articles_count: number;
  total_targets: number;
  completed_targets: number;
  missing_targets: number;
  details: Record<SupportedLanguage, ContentTypeDetail>;
}

export interface ContentTypeDetail {
  target: number;
  completed: number;
  total: number;
  progress: number;
}

// ============================================================================
// BREAKDOWN FONDATEUR (WILLIAMS JULLIN)
// ============================================================================

export interface FounderBreakdown {
  [lang: string]: FounderLanguageDetail;
}

export interface FounderLanguageDetail {
  sos_expat: {
    completed: boolean;
    status: ArticleStatus;
  };
  ulixai: {
    completed: boolean;
    status: ArticleStatus;
  };
  combined_progress: number;
}

export interface FounderGlobalData {
  founder_name: string;
  total_countries: number;
  total_targets: number;
  completed_targets: number;
  average_score: number;
  countries: FounderCountryScore[];
}

export interface FounderCountryScore {
  country_id: number;
  country_name: string;
  country_code: string;
  region: string;
  score: number;
  completed_targets: number;
  total_targets: number;
  breakdown: FounderBreakdown;
}

// ============================================================================
// SCORES PAR LANGUE
// ============================================================================

export interface LanguageScore {
  language_id: number;
  language_code: SupportedLanguage;
  language_name: string;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  score: number;
  status: CoverageStatus;
}

export interface LanguageStats {
  language_id: number;
  language_code: SupportedLanguage;
  language_name: string;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  countries_covered: number;
  coverage_percent: number;
}

// ============================================================================
// RECOMMANDATIONS
// ============================================================================

export interface Recommendation {
  type: RecommendationType;
  priority: number;
  action: string;
  message: string;
  impact: string;
  target_type?: TargetType;
  target_id?: number;
  target_name?: string;
  language?: SupportedLanguage;
  missing_languages?: SupportedLanguage[];
  suggested_types?: string[];
  estimated_articles?: number;
  country_id?: number;
  country_name?: string;
  country_code?: string;
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface CoverageDashboard {
  platform_id: number;
  total_countries: number;
  summary: DashboardSummary;
  distribution: CoverageDistribution;
  top_countries: CountryListItem[];
  priority_countries: CountryListItem[];
}

export interface DashboardSummary {
  average_recruitment: number;
  average_awareness: number;
  average_founder: number;
  average_overall: number;
  total_published: number;
  total_unpublished: number;
  total_countries: number;
}

export interface CoverageDistribution {
  excellent: number;
  good: number;
  partial: number;
  minimal: number;
  missing: number;
}

// ============================================================================
// MATRICE
// ============================================================================

export interface CoverageMatrix {
  type: 'language' | 'specialty';
  columns: string[];
  rows: CoverageMatrixRow[];
}

export interface CoverageMatrixRow {
  country_id: number;
  country_name: string;
  country_code: string;
  overall_score: number;
  cells: Record<string, CoverageMatrixCell>;
}

export interface CoverageMatrixCell {
  score: number;
  published: number;
  total: number;
  status: CoverageStatus;
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

export interface GenerationTask {
  country_id: number;
  country_name: string;
  country_code: string;
  language: SupportedLanguage;
  content_type: ContentType;
  target_type?: TargetType;
  target_id?: number;
  target_name?: string;
  priority: number;
  estimated_cost: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface GenerationPlan {
  tasks: GenerationTask[];
  summary: GenerationSummary;
}

export interface GenerationSummary {
  total_tasks: number;
  total_countries: number;
  total_languages: number;
  estimated_cost: number;
  estimated_duration: string;
}

export interface GenerationRequest {
  platform_id: number;
  country_ids: number[];
  languages: SupportedLanguage[];
  content_types: ContentType[];
}

// ============================================================================
// FILTRES
// ============================================================================

export interface CoverageFilters {
  platform_id?: number;
  region?: string;
  status?: CoverageStatus;
  search?: string;
  sort_by?: 'priority_score' | 'overall_score' | 'recruitment_score' | 'awareness_score' | 'founder_score' | 'name' | 'missing_targets';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface RecommendationFilters {
  platform_id?: number;
  priority?: RecommendationType;
  limit?: number;
}

// ============================================================================
// RÉPONSES API
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

export const LANGUAGE_INFO: Record<SupportedLanguage, { name: string; nativeName: string; flag: string }> = {
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
};

export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'emerald';
  if (score >= 40) return 'yellow';
  if (score >= 20) return 'orange';
  return 'red';
}

export function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-green-500';
  if (score >= 60) return 'border-emerald-500';
  if (score >= 40) return 'border-yellow-500';
  if (score >= 20) return 'border-orange-500';
  return 'border-red-500';
}

export function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-emerald-500 to-teal-500';
  if (score >= 40) return 'from-yellow-500 to-orange-500';
  if (score >= 20) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-red-600';
}

export function getStatusColor(status: CoverageStatus): string {
  switch (status) {
    case 'excellent': return 'green';
    case 'good': return 'emerald';
    case 'partial': return 'yellow';
    case 'minimal': return 'orange';
    case 'missing': return 'red';
    default: return 'gray';
  }
}

export function getStatusLabel(status: CoverageStatus): string {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Bon';
    case 'partial': return 'Partiel';
    case 'minimal': return 'Minimal';
    case 'missing': return 'Manquant';
    default: return status;
  }
}

export function getPriorityColor(priority: RecommendationType): string {
  switch (priority) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'gray';
    default: return 'gray';
  }
}

export function getPriorityLabel(priority: RecommendationType): string {
  switch (priority) {
    case 'critical': return 'Critique';
    case 'high': return 'Haute';
    case 'medium': return 'Moyenne';
    case 'low': return 'Basse';
    default: return priority;
  }
}

export function getLanguageName(code: SupportedLanguage): string {
  return LANGUAGE_INFO[code]?.name || code.toUpperCase();
}

export function getLanguageFlag(code: SupportedLanguage): string {
  return LANGUAGE_INFO[code]?.flag || '🌍';
}

export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getRecommendationColor(type: RecommendationType): string {
  switch (type) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'gray';
    default: return 'gray';
  }
}
