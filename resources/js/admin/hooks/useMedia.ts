import { useQuery, useMutation, useQueryClient, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';
import {
  MediaItem,
  MediaFolder,
  MediaFilters,
  MediaStats,
  MediaUsage,
  UpdateMediaInput,
  CreateFolderInput,
  UpdateFolderInput,
  BulkMediaAction,
  UploadOptions,
  UnsplashSearchParams,
  UnsplashSearchResult,
  UnsplashPhoto,
  DalleGenerationParams,
  DalleGenerationResult,
  DalleHistory,
} from '@/types/media';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { api } from '@/utils/api';

// ============================================================================
// Query Keys
// ============================================================================

export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters: MediaFilters) => [...mediaKeys.lists(), filters] as const,
  infinite: (filters: MediaFilters) => [...mediaKeys.all, 'infinite', filters] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: number) => [...mediaKeys.details(), id] as const,
  usage: (id: number) => [...mediaKeys.all, 'usage', id] as const,
  stats: () => [...mediaKeys.all, 'stats'] as const,
  folders: () => [...mediaKeys.all, 'folders'] as const,
  folder: (id: number) => [...mediaKeys.folders(), id] as const,
  unsplash: (query: string) => [...mediaKeys.all, 'unsplash', query] as const,
  dalle: () => [...mediaKeys.all, 'dalle'] as const,
  dalleHistory: () => [...mediaKeys.dalle(), 'history'] as const,
};

// ============================================================================
// API Functions
// ============================================================================

// Media
const fetchMedia = async (
  filters: MediaFilters & { page?: number; perPage?: number }
): Promise<PaginatedResponse<MediaItem>> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.type) params.append('type', filters.type);
  if (filters.source) params.append('source', filters.source);
  if (filters.status) params.append('status', filters.status);
  if (filters.folderId !== undefined) params.append('folder_id', filters.folderId.toString());
  if (filters.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters.mimeTypes?.length) params.append('mime_types', filters.mimeTypes.join(','));
  if (filters.minSize) params.append('min_size', filters.minSize.toString());
  if (filters.maxSize) params.append('max_size', filters.maxSize.toString());
  if (filters.minWidth) params.append('min_width', filters.minWidth.toString());
  if (filters.maxWidth) params.append('max_width', filters.maxWidth.toString());
  if (filters.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters.dateTo) params.append('date_to', filters.dateTo);
  if (filters.uploadedBy) params.append('uploaded_by', filters.uploadedBy.toString());
  if (filters.unused) params.append('unused', 'true');
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.perPage) params.append('per_page', filters.perPage.toString());

  const response = await api.get<PaginatedResponse<MediaItem>>(
    `/admin/media?${params.toString()}`
  );
  return response.data;
};

const fetchMediaInfinite = async ({
  pageParam = 1,
  filters,
}: {
  pageParam?: number;
  filters: MediaFilters;
}): Promise<PaginatedResponse<MediaItem>> => {
  return fetchMedia({ ...filters, page: pageParam, perPage: 30 });
};

const fetchMediaItem = async (id: number): Promise<MediaItem> => {
  const response = await api.get<ApiResponse<MediaItem>>(`/admin/media/${id}`);
  return response.data.data;
};

const fetchMediaUsage = async (id: number): Promise<MediaUsage[]> => {
  const response = await api.get<ApiResponse<MediaUsage[]>>(`/admin/media/${id}/usage`);
  return response.data.data;
};

const fetchMediaStats = async (): Promise<MediaStats> => {
  const response = await api.get<ApiResponse<MediaStats>>('/admin/media/stats');
  // Handle both { data: {...} } and { success: true, data: {...} } formats
  return response.data?.data ?? {
    total: 0,
    by_type: { image: 0, video: 0, document: 0, audio: 0 },
    total_size: 0,
    recent_uploads: 0,
  };
};

const uploadMedia = async ({
  file,
  options,
  onProgress,
}: {
  file: File;
  options?: UploadOptions;
  onProgress?: (progress: number) => void;
}): Promise<MediaItem> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.folderId) formData.append('folder_id', options.folderId.toString());
  if (options?.isPublic !== undefined) formData.append('is_public', options.isPublic.toString());
  if (options?.metadata) formData.append('metadata', JSON.stringify(options.metadata));
  if (options?.generateVariants !== undefined) {
    formData.append('generate_variants', options.generateVariants.toString());
  }
  if (options?.maxWidth) formData.append('max_width', options.maxWidth.toString());
  if (options?.maxHeight) formData.append('max_height', options.maxHeight.toString());
  if (options?.quality) formData.append('quality', options.quality.toString());

  const response = await api.post<ApiResponse<MediaItem>>('/admin/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
  return response.data.data;
};

const updateMedia = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateMediaInput;
}): Promise<MediaItem> => {
  const response = await api.put<ApiResponse<MediaItem>>(`/admin/media/${id}`, data);
  return response.data.data;
};

const deleteMedia = async (id: number): Promise<void> => {
  await api.delete(`/admin/media/${id}`);
};

const bulkAction = async (action: BulkMediaAction): Promise<void> => {
  await api.post('/admin/media/bulk', action);
};

// Folders
const fetchFolders = async (): Promise<MediaFolder[]> => {
  const response = await api.get<ApiResponse<MediaFolder[]>>('/admin/media/folders');
  // Handle both { data: [...] } and { success: true, data: [...] } formats
  return response.data?.data ?? [];
};

const fetchFolder = async (id: number): Promise<MediaFolder> => {
  const response = await api.get<ApiResponse<MediaFolder>>(`/admin/media/folders/${id}`);
  return response.data.data;
};

const createFolder = async (data: CreateFolderInput): Promise<MediaFolder> => {
  const response = await api.post<ApiResponse<MediaFolder>>('/admin/media/folders', data);
  return response.data.data;
};

const updateFolder = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateFolderInput;
}): Promise<MediaFolder> => {
  const response = await api.put<ApiResponse<MediaFolder>>(
    `/admin/media/folders/${id}`,
    data
  );
  return response.data.data;
};

const deleteFolder = async (id: number): Promise<void> => {
  await api.delete(`/admin/media/folders/${id}`);
};

// Unsplash
const searchUnsplash = async (params: UnsplashSearchParams): Promise<UnsplashSearchResult> => {
  const queryParams = new URLSearchParams({
    query: params.query,
    page: (params.page || 1).toString(),
    per_page: (params.perPage || 20).toString(),
  });
  
  if (params.orientation) queryParams.append('orientation', params.orientation);
  if (params.color) queryParams.append('color', params.color);
  if (params.orderBy) queryParams.append('order_by', params.orderBy);

  const response = await api.get<ApiResponse<UnsplashSearchResult>>(
    `/admin/media/unsplash/search?${queryParams.toString()}`
  );
  return response.data.data;
};

const downloadUnsplash = async ({
  photo,
  folderId,
}: {
  photo: UnsplashPhoto;
  folderId?: number;
}): Promise<MediaItem> => {
  const response = await api.post<ApiResponse<MediaItem>>('/admin/media/unsplash/download', {
    photo_id: photo.id,
    download_url: photo.downloadUrl,
    folder_id: folderId,
    metadata: {
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      alt: photo.altDescription || photo.description,
    },
  });
  return response.data.data;
};

// DALL-E
const generateDalle = async (params: DalleGenerationParams): Promise<DalleGenerationResult> => {
  const response = await api.post<ApiResponse<DalleGenerationResult>>(
    '/admin/media/dalle/generate',
    {
      prompt: params.prompt,
      style: params.style || 'natural',
      quality: params.quality || 'standard',
      size: params.size || '1024x1024',
      n: params.n || 1,
    }
  );
  return response.data.data;
};

const saveDalleToLibrary = async ({
  image,
  folderId,
}: {
  image: { url: string; prompt: string };
  folderId?: number;
}): Promise<MediaItem> => {
  const response = await api.post<ApiResponse<MediaItem>>('/admin/media/dalle/save', {
    url: image.url,
    prompt: image.prompt,
    folder_id: folderId,
  });
  return response.data.data;
};

const fetchDalleHistory = async (): Promise<DalleHistory[]> => {
  const response = await api.get<ApiResponse<DalleHistory[]>>('/admin/media/dalle/history');
  return response.data.data;
};

// ============================================================================
// Query Hooks
// ============================================================================

export const useMedia = (filters: MediaFilters & { page?: number; perPage?: number } = {}) => {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: () => fetchMedia(filters),
    staleTime: 30 * 1000,
  });
};

export const useMediaInfinite = (filters: MediaFilters = {}) => {
  return useInfiniteQuery({
    queryKey: mediaKeys.infinite(filters),
    queryFn: ({ pageParam }) => fetchMediaInfinite({ pageParam, filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.lastPage) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 30 * 1000,
  });
};

export const useMediaItem = (
  id: number,
  options?: Omit<UseQueryOptions<MediaItem, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => fetchMediaItem(id),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useMediaUsage = (id: number) => {
  return useQuery({
    queryKey: mediaKeys.usage(id),
    queryFn: () => fetchMediaUsage(id),
    staleTime: 60 * 1000,
  });
};

export const useMediaStats = () => {
  return useQuery({
    queryKey: mediaKeys.stats(),
    queryFn: fetchMediaStats,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMediaFolders = () => {
  return useQuery({
    queryKey: mediaKeys.folders(),
    queryFn: fetchFolders,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMediaFolder = (id: number) => {
  return useQuery({
    queryKey: mediaKeys.folder(id),
    queryFn: () => fetchFolder(id),
    staleTime: 60 * 1000,
  });
};

export const useSearchUnsplash = (params: UnsplashSearchParams, enabled = true) => {
  return useQuery({
    queryKey: mediaKeys.unsplash(JSON.stringify(params)),
    queryFn: () => searchUnsplash(params),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!params.query,
  });
};

export const useDalleHistory = () => {
  return useQuery({
    queryKey: mediaKeys.dalleHistory(),
    queryFn: fetchDalleHistory,
    staleTime: 60 * 1000,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.stats() });
      showToast(t('media:messages.uploaded'), 'success');
    },
    onError: () => {
      showToast(t('media:messages.uploadFailed'), 'error');
    },
  });
};

export const useUpdateMedia = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: updateMedia,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.setQueryData(mediaKeys.detail(data.id), data);
      showToast(t('media:messages.updated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.stats() });
      showToast(t('media:messages.deleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useBulkMediaAction = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: bulkAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.stats() });
      
      const count = variables.mediaIds.length;
      const actionKey = `media:messages.bulk.${variables.action}`;
      showToast(t(actionKey, { count }), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// Folder mutations
export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.folders() });
      showToast(t('media:messages.folderCreated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: updateFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.folders() });
      queryClient.setQueryData(mediaKeys.folder(data.id), data);
      showToast(t('media:messages.folderUpdated'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.folders() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      showToast(t('media:messages.folderDeleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// Unsplash mutations
export const useDownloadUnsplash = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: downloadUnsplash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.stats() });
      showToast(t('media:messages.unsplashDownloaded'), 'success');
    },
    onError: () => {
      showToast(t('media:messages.unsplashFailed'), 'error');
    },
  });
};

// DALL-E mutations
export const useGenerateDalle = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: generateDalle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.dalleHistory() });
      showToast(t('media:messages.dalleGenerated'), 'success');
    },
    onError: () => {
      showToast(t('media:messages.dalleFailed'), 'error');
    },
  });
};

export const useSaveDalleToLibrary = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: saveDalleToLibrary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.stats() });
      showToast(t('media:messages.dalleSaved'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};
