/**
 * Types for Global Statistics
 * Used by useGlobalStats hook and dashboard components
 */

// ============================================================================
// Platform Types
// ============================================================================

export type Platform = 'sos-expat' | 'ulixai' | 'ulysse-ai';

export interface PlatformInfo {
  id: Platform;
  name: string;
  url: string;
  color: string;
  icon: string;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  'sos-expat': { id: 'sos-expat', name: 'SOS-Expat', url: 'sos-expat.com', color: '#E53E3E', icon: '🆘' },
  'ulixai': { id: 'ulixai', name: 'Ulixai', url: 'ulixai.com', color: '#3182CE', icon: '🔗' },
  'ulysse-ai': { id: 'ulysse-ai', name: 'Ulysse.AI', url: 'ulysse.ai', color: '#805AD5', icon: '🤖' },
};

// ============================================================================
// Objective Types
// ============================================================================

export type Objective = 'recruitment' | 'awareness';

export interface ObjectiveInfo {
  id: Objective;
  name: string;
  nameFr: string;
  color: string;
  icon: string;
}

export const OBJECTIVES: Record<Objective, ObjectiveInfo> = {
  'recruitment': { id: 'recruitment', name: 'Recruitment', nameFr: 'Recrutement', color: '#38A169', icon: '👥' },
  'awareness': { id: 'awareness', name: 'Brand Awareness', nameFr: 'Notoriété', color: '#D69E2E', icon: '📣' },
};

// ============================================================================
// Content Types
// ============================================================================

export type ContentType = 
  | 'article' 
  | 'pillar' 
  | 'comparative' 
  | 'manual' 
  | 'press-release' 
  | 'press-kit' 
  | 'landing';

export interface ContentTypeInfo {
  id: ContentType;
  name: string;
  nameFr: string;
  icon: string;
  color: string;
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeInfo> = {
  'article': { id: 'article', name: 'Article', nameFr: 'Article', icon: '📰', color: '#4A5568' },
  'pillar': { id: 'pillar', name: 'Pillar Article', nameFr: 'Article pilier', icon: '🏛️', color: '#2B6CB0' },
  'comparative': { id: 'comparative', name: 'Comparative', nameFr: 'Comparatif', icon: '⚖️', color: '#9F7AEA' },
  'manual': { id: 'manual', name: 'Manual Title', nameFr: 'Titre manuel', icon: '✏️', color: '#ED8936' },
  'press-release': { id: 'press-release', name: 'Press Release', nameFr: 'Communiqué', icon: '📢', color: '#E53E3E' },
  'press-kit': { id: 'press-kit', name: 'Press Kit', nameFr: 'Dossier de presse', icon: '📁', color: '#DD6B20' },
  'landing': { id: 'landing', name: 'Landing Page', nameFr: 'Landing page', icon: '🎯', color: '#38A169' },
};

// ============================================================================
// Target Types
// ============================================================================

export type Target = 'lawyers' | 'expats' | 'brands';

export interface TargetInfo {
  id: Target;
  name: string;
  nameFr: string;
  icon: string;
}

export const TARGETS: Record<Target, TargetInfo> = {
  'lawyers': { id: 'lawyers', name: 'Lawyers', nameFr: 'Avocats', icon: '👔' },
  'expats': { id: 'expats', name: 'Expatriates', nameFr: 'Expatriés', icon: '🌏' },
  'brands': { id: 'brands', name: 'Brands', nameFr: 'Marques', icon: '🏢' },
};

// ============================================================================
// Quality Score Types
// ============================================================================

export interface QualityScore {
  overall: number;
  seo: number;
  readability: number;
  originality: number;
  structure: number;
}

export type QualityLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

export function getQualityLevel(score: number): QualityLevel {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  if (score >= 40) return 'poor';
  return 'critical';
}

export function getQualityColor(score: number): string {
  if (score >= 90) return '#38A169'; // green
  if (score >= 75) return '#68D391'; // light green
  if (score >= 60) return '#ECC94B'; // yellow
  if (score >= 40) return '#ED8936'; // orange
  return '#E53E3E'; // red
}

// ============================================================================
// Indexing Status Types
// ============================================================================

export interface IndexingStatus {
  google: boolean;
  bing: boolean;
  submittedAt?: string;
  indexedAt?: string;
  attempts: number;
}

// ============================================================================
// Translation Status Types
// ============================================================================

export interface TranslationStatus {
  sourceLanguage: string;
  targetLanguages: string[];
  completed: string[];
  pending: string[];
  excluded: string[];
}

// ============================================================================
// Publication Status Types
// ============================================================================

export interface PublicationStatus {
  platform: Platform;
  language: string;
  country: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  publishedAt?: string;
  scheduledAt?: string;
  externalUrl?: string;
}

// ============================================================================
// Global Stats Types
// ============================================================================

export interface GenerationStats {
  processing: number;
  pending: number;
  completedToday: number;
  failedToday: number;
  dailyTarget: number;
  avgDuration: number; // seconds
}

export interface TranslationStats {
  processing: number;
  pending: number;
  completedToday: number;
  failedToday: number;
  byLanguage: Record<string, number>;
}

export interface PublishingStats {
  pending: number;
  publishing: number;
  publishedToday: number;
  failedToday: number;
  scheduledToday: number;
  nextPublishIn: number; // seconds until next scheduled
  avgInterval: number; // average seconds between publications
}

export interface IndexingStats {
  notIndexed: number;
  indexed: number;
  pending: number;
  failedToday: number;
  googleQuota: { used: number; limit: number; resetIn: number };
  bingQuota: { used: number; limit: number; resetIn: number };
}

export interface ProgramStats {
  active: number;
  paused: number;
  completed: number;
  totalArticlesTarget: number;
  totalArticlesGenerated: number;
}

export interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  action?: { label: string; path: string };
  read: boolean;
}

export interface ProgressByDimension {
  byPlatform: Record<Platform, { 
    recruitment: { current: number; target: number };
    awareness: { current: number; target: number };
  }>;
  byCountry: Array<{
    code: string;
    name: string;
    flag: string;
    current: number;
    target: number;
    percentage: number;
  }>;
  byLanguage: Array<{
    code: string;
    name: string;
    flag: string;
    current: number;
    target: number;
    percentage: number;
  }>;
  bySpecialty: Array<{
    id: string;
    name: string;
    category: 'lawyers' | 'expats';
    current: number;
    target: number;
    percentage: number;
  }>;
  byObjective: Record<Objective, {
    current: number;
    target: number;
    byTarget: Record<Target, { current: number; target: number }>;
  }>;
  byContentType: Record<ContentType, {
    current: number;
    target: number;
  }>;
}

export interface TodayStats {
  generated: number;
  translated: number;
  published: number;
  indexed: number;
  targets: {
    generated: number;
    translated: number;
    published: number;
  };
}

export interface WeeklyTrend {
  day: string;
  date: string;
  generated: number;
  published: number;
  indexed: number;
}

export interface GlobalStats {
  generation: GenerationStats;
  translation: TranslationStats;
  publishing: PublishingStats;
  indexing: IndexingStats;
  programs: ProgramStats;
  alerts: AlertItem[];
  unreadAlerts: number;
  progress: ProgressByDimension;
  today: TodayStats;
  weeklyTrend: WeeklyTrend[];
  lastUpdated: string;
}

// ============================================================================
// Harmonized Publishing Config
// ============================================================================

export interface PublishingHarmonyConfig {
  enabled: boolean;
  activeHoursStart: number; // 0-23
  activeHoursEnd: number; // 0-23
  activeDays: number[]; // 0=Sunday, 1=Monday, etc.
  minIntervalMinutes: number;
  maxPerHour: number;
  maxPerDay: number;
  priorityBoost: {
    pillar: number; // multiplier for priority
    pressRelease: number;
    landing: number;
  };
}

export const DEFAULT_PUBLISHING_HARMONY: PublishingHarmonyConfig = {
  enabled: true,
  activeHoursStart: 8,
  activeHoursEnd: 22,
  activeDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  minIntervalMinutes: 10,
  maxPerHour: 6,
  maxPerDay: 50,
  priorityBoost: {
    pillar: 1.5,
    pressRelease: 1.3,
    landing: 1.2,
  },
};

// ============================================================================
// Languages
// ============================================================================

export interface Language {
  code: string;
  name: string;
  nameFr: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'fr', name: 'French', nameFr: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nameFr: 'Anglais', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nameFr: 'Espagnol', flag: '🇪🇸' },
  { code: 'de', name: 'German', nameFr: 'Allemand', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nameFr: 'Italien', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nameFr: 'Portugais', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nameFr: 'Néerlandais', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nameFr: 'Polonais', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', nameFr: 'Russe', flag: '🇷🇺' },
];

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}
