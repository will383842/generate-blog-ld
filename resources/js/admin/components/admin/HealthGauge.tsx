/**
 * Health Gauge Component
 * File 351 - Circular SVG gauge for health metrics
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface HealthGaugeProps {
  value: number;
  max: number;
  label: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  tooltipContent?: React.ReactNode;
}

export function HealthGauge({
  value,
  max,
  label,
  thresholds = { warning: 70, critical: 90 },
  size = 'md',
  showValue = true,
  tooltipContent,
}: HealthGaugeProps) {
  // Size configurations
  const sizeConfig = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];
  const percentage = Math.min((value / max) * 100, 100);

  // Calculate SVG values
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = config.width / 2;

  // Determine color based on thresholds
  const getColor = () => {
    if (percentage >= thresholds.critical) return { stroke: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
    if (percentage >= thresholds.warning) return { stroke: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
    return { stroke: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' };
  };

  const colors = getColor();

  // Determine status label
  const getStatusLabel = () => {
    if (percentage >= thresholds.critical) return 'Critique';
    if (percentage >= thresholds.warning) return 'Attention';
    return 'Normal';
  };

  const gaugeContent = (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          {/* Value arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
          {/* Warning threshold marker */}
          {thresholds.warning < 100 && (
            <line
              x1={center}
              y1={config.strokeWidth / 2}
              x2={center}
              y2={config.strokeWidth / 2 + 4}
              stroke="#F59E0B"
              strokeWidth={2}
              transform={`rotate(${(thresholds.warning / 100) * 360}, ${center}, ${center})`}
            />
          )}
          {/* Critical threshold marker */}
          {thresholds.critical < 100 && (
            <line
              x1={center}
              y1={config.strokeWidth / 2}
              x2={center}
              y2={config.strokeWidth / 2 + 4}
              stroke="#EF4444"
              strokeWidth={2}
              transform={`rotate(${(thresholds.critical / 100) * 360}, ${center}, ${center})`}
            />
          )}
        </svg>

        {/* Center text */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold', config.fontSize)} style={{ color: colors.stroke }}>
              {Math.round(value)}
            </span>
            <span className="text-xs text-muted-foreground">/ {max}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm text-muted-foreground mt-2">{label}</p>

      {/* Status badge */}
      <div
        className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.stroke }}
      >
        {getStatusLabel()}
      </div>
    </div>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{gaugeContent}</div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return gaugeContent;
}

// Compact horizontal gauge variant
interface HealthBarProps {
  value: number;
  max: number;
  label: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export function HealthBar({
  value,
  max,
  label,
  thresholds = { warning: 70, critical: 90 },
}: HealthBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  // Determine color
  const getColor = () => {
    if (percentage >= thresholds.critical) return 'bg-red-500';
    if (percentage >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default HealthGauge;
