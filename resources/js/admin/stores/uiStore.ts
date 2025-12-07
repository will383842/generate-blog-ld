import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
}

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  modals: Modal[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

type UIStore = UIState & UIActions;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
  modals: []
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      setTheme: (theme: Theme) => {
        set({ theme });

        // Apply to document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(theme);
        }
      },

      openModal: (modal: Omit<Modal, 'id'>) => {
        const id = generateId();
        set(state => ({
          modals: [...state.modals, { ...modal, id }]
        }));
        return id;
      },

      closeModal: (id: string) => {
        set(state => ({
          modals: state.modals.filter(m => m.id !== id)
        }));
      },

      closeAllModals: () => {
        set({ modals: [] });
      }
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme
      })
    }
  )
);

// Note: useToast is now in hooks/useToast.ts - use that instead

export const useModal = () => {
  const { openModal, closeModal, closeAllModals, modals } = useUIStore();
  
  return {
    open: openModal,
    close: closeModal,
    closeAll: closeAllModals,
    modals,
    isOpen: (id: string) => modals.some(m => m.id === id)
  };
};