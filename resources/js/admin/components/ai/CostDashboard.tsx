/**
 * Cost Dashboard Component
 * File 303 - Visualize AI costs, breakdowns, and predictions
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  PieChart,
  Calendar,
  Target,
  Lightbulb,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  useDailyCosts,
  useMonthlyCosts,
  useCostPredictions,
  useCostBreakdown,
  useCostAlerts,
  useAcknowledgeCostAlert,
  CostBreakdown,
} from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

interface CostDashboardProps {
  compact?: boolean;
}

export function CostDashboard({ compact = false }: CostDashboardProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // API hooks
  const { data: dailyCosts } = useDailyCosts(period === '7d' ? 7 : period === '30d' ? 30 : 90);
  const { data: monthlyCosts } = useMonthlyCosts(12);
  const { data: predictions } = useCostPredictions();
  const { data: breakdown } = useCostBreakdown(period);
  const { data: alerts } = useCostAlerts();
  const acknowledgeAlert = useAcknowledgeCostAlert();

  // Calculate totals
  const totalPeriod = dailyCosts?.reduce((sum, d) => sum + d.total, 0) || 0;
  const avgDaily = dailyCosts?.length ? totalPeriod / dailyCosts.length : 0;
  const currentMonth = monthlyCosts?.[0];

  // API colors
  const apiColors: Record<string, string> = {
    openai: '#10B981',
    anthropic: '#F59E0B',
    perplexity: '#8B5CF6',
    dalle: '#EC4899',
    other: '#6B7280',
  };

  // Calculate pie chart segments
  const getPieSegments = (breakdown: CostBreakdown) => {
    const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
    let currentAngle = 0;
    
    return Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => {
        const percentage = (value / total) * 100;
        const angle = (percentage / 100) * 360;
        const segment = {
          key,
          value,
          percentage,
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
          color: apiColors[key] || '#6B7280',
        };
        currentAngle += angle;
        return segment;
      });
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Coûts IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">${totalPeriod.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Ce mois</p>
            </div>
            {predictions && (
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {predictions.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : predictions.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : null}
                  <span className="text-sm">${predictions.end_of_month.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Prévision fin mois</p>
              </div>
            )}
          </div>
          {breakdown && (
            <div className="space-y-2">
              {Object.entries(breakdown)
                .filter(([_, v]) => v > 0)
                .slice(0, 3)
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: apiColors[key] }}
                      />
                      <span className="capitalize">{key}</span>
                    </div>
                    <span>${value.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Tableau de bord des coûts</h2>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts */}
      {alerts && alerts.filter(a => !a.acknowledged_at).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <Bell className="h-4 w-4" />
              Alertes actives ({alerts.filter(a => !a.acknowledged_at).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts
              .filter(a => !a.acknowledged_at)
              .slice(0, 3)
              .map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      'h-4 w-4',
                      alert.severity === 'critical' && 'text-red-600',
                      alert.severity === 'warning' && 'text-yellow-600',
                      alert.severity === 'info' && 'text-blue-600'
                    )} />
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                    disabled={acknowledgeAlert.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total période</p>
            <p className="text-2xl font-bold">${totalPeriod.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Moyenne ${avgDaily.toFixed(2)}/jour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ce mois</p>
            <p className="text-2xl font-bold">${currentMonth?.total.toFixed(2) || '0.00'}</p>
            {currentMonth?.budget && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Budget</span>
                  <span>{currentMonth.budget_percent?.toFixed(0)}%</span>
                </div>
                <Progress
                  value={currentMonth.budget_percent || 0}
                  className={cn(
                    'h-1',
                    (currentMonth.budget_percent || 0) > 90 && '[&>div]:bg-red-500',
                    (currentMonth.budget_percent || 0) > 75 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Prévision fin mois</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">${predictions?.end_of_month.toFixed(2) || '0.00'}</p>
              {predictions && (
                predictions.trend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : predictions.trend === 'down' ? (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                ) : null
              )}
            </div>
            {predictions && (
              <Badge
                variant="outline"
                className={cn(
                  'mt-1',
                  predictions.confidence >= 80 && 'border-green-500 text-green-600',
                  predictions.confidence >= 60 && predictions.confidence < 80 && 'border-yellow-500 text-yellow-600',
                  predictions.confidence < 60 && 'border-red-500 text-red-600'
                )}
              >
                {predictions.confidence}% confiance
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Tendance</p>
            <div className="flex items-center gap-2">
              <p className={cn(
                'text-2xl font-bold',
                (currentMonth?.trend || 0) > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {(currentMonth?.trend || 0) > 0 ? '+' : ''}{currentMonth?.trend?.toFixed(1) || 0}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs mois précédent</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Costs Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coûts journaliers</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyCosts && dailyCosts.length > 0 ? (
              <div className="h-48 flex items-end gap-1">
                {dailyCosts.map((day, idx) => {
                  const maxCost = Math.max(...dailyCosts.map(d => d.total));
                  const height = maxCost > 0 ? (day.total / maxCost) * 100 : 0;
                  return (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
                            <div
                              className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                              style={{ height: `${height}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                            />
                            {idx % 5 === 0 && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(day.date).getDate()}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                          <p>${day.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {day.requests_count} requêtes
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Pas de données
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Répartition par API
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown ? (
              <div className="flex items-center gap-8">
                {/* SVG Pie Chart */}
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {getPieSegments(breakdown).map((segment, idx) => {
                      const startAngle = (segment.startAngle * Math.PI) / 180;
                      const endAngle = (segment.endAngle * Math.PI) / 180;
                      const x1 = 50 + 40 * Math.cos(startAngle);
                      const y1 = 50 + 40 * Math.sin(startAngle);
                      const x2 = 50 + 40 * Math.cos(endAngle);
                      const y2 = 50 + 40 * Math.sin(endAngle);
                      const largeArc = segment.percentage > 50 ? 1 : 0;
                      
                      return (
                        <path
                          key={segment.key}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={segment.color}
                          className="transition-opacity hover:opacity-80"
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="20" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">${totalPeriod.toFixed(0)}</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {getPieSegments(breakdown).map(segment => (
                    <div key={segment.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="capitalize text-sm">{segment.key}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">${segment.value.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({segment.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Pas de données
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictions & Recommendations */}
      {predictions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prediction Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Facteurs de prédiction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {predictions.factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <Lightbulb className="h-4 w-4" />
                Opportunités d'économie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {predictions.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                    <Check className="h-4 w-4 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default CostDashboard;
