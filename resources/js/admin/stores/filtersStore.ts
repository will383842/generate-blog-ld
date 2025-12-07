/**
 * Filters Store
 * File 398 - Zustand store for page filters
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Filter Types
// ============================================================================

export interface ArticleFilters {
  status?: 'draft' | 'published' | 'archived';
  categoryId?: number;
  tagIds?: number[];
  authorId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  qualityMin?: number;
  qualityMax?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'quality_score';
  sortOrder?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ProgramFilters {
  status?: 'active' | 'paused' | 'completed' | 'draft';
  type?: string;
  platformId?: number;
  search?: string;
  sortBy?: 'created_at' | 'name' | 'articles_count';
  sortOrder?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface QueueFilters {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  priority?: 'high' | 'default' | 'low';
  programId?: number;
  dateFrom?: string;
  dateTo?: string;
  per_page?: number;
  page?: number;
}

export interface PublicationFilters {
  status?: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed';
  platformId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface MediaFilters {
  type?: 'image' | 'video' | 'document' | 'audio';
  folder?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive' | 'pending';
  search?: string;
  sortBy?: 'created_at' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface LogFilters {
  level?: 'info' | 'warning' | 'error' | 'debug';
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

// ============================================================================
// Filter Preset Types
// ============================================================================

export interface FilterPreset {
  id: string;
  name: string;
  page: PageFilterKey;
  filters: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// Page Filter Keys
// ============================================================================

export type PageFilterKey =
  | 'articles'
  | 'programs'
  | 'queue'
  | 'publications'
  | 'media'
  | 'users'
  | 'logs'
  | 'analytics';

// ============================================================================
// Filters State
// ============================================================================

export interface FiltersState {
  articles: ArticleFilters;
  programs: ProgramFilters;
  queue: QueueFilters;
  publications: PublicationFilters;
  media: MediaFilters;
  users: UserFilters;
  logs: LogFilters;
  analytics: Record<string, unknown>;
  presets: FilterPreset[];
}

// ============================================================================
// Store Interface
// ============================================================================

interface FiltersStore extends FiltersState {
  // Actions
  setFilters: <K extends PageFilterKey>(page: K, filters: Partial<FiltersState[K]>) => void;
  clearFilters: (page: PageFilterKey) => void;
  resetAllFilters: () => void;
  
  // Presets
  savePreset: (name: string, page: PageFilterKey) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  
  // Helpers
  getFilters: <K extends PageFilterKey>(page: K) => FiltersState[K];
  hasActiveFilters: (page: PageFilterKey) => boolean;
}

// ============================================================================
// Default Filters
// ============================================================================

const defaultFilters: FiltersState = {
  articles: {
    sortBy: 'created_at',
    sortOrder: 'desc',
    per_page: 20,
    page: 1,
  },
  programs: {
    sortBy: 'created_at',
    sortOrder: 'desc',
    per_page: 20,
    page: 1,
  },
  queue: {
    per_page: 20,
    page: 1,
  },
  publications: {
    per_page: 20,
    page: 1,
  },
  media: {
    sortBy: 'created_at',
    sortOrder: 'desc',
    per_page: 24,
    page: 1,
  },
  users: {
    sortBy: 'created_at',
    sortOrder: 'desc',
    per_page: 20,
    page: 1,
  },
  logs: {
    per_page: 50,
    page: 1,
  },
  analytics: {},
  presets: [],
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set, get) => ({
      ...defaultFilters,

      // Set filters for a page
      setFilters: (page, filters) => {
        set((state) => ({
          [page]: {
            ...state[page],
            ...filters,
          },
        }));
      },

      // Clear filters for a page
      clearFilters: (page) => {
        set({
          [page]: defaultFilters[page],
        });
      },

      // Reset all filters
      resetAllFilters: () => {
        set({
          articles: defaultFilters.articles,
          programs: defaultFilters.programs,
          queue: defaultFilters.queue,
          publications: defaultFilters.publications,
          media: defaultFilters.media,
          users: defaultFilters.users,
          logs: defaultFilters.logs,
          analytics: defaultFilters.analytics,
        });
      },

      // Save current filters as preset
      savePreset: (name, page) => {
        const currentFilters = get()[page];
        const preset: FilterPreset = {
          id: `preset_${Date.now()}`,
          name,
          page,
          filters: { ...currentFilters },
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          presets: [...state.presets, preset],
        }));
      },

      // Load preset
      loadPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (preset) {
          set({
            [preset.page]: preset.filters,
          });
        }
      },

      // Delete preset
      deletePreset: (presetId) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== presetId),
        }));
      },

      // Get filters for a page
      getFilters: (page) => get()[page],

      // Check if page has active filters
      hasActiveFilters: (page) => {
        const currentFilters = get()[page];
        const defaultPageFilters = defaultFilters[page];
        
        // Compare current with defaults
        const filterKeys = Object.keys(currentFilters).filter(
          (key) => !['per_page', 'page', 'sortBy', 'sortOrder'].includes(key)
        );
        
        return filterKeys.some((key) => {
          const current = currentFilters[key as keyof typeof currentFilters];
          const defaultVal = defaultPageFilters[key as keyof typeof defaultPageFilters];
          return current !== undefined && current !== defaultVal;
        });
      },
    }),
    {
      name: 'content-engine-filters',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        articles: state.articles,
        programs: state.programs,
        queue: state.queue,
        publications: state.publications,
        media: state.media,
        users: state.users,
        logs: state.logs,
        presets: state.presets,
      }),
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

export const useArticleFilters = () => useFiltersStore((state) => state.articles);
export const useProgramFilters = () => useFiltersStore((state) => state.programs);
export const useQueueFilters = () => useFiltersStore((state) => state.queue);
export const usePublicationFilters = () => useFiltersStore((state) => state.publications);
export const useMediaFilters = () => useFiltersStore((state) => state.media);
export const useUserFilters = () => useFiltersStore((state) => state.users);
export const useLogFilters = () => useFiltersStore((state) => state.logs);
export const useFilterPresets = () => useFiltersStore((state) => state.presets);

export default useFiltersStore;
