import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/utils/api';
import { PLATFORMS, API_ENDPOINTS } from '@/utils/constants';
import type { Platform } from '@/types/common';

interface PlatformState {
  platforms: Platform[];
  activePlatform: Platform | null;
  isLoading: boolean;
  error: string | null;
}

interface PlatformActions {
  setPlatform: (platformId: string) => void;
  loadPlatforms: () => Promise<void>;
  clearError: () => void;
}

type PlatformStore = PlatformState & PlatformActions;

const defaultPlatform: Platform = {
  id: PLATFORMS[0].id,
  name: PLATFORMS[0].name,
  slug: PLATFORMS[0].slug,
  url: PLATFORMS[0].url,
  logo: PLATFORMS[0].logo,
  color: PLATFORMS[0].color,
  description: PLATFORMS[0].description
};

const initialState: PlatformState = {
  platforms: PLATFORMS.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    url: p.url,
    logo: p.logo,
    color: p.color,
    description: p.description
  })),
  activePlatform: defaultPlatform,
  isLoading: false,
  error: null
};

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlatform: (platformId: string) => {
        const { platforms } = get();
        const platform = platforms.find(p => p.id === platformId);
        
        if (platform) {
          set({ activePlatform: platform });
          localStorage.setItem('current_platform', platformId);
        }
      },

      loadPlatforms: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<{ platforms: Platform[] }>(
            API_ENDPOINTS.publishing.platforms
          );
          
          const { platforms } = response.data;
          const { activePlatform } = get();
          
          // Keep active platform or default to first
          const newActivePlatform = platforms.find(p => p.id === activePlatform?.id) || platforms[0];
          
          set({
            platforms,
            activePlatform: newActivePlatform,
            isLoading: false
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Erreur de chargement';
          set({ isLoading: false, error: message });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'platform-storage',
      partialize: (state) => ({
        activePlatform: state.activePlatform
      })
    }
  )
);