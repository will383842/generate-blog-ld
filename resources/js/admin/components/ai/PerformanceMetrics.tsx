/**
 * Performance Metrics Component
 * File 304 - Display AI latency, success rate, errors, and queue stats
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  usePerformanceMetrics,
  useQueueStats,
  useErrorStats,
} from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

interface PerformanceMetricsProps {
  compact?: boolean;
}

export function PerformanceMetrics({ compact = false }: PerformanceMetricsProps) {
  const { t } = useTranslation();

  // API hooks
  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics();
  const { data: queueStats, isLoading: queueLoading } = useQueueStats();
  const { data: errorStats, isLoading: errorsLoading } = useErrorStats();

  // Get latency status
  const getLatencyStatus = (latency: number) => {
    if (latency < 500) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (latency < 1000) return { label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (latency < 2000) return { label: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Lent', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // Get success rate status
  const getSuccessStatus = (rate: number) => {
    if (rate >= 99) return { label: 'Excellent', color: 'text-green-600' };
    if (rate >= 95) return { label: 'Bon', color: 'text-blue-600' };
    if (rate >= 90) return { label: 'Acceptable', color: 'text-yellow-600' };
    return { label: 'Critique', color: 'text-red-600' };
  };

  if (metricsLoading) {
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
            <Activity className="h-4 w-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Latence</p>
              <p className={cn('text-xl font-bold', getLatencyStatus(metrics?.latency.avg || 0).color)}>
                {metrics?.latency.avg || 0}ms
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Succès</p>
              <p className={cn('text-xl font-bold', getSuccessStatus(metrics?.success_rate || 0).color)}>
                {metrics?.success_rate.toFixed(1) || 0}%
              </p>
            </div>
          </div>
          {queueStats && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">File d'attente</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{queueStats.pending} en attente</Badge>
                <Badge variant="secondary">{queueStats.processing} en cours</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const latencyStatus = getLatencyStatus(metrics?.latency.avg || 0);
  const successStatus = getSuccessStatus(metrics?.success_rate || 0);

  return (
    <div className="space-y-6">
      {/* Main Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Latency Gauge */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                latencyStatus.bg
              )}>
                <div className="text-center">
                  <p className={cn('text-2xl font-bold', latencyStatus.color)}>
                    {metrics?.latency.avg || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">ms</p>
                </div>
              </div>
              <p className="mt-3 font-medium">Latence moyenne</p>
              <Badge variant="outline" className={cn(latencyStatus.color)}>
                {latencyStatus.label}
              </Badge>
              <div className="flex items-center gap-1 mt-2 text-sm">
                {(metrics?.latency.trend || 0) < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                )}
                <span>{Math.abs(metrics?.latency.trend || 0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate Gauge */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(metrics?.success_rate || 0) * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className={cn('text-xl font-bold', successStatus.color)}>
                    {metrics?.success_rate.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
              <p className="mt-3 font-medium">Taux de succès</p>
              <Badge variant="outline" className={cn(successStatus.color)}>
                {successStatus.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate Gauge */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                (metrics?.error_rate || 0) < 1 ? 'bg-green-100' :
                (metrics?.error_rate || 0) < 5 ? 'bg-yellow-100' : 'bg-red-100'
              )}>
                <div className="text-center">
                  <p className={cn(
                    'text-2xl font-bold',
                    (metrics?.error_rate || 0) < 1 ? 'text-green-600' :
                    (metrics?.error_rate || 0) < 5 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {metrics?.error_rate.toFixed(2) || 0}%
                  </p>
                </div>
              </div>
              <p className="mt-3 font-medium">Taux d'erreur</p>
              <p className="text-sm text-muted-foreground">
                {errorStats?.total_today || 0} erreurs aujourd'hui
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Requests Per Minute */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics?.requests_per_minute || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">req/min</p>
                </div>
              </div>
              <p className="mt-3 font-medium">Débit</p>
              <p className="text-sm text-muted-foreground">
                {metrics?.active_requests || 0} actives
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latency Percentiles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Distribution de latence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{metrics?.latency.p50 || 0}ms</p>
                    <p className="text-sm text-muted-foreground">P50 (médiane)</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>50% des requêtes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{metrics?.latency.avg || 0}ms</p>
                    <p className="text-sm text-muted-foreground">Moyenne</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Moyenne de toutes les requêtes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{metrics?.latency.p95 || 0}ms</p>
                    <p className="text-sm text-muted-foreground">P95</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>95% des requêtes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{metrics?.latency.p99 || 0}ms</p>
                    <p className="text-sm text-muted-foreground">P99</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>99% des requêtes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Queue Stats */}
      {queueStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              File d'attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-700">{queueStats.pending}</p>
                <p className="text-sm text-yellow-600">En attente</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">{queueStats.processing}</p>
                <p className="text-sm text-blue-600">En cours</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-2xl font-bold text-green-700">{queueStats.completed_today}</p>
                <p className="text-sm text-green-600">Complétés (24h)</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-2xl font-bold text-red-700">{queueStats.failed_today}</p>
                <p className="text-sm text-red-600">Échecs (24h)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Temps d'attente moyen</p>
                <p className="text-lg font-semibold">{queueStats.avg_wait_time}s</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps de traitement</p>
                <p className="text-lg font-semibold">{queueStats.avg_process_time}s</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Débit</p>
                <p className="text-lg font-semibold">{queueStats.throughput_per_hour}/h</p>
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Par priorité</p>
              <div className="flex items-center gap-4">
                <Badge variant="destructive">
                  Haute: {queueStats.by_priority.high}
                </Badge>
                <Badge variant="default">
                  Normale: {queueStats.by_priority.normal}
                </Badge>
                <Badge variant="secondary">
                  Basse: {queueStats.by_priority.low}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Stats */}
      {errorStats && errorStats.total_today > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Erreurs récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Type */}
              <div>
                <p className="text-sm font-medium mb-3">Par type</p>
                <div className="space-y-2">
                  {errorStats.by_type.slice(0, 5).map(error => (
                    <div key={error.type} className="flex items-center justify-between">
                      <span className="text-sm">{error.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{error.count}</span>
                        <Badge variant="outline" className="text-xs">
                          {error.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By API */}
              <div>
                <p className="text-sm font-medium mb-3">Par API</p>
                <div className="space-y-2">
                  {errorStats.by_api.map(api => (
                    <div key={api.api}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{api.api}</span>
                        <span className="text-sm">{api.count} ({api.rate.toFixed(2)}%)</span>
                      </div>
                      <Progress value={api.rate} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Errors */}
            {errorStats.recent.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Dernières erreurs</p>
                <div className="space-y-2">
                  {errorStats.recent.slice(0, 5).map(error => (
                    <div
                      key={error.id}
                      className="p-2 rounded-lg bg-red-50 border border-red-200 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="destructive">{error.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-red-700">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trends Chart */}
      {metrics?.trends && metrics.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendances (7 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {metrics.trends.map((point, idx) => {
                const maxLatency = Math.max(...metrics.trends.map(t => t.latency));
                const height = maxLatency > 0 ? (point.latency / maxLatency) * 100 : 0;
                
                return (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'w-full rounded-t transition-all',
                              point.success_rate >= 99 ? 'bg-green-500' :
                              point.success_rate >= 95 ? 'bg-blue-500' :
                              point.success_rate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {new Date(point.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{new Date(point.date).toLocaleDateString()}</p>
                        <p>Latence: {point.latency}ms</p>
                        <p>Succès: {point.success_rate.toFixed(1)}%</p>
                        <p>Requêtes: {point.requests}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PerformanceMetrics;
