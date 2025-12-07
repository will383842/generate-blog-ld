/**
 * Types pour le système de Content Templates
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export type TemplateCategory = 'content' | 'press';
export type TemplateType = 'article' | 'pillar' | 'landing' | 'comparative' | 'press_release' | 'dossier';
export type OutputFormat = 'html' | 'pdf';
export type LanguageCode = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ar' | 'hi';

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, string> = {
  content: 'Contenu en ligne',
  press: 'Presse (PDF)',
};

export const TEMPLATE_TYPES: Record<TemplateCategory, Record<string, string>> = {
  content: {
    article: 'Article',
    pillar: 'Article Pilier',
    landing: 'Landing Page',
    comparative: 'Comparatif',
  },
  press: {
    press_release: 'Communiqué de Presse',
    dossier: 'Dossier de Presse',
  },
};

export const LANGUAGES: Record<LanguageCode, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
};

export const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  pt: '🇵🇹',
  ru: '🇷🇺',
  zh: '🇨🇳',
  ar: '🇸🇦',
  hi: '🇮🇳',
};

export const GPT_MODELS = {
  'gpt-4o': 'GPT-4o (Recommandé)',
  'gpt-4o-mini': 'GPT-4o Mini (Économique)',
  'gpt-4-turbo': 'GPT-4 Turbo',
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContentTemplate {
  id: number;
  uuid: string;
  category: TemplateCategory;
  type: TemplateType;
  slug: string;
  name: string;
  description: string | null;
  language_code: LanguageCode;
  output_format: OutputFormat;
  system_prompt: string;
  user_prompt: string;
  structure: TemplateStructure | null;
  variables: string[] | null;
  model: string;
  max_tokens: number;
  temperature: number;
  word_count_min: number | null;
  word_count_target: number | null;
  word_count_max: number | null;
  faq_count: number;
  is_default: boolean;
  is_active: boolean;
  version: number;
  usage_count: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Computed
  language_name?: string;
}

export interface TemplateStructure {
  sections_min?: number;
  sections_max?: number;
  include_toc?: boolean;
  include_key_takeaways?: boolean;
  sections?: TemplateSection[];
}

export interface TemplateSection {
  type: 'cover' | 'intro' | 'chapter' | 'faq' | 'contact';
  title: string;
  words?: number;
  faq_count?: number;
}

export interface ContentTemplateVersion {
  id: number;
  template_id: number;
  version: number;
  system_prompt: string;
  user_prompt: string;
  structure: TemplateStructure | null;
  variables: string[] | null;
  change_note: string | null;
  created_by: number | null;
  created_at: string;
  creator?: {
    id: number;
    name: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TemplateListResponse {
  success: boolean;
  data: ContentTemplate[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TemplateDetailResponse {
  success: boolean;
  data: ContentTemplate;
  meta: {
    required_variables: string[];
  };
}

export interface TemplateGroupedResponse {
  success: boolean;
  data: Record<TemplateCategory, Record<TemplateType, Record<LanguageCode, ContentTemplate[]>>>;
}

export interface TemplateStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    by_category: Record<TemplateCategory, number>;
    by_type: Record<TemplateType, number>;
    by_language: Record<LanguageCode, number>;
    most_used: Array<{
      id: number;
      name: string;
      type: TemplateType;
      language_code: LanguageCode;
      usage_count: number;
    }>;
  };
}

export interface TemplateCoverageResponse {
  success: boolean;
  data: {
    type: TemplateType;
    total_languages: number;
    covered: number;
    missing: LanguageCode[];
    coverage_percent: number;
  };
}

export interface TemplatePreviewResponse {
  success: boolean;
  data: {
    system_prompt: string;
    user_prompt: string;
    variables_used: Record<string, string>;
    variables_required: string[];
  };
}

export interface TemplateConstantsResponse {
  success: boolean;
  data: {
    categories: Record<TemplateCategory, string>;
    types: Record<TemplateCategory, Record<TemplateType, string>>;
    languages: Record<LanguageCode, string>;
    models: Record<string, string>;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM DATA
// ═══════════════════════════════════════════════════════════════════════════════

export interface TemplateFormData {
  type: TemplateType;
  name: string;
  description?: string;
  language_code: LanguageCode;
  system_prompt: string;
  user_prompt: string;
  structure?: TemplateStructure;
  variables?: string[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  word_count_min?: number;
  word_count_target?: number;
  word_count_max?: number;
  faq_count?: number;
  is_default?: boolean;
  is_active?: boolean;
}

export interface TemplateUpdateData extends Partial<TemplateFormData> {
  change_note?: string;
}

export interface TemplateDuplicateData {
  name?: string;
  target_language?: LanguageCode;
}

export interface TemplateImportData {
  template: {
    type: TemplateType;
    name: string;
    language_code: LanguageCode;
    system_prompt: string;
    user_prompt: string;
    [key: string]: unknown;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TemplateFilters {
  category?: TemplateCategory;
  type?: TemplateType;
  language_code?: LanguageCode;
  is_active?: boolean;
  is_default?: boolean;
  search?: string;
  sort_by?: 'name' | 'type' | 'language_code' | 'usage_count' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}
