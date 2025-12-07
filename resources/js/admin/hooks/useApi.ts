import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  QueryKey,
  InfiniteData,
} from '@tanstack/react-query';
import { AxiosError, AxiosRequestConfig } from 'axios';
import api from '@/utils/api';
import type { ApiError } from '@/types';

// Options étendues pour useQuery
interface UseApiQueryOptions<TData> extends Omit<
  UseQueryOptions<TData, AxiosError<ApiError>, TData, QueryKey>,
  'queryKey' | 'queryFn'
> {
  enabled?: boolean;
}

// Options étendues pour useMutation
interface UseApiMutationOptions<TData, TVariables, TContext = unknown> extends Omit<
  UseMutationOptions<TData, AxiosError<ApiError>, TVariables, TContext>,
  'mutationFn'
> {
  invalidateKeys?: QueryKey[];
}

// Options étendues pour useInfiniteQuery
interface UseApiInfiniteOptions<TData> extends Omit<
  UseInfiniteQueryOptions<TData, AxiosError<ApiError>, InfiniteData<TData>, QueryKey, number>,
  'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
> {
  enabled?: boolean;
}

// Response paginée standard
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

/**
 * Hook wrapper pour accéder à l'API - utilisé par tous les autres hooks
 */
export function useApi() {
  return {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
      api.get<T>(url, config),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
      api.post<T>(url, data, config),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
      api.put<T>(url, data, config),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
      api.patch<T>(url, data, config),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
      api.delete<T>(url, config),
  };
}

/**
 * Hook générique pour les requêtes GET avec cache
 */
export function useApiQuery<TData = unknown>(
  key: QueryKey,
  url: string,
  config?: AxiosRequestConfig,
  options?: UseApiQueryOptions<TData>
) {
  return useQuery<TData, AxiosError<ApiError>>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get<TData>(url, config);
      return response.data;
    },
    ...options,
  });
}

/**
 * Hook générique pour les mutations (POST, PUT, PATCH, DELETE)
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseApiMutationOptions<TData, TVariables, TContext>
) {
  const queryClient = useQueryClient();
  const { invalidateKeys, ...mutationOptions } = options || {};

  return useMutation<TData, AxiosError<ApiError>, TVariables, TContext>({
    mutationFn,
    onSuccess: (data, variables, context, mutation) => {
      // Invalider les clés spécifiées après succès
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      // Appeler le onSuccess personnalisé si fourni
      mutationOptions.onSuccess?.(data, variables, context, mutation);
    },
    ...mutationOptions,
  });
}

/**
 * Hook pour les requêtes paginées infinies
 */
export function useApiInfinite<TData = unknown>(
  key: QueryKey,
  url: string,
  config?: AxiosRequestConfig,
  options?: UseApiInfiniteOptions<PaginatedResponse<TData>>
) {
  return useInfiniteQuery<
    PaginatedResponse<TData>,
    AxiosError<ApiError>,
    InfiniteData<PaginatedResponse<TData>>,
    QueryKey,
    number
  >({
    queryKey: key,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<PaginatedResponse<TData>>(url, {
        ...config,
        params: {
          ...config?.params,
          page: pageParam,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    ...options,
  });
}

// Helpers pour les opérations CRUD courantes
export function useApiGet<TData>(
  key: QueryKey,
  url: string,
  options?: UseApiQueryOptions<TData>
) {
  return useApiQuery<TData>(key, url, undefined, options);
}

export function useApiPost<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    async (data) => (await api.post<TData>(url, data)).data,
    options
  );
}

export function useApiPut<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    async (data) => (await api.put<TData>(url, data)).data,
    options
  );
}

export function useApiPatch<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    async (data) => (await api.patch<TData>(url, data)).data,
    options
  );
}

export function useApiDelete<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    async (id) => (await api.delete<TData>(`${url}/${id}`)).data,
    options
  );
}

export default api;
