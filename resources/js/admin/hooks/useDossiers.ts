import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';
import {
  PressDossier,
  DossierSection,
  DossierFilters,
  ExportResult,
  ExportFormat,
} from '@/types/press';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { api } from '@/utils/api';

// Query Keys
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters: DossierFilters) => [...dossierKeys.lists(), filters] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: number) => [...dossierKeys.details(), id] as const,
  sections: (dossierId: number) => [...dossierKeys.all, 'sections', dossierId] as const,
  stats: () => [...dossierKeys.all, 'stats'] as const,
};

// API Functions
const fetchDossiers = async (
  filters: DossierFilters & { page?: number; perPage?: number }
): Promise<PaginatedResponse<PressDossier>> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.platform) params.append('platform', filters.platform);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters.dateTo) params.append('date_to', filters.dateTo);
  if (filters.minSections) params.append('min_sections', filters.minSections.toString());
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.perPage) params.append('per_page', filters.perPage.toString());

  const response = await api.get<PaginatedResponse<PressDossier>>(
    `/admin/press-dossiers?${params.toString()}`
  );
  return response.data;
};

const fetchDossier = async (id: number): Promise<PressDossier> => {
  const response = await api.get<ApiResponse<PressDossier>>(
    `/admin/press-dossiers/${id}`
  );
  return response.data.data;
};

const fetchDossierSections = async (dossierId: number): Promise<DossierSection[]> => {
  const response = await api.get<ApiResponse<DossierSection[]>>(
    `/admin/press-dossiers/${dossierId}/sections`
  );
  return response.data.data;
};

interface CreateDossierInput {
  title: string;
  platform: string;
  excerpt?: string;
}

const createDossier = async (data: CreateDossierInput): Promise<PressDossier> => {
  const response = await api.post<ApiResponse<PressDossier>>(
    '/admin/press-dossiers',
    data
  );
  return response.data.data;
};

interface UpdateDossierInput {
  title?: string;
  excerpt?: string;
  platform?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
}

const updateDossier = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateDossierInput;
}): Promise<PressDossier> => {
  const response = await api.put<ApiResponse<PressDossier>>(
    `/admin/press-dossiers/${id}`,
    data
  );
  return response.data.data;
};

const deleteDossier = async (id: number): Promise<void> => {
  await api.delete(`/admin/press-dossiers/${id}`);
};

const duplicateDossier = async (id: number): Promise<PressDossier> => {
  const response = await api.post<ApiResponse<PressDossier>>(
    `/admin/press-dossiers/${id}/duplicate`
  );
  return response.data.data;
};

const publishDossier = async (id: number): Promise<PressDossier> => {
  const response = await api.post<ApiResponse<PressDossier>>(
    `/admin/press-dossiers/${id}/publish`
  );
  return response.data.data;
};

const unpublishDossier = async (id: number): Promise<PressDossier> => {
  const response = await api.post<ApiResponse<PressDossier>>(
    `/admin/press-dossiers/${id}/unpublish`
  );
  return response.data.data;
};

// Section operations
interface AddSectionInput {
  dossierId: number;
  data: {
    type: string;
    title: string;
    content?: string;
    order?: number;
  };
}

const addSection = async ({ dossierId, data }: AddSectionInput): Promise<DossierSection> => {
  const response = await api.post<ApiResponse<DossierSection>>(
    `/admin/press-dossiers/${dossierId}/sections`,
    data
  );
  return response.data.data;
};

interface UpdateSectionInput {
  dossierId: number;
  sectionId: number;
  data: {
    title?: string;
    content?: string;
    config?: Record<string, unknown>;
  };
}

const updateSection = async ({
  dossierId,
  sectionId,
  data,
}: UpdateSectionInput): Promise<DossierSection> => {
  const response = await api.put<ApiResponse<DossierSection>>(
    `/admin/press-dossiers/${dossierId}/sections/${sectionId}`,
    data
  );
  return response.data.data;
};

interface ReorderSectionsInput {
  dossierId: number;
  sectionIds: number[];
}

const reorderSections = async ({
  dossierId,
  sectionIds,
}: ReorderSectionsInput): Promise<DossierSection[]> => {
  const response = await api.put<ApiResponse<DossierSection[]>>(
    `/admin/press-dossiers/${dossierId}/sections/reorder`,
    { section_ids: sectionIds }
  );
  return response.data.data;
};

interface DeleteSectionInput {
  dossierId: number;
  sectionId: number;
}

const deleteSection = async ({ dossierId, sectionId }: DeleteSectionInput): Promise<void> => {
  await api.delete(`/admin/press-dossiers/${dossierId}/sections/${sectionId}`);
};

// Export operations
interface ExportDossierInput {
  id: number;
  format: ExportFormat;
  options?: {
    language?: string;
    includeMedia?: boolean;
    includeCharts?: boolean;
    layout?: string;
  };
}

const exportDossier = async ({ id, format, options }: ExportDossierInput): Promise<ExportResult> => {
  const response = await api.post<ApiResponse<ExportResult>>(
    `/admin/press-dossiers/${id}/export`,
    { format, ...options }
  );
  return response.data.data;
};

// Stats
interface DossierStats {
  total: number;
  published: number;
  drafts: number;
  totalSections: number;
  avgSectionsPerDossier: number;
  publishedThisMonth: number;
}

const fetchDossierStats = async (): Promise<DossierStats> => {
  const response = await api.get<ApiResponse<DossierStats>>(
    '/admin/press-dossiers/stats'
  );
  return response.data.data;
};

// Hooks

export const useDossiers = (
  filters: DossierFilters & { page?: number; perPage?: number } = {}
) => {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: () => fetchDossiers(filters),
    staleTime: 30 * 1000,
  });
};

export const useDossier = (
  id: number,
  options?: Omit<UseQueryOptions<PressDossier, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: dossierKeys.detail(id),
    queryFn: () => fetchDossier(id),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useDossierSections = (
  dossierId: number,
  options?: Omit<UseQueryOptions<DossierSection[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: dossierKeys.sections(dossierId),
    queryFn: () => fetchDossierSections(dossierId),
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useDossierStats = () => {
  return useQuery({
    queryKey: dossierKeys.stats(),
    queryFn: fetchDossierStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDossier = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: createDossier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.stats() });
      showToast(t('press:messages.dossierCreated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUpdateDossier = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: updateDossier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.setQueryData(dossierKeys.detail(data.id), data);
      showToast(t('press:messages.dossierSaved'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteDossier = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: deleteDossier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.stats() });
      showToast(t('press:messages.dossierDeleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDuplicateDossier = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: duplicateDossier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.stats() });
      showToast(t('press:messages.dossierDuplicated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const usePublishDossier = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: publishDossier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.stats() });
      queryClient.setQueryData(dossierKeys.detail(data.id), data);
      showToast(t('press:messages.dossierPublished'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUnpublishDossier = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: unpublishDossier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.stats() });
      queryClient.setQueryData(dossierKeys.detail(data.id), data);
      showToast(t('press:messages.dossierUnpublished'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// Section mutations

export const useAddSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: addSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.sections(variables.dossierId) });
      queryClient.invalidateQueries({ queryKey: dossierKeys.detail(variables.dossierId) });
      showToast(t('press:messages.sectionAdded'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: updateSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.sections(variables.dossierId) });
      showToast(t('press:messages.sectionSaved'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useReorderSections = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: reorderSections,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.sections(variables.dossierId) });
      showToast(t('press:messages.sectionsReordered'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: deleteSection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dossierKeys.sections(variables.dossierId) });
      queryClient.invalidateQueries({ queryKey: dossierKeys.detail(variables.dossierId) });
      showToast(t('press:messages.sectionDeleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// Export mutation

export const useExportDossier = () => {
  const { showToast } = useToast();
  const { t } = useTranslation(['press', 'common']);

  return useMutation({
    mutationFn: exportDossier,
    onSuccess: () => {
      showToast(t('press:messages.dossierExported'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};
