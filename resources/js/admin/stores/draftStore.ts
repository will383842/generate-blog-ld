/**
 * Draft Store
 * File 400 - Zustand store for auto-save drafts
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Draft Types
// ============================================================================

export type DraftType = 'programs' | 'articles' | 'settings' | 'templates' | 'prompts';

export interface Draft<T = Record<string, unknown>> {
  id: string;
  type: DraftType;
  data: T;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DraftMetadata {
  id: string;
  type: DraftType;
  title?: string;
  updatedAt: string;
}

// ============================================================================
// Store State
// ============================================================================

interface DraftState {
  drafts: {
    programs: Record<string, Draft>;
    articles: Record<string, Draft>;
    settings: Record<string, Draft>;
    templates: Record<string, Draft>;
    prompts: Record<string, Draft>;
  };
  autoSaveInterval: number; // in milliseconds
  draftExpiration: number; // in milliseconds (default 7 days)
}

// ============================================================================
// Store Actions
// ============================================================================

interface DraftActions {
  // Core operations
  saveDraft: <T extends Record<string, unknown>>(type: DraftType, id: string, data: T) => void;
  getDraft: <T extends Record<string, unknown>>(type: DraftType, id: string) => Draft<T> | null;
  deleteDraft: (type: DraftType, id: string) => void;
  hasDraft: (type: DraftType, id: string) => boolean;
  
  // Bulk operations
  clearAllDrafts: () => void;
  clearDraftsByType: (type: DraftType) => void;
  clearExpiredDrafts: () => void;
  
  // Metadata
  getDraftMetadata: (type: DraftType, id: string) => DraftMetadata | null;
  getAllDraftMetadata: () => DraftMetadata[];
  getDraftsByType: (type: DraftType) => Draft[];
  
  // Settings
  setAutoSaveInterval: (interval: number) => void;
  setDraftExpiration: (expiration: number) => void;
  
  // Recovery
  restoreDraft: <T extends Record<string, unknown>>(type: DraftType, id: string) => T | null;
  compareDraft: <T extends Record<string, unknown>>(
    type: DraftType,
    id: string,
    currentData: T
  ) => { hasChanges: boolean; draft: Draft<T> | null };
}

// ============================================================================
// Store Interface
// ============================================================================

type DraftStore = DraftState & DraftActions;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds
const DEFAULT_DRAFT_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// Store Implementation
// ============================================================================

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      // Initial state
      drafts: {
        programs: {},
        articles: {},
        settings: {},
        templates: {},
        prompts: {},
      },
      autoSaveInterval: DEFAULT_AUTO_SAVE_INTERVAL,
      draftExpiration: DEFAULT_DRAFT_EXPIRATION,

      // Save draft
      saveDraft: (type, id, data) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + get().draftExpiration);

        const draft: Draft = {
          id,
          type,
          data,
          createdAt: get().drafts[type][id]?.createdAt || now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        };

        set((state) => ({
          drafts: {
            ...state.drafts,
            [type]: {
              ...state.drafts[type],
              [id]: draft,
            },
          },
        }));
      },

      // Get draft
      getDraft: (type, id) => {
        const draft = get().drafts[type][id];
        if (!draft) return null;

        // Check if expired
        if (new Date(draft.expiresAt) < new Date()) {
          get().deleteDraft(type, id);
          return null;
        }

        return draft as Draft<T>;
      },

      // Delete draft
      deleteDraft: (type, id) => {
        set((state) => {
          const typeDrafts = { ...state.drafts[type] };
          delete typeDrafts[id];
          return {
            drafts: {
              ...state.drafts,
              [type]: typeDrafts,
            },
          };
        });
      },

      // Check if draft exists
      hasDraft: (type, id) => {
        const draft = get().drafts[type][id];
        if (!draft) return false;

        // Check expiration
        if (new Date(draft.expiresAt) < new Date()) {
          get().deleteDraft(type, id);
          return false;
        }

        return true;
      },

      // Clear all drafts
      clearAllDrafts: () => {
        set({
          drafts: {
            programs: {},
            articles: {},
            settings: {},
            templates: {},
            prompts: {},
          },
        });
      },

      // Clear drafts by type
      clearDraftsByType: (type) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [type]: {},
          },
        }));
      },

      // Clear expired drafts
      clearExpiredDrafts: () => {
        const now = new Date();
        set((state) => {
          const newDrafts = { ...state.drafts };

          (Object.keys(newDrafts) as DraftType[]).forEach((type) => {
            const typeDrafts = { ...newDrafts[type] };
            Object.entries(typeDrafts).forEach(([id, draft]) => {
              if (new Date(draft.expiresAt) < now) {
                delete typeDrafts[id];
              }
            });
            newDrafts[type] = typeDrafts;
          });

          return { drafts: newDrafts };
        });
      },

      // Get draft metadata
      getDraftMetadata: (type, id) => {
        const draft = get().getDraft(type, id);
        if (!draft) return null;

        return {
          id: draft.id,
          type: draft.type,
          title: draft.data.title || draft.data.name,
          updatedAt: draft.updatedAt,
        };
      },

      // Get all draft metadata
      getAllDraftMetadata: () => {
        const metadata: DraftMetadata[] = [];
        const drafts = get().drafts;

        (Object.keys(drafts) as DraftType[]).forEach((type) => {
          Object.values(drafts[type]).forEach((draft) => {
            // Skip expired
            if (new Date(draft.expiresAt) < new Date()) return;

            metadata.push({
              id: draft.id,
              type: draft.type,
              title: draft.data.title || draft.data.name,
              updatedAt: draft.updatedAt,
            });
          });
        });

        // Sort by most recent
        return metadata.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },

      // Get drafts by type
      getDraftsByType: (type) => {
        const now = new Date();
        return Object.values(get().drafts[type]).filter(
          (draft) => new Date(draft.expiresAt) >= now
        );
      },

      // Set auto-save interval
      setAutoSaveInterval: (interval) => {
        set({ autoSaveInterval: interval });
      },

      // Set draft expiration
      setDraftExpiration: (expiration) => {
        set({ draftExpiration: expiration });
      },

      // Restore draft data
      restoreDraft: (type, id) => {
        const draft = get().getDraft(type, id);
        return draft ? (draft.data as T) : null;
      },

      // Compare draft with current data
      compareDraft: (type, id, currentData) => {
        const draft = get().getDraft(type, id);
        if (!draft) {
          return { hasChanges: false, draft: null };
        }

        // Simple deep equality check
        const hasChanges = JSON.stringify(draft.data) !== JSON.stringify(currentData);
        return { hasChanges, draft: draft as Draft<T> };
      },
    }),
    {
      name: 'content-engine-drafts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        autoSaveInterval: state.autoSaveInterval,
        draftExpiration: state.draftExpiration,
      }),
      onRehydrateStorage: () => (state) => {
        // Clean up expired drafts on load
        if (state) {
          state.clearExpiredDrafts();
        }
      },
    }
  )
);

// ============================================================================
// Auto-Save Hook
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  type: DraftType;
  id: string;
  data: T;
  enabled?: boolean;
  interval?: number;
  onSave?: () => void;
}

export function useAutoSave<T extends Record<string, unknown>>({
  type,
  id,
  data,
  enabled = true,
  interval,
  onSave,
}: UseAutoSaveOptions<T>) {
  const { saveDraft, autoSaveInterval, getDraft, deleteDraft } = useDraftStore();
  const intervalRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef(data);

  // Keep data ref updated
  dataRef.current = data;

  const save = useCallback(() => {
    saveDraft(type, id, dataRef.current);
    onSave?.();
  }, [type, id, saveDraft, onSave]);

  useEffect(() => {
    if (!enabled || !id) return;

    const saveInterval = interval || autoSaveInterval;
    intervalRef.current = setInterval(save, saveInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, id, interval, autoSaveInterval, save]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (enabled && id) {
        saveDraft(type, id, dataRef.current);
      }
    };
  }, [enabled, type, id, saveDraft]);

  return {
    save,
    hasDraft: getDraft(type, id) !== null,
    clearDraft: () => deleteDraft(type, id),
  };
}

// ============================================================================
// Draft Recovery Hook
// ============================================================================

interface UseDraftRecoveryOptions<T> {
  type: DraftType;
  id: string;
  onRecover: (data: T) => void;
}

export function useDraftRecovery<T extends Record<string, unknown>>({
  type,
  id,
  onRecover,
}: UseDraftRecoveryOptions<T>) {
  const { getDraft, deleteDraft, hasDraft } = useDraftStore();

  const draft = getDraft<T>(type, id);
  const hasSavedDraft = hasDraft(type, id);

  const recover = useCallback(() => {
    if (draft) {
      onRecover(draft.data);
    }
  }, [draft, onRecover]);

  const discard = useCallback(() => {
    deleteDraft(type, id);
  }, [type, id, deleteDraft]);

  return {
    hasDraft: hasSavedDraft,
    draft,
    recover,
    discard,
  };
}

// ============================================================================
// Selector Hooks
// ============================================================================

export const useProgramDrafts = () => useDraftStore((state) => state.drafts.programs);
export const useArticleDrafts = () => useDraftStore((state) => state.drafts.articles);
export const useSettingsDrafts = () => useDraftStore((state) => state.drafts.settings);
export const useTemplateDrafts = () => useDraftStore((state) => state.drafts.templates);
export const usePromptDrafts = () => useDraftStore((state) => state.drafts.prompts);

export default useDraftStore;
