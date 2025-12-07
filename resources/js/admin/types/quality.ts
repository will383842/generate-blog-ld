/**
 * Quality & Feedback Types
 * File 264 - Type definitions for quality management system
 */

// Quality score criteria
export type QualityCriterion = 
  | 'readability'
  | 'seo'
  | 'brand'
  | 'knowledge'
  | 'engagement'
  | 'accuracy';

// Quality check status
export type QualityStatus = 'pending' | 'passed' | 'warning' | 'failed';

// Content types for quality checks
export type ContentType = 'article' | 'landing' | 'comparative' | 'pillar' | 'press';

// Quality check entity
export interface QualityCheck {
  id: number;
  article_id: number;
  article_title: string;
  article_slug: string;
  content_type: ContentType;
  platform_id: number;
  language_code: string;
  
  // Scores (0-100)
  overall_score: number;
  readability_score: number;
  seo_score: number;
  brand_score: number;
  knowledge_score: number;
  engagement_score: number;
  accuracy_score: number;
  
  // Status
  status: QualityStatus;
  
  // Details
  suggestions: QualitySuggestion[];
  criteria_details: Record<QualityCriterion, CriterionDetail>;
  
  // Metadata
  word_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
  checked_by?: string;
}

// Criterion detail
export interface CriterionDetail {
  score: number;
  status: QualityStatus;
  issues: string[];
  positive: string[];
  weight: number;
}

// Quality suggestion
export interface QualitySuggestion {
  id: string;
  criterion: QualityCriterion;
  severity: 'critical' | 'major' | 'minor' | 'info';
  message: string;
  suggestion: string;
  auto_fixable: boolean;
  position?: {
    paragraph?: number;
    sentence?: number;
    start?: number;
    end?: number;
  };
}

// Quality dashboard stats
export interface QualityDashboardStats {
  total_checks: number;
  average_score: number;
  passed_count: number;
  warning_count: number;
  failed_count: number;
  pending_count: number;
  
  scores_by_criterion: Record<QualityCriterion, number>;
  
  trend: {
    direction: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  };
  
  distribution: {
    excellent: number; // 90-100
    good: number;      // 70-89
    average: number;   // 50-69
    poor: number;      // 0-49
  };
  
  recent_checks: QualityCheck[];
  low_score_alerts: QualityCheck[];
}

// Quality trends
export interface QualityTrend {
  date: string;
  overall_score: number;
  readability_score: number;
  seo_score: number;
  brand_score: number;
  knowledge_score: number;
  engagement_score: number;
  accuracy_score: number;
  checks_count: number;
}

// Golden example types
export type GoldenExampleType = 'positive' | 'negative';
export type GoldenCategory = string;

// Golden example entity
export interface GoldenExample {
  id: number;
  article_id: number;
  article_title: string;
  article_slug: string;
  content_type: ContentType;
  platform_id: number;
  language_code: string;
  
  category: GoldenCategory;
  example_type: GoldenExampleType;
  
  is_active: boolean;
  
  // Metadata
  excerpt?: string;
  tags: string[];
  quality_score?: number;
  
  marked_by: number;
  marked_by_name: string;
  marked_at: string;
  
  usage_count: number;
  last_used_at?: string;
}

// Golden category with stats
export interface GoldenCategoryWithStats {
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  
  examples_count: number;
  positive_count: number;
  negative_count: number;
  
  children?: GoldenCategoryWithStats[];
}

// Feedback types
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative';

// Feedback pattern
export interface FeedbackPattern {
  id: string;
  pattern: string;
  frequency: number;
  sentiment: FeedbackSentiment;
  examples: string[];
  first_seen: string;
  last_seen: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

// Feedback recommendation
export interface FeedbackRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  action_type: 'settings' | 'content' | 'training' | 'manual';
  action_data?: Record<string, unknown>;
  status: 'pending' | 'applied' | 'dismissed';
  created_at: string;
}

// Feedback data
export interface FeedbackData {
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  
  sentiment_trend: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
  
  patterns: FeedbackPattern[];
  
  recommendations: FeedbackRecommendation[];
  
  weekly_report: {
    period: string;
    total_feedback: number;
    sentiment_score: number;
    top_patterns: FeedbackPattern[];
    improvements: string[];
    concerns: string[];
  };
  
  keywords: {
    word: string;
    count: number;
    sentiment: FeedbackSentiment;
  }[];
}

// Training export options
export interface TrainingExportOptions {
  format: 'jsonl' | 'csv' | 'parquet';
  include_positive: boolean;
  include_negative: boolean;
  categories?: string[];
  content_types?: ContentType[];
  languages?: string[];
  min_quality_score?: number;
  limit?: number;
  shuffle?: boolean;
}

// Training export result
export interface TrainingExportResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: TrainingExportOptions;
  items_count: number;
  file_size?: number;
  file_url?: string;
  created_at: string;
  completed_at?: string;
  error?: string;
}

// API Input types
export interface QualityCheckFilters {
  platform_id?: number;
  content_type?: ContentType;
  status?: QualityStatus;
  min_score?: number;
  max_score?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface GoldenExampleFilters {
  platform_id?: number;
  content_type?: ContentType;
  category?: string;
  example_type?: GoldenExampleType;
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface MarkAsGoldenInput {
  article_id: number;
  category: string;
  example_type: GoldenExampleType;
  tags?: string[];
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parent?: string;
}

// Criterion metadata
export interface CriterionMetadata {
  key: QualityCriterion;
  label: string;
  description: string;
  icon: string;
  color: string;
  weight: number;
}

// All criteria with metadata
export const QUALITY_CRITERIA: CriterionMetadata[] = [
  {
    key: 'readability',
    label: 'Lisibilité',
    description: 'Score de lisibilité et clarté du texte',
    icon: 'BookOpen',
    color: '#3B82F6',
    weight: 15,
  },
  {
    key: 'seo',
    label: 'SEO',
    description: 'Optimisation pour les moteurs de recherche',
    icon: 'Search',
    color: '#10B981',
    weight: 20,
  },
  {
    key: 'brand',
    label: 'Marque',
    description: 'Conformité avec le ton et style de marque',
    icon: 'Sparkles',
    color: '#8B5CF6',
    weight: 20,
  },
  {
    key: 'knowledge',
    label: 'Connaissances',
    description: 'Utilisation des connaissances plateforme',
    icon: 'Brain',
    color: '#F59E0B',
    weight: 15,
  },
  {
    key: 'engagement',
    label: 'Engagement',
    description: 'Potentiel d\'engagement et CTAs',
    icon: 'Heart',
    color: '#EC4899',
    weight: 15,
  },
  {
    key: 'accuracy',
    label: 'Précision',
    description: 'Exactitude des informations',
    icon: 'CheckCircle',
    color: '#06B6D4',
    weight: 15,
  },
];

// Helper functions
export function getCriterionMetadata(criterion: QualityCriterion): CriterionMetadata | undefined {
  return QUALITY_CRITERIA.find(c => c.key === criterion);
}

export function getQualityStatus(score: number): QualityStatus {
  if (score >= 80) return 'passed';
  if (score >= 60) return 'warning';
  if (score >= 0) return 'failed';
  return 'pending';
}

export function getQualityStatusColor(status: QualityStatus): string {
  switch (status) {
    case 'passed': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'failed': return '#EF4444';
    case 'pending': return '#6B7280';
    default: return '#6B7280';
  }
}

export function getQualityStatusLabel(status: QualityStatus): string {
  switch (status) {
    case 'passed': return 'Validé';
    case 'warning': return 'Attention';
    case 'failed': return 'Échec';
    case 'pending': return 'En attente';
    default: return status;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Bon';
  if (score >= 50) return 'Moyen';
  return 'Insuffisant';
}

export function getSentimentColor(sentiment: FeedbackSentiment): string {
  switch (sentiment) {
    case 'positive': return '#10B981';
    case 'neutral': return '#6B7280';
    case 'negative': return '#EF4444';
    default: return '#6B7280';
  }
}

export function calculateOverallScore(scores: Record<QualityCriterion, number>): number {
  let totalWeight = 0;
  let weightedSum = 0;
  
  QUALITY_CRITERIA.forEach(criterion => {
    const score = scores[criterion.key] || 0;
    weightedSum += score * criterion.weight;
    totalWeight += criterion.weight;
  });
  
  return Math.round(weightedSum / totalWeight);
}
