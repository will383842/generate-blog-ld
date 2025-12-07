/**
 * Conversion Funnel Component
 * File 331 - Funnel visualization with step breakdown
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Target,
  TrendingUp,
  TrendingDown,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useConversionsData, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface ConversionFunnelProps {
  period?: PeriodType;
  dateRange?: DateRange;
  compact?: boolean;
}

export function ConversionFunnel({ period = '30d', dateRange, compact = false }: ConversionFunnelProps) {
  const { t } = useTranslation();
  const { data: conversionsData, isLoading } = useConversionsData(period, dateRange);

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {conversionsData?.totalConversions || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              Taux: {conversionsData?.conversionRate?.toFixed(2) || 0}%
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const funnel = conversionsData?.funnel || [];
  const maxVisitors = funnel[0]?.visitors || 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <Badge className={cn(
                conversionsData?.trend && conversionsData.trend > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}>
                {conversionsData?.trend && conversionsData.trend > 0 ? '+' : ''}
                {conversionsData?.trend?.toFixed(1) || 0}%
              </Badge>
            </div>
            <p className="text-3xl font-bold">{conversionsData?.totalConversions || 0}</p>
            <p className="text-sm text-muted-foreground">Conversions totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{conversionsData?.conversionRate?.toFixed(2) || 0}%</p>
            <p className="text-sm text-muted-foreground">Taux de conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <ArrowDown className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">
              {funnel.length > 1
                ? `${((1 - funnel[funnel.length - 1].visitors / funnel[0].visitors) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
            <p className="text-sm text-muted-foreground">Drop-off total</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entonnoir de conversion</CardTitle>
          <CardDescription>Parcours des visiteurs vers la conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnel.map((step, idx) => {
              const width = (step.visitors / maxVisitors) * 100;
              const isLast = idx === funnel.length - 1;
              
              return (
                <div key={step.id}>
                  {/* Step */}
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-right">
                      <p className="font-medium text-sm">{step.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(step.visitors)} visiteurs
                      </p>
                    </div>
                    
                    <div className="flex-1">
                      <div className="relative">
                        <div
                          className={cn(
                            'h-12 rounded-lg transition-all flex items-center justify-end pr-4',
                            isLast ? 'bg-green-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-white font-bold">
                            {step.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drop-off indicator */}
                  {!isLast && step.dropOff > 0 && (
                    <div className="flex items-center gap-4 my-2 ml-32 pl-4">
                      <ArrowDown className="h-4 w-4 text-red-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600">
                          -{formatNumber(step.dropOff)} ({step.dropOffRate.toFixed(1)}%)
                        </span>
                        {step.dropOffRate > 50 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goals Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objectifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionsData?.goals?.map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {goal.percentage >= 100 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Target className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="font-medium">{goal.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {formatNumber(goal.current)} / {formatNumber(goal.target)}
                    </span>
                    <Badge className={cn(
                      goal.trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    )}>
                      {goal.trend > 0 ? '+' : ''}{goal.trend.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={Math.min(goal.percentage, 100)}
                  className={cn(
                    'h-2',
                    goal.percentage >= 100 && '[&>div]:bg-green-500'
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion by Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversions par source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionsData?.bySource?.map(source => (
              <div key={source.source} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="font-medium capitalize">{source.source}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{source.conversions} conversions</span>
                  <Badge variant="outline">{source.rate.toFixed(2)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConversionFunnel;
