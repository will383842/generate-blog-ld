/**
 * Publishing Types
 * File 374 - Types for external publishing API
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type PublishStatus = 
  | 'pending' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

export type AuthType = 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type PlatformType = 'wordpress' | 'custom_api' | 'webhook' | 'ftp' | 'other';

export type WebhookEvent = 
  | 'article.created'
  | 'article.published'
  | 'article.updated'
  | 'article.deleted'
  | 'publication.queued'
  | 'publication.published'
  | 'publication.failed';

export const PUBLISH_STATUS_CONFIG: Record<PublishStatus, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'slate' },
  scheduled: { label: 'Planifié', color: 'blue' },
  publishing: { label: 'Publication...', color: 'yellow' },
  published: { label: 'Publié', color: 'green' },
  failed: { label: 'Échoué', color: 'red' },
  cancelled: { label: 'Annulé', color: 'gray' },
};

export const AUTH_TYPE_CONFIG: Record<AuthType, { label: string; description: string }> = {
  none: { label: 'Aucune', description: 'Pas d\'authentification requise' },
  api_key: { label: 'Clé API', description: 'Clé API dans header ou query' },
  bearer: { label: 'Bearer Token', description: 'Token JWT ou OAuth' },
  basic: { label: 'Basic Auth', description: 'Username et password' },
  oauth2: { label: 'OAuth 2.0', description: 'Authentification OAuth 2.0' },
};

export const PLATFORM_TYPE_CONFIG: Record<PlatformType, { label: string; icon: string }> = {
  wordpress: { label: 'WordPress', icon: '📝' },
  custom_api: { label: 'API Custom', icon: '🔌' },
  webhook: { label: 'Webhook', icon: '🪝' },
  ftp: { label: 'FTP/SFTP', icon: '📁' },
  other: { label: 'Autre', icon: '🔗' },
};

export const WEBHOOK_EVENTS: { group: string; events: { value: WebhookEvent; label: string }[] }[] = [
  {
    group: 'Article',
    events: [
      { value: 'article.created', label: 'Article créé' },
      { value: 'article.published', label: 'Article publié' },
      { value: 'article.updated', label: 'Article mis à jour' },
      { value: 'article.deleted', label: 'Article supprimé' },
    ],
  },
  {
    group: 'Publication',
    events: [
      { value: 'publication.queued', label: 'Publication en queue' },
      { value: 'publication.published', label: 'Publication réussie' },
      { value: 'publication.failed', label: 'Publication échouée' },
    ],
  },
];

// ============================================================================
// External Platform
// ============================================================================

export interface AuthConfig {
  // API Key
  apiKey?: string;
  apiKeyHeader?: string;
  apiKeyLocation?: 'header' | 'query';
  
  // Bearer
  bearerToken?: string;
  
  // Basic Auth
  username?: string;
  password?: string;
  
  // OAuth2
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetPath: string;
  transform?: 'none' | 'json_encode' | 'html_strip' | 'truncate' | 'custom';
  transformConfig?: Record<string, unknown>;
}

export interface ExternalPlatform {
  id: number;
  name: string;
  type: PlatformType;
  baseUrl: string;
  authType: AuthType;
  authConfig: AuthConfig;
  defaultHeaders: Record<string, string>;
  fieldMapping: FieldMapping[];
  isActive: boolean;
  lastSync: string | null;
  articlesCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformInput {
  name: string;
  type: PlatformType;
  baseUrl: string;
  authType: AuthType;
  authConfig?: AuthConfig;
  defaultHeaders?: Record<string, string>;
  fieldMapping?: FieldMapping[];
  isActive?: boolean;
}

export interface UpdatePlatformInput extends Partial<CreatePlatformInput> {
  id: number;
}

// ============================================================================
// Publishing Endpoint
// ============================================================================

export interface ResponseMapping {
  successPath?: string;
  successValue?: string;
  errorPath?: string;
  idPath?: string;
  urlPath?: string;
}

export interface PublishingEndpoint {
  id: number;
  platformId: number;
  name: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  bodyTemplate: string;
  responseMapping: ResponseMapping;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEndpointInput {
  platformId: number;
  name: string;
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  responseMapping?: ResponseMapping;
  isDefault?: boolean;
}

export interface UpdateEndpointInput extends Partial<Omit<CreateEndpointInput, 'platformId'>> {
  id: number;
}

// ============================================================================
// Publish Queue
// ============================================================================

export interface PublishQueue {
  id: number;
  contentId: number;
  contentType: 'article' | 'page' | 'custom';
  platformId: number;
  endpointId: number | null;
  status: PublishStatus;
  priority: 'high' | 'default' | 'low';
  scheduledAt: string | null;
  publishedAt: string | null;
  externalId: string | null;
  externalUrl: string | null;
  payload: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  error: string | null;
  retries: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  platform?: ExternalPlatform;
  content?: {
    id: number;
    title: string;
    slug: string;
  };
}

export interface PublishQueueFilters {
  status?: PublishStatus | PublishStatus[];
  platformId?: number;
  contentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

// ============================================================================
// Publish Log
// ============================================================================

export interface PublishLog {
  id: number;
  queueId: number;
  request: {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body: string | null;
  };
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: string | null;
  } | null;
  statusCode: number | null;
  duration: number;
  error: string | null;
  createdAt: string;
}

// ============================================================================
// Webhook
// ============================================================================

export interface Webhook {
  id: number;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  headers: Record<string, string>;
  isActive: boolean;
  lastTriggered: string | null;
  successRate: number;
  totalCalls: number;
  failedCalls: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateWebhookInput extends Partial<CreateWebhookInput> {
  id: number;
}

export interface WebhookLog {
  id: number;
  webhookId: number;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  request: {
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  response: {
    statusCode: number;
    body: string | null;
  } | null;
  success: boolean;
  duration: number;
  error: string | null;
  createdAt: string;
}

export interface WebhookLogFilters {
  event?: WebhookEvent;
  success?: boolean;
  dateFrom?: string;
  dateTo?: string;
  per_page?: number;
  page?: number;
}

// ============================================================================
// Connection Test
// ============================================================================

export interface ConnectionTestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  message: string | null;
  duration: number | null;
}

export interface ConnectionTestResult {
  success: boolean;
  steps: ConnectionTestStep[];
  latency: number | null;
  response: Record<string, unknown> | null;
  error: string | null;
}

// ============================================================================
// Publishing Stats
// ============================================================================

export interface PublishingStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  successRate: number;
  avgDuration: number;
  byPlatform: { platformId: number; platformName: string; count: number; successRate: number }[];
  byStatus: Record<PublishStatus, number>;
  recentErrors: { id: number; error: string; platformName: string; createdAt: string }[];
}
