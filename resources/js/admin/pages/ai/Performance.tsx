/**
 * AI Performance Page
 * File 310 - Full performance monitoring with metrics, API health, queue stats, and recommendations
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Layers,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Server,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  usePerformanceMetrics,
  useQueueStats,
  useErrorStats,
  useApiHealth,
  useSystemHealth,
} from '@/hooks/useMonitoring';
import { PerformanceMetrics } from '@/components/ai/PerformanceMetrics';
import { ApiHealthStatus } from '@/components/ai/ApiHealthStatus';
import { cn } from '@/lib/utils';

export default function AIPerformancePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('metrics');

  const { data: metrics, refetch: refetchMetrics } = usePerformanceMetrics();
  const { data: queueStats, refetch: refetchQueue } = useQueueStats();
  const { data: errorStats } = useErrorStats();
  const { data: apis, refetch: refetchApis } = useApiHealth();
  const { data: systemHealth, refetch: refetchSystem } = useSystemHealth();

  const refreshAll = () => {
    refetchMetrics();
    refetchQueue();
    refetchApis();
    refetchSystem();
  };

  // Get overall status
  const getOverallStatus = () => {
    if (systemHealth?.status === 'critical') return 'critical';
    if (apis?.some(a => a.status === 'down')) return 'critical';
    if (systemHealth?.status === 'degraded') return 'degraded';
    if (apis?.some(a => a.status === 'degraded')) return 'degraded';
    if ((metrics?.success_rate || 0) < 95) return 'degraded';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', label: 'Optimal', icon: CheckCircle },
    degraded: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Dégradé', icon: AlertTriangle },
    critical: { color: 'text-red-600', bg: 'bg-red-100', label: 'Critique', icon: XCircle },
  }[overallStatus];

  // Mock recommendations
  const recommendations = [
    {
      priority: 'high',
      type: 'performance',
      title: 'Optimiser les requêtes OpenAI',
      description: 'La latence moyenne a augmenté de 15%. Considérez l\'utilisation du cache ou la réduction des tokens.',
      action: 'Configurer',
    },
    {
      priority: 'medium',
      type: 'cost',
      title: 'Activer le batching',
      description: 'Regroupez les requêtes similaires pour réduire les coûts de 20%.',
      action: 'Activer',
    },
    {
      priority: 'low',
      type: 'reliability',
      title: 'Ajouter un fallback pour DALL-E',
      description: 'Configurez un modèle de secours pour améliorer la disponibilité.',
      action: 'Configurer',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ai">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Performance IA
            </h1>
            <p className="text-muted-foreground">
              Monitoring en temps réel des services IA
            </p>
          </div>
        </div>
        <Button onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Status Banner */}
      <Card className={cn('border-l-4', `border-l-${statusConfig.color.replace('text-', '')}`)}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('p-2 rounded-full', statusConfig.bg)}>
                <statusConfig.icon className={cn('h-6 w-6', statusConfig.color)} />
              </div>
              <div>
                <p className={cn('font-semibold', statusConfig.color)}>
                  État du système: {statusConfig.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Latence: {metrics?.latency.avg || 0}ms •
                  Succès: {metrics?.success_rate.toFixed(1) || 0}% •
                  Queue: {queueStats?.pending || 0} en attente
                </p>
              </div>
            </div>
            {systemHealth && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span>CPU: {systemHealth.cpu_usage}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span>RAM: {systemHealth.memory_usage}%</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latence</p>
                <p className={cn(
                  'text-2xl font-bold',
                  (metrics?.latency.avg || 0) < 500 ? 'text-green-600' :
                  (metrics?.latency.avg || 0) < 1000 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {metrics?.latency.avg || 0}ms
                </p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Succès</p>
                <p className={cn(
                  'text-2xl font-bold',
                  (metrics?.success_rate || 0) >= 99 ? 'text-green-600' :
                  (metrics?.success_rate || 0) >= 95 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {metrics?.success_rate.toFixed(1) || 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erreurs (24h)</p>
                <p className={cn(
                  'text-2xl font-bold',
                  (errorStats?.total_today || 0) < 10 ? 'text-green-600' :
                  (errorStats?.total_today || 0) < 50 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {errorStats?.total_today || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queue</p>
                <p className="text-2xl font-bold">{queueStats?.pending || 0}</p>
              </div>
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">APIs OK</p>
                <p className="text-2xl font-bold text-green-600">
                  {apis?.filter(a => a.status === 'operational').length || 0}/{apis?.length || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="metrics">
            <Gauge className="h-4 w-4 mr-2" />
            Métriques
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Activity className="h-4 w-4 mr-2" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Layers className="h-4 w-4 mr-2" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            Recommandations
          </TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6">
          <PerformanceMetrics />
        </TabsContent>

        {/* APIs Tab */}
        <TabsContent value="apis" className="mt-6">
          <ApiHealthStatus />
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-6">
          {queueStats && (
            <div className="space-y-6">
              {/* Queue Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-yellow-600">En attente</p>
                    <p className="text-3xl font-bold text-yellow-700">{queueStats.pending}</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-600">En cours</p>
                    <p className="text-3xl font-bold text-blue-700">{queueStats.processing}</p>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-600">Complétés (24h)</p>
                    <p className="text-3xl font-bold text-green-700">{queueStats.completed_today}</p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4">
                    <p className="text-sm text-red-600">Échecs (24h)</p>
                    <p className="text-3xl font-bold text-red-700">{queueStats.failed_today}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Queue Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance de la queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{queueStats.avg_wait_time}s</p>
                      <p className="text-sm text-muted-foreground">Temps d'attente moyen</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{queueStats.avg_process_time}s</p>
                      <p className="text-sm text-muted-foreground">Temps de traitement</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{queueStats.throughput_per_hour}/h</p>
                      <p className="text-sm text-muted-foreground">Débit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribution par priorité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Haute</Badge>
                          <span>{queueStats.by_priority.high} tâches</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {((queueStats.by_priority.high / (queueStats.pending || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={(queueStats.by_priority.high / (queueStats.pending || 1)) * 100}
                        className="h-2 [&>div]:bg-red-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge>Normale</Badge>
                          <span>{queueStats.by_priority.normal} tâches</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {((queueStats.by_priority.normal / (queueStats.pending || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={(queueStats.by_priority.normal / (queueStats.pending || 1)) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Basse</Badge>
                          <span>{queueStats.by_priority.low} tâches</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {((queueStats.by_priority.low / (queueStats.pending || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={(queueStats.by_priority.low / (queueStats.pending || 1)) * 100}
                        className="h-2 [&>div]:bg-gray-400"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <Card
                key={idx}
                className={cn(
                  'border-l-4',
                  rec.priority === 'high' && 'border-l-red-500',
                  rec.priority === 'medium' && 'border-l-yellow-500',
                  rec.priority === 'low' && 'border-l-blue-500'
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'p-2 rounded-lg',
                        rec.priority === 'high' && 'bg-red-100',
                        rec.priority === 'medium' && 'bg-yellow-100',
                        rec.priority === 'low' && 'bg-blue-100'
                      )}>
                        <Lightbulb className={cn(
                          'h-5 w-5',
                          rec.priority === 'high' && 'text-red-600',
                          rec.priority === 'medium' && 'text-yellow-600',
                          rec.priority === 'low' && 'text-blue-600'
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {rec.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {rec.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* System Health Details */}
            {systemHealth && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Santé du système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">CPU</p>
                      <Progress
                        value={systemHealth.cpu_usage}
                        className={cn(
                          'h-2',
                          systemHealth.cpu_usage > 80 && '[&>div]:bg-red-500',
                          systemHealth.cpu_usage > 60 && '[&>div]:bg-yellow-500'
                        )}
                      />
                      <p className="text-sm mt-1">{systemHealth.cpu_usage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mémoire</p>
                      <Progress
                        value={systemHealth.memory_usage}
                        className={cn(
                          'h-2',
                          systemHealth.memory_usage > 80 && '[&>div]:bg-red-500',
                          systemHealth.memory_usage > 60 && '[&>div]:bg-yellow-500'
                        )}
                      />
                      <p className="text-sm mt-1">{systemHealth.memory_usage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Disque</p>
                      <Progress
                        value={systemHealth.disk_usage}
                        className={cn(
                          'h-2',
                          systemHealth.disk_usage > 80 && '[&>div]:bg-red-500',
                          systemHealth.disk_usage > 60 && '[&>div]:bg-yellow-500'
                        )}
                      />
                      <p className="text-sm mt-1">{systemHealth.disk_usage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                      <p className="text-lg font-semibold">
                        {Math.floor(systemHealth.uptime / 86400)}j {Math.floor((systemHealth.uptime % 86400) / 3600)}h
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        systemHealth.database_status === 'connected' && 'bg-green-500',
                        systemHealth.database_status === 'slow' && 'bg-yellow-500',
                        systemHealth.database_status === 'disconnected' && 'bg-red-500'
                      )} />
                      <span className="text-sm">Base de données</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        systemHealth.cache_status === 'connected' && 'bg-green-500',
                        systemHealth.cache_status === 'slow' && 'bg-yellow-500',
                        systemHealth.cache_status === 'disconnected' && 'bg-red-500'
                      )} />
                      <span className="text-sm">Cache</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        systemHealth.queue_status === 'running' && 'bg-green-500',
                        systemHealth.queue_status === 'paused' && 'bg-yellow-500',
                        systemHealth.queue_status === 'stopped' && 'bg-red-500'
                      )} />
                      <span className="text-sm">Queue</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
