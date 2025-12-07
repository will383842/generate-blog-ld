import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  label: string;
  path: string;
  icon?: React.ElementType;
  badge?: number | string;
  badgeType?: 'default' | 'warning' | 'error';
  isActive?: boolean;
  collapsed?: boolean;
}

const BADGE_COLORS = {
  default: 'bg-slate-600 text-slate-200',
  warning: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white'
} as const;

export function SidebarItem({
  label,
  path,
  icon: Icon,
  badge,
  badgeType = 'default',
  isActive,
  collapsed = false
}: SidebarItemProps) {
  const location = useLocation();
  const active = isActive ?? (location.pathname === path || location.pathname.startsWith(path + '/'));

  return (
    <Link
      to={path}
      className={cn(
        'relative flex items-center px-4 py-2 text-sm rounded-md transition-colors',
        active
          ? 'text-blue-400 bg-blue-500/10 font-medium'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      )}
    >
      {Icon && <Icon size={18} className="flex-shrink-0" />}
      
      {!collapsed && (
        <>
          <span className={cn('truncate', Icon ? 'ml-3' : 'ml-7')}>
            {label}
          </span>
          
          {badge !== undefined && (
            <span className={cn(
              'ml-auto min-w-[20px] h-5 px-1.5 text-xs rounded-full flex items-center justify-center',
              BADGE_COLORS[badgeType]
            )}>
              {badge}
            </span>
          )}
        </>
      )}

      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r" />
      )}
    </Link>
  );
}