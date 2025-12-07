/**
 * Settings Hooks
 * Application settings management
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type { ApiResponse } from '@/types/common';

// ============================================================================
// TYPES
// ============================================================================

export type SettingsSection = 
  | 'general'
  | 'generation'
  | 'seo'
  | 'api'
  | 'notifications'
  | 'integrations'
  | 'billing'
  | 'team';

export interface GeneralSettings {
  siteName: string;
  defaultLanguage: string;
  defaultPlatform: string;
  timezone: string;
  dateFormat: string;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
}

export interface GenerationSettings {
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTemplate: string;
  enableAIAssist: boolean;
  enableAutoTranslation: boolean;
  translationProvider: 'deepl' | 'google' | 'openai';
  parallelJobs: number;
  retryAttempts: number;
  retryDelay: number; // seconds
  costAlertThreshold: number; // USD
}

export interface SeoSettings {
  defaultMetaTitleSuffix: string;
  defaultMetaDescription: string;
  enableSchemaMarkup: boolean;
  enableOpenGraph: boolean;
  enableTwitterCards: boolean;
  defaultOgImage: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  sitemapFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface ApiSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  perplexityApiKey: string;
  deeplApiKey: string;
  googleApiKey: string;
  stripeApiKey: string;
  webhookSecret: string;
  rateLimit: number; // requests per minute
  enableLogging: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailFrom: string;
  emailReplyTo: string;
  slackEnabled: boolean;
  slackWebhookUrl: string;
  slackChannel: string;
  notifyOnJobComplete: boolean;
  notifyOnJobFailed: boolean;
  notifyOnLowCredits: boolean;
  notifyOnNewUser: boolean;
  dailyDigest: boolean;
  digestTime: string; // HH:mm
}

export interface IntegrationSettings {
  wordpressEnabled: boolean;
  wordpressApiUrl: string;
  wordpressUsername: string;
  wordpressPassword: string;
  ghostEnabled: boolean;
  ghostApiUrl: string;
  ghostApiKey: string;
  webhooksEnabled: boolean;
  webhookEndpoints: WebhookEndpoint[];
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}

export interface BillingSettings {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  billingEmail: string;
  companyName: string;
  vatNumber: string;
  address: string;
  creditBalance: number;
  autoRecharge: boolean;
  autoRechargeThreshold: number;
  autoRechargeAmount: number;
}

export interface TeamSettings {
  allowInvites: boolean;
  defaultRole: 'viewer' | 'editor' | 'admin';
  requireApproval: boolean;
  maxTeamSize: number;
  ssoEnabled: boolean;
  ssoProvider: string;
  ssoClientId: string;
  ssoClientSecret: string;
}

export interface AllSettings {
  general: GeneralSettings;
  generation: GenerationSettings;
  seo: SeoSettings;
  api: ApiSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  billing: BillingSettings;
  team: TeamSettings;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const settingsKeys = {
  all: ['settings'] as const,
  section: (section: SettingsSection) => [...settingsKeys.all, section] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all settings
 */
export function useSettings() {
  return useApiQuery<ApiResponse<AllSettings>>(
    settingsKeys.all,
    '/admin/settings',
    undefined,
    { staleTime: 300000 } // 5 minutes
  );
}

/**
 * Get settings for a specific section
 */
export function useSettingsSection<T extends SettingsSection>(section: T) {
  type SectionType = T extends 'general' ? GeneralSettings
    : T extends 'generation' ? GenerationSettings
    : T extends 'seo' ? SeoSettings
    : T extends 'api' ? ApiSettings
    : T extends 'notifications' ? NotificationSettings
    : T extends 'integrations' ? IntegrationSettings
    : T extends 'billing' ? BillingSettings
    : T extends 'team' ? TeamSettings
    : never;

  return useApiQuery<ApiResponse<SectionType>>(
    settingsKeys.section(section),
    `/admin/settings/${section}`,
    undefined,
    { staleTime: 300000 }
  );
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update settings for a section
 */
export function useUpdateSettings<T extends SettingsSection>(section: T) {
  const toast = useToast();
  const queryClient = useQueryClient();

  type SectionType = T extends 'general' ? Partial<GeneralSettings>
    : T extends 'generation' ? Partial<GenerationSettings>
    : T extends 'seo' ? Partial<SeoSettings>
    : T extends 'api' ? Partial<ApiSettings>
    : T extends 'notifications' ? Partial<NotificationSettings>
    : T extends 'integrations' ? Partial<IntegrationSettings>
    : T extends 'billing' ? Partial<BillingSettings>
    : T extends 'team' ? Partial<TeamSettings>
    : never;

  return useApiMutation<ApiResponse<void>, SectionType>(
    async (settingsData) => {
      const { data } = await api.put<ApiResponse<void>>(`/admin/settings/${section}`, settingsData);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Paramètres enregistrés');
        queryClient.invalidateQueries({ queryKey: settingsKeys.all });
        queryClient.invalidateQueries({ queryKey: settingsKeys.section(section) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Test API connection
 */
export function useTestApiConnection() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<{ success: boolean; latency: number; error?: string }>,
    { provider: string }
  >(
    async ({ provider }) => {
      const { data } = await api.post<ApiResponse<{ success: boolean; latency: number; error?: string }>>(`/admin/settings/test-api/${provider}`);
      return data;
    },
    {
      onSuccess: (data, { provider }) => {
        if (data.data.success) {
          toast.success(`${provider}: Connexion réussie (${data.data.latency}ms)`);
        } else {
          toast.error(`${provider}: ${data.data.error}`);
        }
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Test webhook endpoint
 */
export function useTestWebhook() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<{ success: boolean; statusCode: number; error?: string }>,
    { url: string; secret: string }
  >(
    async (webhookData) => {
      const { data } = await api.post<ApiResponse<{ success: boolean; statusCode: number; error?: string }>>('/admin/settings/test-webhook', webhookData);
      return data;
    },
    {
      onSuccess: (data) => {
        if (data.data.success) {
          toast.success(`Webhook OK (${data.data.statusCode})`);
        } else {
          toast.error(`Webhook: ${data.data.error}`);
        }
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Add webhook endpoint
 */
export function useAddWebhookEndpoint() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<WebhookEndpoint>,
    Omit<WebhookEndpoint, 'id'>
  >(
    async (webhookData) => {
      const { data } = await api.post<ApiResponse<WebhookEndpoint>>('/admin/settings/webhooks', webhookData);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Webhook ajouté');
        queryClient.invalidateQueries({ queryKey: settingsKeys.section('integrations') });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Delete webhook endpoint
 */
export function useDeleteWebhookEndpoint() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/settings/webhooks/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Webhook supprimé');
        queryClient.invalidateQueries({ queryKey: settingsKeys.section('integrations') });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Regenerate API key
 */
export function useRegenerateApiKey() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<{ key: string }>, { keyType: string }>(
    async ({ keyType }) => {
      const { data } = await api.post<ApiResponse<{ key: string }>>(`/admin/settings/regenerate-key/${keyType}`);
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success('Clé régénérée');
        queryClient.invalidateQueries({ queryKey: settingsKeys.section('api') });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Export settings
 */
export function useExportSettings() {
  const toast = useToast();

  return useApiMutation<Blob, { sections?: SettingsSection[] }>(
    async ({ sections }) => {
      const { data } = await api.post<Blob>('/admin/settings/export', { sections }, {
        responseType: 'blob',
      });
      return data;
    },
    {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success('Paramètres exportés');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Import settings
 */
export function useImportSettings() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<{ imported: string[] }>, File>(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<ApiResponse<{ imported: string[] }>>('/admin/settings/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data.imported.length} sections importées`);
        queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}
