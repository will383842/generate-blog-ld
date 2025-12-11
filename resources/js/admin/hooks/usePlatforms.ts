import { useApiQuery } from './useApi';
import type { ApiResponse } from '@/types/common';

export interface Platform {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  articlesCount?: number;
  countriesCount?: number;
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
