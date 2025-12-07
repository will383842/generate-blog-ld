/**
 * Automation Types
 * File 365 - Types for post-generation automation chain
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type AutomationStep = 'generation' | 'translation' | 'image' | 'publication' | 'indexing';

export type QueuePriority = 'high' | 'default' | 'low';

export type PublicationStatus = 
  | 'pending' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

export type QueueName = 
  | 'content-generation' 
  | 'translation' 
  | 'image-generation' 
  | 'default' 
  | 'indexing';

export const AUTOMATION_STEPS: { key: AutomationStep; label: string; icon: string; color: string }[] = [
  { key: 'generation', label: 'Génération', icon: 'Sparkles', color: 'blue' },
  { key: 'translation', label: 'Traduction', icon: 'Languages', color: 'green' },
  { key: 'image', label: 'Image', icon: 'Image', color: 'yellow' },
  { key: 'publication', label: 'Publication', icon: 'Send', color: 'violet' },
  { key: 'indexing', label: 'Indexation', icon: 'Search', color: 'orange' },
];

export const QUEUE_PRIORITY_CONFIG: Record<QueuePriority, { label: string; color: string }> = {
  high: { label: 'Haute', color: 'red' },
  default: { label: 'Normale', color: 'gray' },
  low: { label: 'Basse', color: 'blue' },
};

export const PUBLICATION_STATUS_CONFIG: Record<PublicationStatus, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'slate' },
  scheduled: { label: 'Planifié', color: 'blue' },
  publishing: { label: 'Publication...', color: 'yellow' },
  published: { label: 'Publié', color: 'green' },
  failed: { label: 'Échoué', color: 'red' },
  cancelled: { label: 'Annulé', color: 'gray' },
};

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Dim', fullLabel: 'Dimanche' },
  { value: 1, label: 'Lun', fullLabel: 'Lundi' },
  { value: 2, label: 'Mar', fullLabel: 'Mardi' },
  { value: 3, label: 'Mer', fullLabel: 'Mercredi' },
  { value: 4, label: 'Jeu', fullLabel: 'Jeudi' },
  { value: 5, label: 'Ven', fullLabel: 'Vendredi' },
  { value: 6, label: 'Sam', fullLabel: 'Samedi' },
];

// ============================================================================
// Automation Settings
// ============================================================================

export interface AutomationSettings {
  // Post-generation automation
  autoTranslate: boolean;
  autoGenerateImage: boolean;
  autoPublish: boolean;
  autoIndex: boolean;
  
  // Quality threshold
  minQualityScore: number;
  
  // Anti-spam limits
  articlesPerDay: number;
  maxPerHour: number;
  minIntervalMinutes: number;
  
  // Active schedule
  activeHours: number[];
  activeDays: number[];
  
  // Indexing settings
  indexingProviders: {
    google: boolean;
    bing: boolean;
    indexNow: boolean;
  };
}

export interface AutomationSettingsInput {
  autoTranslate?: boolean;
  autoGenerateImage?: boolean;
  autoPublish?: boolean;
  autoIndex?: boolean;
  minQualityScore?: number;
  articlesPerDay?: number;
  maxPerHour?: number;
  minIntervalMinutes?: number;
  activeHours?: number[];
  activeDays?: number[];
  indexingProviders?: {
    google?: boolean;
    bing?: boolean;
    indexNow?: boolean;
  };
}

// ============================================================================
// Queue Status
// ============================================================================

export interface QueueStatus {
  name: QueueName;
  displayName: string;
  size: number;
  processing: number;
  failed: number;
  completed: number;
  lastProcessed: string | null;
}

export interface WorkerStatus {
  running: boolean;
  lastHeartbeat: string;
  processedToday: number;
  memoryUsage: number;
  uptime: number;
}

export interface SchedulerStatus {
  lastRun: string | null;
  nextRun: string | null;
  isActive: boolean;
  interval: number;
}

export interface AutomationStatus {
  queues: QueueStatus[];
  workers: WorkerStatus;
  scheduler: SchedulerStatus;
  lastTestRun: string | null;
  alerts: AutomationAlert[];
}

export interface AutomationAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  source: AutomationStep | 'system';
  createdAt: string;
}

// ============================================================================
// Publication Queue
// ============================================================================

export interface PublicationQueueItem {
  id: number;
  articleId: number;
  platformId: number;
  priority: QueuePriority;
  status: PublicationStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations (optional, loaded via include)
  article?: {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
  };
  platform?: {
    id: number;
    name: string;
    domain: string;
    logo: string | null;
  };
}

export interface PublicationQueueFilters {
  status?: PublicationStatus | PublicationStatus[];
  platformId?: number;
  priority?: QueuePriority;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface PublicationQueueStats {
  pending: number;
  scheduled: number;
  publishing: number;
  publishedToday: number;
  failed: number;
  scheduledToday: number;
  avgPublishTime: number; // in seconds
  successRate: number; // percentage
  trend: 'up' | 'down' | 'stable';
  hourlyStats: { hour: number; count: number }[];
}

export interface PublicationHistoryFilters {
  status?: PublicationStatus;
  platformId?: number;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

// ============================================================================
// Schedule Preview
// ============================================================================

export interface ScheduleSlot {
  time: string;
  isAvailable: boolean;
  articleId?: number;
  articleTitle?: string;
}

export interface SchedulePreview {
  date: string;
  dayName: string;
  isActive: boolean;
  scheduledCount: number;
  capacity: number;
  remaining: number;
  slots: ScheduleSlot[];
}

// ============================================================================
// Test Results
// ============================================================================

export interface AutomationTestResult {
  step: AutomationStep;
  success: boolean;
  duration: number; // ms
  message: string;
  details?: Record<string, unknown>;
}

export interface AutomationTestRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  results: AutomationTestResult[];
  overallSuccess: boolean;
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface ScheduleArticleInput {
  articleId: number;
  platformId?: number;
  priority?: QueuePriority;
  scheduledAt?: string;
}

export interface ScheduleBatchInput {
  articleIds: number[];
  platformId?: number;
  priority?: QueuePriority;
}

export interface UpdatePriorityInput {
  id: number;
  priority: QueuePriority;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: { id: number; error: string }[];
}
