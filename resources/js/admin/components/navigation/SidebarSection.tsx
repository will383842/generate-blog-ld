import { useState } from 'react';
import { ChevronDown, Star, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';

interface SidebarItemData {
  id: string;
  label: string;
  path: string;
  badge?: number | string;
  isActive?: boolean;
}

interface SidebarSectionProps {
  icon: React.ElementType;
  label: string;
  badge?: number | string;
  badgeType?: 'default' | 'warning' | 'error';
  isExpanded?: boolean;
  isActive?: boolean;
  isFavorite?: boolean;
  collapsed?: boolean;
  items?: SidebarItemData[];
  onToggle?: () => void;
  onToggleFavorite?: () => void;
}

export function SidebarSection({
  icon: Icon,
  label,
  badge,
  badgeType = 'default',
  isExpanded = false,
  isActive = false,
  isFavorite = false,
  collapsed = false,
  items,
  onToggle,
  onToggleFavorite
}: SidebarSectionProps) {
  const [isHovered, setIsHovered] = useState(false);

  const badgeColors = {
    default: 'bg-slate-600 text-slate-200',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-500 text-white'
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              'relative flex items-center justify-center w-full h-10 transition-colors',
              isActive
                ? 'text-blue-400 bg-slate-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon size={20} />
            {badge && (
              <span className={cn(
                'absolute top-0 right-1 min-w-[18px] h-[18px] text-xs rounded-full flex items-center justify-center',
                badgeColors[badgeType]
              )}>
                {badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1">
          <span className="font-medium">{label}</span>
          {items && items.length > 0 && (
            <div className="text-xs text-slate-400">
              {items.map(item => (
                <div key={item.id}>{item.label}</div>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center w-full px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'text-blue-400 bg-slate-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            )}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="ml-3 flex-1 text-left truncate">{label}</span>
            
            {badge && (
              <span className={cn(
                'ml-2 min-w-[20px] h-5 px-1.5 text-xs rounded-full flex items-center justify-center',
                badgeColors[badgeType]
              )}>
                {badge}
              </span>
            )}
            
            {items && items.length > 0 && (
              <ChevronDown
                size={16}
                className={cn(
                  'ml-2 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        {isHovered && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              'absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6',
              isFavorite ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'
            )}
          >
            {isFavorite ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
          </Button>
        )}

        {isFavorite && !isHovered && (
          <Star
            size={12}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-yellow-400"
            fill="currentColor"
          />
        )}
      </div>

      {items && items.length > 0 && (
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
          <div className="pl-4 py-1 space-y-0.5">
            {items.map(item => (
              <SidebarItem
                key={item.id}
                label={item.label}
                path={item.path}
                badge={item.badge}
                isActive={item.isActive}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}