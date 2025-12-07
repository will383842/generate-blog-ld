/**
 * Utility Hooks
 * Common utility hooks used throughout the application
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ============================================================================
// useDebounce
// ============================================================================

/**
 * Debounce a value
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// usePersistedState
// ============================================================================

/**
 * useState that persists to localStorage
 * @param key The localStorage key
 * @param defaultValue The default value
 * @returns [state, setState] tuple
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setState(JSON.parse(event.newValue));
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [state, setState];
}

// ============================================================================
// useFavorites
// ============================================================================

interface FavoriteItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  path?: string;
  shortcut?: string;
  addedAt: number;
}

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  clearFavorites: () => void;
  reorderFavorites: (startIndex: number, endIndex: number) => void;
}

const MAX_FAVORITES = 10;

/**
 * Manage user favorites with localStorage persistence
 */
export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = usePersistedState<FavoriteItem[]>('ce-favorites', []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      // Don't add duplicates
      if (prev.some((f) => f.id === item.id)) return prev;
      
      // Add to beginning, limit to MAX_FAVORITES
      const newFavorites = [{ ...item, addedAt: Date.now() }, ...prev];
      return newFavorites.slice(0, MAX_FAVORITES);
    });
  }, [setFavorites]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, [setFavorites]);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((f) => f.id === id);
  }, [favorites]);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, [setFavorites]);

  const reorderFavorites = useCallback((startIndex: number, endIndex: number) => {
    setFavorites((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, [setFavorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    reorderFavorites,
  };
}

// ============================================================================
// useRecentSearches
// ============================================================================

interface RecentSearchItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  path?: string;
  searchedAt: number;
}

interface UseRecentSearchesReturn {
  recentSearches: RecentSearchItem[];
  addRecentSearch: (item: Omit<RecentSearchItem, 'searchedAt'>) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;
}

const MAX_RECENT_SEARCHES = 20;
const RECENT_SEARCH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Manage recent searches with localStorage persistence
 */
export function useRecentSearches(): UseRecentSearchesReturn {
  const [recentSearches, setRecentSearches] = usePersistedState<RecentSearchItem[]>(
    'ce-recent-searches',
    []
  );

  // Clean up old searches on mount
  useEffect(() => {
    const now = Date.now();
    setRecentSearches((prev) => 
      prev.filter((item) => now - item.searchedAt < RECENT_SEARCH_TTL)
    );
  }, [setRecentSearches]);

  const addRecentSearch = useCallback((item: Omit<RecentSearchItem, 'searchedAt'>) => {
    setRecentSearches((prev) => {
      // Remove existing entry with same ID
      const filtered = prev.filter((s) => s.id !== item.id);
      
      // Add to beginning
      const newSearches = [{ ...item, searchedAt: Date.now() }, ...filtered];
      
      // Limit to MAX_RECENT_SEARCHES
      return newSearches.slice(0, MAX_RECENT_SEARCHES);
    });
  }, [setRecentSearches]);

  const removeRecentSearch = useCallback((id: string) => {
    setRecentSearches((prev) => prev.filter((s) => s.id !== id));
  }, [setRecentSearches]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

// ============================================================================
// useLocalStorage (simpler version)
// ============================================================================

/**
 * Simple localStorage hook
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// ============================================================================
// useSidebarState
// ============================================================================

interface SidebarState {
  isCollapsed: boolean;
  openSections: string[];
  currentPlatform: string;
}

const DEFAULT_SIDEBAR_STATE: SidebarState = {
  isCollapsed: false,
  openSections: ['live'],
  currentPlatform: 'all',
};

/**
 * Persist sidebar state
 */
export function useSidebarState() {
  const [state, setState] = usePersistedState<SidebarState>('ce-sidebar', DEFAULT_SIDEBAR_STATE);

  const setCollapsed = useCallback((isCollapsed: boolean) => {
    setState((prev) => ({ ...prev, isCollapsed }));
  }, [setState]);

  const toggleSection = useCallback((sectionId: string) => {
    setState((prev) => {
      const isOpen = prev.openSections.includes(sectionId);
      return {
        ...prev,
        openSections: isOpen
          ? prev.openSections.filter((id) => id !== sectionId)
          : [...prev.openSections, sectionId],
      };
    });
  }, [setState]);

  const setPlatform = useCallback((platform: string) => {
    setState((prev) => ({ ...prev, currentPlatform: platform }));
  }, [setState]);

  return {
    ...state,
    setCollapsed,
    toggleSection,
    setPlatform,
  };
}

// ============================================================================
// useMediaQuery
// ============================================================================

/**
 * React hook for matching media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ============================================================================
// useIsMobile
// ============================================================================

/**
 * Check if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

// ============================================================================
// useIsTablet
// ============================================================================

/**
 * Check if viewport is tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

// ============================================================================
// useIsDesktop
// ============================================================================

/**
 * Check if viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

// ============================================================================
// useOnlineStatus
// ============================================================================

/**
 * Track online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================================================
// usePrevious
// ============================================================================

/**
 * Get the previous value of a state
 * Uses useRef to avoid unnecessary re-renders
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// ============================================================================
// useClickOutside
// ============================================================================

/**
 * Detect clicks outside of an element
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = React.useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

export default {
  useDebounce,
  usePersistedState,
  useFavorites,
  useRecentSearches,
  useLocalStorage,
  useSidebarState,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useOnlineStatus,
  usePrevious,
  useClickOutside,
};
