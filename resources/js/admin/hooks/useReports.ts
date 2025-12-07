/**
 * useReports Hook
 * Generate and manage various reports
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export interface Report {
  id: number;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  parameters: ReportParameters;
  schedule?: ReportSchedule;
  generatedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  createdAt: string;
  createdBy: number;
}

export type ReportType =
  | 'content_overview'
  | 'seo_performance'
  | 'translation_progress'
  | 'publishing_stats'
  | 'api_usage'
  | 'traffic_analytics'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export type ReportStatus =
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed';

export interface ReportParameters {
  dateRange: {
    start: string;
    end: string;
  };
  platforms?: number[];
  languages?: string[];
  sections?: string[];
  filters?: Record<string, unknown>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm
  recipients: string[];
  enabled: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  defaultSections: string[];
  availableSections: {
    id: string;
    name: string;
    description: string;
  }[];
}

export interface CreateReportInput {
  name: string;
  type: ReportType;
  format: ReportFormat;
  parameters: ReportParameters;
}

export interface ScheduleReportInput {
  reportId: number;
  schedule: ReportSchedule;
}

// ============================================================================
// Query Keys
// ============================================================================

export const reportKeys = {
  all: ['reports'] as const,
  list: (filters?: { type?: ReportType; status?: ReportStatus }) =>
    [...reportKeys.all, 'list', filters] as const,
  detail: (id: number) => [...reportKeys.all, 'detail', id] as const,
  templates: () => [...reportKeys.all, 'templates'] as const,
  scheduled: () => [...reportKeys.all, 'scheduled'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchReports(filters?: { type?: ReportType; status?: ReportStatus }): Promise<Report[]> {
  const { data } = await api.get<Report[]>('/admin/reports', { params: filters });
  return data;
}

async function fetchReport(id: number): Promise<Report> {
  const { data } = await api.get<Report>(`/admin/reports/${id}`);
  return data;
}

async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  const { data } = await api.get<ReportTemplate[]>('/admin/reports/templates');
  return data;
}

async function createReport(input: CreateReportInput): Promise<Report> {
  const { data } = await api.post<Report>('/admin/reports', input);
  return data;
}

async function generateReport(id: number): Promise<Report> {
  const { data } = await api.post<Report>(`/admin/reports/${id}/generate`);
  return data;
}

async function deleteReport(id: number): Promise<void> {
  await api.delete(`/admin/reports/${id}`);
}

async function scheduleReport(input: ScheduleReportInput): Promise<Report> {
  const { data } = await api.post<Report>(`/admin/reports/${input.reportId}/schedule`, input.schedule);
  return data;
}

async function unscheduleReport(id: number): Promise<Report> {
  const { data } = await api.delete<Report>(`/admin/reports/${id}/schedule`);
  return data;
}

async function downloadReport(id: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/admin/reports/${id}/download`, { responseType: 'blob' });
  return data;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all reports with optional filters
 */
export function useReports(filters?: { type?: ReportType; status?: ReportStatus }) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => fetchReports(filters),
    staleTime: 30000,
  });
}

/**
 * Fetch a single report
 */
export function useReport(id: number) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => fetchReport(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Auto-refresh if report is generating
      const report = query.state.data;
      return report?.status === 'generating' ? 3000 : false;
    },
  });
}

/**
 * Fetch report templates
 */
export function useReportTemplates() {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: fetchReportTemplates,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Create a new report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

/**
 * Generate a report
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(report.id), report);
      queryClient.invalidateQueries({ queryKey: reportKeys.list() });
    },
  });
}

/**
 * Delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

/**
 * Schedule a report
 */
export function useScheduleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleReport,
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(report.id), report);
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduled() });
    },
  });
}

/**
 * Unschedule a report
 */
export function useUnscheduleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unscheduleReport,
    onSuccess: (report) => {
      queryClient.setQueryData(reportKeys.detail(report.id), report);
      queryClient.invalidateQueries({ queryKey: reportKeys.scheduled() });
    },
  });
}

/**
 * Download a report
 */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: number; filename: string }) => {
      const blob = await downloadReport(id);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return blob;
    },
  });
}

/**
 * Get scheduled reports only
 */
export function useScheduledReports() {
  const { data: reports, ...rest } = useReports();
  return {
    ...rest,
    data: reports?.filter((r) => r.schedule?.enabled),
  };
}

export default useReports;
