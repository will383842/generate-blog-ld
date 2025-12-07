/**
 * Locale Badge
 * Displays locale code like "🇫🇷 fr-DE" in a badge
 * 
 * À ajouter dans: resources/js/admin/components/ui/LocaleBadge.tsx
 */

import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { formatLocaleBadge, isRTLLocale } from '@/utils/locale';
import { Globe } from 'lucide-react';

export interface LocaleBadgeProps extends Omit<BadgeProps, 'children'> {
  /** Language code (e.g., 'fr') */
  language: string;
  /** Country code (e.g., 'DE') */
  country: string;
  /** Show RTL indicator */
  showRTL?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function LocaleBadge({
  language,
  country,
  showRTL = true,
  size = 'md',
  className,
  variant = 'secondary',
  ...props
}: LocaleBadgeProps) {
  const isRTL = isRTLLocale(language);
  const label = formatLocaleBadge(language, country);
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  return (
    <Badge 
      variant={variant}
      className={cn(
        sizeClasses[size],
        'font-mono',
        isRTL && showRTL && 'border-orange-300',
        className
      )}
      {...props}
    >
      {label}
      {isRTL && showRTL && (
        <span className="ml-1 text-orange-500 text-[10px]">RTL</span>
      )}
    </Badge>
  );
}

/**
 * Locale Badge Group
 * Displays multiple locales
 */
export interface LocaleBadgeGroupProps {
  locales: Array<{ language: string; country: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LocaleBadgeGroup({
  locales,
  max = 5,
  size = 'sm',
  className,
}: LocaleBadgeGroupProps) {
  const visible = locales.slice(0, max);
  const remaining = locales.length - max;
  
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((locale, i) => (
        <LocaleBadge
          key={`${locale.language}-${locale.country}`}
          language={locale.language}
          country={locale.country}
          size={size}
          showRTL={false}
        />
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className={cn('font-mono', size === 'sm' && 'text-xs')}>
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

/**
 * Simple Locale Display (inline text, no badge)
 */
export interface LocaleTextProps {
  language: string;
  country: string;
  showFlag?: boolean;
  className?: string;
}

export function LocaleText({
  language,
  country,
  showFlag = true,
  className,
}: LocaleTextProps) {
  const label = formatLocaleBadge(language, country);
  
  if (!showFlag) {
    return (
      <span className={cn('font-mono', className)}>
        {language.toLowerCase()}-{country.toUpperCase()}
      </span>
    );
  }
  
  return <span className={cn('font-mono', className)}>{label}</span>;
}

export default LocaleBadge;
