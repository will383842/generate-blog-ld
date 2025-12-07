/**
 * Brand Validation Hooks
 * File 248 - TanStack Query hooks for brand book management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { useToast } from '@/hooks/useToast';
import {
  BrandSection,
  BrandSectionWithTranslations,
  BrandSectionType,
  StyleSettings,
  StylePreset,
  ComplianceResult,
  AuditResult,
  AuditStats,
  BrandVersion,
  BrandStats,
  UpdateBrandSectionInput,
  CreateBrandSectionInput,
  UpdateStyleSettingsInput,
  CreateStylePresetInput,
  ValidateContentInput,
  RunAuditInput,
} from '@/types/brand';

const API_BASE = '/admin/content-engine';

// Query keys factory
export const brandKeys = {
  all: ['brand'] as const,
  sections: () => [...brandKeys.all, 'sections'] as const,
  sectionsList: (platformId: number) => [...brandKeys.sections(), 'list', platformId] as const,
  sectionDetail: (id: number) => [...brandKeys.sections(), 'detail', id] as const,
  sectionByType: (platformId: number, type: BrandSectionType) =>
    [...brandKeys.sections(), 'byType', platformId, type] as const,
  style: () => [...brandKeys.all, 'style'] as const,
  styleSettings: (platformId: number) => [...brandKeys.style(), 'settings', platformId] as const,
  presets: () => [...brandKeys.all, 'presets'] as const,
  presetsList: (platformId: number) => [...brandKeys.presets(), 'list', platformId] as const,
  presetDetail: (id: number) => [...brandKeys.presets(), 'detail', id] as const,
  compliance: () => [...brandKeys.all, 'compliance'] as const,
  audit: () => [...brandKeys.all, 'audit'] as const,
  auditResults: (platformId: number, filters?: object) =>
    [...brandKeys.audit(), 'results', platformId, filters] as const,
  auditStats: (platformId: number) => [...brandKeys.audit(), 'stats', platformId] as const,
  history: () => [...brandKeys.all, 'history'] as const,
  historyList: (platformId: number) => [...brandKeys.history(), 'list', platformId] as const,
  stats: (platformId: number) => [...brandKeys.all, 'stats', platformId] as const,
};

// API functions - Sections
async function fetchBrandSections(platformId: number): Promise<BrandSection[]> {
  const { data } = await api.get<BrandSection[]>(`${API_BASE}/brand/sections`, { params: { platform_id: platformId } });
  return data;
}

async function fetchBrandSection(id: number): Promise<BrandSectionWithTranslations> {
  const { data } = await api.get<BrandSectionWithTranslations>(`${API_BASE}/brand/sections/${id}`);
  return data;
}

async function fetchBrandSectionByType(
  platformId: number,
  type: BrandSectionType
): Promise<BrandSection[]> {
  const { data } = await api.get<BrandSection[]>(`${API_BASE}/brand/sections/by-type`, { params: { platform_id: platformId, type } });
  return data;
}

async function createBrandSection(input: CreateBrandSectionInput): Promise<BrandSection> {
  const { data } = await api.post<BrandSection>(`${API_BASE}/brand/sections`, input);
  return data;
}

async function updateBrandSection(input: UpdateBrandSectionInput): Promise<BrandSection> {
  const { id, ...rest } = input;
  const { data } = await api.put<BrandSection>(`${API_BASE}/brand/sections/${id}`, rest);
  return data;
}

async function deleteBrandSection(id: number): Promise<void> {
  await api.delete(`${API_BASE}/brand/sections/${id}`);
}

// API functions - Style Settings
async function fetchStyleSettings(platformId: number): Promise<StyleSettings> {
  const { data } = await api.get<StyleSettings>(`${API_BASE}/brand/style`, { params: { platform_id: platformId } });
  return data;
}

async function updateStyleSettings(input: UpdateStyleSettingsInput): Promise<StyleSettings> {
  const { data } = await api.put<StyleSettings>(`${API_BASE}/brand/style`, input);
  return data;
}

// API functions - Presets
async function fetchStylePresets(platformId: number): Promise<StylePreset[]> {
  const { data } = await api.get<StylePreset[]>(`${API_BASE}/brand/presets`, { params: { platform_id: platformId } });
  return data;
}

async function fetchStylePreset(id: number): Promise<StylePreset> {
  const { data } = await api.get<StylePreset>(`${API_BASE}/brand/presets/${id}`);
  return data;
}

async function createStylePreset(input: CreateStylePresetInput): Promise<StylePreset> {
  const { data } = await api.post<StylePreset>(`${API_BASE}/brand/presets`, input);
  return data;
}

async function updateStylePreset(
  id: number,
  input: Partial<CreateStylePresetInput>
): Promise<StylePreset> {
  const { data } = await api.put<StylePreset>(`${API_BASE}/brand/presets/${id}`, input);
  return data;
}

async function deleteStylePreset(id: number): Promise<void> {
  await api.delete(`${API_BASE}/brand/presets/${id}`);
}

async function applyStylePreset(
  platformId: number,
  presetId: number
): Promise<StyleSettings> {
  const { data } = await api.post<StyleSettings>(`${API_BASE}/brand/presets/${presetId}/apply`, { platform_id: platformId });
  return data;
}

async function setDefaultPreset(platformId: number, presetId: number): Promise<void> {
  await api.post(`${API_BASE}/brand/presets/${presetId}/set-default`, { platform_id: platformId });
}

// API functions - Validation
async function validateContent(input: ValidateContentInput): Promise<ComplianceResult> {
  const { data } = await api.post<ComplianceResult>(`${API_BASE}/brand/validate`, input);
  return data;
}

async function fixContent(input: ValidateContentInput): Promise<{ content: string; changes: string[] }> {
  const { data } = await api.post<{ content: string; changes: string[] }>(`${API_BASE}/brand/fix`, { ...input, auto_fix: true });
  return data;
}

// API functions - Audit
async function fetchAuditResults(
  platformId: number,
  filters?: { content_type?: string; status?: string; date_from?: string; date_to?: string }
): Promise<AuditResult[]> {
  const { data } = await api.get<AuditResult[]>(`${API_BASE}/brand/audit`, {
    params: { platform_id: platformId, ...filters }
  });
  return data;
}

async function fetchAuditStats(platformId: number): Promise<AuditStats> {
  const { data } = await api.get<AuditStats>(`${API_BASE}/brand/audit/stats`, { params: { platform_id: platformId } });
  return data;
}

async function runAudit(input: RunAuditInput): Promise<{ audited: number; results: AuditResult[] }> {
  const { data } = await api.post<{ audited: number; results: AuditResult[] }>(`${API_BASE}/brand/audit/run`, input);
  return data;
}

async function updateAuditStatus(
  id: number,
  status: AuditResult['status']
): Promise<AuditResult> {
  const { data } = await api.put<AuditResult>(`${API_BASE}/brand/audit/${id}/status`, { status });
  return data;
}

// API functions - History
async function fetchBrandHistory(platformId: number): Promise<BrandVersion[]> {
  const { data } = await api.get<BrandVersion[]>(`${API_BASE}/brand/history`, { params: { platform_id: platformId } });
  return data;
}

async function restoreBrandVersion(platformId: number, versionId: number): Promise<void> {
  await api.post(`${API_BASE}/brand/history/${versionId}/restore`, { platform_id: platformId });
}

// API functions - Stats
async function fetchBrandStats(platformId: number): Promise<BrandStats> {
  const { data } = await api.get<BrandStats>(`${API_BASE}/brand/stats`, { params: { platform_id: platformId } });
  return data;
}

// ============================================
// Query Hooks - Sections
// ============================================

export function useBrandSections(platformId: number) {
  return useQuery({
    queryKey: brandKeys.sectionsList(platformId),
    queryFn: () => fetchBrandSections(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useBrandSection(id: number) {
  return useQuery({
    queryKey: brandKeys.sectionDetail(id),
    queryFn: () => fetchBrandSection(id),
    enabled: id > 0,
  });
}

export function useBrandSectionByType(platformId: number, type: BrandSectionType) {
  return useQuery({
    queryKey: brandKeys.sectionByType(platformId, type),
    queryFn: () => fetchBrandSectionByType(platformId, type),
    enabled: platformId > 0,
  });
}

// ============================================
// Query Hooks - Style Settings
// ============================================

export function useStyleSettings(platformId: number) {
  return useQuery({
    queryKey: brandKeys.styleSettings(platformId),
    queryFn: () => fetchStyleSettings(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

// ============================================
// Query Hooks - Presets
// ============================================

export function useStylePresets(platformId: number) {
  return useQuery({
    queryKey: brandKeys.presetsList(platformId),
    queryFn: () => fetchStylePresets(platformId),
    enabled: platformId > 0,
  });
}

export function useStylePreset(id: number) {
  return useQuery({
    queryKey: brandKeys.presetDetail(id),
    queryFn: () => fetchStylePreset(id),
    enabled: id > 0,
  });
}

// ============================================
// Query Hooks - Audit
// ============================================

export function useAuditResults(
  platformId: number,
  filters?: { content_type?: string; status?: string; date_from?: string; date_to?: string }
) {
  return useQuery({
    queryKey: brandKeys.auditResults(platformId, filters),
    queryFn: () => fetchAuditResults(platformId, filters),
    enabled: platformId > 0,
  });
}

export function useAuditStats(platformId: number) {
  return useQuery({
    queryKey: brandKeys.auditStats(platformId),
    queryFn: () => fetchAuditStats(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

// ============================================
// Query Hooks - History
// ============================================

export function useBrandHistory(platformId: number) {
  return useQuery({
    queryKey: brandKeys.historyList(platformId),
    queryFn: () => fetchBrandHistory(platformId),
    enabled: platformId > 0,
  });
}

// ============================================
// Query Hooks - Stats
// ============================================

export function useBrandStats(platformId: number) {
  return useQuery({
    queryKey: brandKeys.stats(platformId),
    queryFn: () => fetchBrandStats(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

// ============================================
// Mutation Hooks - Sections
// ============================================

export function useCreateBrandSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createBrandSection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.sectionsList(data.platform_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.stats(data.platform_id) });
      toast({ title: t('brand.messages.sectionCreated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.sectionCreateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: updateBrandSection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.sectionsList(data.platform_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.sectionDetail(data.id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.history() });
      toast({ title: t('brand.messages.sectionUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.sectionUpdateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBrandSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteBrandSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.sections() });
      toast({ title: t('brand.messages.sectionDeleted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.sectionDeleteError'),
        variant: 'destructive',
      });
    },
  });
}

// ============================================
// Mutation Hooks - Style Settings
// ============================================

export function useUpdateStyleSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: updateStyleSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.styleSettings(data.platform_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.history() });
      toast({ title: t('brand.messages.styleUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.styleUpdateError'),
        variant: 'destructive',
      });
    },
  });
}

// ============================================
// Mutation Hooks - Presets
// ============================================

export function useCreateStylePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createStylePreset,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.presetsList(data.platform_id) });
      toast({ title: t('brand.messages.presetCreated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.presetCreateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateStylePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<CreateStylePresetInput>) =>
      updateStylePreset(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.presetsList(data.platform_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.presetDetail(data.id) });
      toast({ title: t('brand.messages.presetUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.presetUpdateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteStylePreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteStylePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.presets() });
      toast({ title: t('brand.messages.presetDeleted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.presetDeleteError'),
        variant: 'destructive',
      });
    },
  });
}

export function useApplyPreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ platformId, presetId }: { platformId: number; presetId: number }) =>
      applyStylePreset(platformId, presetId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.styleSettings(data.platform_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.history() });
      toast({ title: t('brand.messages.presetApplied') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.presetApplyError'),
        variant: 'destructive',
      });
    },
  });
}

export function useSetDefaultPreset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ platformId, presetId }: { platformId: number; presetId: number }) =>
      setDefaultPreset(platformId, presetId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.presetsList(variables.platformId) });
      toast({ title: t('brand.messages.defaultPresetSet') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.defaultPresetError'),
        variant: 'destructive',
      });
    },
  });
}

// ============================================
// Mutation Hooks - Validation
// ============================================

export function useValidateContent() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: validateContent,
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.validateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useFixContent() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: fixContent,
    onSuccess: () => {
      toast({ title: t('brand.messages.contentFixed') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.fixError'),
        variant: 'destructive',
      });
    },
  });
}

// ============================================
// Mutation Hooks - Audit
// ============================================

export function useBrandAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: runAudit,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.auditResults(variables.platform_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.auditStats(variables.platform_id) });
      toast({
        title: t('brand.messages.auditComplete', { count: result.audited }),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.auditError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAuditStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AuditResult['status'] }) =>
      updateAuditStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.audit() });
      toast({ title: t('brand.messages.statusUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.statusUpdateError'),
        variant: 'destructive',
      });
    },
  });
}

// ============================================
// Mutation Hooks - History
// ============================================

export function useRestoreBrandVersion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ platformId, versionId }: { platformId: number; versionId: number }) =>
      restoreBrandVersion(platformId, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      toast({ title: t('brand.messages.versionRestored') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('brand.messages.versionRestoreError'),
        variant: 'destructive',
      });
    },
  });
}
