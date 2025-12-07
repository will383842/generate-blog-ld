import { Fragment, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  className?: string;
  maxItems?: number;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'navigation.sections.dashboard',
  platform: 'navigation.submenus.dashboard.platform',
  programs: 'navigation.sections.programs',
  create: 'common.actions.create',
  edit: 'common.actions.edit',
  templates: 'navigation.submenus.programs.templates',
  generation: 'navigation.sections.generation',
  wizard: 'navigation.submenus.generation.wizard',
  bulk: 'navigation.submenus.generation.bulk',
  manual: 'navigation.submenus.generation.manual',
  queue: 'navigation.submenus.generation.queue',
  history: 'navigation.submenus.generation.history',
  content: 'navigation.sections.content',
  articles: 'navigation.submenus.content.articles',
  pillars: 'navigation.submenus.content.pillars',
  comparatives: 'navigation.submenus.content.comparatives',
  landings: 'navigation.submenus.content.landings',
  press: 'navigation.sections.press',
  releases: 'navigation.submenus.press.releases',
  dossiers: 'navigation.submenus.press.dossiers',
  coverage: 'navigation.sections.coverage',
  gaps: 'navigation.submenus.coverage.gaps',
  objectives: 'navigation.submenus.coverage.objectives',
  quality: 'navigation.sections.quality',
  golden: 'navigation.submenus.quality.golden',
  feedback: 'navigation.submenus.quality.feedback',
  research: 'navigation.sections.research',
  factcheck: 'navigation.submenus.research.factcheck',
  mining: 'navigation.submenus.research.mining',
  ai: 'navigation.sections.ai',
  costs: 'navigation.submenus.ai.costs',
  performance: 'navigation.submenus.ai.performance',
  prompts: 'navigation.submenus.ai.prompts',
  seo: 'navigation.sections.seo',
  schema: 'navigation.submenus.seo.schema',
  technical: 'navigation.submenus.seo.technical',
  links: 'navigation.submenus.seo.links',
  redirects: 'navigation.submenus.seo.redirects',
  indexing: 'navigation.submenus.seo.indexing',
  analytics: 'navigation.sections.analytics',
  traffic: 'navigation.submenus.analytics.traffic',
  conversions: 'navigation.submenus.analytics.conversions',
  top: 'navigation.submenus.analytics.top',
  reports: 'navigation.submenus.analytics.reports',
  media: 'navigation.sections.media',
  library: 'navigation.submenus.media.library',
  unsplash: 'navigation.submenus.media.unsplash',
  dalle: 'navigation.submenus.media.dalle',
  publishing: 'navigation.sections.publishing',
  platforms: 'navigation.submenus.publishing.platforms',
  endpoints: 'navigation.submenus.publishing.endpoints',
  webhooks: 'navigation.submenus.publishing.webhooks',
  logs: 'navigation.submenus.publishing.logs',
  settings: 'navigation.sections.settings',
  general: 'navigation.submenus.settings.general',
  publication: 'navigation.submenus.settings.publication',
  images: 'navigation.submenus.settings.images',
  'api-keys': 'navigation.submenus.settings.apiKeys',
  knowledge: 'navigation.submenus.settings.knowledge',
  brand: 'navigation.submenus.settings.brand',
  admin: 'navigation.sections.admin',
  users: 'navigation.submenus.admin.users',
  roles: 'navigation.submenus.admin.roles',
  system: 'navigation.submenus.admin.system',
  errors: 'navigation.submenus.admin.errors',
  backups: 'navigation.submenus.admin.backups'
};

export function Breadcrumb({ className, maxItems = 4 }: BreadcrumbProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const items = useMemo((): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    return pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const labelKey = ROUTE_LABELS[segment];
      const isId = /^[0-9a-f-]{36}$|^\d+$/.test(segment);
      
      return {
        label: isId ? `#${segment.slice(0, 8)}...` : (labelKey ? t(labelKey) : segment),
        path,
        isLast: index === pathSegments.length - 1
      };
    });
  }, [location.pathname, t]);

  const displayItems = useMemo(() => {
    if (items.length <= maxItems) return items;
    
    return [
      items[0],
      { label: '...', path: '', isLast: false },
      ...items.slice(-2)
    ];
  }, [items, maxItems]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center text-slate-500 hover:text-slate-700 transition-colors"
            aria-label={t('navigation.breadcrumb.home')}
          >
            <Home size={16} />
          </Link>
        </li>

        {displayItems.map((item, index) => (
          <Fragment key={item.path || `ellipsis-${index}`}>
            <li className="flex items-center text-slate-400">
              <ChevronRight size={14} />
            </li>
            <li>
              {item.isLast || !item.path ? (
                <span
                  className={cn(
                    'px-1',
                    item.isLast ? 'text-slate-900 font-medium' : 'text-slate-400'
                  )}
                  aria-current={item.isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="px-1 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}