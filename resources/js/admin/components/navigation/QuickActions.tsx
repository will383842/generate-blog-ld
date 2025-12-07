/**
 * Quick Actions Component (FAB)
 * Floating action button with quick access to common actions
 * 
 * Features:
 * - Always visible floating button
 * - Expandable menu
 * - Context-aware actions
 * - Keyboard shortcuts
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Cpu,
  FileText,
  Pause,
  Play,
  RefreshCw,
  Download,
  Upload,
  Send,
  Globe,
  Zap,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/utils/api';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useToast } from '@/hooks/useToast';

// ============================================================================
// Types
// ============================================================================

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  shortcut?: string;
  badge?: number;
  disabled?: boolean;
  hidden?: boolean;
}

interface QuickActionsProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

// ============================================================================
// Main Component
// ============================================================================

export function QuickActions({ 
  className, 
  position = 'bottom-right' 
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { data: stats } = useGlobalStats();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Define actions
  const actions: QuickAction[] = [
    {
      id: 'new-program',
      label: 'Nouveau programme',
      icon: <Cpu className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      shortcut: '⌘⇧N',
      action: () => {
        navigate('/programs/new');
        setIsOpen(false);
      },
    },
    {
      id: 'new-article',
      label: 'Nouvel article manuel',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        navigate('/content/manual/new');
        setIsOpen(false);
      },
    },
    {
      id: 'pause-all',
      label: 'Pause tout',
      icon: <Pause className="h-5 w-5" />,
      color: 'bg-amber-500 hover:bg-amber-600',
      action: async () => {
        try {
          await api.post('/admin/programs/pause-all');
          toast({
            title: 'Programmes en pause',
            description: 'Tous les programmes ont été mis en pause.',
          });
        } catch {
          toast({
            title: 'Erreur',
            description: 'Impossible de mettre en pause les programmes.',
            variant: 'destructive',
          });
        }
        setIsOpen(false);
      },
      hidden: !stats?.programs?.active,
    },
    {
      id: 'resume-all',
      label: 'Reprendre tout',
      icon: <Play className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: async () => {
        try {
          await api.post('/admin/programs/resume-all');
          toast({
            title: 'Programmes repris',
            description: 'Tous les programmes ont été repris.',
          });
        } catch {
          toast({
            title: 'Erreur',
            description: 'Impossible de reprendre les programmes.',
            variant: 'destructive',
          });
        }
        setIsOpen(false);
      },
      hidden: true, // Show only when programs are paused
    },
    {
      id: 'force-publish',
      label: 'Publier maintenant',
      icon: <Send className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      badge: stats?.publishing?.pending,
      action: async () => {
        try {
          await api.post('/admin/publishing/force');
          toast({
            title: 'Publication lancée',
            description: 'Les articles en attente sont en cours de publication.',
          });
        } catch {
          toast({
            title: 'Erreur',
            description: 'Impossible de lancer la publication.',
            variant: 'destructive',
          });
        }
        setIsOpen(false);
      },
      hidden: !stats?.publishing?.pending,
    },
    {
      id: 'force-indexing',
      label: 'Indexer maintenant',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      badge: stats?.indexing?.notIndexed,
      action: async () => {
        try {
          await api.post('/admin/indexing/force');
          toast({
            title: 'Indexation lancée',
            description: 'Les articles sont soumis à Google.',
          });
        } catch {
          toast({
            title: 'Erreur',
            description: 'Impossible de lancer l\'indexation.',
            variant: 'destructive',
          });
        }
        setIsOpen(false);
      },
      hidden: !stats?.indexing?.notIndexed,
    },
    {
      id: 'retry-failed',
      label: 'Relancer les échecs',
      icon: <RefreshCw className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: async () => {
        try {
          await api.post('/admin/jobs/retry-failed');
          toast({
            title: 'Relance en cours',
            description: 'Les tâches échouées sont relancées.',
          });
        } catch {
          toast({
            title: 'Erreur',
            description: 'Impossible de relancer les tâches.',
            variant: 'destructive',
          });
        }
        setIsOpen(false);
      },
    },
    {
      id: 'export-report',
      label: 'Exporter rapport',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      shortcut: '⌘⇧E',
      action: () => {
        navigate('/analytics/reports?export=true');
        setIsOpen(false);
      },
    },
    {
      id: 'search',
      label: 'Rechercher',
      icon: <Search className="h-5 w-5" />,
      color: 'bg-gray-700 hover:bg-gray-800',
      shortcut: '⌘K',
      action: () => {
        // Trigger command palette
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
        }));
        setIsOpen(false);
      },
    },
  ];

  // Filter visible actions
  const visibleActions = actions.filter((action) => !action.hidden);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }[position];

  // Animation origin
  const originClasses = {
    'bottom-right': 'origin-bottom-right',
    'bottom-left': 'origin-bottom-left',
    'top-right': 'origin-top-right',
    'top-left': 'origin-top-left',
  }[position];

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('fixed z-50', positionClasses, className)}>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Action buttons */}
        <div
          className={cn(
            'flex flex-col-reverse gap-3 mb-3 transition-all duration-200',
            originClasses,
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          )}
        >
          {visibleActions.map((action, index) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  onClick={action.action}
                  disabled={action.disabled}
                  className={cn(
                    'h-12 w-12 rounded-full shadow-lg text-white relative',
                    'transform transition-all duration-200',
                    action.color,
                    isOpen && `delay-[${index * 50}ms]`
                  )}
                  style={{
                    transitionDelay: isOpen ? `${index * 30}ms` : '0ms',
                  }}
                >
                  {action.icon}
                  {action.badge !== undefined && action.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {action.badge > 99 ? '99+' : action.badge}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="flex items-center gap-2">
                {action.label}
                {action.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">
                    {action.shortcut}
                  </kbd>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Main FAB button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                isOpen && 'rotate-45 bg-gray-700 hover:bg-gray-800'
              )}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isOpen ? 'Fermer' : 'Actions rapides'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default QuickActions;
