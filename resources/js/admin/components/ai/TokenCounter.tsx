import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Hash, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenCounterProps {
  inputTokens: number;
  outputTokens?: number;
  maxTokens?: number;
  modelMaxTokens?: number;
  showCost?: boolean;
  costPerInputToken?: number;
  costPerOutputToken?: number;
  currency?: string;
  variant?: 'inline' | 'detailed' | 'compact';
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function TokenCounter({
  inputTokens,
  outputTokens = 0,
  maxTokens,
  modelMaxTokens = 128000,
  showCost = false,
  costPerInputToken = 0.000003,
  costPerOutputToken = 0.000015,
  currency = 'USD',
  variant = 'detailed',
  className,
}: TokenCounterProps) {
  const { t } = useTranslation('ai');

  const totalTokens = inputTokens + outputTokens;
  const effectiveMax = maxTokens || modelMaxTokens;
  const usagePercentage = (totalTokens / effectiveMax) * 100;
  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usagePercentage > 100;

  const cost = useMemo(() => {
    if (!showCost) return null;
    const inputCost = inputTokens * costPerInputToken;
    const outputCost = outputTokens * costPerOutputToken;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }, [inputTokens, outputTokens, costPerInputToken, costPerOutputToken, showCost]);

  const formatCost = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 text-sm',
                isOverLimit
                  ? 'text-destructive'
                  : isNearLimit
                  ? 'text-yellow-500'
                  : 'text-muted-foreground',
                className
              )}
            >
              <Hash className="h-3.5 w-3.5" />
              <span>{formatNumber(totalTokens)}</span>
              {isNearLimit && <AlertTriangle className="h-3.5 w-3.5" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p>Input: {formatNumber(inputTokens)} tokens</p>
              <p>Output: {formatNumber(outputTokens)} tokens</p>
              <p>Total: {formatNumber(totalTokens)} / {formatNumber(effectiveMax)}</p>
              {cost && <p>Cost: {formatCost(cost.total)}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted',
          className
        )}
      >
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {formatNumber(totalTokens)}
          {maxTokens && (
            <span className="text-muted-foreground">
              {' '}
              / {formatNumber(maxTokens)}
            </span>
          )}
        </span>
        {isNearLimit && (
          <Badge variant={isOverLimit ? 'destructive' : 'outline'} className="text-xs">
            {isOverLimit ? 'Over limit' : `${usagePercentage.toFixed(0)}%`}
          </Badge>
        )}
        {cost && (
          <span className="text-xs text-muted-foreground">
            ({formatCost(cost.total)})
          </span>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{t('costs.tokens')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{formatNumber(totalTokens)}</span>
          <span className="text-muted-foreground">
            / {formatNumber(effectiveMax)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress
          value={Math.min(usagePercentage, 100)}
          className={cn(
            isOverLimit && '[&>div]:bg-destructive',
            isNearLimit && !isOverLimit && '[&>div]:bg-yellow-500'
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{usagePercentage.toFixed(1)}% used</span>
          <span>{formatNumber(effectiveMax - totalTokens)} remaining</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Input tokens
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Tokens from your prompt and context
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-lg font-semibold">{formatNumber(inputTokens)}</p>
          {cost && (
            <p className="text-xs text-muted-foreground">
              {formatCost(cost.input)}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Output tokens
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  Tokens generated in the response
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-lg font-semibold">{formatNumber(outputTokens)}</p>
          {cost && (
            <p className="text-xs text-muted-foreground">
              {formatCost(cost.output)}
            </p>
          )}
        </div>
      </div>

      {/* Cost summary */}
      {cost && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated cost</span>
            <span className="font-bold">{formatCost(cost.total)}</span>
          </div>
        </div>
      )}

      {/* Warning */}
      {isNearLimit && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            isOverLimit ? 'bg-destructive/10 text-destructive' : 'bg-yellow-50 text-yellow-700'
          )}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            {isOverLimit
              ? 'Token limit exceeded. The response may be truncated.'
              : 'Approaching token limit. Consider reducing context.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default TokenCounter;
