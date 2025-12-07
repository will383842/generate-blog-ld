/**
 * Platform Knowledge Hooks
 * File 235 - TanStack Query hooks for knowledge management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  PlatformKnowledge,
  KnowledgeWithTranslations,
  KnowledgeFilters,
  KnowledgeStats,
  KnowledgeListResponse,
  TranslationMatrix,
  ValidationResult,
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  TranslateKnowledgeInput,
  BulkTranslateInput,
  ImportKnowledgeInput,
  ExportKnowledgeInput,
  ValidateTextInput,
  KnowledgeType,
} from '@/types/knowledge';

const API_BASE = '/admin/content-engine';

// Query keys factory
export const knowledgeKeys = {
  all: ['knowledge'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (filters: KnowledgeFilters) => [...knowledgeKeys.lists(), filters] as const,
  details: () => [...knowledgeKeys.all, 'detail'] as const,
  detail: (id: number) => [...knowledgeKeys.details(), id] as const,
  byType: (platformId: number, type: KnowledgeType) => 
    [...knowledgeKeys.all, 'byType', platformId, type] as const,
  stats: (platformId: number) => [...knowledgeKeys.all, 'stats', platformId] as const,
  translations: () => [...knowledgeKeys.all, 'translations'] as const,
  translationMatrix: (platformId: number) => 
    [...knowledgeKeys.translations(), 'matrix', platformId] as const,
  validation: () => [...knowledgeKeys.all, 'validation'] as const,
};

// API functions
async function fetchKnowledgeList(filters: KnowledgeFilters): Promise<KnowledgeListResponse> {
  const { data } = await api.get<KnowledgeListResponse>(`${API_BASE}/knowledge`, { params: filters });
  return data;
}

async function fetchKnowledge(id: number): Promise<KnowledgeWithTranslations> {
  const { data } = await api.get<KnowledgeWithTranslations>(`${API_BASE}/knowledge/${id}`);
  return data;
}

async function fetchKnowledgeByType(
  platformId: number,
  type: KnowledgeType
): Promise<PlatformKnowledge[]> {
  const { data } = await api.get<PlatformKnowledge[]>(`${API_BASE}/knowledge/by-type`, {
    params: { platform_id: platformId, type }
  });
  return data;
}

async function fetchKnowledgeStats(platformId: number): Promise<KnowledgeStats> {
  const { data } = await api.get<KnowledgeStats>(`${API_BASE}/knowledge/stats`, {
    params: { platform_id: platformId }
  });
  return data;
}

async function fetchTranslationMatrix(platformId: number): Promise<TranslationMatrix> {
  const { data } = await api.get<TranslationMatrix>(`${API_BASE}/knowledge/translations/matrix`, {
    params: { platform_id: platformId }
  });
  return data;
}

async function createKnowledge(input: CreateKnowledgeInput): Promise<PlatformKnowledge> {
  const { data } = await api.post<PlatformKnowledge>(`${API_BASE}/knowledge`, {
    platform_id: input.platform_id,
    type: input.type,
    title: input.title,
    content: input.content,
    language: input.language ?? 'fr',
    priority: input.priority ?? 5,
    is_active: input.is_active ?? true,
    use_in_articles: input.use_in_articles ?? true,
    use_in_landings: input.use_in_landings ?? true,
    use_in_comparatives: input.use_in_comparatives ?? true,
    use_in_pillars: input.use_in_pillars ?? true,
    use_in_press: input.use_in_press ?? true,
    metadata: input.metadata ?? null,
  });
  return data;
}

async function updateKnowledge(input: UpdateKnowledgeInput): Promise<PlatformKnowledge> {
  const { id, ...updateData } = input;
  const { data } = await api.put<PlatformKnowledge>(`${API_BASE}/knowledge/${id}`, updateData);
  return data;
}

async function deleteKnowledge(id: number): Promise<void> {
  await api.delete(`${API_BASE}/knowledge/${id}`);
}

async function duplicateKnowledge(id: number): Promise<PlatformKnowledge> {
  const { data } = await api.post<PlatformKnowledge>(`${API_BASE}/knowledge/${id}/duplicate`);
  return data;
}

async function translateKnowledge(input: TranslateKnowledgeInput): Promise<PlatformKnowledge> {
  const { data } = await api.post<PlatformKnowledge>(`${API_BASE}/knowledge/${input.knowledge_id}/translate`, {
    source_language: input.source_language,
    target_language: input.target_language,
    title: input.title,
    content: input.content,
    use_ai: input.use_ai ?? false,
  });
  return data;
}

async function bulkTranslate(input: BulkTranslateInput): Promise<{ success: number; failed: number }> {
  const { data } = await api.post<{ success: number; failed: number }>(`${API_BASE}/knowledge/translate/bulk`, {
    knowledge_ids: input.knowledge_ids,
    source_language: input.source_language,
    target_languages: input.target_languages,
  });
  return data;
}

async function validateKnowledge(id: number): Promise<ValidationResult> {
  const { data } = await api.post<ValidationResult>(`${API_BASE}/knowledge/${id}/validate`);
  return data;
}

async function validateText(input: ValidateTextInput): Promise<ValidationResult> {
  const { data } = await api.post<ValidationResult>(`${API_BASE}/knowledge/validate-text`, {
    text: input.text,
    platform_id: input.platform_id,
    content_type: input.content_type,
    language: input.language,
  });
  return data;
}

async function importKnowledge(input: ImportKnowledgeInput): Promise<{ success: number; failed: number }> {
  const { data } = await api.post<{ success: number; failed: number }>(`${API_BASE}/knowledge/import`, {
    platform_id: input.platform_id,
    data: input.data,
    format: input.format,
    mapping: input.mapping,
  });
  return data;
}

async function exportKnowledge(input: ExportKnowledgeInput): Promise<Blob> {
  const params: Record<string, string | string[]> = {
    platform_id: input.platform_id.toString(),
    format: input.format,
  };
  if (input.types?.length) params.types = input.types.join(',');
  if (input.languages?.length) params.languages = input.languages.join(',');
  if (input.include_translations) params.include_translations = '1';

  const { data } = await api.get<Blob>(`${API_BASE}/knowledge/export`, {
    params,
    responseType: 'blob'
  });
  return data;
}

// Query hooks
export function useKnowledgeList(filters: KnowledgeFilters = {}) {
  return useQuery({
    queryKey: knowledgeKeys.list(filters),
    queryFn: () => fetchKnowledgeList(filters),
    staleTime: 30000,
  });
}

export function useKnowledge(id: number) {
  return useQuery({
    queryKey: knowledgeKeys.detail(id),
    queryFn: () => fetchKnowledge(id),
    enabled: id > 0,
  });
}

export function useKnowledgeByType(platformId: number, type: KnowledgeType) {
  return useQuery({
    queryKey: knowledgeKeys.byType(platformId, type),
    queryFn: () => fetchKnowledgeByType(platformId, type),
    enabled: platformId > 0,
  });
}

export function useKnowledgeStats(platformId: number) {
  return useQuery({
    queryKey: knowledgeKeys.stats(platformId),
    queryFn: () => fetchKnowledgeStats(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useTranslationMatrix(platformId: number) {
  return useQuery({
    queryKey: knowledgeKeys.translationMatrix(platformId),
    queryFn: () => fetchTranslationMatrix(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

// Mutation hooks
export function useCreateKnowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createKnowledge,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats(data.platform_id) });
      toast({
        title: t('knowledge.messages.created'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.createError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateKnowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: updateKnowledge,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats(data.platform_id) });
      toast({
        title: t('knowledge.messages.updated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.updateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteKnowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteKnowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast({
        title: t('knowledge.messages.deleted'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.deleteError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDuplicateKnowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: duplicateKnowledge,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.stats(data.platform_id) });
      toast({
        title: t('knowledge.messages.duplicated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.duplicateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useTranslateKnowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: translateKnowledge,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.translations() });
      toast({
        title: t('knowledge.messages.translated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.translateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useBulkTranslate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: bulkTranslate,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.translations() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() });
      toast({
        title: t('knowledge.messages.bulkTranslated', { count: result.success }),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.bulkTranslateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useValidateKnowledge() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: validateKnowledge,
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.validateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useValidateText() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: validateText,
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.validateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useImportKnowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: importKnowledge,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      toast({
        title: t('knowledge.messages.imported', { count: result.success }),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.importError'),
        variant: 'destructive',
      });
    },
  });
}

export function useExportKnowledge() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (input: ExportKnowledgeInput) => {
      const blob = await exportKnowledge(input);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-export.${input.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: t('knowledge.messages.exported'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('knowledge.messages.exportError'),
        variant: 'destructive',
      });
    },
  });
}
