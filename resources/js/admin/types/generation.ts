/**
 * Generation System Types
 * Types for content generation jobs, queue, templates, and bulk operations
 */

import type { PlatformId, ContentTypeId, LanguageCode } from './program';

// ============================================================================
// ENUMS
// ============================================================================

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export type BulkUploadStatus = 'uploading' | 'validating' | 'ready' | 'processing' | 'completed' | 'failed';

export type ManualTitleStatus = 'draft' | 'queued' | 'generating' | 'completed' | 'failed';

export type TemplateVariableType = 'text' | 'number' | 'select' | 'date' | 'boolean';

// ============================================================================
// GENERATION JOB
// ============================================================================

export interface GenerationJob {
  id: string;
  type: ContentTypeId;
  status: QueueStatus;
  priority: JobPriority;
  platformId: PlatformId;
  countryId: string;
  languageId: LanguageCode;
  themeId?: string;
  templateId?: string;
  
  // Result
  articleId?: string;
  articleTitle?: string;
  articleUrl?: string;
  
  // Metrics
  cost: number;
  duration?: number; // seconds
  wordCount?: number;
  tokensUsed?: number;
  
  // Progress
  progress?: number; // 0-100
  currentStep?: string;
  
  // Error handling
  error?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;
  
  // Metadata
  triggeredBy: 'manual' | 'program' | 'bulk' | 'api';
  programId?: string;
  bulkUploadId?: string;
  
  // Timestamps
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledAt?: string;
}

export interface QueueItem extends GenerationJob {
  position: number;
  estimatedStartTime?: string;
  estimatedDuration?: number;
}

export interface GenerationJobFilters {
  status?: QueueStatus[];
  priority?: JobPriority[];
  type?: ContentTypeId[];
  platformId?: PlatformId;
  countryId?: string;
  languageId?: LanguageCode;
  triggeredBy?: GenerationJob['triggeredBy'][];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'createdAt' | 'priority' | 'status' | 'cost';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUEUE
// ============================================================================

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  
  // Rate metrics
  jobsPerMinute: number;
  avgDuration: number; // seconds
  avgCost: number;
  
  // Estimates
  estimatedCompletionTime?: string;
  estimatedTotalCost: number;
  
  // Today stats
  todayCompleted: number;
  todayCost: number;
  todayFailed: number;
}

export interface QueueConfig {
  isPaused: boolean;
  maxConcurrent: number;
  defaultPriority: JobPriority;
  autoRetry: boolean;
  maxRetries: number;
  retryDelaySeconds: number;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export interface TemplateVariable {
  name: string;
  label: string;
  type: TemplateVariableType;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: Array<{ value: string; label: string }>; // for select type
  description?: string;
  placeholder?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  contentType: ContentTypeId;
  platformId?: PlatformId; // null = all platforms
  
  // Content
  content: string; // Template with {{variables}}
  variables: TemplateVariable[];
  
  // Settings
  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  
  // Metadata
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TemplateFilters {
  contentType?: ContentTypeId;
  platformId?: PlatformId;
  isDefault?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  contentType: ContentTypeId;
  platformId?: PlatformId;
  content: string;
  variables: TemplateVariable[];
  isDefault?: boolean;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  isActive?: boolean;
}

export interface TemplatePreviewData {
  [variableName: string]: string | number | boolean;
}

export interface TemplatePreviewResult {
  renderedContent: string;
  missingVariables: string[];
  estimatedWordCount: number;
  estimatedCost: number;
}

// ============================================================================
// MANUAL TITLE
// ============================================================================

export interface ManualTitle {
  id: string;
  title: string;
  description?: string;
  
  // Context
  platformId: PlatformId;
  countryId: string;
  languageId: LanguageCode;
  themeId?: string;
  
  // Template
  templateId?: string;
  templateType?: ContentTypeId;
  
  // Status
  status: ManualTitleStatus;
  jobId?: string;
  articleId?: string;
  
  // Scheduling
  scheduledAt?: string;
  
  // Metadata
  createdAt: string;
  createdBy?: string;
  error?: string;
}

export interface ManualTitleFilters {
  status?: ManualTitleStatus[];
  platformId?: PlatformId;
  countryId?: string;
  languageId?: LanguageCode;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateManualTitleInput {
  title: string;
  description?: string;
  platformId: PlatformId;
  countryId: string;
  languageId: LanguageCode;
  themeId?: string;
  templateId?: string;
  templateType?: ContentTypeId;
  scheduledAt?: string;
  generateImmediately?: boolean;
}

// ============================================================================
// BULK UPLOAD
// ============================================================================

export interface BulkUploadRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BulkUploadColumnMapping {
  csvColumn: string;
  targetField: string;
  isRequired: boolean;
  transform?: 'lowercase' | 'uppercase' | 'trim' | 'slug';
}

export interface BulkUpload {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  
  // Processing status
  status: BulkUploadStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  failedRows: number;
  
  // Configuration
  columnMappings: BulkUploadColumnMapping[];
  templateId?: string;
  platformId: PlatformId;
  defaultLanguageId: LanguageCode;
  
  // Scheduling
  scheduledAt?: string;
  
  // Results
  jobIds: string[];
  
  // Metadata
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
  error?: string;
}

export interface BulkUploadPreview {
  filename: string;
  totalRows: number;
  validRows: number;
  columns: string[];
  sampleRows: BulkUploadRow[];
  suggestedMappings: BulkUploadColumnMapping[];
}

export interface CreateBulkUploadInput {
  file: File;
  platformId: PlatformId;
  defaultLanguageId: LanguageCode;
  templateId?: string;
  scheduledAt?: string;
}

export interface UpdateBulkUploadInput {
  columnMappings: BulkUploadColumnMapping[];
  templateId?: string;
  scheduledAt?: string;
}

// ============================================================================
// GENERATION SETTINGS
// ============================================================================

export interface GenerationSettings {
  // Limits
  dailyLimit: number;
  monthlyLimit: number;
  concurrentLimit: number;
  
  // Defaults by content type
  defaultModels: Record<ContentTypeId, string>;
  defaultTemplates: Record<ContentTypeId, string>;
  
  // Quality
  qualityThreshold: number; // 0-100
  autoRejectBelowThreshold: boolean;
  
  // Retry
  autoRetry: boolean;
  maxRetries: number;
  retryDelayMinutes: number;
  
  // Notifications
  notifyOnComplete: boolean;
  notifyOnFail: boolean;
  notifyEmail?: string;
  
  // Cost
  dailyBudget?: number;
  monthlyBudget?: number;
  alertOnBudgetPercent: number; // e.g., 80 = alert at 80%
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface GenerationJobResponse {
  job: GenerationJob;
  position?: number;
  estimatedWait?: number;
}

export interface QueueResponse {
  items: QueueItem[];
  stats: QueueStats;
  config: QueueConfig;
}

export interface BulkUploadResponse {
  upload: BulkUpload;
  preview?: BulkUploadPreview;
}
