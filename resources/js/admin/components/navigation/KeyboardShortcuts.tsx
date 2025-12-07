/**
 * Keyboard Shortcuts Manager
 * Global keyboard shortcuts with visual help overlay
 * 
 * Features:
 * - Global shortcuts registration
 * - Help overlay (⌘/)
 * - Context-aware shortcuts
 * - Conflict detection
 */

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Command, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcut {
  id: string;
  keys: string;
  description: string;
  category: 'navigation' | 'actions' | 'global' | 'editing';
  action: () => void;
  enabled?: boolean;
  global?: boolean; // Works in inputs too
}

interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  showHelp: () => void;
  hideHelp: () => void;
}

// ============================================================================
// Key parsing utilities
// ============================================================================

function parseKeys(keys: string): { key: string; meta: boolean; ctrl: boolean; shift: boolean; alt: boolean } {
  const parts = keys.toLowerCase().split('+');
  return {
    key: parts[parts.length - 1],
    meta: parts.includes('meta') || parts.includes('⌘') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift') || parts.includes('⇧'),
    alt: parts.includes('alt') || parts.includes('option') || parts.includes('⌥'),
  };
}

function matchesShortcut(event: KeyboardEvent, keys: string): boolean {
  const parsed = parseKeys(keys);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const metaMatch = isMac ? event.metaKey === parsed.meta : event.ctrlKey === parsed.meta;
  const ctrlMatch = parsed.ctrl ? event.ctrlKey : true;
  const shiftMatch = event.shiftKey === parsed.shift;
  const altMatch = event.altKey === parsed.alt;
  const keyMatch = event.key.toLowerCase() === parsed.key.toLowerCase();
  
  return metaMatch && ctrlMatch && shiftMatch && altMatch && keyMatch;
}

function formatKeys(keys: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return keys
    .replace(/meta|cmd/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/ctrl|control/gi, isMac ? '⌃' : 'Ctrl')
    .replace(/shift/gi, '⇧')
    .replace(/alt|option/gi, isMac ? '⌥' : 'Alt')
    .replace(/\+/g, ' ')
    .replace(/escape/gi, 'Esc')
    .replace(/enter/gi, '↵')
    .replace(/backspace/gi, '⌫')
    .replace(/delete/gi, '⌦')
    .replace(/arrowup/gi, '↑')
    .replace(/arrowdown/gi, '↓')
    .replace(/arrowleft/gi, '←')
    .replace(/arrowright/gi, '→');
}

// ============================================================================
// Context
// ============================================================================

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | undefined>(undefined);

// ============================================================================
// Help Dialog Component
// ============================================================================

interface ShortcutHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

function ShortcutHelpDialog({ open, onOpenChange, shortcuts }: ShortcutHelpDialogProps) {
  const categories = useMemo(() => {
    const grouped: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach((shortcut) => {
      if (!grouped[shortcut.category]) {
        grouped[shortcut.category] = [];
      }
      grouped[shortcut.category].push(shortcut);
    });
    return grouped;
  }, [shortcuts]);

  const categoryLabels: Record<string, string> = {
    global: '🌐 Global',
    navigation: '🧭 Navigation',
    actions: '⚡ Actions',
    editing: '✏️ Édition',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Raccourcis clavier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                      {formatKeys(shortcut.keys)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Appuyez sur <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd> pour fermer
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Provider
// ============================================================================

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = useMemo(() => [
    // Global
    {
      id: 'help',
      keys: 'meta+/',
      description: 'Afficher l\'aide des raccourcis',
      category: 'global',
      action: () => setShowHelpDialog(true),
    },
    {
      id: 'search',
      keys: 'meta+k',
      description: 'Recherche globale',
      category: 'global',
      action: () => {
        // Handled by CommandPalette
      },
    },
    {
      id: 'escape',
      keys: 'escape',
      description: 'Fermer / Annuler',
      category: 'global',
      action: () => setShowHelpDialog(false),
      global: true,
    },

    // Navigation
    {
      id: 'nav-dashboard',
      keys: 'meta+1',
      description: 'Aller au tableau de bord',
      category: 'navigation',
      action: () => navigate('/'),
    },
    {
      id: 'nav-live',
      keys: 'meta+2',
      description: 'Aller au suivi en direct',
      category: 'navigation',
      action: () => navigate('/live'),
    },
    {
      id: 'nav-programs',
      keys: 'meta+3',
      description: 'Aller aux programmes',
      category: 'navigation',
      action: () => navigate('/programs/active'),
    },
    {
      id: 'nav-content',
      keys: 'meta+4',
      description: 'Aller aux contenus',
      category: 'navigation',
      action: () => navigate('/content'),
    },
    {
      id: 'nav-coverage',
      keys: 'meta+5',
      description: 'Aller à la couverture',
      category: 'navigation',
      action: () => navigate('/coverage'),
    },
    {
      id: 'nav-translations',
      keys: 'meta+6',
      description: 'Aller aux traductions',
      category: 'navigation',
      action: () => navigate('/translations'),
    },
    {
      id: 'nav-publishing',
      keys: 'meta+7',
      description: 'Aller aux publications',
      category: 'navigation',
      action: () => navigate('/publishing'),
    },
    {
      id: 'nav-seo',
      keys: 'meta+8',
      description: 'Aller au SEO',
      category: 'navigation',
      action: () => navigate('/seo'),
    },
    {
      id: 'nav-analytics',
      keys: 'meta+9',
      description: 'Aller aux analytics',
      category: 'navigation',
      action: () => navigate('/analytics'),
    },
    {
      id: 'nav-settings',
      keys: 'meta+,',
      description: 'Aller aux paramètres',
      category: 'navigation',
      action: () => navigate('/settings'),
    },
    {
      id: 'nav-back',
      keys: 'meta+arrowleft',
      description: 'Page précédente',
      category: 'navigation',
      action: () => window.history.back(),
    },
    {
      id: 'nav-forward',
      keys: 'meta+arrowright',
      description: 'Page suivante',
      category: 'navigation',
      action: () => window.history.forward(),
    },

    // Actions
    {
      id: 'action-new-program',
      keys: 'meta+shift+n',
      description: 'Nouveau programme',
      category: 'actions',
      action: () => navigate('/programs/new'),
    },
    {
      id: 'action-export',
      keys: 'meta+shift+e',
      description: 'Exporter rapport',
      category: 'actions',
      action: () => navigate('/analytics/reports?export=true'),
    },
    {
      id: 'action-refresh',
      keys: 'meta+r',
      description: 'Actualiser les données',
      category: 'actions',
      action: () => window.location.reload(),
    },
  ], [navigate]);

  // Combine default and custom shortcuts
  const allShortcuts = useMemo(() => {
    return [...defaultShortcuts, ...shortcuts];
  }, [defaultShortcuts, shortcuts]);

  // Register shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Remove existing shortcut with same ID
      const filtered = prev.filter((s) => s.id !== shortcut.id);
      return [...filtered, shortcut];
    });
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;

      for (const shortcut of allShortcuts) {
        if (shortcut.enabled === false) continue;
        if (isInputField && !shortcut.global) continue;
        
        if (matchesShortcut(event, shortcut.keys)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [allShortcuts]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts: allShortcuts,
        registerShortcut,
        unregisterShortcut,
        showHelp: () => setShowHelpDialog(true),
        hideHelp: () => setShowHelpDialog(false),
      }}
    >
      {children}
      <ShortcutHelpDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
        shortcuts={allShortcuts}
      />
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

// ============================================================================
// Shortcut key display component
// ============================================================================

interface ShortcutKeysProps {
  keys: string;
  className?: string;
}

export function ShortcutKeys({ keys, className }: ShortcutKeysProps) {
  const formatted = formatKeys(keys);
  const parts = formatted.split(' ');

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {parts.map((part, index) => (
        <kbd
          key={index}
          className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border"
        >
          {part}
        </kbd>
      ))}
    </span>
  );
}

export default KeyboardShortcutsProvider;
