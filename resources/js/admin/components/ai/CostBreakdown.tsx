import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { DollarSign, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CostCategory {
  id: string;
  name: string;
  amount: number;
  previousAmount?: number;
  limit?: number;
  color?: string;
}

export interface CostBreakdownProps {
  categories: CostCategory[];
  totalBudget?: number;
  currency?: string;
  period?: string;
  showTrends?: boolean;
  showProgress?: boolean;
  className?: string;
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
];

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function CostBreakdown({
  categories,
  totalBudget,
  currency = 'USD',
  period = 'This month',
  showTrends = true,
  showProgress = true,
  className,
}: CostBreakdownProps) {
  const { t } = useTranslation('ai');

  const totalSpent = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const budgetUsage = totalBudget ? (totalSpent / totalBudget) * 100 : 0;

  const getTrendInfo = (category: CostCategory) => {
    if (!category.previousAmount) return null;
    const change = category.amount - category.previousAmount;
    const percentChange = (change / category.previousAmount) * 100;
    return {
      change,
      percentChange,
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('costs.title')}
            </CardTitle>
            <CardDescription>{period}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalSpent, currency)}</p>
            {totalBudget && (
              <p className="text-sm text-muted-foreground">
                of {formatCurrency(totalBudget, currency)} budget
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget progress */}
        {totalBudget && showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('costs.budget')}</span>
              <span
                className={cn(
                  budgetUsage > 90
                    ? 'text-destructive'
                    : budgetUsage > 75
                    ? 'text-yellow-500'
                    : 'text-muted-foreground'
                )}
              >
                {budgetUsage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(budgetUsage, 100)}
              className={cn(
                budgetUsage > 90 && '[&>div]:bg-destructive',
                budgetUsage > 75 && budgetUsage <= 90 && '[&>div]:bg-yellow-500'
              )}
            />
          </div>
        )}

        {/* Category breakdown */}
        <div className="space-y-4">
          {categories.map((category, index) => {
            const color = category.color || defaultColors[index % defaultColors.length];
            const trend = showTrends ? getTrendInfo(category) : null;
            const categoryPercentage = (category.amount / totalSpent) * 100;
            const limitUsage = category.limit
              ? (category.amount / category.limit) * 100
              : null;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium">{category.name}</span>
                    {category.limit && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Limit: {formatCurrency(category.limit, currency)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {trend && (
                      <Badge
                        variant={
                          trend.isIncrease
                            ? 'destructive'
                            : trend.isDecrease
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {trend.isIncrease ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : trend.isDecrease ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : (
                          <Minus className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(trend.percentChange).toFixed(1)}%
                      </Badge>
                    )}
                    <span className="font-semibold">
                      {formatCurrency(category.amount, currency)}
                    </span>
                  </div>
                </div>

                {/* Category progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${categoryPercentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {categoryPercentage.toFixed(1)}%
                  </span>
                </div>

                {/* Limit warning */}
                {limitUsage && limitUsage > 80 && (
                  <p
                    className={cn(
                      'text-xs',
                      limitUsage > 100 ? 'text-destructive' : 'text-yellow-500'
                    )}
                  >
                    {limitUsage > 100
                      ? `Exceeded limit by ${formatCurrency(
                          category.amount - category.limit!,
                          currency
                        )}`
                      : `${(100 - limitUsage).toFixed(1)}% of limit remaining`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('costs.breakdown.total')}
            </span>
            <span className="font-bold text-lg">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CostBreakdown;
