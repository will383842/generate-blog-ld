/**
 * System Hooks
 * File 344 - TanStack Query hooks for system monitoring
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';

const API_BASE = '/admin/system';

// ============================================
// Types
// ============================================

export interface ServerHealth {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  lastUpdated: string;
}

export interface DatabaseStatus {
  status: 'healthy' | 'degraded' | 'down';
  connections: {
    active: number;
    max: number;
  };
  size: number;
  tables: number;
  slowQueries: number;
  lastBackup?: string;
  replicationLag?: number;
}

export interface QueueWorker {
  id: string;
  name: string;
  queue: string;
  status: 'running' | 'stopped' | 'failed';
  jobsPending: number;
  jobsProcessing: number;
  jobsFailed: number;
  jobsCompleted: number;
  uptime: number;
  memory: number;
  lastActivity?: string;
  pid?: number;
}

export interface ApiStatus {
  id: string;
  name: string;
  provider: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastCheck: string;
  quotaUsed?: number;
  quotaLimit?: number;
  errorRate?: number;
}

export interface RedisStatus {
  status: 'healthy' | 'degraded' | 'down';
  memory: {
    used: number;
    peak: number;
    maxMemory: number;
  };
  connections: number;
  keys: number;
  hitRate: number;
  uptime: number;
}

export interface Backup {
  id: number;
  type: 'full' | 'database' | 'files' | 'incremental';
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  size: number;
  duration?: number;
  path?: string;
  cloudSynced: boolean;
  cloudProvider?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  retentionDays: number;
  cloudSync: boolean;
  cloudProvider?: string;
  types: ('full' | 'database' | 'files')[];
}

export interface SystemAlert {
  id: number;
  type: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface ErrorLog {
  id: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  acknowledged: boolean;
}

// ============================================
// Query Keys
// ============================================

export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
  database: () => [...systemKeys.all, 'database'] as const,
  workers: () => [...systemKeys.all, 'workers'] as const,
  apis: () => [...systemKeys.all, 'apis'] as const,
  redis: () => [...systemKeys.all, 'redis'] as const,
  backups: () => [...systemKeys.all, 'backups'] as const,
  backupSchedule: () => [...systemKeys.all, 'backup-schedule'] as const,
  alerts: () => [...systemKeys.all, 'alerts'] as const,
  errors: (filters?: ErrorLogFilters) => [...systemKeys.all, 'errors', filters] as const,
};

export interface ErrorLogFilters {
  severity?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  acknowledged?: boolean;
  per_page?: number;
  page?: number;
}

// ============================================
// API Functions
// ============================================

async function fetchServerHealth(): Promise<ServerHealth> {
  const { data } = await api.get<ServerHealth>(`${API_BASE}/health`);
  return data;
}

async function fetchDatabaseStatus(): Promise<DatabaseStatus> {
  const { data } = await api.get<DatabaseStatus>(`${API_BASE}/database`);
  return data;
}

async function fetchQueueWorkers(): Promise<QueueWorker[]> {
  const { data } = await api.get<QueueWorker[]>(`${API_BASE}/workers`);
  return data;
}

async function fetchApisStatus(): Promise<ApiStatus[]> {
  const { data } = await api.get<ApiStatus[]>(`${API_BASE}/apis`);
  return data;
}

async function fetchRedisStatus(): Promise<RedisStatus> {
  const { data } = await api.get<RedisStatus>(`${API_BASE}/redis`);
  return data;
}

async function fetchBackups(): Promise<Backup[]> {
  const { data } = await api.get<Backup[]>(`${API_BASE}/backups`);
  return data;
}

async function fetchBackupSchedule(): Promise<BackupSchedule> {
  const { data } = await api.get<BackupSchedule>(`${API_BASE}/backups/schedule`);
  return data;
}

async function createBackup(type: 'full' | 'database' | 'files'): Promise<Backup> {
  const { data } = await api.post<Backup>(`${API_BASE}/backups`, { type });
  return data;
}

async function restoreBackup(id: number): Promise<void> {
  await api.post(`${API_BASE}/backups/${id}/restore`);
}

async function downloadBackup(id: number): Promise<string> {
  const { data } = await api.get<{ url: string }>(`${API_BASE}/backups/${id}/download`);
  return data.url;
}

async function deleteBackup(id: number): Promise<void> {
  await api.delete(`${API_BASE}/backups/${id}`);
}

async function updateBackupSchedule(schedule: Partial<BackupSchedule>): Promise<BackupSchedule> {
  const { data } = await api.put<BackupSchedule>(`${API_BASE}/backups/schedule`, schedule);
  return data;
}

async function fetchAlerts(): Promise<SystemAlert[]> {
  const { data } = await api.get<SystemAlert[]>(`${API_BASE}/alerts`);
  return data;
}

async function acknowledgeAlert(id: number): Promise<SystemAlert> {
  const { data } = await api.post<SystemAlert>(`${API_BASE}/alerts/${id}/acknowledge`);
  return data;
}

async function fetchErrors(filters: ErrorLogFilters): Promise<{
  data: ErrorLog[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{ data: ErrorLog[]; total: number; page: number; per_page: number }>(`${API_BASE}/errors`, { params: filters });
  return data;
}

async function acknowledgeError(id: number): Promise<ErrorLog> {
  const { data } = await api.post<ErrorLog>(`${API_BASE}/errors/${id}/acknowledge`);
  return data;
}

async function acknowledgeAllErrors(ids: number[]): Promise<void> {
  await api.post(`${API_BASE}/errors/acknowledge-bulk`, { ids });
}

async function restartWorker(workerId: string): Promise<QueueWorker> {
  const { data } = await api.post<QueueWorker>(`${API_BASE}/workers/${workerId}/restart`);
  return data;
}

async function stopWorker(workerId: string): Promise<QueueWorker> {
  const { data } = await api.post<QueueWorker>(`${API_BASE}/workers/${workerId}/stop`);
  return data;
}

async function flushCache(type?: string): Promise<void> {
  await api.post(`${API_BASE}/cache/flush`, { type });
}

// ============================================
// Query Hooks
// ============================================

export function useServerHealth() {
  return useQuery({
    queryKey: systemKeys.health(),
    queryFn: fetchServerHealth,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useDatabaseStatus() {
  return useQuery({
    queryKey: systemKeys.database(),
    queryFn: fetchDatabaseStatus,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useQueueWorkers() {
  return useQuery({
    queryKey: systemKeys.workers(),
    queryFn: fetchQueueWorkers,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useApisStatus() {
  return useQuery({
    queryKey: systemKeys.apis(),
    queryFn: fetchApisStatus,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useRedisStatus() {
  return useQuery({
    queryKey: systemKeys.redis(),
    queryFn: fetchRedisStatus,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useBackups() {
  return useQuery({
    queryKey: systemKeys.backups(),
    queryFn: fetchBackups,
  });
}

export function useBackupSchedule() {
  return useQuery({
    queryKey: systemKeys.backupSchedule(),
    queryFn: fetchBackupSchedule,
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: systemKeys.alerts(),
    queryFn: fetchAlerts,
    refetchInterval: 30000,
  });
}

export function useErrors(filters: ErrorLogFilters = {}) {
  return useQuery({
    queryKey: systemKeys.errors(filters),
    queryFn: () => fetchErrors(filters),
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateBackup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.backups() });
      toast({ title: 'Sauvegarde lancée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer la sauvegarde', variant: 'destructive' });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.all });
      toast({ title: 'Restauration lancée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de restaurer', variant: 'destructive' });
    },
  });
}

export function useDownloadBackup() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: downloadBackup,
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de télécharger', variant: 'destructive' });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.backups() });
      toast({ title: 'Sauvegarde supprimée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    },
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateBackupSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.backupSchedule() });
      toast({ title: 'Planification mise à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de modifier la planification', variant: 'destructive' });
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.alerts() });
      toast({ title: 'Alerte acquittée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'acquitter l\'alerte', variant: 'destructive' });
    },
  });
}

export function useAcknowledgeError() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: acknowledgeError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.errors() });
      toast({ title: 'Erreur acquittée' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'acquitter', variant: 'destructive' });
    },
  });
}

export function useAcknowledgeAllErrors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: acknowledgeAllErrors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.errors() });
      toast({ title: 'Erreurs acquittées' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'acquitter', variant: 'destructive' });
    },
  });
}

export function useRestartWorker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: restartWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.workers() });
      toast({ title: 'Worker redémarré' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de redémarrer le worker', variant: 'destructive' });
    },
  });
}

export function useStopWorker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: stopWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.workers() });
      toast({ title: 'Worker arrêté' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'arrêter le worker', variant: 'destructive' });
    },
  });
}

export function useFlushCache() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: flushCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.all });
      toast({ title: 'Cache vidé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de vider le cache', variant: 'destructive' });
    },
  });
}
