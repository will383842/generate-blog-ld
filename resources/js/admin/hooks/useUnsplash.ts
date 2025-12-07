/**
 * useUnsplash hook
 * Search and download images from Unsplash
 */

import { useState, useCallback } from 'react';
import { useApiQuery, useApiMutation } from './useApi';

export interface UnsplashUser {
  name: string;
  username: string;
  links: {
    html: string;
    photos: string;
  };
}

export interface UnsplashUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  urls: UnsplashUrls;
  user: UnsplashUser;
  // Simplified accessors
  url?: string;
  thumbnailUrl?: string;
  photographer?: string;
  photographerUrl?: string;
  downloadUrl?: string;
}

export interface UnsplashSearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

export interface UnsplashSearchResult {
  photos: UnsplashPhoto[];
  total: number;
  totalPages: number;
}

export function useUnsplashSearch() {
  const [params, setParams] = useState<UnsplashSearchParams | null>(null);

  const { data, isLoading, error } = useApiQuery<UnsplashSearchResult>(
    ['unsplash', 'search', params],
    '/admin/unsplash/search',
    { params: params || {} },
    { enabled: !!params?.query }
  );

  const search = useCallback((searchParams: UnsplashSearchParams) => {
    setParams(searchParams);
  }, []);

  const reset = useCallback(() => {
    setParams(null);
  }, []);

  return {
    photos: data?.photos || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    search,
    reset,
  };
}

export function useUnsplashDownload() {
  const mutation = useApiMutation<{ url: string }, { photoId: string }>(
    '/admin/unsplash/download',
    'post'
  );

  const download = useCallback(
    async (photoId: string) => {
      return mutation.mutateAsync({ photoId });
    },
    [mutation]
  );

  return {
    download,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useUnsplash() {
  const searchHook = useUnsplashSearch();
  const downloadHook = useUnsplashDownload();

  return {
    ...searchHook,
    download: downloadHook.download,
    isDownloading: downloadHook.isLoading,
  };
}

export default useUnsplash;
