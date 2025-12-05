export type ContentType =
  | 'article'
  | 'pillar'
  | 'press_release'
  | 'press_dossier'
  | 'landing'
  | 'comparative'
  | 'manual'
  | 'knowledge';

export interface ContentTypeInfo {
  id: ContentType;
  name: string;
  icon: string;
  color: string;
}

export const CONTENT_TYPES: ContentTypeInfo[] = [
  { id: 'article', name: 'Article', icon: '📝', color: 'blue' },
  { id: 'pillar', name: 'Pilier', icon: '🏛️', color: 'purple' },
  { id: 'press_release', name: 'Communiqué', icon: '📰', color: 'green' },
  { id: 'press_dossier', name: 'Dossier', icon: '📁', color: 'amber' },
  { id: 'landing', name: 'Landing', icon: '🎯', color: 'red' },
  { id: 'comparative', name: 'Comparatif', icon: '⚖️', color: 'cyan' },
  { id: 'manual', name: 'Manuel', icon: '✍️', color: 'orange' },
  { id: 'knowledge', name: 'Knowledge', icon: '🧠', color: 'indigo' },
];

export interface Country {
  id: number;
  code: string;
  name: string;
  flag: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  type: ContentType;
  country: Country;
  language: Language;
  platform: Platform;
  status: 'draft' | 'published';
  quality_score: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_articles: number;
  total_countries: number;
  total_languages: number;
  total_cost: number;
  articles_today: number;
  articles_week: number;
  articles_month: number;
}

export interface CoverageCell {
  country_id: number;
  language_id: number;
  total: number;
  by_type: Record<ContentType, number>;
  average_score: number;
  total_cost: number;
}

export interface GenerationRequest {
  platform_id: number;
  country_id: number;
  language_ids: number[];
  content_types: ContentType[];
  quantities: Record<ContentType, number>;
  scheduled_at?: string;
}