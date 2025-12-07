/**
 * Brand Book Types and Interfaces
 * File 247 - Type definitions for brand management system
 */

// Brand section types enum
export type BrandSectionType =
  | 'mission'
  | 'vision'
  | 'values'
  | 'tone'
  | 'audience'
  | 'personality'
  | 'vocabulary'
  | 'formatting'
  | 'examples'
  | 'donts'
  | 'templates'
  | 'guidelines';

// Section type metadata
export interface BrandSectionTypeMetadata {
  value: BrandSectionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'identity' | 'voice' | 'content' | 'rules';
  order: number;
}

// All brand section types with metadata
export const BRAND_SECTION_TYPES: BrandSectionTypeMetadata[] = [
  {
    value: 'mission',
    label: 'Mission',
    description: 'La raison d\'être de la plateforme',
    icon: 'Target',
    color: '#3B82F6',
    category: 'identity',
    order: 1,
  },
  {
    value: 'vision',
    label: 'Vision',
    description: 'L\'objectif à long terme',
    icon: 'Eye',
    color: '#8B5CF6',
    category: 'identity',
    order: 2,
  },
  {
    value: 'values',
    label: 'Valeurs',
    description: 'Les principes fondamentaux',
    icon: 'Heart',
    color: '#EC4899',
    category: 'identity',
    order: 3,
  },
  {
    value: 'tone',
    label: 'Ton',
    description: 'Le style de communication',
    icon: 'MessageCircle',
    color: '#10B981',
    category: 'voice',
    order: 4,
  },
  {
    value: 'audience',
    label: 'Audience',
    description: 'Les personas cibles',
    icon: 'Users',
    color: '#F59E0B',
    category: 'voice',
    order: 5,
  },
  {
    value: 'personality',
    label: 'Personnalité',
    description: 'Les traits de caractère de la marque',
    icon: 'Sparkles',
    color: '#06B6D4',
    category: 'voice',
    order: 6,
  },
  {
    value: 'vocabulary',
    label: 'Vocabulaire',
    description: 'Les termes à privilégier',
    icon: 'BookOpen',
    color: '#14B8A6',
    category: 'content',
    order: 7,
  },
  {
    value: 'formatting',
    label: 'Formatage',
    description: 'Les règles de mise en forme',
    icon: 'AlignLeft',
    color: '#A855F7',
    category: 'rules',
    order: 8,
  },
  {
    value: 'examples',
    label: 'Exemples',
    description: 'Exemples de bon contenu',
    icon: 'FileText',
    color: '#6366F1',
    category: 'content',
    order: 9,
  },
  {
    value: 'donts',
    label: 'À éviter',
    description: 'Ce qu\'il ne faut pas faire',
    icon: 'XCircle',
    color: '#EF4444',
    category: 'rules',
    order: 10,
  },
  {
    value: 'templates',
    label: 'Templates',
    description: 'Modèles de phrases et structures',
    icon: 'Layout',
    color: '#0EA5E9',
    category: 'content',
    order: 11,
  },
  {
    value: 'guidelines',
    label: 'Guidelines',
    description: 'Règles générales à suivre',
    icon: 'BookMarked',
    color: '#84CC16',
    category: 'rules',
    order: 12,
  },
];

// Brand section entity
export interface BrandSection {
  id: number;
  platform_id: number;
  section_type: BrandSectionType;
  content: string;
  language_code: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

// Brand section with translations
export interface BrandSectionWithTranslations extends BrandSection {
  translations: Record<string, {
    content: string;
    updated_at: string;
  }>;
}

// Style settings
export interface StyleSettings {
  id: number;
  platform_id: number;
  
  // Tone parameters (0-100)
  formality: number;
  friendliness: number;
  enthusiasm: number;
  confidence: number;
  empathy: number;
  
  // Complexity parameters
  sentence_length: 'short' | 'medium' | 'long';
  vocabulary_level: 'simple' | 'standard' | 'expert';
  technical_depth: number;
  
  // Lists
  vocabulary: string[];
  forbidden_terms: string[];
  required_elements: string[];
  template_phrases: string[];
  
  // Formatting rules
  formatting_rules: FormattingRules;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface FormattingRules {
  max_paragraph_length: number;
  min_paragraph_length: number;
  use_bullet_points: boolean;
  max_bullet_items: number;
  heading_style: 'title_case' | 'sentence_case' | 'uppercase';
  use_emojis: boolean;
  allowed_emojis: string[];
  call_to_action_style: 'button' | 'link' | 'inline';
  image_requirements: {
    required: boolean;
    min_count: number;
    max_count: number;
    alt_text_required: boolean;
  };
  link_requirements: {
    internal_required: boolean;
    external_allowed: boolean;
    max_external: number;
  };
}

// Compliance/Validation types
export type ViolationSeverity = 'critical' | 'major' | 'minor' | 'info';

export interface Violation {
  id: string;
  severity: ViolationSeverity;
  type: string;
  message: string;
  context?: string;
  position?: {
    start: number;
    end: number;
    line?: number;
  };
  suggestion?: string;
  auto_fixable: boolean;
}

export interface ComplianceResult {
  score: number;
  is_compliant: boolean;
  criteria: {
    tone: number;
    vocabulary: number;
    formatting: number;
    structure: number;
    readability: number;
    forbidden_terms: number;
    required_elements: number;
    length: number;
  };
  violations: Violation[];
  suggestions: string[];
  fixed_content?: string;
}

// Style presets
export interface StylePreset {
  id: number;
  platform_id: number;
  name: string;
  description: string;
  settings: Partial<StyleSettings>;
  is_default: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Audit types
export interface AuditResult {
  id: number;
  platform_id: number;
  content_type: 'article' | 'landing' | 'comparative' | 'pillar' | 'press';
  content_id: number;
  content_title: string;
  score: number;
  violations_count: number;
  violations_by_severity: Record<ViolationSeverity, number>;
  violations: Violation[];
  audited_at: string;
  status: 'pending' | 'reviewed' | 'fixed' | 'ignored';
}

export interface AuditStats {
  total_audited: number;
  average_score: number;
  compliant_count: number;
  non_compliant_count: number;
  violations_by_type: Record<string, number>;
  violations_by_severity: Record<ViolationSeverity, number>;
  score_trend: {
    date: string;
    score: number;
  }[];
  top_violations: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

// Brand history/versioning
export interface BrandVersion {
  id: number;
  platform_id: number;
  version_number: number;
  changes: BrandChange[];
  created_at: string;
  created_by: number;
  created_by_name: string;
  comment?: string;
}

export interface BrandChange {
  section_type: BrandSectionType;
  language_code: string;
  field: string;
  old_value: string;
  new_value: string;
}

// Brand stats
export interface BrandStats {
  sections_configured: number;
  sections_total: number;
  languages_configured: number;
  style_presets_count: number;
  compliance_score: number;
  last_audit_date: string | null;
  pending_violations: number;
  recent_changes: number;
}

// API Input types
export interface UpdateBrandSectionInput {
  id: number;
  content?: string;
  language_code?: string;
  is_active?: boolean;
}

export interface CreateBrandSectionInput {
  platform_id: number;
  section_type: BrandSectionType;
  content: string;
  language_code: string;
}

export interface UpdateStyleSettingsInput {
  platform_id: number;
  formality?: number;
  friendliness?: number;
  enthusiasm?: number;
  confidence?: number;
  empathy?: number;
  sentence_length?: StyleSettings['sentence_length'];
  vocabulary_level?: StyleSettings['vocabulary_level'];
  technical_depth?: number;
  vocabulary?: string[];
  forbidden_terms?: string[];
  required_elements?: string[];
  template_phrases?: string[];
  formatting_rules?: Partial<FormattingRules>;
}

export interface CreateStylePresetInput {
  platform_id: number;
  name: string;
  description?: string;
  settings: Partial<StyleSettings>;
  is_default?: boolean;
}

export interface ValidateContentInput {
  platform_id: number;
  content: string;
  content_type?: string;
  language?: string;
  auto_fix?: boolean;
}

export interface RunAuditInput {
  platform_id: number;
  content_type?: string;
  content_ids?: number[];
  date_from?: string;
  date_to?: string;
}

// Helper functions
export function getBrandSectionTypeMetadata(type: BrandSectionType): BrandSectionTypeMetadata | undefined {
  return BRAND_SECTION_TYPES.find(t => t.value === type);
}

export function getBrandSectionsByCategory(category: BrandSectionTypeMetadata['category']): BrandSectionTypeMetadata[] {
  return BRAND_SECTION_TYPES.filter(t => t.category === category).sort((a, b) => a.order - b.order);
}

export function getBrandSectionTypeColor(type: BrandSectionType): string {
  const metadata = getBrandSectionTypeMetadata(type);
  return metadata?.color ?? '#6B7280';
}

export function getBrandSectionTypeIcon(type: BrandSectionType): string {
  const metadata = getBrandSectionTypeMetadata(type);
  return metadata?.icon ?? 'FileText';
}

export function getViolationSeverityColor(severity: ViolationSeverity): string {
  switch (severity) {
    case 'critical': return '#DC2626';
    case 'major': return '#F97316';
    case 'minor': return '#FBBF24';
    case 'info': return '#3B82F6';
    default: return '#6B7280';
  }
}

export function getViolationSeverityLabel(severity: ViolationSeverity): string {
  switch (severity) {
    case 'critical': return 'Critique';
    case 'major': return 'Majeur';
    case 'minor': return 'Mineur';
    case 'info': return 'Info';
    default: return severity;
  }
}

export function getDefaultStyleSettings(): Partial<StyleSettings> {
  return {
    formality: 50,
    friendliness: 70,
    enthusiasm: 60,
    confidence: 70,
    empathy: 60,
    sentence_length: 'medium',
    vocabulary_level: 'standard',
    technical_depth: 50,
    vocabulary: [],
    forbidden_terms: [],
    required_elements: [],
    template_phrases: [],
    formatting_rules: {
      max_paragraph_length: 300,
      min_paragraph_length: 50,
      use_bullet_points: true,
      max_bullet_items: 7,
      heading_style: 'sentence_case',
      use_emojis: false,
      allowed_emojis: [],
      call_to_action_style: 'button',
      image_requirements: {
        required: true,
        min_count: 1,
        max_count: 5,
        alt_text_required: true,
      },
      link_requirements: {
        internal_required: true,
        external_allowed: true,
        max_external: 3,
      },
    },
  };
}
