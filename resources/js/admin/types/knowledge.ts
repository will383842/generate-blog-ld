/**
 * Platform Knowledge Types and Interfaces
 * File 234 - Knowledge base type definitions for content engine
 */

// Knowledge type enum values
export type KnowledgeType =
  | 'about'
  | 'services'
  | 'values'
  | 'tone'
  | 'style'
  | 'facts'
  | 'differentiators'
  | 'vocabulary'
  | 'examples'
  | 'donts'
  | 'grammar'
  | 'formatting'
  | 'headlines'
  | 'cta'
  | 'storytelling';

// Knowledge type metadata
export interface KnowledgeTypeMetadata {
  value: KnowledgeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
  maxItems: number | null;
  category: 'identity' | 'style' | 'content' | 'technical';
}

// All knowledge types with metadata
export const KNOWLEDGE_TYPES: KnowledgeTypeMetadata[] = [
  {
    value: 'about',
    label: 'À propos',
    description: 'Présentation générale de la plateforme, mission et vision',
    icon: 'Building2',
    color: '#3B82F6',
    required: true,
    maxItems: 5,
    category: 'identity',
  },
  {
    value: 'services',
    label: 'Services',
    description: 'Description des services proposés par la plateforme',
    icon: 'Briefcase',
    color: '#10B981',
    required: true,
    maxItems: 20,
    category: 'identity',
  },
  {
    value: 'values',
    label: 'Valeurs',
    description: 'Valeurs fondamentales et engagements de la plateforme',
    icon: 'Heart',
    color: '#EC4899',
    required: true,
    maxItems: 10,
    category: 'identity',
  },
  {
    value: 'tone',
    label: 'Ton',
    description: 'Ton de communication à adopter (professionnel, amical, expert...)',
    icon: 'MessageCircle',
    color: '#8B5CF6',
    required: true,
    maxItems: 5,
    category: 'style',
  },
  {
    value: 'style',
    label: 'Style',
    description: 'Style rédactionnel et conventions d\'écriture',
    icon: 'Palette',
    color: '#F59E0B',
    required: true,
    maxItems: 10,
    category: 'style',
  },
  {
    value: 'facts',
    label: 'Faits',
    description: 'Faits et chiffres clés à utiliser dans le contenu',
    icon: 'BarChart3',
    color: '#06B6D4',
    required: false,
    maxItems: 50,
    category: 'content',
  },
  {
    value: 'differentiators',
    label: 'Différenciateurs',
    description: 'Éléments qui différencient la plateforme de la concurrence',
    icon: 'Sparkles',
    color: '#F97316',
    required: true,
    maxItems: 15,
    category: 'identity',
  },
  {
    value: 'vocabulary',
    label: 'Vocabulaire',
    description: 'Termes et expressions à privilégier',
    icon: 'BookOpen',
    color: '#14B8A6',
    required: false,
    maxItems: 100,
    category: 'style',
  },
  {
    value: 'examples',
    label: 'Exemples',
    description: 'Exemples de phrases et formulations approuvées',
    icon: 'FileText',
    color: '#6366F1',
    required: false,
    maxItems: 50,
    category: 'content',
  },
  {
    value: 'donts',
    label: 'À éviter',
    description: 'Termes, expressions et pratiques à éviter',
    icon: 'XCircle',
    color: '#EF4444',
    required: true,
    maxItems: 50,
    category: 'style',
  },
  {
    value: 'grammar',
    label: 'Grammaire',
    description: 'Règles grammaticales spécifiques à respecter',
    icon: 'CheckSquare',
    color: '#84CC16',
    required: false,
    maxItems: 30,
    category: 'technical',
  },
  {
    value: 'formatting',
    label: 'Formatage',
    description: 'Règles de formatage (titres, listes, paragraphes...)',
    icon: 'AlignLeft',
    color: '#A855F7',
    required: false,
    maxItems: 20,
    category: 'technical',
  },
  {
    value: 'headlines',
    label: 'Titres',
    description: 'Conventions et exemples pour les titres et accroches',
    icon: 'Heading',
    color: '#0EA5E9',
    required: false,
    maxItems: 30,
    category: 'content',
  },
  {
    value: 'cta',
    label: 'CTA',
    description: 'Appels à l\'action recommandés et leur contexte d\'utilisation',
    icon: 'MousePointer',
    color: '#22C55E',
    required: false,
    maxItems: 30,
    category: 'content',
  },
  {
    value: 'storytelling',
    label: 'Storytelling',
    description: 'Éléments narratifs et histoires de marque à intégrer',
    icon: 'BookMarked',
    color: '#D946EF',
    required: false,
    maxItems: 20,
    category: 'content',
  },
];

// Translation status
export type TranslationStatus = 'done' | 'pending' | 'missing';

// Knowledge translation
export interface KnowledgeTranslation {
  id: number;
  knowledge_id: number;
  language: string;
  title: string;
  content: string;
  status: TranslationStatus;
  translated_at: string | null;
  translated_by: 'human' | 'ai' | null;
  created_at: string;
  updated_at: string;
}

// Main knowledge entity
export interface PlatformKnowledge {
  id: number;
  platform_id: number;
  type: KnowledgeType;
  title: string;
  content: string;
  language: string;
  priority: number;
  is_active: boolean;
  use_in_articles: boolean;
  use_in_landings: boolean;
  use_in_comparatives: boolean;
  use_in_pillars: boolean;
  use_in_press: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  translations?: KnowledgeTranslation[];
}

// Knowledge with all translations loaded
export interface KnowledgeWithTranslations extends PlatformKnowledge {
  translations: KnowledgeTranslation[];
}

// Filters for knowledge list
export interface KnowledgeFilters {
  platform_id?: number;
  type?: KnowledgeType | string;
  language?: string;
  is_active?: boolean;
  use_in_articles?: boolean;
  use_in_landings?: boolean;
  use_in_comparatives?: boolean;
  use_in_pillars?: boolean;
  use_in_press?: boolean;
  search?: string;
  priority_min?: number;
  priority_max?: number;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'title' | 'type';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Knowledge statistics
export interface KnowledgeStats {
  total: number;
  active: number;
  inactive: number;
  by_type: Record<KnowledgeType, number>;
  by_language: Record<string, number>;
  translation_coverage: number;
  essential_coverage: number;
  recent_updates: number;
  average_priority: number;
}

// Validation issue
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  context?: string;
  position?: {
    start: number;
    end: number;
  };
}

// Validation result
export interface ValidationResult {
  score: number;
  is_valid: boolean;
  criteria: {
    tone: number;
    vocabulary: number;
    forbidden: number;
    formatting: number;
    readability: number;
    length: number;
    structure: number;
    cta: number;
  };
  issues: ValidationIssue[];
  suggestions: string[];
}

// Input types for mutations
export interface CreateKnowledgeInput {
  platform_id: number;
  type: KnowledgeType;
  title: string;
  content: string;
  language?: string;
  priority?: number;
  is_active?: boolean;
  use_in_articles?: boolean;
  use_in_landings?: boolean;
  use_in_comparatives?: boolean;
  use_in_pillars?: boolean;
  use_in_press?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateKnowledgeInput {
  id: number;
  type?: KnowledgeType;
  title?: string;
  content?: string;
  language?: string;
  priority?: number;
  is_active?: boolean;
  use_in_articles?: boolean;
  use_in_landings?: boolean;
  use_in_comparatives?: boolean;
  use_in_pillars?: boolean;
  use_in_press?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TranslateKnowledgeInput {
  knowledge_id: number;
  source_language: string;
  target_language: string;
  title?: string;
  content?: string;
  use_ai?: boolean;
}

export interface BulkTranslateInput {
  knowledge_ids: number[];
  source_language: string;
  target_languages: string[];
}

export interface ImportKnowledgeInput {
  platform_id: number;
  data: Record<string, unknown>[];
  format: 'json' | 'csv';
  mapping?: Record<string, string>;
}

export interface ExportKnowledgeInput {
  platform_id: number;
  format: 'json' | 'csv';
  types?: KnowledgeType[];
  languages?: string[];
  include_translations?: boolean;
}

export interface ValidateTextInput {
  text: string;
  platform_id: number;
  content_type?: string;
  language?: string;
}

// API response types
export interface KnowledgeListResponse {
  data: PlatformKnowledge[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TranslationMatrixItem {
  id: number;
  type: KnowledgeType;
  title: string;
  source_language: string;
  translations: Record<string, {
    status: TranslationStatus;
    updated_at: string | null;
  }>;
}

export interface TranslationMatrix {
  items: TranslationMatrixItem[];
  languages: Record<string, {
    done: number;
    pending: number;
    missing: number;
  }>;
}

// Helper functions
export function getKnowledgeTypeMetadata(type: KnowledgeType): KnowledgeTypeMetadata | undefined {
  return KNOWLEDGE_TYPES.find(t => t.value === type);
}

export function getRequiredKnowledgeTypes(): KnowledgeTypeMetadata[] {
  return KNOWLEDGE_TYPES.filter(t => t.required);
}

export function getKnowledgeTypesByCategory(category: KnowledgeTypeMetadata['category']): KnowledgeTypeMetadata[] {
  return KNOWLEDGE_TYPES.filter(t => t.category === category);
}

export function isEssentialType(type: KnowledgeType): boolean {
  const metadata = getKnowledgeTypeMetadata(type);
  return metadata?.required ?? false;
}

export function getKnowledgeTypeColor(type: KnowledgeType): string {
  const metadata = getKnowledgeTypeMetadata(type);
  return metadata?.color ?? '#6B7280';
}

export function getKnowledgeTypeIcon(type: KnowledgeType): string {
  const metadata = getKnowledgeTypeMetadata(type);
  return metadata?.icon ?? 'FileText';
}
