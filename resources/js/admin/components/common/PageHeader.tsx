import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';

interface Tab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface PageHeaderProps {
  className?: string;
  title: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  actions?: ReactNode;
  showBreadcrumb?: boolean;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children?: ReactNode;
}

export function PageHeader({
  className,
  title,
  titleKey,
  description,
  descriptionKey,
  actions,
  showBreadcrumb = true,
  tabs,
  activeTab,
  onTabChange,
  children
}: PageHeaderProps) {
  const { t } = useTranslation();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displayDescription = descriptionKey ? t(descriptionKey) : description;

  return (
    <header className={cn('space-y-4', className)}>
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <Breadcrumb className="text-sm" />
      )}

      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {displayTitle}
          </h1>
          {displayDescription && (
            <p className="text-sm text-slate-500">
              {displayDescription}
            </p>
          )}
        </div>

        {/* Actions slot */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange?.(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full',
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Additional content slot */}
      {children}
    </header>
  );
}

// Composant pour les actions standards
interface PageHeaderActionsProps {
  children: ReactNode;
  className?: string;
}

export function PageHeaderActions({ children, className }: PageHeaderActionsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}

// Composant pour un groupe de filtres
interface PageHeaderFiltersProps {
  children: ReactNode;
  className?: string;
}

export function PageHeaderFilters({ children, className }: PageHeaderFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 pt-2', className)}>
      {children}
    </div>
  );
}