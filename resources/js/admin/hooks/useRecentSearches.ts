import { useState, useCallback, useEffect } from 'react';

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

interface UseRecentSearchesReturn {
  recentSearches: RecentSearch[];
  addRecentSearch: (query: string, resultCount?: number) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;
}

const STORAGE_KEY = 'content-engine-recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches(): UseRecentSearchesReturn {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }, [recentSearches]);

  const addRecentSearch = useCallback((query: string, resultCount?: number) => {
    if (!query.trim()) return;

    const newSearch: RecentSearch = {
      id: `search-${Date.now()}`,
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };

    setRecentSearches((prev) => {
      // Remove duplicate queries
      const filtered = prev.filter(
        (s) => s.query.toLowerCase() !== query.toLowerCase()
      );
      // Add new search at the beginning and limit to max
      return [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    });
  }, []);

  const removeRecentSearch = useCallback((id: string) => {
    setRecentSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

export default useRecentSearches;
