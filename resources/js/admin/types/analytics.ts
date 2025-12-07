/**
 * Analytics Types
 * Types for analytics, metrics, and reporting
 */

// ============================================================================
// TIME RANGE
// ============================================================================

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================================================
// CHART DATA
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MultiSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface BarChartData {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
}

// ============================================================================
// METRICS
// ============================================================================

export interface MetricValue {
  current: number;
  previous?: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface DashboardMetrics {
  totalArticles: MetricValue;
  publishedArticles: MetricValue;
  totalViews: MetricValue;
  avgReadTime: MetricValue;
  bounceRate: MetricValue;
  engagementRate: MetricValue;
}

// ============================================================================
// PRODUCTION ANALYTICS
// ============================================================================

export interface ProductionStats {
  generated: number;
  translated: number;
  published: number;
  indexed: number;
  failed: number;
}

export interface DailyProductionStats extends ProductionStats {
  date: string;
}

export interface ProductionTrend {
  period: string;
  data: DailyProductionStats[];
  totals: ProductionStats;
  averages: ProductionStats;
}

// ============================================================================
// CONTENT ANALYTICS
// ============================================================================

export interface ContentPerformance {
  articleId: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgReadTime: number;
  bounceRate: number;
  shareCount: number;
  commentCount: number;
}

export interface ContentAnalytics {
  topPerformers: ContentPerformance[];
  worstPerformers: ContentPerformance[];
  recentlyPublished: ContentPerformance[];
  trending: ContentPerformance[];
}

// ============================================================================
// GEOGRAPHIC ANALYTICS
// ============================================================================

export interface GeographicData {
  countryCode: string;
  countryName: string;
  articleCount: number;
  viewCount: number;
  percentage: number;
}

export interface RegionalAnalytics {
  byCountry: GeographicData[];
  byRegion: {
    region: string;
    countries: string[];
    articleCount: number;
    viewCount: number;
  }[];
  coverage: {
    covered: number;
    target: number;
    percentage: number;
  };
}

// ============================================================================
// API COSTS ANALYTICS
// ============================================================================

export interface ApiCostEntry {
  date: string;
  service: 'openai' | 'anthropic' | 'perplexity' | 'dalle' | 'google' | 'deepl';
  cost: number;
  tokens?: number;
  requests: number;
}

export interface ApiCostSummary {
  totalCost: number;
  dailyAverage: number;
  byService: Record<string, number>;
  trend: ApiCostEntry[];
  budget: {
    monthly: number;
    used: number;
    remaining: number;
    percentUsed: number;
  };
}

// ============================================================================
// QUALITY ANALYTICS
// ============================================================================

export interface QualityDistribution {
  excellent: number; // 90-100
  good: number; // 75-89
  average: number; // 60-74
  poor: number; // 40-59
  critical: number; // 0-39
}

export interface QualityAnalytics {
  averageScore: number;
  distribution: QualityDistribution;
  trend: {
    date: string;
    averageScore: number;
  }[];
  byContentType: Record<string, number>;
  byPlatform: Record<string, number>;
}

// ============================================================================
// TRANSLATION ANALYTICS
// ============================================================================

export interface TranslationAnalytics {
  totalTranslations: number;
  byLanguage: Record<string, {
    count: number;
    percentage: number;
    avgQuality: number;
  }>;
  coverage: {
    language: string;
    articlesTranslated: number;
    totalArticles: number;
    percentage: number;
  }[];
  pendingTranslations: number;
  failedTranslations: number;
}

// ============================================================================
// INDEXING ANALYTICS
// ============================================================================

export interface IndexingAnalytics {
  indexed: number;
  pending: number;
  failed: number;
  notSubmitted: number;
  bySearchEngine: {
    google: { indexed: number; pending: number; failed: number };
    bing: { indexed: number; pending: number; failed: number };
  };
  successRate: number;
  avgTimeToIndex: number; // in hours
  trend: {
    date: string;
    indexed: number;
    submitted: number;
  }[];
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'production' | 'content' | 'geographic' | 'cost' | 'quality' | 'custom';
  dateRange: DateRange;
  filters: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
  data: unknown;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: AnalyticsReport['type'];
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  lastSentAt?: string;
  nextSendAt: string;
  isActive: boolean;
}

// ============================================================================
// ANALYTICS FILTERS
// ============================================================================

export interface AnalyticsFilters {
  timeRange: TimeRange;
  dateRange?: DateRange;
  platforms?: string[];
  countries?: string[];
  languages?: string[];
  contentTypes?: string[];
  themes?: string[];
}

// ============================================================================
// ANALYTICS RESPONSE
// ============================================================================

export interface AnalyticsResponse<T> {
  data: T;
  filters: AnalyticsFilters;
  generatedAt: string;
  cacheExpiry?: string;
}
