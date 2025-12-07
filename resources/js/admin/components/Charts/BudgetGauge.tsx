import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface BudgetGaugeProps {
  value: number; // 0-100
  total: number;
  used: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showAlert?: boolean;
  className?: string;
}

export function BudgetGauge({
  value,
  total,
  used,
  label = 'Budget utilisé',
  size = 'md',
  showAlert = true,
  className,
}: BudgetGaugeProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  const { color, alertLevel, alertMessage } = useMemo(() => {
    if (percentage >= 100) {
      return {
        color: '#EF4444', // red-500
        alertLevel: 'critical' as const,
        alertMessage: 'Budget épuisé !',
      };
    }
    if (percentage >= 90) {
      return {
        color: '#F97316', // orange-500
        alertLevel: 'danger' as const,
        alertMessage: 'Attention : budget critique',
      };
    }
    if (percentage >= 80) {
      return {
        color: '#EAB308', // yellow-500
        alertLevel: 'warning' as const,
        alertMessage: 'Budget bientôt épuisé',
      };
    }
    return {
      color: '#22C55E', // green-500
      alertLevel: 'safe' as const,
      alertMessage: '',
    };
  }, [percentage]);

  const sizes = {
    sm: { container: 120, stroke: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { container: 160, stroke: 12, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { container: 200, stroke: 16, fontSize: 'text-3xl', labelSize: 'text-base' },
  };

  const { container, stroke, fontSize, labelSize } = sizes[size];
  const radius = (container - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const remaining = total - used;
  const formattedRemaining = remaining >= 0 ? `$${remaining.toFixed(2)}` : `-$${Math.abs(remaining).toFixed(2)}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: container, height: container }}>
        {/* Background circle */}
        <svg
          width={container}
          height={container}
          className="transform -rotate-90"
        >
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', fontSize)} style={{ color }}>
            {percentage.toFixed(0)}%
          </span>
          <span className={cn('text-muted-foreground', labelSize)}>
            {label}
          </span>
        </div>
      </div>

      {/* Budget info */}
      <div className="mt-4 text-center">
        <div className="text-sm text-muted-foreground">
          ${used.toFixed(2)} / ${total.toFixed(2)}
        </div>
        <div className={cn(
          'text-sm font-medium mt-1',
          remaining >= 0 ? 'text-green-600' : 'text-red-600'
        )}>
          Restant : {formattedRemaining}
        </div>
      </div>

      {/* Alert */}
      {showAlert && alertMessage && (
        <div
          className={cn(
            'mt-3 px-3 py-2 rounded-md text-sm font-medium text-center',
            alertLevel === 'critical' && 'bg-red-100 text-red-700',
            alertLevel === 'danger' && 'bg-orange-100 text-orange-700',
            alertLevel === 'warning' && 'bg-yellow-100 text-yellow-700'
          )}
        >
          {alertLevel === 'critical' && '🚨 '}
          {alertLevel === 'danger' && '⚠️ '}
          {alertLevel === 'warning' && '⚡ '}
          {alertMessage}
        </div>
      )}
    </div>
  );
}

export default BudgetGauge;