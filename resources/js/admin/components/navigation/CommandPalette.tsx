/**
 * Command Palette Component (Cmd+K)
 * Global search and quick actions accessible from anywhere
 * 
 * Features:
 * - Fuzzy search across all content
 * - Quick actions
 * - Recent searches
 * - Keyboard navigation
 * - Categories (articles, programs, pages, actions)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/Command';
import {
  FileText,
  Cpu,
  Settings,
  PlusCircle,
  Search,
  Globe,
  Languages,
  BarChart3,
  Eye,
  Pause,
  Play,
  Download,
  RefreshCw,
  AlertTriangle,
  Zap,
  Calendar,
  Users,
  Building2,
  Map,
  Send,
  Clock,
  Star,
  History,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  id: string;
  type: 'article' | 'program' | 'page' | 'action' | 'setting';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  shortcut?: string;
  badge?: string;
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ============================================================================
// Quick Actions Configuration
// ============================================================================

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: 'action-new-program',
    type: 'action',
    title: 'Nouveau programme',
    subtitle: 'Créer un nouveau programme de génération',
    icon: <PlusCircle className="h-4 w-4" />,
    path: '/programs/new',
    shortcut: '⌘⇧N',
  },
  {
    id: 'action-pause-all',
    type: 'action',
    title: 'Pause tout',
    subtitle: 'Mettre en pause tous les programmes actifs',
    icon: <Pause className="h-4 w-4" />,
    action: undefined, // Will be set dynamically
  },
  {
    id: 'action-resume-all',
    type: 'action',
    title: 'Reprendre tout',
    subtitle: 'Reprendre tous les programmes en pause',
    icon: <Play className="h-4 w-4" />,
    action: undefined, // Will be set dynamically
  },
  {
    id: 'action-force-indexing',
    type: 'action',
    title: 'Forcer indexation',
    subtitle: 'Soumettre les articles non indexés à Google',
    icon: <RefreshCw className="h-4 w-4" />,
    action: undefined, // Will be set dynamically
  },
  {
    id: 'action-export-report',
    type: 'action',
    title: 'Exporter rapport',
    subtitle: 'Générer un rapport complet',
    icon: <Download className="h-4 w-4" />,
    path: '/analytics/reports?export=true',
    shortcut: '⌘⇧E',
  },
  {
    id: 'action-retry-failed',
    type: 'action',
    title: 'Relancer échecs',
    subtitle: 'Relancer les traductions/publications échouées',
    icon: <RefreshCw className="h-4 w-4" />,
    action: undefined, // Will be set dynamically
  },
];

// ============================================================================
// Navigation Pages Configuration
// ============================================================================

const NAVIGATION_PAGES: SearchResult[] = [
  // Main
  { id: 'page-dashboard', type: 'page', title: 'Tableau de bord', icon: <BarChart3 className="h-4 w-4" />, path: '/', shortcut: '⌘1' },
  { id: 'page-live', type: 'page', title: 'Suivi en direct', icon: <Eye className="h-4 w-4" />, path: '/live', shortcut: '⌘2' },
  
  // Programs
  { id: 'page-programs', type: 'page', title: 'Programmes', icon: <Cpu className="h-4 w-4" />, path: '/programs/active', shortcut: '⌘3' },
  { id: 'page-programs-new', type: 'page', title: 'Nouveau programme', icon: <PlusCircle className="h-4 w-4" />, path: '/programs/new' },
  { id: 'page-programs-templates', type: 'page', title: 'Templates programmes', icon: <FileText className="h-4 w-4" />, path: '/programs/templates' },
  
  // Content
  { id: 'page-content', type: 'page', title: 'Tous les contenus', icon: <FileText className="h-4 w-4" />, path: '/content', shortcut: '⌘4' },
  { id: 'page-content-pillars', type: 'page', title: 'Articles piliers', icon: <FileText className="h-4 w-4" />, path: '/content/pillars' },
  { id: 'page-content-comparatives', type: 'page', title: 'Comparatifs', icon: <FileText className="h-4 w-4" />, path: '/content/comparatives' },
  
  // Coverage
  { id: 'page-coverage', type: 'page', title: 'Couverture', icon: <Map className="h-4 w-4" />, path: '/coverage', shortcut: '⌘5' },
  { id: 'page-coverage-countries', type: 'page', title: 'Couverture par pays', icon: <Globe className="h-4 w-4" />, path: '/coverage/countries' },
  { id: 'page-coverage-languages', type: 'page', title: 'Couverture par langue', icon: <Languages className="h-4 w-4" />, path: '/coverage/languages' },
  { id: 'page-coverage-matrix', type: 'page', title: 'Matrice complète', icon: <Map className="h-4 w-4" />, path: '/coverage/matrix' },
  { id: 'page-coverage-gaps', type: 'page', title: 'Lacunes à combler', icon: <AlertTriangle className="h-4 w-4" />, path: '/coverage/gaps' },
  
  // Translations
  { id: 'page-translations', type: 'page', title: 'Traductions', icon: <Languages className="h-4 w-4" />, path: '/translations', shortcut: '⌘6' },
  { id: 'page-translations-pending', type: 'page', title: 'Traductions en attente', icon: <Clock className="h-4 w-4" />, path: '/translations/pending' },
  
  // Publishing
  { id: 'page-publishing', type: 'page', title: 'Publications', icon: <Send className="h-4 w-4" />, path: '/publishing', shortcut: '⌘7' },
  { id: 'page-publishing-calendar', type: 'page', title: 'Calendrier publications', icon: <Calendar className="h-4 w-4" />, path: '/publishing/calendar' },
  { id: 'page-publishing-harmony', type: 'page', title: 'Harmonisation', icon: <Zap className="h-4 w-4" />, path: '/publishing/harmony' },
  
  // SEO
  { id: 'page-seo', type: 'page', title: 'SEO & Indexation', icon: <Search className="h-4 w-4" />, path: '/seo', shortcut: '⌘8' },
  { id: 'page-seo-quality', type: 'page', title: 'Qualité SEO', icon: <BarChart3 className="h-4 w-4" />, path: '/seo/quality' },
  { id: 'page-seo-indexing', type: 'page', title: 'Indexation Google', icon: <Globe className="h-4 w-4" />, path: '/seo/indexing' },
  
  // Analytics
  { id: 'page-analytics', type: 'page', title: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, path: '/analytics', shortcut: '⌘9' },
  { id: 'page-analytics-daily', type: 'page', title: 'Stats quotidiennes', icon: <Calendar className="h-4 w-4" />, path: '/analytics/daily' },
  { id: 'page-analytics-reports', type: 'page', title: 'Rapports', icon: <FileText className="h-4 w-4" />, path: '/analytics/reports' },
  
  // Settings
  { id: 'page-settings', type: 'page', title: 'Paramètres', icon: <Settings className="h-4 w-4" />, path: '/settings', shortcut: '⌘,' },
  { id: 'page-settings-automation', type: 'page', title: 'Automatisation', icon: <Zap className="h-4 w-4" />, path: '/settings/automation' },
  { id: 'page-settings-platforms', type: 'page', title: 'Plateformes', icon: <Building2 className="h-4 w-4" />, path: '/settings/platforms' },
  { id: 'page-settings-api', type: 'page', title: 'Clés API', icon: <Settings className="h-4 w-4" />, path: '/settings/api' },
  
  // Admin
  { id: 'page-admin-users', type: 'page', title: 'Utilisateurs', icon: <Users className="h-4 w-4" />, path: '/users' },
  { id: 'page-admin-activity', type: 'page', title: 'Activité système', icon: <Eye className="h-4 w-4" />, path: '/activity' },
];

// ============================================================================
// Search API
// ============================================================================

async function searchContent(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.results.map((item: { type: string; id: number; title: string; subtitle?: string; platform?: string; path: string; badge?: string }) => ({
      id: `search-${item.type}-${item.id}`,
      type: item.type as SearchResult['type'],
      title: item.title,
      subtitle: item.subtitle || `${item.type} • ${item.platform || 'Global'}`,
      icon: item.type === 'article' ? <FileText className="h-4 w-4" /> : <Cpu className="h-4 w-4" />,
      path: item.path,
      badge: item.badge,
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const api = useApi();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const { favorites } = useFavorites();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

  // Handle open change
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setQuery('');
      setSearchResults([]);
    }
  }, [onOpenChange]);

  // API-powered quick actions
  const executeApiAction = useCallback(async (actionType: string) => {
    setIsExecuting(true);
    try {
      switch (actionType) {
        case 'pause-all':
          await api.post('/programs/pause-all');
          toast({ title: 'Succès', description: 'Tous les programmes ont été mis en pause' });
          break;
        case 'resume-all':
          await api.post('/programs/resume-all');
          toast({ title: 'Succès', description: 'Tous les programmes ont été repris' });
          break;
        case 'force-indexing':
          await api.post('/indexing-queue/bulk-submit');
          toast({ title: 'Succès', description: 'Demande d\'indexation soumise' });
          break;
        case 'retry-failed':
          await api.post('/queue/retry-all-failed');
          toast({ title: 'Succès', description: 'Relance des tâches échouées en cours' });
          break;
        default:
          console.warn(`Unknown action: ${actionType}`);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: `L'action a échoué: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
      handleOpenChange(false);
    }
  }, [api, toast, handleOpenChange]);

  // Sync with prop
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Global keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenChange(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleOpenChange]);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsSearching(true);
      searchContent(debouncedQuery)
        .then(setSearchResults)
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  // Filter pages based on query
  const filteredPages = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return NAVIGATION_PAGES.filter(
      (page) =>
        page.title.toLowerCase().includes(lowerQuery) ||
        page.subtitle?.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  }, [query]);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query) return QUICK_ACTIONS;
    const lowerQuery = query.toLowerCase();
    return QUICK_ACTIONS.filter(
      (action) =>
        action.title.toLowerCase().includes(lowerQuery) ||
        action.subtitle?.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    if (result.path) {
      navigate(result.path);
      addRecentSearch(result);
      handleOpenChange(false);
    } else if (result.action) {
      result.action();
      handleOpenChange(false);
    } else {
      // Handle dynamic API actions based on ID
      const actionMap: Record<string, string> = {
        'action-pause-all': 'pause-all',
        'action-resume-all': 'resume-all',
        'action-force-indexing': 'force-indexing',
        'action-retry-failed': 'retry-failed',
      };
      const apiAction = actionMap[result.id];
      if (apiAction) {
        executeApiAction(apiAction);
      }
    }
  }, [navigate, handleOpenChange, addRecentSearch, executeApiAction]);

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Rechercher partout..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Recherche en cours...
              </div>
            ) : (
              <div className="py-6 text-center text-sm">
                Aucun résultat trouvé.
              </div>
            )}
          </CommandEmpty>

          {/* Favorites */}
          {!query && favorites.length > 0 && (
            <CommandGroup heading="⭐ Favoris">
              {favorites.map((fav) => (
                <CommandItem
                  key={fav.id}
                  value={fav.id}
                  onSelect={() => handleSelect(fav)}
                >
                  {fav.icon}
                  <span className="ml-2">{fav.title}</span>
                  {fav.shortcut && <CommandShortcut>{fav.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <CommandGroup heading="🕐 Récent">
              {recentSearches.slice(0, 5).map((recent) => (
                <CommandItem
                  key={recent.id}
                  value={`recent-${recent.id}`}
                  onSelect={() => handleSelect(recent)}
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="ml-2">{recent.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{recent.subtitle}</span>
                </CommandItem>
              ))}
              <CommandItem onSelect={() => clearRecentSearches()} className="text-muted-foreground">
                <span className="text-xs">Effacer l'historique</span>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <CommandGroup heading="🔍 Résultats">
              {searchResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result)}
                >
                  {result.icon}
                  <div className="ml-2 flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    )}
                  </div>
                  {result.badge && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {result.badge}
                    </span>
                  )}
                  <ArrowRight className="ml-2 h-3 w-3 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Pages */}
          {filteredPages.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="📄 Pages">
                {filteredPages.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={page.id}
                    onSelect={() => handleSelect(page)}
                  >
                    {page.icon}
                    <span className="ml-2">{page.title}</span>
                    {page.shortcut && <CommandShortcut>{page.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="⚡ Actions rapides">
                {filteredActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleSelect(action)}
                  >
                    {action.icon}
                    <div className="ml-2 flex flex-col">
                      <span>{action.title}</span>
                      {action.subtitle && (
                        <span className="text-xs text-muted-foreground">{action.subtitle}</span>
                      )}
                    </div>
                    {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Help */}
          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading="💡 Aide">
                <CommandItem disabled className="text-muted-foreground text-xs">
                  <span>Tapez pour rechercher • ↑↓ pour naviguer • ↵ pour sélectionner • Esc pour fermer</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export default CommandPalette;
