import { useApiQuery, useApiMutation } from './useApi';
import type { ApiResponse } from '@/types/common';

export interface Platform {
  id: number;
  name: string;
  slug: string;
  url: string;
  api_url?: string;
  is_active: boolean;
  requires_auth: boolean;
  supports_scheduling: boolean;
  supports_images: boolean;
  supports_videos: boolean;
  supports_tags: boolean;
  max_title_length?: number;
  max_content_length?: number;
  isActive?: boolean; // Legacy
  articlesCount?: number;
  countriesCount?: number;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

const API = {
  platforms: '/admin/platforms',
  platform: (id: number) => `/admin/platforms/${id}`,
};

export function usePlatforms() {
  return useApiQuery<ApiResponse<Platform[]>>(
    ['platforms'],
    API.platforms,
    undefined,
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function usePlatform(id: number | undefined) {
  return useApiQuery<ApiResponse<Platform>>(
    ['platform', id],
    API.platform(id || 0),
    undefined,
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function useUpdatePlatform() {
  return useApiMutation<
    ApiResponse<Platform>,
    { id: number; data: Partial<Platform> }
  >(
    ({ id, data }) => ({
      method: 'PUT',
      url: API.platform(id),
      data,
    }),
    {
      invalidateKeys: [['platforms']],
    }
  );
}

export function useDeletePlatform() {
  return useApiMutation<ApiResponse<void>, number>(
    (id) => ({
      method: 'DELETE',
      url: API.platform(id),
    }),
    {
      invalidateKeys: [['platforms']],
    }
  );
}

export function useCreatePlatform() {
  return useApiMutation<ApiResponse<Platform>, Partial<Platform>>(
    (data) => ({
      method: 'POST',
      url: API.platforms,
      data,
    }),
    {
      invalidateKeys: [['platforms']],
    }
  );
}
