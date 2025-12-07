import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';
import {
  Landing,
  LandingSection,
  LandingFilters,
  LandingStats,
  LandingTemplate,
  SectionTemplate,
  CreateLandingInput,
  UpdateLandingInput,
  CreateSectionInput,
  UpdateSectionInput,
  LandingPerformance,
  LandingExportResult,
} from '@/types/landing';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { api } from '@/utils/api';

// ============================================================================
// Query Keys
// ============================================================================

export const landingKeys = {
  all: ['landings'] as const,
  lists: () => [...landingKeys.all, 'list'] as const,
  list: (filters: LandingFilters) => [...landingKeys.lists(), filters] as const,
  details: () => [...landingKeys.all, 'detail'] as const,
  detail: (id: number) => [...landingKeys.details(), id] as const,
  sections: (landingId: number) => [...landingKeys.all, 'sections', landingId] as const,
  stats: () => [...landingKeys.all, 'stats'] as const,
  templates: () => [...landingKeys.all, 'templates'] as const,
  sectionTemplates: () => [...landingKeys.all, 'section-templates'] as const,
  performance: (id: number) => [...landingKeys.all, 'performance', id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

// Landings
const fetchLandings = async (
  filters: LandingFilters & { page?: number; perPage?: number }
): Promise<PaginatedResponse<Landing>> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.platform) params.append('platform', filters.platform);
  if (filters.country) params.append('country', filters.country);
  if (filters.language) params.append('language', filters.language);
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters.dateTo) params.append('date_to', filters.dateTo);
  if (filters.hasTranslations !== undefined) {
    params.append('has_translations', filters.hasTranslations.toString());
  }
  if (filters.minSections) params.append('min_sections', filters.minSections.toString());
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.perPage) params.append('per_page', filters.perPage.toString());

  const response = await api.get<PaginatedResponse<Landing>>(
    `/admin/landings?${params.toString()}`
  );
  return response.data;
};

const fetchLanding = async (id: number): Promise<Landing> => {
  const response = await api.get<ApiResponse<Landing>>(
    `/admin/landings/${id}`
  );
  return response.data.data;
};

const createLanding = async (data: CreateLandingInput): Promise<Landing> => {
  const response = await api.post<ApiResponse<Landing>>(
    '/admin/landings',
    data
  );
  return response.data.data;
};

const updateLanding = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateLandingInput;
}): Promise<Landing> => {
  const response = await api.put<ApiResponse<Landing>>(
    `/admin/landings/${id}`,
    data
  );
  return response.data.data;
};

const deleteLanding = async (id: number): Promise<void> => {
  await api.delete(`/admin/landings/${id}`);
};

const duplicateLanding = async (id: number): Promise<Landing> => {
  const response = await api.post<ApiResponse<Landing>>(
    `/admin/landings/${id}/duplicate`
  );
  return response.data.data;
};

const publishLanding = async (id: number): Promise<Landing> => {
  const response = await api.post<ApiResponse<Landing>>(
    `/admin/landings/${id}/publish`
  );
  return response.data.data;
};

const unpublishLanding = async (id: number): Promise<Landing> => {
  const response = await api.post<ApiResponse<Landing>>(
    `/admin/landings/${id}/unpublish`
  );
  return response.data.data;
};

// Sections
const fetchSections = async (landingId: number): Promise<LandingSection[]> => {
  const response = await api.get<ApiResponse<LandingSection[]>>(
    `/admin/landings/${landingId}/sections`
  );
  return response.data.data;
};

const addSection = async ({
  landingId,
  data,
}: {
  landingId: number;
  data: CreateSectionInput;
}): Promise<LandingSection> => {
  const response = await api.post<ApiResponse<LandingSection>>(
    `/admin/landings/${landingId}/sections`,
    data
  );
  return response.data.data;
};

const updateSection = async ({
  landingId,
  sectionId,
  data,
}: {
  landingId: number;
  sectionId: number;
  data: UpdateSectionInput;
}): Promise<LandingSection> => {
  const response = await api.put<ApiResponse<LandingSection>>(
    `/admin/landings/${landingId}/sections/${sectionId}`,
    data
  );
  return response.data.data;
};

const reorderSections = async ({
  landingId,
  sectionIds,
}: {
  landingId: number;
  sectionIds: number[];
}): Promise<LandingSection[]> => {
  const response = await api.put<ApiResponse<LandingSection[]>>(
    `/admin/landings/${landingId}/sections/reorder`,
    { section_ids: sectionIds }
  );
  return response.data.data;
};

const deleteSection = async ({
  landingId,
  sectionId,
}: {
  landingId: number;
  sectionId: number;
}): Promise<void> => {
  await api.delete(`/admin/landings/${landingId}/sections/${sectionId}`);
};

const duplicateSection = async ({
  landingId,
  sectionId,
}: {
  landingId: number;
  sectionId: number;
}): Promise<LandingSection> => {
  const response = await api.post<ApiResponse<LandingSection>>(
    `/admin/landings/${landingId}/sections/${sectionId}/duplicate`
  );
  return response.data.data;
};

// Stats & Templates
const fetchStats = async (): Promise<LandingStats> => {
  const response = await api.get<ApiResponse<LandingStats>>(
    '/admin/landings/stats'
  );
  return response.data.data;
};

const fetchTemplates = async (): Promise<LandingTemplate[]> => {
  const response = await api.get<ApiResponse<LandingTemplate[]>>(
    '/admin/landings/templates'
  );
  return response.data.data;
};

const fetchSectionTemplates = async (): Promise<SectionTemplate[]> => {
  const response = await api.get<ApiResponse<SectionTemplate[]>>(
    '/admin/landings/section-templates'
  );
  return response.data.data;
};

// Performance
const fetchPerformance = async (
  id: number,
  period?: string
): Promise<LandingPerformance> => {
  const params = period ? `?period=${period}` : '';
  const response = await api.get<ApiResponse<LandingPerformance>>(
    `/admin/landings/${id}/performance${params}`
  );
  return response.data.data;
};

// Translation
const translateLanding = async ({
  id,
  targetLanguage,
}: {
  id: number;
  targetLanguage: string;
}): Promise<void> => {
  await api.post(`/admin/landings/${id}/translate`, {
    target_language: targetLanguage,
  });
};

// Export
const exportLanding = async ({
  id,
  format,
}: {
  id: number;
  format: 'html' | 'pdf';
}): Promise<LandingExportResult> => {
  const response = await api.post<ApiResponse<LandingExportResult>>(
    `/admin/landings/${id}/export`,
    { format }
  );
  return response.data.data;
};

// ============================================================================
// Query Hooks
// ============================================================================

export const useLandings = (
  filters: LandingFilters & { page?: number; perPage?: number } = {}
) => {
  return useQuery({
    queryKey: landingKeys.list(filters),
    queryFn: () => fetchLandings(filters),
    staleTime: 30 * 1000,
  });
};

export const useLanding = (
  id: number,
  options?: Omit<UseQueryOptions<Landing, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: landingKeys.detail(id),
    queryFn: () => fetchLanding(id),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useLandingSections = (
  landingId: number,
  options?: Omit<UseQueryOptions<LandingSection[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: landingKeys.sections(landingId),
    queryFn: () => fetchSections(landingId),
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useLandingStats = () => {
  return useQuery({
    queryKey: landingKeys.stats(),
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLandingTemplates = () => {
  return useQuery({
    queryKey: landingKeys.templates(),
    queryFn: fetchTemplates,
    staleTime: 10 * 60 * 1000,
  });
};

export const useSectionTemplates = () => {
  return useQuery({
    queryKey: landingKeys.sectionTemplates(),
    queryFn: fetchSectionTemplates,
    staleTime: 10 * 60 * 1000,
  });
};

export const useLandingPerformance = (
  id: number,
  period?: string,
  options?: Omit<UseQueryOptions<LandingPerformance, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...landingKeys.performance(id), period],
    queryFn: () => fetchPerformance(id, period),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useCreateLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: createLanding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: landingKeys.stats() });
      showToast(t('landing:messages.created'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUpdateLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: updateLanding,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.lists() });
      queryClient.setQueryData(landingKeys.detail(data.id), data);
      showToast(t('landing:messages.saved'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: deleteLanding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: landingKeys.stats() });
      showToast(t('landing:messages.deleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDuplicateLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: duplicateLanding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: landingKeys.stats() });
      showToast(t('landing:messages.duplicated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const usePublishLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: publishLanding,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: landingKeys.stats() });
      queryClient.setQueryData(landingKeys.detail(data.id), data);
      showToast(t('landing:messages.published'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUnpublishLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: unpublishLanding,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: landingKeys.stats() });
      queryClient.setQueryData(landingKeys.detail(data.id), data);
      showToast(t('landing:messages.unpublished'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// Section Mutations

export const useAddSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: addSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.sections(variables.landingId) });
      queryClient.invalidateQueries({ queryKey: landingKeys.detail(variables.landingId) });
      showToast(t('landing:messages.sectionAdded'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: updateSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.sections(variables.landingId) });
      showToast(t('landing:messages.sectionSaved'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useReorderSections = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: reorderSections,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.sections(variables.landingId) });
      showToast(t('landing:messages.sectionsReordered'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: deleteSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.sections(variables.landingId) });
      queryClient.invalidateQueries({ queryKey: landingKeys.detail(variables.landingId) });
      showToast(t('landing:messages.sectionDeleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDuplicateSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: duplicateSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.sections(variables.landingId) });
      queryClient.invalidateQueries({ queryKey: landingKeys.detail(variables.landingId) });
      showToast(t('landing:messages.sectionDuplicated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// Other Mutations

export const useTranslateLanding = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: translateLanding,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: landingKeys.detail(variables.id) });
      showToast(t('landing:messages.translationStarted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useExportLanding = () => {
  const { showToast } = useToast();
  const { t } = useTranslation(['landing', 'common']);

  return useMutation({
    mutationFn: exportLanding,
    onSuccess: () => {
      showToast(t('landing:messages.exported'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};
