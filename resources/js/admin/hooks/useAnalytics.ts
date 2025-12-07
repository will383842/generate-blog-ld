/**
 * Analytics Hooks
 * File 328 - TanStack Query hooks for analytics and reporting
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';

const API_BASE = '/admin/analytics';

// ============================================
// Types
// ============================================

export type PeriodType = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DateRange {
  start: string;
  end: string;
  compareStart?: string;
  compareEnd?: string;
}

export interface AnalyticsDashboardData {
  totalViews: number;
  viewsTrend: number;
  uniqueVisitors: number;
  visitorsTrend: number;
  avgSessionDuration: number;
  durationTrend: number;
  bounceRate: number;
  bounceTrend: number;
  conversions: number;
  conversionsTrend: number;
  conversionRate: number;
  realtimeUsers: number;
  trafficSources: TrafficSource[];
  topContent: TopContent[];
  dailyData: DailyMetric[];
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
  trend: number;
  color: string;
}

export interface TrafficData {
  dailyTraffic: DailyTraffic[];
  sources: TrafficSource[];
  countries: CountryTraffic[];
  devices: DeviceTraffic[];
  referrers: ReferrerTraffic[];
}

export interface DailyTraffic {
  date: string;
  views: number;
  visitors: number;
  sessions: number;
  organic: number;
  direct: number;
  referral: number;
  social: number;
}

export interface CountryTraffic {
  country: string;
  countryCode: string;
  visitors: number;
  percentage: number;
}

export interface DeviceTraffic {
  device: 'desktop' | 'mobile' | 'tablet';
  visitors: number;
  percentage: number;
}

export interface ReferrerTraffic {
  referrer: string;
  visitors: number;
  bounceRate: number;
}

export interface ConversionsData {
  totalConversions: number;
  conversionRate: number;
  trend: number;
  funnel: FunnelStep[];
  goals: Goal[];
  bySource: ConversionBySource[];
  daily: DailyConversion[];
}

export interface FunnelStep {
  id: string;
  name: string;
  visitors: number;
  percentage: number;
  dropOff: number;
  dropOffRate: number;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  percentage: number;
  trend: number;
}

export interface ConversionBySource {
  source: string;
  conversions: number;
  rate: number;
}

export interface DailyConversion {
  date: string;
  conversions: number;
  rate: number;
}

export interface TopContent {
  id: number;
  title: string;
  url: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
  trend: number;
  platformId: number;
  platformName: string;
}

export interface DailyMetric {
  date: string;
  views: number;
  visitors: number;
  conversions: number;
}

export interface BenchmarkData {
  platforms: PlatformBenchmark[];
  metrics: MetricBenchmark[];
  recommendations: string[];
}

export interface PlatformBenchmark {
  id: number;
  name: string;
  domain: string;
  metrics: {
    views: number;
    viewsTrend: number;
    visitors: number;
    visitorsTrend: number;
    bounceRate: number;
    bounceTrend: number;
    avgDuration: number;
    durationTrend: number;
    conversions: number;
    conversionsTrend: number;
  };
}

export interface MetricBenchmark {
  metric: string;
  platforms: {
    platformId: number;
    value: number;
    trend: number;
    rank: number;
  }[];
  best: number;
  average: number;
}

export interface Report {
  id: number;
  name: string;
  type: 'dashboard' | 'traffic' | 'conversions' | 'content' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
  sections: string[];
  dateRange: DateRange;
  schedule?: ReportSchedule;
  createdAt: string;
  lastGeneratedAt?: string;
  downloadUrl?: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  enabled: boolean;
}

export interface CreateReportInput {
  name: string;
  type: string;
  format: 'pdf' | 'excel' | 'csv';
  sections: string[];
  dateRange: DateRange;
}

export interface ScheduleReportInput {
  reportId: number;
  schedule: ReportSchedule;
}

// ============================================
// Query Keys
// ============================================

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (period: PeriodType, dateRange?: DateRange) => 
    [...analyticsKeys.all, 'dashboard', period, dateRange] as const,
  traffic: (period: PeriodType, dateRange?: DateRange) => 
    [...analyticsKeys.all, 'traffic', period, dateRange] as const,
  conversions: (period: PeriodType, dateRange?: DateRange) => 
    [...analyticsKeys.all, 'conversions', period, dateRange] as const,
  topPerformers: (type: string, period: PeriodType) => 
    [...analyticsKeys.all, 'top-performers', type, period] as const,
  benchmarks: () => [...analyticsKeys.all, 'benchmarks'] as const,
  reports: () => [...analyticsKeys.all, 'reports'] as const,
  reportsList: () => [...analyticsKeys.reports(), 'list'] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchDashboard(period: PeriodType, dateRange?: DateRange): Promise<AnalyticsDashboardData> {
  const params: Record<string, string> = { period };
  if (dateRange) {
    params.start = dateRange.start;
    params.end = dateRange.end;
  }
  const { data } = await api.get<AnalyticsDashboardData>(`${API_BASE}/dashboard`, { params });
  return data;
}

async function fetchTrafficData(period: PeriodType, dateRange?: DateRange): Promise<TrafficData> {
  const params: Record<string, string> = { period };
  if (dateRange) {
    params.start = dateRange.start;
    params.end = dateRange.end;
  }
  const { data } = await api.get<TrafficData>(`${API_BASE}/traffic`, { params });
  return data;
}

async function fetchConversionsData(period: PeriodType, dateRange?: DateRange): Promise<ConversionsData> {
  const params: Record<string, string> = { period };
  if (dateRange) {
    params.start = dateRange.start;
    params.end = dateRange.end;
  }
  const { data } = await api.get<ConversionsData>(`${API_BASE}/conversions`, { params });
  return data;
}

async function fetchTopPerformers(type: string, period: PeriodType): Promise<TopContent[]> {
  const { data } = await api.get<TopContent[]>(`${API_BASE}/top-performers`, { params: { type, period } });
  return data;
}

async function fetchBenchmarks(): Promise<BenchmarkData> {
  const { data } = await api.get<BenchmarkData>(`${API_BASE}/benchmarks`);
  return data;
}

async function fetchReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>(`${API_BASE}/reports`);
  return data;
}

async function createReport(input: CreateReportInput): Promise<Report> {
  const { data } = await api.post<Report>(`${API_BASE}/reports`, input);
  return data;
}

async function scheduleReport(input: ScheduleReportInput): Promise<Report> {
  const { data } = await api.post<Report>(`${API_BASE}/reports/${input.reportId}/schedule`, input.schedule);
  return data;
}

async function deleteReport(id: number): Promise<void> {
  await api.delete(`${API_BASE}/reports/${id}`);
}

async function generateReport(id: number): Promise<{ downloadUrl: string }> {
  const { data } = await api.post<{ downloadUrl: string }>(`${API_BASE}/reports/${id}/generate`);
  return data;
}

async function exportAnalytics(
  type: string,
  format: 'pdf' | 'excel' | 'csv',
  period: PeriodType,
  dateRange?: DateRange
): Promise<Blob> {
  const params: Record<string, string> = { type, format, period };
  if (dateRange) {
    params.start = dateRange.start;
    params.end = dateRange.end;
  }
  const { data } = await api.get<Blob>(`${API_BASE}/export`, { params, responseType: 'blob' });
  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useAnalyticsDashboard(period: PeriodType = '30d', dateRange?: DateRange) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(period, dateRange),
    queryFn: () => fetchDashboard(period, dateRange),
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useTrafficData(period: PeriodType = '30d', dateRange?: DateRange) {
  return useQuery({
    queryKey: analyticsKeys.traffic(period, dateRange),
    queryFn: () => fetchTrafficData(period, dateRange),
    staleTime: 60000,
  });
}

export function useConversionsData(period: PeriodType = '30d', dateRange?: DateRange) {
  return useQuery({
    queryKey: analyticsKeys.conversions(period, dateRange),
    queryFn: () => fetchConversionsData(period, dateRange),
    staleTime: 60000,
  });
}

export function useTopPerformers(type: string = 'articles', period: PeriodType = '30d') {
  return useQuery({
    queryKey: analyticsKeys.topPerformers(type, period),
    queryFn: () => fetchTopPerformers(type, period),
    staleTime: 300000,
  });
}

export function useBenchmarks() {
  return useQuery({
    queryKey: analyticsKeys.benchmarks(),
    queryFn: fetchBenchmarks,
    staleTime: 300000,
  });
}

export function useReports() {
  return useQuery({
    queryKey: analyticsKeys.reportsList(),
    queryFn: fetchReports,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
      toast({ title: 'Rapport créé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer le rapport', variant: 'destructive' });
    },
  });
}

export function useScheduleReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: scheduleReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
      toast({ title: 'Planification sauvegardée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de planifier le rapport', variant: 'destructive' });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
      toast({ title: 'Rapport supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le rapport', variant: 'destructive' });
    },
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.reports() });
      toast({ title: 'Rapport généré' });
      // Auto download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de générer le rapport', variant: 'destructive' });
    },
  });
}

export function useExportAnalytics() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      type,
      format,
      period,
      dateRange,
    }: {
      type: string;
      format: 'pdf' | 'excel' | 'csv';
      period: PeriodType;
      dateRange?: DateRange;
    }) => exportAnalytics(type, format, period, dateRange),
    onSuccess: (blob, { type, format }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      toast({ title: 'Export téléchargé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'exporter', variant: 'destructive' });
    },
  });
}
