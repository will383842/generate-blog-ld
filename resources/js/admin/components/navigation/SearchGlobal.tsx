import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, FileText, Cog, Settings, X, Clock, ArrowRight, Command, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

type ResultType = 'article' | 'program' | 'page' | 'action';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  description?: string;
  path: string;
  icon?: React.ElementType;
}

interface SearchGroup {
  label: string;
  results: SearchResult[];
}

interface SearchGlobalProps {
  onSearch?: (query: string) => Promise<SearchGroup[]>;
}

const QUICK_ACTIONS: SearchResult[] = [
  { id: 'new-program', type: 'action', title: 'Nouveau programme', path: '/programs/create', icon: Cog },
  { id: 'generate', type: 'action', title: 'Générer du contenu', path: '/generation/wizard', icon: FileText },
  { id: 'settings', type: 'action', title: 'Paramètres', path: '/settings', icon: Settings }
];

const STORAGE_KEY = 'search_global_recent';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const recent = getRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Ignore
  }
}

async function defaultSearch(query: string): Promise<SearchGroup[]> {
  // Production: Replace with actual API call
  // return api.get('/admin/search', { params: { q: query } });
  
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  
  const data = await response.json();
  const groups: SearchGroup[] = [];

  if (data.articles?.length) {
    groups.push({
      label: 'Articles',
      results: data.articles.map((a: { id: number; title: string; status: string }) => ({
        id: `article-${a.id}`,
        type: 'article' as const,
        title: a.title,
        description: a.status,
        path: `/content/articles/${a.id}`
      }))
    });
  }

  if (data.programs?.length) {
    groups.push({
      label: 'Programmes',
      results: data.programs.map((p: { id: number; name: string; status: string }) => ({
        id: `program-${p.id}`,
        type: 'program' as const,
        title: p.name,
        description: p.status,
        path: `/programs/${p.id}`
      }))
    });
  }

  return groups;
}

export function SearchGlobal({ onSearch = defaultSearch }: SearchGlobalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchGroup[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load recent on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setRecentSearches(getRecentSearches());
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await onSearch(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const allResults = useCallback(() => results.flatMap(g => g.results), [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? allResults() : QUICK_ACTIONS;
    const total = items.length;
    if (!total) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % total);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + total) % total);
        break;
      case 'Enter':
        e.preventDefault();
        if (items[selectedIndex]) handleSelect(items[selectedIndex]);
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (query.trim()) saveRecentSearch(query.trim());
    navigate(result.path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center w-full max-w-md px-3 py-2 text-sm text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
      >
        <Search size={18} className="mr-2 text-slate-400" />
        <span className="flex-1 text-left">{t('navigation.header.search')}</span>
        <kbd className="hidden md:flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-white rounded border border-slate-200">
          <Command size={12} />K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('navigation.header.search')}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center px-4 border-b border-slate-200">
            {isLoading ? <Loader2 size={20} className="text-slate-400 animate-spin" /> : <Search size={20} className="text-slate-400" />}
            <Input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={t('navigation.header.search')}
              className="flex-1 h-14 border-0 focus-visible:ring-0 text-base"
            />
            {query && (
              <Button variant="ghost" size="icon" onClick={() => setQuery('')} className="text-slate-400">
                <X size={18} />
              </Button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {!query ? (
              <>
                <div className="p-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase">
                    {t('dashboard.widgets.quickActions.title')}
                  </div>
                  {QUICK_ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleSelect(action)}
                        className={cn(
                          'flex items-center w-full px-3 py-2 rounded-md text-left',
                          selectedIndex === i ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
                        )}
                      >
                        {Icon && <Icon size={18} className="mr-3 text-slate-400" />}
                        <span className="flex-1">{action.title}</span>
                        <ArrowRight size={14} className="text-slate-400" />
                      </button>
                    );
                  })}
                </div>
                {recentSearches.length > 0 && (
                  <div className="p-2 border-t border-slate-100">
                    <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase">
                      Recherches récentes
                    </div>
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(s)}
                        className="flex items-center w-full px-3 py-2 rounded-md text-left hover:bg-slate-100"
                      >
                        <Clock size={16} className="mr-3 text-slate-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
                {t('common.states.loading')}
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-slate-500">{t('common.messages.noResults')}</div>
            ) : (
              results.map((group, gi) => {
                const startIdx = results.slice(0, gi).reduce((a, g) => a + g.results.length, 0);
                return (
                  <div key={group.label} className="p-2">
                    <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase">{group.label}</div>
                    {group.results.map((r, ri) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r)}
                        className={cn(
                          'flex items-center w-full px-3 py-2 rounded-md text-left',
                          selectedIndex === startIdx + ri ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
                        )}
                      >
                        <FileText size={18} className="mr-3 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{r.title}</div>
                          {r.description && <div className="text-xs text-slate-500 truncate">{r.description}</div>}
                        </div>
                        <ArrowRight size={14} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd> naviguer</span>
            <span><kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd> sélectionner</span>
            <span><kbd className="px-1.5 py-0.5 bg-white rounded border">esc</kbd> fermer</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}