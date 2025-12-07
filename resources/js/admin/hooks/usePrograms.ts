// ═══════════════════════════════════════════════════════════════════════════
// PROGRAMS HOOKS - CRUD & Actions for Content Engine Programs
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation, useApiInfinite } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  Program,
  ProgramSummary,
  ProgramRun,
  ProgramItem,
  ProgramAnalytics,
  ProgramQuickStats,
  ProgramValidation,
  SchedulePreview,
  ProgramFilters,
  ProgramRunFilters,
  ProgramItemFilters,
  CreateProgramInput,
  UpdateProgramInput,
} from '@/types/program';
import type { PaginatedResponse, ApiResponse } from '@/types/common';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (filters: ProgramFilters) => [...programKeys.lists(), filters] as const,
  details: () => [...programKeys.all, 'detail'] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
  runs: (programId: string) => [...programKeys.all, 'runs', programId] as const,
  run: (runId: string) => [...programKeys.all, 'run', runId] as const,
  items: (runId: string) => [...programKeys.all, 'items', runId] as const,
  analytics: (programId: string, period: string) => 
    [...programKeys.all, 'analytics', programId, period] as const,
  quickStats: (programId: string) => [...programKeys.all, 'quickStats', programId] as const,
  validation: (programId: string) => [...programKeys.all, 'validation', programId] as const,
  schedulePreview: (programId: string) => [...programKeys.all, 'schedule', programId] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const API = {
  programs: '/admin/programs',
  program: (id: string) => `/admin/programs/${id}`,
  programRuns: (id: string) => `/admin/programs/${id}/runs`,
  programAnalytics: (id: string) => `/admin/programs/${id}/analytics`,
  programQuickStats: (id: string) => `/admin/programs/${id}/quick-stats`,
  programValidate: (id: string) => `/admin/programs/${id}/validate`,
  programSchedule: (id: string) => `/admin/programs/${id}/schedule-preview`,
  programActivate: (id: string) => `/admin/programs/${id}/activate`,
  programPause: (id: string) => `/admin/programs/${id}/pause`,
  programResume: (id: string) => `/admin/programs/${id}/resume`,
  programRun: (id: string) => `/admin/programs/${id}/run`,
  programClone: (id: string) => `/admin/programs/${id}/clone`,
  programArchive: (id: string) => `/admin/programs/${id}/archive`,
  runs: '/admin/program-runs',
  run: (id: string) => `/admin/program-runs/${id}`,
  runItems: (id: string) => `/admin/program-runs/${id}/items`,
  runCancel: (id: string) => `/admin/program-runs/${id}/cancel`,
  runRetry: (id: string) => `/admin/program-runs/${id}/retry`,
};

// ═══════════════════════════════════════════════════════════════════════════
// LIST & DETAIL HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch paginated list of programs
 */
export function usePrograms(filters: ProgramFilters = {}) {
  return useApiQuery<PaginatedResponse<ProgramSummary>>(
    programKeys.list(filters),
    API.programs,
    {
      params: filters,
    },
    {
      staleTime: 30000,
    }
  );
}

/**
 * Fetch programs with infinite scroll
 */
export function useProgramsInfinite(filters: Omit<ProgramFilters, 'page'> = {}) {
  return useApiInfinite<PaginatedResponse<ProgramSummary>>(
    programKeys.list(filters),
    API.programs,
    {
      params: {
        ...filters,
        perPage: filters.perPage || 20,
      },
    },
    undefined
  );
}

/**
 * Fetch single program details
 */
export function useProgram(id: string | undefined, options?: { enabled?: boolean }) {
  return useApiQuery<ApiResponse<Program>>(
    programKeys.detail(id || ''),
    API.program(id || ''),
    undefined,
    {
      enabled: !!id && options?.enabled !== false,
      staleTime: 30000,
    }
  );
}

/**
 * Fetch program runs history
 */
export function useProgramRuns(
  programId: string,
  filters: Omit<ProgramRunFilters, 'programId'> = {}
) {
  return useApiQuery<PaginatedResponse<ProgramRun>>(
    programKeys.runs(programId),
    API.programRuns(programId),
    {
      params: filters,
    },
    {
      enabled: !!programId,
      staleTime: 15000,
    }
  );
}

/**
 * Fetch single run details
 */
export function useProgramRun(runId: string | undefined) {
  return useApiQuery<ApiResponse<ProgramRun>>(
    programKeys.run(runId || ''),
    API.run(runId || ''),
    undefined,
    {
      enabled: !!runId,
      staleTime: 5000, // Shorter for active runs
      refetchInterval: (query) => {
        const run = query.state.data?.data as ProgramRun | undefined;
        return run?.status === 'running' ? 3000 : false;
      },
    }
  );
}

/**
 * Fetch items for a specific run
 */
export function useProgramRunItems(
  runId: string,
  filters: Omit<ProgramItemFilters, 'programRunId'> = {}
) {
  return useApiQuery<PaginatedResponse<ProgramItem>>(
    programKeys.items(runId),
    API.runItems(runId),
    {
      params: filters,
    },
    {
      enabled: !!runId,
      staleTime: 10000,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS & STATS HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch program analytics
 */
export function useProgramAnalytics(
  programId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'week'
) {
  return useApiQuery<ApiResponse<ProgramAnalytics>>(
    programKeys.analytics(programId, period),
    API.programAnalytics(programId),
    {
      params: { period },
    },
    {
      enabled: !!programId,
      staleTime: 60000, // 1 minute
    }
  );
}

/**
 * Fetch program quick stats
 */
export function useProgramQuickStats(programId: string) {
  return useApiQuery<ApiResponse<ProgramQuickStats>>(
    programKeys.quickStats(programId),
    API.programQuickStats(programId),
    undefined,
    {
      enabled: !!programId,
      staleTime: 30000,
    }
  );
}

/**
 * Validate program configuration
 */
export function useProgramValidation(programId: string, config?: Partial<Program>) {
  return useApiQuery<ApiResponse<ProgramValidation>>(
    programKeys.validation(programId),
    API.programValidate(programId),
    {
      params: config,
    },
    {
      enabled: !!programId,
      staleTime: 10000,
    }
  );
}

/**
 * Preview upcoming schedule
 */
export function useSchedulePreview(programId: string) {
  return useApiQuery<ApiResponse<SchedulePreview>>(
    programKeys.schedulePreview(programId),
    API.programSchedule(programId),
    undefined,
    {
      enabled: !!programId,
      staleTime: 30000,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new program
 */
export function useCreateProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, CreateProgramInput>(
    async (variables) => (await api.post<ApiResponse<Program>>(API.programs, variables)).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme créé', `Le programme "${data.data.name}" a été créé avec succès.`);
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de créer le programme');
      },
    }
  );
}

/**
 * Update an existing program
 */
export function useUpdateProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, UpdateProgramInput>(
    async (variables: UpdateProgramInput) => (
      await api.put<ApiResponse<Program>>(API.program(variables.id), variables)
    ).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme mis à jour', 'Les modifications ont été enregistrées.');
        queryClient.invalidateQueries({ queryKey: programKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le programme');
      },
    }
  );
}

/**
 * Delete a program
 */
export function useDeleteProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<void>, { id: string; force?: boolean }>(
    async (variables) => (
      await api.delete<ApiResponse<void>>(API.program(variables.id), {
        params: { force: variables.force },
      })
    ).data,
    {
      onSuccess: () => {
        success('Programme supprimé', 'Le programme a été supprimé définitivement.');
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de supprimer le programme');
      },
    }
  );
}

/**
 * Activate a program
 */
export function useActivateProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, string>(
    async (id: string) => (await api.post<ApiResponse<Program>>(API.programActivate(id))).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme activé', `"${data.data.name}" est maintenant actif.`);
        queryClient.invalidateQueries({ queryKey: programKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible d\'activer le programme');
      },
    }
  );
}

/**
 * Pause a program
 */
export function usePauseProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, string>(
    async (id: string) => (await api.post<ApiResponse<Program>>(API.programPause(id))).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme mis en pause', `"${data.data.name}" est maintenant en pause.`);
        queryClient.invalidateQueries({ queryKey: programKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de mettre en pause');
      },
    }
  );
}

/**
 * Resume a paused program
 */
export function useResumeProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, string>(
    async (id: string) => (await api.post<ApiResponse<Program>>(API.programResume(id))).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme repris', `"${data.data.name}" a été réactivé.`);
        queryClient.invalidateQueries({ queryKey: programKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de reprendre le programme');
      },
    }
  );
}

/**
 * Clone a program
 */
export function useCloneProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, { id: string; name?: string }>(
    async (variables) => (
      await api.post<ApiResponse<Program>>(API.programClone(variables.id), {
        name: variables.name,
      })
    ).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme cloné', `Copie créée : "${data.data.name}"`);
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de cloner le programme');
      },
    }
  );
}

/**
 * Run a program immediately
 */
export function useRunProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<ProgramRun>, { id: string; dryRun?: boolean }>(
    async (variables) => (
      await api.post<ApiResponse<ProgramRun>>(API.programRun(variables.id), {
        dryRun: variables.dryRun,
      })
    ).data,
    {
      onSuccess: (data: ApiResponse<ProgramRun>, variables) => {
        if (variables.dryRun) {
          success('Simulation terminée', `${data.data.itemsPlanned} éléments seraient générés.`);
        } else {
          success('Programme lancé', `Exécution démarrée (${data.data.itemsPlanned} éléments).`);
          queryClient.invalidateQueries({ queryKey: programKeys.runs(variables.id) });
        }
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de lancer le programme');
      },
    }
  );
}

/**
 * Archive a program
 */
export function useArchiveProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Program>, string>(
    async (id: string) => (await api.post<ApiResponse<Program>>(API.programArchive(id))).data,
    {
      onSuccess: (data: ApiResponse<Program>) => {
        success('Programme archivé', `"${data.data.name}" a été archivé.`);
        queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible d\'archiver');
      },
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN MANAGEMENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cancel a running execution
 */
export function useCancelRun() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<ProgramRun>, string>(
    async (runId: string) => (await api.post<ApiResponse<ProgramRun>>(API.runCancel(runId))).data,
    {
      onSuccess: (data: ApiResponse<ProgramRun>) => {
        success('Exécution annulée', 'L\'exécution a été arrêtée.');
        queryClient.invalidateQueries({ queryKey: programKeys.run(data.data.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.runs(data.data.programId) });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible d\'annuler l\'exécution');
      },
    }
  );
}

/**
 * Retry failed items in a run
 */
export function useRetryRun() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<ProgramRun>, { runId: string; itemIds?: string[] }>(
    async (variables) => (
      await api.post<ApiResponse<ProgramRun>>(API.runRetry(variables.runId), {
        itemIds: variables.itemIds,
      })
    ).data,
    {
      onSuccess: (data: ApiResponse<ProgramRun>, variables) => {
        const count = variables.itemIds?.length || data.data.itemsFailed;
        success('Relance démarrée', `${count} élément(s) seront réessayés.`);
        queryClient.invalidateQueries({ queryKey: programKeys.run(data.data.id) });
        queryClient.invalidateQueries({ queryKey: programKeys.items(data.data.id) });
      },
      onError: (error: Error & { response?: { data?: { message?: string } } }) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de relancer');
      },
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Prefetch program data
 */
export function usePrefetchProgram() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: programKeys.detail(id),
        queryFn: async () => {
          const { data } = await api.get<ApiResponse<Program>>(API.program(id));
          return data;
        },
        staleTime: 30000,
      });
    },
    [queryClient]
  );
}

/**
 * Invalidate all program-related queries
 */
export function useInvalidatePrograms() {
  const queryClient = useQueryClient();

  return useCallback(
    (programId?: string) => {
      if (programId) {
        queryClient.invalidateQueries({ queryKey: programKeys.detail(programId) });
        queryClient.invalidateQueries({ queryKey: programKeys.runs(programId) });
        queryClient.invalidateQueries({ queryKey: programKeys.analytics(programId, 'week') });
      } else {
        queryClient.invalidateQueries({ queryKey: programKeys.all });
      }
    },
    [queryClient]
  );
}

/**
 * Get cached program data
 */
export function useCachedProgram(id: string): Program | undefined {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData<ApiResponse<Program>>(programKeys.detail(id));
  return data?.data;
}