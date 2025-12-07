/**
 * Breadcrumbs Component
 * Shows navigation path and allows easy navigation back
 * 
 * Features:
 * - Auto-generated from route
 * - Custom labels
 * - Collapsible on mobile
 * - Copy path to clipboard
 */

import React, { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

// ============================================================================
// Types
// ============================================================================

interface BreadcrumbConfig {
  label: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  className?: string;
  maxItems?: number;
  customLabels?: Record<string, string>;
  showHome?: boolean;
  showCopyButton?: boolean;
}

// ============================================================================
// Route Labels Configuration
// ============================================================================

const ROUTE_LABELS: Record<string, BreadcrumbConfig> = {
  // Main sections
  '': { label: 'Tableau de bord' },
  'live': { label: 'Suivi en direct' },
  'programs': { label: 'Programmes' },
  'content': { label: 'Contenus' },
  'coverage': { label: 'Couverture' },
  'translations': { label: 'Traductions' },
  'publishing': { label: 'Publications' },
  'seo': { label: 'SEO & Indexation' },
  'analytics': { label: 'Analytics' },
  'settings': { label: 'Paramètres' },
  'admin': { label: 'Administration' },
  
  // Live sub-pages
  'generation': { label: 'Génération' },
  'translation': { label: 'Traductions' },
  'indexing': { label: 'Indexation' },
  'alerts': { label: 'Alertes' },
  
  // Programs sub-pages
  'new': { label: 'Nouveau' },
  'active': { label: 'Actifs' },
  'paused': { label: 'En pause' },
  'completed': { label: 'Terminés' },
  'templates': { label: 'Templates' },
  
  // Content sub-pages
  'articles': { label: 'Articles' },
  'pillars': { label: 'Articles piliers' },
  'comparatives': { label: 'Comparatifs' },
  'manual': { label: 'Titres manuels' },
  'press-releases': { label: 'Communiqués' },
  'press-kits': { label: 'Dossiers de presse' },
  'landing': { label: 'Landing pages' },
  'media': { label: 'Médias' },
  
  // Coverage sub-pages
  'platforms': { label: 'Par plateforme' },
  'countries': { label: 'Par pays' },
  'languages': { label: 'Par langue' },
  'specialties': { label: 'Par spécialité' },
  'objectives': { label: 'Par objectif' },
  'matrix': { label: 'Matrice' },
  'gaps': { label: 'Lacunes' },
  
  // Translations sub-pages
  'by-article': { label: 'Par article' },
  'by-language': { label: 'Par langue' },
  'by-country': { label: 'Par pays' },
  'pending': { label: 'En attente' },
  'excluded': { label: 'Non traduisibles' },
  
  // Publishing sub-pages
  'by-platform': { label: 'Par plateforme' },
  'auto-queue': { label: 'Queue automatique' },
  'calendar': { label: 'Calendrier' },
  'harmony': { label: 'Harmonisation' },
  'history': { label: 'Historique' },
  
  // SEO sub-pages
  'quality': { label: 'Qualité' },
  'performance': { label: 'Performance' },
  'keywords': { label: 'Mots-clés' },
  
  // Analytics sub-pages
  'daily': { label: 'Quotidien' },
  'trends': { label: 'Tendances' },
  'reports': { label: 'Rapports' },
  
  // Settings sub-pages
  'general': { label: 'Général' },
  'automation': { label: 'Automatisation' },
  'targets': { label: 'Cibles' },
  'api': { label: 'Clés API' },
  'webhooks': { label: 'Webhooks' },
  'notifications': { label: 'Notifications' },
  
  // Admin sub-pages
  'users': { label: 'Utilisateurs' },
  'roles': { label: 'Rôles' },
  'activity': { label: 'Activité' },
  'workers': { label: 'Workers' },
  'queues': { label: 'Queues' },
  'logs': { label: 'Logs' },
  'errors': { label: 'Erreurs' },
  'backups': { label: 'Sauvegardes' },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getLabel(segment: string, customLabels?: Record<string, string>): string {
  // Check custom labels first
  if (customLabels?.[segment]) {
    return customLabels[segment];
  }
  
  // Check predefined labels
  if (ROUTE_LABELS[segment]) {
    return ROUTE_LABELS[segment].label;
  }
  
  // Check if it's a UUID or ID (don't display raw)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return 'Détail';
  }
  
  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }
  
  // Capitalize first letter and replace dashes with spaces
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildPath(segments: string[], index: number): string {
  return '/' + segments.slice(0, index + 1).join('/');
}

// ============================================================================
// Main Component
// ============================================================================

export function Breadcrumbs({
  className,
  maxItems = 4,
  customLabels,
  showHome = true,
  showCopyButton = true,
}: BreadcrumbsProps) {
  const location = useLocation();
  const [copied, setCopied] = React.useState(false);
  
  // Parse path into segments
  const segments = useMemo(() => {
    const path = location.pathname;
    return path.split('/').filter(Boolean);
  }, [location.pathname]);

  // Build breadcrumb items
  const items = useMemo(() => {
    return segments.map((segment, index) => ({
      label: getLabel(segment, customLabels),
      path: buildPath(segments, index),
      isLast: index === segments.length - 1,
    }));
  }, [segments, customLabels]);

  // Handle copy path
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Don't show breadcrumbs on home page
  if (segments.length === 0) {
    return null;
  }

  // Determine if we need to collapse
  const shouldCollapse = items.length > maxItems;
  const visibleItems = shouldCollapse
    ? [items[0], ...items.slice(-2)]
    : items;
  const collapsedItems = shouldCollapse
    ? items.slice(1, -2)
    : [];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Breadcrumb>
        <BreadcrumbList>
          {/* Home */}
          {showHome && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            </>
          )}

          {/* First visible item */}
          {visibleItems[0] && (
            <>
              <BreadcrumbItem>
                {visibleItems[0].isLast ? (
                  <BreadcrumbPage>{visibleItems[0].label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={visibleItems[0].path}>{visibleItems[0].label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {visibleItems.length > 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </>
          )}

          {/* Collapsed items dropdown */}
          {collapsedItems.length > 0 && (
            <>
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <span className="text-sm">•••</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {collapsedItems.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path}>{item.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            </>
          )}

          {/* Remaining visible items */}
          {visibleItems.slice(1).map((item, index) => (
            <React.Fragment key={item.path}>
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage className="font-medium">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < visibleItems.slice(1).length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Copy button */}
      {showCopyButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? 'Copié !' : 'Copier le lien'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export default Breadcrumbs;
