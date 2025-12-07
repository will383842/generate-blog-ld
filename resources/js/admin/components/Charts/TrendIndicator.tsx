import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  percentage?: number;
  format?: 'percentage' | 'absolute' | 'both';
  showIcon?: boolean;
  iconType?: 'trending' | 'arrow';
  size?: 'sm' | 'default' | 'lg';
  invertColors?: boolean;
  className?: string;
  suffix?: string;
  precision?: number;
}

export function TrendIndicator({
  value,
  previousValue,
  percentage: providedPercentage,
  format = 'percentage',
  showIcon = true,
  iconType = 'trending',
  size = 'default',
  invertColors = false,
  className,
  suffix = '',
  precision = 1,
}: TrendIndicatorProps) {
  // Calculate percentage change if not provided
  const percentage = providedPercentage ?? (previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : 0);

  const absoluteChange = previousValue !== undefined ? value - previousValue : value;
  const isPositive = percentage > 0;
  const isNegative = percentage < 0;
  const isNeutral = percentage === 0;

  // Determine colors (can be inverted for metrics where decrease is good)
  const positiveColor = invertColors ? 'text-red-500' : 'text-green-500';
  const negativeColor = invertColors ? 'text-green-500' : 'text-red-500';
  const neutralColor = 'text-muted-foreground';

  const colorClass = isPositive
    ? positiveColor
    : isNegative
    ? negativeColor
    : neutralColor;

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-0.5',
    },
    default: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-1',
    },
    lg: {
      text: 'text-base',
      icon: 'h-5 w-5',
      gap: 'gap-1.5',
    },
  };

  const config = sizeConfig[size];

  // Get icon based on trend and type
  const getIcon = () => {
    if (iconType === 'arrow') {
      if (isPositive) return <ArrowUp className={config.icon} />;
      if (isNegative) return <ArrowDown className={config.icon} />;
      return <Minus className={config.icon} />;
    }
    if (isPositive) return <TrendingUp className={config.icon} />;
    if (isNegative) return <TrendingDown className={config.icon} />;
    return <Minus className={config.icon} />;
  };

  // Format the display value
  const formatValue = () => {
    const parts: string[] = [];

    if (format === 'percentage' || format === 'both') {
      const sign = isPositive ? '+' : '';
      parts.push(`${sign}${percentage.toFixed(precision)}%`);
    }

    if (format === 'absolute' || format === 'both') {
      const sign = absoluteChange > 0 ? '+' : '';
      const formatted = Math.abs(absoluteChange) >= 1000
        ? `${(absoluteChange / 1000).toFixed(1)}k`
        : absoluteChange.toFixed(precision);
      parts.push(`${sign}${formatted}${suffix}`);
    }

    return parts.join(' / ');
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium',
        config.gap,
        config.text,
        colorClass,
        className
      )}
    >
      {showIcon && getIcon()}
      <span>{formatValue()}</span>
    </div>
  );
}

// Convenience components for common use cases
export function TrendUp({
  value,
  className,
  ...props
}: Omit<TrendIndicatorProps, 'value'> & { value: number }) {
  return (
    <TrendIndicator
      value={value}
      percentage={Math.abs(value)}
      className={className}
      {...props}
    />
  );
}

export function TrendDown({
  value,
  className,
  ...props
}: Omit<TrendIndicatorProps, 'value'> & { value: number }) {
  return (
    <TrendIndicator
      value={-Math.abs(value)}
      percentage={-Math.abs(value)}
      className={className}
      {...props}
    />
  );
}

export default TrendIndicator;
