/**
 * Confidence Meter Component
 * File 292 - Gauge display for confidence scores
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { getConfidenceColor, getConfidenceLabel } from '@/types/research';
import { cn } from '@/lib/utils';

type ConfidenceMeterSize = 'sm' | 'md' | 'lg';

interface ConfidenceMeterProps {
  value: number; // 0-100
  size?: ConfidenceMeterSize;
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function ConfidenceMeter({
  value,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className,
}: ConfidenceMeterProps) {
  const { t } = useTranslation();

  // Normalize value
  const normalizedValue = Math.max(0, Math.min(100, value));
  const color = getConfidenceColor(normalizedValue);
  const label = getConfidenceLabel(normalizedValue);

  // Size configurations
  const sizeConfig = {
    sm: {
      wrapper: 'w-16 h-16',
      stroke: 4,
      radius: 24,
      fontSize: 'text-xs',
      labelSize: 'text-[10px]',
    },
    md: {
      wrapper: 'w-24 h-24',
      stroke: 6,
      radius: 36,
      fontSize: 'text-sm',
      labelSize: 'text-xs',
    },
    lg: {
      wrapper: 'w-32 h-32',
      stroke: 8,
      radius: 48,
      fontSize: 'text-lg',
      labelSize: 'text-sm',
    },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  // Tooltip explanation
  const tooltipContent = (
    <div className="text-center">
      <p className="font-medium">{normalizedValue}% confiance</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs mt-1">
        {normalizedValue >= 80 && 'Haute fiabilité des sources'}
        {normalizedValue >= 60 && normalizedValue < 80 && 'Fiabilité modérée'}
        {normalizedValue >= 40 && normalizedValue < 60 && 'Vérification supplémentaire recommandée'}
        {normalizedValue < 40 && 'Sources insuffisantes ou contradictoires'}
      </p>
    </div>
  );

  const meterContent = (
    <div className={cn('relative inline-flex items-center justify-center', config.wrapper, className)}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={config.radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn('font-bold', config.fontSize)}
          style={{ color }}
        >
          {normalizedValue}%
        </span>
        {showLabel && (
          <span className={cn('text-muted-foreground', config.labelSize)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {meterContent}
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return meterContent;
}

// Alternative linear confidence bar
interface ConfidenceBarProps {
  value: number;
  showLabel?: boolean;
  showValue?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceBar({
  value,
  showLabel = true,
  showValue = true,
  height = 'md',
  className,
}: ConfidenceBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const color = getConfidenceColor(normalizedValue);
  const label = getConfidenceLabel(normalizedValue);

  const heightConfig = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {showLabel && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          {showValue && (
            <span
              className="text-xs font-medium"
              style={{ color }}
            >
              {normalizedValue}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', heightConfig[height])}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${normalizedValue}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// Mini confidence badge
interface ConfidenceBadgeProps {
  value: number;
  className?: string;
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const color = getConfidenceColor(normalizedValue);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              className
            )}
            style={{
              backgroundColor: `${color}20`,
              color,
            }}
          >
            {normalizedValue}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confiance: {getConfidenceLabel(normalizedValue)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConfidenceMeter;
