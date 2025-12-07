/**
 * Research Types
 * File 284 - Type definitions for research and fact-checking system
 */

// Research source types
export type ResearchSourceType = 
  | 'web'
  | 'academic'
  | 'news'
  | 'government'
  | 'database'
  | 'api'
  | 'custom';

// Research query status
export type ResearchQueryStatus = 'pending' | 'completed' | 'failed' | 'cached';

// Fact check verification status
export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified' | 'false' | 'uncertain';

// Research query entity
export interface ResearchQuery {
  id: number;
  query: string;
  platform_id: number;
  language_code: string;
  
  // Results
  results: ResearchResult[];
  results_count: number;
  
  // Source info
  sources_used: string[];
  primary_source?: string;
  
  // Metadata
  status: ResearchQueryStatus;
  cached_at?: string;
  cache_expires_at?: string;
  is_from_cache: boolean;
  
  // Cost tracking
  cost: number;
  tokens_used: number;
  
  // Timing
  duration_ms: number;
  created_at: string;
  created_by?: number;
}

// Individual research result
export interface ResearchResult {
  id: string;
  title: string;
  snippet: string;
  content?: string;
  url: string;
  source: string;
  source_type: ResearchSourceType;
  
  // Quality indicators
  relevance_score: number;
  reliability_score: number;
  
  // Metadata
  published_at?: string;
  author?: string;
  domain?: string;
  
  // Extraction
  key_facts: string[];
  entities: string[];
}

// Research source configuration
export interface ResearchSource {
  id: number;
  name: string;
  slug: string;
  url: string;
  type: ResearchSourceType;
  
  // Priority (1-100, higher = more priority)
  priority: number;
  
  // Reliability (0-100)
  reliability_score: number;
  
  // Status
  is_active: boolean;
  is_default: boolean;
  
  // Configuration
  config: ResearchSourceConfig;
  
  // Stats
  usage_count: number;
  success_rate: number;
  avg_response_time: number;
  last_used_at?: string;
  
  created_at: string;
  updated_at: string;
}

// Source configuration
export interface ResearchSourceConfig {
  api_key?: string;
  base_url?: string;
  headers?: Record<string, string>;
  rate_limit?: number;
  timeout_ms?: number;
  max_results?: number;
  language_filter?: string[];
  date_filter?: 'day' | 'week' | 'month' | 'year' | 'all';
  custom_params?: Record<string, unknown>;
}

// Fact check result
export interface FactCheckResult {
  id: string;
  claim: string;
  claim_id: string;
  
  // Verification
  is_verified: boolean;
  status: VerificationStatus;
  confidence: number; // 0-100
  
  // Evidence
  sources: FactCheckSource[];
  explanation: string;
  
  // Alternative facts
  alternative_claims?: string[];
  corrections?: string[];
  
  // Metadata
  checked_at: string;
  duration_ms: number;
}

// Fact check source
export interface FactCheckSource {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  reliability: number;
  supports_claim: boolean;
}

// Claim extraction
export interface ClaimExtraction {
  id: string;
  text: string;
  claims: ExtractedClaim[];
  extraction_method: 'ai' | 'rule-based' | 'hybrid';
  created_at: string;
}

// Extracted claim
export interface ExtractedClaim {
  id: string;
  text: string;
  type: 'factual' | 'opinion' | 'prediction' | 'statistical';
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  entities: string[];
  checkable: boolean;
}

// Research dashboard stats
export interface ResearchDashboardStats {
  total_queries: number;
  queries_today: number;
  queries_this_week: number;
  
  total_cost: number;
  cost_today: number;
  cost_this_week: number;
  
  avg_response_time: number;
  
  sources_count: number;
  active_sources_count: number;
  
  cache_stats: CacheStats;
  
  recent_queries: ResearchQuery[];
  top_sources: {
    source: string;
    count: number;
    avg_reliability: number;
  }[];
  
  queries_by_day: {
    date: string;
    count: number;
    cost: number;
  }[];
}

// Cache statistics
export interface CacheStats {
  total_entries: number;
  total_size_bytes: number;
  max_size_bytes: number;
  usage_percent: number;
  
  hit_count: number;
  miss_count: number;
  hit_rate: number;
  
  oldest_entry_at?: string;
  newest_entry_at?: string;
  
  entries_by_source: Record<string, number>;
}

// Mining configuration
export interface MiningConfig {
  id: number;
  platform_id: number;
  name: string;
  
  // Schedule
  is_active: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  next_run_at?: string;
  last_run_at?: string;
  
  // Sources
  sources: string[];
  
  // Topics
  topics: string[];
  keywords: string[];
  
  // Filters
  language_filter: string[];
  date_range: 'day' | 'week' | 'month';
  min_reliability: number;
  
  // Output
  auto_update_knowledge: boolean;
  notify_on_new_data: boolean;
  
  // Stats
  total_runs: number;
  total_items_found: number;
  
  created_at: string;
  updated_at: string;
}

// Mining run result
export interface MiningRunResult {
  id: string;
  config_id: number;
  
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  
  items_found: number;
  items_added: number;
  items_updated: number;
  items_skipped: number;
  
  sources_queried: string[];
  errors: string[];
}

// API Input types
export interface ResearchQueryFilters {
  platform_id?: number;
  status?: ResearchQueryStatus;
  source?: string;
  date_from?: string;
  date_to?: string;
  min_cost?: number;
  max_cost?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface SearchInput {
  query: string;
  sources?: string[];
  language?: string;
  max_results?: number;
  use_cache?: boolean;
}

export interface CreateSourceInput {
  name: string;
  url: string;
  type: ResearchSourceType;
  priority?: number;
  reliability_score?: number;
  config?: Partial<ResearchSourceConfig>;
}

export interface UpdateSourceInput extends Partial<CreateSourceInput> {
  is_active?: boolean;
  is_default?: boolean;
}

export interface FactCheckInput {
  claims: string[];
  sources?: string[];
  language?: string;
}

export interface ExtractClaimsInput {
  text: string;
  method?: 'ai' | 'rule-based' | 'hybrid';
}

// Source type metadata
export interface SourceTypeMetadata {
  type: ResearchSourceType;
  label: string;
  description: string;
  icon: string;
  color: string;
  default_reliability: number;
}

// All source types with metadata
export const SOURCE_TYPES: SourceTypeMetadata[] = [
  {
    type: 'web',
    label: 'Web',
    description: 'Recherche web générale',
    icon: 'Globe',
    color: '#3B82F6',
    default_reliability: 60,
  },
  {
    type: 'academic',
    label: 'Académique',
    description: 'Sources académiques et scientifiques',
    icon: 'GraduationCap',
    color: '#8B5CF6',
    default_reliability: 90,
  },
  {
    type: 'news',
    label: 'Actualités',
    description: 'Sources d\'actualités',
    icon: 'Newspaper',
    color: '#10B981',
    default_reliability: 70,
  },
  {
    type: 'government',
    label: 'Gouvernement',
    description: 'Sources gouvernementales officielles',
    icon: 'Landmark',
    color: '#F59E0B',
    default_reliability: 95,
  },
  {
    type: 'database',
    label: 'Base de données',
    description: 'Bases de données structurées',
    icon: 'Database',
    color: '#EC4899',
    default_reliability: 85,
  },
  {
    type: 'api',
    label: 'API',
    description: 'API externe',
    icon: 'Plug',
    color: '#06B6D4',
    default_reliability: 80,
  },
  {
    type: 'custom',
    label: 'Personnalisée',
    description: 'Source personnalisée',
    icon: 'Settings',
    color: '#6B7280',
    default_reliability: 50,
  },
];

// Helper functions
export function getSourceTypeMetadata(type: ResearchSourceType): SourceTypeMetadata | undefined {
  return SOURCE_TYPES.find(s => s.type === type);
}

export function getVerificationStatusColor(status: VerificationStatus): string {
  switch (status) {
    case 'verified': return '#10B981';
    case 'partially_verified': return '#F59E0B';
    case 'unverified': return '#6B7280';
    case 'false': return '#EF4444';
    case 'uncertain': return '#8B5CF6';
    default: return '#6B7280';
  }
}

export function getVerificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'verified': return 'Vérifié';
    case 'partially_verified': return 'Partiellement vérifié';
    case 'unverified': return 'Non vérifié';
    case 'false': return 'Faux';
    case 'uncertain': return 'Incertain';
    default: return status;
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return '#10B981';
  if (confidence >= 60) return '#F59E0B';
  if (confidence >= 40) return '#F97316';
  return '#EF4444';
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'Très haute';
  if (confidence >= 70) return 'Haute';
  if (confidence >= 50) return 'Moyenne';
  if (confidence >= 30) return 'Faible';
  return 'Très faible';
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return '< $0.01';
  return `$${cost.toFixed(2)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
