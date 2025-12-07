/**
 * Monitoring Hooks
 * File 299 - TanStack Query hooks for costs, performance, and system health
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { useToast } from '@/hooks/useToast';

const API_BASE = '/admin/monitoring';

// ============================================
// Types
// ============================================

export interface DailyCost {
  date: string;
  total: number;
  breakdown: CostBreakdown;
  tokens_used: number;
  requests_count: number;
}

export interface MonthlyCost {
  month: string;
  total: number;
  breakdown: CostBreakdown;
  daily_average: number;
  trend: number; // percentage vs last month
  budget?: number;
  budget_percent?: number;
}

export interface CostBreakdown {
  openai: number;
  anthropic: number;
  perplexity: number;
  dalle: number;
  other: number;
}

export interface CostPrediction {
  end_of_month: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  recommendations: string[];
}

export interface CostAlert {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'spike_detected' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  created_at: string;
  acknowledged_at?: string;
}

export interface PerformanceMetrics {
  latency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    trend: number;
  };
  success_rate: number;
  error_rate: number;
  requests_per_minute: number;
  active_requests: number;
  trends: {
    date: string;
    latency: number;
    success_rate: number;
    requests: number;
  }[];
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed_today: number;
  failed_today: number;
  avg_wait_time: number;
  avg_process_time: number;
  throughput_per_hour: number;
  by_priority: {
    high: number;
    normal: number;
    low: number;
  };
}

export interface ErrorStats {
  total_today: number;
  total_week: number;
  by_type: {
    type: string;
    count: number;
    percentage: number;
  }[];
  by_api: {
    api: string;
    count: number;
    rate: number;
  }[];
  recent: {
    id: string;
    type: string;
    message: string;
    api: string;
    timestamp: string;
  }[];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  database_status: 'connected' | 'slow' | 'disconnected';
  cache_status: 'connected' | 'slow' | 'disconnected';
  queue_status: 'running' | 'paused' | 'stopped';
  last_check: string;
}

export interface ApiHealth {
  api: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number;
  last_success: string;
  last_error?: string;
  error_rate_24h: number;
  requests_24h: number;
  uptime_30d: number;
}

export interface ModelConfig {
  id: number;
  content_type: string;
  primary_model: string;
  fallback_models: string[];
  temperature: number;
  max_tokens: number;
  timeout_ms: number;
  retry_count: number;
  ab_testing_enabled: boolean;
  ab_variant_model?: string;
  ab_traffic_percent?: number;
  created_at: string;
  updated_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  features: string[];
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'premium';
  recommended_for: string[];
}

export interface PromptTemplate {
  id: number;
  name: string;
  slug: string;
  content_type: string;
  template: string;
  variables: string[];
  version: number;
  is_active: boolean;
  token_estimate: number;
  performance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: number;
  prompt_id: number;
  version: number;
  template: string;
  notes?: string;
  performance_score?: number;
  created_at: string;
  created_by?: number;
}

// Query keys
export const monitoringKeys = {
  all: ['monitoring'] as const,
  costs: () => [...monitoringKeys.all, 'costs'] as const,
  dailyCosts: (days: number) => [...monitoringKeys.costs(), 'daily', days] as const,
  monthlyCosts: (months: number) => [...monitoringKeys.costs(), 'monthly', months] as const,
  costPredictions: () => [...monitoringKeys.costs(), 'predictions'] as const,
  costBreakdown: (period: string) => [...monitoringKeys.costs(), 'breakdown', period] as const,
  costAlerts: () => [...monitoringKeys.costs(), 'alerts'] as const,
  performance: () => [...monitoringKeys.all, 'performance'] as const,
  performanceMetrics: () => [...monitoringKeys.performance(), 'metrics'] as const,
  queueStats: () => [...monitoringKeys.performance(), 'queue'] as const,
  errorStats: () => [...monitoringKeys.performance(), 'errors'] as const,
  health: () => [...monitoringKeys.all, 'health'] as const,
  systemHealth: () => [...monitoringKeys.health(), 'system'] as const,
  apiHealth: () => [...monitoringKeys.health(), 'apis'] as const,
  models: () => [...monitoringKeys.all, 'models'] as const,
  modelConfigs: () => [...monitoringKeys.models(), 'configs'] as const,
  modelInfo: () => [...monitoringKeys.models(), 'info'] as const,
  prompts: () => [...monitoringKeys.all, 'prompts'] as const,
  promptTemplates: () => [...monitoringKeys.prompts(), 'templates'] as const,
  promptVersions: (id: number) => [...monitoringKeys.prompts(), 'versions', id] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchDailyCosts(days: number): Promise<DailyCost[]> {
  const { data } = await api.get<DailyCost[]>(`${API_BASE}/costs/daily`, { params: { days } });
  return data;
}

async function fetchMonthlyCosts(months: number): Promise<MonthlyCost[]> {
  const { data } = await api.get<MonthlyCost[]>(`${API_BASE}/costs/monthly`, { params: { months } });
  return data;
}

async function fetchCostPredictions(): Promise<CostPrediction> {
  const { data } = await api.get<CostPrediction>(`${API_BASE}/costs/predictions`);
  return data;
}

async function fetchCostBreakdown(period: string): Promise<CostBreakdown> {
  const { data } = await api.get<CostBreakdown>(`${API_BASE}/costs/breakdown`, { params: { period } });
  return data;
}

async function fetchCostAlerts(): Promise<CostAlert[]> {
  const { data } = await api.get<CostAlert[]>(`${API_BASE}/costs/alerts`);
  return data;
}

async function acknowledgeCostAlert(id: string): Promise<void> {
  await api.post(`${API_BASE}/costs/alerts/${id}/acknowledge`);
}

async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  const { data } = await api.get<PerformanceMetrics>(`${API_BASE}/performance/metrics`);
  return data;
}

async function fetchQueueStats(): Promise<QueueStats> {
  const { data } = await api.get<QueueStats>(`${API_BASE}/performance/queue`);
  return data;
}

async function fetchErrorStats(): Promise<ErrorStats> {
  const { data } = await api.get<ErrorStats>(`${API_BASE}/performance/errors`);
  return data;
}

async function fetchSystemHealth(): Promise<SystemHealth> {
  const { data } = await api.get<SystemHealth>(`${API_BASE}/health/system`);
  return data;
}

async function fetchApiHealth(): Promise<ApiHealth[]> {
  const { data } = await api.get<ApiHealth[]>(`${API_BASE}/health/apis`);
  return data;
}

async function pingApiEndpoint(apiName: string): Promise<{ latency: number; status: string }> {
  const { data } = await api.post<{ latency: number; status: string }>(`${API_BASE}/health/apis/${apiName}/ping`);
  return data;
}

async function fetchModelConfigs(): Promise<ModelConfig[]> {
  const { data } = await api.get<ModelConfig[]>(`${API_BASE}/models/configs`);
  return data;
}

async function updateModelConfig(id: number, configData: Partial<ModelConfig>): Promise<ModelConfig> {
  const { data } = await api.put<ModelConfig>(`${API_BASE}/models/configs/${id}`, configData);
  return data;
}

async function fetchModelInfo(): Promise<ModelInfo[]> {
  const { data } = await api.get<ModelInfo[]>(`${API_BASE}/models/info`);
  return data;
}

async function fetchPromptTemplates(): Promise<PromptTemplate[]> {
  const { data } = await api.get<PromptTemplate[]>(`${API_BASE}/prompts/templates`);
  return data;
}

async function updatePromptTemplate(id: number, templateData: Partial<PromptTemplate>): Promise<PromptTemplate> {
  const { data } = await api.put<PromptTemplate>(`${API_BASE}/prompts/templates/${id}`, templateData);
  return data;
}

async function fetchPromptVersions(promptId: number): Promise<PromptVersion[]> {
  const { data } = await api.get<PromptVersion[]>(`${API_BASE}/prompts/templates/${promptId}/versions`);
  return data;
}

async function testPrompt(template: string, variables: Record<string, string>): Promise<{
  output: string;
  tokens_used: number;
  latency_ms: number;
}> {
  const { data } = await api.post<{ output: string; tokens_used: number; latency_ms: number }>(`${API_BASE}/prompts/test`, { template, variables });
  return data;
}

// ============================================
// Query Hooks - Costs
// ============================================

export function useDailyCosts(days: number = 30) {
  return useQuery({
    queryKey: monitoringKeys.dailyCosts(days),
    queryFn: () => fetchDailyCosts(days),
    staleTime: 60000,
  });
}

export function useMonthlyCosts(months: number = 12) {
  return useQuery({
    queryKey: monitoringKeys.monthlyCosts(months),
    queryFn: () => fetchMonthlyCosts(months),
    staleTime: 300000,
  });
}

export function useCostPredictions() {
  return useQuery({
    queryKey: monitoringKeys.costPredictions(),
    queryFn: fetchCostPredictions,
    staleTime: 300000,
  });
}

export function useCostBreakdown(period: string = 'month') {
  return useQuery({
    queryKey: monitoringKeys.costBreakdown(period),
    queryFn: () => fetchCostBreakdown(period),
    staleTime: 60000,
  });
}

export function useCostAlerts() {
  return useQuery({
    queryKey: monitoringKeys.costAlerts(),
    queryFn: fetchCostAlerts,
    staleTime: 30000,
  });
}

// ============================================
// Query Hooks - Performance
// ============================================

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: monitoringKeys.performanceMetrics(),
    queryFn: fetchPerformanceMetrics,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useQueueStats() {
  return useQuery({
    queryKey: monitoringKeys.queueStats(),
    queryFn: fetchQueueStats,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useErrorStats() {
  return useQuery({
    queryKey: monitoringKeys.errorStats(),
    queryFn: fetchErrorStats,
    staleTime: 30000,
  });
}

// ============================================
// Query Hooks - Health
// ============================================

export function useSystemHealth() {
  return useQuery({
    queryKey: monitoringKeys.systemHealth(),
    queryFn: fetchSystemHealth,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useApiHealth() {
  return useQuery({
    queryKey: monitoringKeys.apiHealth(),
    queryFn: fetchApiHealth,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// ============================================
// Query Hooks - Models & Prompts
// ============================================

export function useModelConfigs() {
  return useQuery({
    queryKey: monitoringKeys.modelConfigs(),
    queryFn: fetchModelConfigs,
    staleTime: 60000,
  });
}

export function useModelInfo() {
  return useQuery({
    queryKey: monitoringKeys.modelInfo(),
    queryFn: fetchModelInfo,
    staleTime: 3600000, // 1 hour
  });
}

export function usePromptTemplates() {
  return useQuery({
    queryKey: monitoringKeys.promptTemplates(),
    queryFn: fetchPromptTemplates,
    staleTime: 60000,
  });
}

export function usePromptVersions(promptId: number) {
  return useQuery({
    queryKey: monitoringKeys.promptVersions(promptId),
    queryFn: () => fetchPromptVersions(promptId),
    enabled: promptId > 0,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useAcknowledgeCostAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: acknowledgeCostAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.costAlerts() });
      toast({ title: 'Alerte acquittée' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'acquitter l\'alerte',
        variant: 'destructive',
      });
    },
  });
}

export function usePingApi() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: pingApiEndpoint,
    onSuccess: (data, apiName) => {
      toast({
        title: `${apiName} - ${data.status}`,
        description: `Latence: ${data.latency}ms`,
      });
    },
    onError: (_, apiName) => {
      toast({
        title: `${apiName} - Erreur`,
        description: 'Impossible de contacter l\'API',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateModelConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<ModelConfig>) =>
      updateModelConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.modelConfigs() });
      toast({ title: 'Configuration mise à jour' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la configuration',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<PromptTemplate>) =>
      updatePromptTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.promptTemplates() });
      toast({ title: 'Template mis à jour' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le template',
        variant: 'destructive',
      });
    },
  });
}

export function useTestPrompt() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ template, variables }: { template: string; variables: Record<string, string> }) =>
      testPrompt(template, variables),
    onSuccess: (data) => {
      toast({
        title: 'Test réussi',
        description: `${data.tokens_used} tokens en ${data.latency_ms}ms`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Le test du prompt a échoué',
        variant: 'destructive',
      });
    },
  });
}
