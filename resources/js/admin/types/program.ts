// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM TYPES - Content Engine Programs System
// ═══════════════════════════════════════════════════════════════════════════

import type { PlatformId, LanguageCode, ContentTypeId } from '@/utils/constants';

// Re-export shared types so consumers can import from this module
export type { PlatformId, LanguageCode, ContentTypeId } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Program execution status
 */
export type ProgramStatus = 
  | 'draft'      // Not yet configured/activated
  | 'active'     // Running on schedule
  | 'paused'     // Temporarily stopped
  | 'scheduled'  // Waiting for next run
  | 'running'    // Currently executing
  | 'completed'  // Finished (one-time programs)
  | 'error';     // Stopped due to error

/**
 * Program run status
 */
export type ProgramRunStatus = 
  | 'pending'    // Waiting to start
  | 'running'    // Currently executing
  | 'completed'  // Successfully finished
  | 'partial'    // Completed with some failures
  | 'failed'     // Completely failed
  | 'cancelled'; // Manually cancelled

/**
 * Program item status
 */
export type ProgramItemStatus = 
  | 'pending'    // Waiting in queue
  | 'processing' // Being generated
  | 'completed'  // Successfully generated
  | 'failed'     // Generation failed
  | 'skipped';   // Skipped (duplicate, etc.)

/**
 * Recurrence type for program scheduling
 */
export type RecurrenceType = 
  | 'once'       // Single execution
  | 'daily'      // Every day
  | 'weekly'     // Specific days of week
  | 'monthly'    // Specific days of month
  | 'cron';      // Custom cron expression

/**
 * Quantity distribution mode
 */
export type QuantityMode = 
  | 'total'              // X articles total
  | 'perCountry'         // X articles per country
  | 'perLanguage'        // X articles per language
  | 'perCountryLanguage' // X articles per country/language combination
  | 'perTheme';          // X articles per theme

/**
 * Priority level for programs
 */
export type ProgramPriority = 'low' | 'normal' | 'high' | 'urgent';

// ═══════════════════════════════════════════════════════════════════════════
// RECURRENCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface RecurrenceConfigOnce {
  type: 'once';
  scheduledAt: string; // ISO date
}

export interface RecurrenceConfigDaily {
  type: 'daily';
  time: string; // HH:mm format
  timezone: string;
  excludeWeekends?: boolean;
}

export interface RecurrenceConfigWeekly {
  type: 'weekly';
  days: number[]; // 0-6 (Sunday = 0)
  time: string;
  timezone: string;
}

export interface RecurrenceConfigMonthly {
  type: 'monthly';
  dayOfMonth: number; // 1-31
  time: string;
  timezone: string;
}

export interface RecurrenceConfigCron {
  type: 'cron';
  expression: string; // Cron expression
  timezone: string;
}

export type RecurrenceConfig = 
  | RecurrenceConfigOnce
  | RecurrenceConfigDaily
  | RecurrenceConfigWeekly
  | RecurrenceConfigMonthly
  | RecurrenceConfigCron;

// ═══════════════════════════════════════════════════════════════════════════
// GENERATION OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface GenerationOptions {
  /** Model to use for generation */
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Word count range */
  wordCount?: {
    min: number;
    max: number;
  };
  /** Include featured image generation */
  generateImage?: boolean;
  /** Image model if generating images */
   imageModel?: 'dall-e-3' | 'dall-e-2' | 'stable-diffusion' | 'unsplash';
  /** SEO optimization level */
  seoOptimization?: 'basic' | 'advanced' | 'maximum';
  /** Include internal links */
  includeInternalLinks?: boolean;
  /** Include external links */
  includeExternalLinks?: boolean;
  /** Auto-publish after generation */
  autoPublish?: boolean;
  /** Delay before publish (seconds) */
  publishDelay?: number;
  /** Custom instructions */
  customInstructions?: string;
  /** Tone of voice */
  tone?: 'professional' | 'friendly' | 'formal' | 'casual' | 'expert';
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main Program interface
 */
export interface Program {
  id: string;
  name: string;
  description?: string;
  
  // Platform & Targeting
  platformId: PlatformId;
  contentTypes: ContentTypeId[];
  countries: string[]; // Country codes
  languages: LanguageCode[];
  themes: string[]; // Theme IDs
  
  // Quantity Configuration
  quantityMode: QuantityMode;
  quantityValue: number;
  
  // Scheduling
  recurrenceType: RecurrenceType;
  recurrenceConfig: RecurrenceConfig;
  
  // Status & Execution
  status: ProgramStatus;
  priority: ProgramPriority;
  nextRunAt: string | null;
  lastRunAt: string | null;
  
  // Generation Options
  generationOptions: GenerationOptions;
  
  // Constraints
  maxConcurrent: number;
  maxRetries: number;
  budgetLimit?: number; // Max cost per run
  cooldownMinutes?: number; // Min time between runs
  
  // Statistics
  totalRuns: number;
  totalGenerated: number;
  totalFailed: number;
  totalCost: number;
  averageRunTime: number; // seconds
  successRate: number; // 0-100
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Flags
  isActive: boolean;
  isArchived: boolean;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
}

/**
 * Program creation input
 */
export interface CreateProgramInput {
  name: string;
  description?: string;
  platformId: PlatformId;
  contentTypes: ContentTypeId[];
  countries: string[];
  languages: LanguageCode[];
  themes: string[];
  quantityMode: QuantityMode;
  quantityValue: number;
  recurrenceType: RecurrenceType;
  recurrenceConfig: RecurrenceConfig;
  status?: ProgramStatus;
  priority?: ProgramPriority;
  generationOptions?: Partial<GenerationOptions>;
  maxConcurrent?: number;
  maxRetries?: number;
  budgetLimit?: number;
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
}

/**
 * Program update input
 */
export interface UpdateProgramInput extends Partial<CreateProgramInput> {
  id: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM RUN INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A single execution instance of a program
 */
export interface ProgramRun {
  id: string;
  programId: string;
  programName: string;
  
  // Status
  status: ProgramRunStatus;
  
  // Timing
  startedAt: string;
  completedAt: string | null;
  duration: number | null; // seconds
  
  // Items
  itemsPlanned: number;
  itemsCompleted: number;
  itemsFailed: number;
  itemsSkipped: number;
  
  // Cost
  totalCost: number;
  costBreakdown: {
    gpt4: number;
    gpt35: number;
    dalle: number;
    other: number;
  };
  
  // Progress
  progress: number; // 0-100
  currentItem?: string;
  
  // Errors
  errorCount: number;
  lastError?: string;

  // Trigger
  triggeredBy: 'schedule' | 'manual' | 'api';
  triggeredByUser?: string;

  // Items detail (optional, loaded on demand)
  items?: ProgramItem[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual item within a program run
 */
export interface ProgramItem {
  id: string;
  programRunId: string;
  
  // Content specification
  contentType: ContentTypeId;
  countryId: string;
  countryName: string;
  languageId: LanguageCode;
  languageName: string;
  themeId?: string;
  themeName?: string;
  
  // Status
  status: ProgramItemStatus;
  
  // Result
  articleId?: number;
  articleTitle?: string;
  articleUrl?: string;
  wordCount?: number;
  
  // Cost & Timing
  cost: number;
  processingTime: number | null; // seconds
  startedAt?: string;
  completedAt?: string;
  
  // Error info
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESET INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reusable program configuration preset
 */
export interface Preset {
  id: string;
  name: string;
  description?: string;
  
  // Saved configuration
  config: PresetConfig;
  
  // Metadata
  isDefault: boolean;
  isSystem: boolean; // Cannot be deleted
  usageCount: number;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Preset configuration content
 */
export interface PresetConfig {
  platformId?: PlatformId;
  contentTypes?: ContentTypeId[];
  countries?: string[];
  languages?: LanguageCode[];
  themes?: string[];
  quantityMode?: QuantityMode;
  quantityValue?: number;
  recurrenceType?: RecurrenceType;
  recurrenceConfig?: RecurrenceConfig;
  generationOptions?: Partial<GenerationOptions>;
  maxConcurrent?: number;
  budgetLimit?: number;
}

/**
 * Preset creation input
 */
export interface CreatePresetInput {
  name: string;
  description?: string;
  config: PresetConfig;
  isDefault?: boolean;
}

/**
 * Preset update input
 */
export interface UpdatePresetInput extends Partial<CreatePresetInput> {
  id: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Program analytics data
 */
export interface ProgramAnalytics {
  programId: string;
  period: 'day' | 'week' | 'month' | 'year';
  
  // Summary
  totalRuns: number;
  totalGenerated: number;
  totalFailed: number;
  totalCost: number;
  successRate: number;
  averageRunTime: number;
  
  // Trends
  runsTrend: number; // % change
  generatedTrend: number;
  costTrend: number;
  
  // Breakdown by content type
  byContentType: Array<{
    type: ContentTypeId;
    count: number;
    cost: number;
    successRate: number;
  }>;
  
  // Breakdown by country
  byCountry: Array<{
    countryCode: string;
    countryName: string;
    count: number;
    cost: number;
  }>;
  
  // Breakdown by language
  byLanguage: Array<{
    code: LanguageCode;
    name: string;
    count: number;
    cost: number;
  }>;
  
  // Timeline data
  timeline: Array<{
    date: string;
    runs: number;
    generated: number;
    failed: number;
    cost: number;
  }>;
  
  // Cost breakdown
  costBreakdown: {
    gpt4: number;
    gpt35: number;
    dalle: number;
    perplexity: number;
    other: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProgramFilters {
  search?: string;
  status?: ProgramStatus | ProgramStatus[];
  platformId?: PlatformId;
  contentTypes?: ContentTypeId[];
  priority?: ProgramPriority;
  isActive?: boolean;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'createdAt' | 'nextRunAt' | 'totalGenerated' | 'totalCost';
  sortOrder?: 'asc' | 'desc';
}

export interface ProgramRunFilters {
  programId?: string;
  status?: ProgramRunStatus | ProgramRunStatus[];
  triggeredBy?: 'schedule' | 'manual' | 'api';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'startedAt' | 'completedAt' | 'itemsCompleted' | 'totalCost';
  sortOrder?: 'asc' | 'desc';
}

export interface ProgramItemFilters {
  programRunId?: string;
  status?: ProgramItemStatus | ProgramItemStatus[];
  contentType?: ContentTypeId;
  countryId?: string;
  languageId?: LanguageCode;
  page?: number;
  perPage?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Program summary for lists
 */
export interface ProgramSummary {
  id: string;
  name: string;
  platformId: PlatformId;
  status: ProgramStatus;
  priority: ProgramPriority;
  nextRunAt: string | null;
  lastRunAt: string | null;
  totalGenerated: number;
  totalFailed: number;
  totalCost: number;
  successRate: number;
  isActive: boolean;
  // Additional fields for calendar and analytics
  quantityValue?: number;
  recurrenceType?: RecurrenceType;
  scheduledAt?: string;
}

/**
 * Calendar event for program scheduling view
 */
export interface CalendarEvent {
  id: string;
  programId: string;
  programName: string;
  date: string;
  scheduledAt: string;
  type: 'scheduled' | 'recurring';
  status: ProgramStatus;
  itemsCount: number;
  estimatedCost: number;
}

/**
 * Quick stats for a program
 */
export interface ProgramQuickStats {
  todayGenerated: number;
  todayCost: number;
  weekGenerated: number;
  weekCost: number;
  monthGenerated: number;
  monthCost: number;
  pendingItems: number;
  errorCount: number;
}

/**
 * Program schedule preview
 */
export interface SchedulePreview {
  nextRuns: string[]; // Next 10 scheduled runs
  estimatedItemsPerRun: number;
  estimatedCostPerRun: number;
  estimatedMonthlyItems: number;
  estimatedMonthlyCost: number;
}

/**
 * Validation result for program configuration
 */
export interface ProgramValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  estimatedItemsPerRun: number;
  estimatedCostPerRun: number;
}