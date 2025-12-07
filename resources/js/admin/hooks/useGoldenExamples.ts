/**
 * Golden Examples Hooks
 * File 266 - TanStack Query hooks for golden examples management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  GoldenExample,
  GoldenCategoryWithStats,
  GoldenExampleFilters,
  MarkAsGoldenInput,
  CreateCategoryInput,
  TrainingExportOptions,
  TrainingExportResult,
} from '@/types/quality';

const API_BASE = '/admin/quality/golden';

// Query keys factory
export const goldenKeys = {
  all: ['golden'] as const,
  examples: () => [...goldenKeys.all, 'examples'] as const,
  examplesList: (filters: GoldenExampleFilters) => [...goldenKeys.examples(), 'list', filters] as const,
  exampleDetail: (id: number) => [...goldenKeys.examples(), 'detail', id] as const,
  categories: () => [...goldenKeys.all, 'categories'] as const,
  categoriesList: (platformId: number) => [...goldenKeys.categories(), 'list', platformId] as const,
  stats: (platformId: number) => [...goldenKeys.all, 'stats', platformId] as const,
  exports: () => [...goldenKeys.all, 'exports'] as const,
  exportsList: () => [...goldenKeys.exports(), 'list'] as const,
  exportDetail: (id: string) => [...goldenKeys.exports(), 'detail', id] as const,
};

// API functions
async function fetchGoldenExamples(filters: GoldenExampleFilters): Promise<{
  data: GoldenExample[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: GoldenExample[];
    total: number;
    page: number;
    per_page: number;
  }>(`${API_BASE}/examples`, { params: filters });
  return data;
}

async function fetchGoldenExample(id: number): Promise<GoldenExample> {
  const { data } = await api.get<GoldenExample>(`${API_BASE}/examples/${id}`);
  return data;
}

async function fetchGoldenCategories(platformId: number): Promise<GoldenCategoryWithStats[]> {
  const { data } = await api.get<GoldenCategoryWithStats[]>(`${API_BASE}/categories`, {
    params: { platform_id: platformId },
  });
  return data;
}

async function markAsGolden(input: MarkAsGoldenInput): Promise<GoldenExample> {
  const { data } = await api.post<GoldenExample>(`${API_BASE}/examples`, input);
  return data;
}

async function updateGoldenExample(
  id: number,
  updateData: Partial<MarkAsGoldenInput & { is_active: boolean }>
): Promise<GoldenExample> {
  const { data } = await api.put<GoldenExample>(`${API_BASE}/examples/${id}`, updateData);
  return data;
}

async function unmarkGolden(id: number): Promise<void> {
  await api.delete(`${API_BASE}/examples/${id}`);
}

async function createCategory(input: CreateCategoryInput): Promise<GoldenCategoryWithStats> {
  const { data } = await api.post<GoldenCategoryWithStats>(`${API_BASE}/categories`, input);
  return data;
}

async function updateCategory(
  slug: string,
  updateData: Partial<CreateCategoryInput>
): Promise<GoldenCategoryWithStats> {
  const { data } = await api.put<GoldenCategoryWithStats>(`${API_BASE}/categories/${slug}`, updateData);
  return data;
}

async function deleteCategory(slug: string): Promise<void> {
  await api.delete(`${API_BASE}/categories/${slug}`);
}

async function moveToCategory(
  exampleIds: number[],
  category: string
): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(`${API_BASE}/examples/move`, {
    example_ids: exampleIds,
    category,
  });
  return data;
}

async function exportTrainingData(options: TrainingExportOptions): Promise<TrainingExportResult> {
  const { data } = await api.post<TrainingExportResult>(`${API_BASE}/export`, options);
  return data;
}

async function fetchExportStatus(id: string): Promise<TrainingExportResult> {
  const { data } = await api.get<TrainingExportResult>(`${API_BASE}/export/${id}`);
  return data;
}

async function fetchExportsList(): Promise<TrainingExportResult[]> {
  const { data } = await api.get<TrainingExportResult[]>(`${API_BASE}/export`);
  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useGoldenExamples(filters: GoldenExampleFilters) {
  return useQuery({
    queryKey: goldenKeys.examplesList(filters),
    queryFn: () => fetchGoldenExamples(filters),
    staleTime: 30000,
  });
}

export function useGoldenExample(id: number) {
  return useQuery({
    queryKey: goldenKeys.exampleDetail(id),
    queryFn: () => fetchGoldenExample(id),
    enabled: id > 0,
  });
}

export function useGoldenCategories(platformId: number) {
  return useQuery({
    queryKey: goldenKeys.categoriesList(platformId),
    queryFn: () => fetchGoldenCategories(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useExportsList() {
  return useQuery({
    queryKey: goldenKeys.exportsList(),
    queryFn: fetchExportsList,
  });
}

export function useExportStatus(id: string) {
  return useQuery({
    queryKey: goldenKeys.exportDetail(id),
    queryFn: () => fetchExportStatus(id),
    enabled: !!id,
    refetchInterval: (data) => 
      data?.status === 'pending' || data?.status === 'processing' ? 2000 : false,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useMarkAsGolden() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: markAsGolden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.examples() });
      queryClient.invalidateQueries({ queryKey: goldenKeys.categories() });
      toast({ title: t('golden.messages.marked') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.markError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGoldenExample() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<MarkAsGoldenInput & { is_active: boolean }>) =>
      updateGoldenExample(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.examples() });
      queryClient.invalidateQueries({ queryKey: goldenKeys.exampleDetail(data.id) });
      toast({ title: t('golden.messages.updated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.updateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUnmarkGolden() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: unmarkGolden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.examples() });
      queryClient.invalidateQueries({ queryKey: goldenKeys.categories() });
      toast({ title: t('golden.messages.unmarked') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.unmarkError'),
        variant: 'destructive',
      });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.categories() });
      toast({ title: t('golden.messages.categoryCreated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.categoryCreateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ slug, ...data }: { slug: string } & Partial<CreateCategoryInput>) =>
      updateCategory(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.categories() });
      toast({ title: t('golden.messages.categoryUpdated') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.categoryUpdateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.categories() });
      toast({ title: t('golden.messages.categoryDeleted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.categoryDeleteError'),
        variant: 'destructive',
      });
    },
  });
}

export function useMoveToCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ exampleIds, category }: { exampleIds: number[]; category: string }) =>
      moveToCategory(exampleIds, category),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.examples() });
      queryClient.invalidateQueries({ queryKey: goldenKeys.categories() });
      toast({ title: t('golden.messages.moved', { count: data.updated }) });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.moveError'),
        variant: 'destructive',
      });
    },
  });
}

export function useExportTraining() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: exportTrainingData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goldenKeys.exports() });
      toast({ title: t('golden.messages.exportStarted') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('golden.messages.exportError'),
        variant: 'destructive',
      });
    },
  });
}
