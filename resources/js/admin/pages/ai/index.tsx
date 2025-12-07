/**
 * AI Dashboard Index Page
 * File 306 - Overview of AI systems with stats and quick access
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Brain,
  Settings,
  DollarSign,
  Activity,
  Zap,
  FileText,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  useDailyCosts,
  usePerformanceMetrics,
  useApiHealth,
  useCostAlerts,
  useModelConfigs,
} from '@/hooks/useMonitoring';
import { CostDashboard } from '@/components/ai/CostDashboard';
import { PerformanceMetrics } from '@/components/ai/PerformanceMetrics';
import { ApiHealthStatus } from '@/components/ai/ApiHealthStatus';
import { cn } from '@/lib/utils';

export default function AIIndexPage() {
  const { t } = useTranslation();

  // API hooks
  const { data: dailyCosts } = useDailyCosts(7);
  const { data: metrics } = usePerformanceMetrics();
  const { data: apis } = useApiHealth();
  const { data: alerts } = useCostAlerts();
  const { data: configs } = useModelConfigs();

  // Calculate stats
  const totalCost7d = dailyCosts?.reduce((sum, d) => sum + d.total, 0) || 0;
  const activeAlerts = alerts?.filter(a => !a.acknowledged_at).length || 0;
  const apisOperational = apis?.filter(a => a.status === 'operational').length || 0;
  const totalApis = apis?.length || 0;

  // Get overall health status
  const getOverallHealth = () => {
    if (apis?.some(a => a.status === 'down')) return 'critical';
    if (apis?.some(a => a.status === 'degraded')) return 'degraded';
    if ((metrics?.success_rate || 0) < 95) return 'degraded';
    return 'healthy';
  };

  const overallHealth = getOverallHealth();
  const healthConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', label: 'Tout est opérationnel', icon: CheckCircle },
    degraded: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Performance dégradée', icon: AlertTriangle },
    critical: { color: 'text-red-600', bg: 'bg-red-100', label: 'Incident en cours', icon: AlertTriangle },
  }[overallHealth];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Intelligence Artificielle
          </h1>
          <p className="text-muted-foreground">
            Gestion et monitoring des services IA
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/ai/models">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Link>
        </Button>
      </div>

      {/* Health Status Banner */}
      <Card className={cn('border-l-4', `border-l-${healthConfig.color.replace('text-', '')}`)}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('p-2 rounded-full', healthConfig.bg)}>
                <healthConfig.icon className={cn('h-6 w-6', healthConfig.color)} />
              </div>
              <div>
                <p className={cn('font-semibold', healthConfig.color)}>
                  {healthConfig.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {apisOperational}/{totalApis} APIs actives • 
                  {metrics?.success_rate.toFixed(1)}% taux de succès •
                  {activeAlerts > 0 ? ` ${activeAlerts} alerte(s)` : ' Aucune alerte'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ai/performance">Voir les détails</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coûts (7j)</p>
                <p className="text-2xl font-bold">${totalCost7d.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latence moy.</p>
                <p className="text-2xl font-bold">{metrics?.latency.avg || 0}ms</p>
              </div>
              <Zap className={cn(
                'h-8 w-8',
                (metrics?.latency.avg || 0) < 500 ? 'text-green-500' :
                (metrics?.latency.avg || 0) < 1000 ? 'text-yellow-500' : 'text-red-500'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">{metrics?.success_rate.toFixed(1) || 0}%</p>
              </div>
              <Activity className={cn(
                'h-8 w-8',
                (metrics?.success_rate || 0) >= 99 ? 'text-green-500' :
                (metrics?.success_rate || 0) >= 95 ? 'text-yellow-500' : 'text-red-500'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modèles actifs</p>
                <p className="text-2xl font-bold">{configs?.length || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costs Quick View */}
        <CostDashboard compact />

        {/* Performance Quick View */}
        <PerformanceMetrics compact />
      </div>

      {/* API Health */}
      <ApiHealthStatus compact />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/ai/models">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Modèles</h3>
                  <p className="text-sm text-muted-foreground">
                    Configuration et A/B testing
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ai/prompts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Prompts</h3>
                  <p className="text-sm text-muted-foreground">
                    Édition et optimisation
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ai/costs">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Coûts</h3>
                  <p className="text-sm text-muted-foreground">
                    Budget et prévisions
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ai/performance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <Activity className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Métriques et santé
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerts Section */}
      {activeAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              Alertes actives ({activeAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts
                ?.filter(a => !a.acknowledged_at)
                .slice(0, 3)
                .map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
            <Button variant="link" asChild className="mt-2 p-0">
              <Link to="/ai/costs">Voir toutes les alertes →</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
