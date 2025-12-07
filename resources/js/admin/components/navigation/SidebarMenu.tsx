/**
 * Sidebar Menu Component
 * Navigation optimisée pour Content Engine multi-plateforme
 * 
 * Features:
 * - Real-time LIVE badges
 * - Progress indicators
 * - Alert notifications
 * - Collapsible sections
 * - Active state tracking
 * - Platform/Objective filtering ready
 */

import React, { useState, useMemo, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Eye,
  Cpu,
  FileText,
  Globe,
  Languages,
  Send,
  Search,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  Zap,
  Play,
  Clock,
  History,
  Target,
  Grid3X3,
  Users,
  Building2,
  Briefcase,
  Map,
  Calendar,
  FileJson,
  Webhook,
  Activity,
  Server,
  AlertTriangle,
  HardDrive,
  Key,
  UserCog,
  Bell,
  PlusCircle,
  Pause,
  CheckCircle2,
  FileCode,
  Newspaper,
  FileSpreadsheet,
  Image,
  Layers,
  PieChart,
  TrendingUp,
  Filter,
  LayoutList,
  Columns,
  Radio,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useGlobalStats } from '@/hooks/useGlobalStats';

// ============================================================================
// Types
// ============================================================================

interface BadgeConfig {
  type: 'new' | 'count' | 'dot' | 'live' | 'alert';
  value?: number;
  variant?: 'default' | 'warning' | 'destructive' | 'success' | 'info';
  pulse?: boolean;
}

interface MenuItem {
  id: string;
  path?: string;
  label: string;
  icon?: React.ReactNode;
  badge?: BadgeConfig;
  tooltip?: string;
}

interface MenuSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: BadgeConfig;
  children?: MenuItem[];
  defaultOpen?: boolean;
}

// ============================================================================
// Badge Component
// ============================================================================

function MenuBadge({ badge }: { badge: BadgeConfig }) {
  const baseClasses = 'ml-auto shrink-0';

  if (badge.type === 'new') {
    return (
      <Badge className={cn(baseClasses, 'h-5 px-1.5 text-[10px] bg-blue-500 text-white border-0')}>
        NEW
      </Badge>
    );
  }

  if (badge.type === 'live') {
    return (
      <span className={cn(baseClasses, 'flex items-center gap-1.5')}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">LIVE</span>
      </span>
    );
  }

  if (badge.type === 'alert') {
    return (
      <span className={cn(baseClasses, 'flex items-center')}>
        <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
      </span>
    );
  }

  if (badge.type === 'count' && badge.value !== undefined && badge.value > 0) {
    const variantClasses = {
      default: 'bg-gray-500',
      warning: 'bg-amber-500',
      destructive: 'bg-red-500',
      success: 'bg-green-500',
      info: 'bg-blue-500',
    }[badge.variant || 'default'];
    
    return (
      <Badge 
        className={cn(
          baseClasses, 
          'h-5 min-w-[20px] px-1.5 text-[10px] text-white border-0 font-semibold',
          variantClasses,
          badge.pulse && 'animate-pulse'
        )}
      >
        {badge.value > 999 ? '999+' : badge.value}
      </Badge>
    );
  }

  if (badge.type === 'dot') {
    const dotClasses = {
      default: 'bg-gray-400',
      warning: 'bg-amber-500',
      destructive: 'bg-red-500',
      success: 'bg-green-500',
      info: 'bg-blue-500',
    }[badge.variant || 'default'];
    
    return (
      <span className={cn(baseClasses, 'h-2 w-2 rounded-full', dotClasses, badge.pulse && 'animate-pulse')} />
    );
  }

  return null;
}

// ============================================================================
// Menu Item Component
// ============================================================================

interface MenuItemComponentProps {
  item: MenuItem;
  isCollapsed?: boolean;
}

function MenuItemComponent({ item, isCollapsed = false }: MenuItemComponentProps) {
  const location = useLocation();
  
  // Check if this item or any sub-path is active
  const isActive = item.path 
    ? location.pathname === item.path || 
      (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
    : false;

  if (!item.path) return null;

  const linkContent = (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
        'hover:bg-accent hover:text-accent-foreground',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {item.icon && (
        <span className={cn('shrink-0', isActive ? 'text-primary' : 'opacity-60')}>
          {item.icon}
        </span>
      )}
      {!isCollapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          {item.badge && <MenuBadge badge={item.badge} />}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed && item.tooltip) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge?.type === 'count' && item.badge.value && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {item.badge.value}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  section: MenuSection;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
}

function CollapsibleSection({ section, isOpen, onToggle, isCollapsed = false }: CollapsibleSectionProps) {
  const location = useLocation();
  
  // Check if any child is active
  const hasActiveChild = section.children?.some(
    (child) => child.path && (
      location.pathname === child.path ||
      location.pathname.startsWith(child.path + '/')
    )
  );

  // Direct link (no children)
  if (section.path && (!section.children || section.children.length === 0)) {
    const isActive = location.pathname === section.path;
    
    const linkContent = (
      <NavLink
        to={section.path}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/80 hover:text-foreground'
        )}
      >
        <span className={cn('shrink-0', isActive && 'text-primary')}>{section.icon}</span>
        {!isCollapsed && (
          <>
            <span className="truncate flex-1">{section.label}</span>
            {section.badge && <MenuBadge badge={section.badge} />}
          </>
        )}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{section.label}</TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  }

  // Collapsible section with children
  const buttonContent = (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
        'hover:bg-accent hover:text-accent-foreground',
        (hasActiveChild || isOpen)
          ? 'text-primary'
          : 'text-foreground/80 hover:text-foreground'
      )}
    >
      <span className={cn('shrink-0', hasActiveChild && 'text-primary')}>{section.icon}</span>
      {!isCollapsed && (
        <>
          <span className="truncate flex-1 text-left">{section.label}</span>
          {section.badge && <MenuBadge badge={section.badge} />}
          <span className="shrink-0 text-muted-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-0.5">
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {section.label}
            {section.badge?.type === 'count' && section.badge.value && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {section.badge.value}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      ) : (
        buttonContent
      )}

      {/* Children */}
      {isOpen && !isCollapsed && section.children && (
        <div className="ml-4 space-y-0.5 border-l border-border pl-3">
          {section.children.map((item) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Sidebar Menu Component
// ============================================================================

interface SidebarMenuProps {
  isCollapsed?: boolean;
}

export function SidebarMenu({ isCollapsed = false }: SidebarMenuProps) {
  const location = useLocation();
  
  // Get real-time stats
  const { 
    data: stats, 
    isLive, 
    totalActive, 
    hasCriticalAlerts 
  } = useGlobalStats({ refetchInterval: 15000 }); // Refresh every 15 seconds
  
  // Extract stats with defaults
  const generationProcessing = stats?.generation?.processing || 0;
  const translationProcessing = stats?.translation?.processing || 0;
  const publishingPending = stats?.publishing?.pending || 0;
  const notIndexedCount = stats?.indexing?.notIndexed || 0;
  const activePrograms = stats?.programs?.active || 0;
  const unreadAlerts = stats?.unreadAlerts || 0;

  // Track open sections - auto-open based on current path
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const path = location.pathname;
    const defaults: Record<string, boolean> = {
      live: true, // Always show live status expanded
    };
    
    // Auto-open relevant section
    const sections = ['programs', 'content', 'coverage', 'translations', 'publishing', 'seo', 'analytics', 'settings', 'admin'];
    sections.forEach((s) => {
      defaults[s] = path.startsWith(`/${s}`);
    });
    
    return defaults;
  });

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  // ============================================================================
  // Menu Configuration
  // ============================================================================
  
  const menuSections: MenuSection[] = useMemo(() => [
    
    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD GLOBAL
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/',
      badge: hasCriticalAlerts ? { type: 'alert' } : undefined,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SUIVI EN DIRECT
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'live',
      label: 'Suivi en direct',
      icon: <Eye className="h-5 w-5" />,
      badge: isLive ? { type: 'live' } : undefined,
      defaultOpen: true,
      children: [
        { 
          id: 'live-overview',
          path: '/live',
          label: 'Vue temps réel',
          icon: <Radio className="h-4 w-4" />,
          tooltip: 'Vue temps réel',
        },
        { 
          id: 'live-generation', 
          path: '/live/generation', 
          label: 'Génération', 
          icon: <Zap className="h-4 w-4" />,
          badge: generationProcessing > 0 
            ? { type: 'count', value: generationProcessing, variant: 'info', pulse: true } 
            : undefined,
          tooltip: 'Génération en cours',
        },
        { 
          id: 'live-translation', 
          path: '/live/translation', 
          label: 'Traductions', 
          icon: <Languages className="h-4 w-4" />,
          badge: translationProcessing > 0 
            ? { type: 'count', value: translationProcessing, variant: 'info', pulse: true } 
            : undefined,
          tooltip: 'Traductions en cours',
        },
        { 
          id: 'live-publishing', 
          path: '/live/publishing', 
          label: 'Publications', 
          icon: <Send className="h-4 w-4" />,
          badge: publishingPending > 0 
            ? { type: 'count', value: publishingPending, variant: 'info' } 
            : undefined,
          tooltip: 'Publications en attente',
        },
        { 
          id: 'live-indexing', 
          path: '/live/indexing', 
          label: 'Indexation', 
          icon: <Globe className="h-4 w-4" />,
          badge: notIndexedCount > 0 
            ? { type: 'count', value: notIndexedCount, variant: 'warning' } 
            : undefined,
          tooltip: 'Articles non indexés',
        },
        { 
          id: 'live-alerts', 
          path: '/live/alerts', 
          label: 'Alertes', 
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: unreadAlerts > 0 
            ? { type: 'count', value: unreadAlerts, variant: 'destructive' } 
            : undefined,
          tooltip: 'Alertes système',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PROGRAMMES
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'programs',
      label: 'Programmes',
      icon: <Cpu className="h-5 w-5" />,
      badge: activePrograms > 0 
        ? { type: 'count', value: activePrograms, variant: 'success' } 
        : undefined,
      children: [
        { 
          id: 'programs-new', 
          path: '/programs/new', 
          label: 'Nouveau programme', 
          icon: <PlusCircle className="h-4 w-4" />,
        },
        { 
          id: 'programs-active', 
          path: '/programs/active', 
          label: 'Actifs', 
          icon: <Play className="h-4 w-4" />,
          badge: activePrograms > 0 
            ? { type: 'count', value: activePrograms, variant: 'success' } 
            : undefined,
        },
        { 
          id: 'programs-paused', 
          path: '/programs/paused', 
          label: 'En pause', 
          icon: <Pause className="h-4 w-4" />,
        },
        { 
          id: 'programs-completed', 
          path: '/programs/completed', 
          label: 'Terminés', 
          icon: <CheckCircle2 className="h-4 w-4" />,
        },
        { 
          id: 'programs-templates', 
          path: '/programs/templates', 
          label: 'Templates', 
          icon: <FileCode className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // CONTENUS
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'content',
      label: 'Contenus',
      icon: <FileText className="h-5 w-5" />,
      children: [
        { 
          id: 'content-all', 
          path: '/content', 
          label: 'Tous les contenus', 
          icon: <LayoutList className="h-4 w-4" />,
        },
        { 
          id: 'content-articles', 
          path: '/content/articles', 
          label: 'Articles', 
          icon: <FileText className="h-4 w-4" />,
        },
        { 
          id: 'content-pillars', 
          path: '/content/pillars', 
          label: 'Articles piliers', 
          icon: <Layers className="h-4 w-4" />,
        },
        { 
          id: 'content-comparatives', 
          path: '/content/comparatives', 
          label: 'Comparatifs', 
          icon: <Columns className="h-4 w-4" />,
        },
        { 
          id: 'content-manual', 
          path: '/content/manual', 
          label: 'Titres manuels', 
          icon: <FileText className="h-4 w-4" />,
        },
        { 
          id: 'content-press-releases', 
          path: '/content/press-releases', 
          label: 'Communiqués', 
          icon: <Newspaper className="h-4 w-4" />,
        },
        { 
          id: 'content-press-kits', 
          path: '/content/press-kits', 
          label: 'Dossiers de presse', 
          icon: <FileSpreadsheet className="h-4 w-4" />,
        },
        { 
          id: 'content-landing', 
          path: '/content/landing', 
          label: 'Landing pages', 
          icon: <Target className="h-4 w-4" />,
        },
        { 
          id: 'content-media', 
          path: '/content/media', 
          label: 'Médias', 
          icon: <Image className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // COUVERTURE
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'coverage',
      label: 'Couverture',
      icon: <Map className="h-5 w-5" />,
      children: [
        { 
          id: 'coverage-overview', 
          path: '/coverage', 
          label: 'Vue globale', 
          icon: <PieChart className="h-4 w-4" />,
        },
        { 
          id: 'coverage-platforms', 
          path: '/coverage/platforms', 
          label: 'Par plateforme', 
          icon: <Building2 className="h-4 w-4" />,
        },
        { 
          id: 'coverage-countries', 
          path: '/coverage/countries', 
          label: 'Par pays', 
          icon: <Globe className="h-4 w-4" />,
        },
        { 
          id: 'coverage-languages', 
          path: '/coverage/languages', 
          label: 'Par langue', 
          icon: <Languages className="h-4 w-4" />,
        },
        { 
          id: 'coverage-specialties', 
          path: '/coverage/specialties', 
          label: 'Par spécialité', 
          icon: <Briefcase className="h-4 w-4" />,
        },
        { 
          id: 'coverage-objectives', 
          path: '/coverage/objectives', 
          label: 'Par objectif', 
          icon: <Target className="h-4 w-4" />,
        },
        { 
          id: 'coverage-matrix', 
          path: '/coverage/matrix', 
          label: 'Matrice complète', 
          icon: <Grid3X3 className="h-4 w-4" />,
        },
        { 
          id: 'coverage-gaps', 
          path: '/coverage/gaps', 
          label: 'Lacunes à combler', 
          icon: <AlertTriangle className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // TRADUCTIONS
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'translations',
      label: 'Traductions',
      icon: <Languages className="h-5 w-5" />,
      badge: translationProcessing > 0 
        ? { type: 'count', value: translationProcessing, variant: 'info' } 
        : undefined,
      children: [
        { 
          id: 'translations-overview', 
          path: '/translations', 
          label: 'Vue globale', 
          icon: <PieChart className="h-4 w-4" />,
        },
        { 
          id: 'translations-by-article', 
          path: '/translations/by-article', 
          label: 'Par article', 
          icon: <FileText className="h-4 w-4" />,
        },
        { 
          id: 'translations-by-language', 
          path: '/translations/by-language', 
          label: 'Par langue', 
          icon: <Languages className="h-4 w-4" />,
        },
        { 
          id: 'translations-by-country', 
          path: '/translations/by-country', 
          label: 'Par pays', 
          icon: <Globe className="h-4 w-4" />,
        },
        { 
          id: 'translations-pending', 
          path: '/translations/pending', 
          label: 'En attente', 
          icon: <Clock className="h-4 w-4" />,
          badge: translationProcessing > 0 
            ? { type: 'count', value: translationProcessing, variant: 'info' } 
            : undefined,
        },
        { 
          id: 'translations-excluded', 
          path: '/translations/excluded', 
          label: 'Non traduisibles', 
          icon: <Filter className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLICATIONS
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'publishing',
      label: 'Publications',
      icon: <Send className="h-5 w-5" />,
      badge: publishingPending > 0 
        ? { type: 'count', value: publishingPending } 
        : undefined,
      children: [
        { 
          id: 'publishing-overview', 
          path: '/publishing', 
          label: 'Vue globale', 
          icon: <PieChart className="h-4 w-4" />,
        },
        { 
          id: 'publishing-by-platform', 
          path: '/publishing/by-platform', 
          label: 'Par plateforme', 
          icon: <Building2 className="h-4 w-4" />,
        },
        { 
          id: 'publishing-by-country', 
          path: '/publishing/by-country', 
          label: 'Par pays', 
          icon: <Globe className="h-4 w-4" />,
        },
        { 
          id: 'publishing-by-language', 
          path: '/publishing/by-language', 
          label: 'Par langue', 
          icon: <Languages className="h-4 w-4" />,
        },
        { 
          id: 'publishing-auto-queue', 
          path: '/publishing/auto-queue', 
          label: 'Queue automatique', 
          icon: <Zap className="h-4 w-4" />,
          badge: publishingPending > 0 
            ? { type: 'count', value: publishingPending, variant: 'info' } 
            : undefined,
        },
        { 
          id: 'publishing-calendar', 
          path: '/publishing/calendar', 
          label: 'Calendrier', 
          icon: <Calendar className="h-4 w-4" />,
        },
        { 
          id: 'publishing-harmony', 
          path: '/publishing/harmony', 
          label: 'Harmonisation', 
          icon: <Activity className="h-4 w-4" />,
          badge: { type: 'new' },
        },
        { 
          id: 'publishing-history', 
          path: '/publishing/history', 
          label: 'Historique', 
          icon: <History className="h-4 w-4" />,
        },
        { 
          id: 'publishing-platforms', 
          path: '/publishing/platforms', 
          label: 'Plateformes', 
          icon: <Building2 className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SEO & INDEXATION
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'seo',
      label: 'SEO & Indexation',
      icon: <Search className="h-5 w-5" />,
      badge: notIndexedCount > 0 
        ? { type: 'count', value: notIndexedCount, variant: 'warning' } 
        : undefined,
      children: [
        { 
          id: 'seo-overview', 
          path: '/seo', 
          label: 'Vue globale', 
          icon: <PieChart className="h-4 w-4" />,
        },
        { 
          id: 'seo-quality', 
          path: '/seo/quality', 
          label: 'Qualité SEO', 
          icon: <BarChart3 className="h-4 w-4" />,
        },
        { 
          id: 'seo-indexing', 
          path: '/seo/indexing', 
          label: 'Indexation', 
          icon: <Globe className="h-4 w-4" />,
          badge: notIndexedCount > 0 
            ? { type: 'count', value: notIndexedCount, variant: 'warning' } 
            : undefined,
        },
        { 
          id: 'seo-performance', 
          path: '/seo/performance', 
          label: 'Performance', 
          icon: <TrendingUp className="h-4 w-4" />,
        },
        { 
          id: 'seo-keywords', 
          path: '/seo/keywords', 
          label: 'Mots-clés', 
          icon: <Search className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ANALYTICS
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      children: [
        { 
          id: 'analytics-overview', 
          path: '/analytics', 
          label: 'Vue globale', 
          icon: <PieChart className="h-4 w-4" />,
        },
        { 
          id: 'analytics-by-platform', 
          path: '/analytics/by-platform', 
          label: 'Par plateforme', 
          icon: <Building2 className="h-4 w-4" />,
        },
        { 
          id: 'analytics-by-objective', 
          path: '/analytics/by-objective', 
          label: 'Par objectif', 
          icon: <Target className="h-4 w-4" />,
        },
        { 
          id: 'analytics-by-specialty', 
          path: '/analytics/by-specialty', 
          label: 'Par spécialité', 
          icon: <Briefcase className="h-4 w-4" />,
        },
        { 
          id: 'analytics-by-country', 
          path: '/analytics/by-country', 
          label: 'Par pays', 
          icon: <Globe className="h-4 w-4" />,
        },
        { 
          id: 'analytics-daily', 
          path: '/analytics/daily', 
          label: 'Quotidien', 
          icon: <Calendar className="h-4 w-4" />,
        },
        { 
          id: 'analytics-trends', 
          path: '/analytics/trends', 
          label: 'Tendances', 
          icon: <TrendingUp className="h-4 w-4" />,
        },
        { 
          id: 'analytics-reports', 
          path: '/analytics/reports', 
          label: 'Rapports', 
          icon: <FileSpreadsheet className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PARAMÈTRES
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings className="h-5 w-5" />,
      children: [
        { 
          id: 'settings-general', 
          path: '/settings', 
          label: 'Général', 
          icon: <Settings className="h-4 w-4" />,
        },
        { 
          id: 'settings-automation', 
          path: '/settings/automation', 
          label: 'Automatisation', 
          icon: <Zap className="h-4 w-4" />,
          badge: { type: 'new' },
        },
        { 
          id: 'settings-harmony', 
          path: '/settings/harmony', 
          label: 'Harmonisation', 
          icon: <Activity className="h-4 w-4" />,
        },
        { 
          id: 'settings-platforms', 
          path: '/settings/platforms', 
          label: 'Plateformes', 
          icon: <Building2 className="h-4 w-4" />,
        },
        { 
          id: 'settings-specialties', 
          path: '/settings/specialties', 
          label: 'Spécialités', 
          icon: <Briefcase className="h-4 w-4" />,
        },
        { 
          id: 'settings-countries', 
          path: '/settings/countries', 
          label: 'Pays & Langues', 
          icon: <Globe className="h-4 w-4" />,
        },
        { 
          id: 'settings-targets', 
          path: '/settings/targets', 
          label: 'Cibles', 
          icon: <Users className="h-4 w-4" />,
        },
        { 
          id: 'settings-objectives', 
          path: '/settings/objectives', 
          label: 'Objectifs', 
          icon: <Target className="h-4 w-4" />,
        },
        { 
          id: 'settings-quality', 
          path: '/settings/quality', 
          label: 'Qualité', 
          icon: <BarChart3 className="h-4 w-4" />,
        },
        { 
          id: 'settings-api', 
          path: '/settings/api', 
          label: 'Clés API', 
          icon: <Key className="h-4 w-4" />,
        },
        { 
          id: 'settings-webhooks', 
          path: '/settings/webhooks', 
          label: 'Webhooks', 
          icon: <Webhook className="h-4 w-4" />,
        },
        { 
          id: 'settings-notifications', 
          path: '/settings/notifications', 
          label: 'Notifications', 
          icon: <Bell className="h-4 w-4" />,
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ADMINISTRATION
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'admin',
      label: 'Administration',
      icon: <Shield className="h-5 w-5" />,
      children: [
        { 
          id: 'admin-users', 
          path: '/users', 
          label: 'Utilisateurs', 
          icon: <Users className="h-4 w-4" />,
        },
        { 
          id: 'admin-roles', 
          path: '/roles', 
          label: 'Rôles', 
          icon: <UserCog className="h-4 w-4" />,
        },
        { 
          id: 'admin-activity', 
          path: '/activity', 
          label: 'Activité', 
          icon: <Activity className="h-4 w-4" />,
        },
        { 
          id: 'admin-workers', 
          path: '/workers', 
          label: 'Workers', 
          icon: <Server className="h-4 w-4" />,
        },
        { 
          id: 'admin-queues', 
          path: '/queues', 
          label: 'Queues', 
          icon: <LayoutList className="h-4 w-4" />,
        },
        { 
          id: 'admin-logs', 
          path: '/logs', 
          label: 'Logs', 
          icon: <FileJson className="h-4 w-4" />,
        },
        { 
          id: 'admin-errors', 
          path: '/errors', 
          label: 'Erreurs', 
          icon: <AlertTriangle className="h-4 w-4" />,
        },
        { 
          id: 'admin-backups', 
          path: '/backups', 
          label: 'Sauvegardes', 
          icon: <HardDrive className="h-4 w-4" />,
        },
      ],
    },

  ], [
    isLive,
    hasCriticalAlerts,
    generationProcessing,
    translationProcessing,
    publishingPending,
    notIndexedCount,
    activePrograms,
    unreadAlerts,
  ]);

  return (
    <ScrollArea className="flex-1">
      <nav className="space-y-1 px-3 py-4">
        {menuSections.map((section) => (
          <React.Fragment key={section.id}>
            {/* Separator before settings/admin */}
            {['settings', 'admin'].includes(section.id) && (
              <Separator className="my-4" />
            )}
            
            <CollapsibleSection
              section={section}
              isOpen={openSections[section.id] ?? section.defaultOpen ?? false}
              onToggle={() => toggleSection(section.id)}
              isCollapsed={isCollapsed}
            />
          </React.Fragment>
        ))}
      </nav>
    </ScrollArea>
  );
}

export default SidebarMenu;
