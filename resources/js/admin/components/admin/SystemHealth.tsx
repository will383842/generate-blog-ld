/**
 * System Health Component
 * File 350 - System health monitoring dashboard
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HealthGauge } from './HealthGauge';
import {
  useServerHealth,
  useDatabaseStatus,
  useRedisStatus,
  useApisStatus,
  useAlerts,
  useAcknowledgeAlert,
  useFlushCache,
  useRestartWorker,
} from '@/hooks/useSystem';
import { cn } from '@/lib/utils';

interface SystemHealthProps {
  compact?: boolean;
}

export function SystemHealth({ compact = false }: SystemHealthProps) {
  const { t } = useTranslation();

  const { data: serverHealth, refetch: refetchHealth } = useServerHealth();
  const { data: dbStatus } = useDatabaseStatus();
  const { data: redisStatus } = useRedisStatus();
  const { data: apis } = useApisStatus();
  const { data: alerts } = useAlerts();

  const acknowledgeAlert = useAcknowledgeAlert();
  const flushCache = useFlushCache();
  const restartWorker = useRestartWorker();

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      operational: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      down: 'bg-red-100 text-red-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  // Unacknowledged alerts
  const unacknowledgedAlerts = alerts?.filter(a => !a.acknowledged) || [];

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Santé système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{serverHealth?.cpu.usage || 0}%</p>
              <p className="text-xs text-muted-foreground">CPU</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{serverHealth?.memory.percentage || 0}%</p>
              <p className="text-xs text-muted-foreground">RAM</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{serverHealth?.disk.percentage || 0}%</p>
              <p className="text-xs text-muted-foreground">Disque</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              Alertes actives ({unacknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.slice(0, 3).map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                  >
                    Acquitter
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">CPU</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthGauge
              value={serverHealth?.cpu.usage || 0}
              max={100}
              label="Utilisation CPU"
              thresholds={{ warning: 70, critical: 90 }}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>{serverHealth?.cpu.cores || 0} cœurs</p>
              <p>Load: {serverHealth?.cpu.loadAverage?.join(', ') || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Mémoire RAM</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthGauge
              value={serverHealth?.memory.percentage || 0}
              max={100}
              label="Utilisation RAM"
              thresholds={{ warning: 75, critical: 90 }}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>{formatBytes(serverHealth?.memory.used || 0)} / {formatBytes(serverHealth?.memory.total || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Disque</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthGauge
              value={serverHealth?.disk.percentage || 0}
              max={100}
              label="Utilisation disque"
              thresholds={{ warning: 80, critical: 95 }}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>{formatBytes(serverHealth?.disk.used || 0)} / {formatBytes(serverHealth?.disk.total || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Base de données</span>
              </div>
              {getStatusIcon(dbStatus?.status || 'down')}
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Connexions</span>
                <span>{dbStatus?.connections.active || 0} / {dbStatus?.connections.max || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Taille</span>
                <span>{formatBytes(dbStatus?.size || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Slow queries</span>
                <span className={dbStatus?.slowQueries ? 'text-yellow-600' : ''}>
                  {dbStatus?.slowQueries || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Redis Cache</span>
              </div>
              {getStatusIcon(redisStatus?.status || 'down')}
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Mémoire</span>
                <span>{formatBytes(redisStatus?.memory.used || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Clés</span>
                <span>{redisStatus?.keys?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Hit rate</span>
                <span className="text-green-600">{redisStatus?.hitRate?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APIs */}
        {apis?.slice(0, 2).map(api => (
          <Card key={api.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{api.name}</span>
                </div>
                {getStatusIcon(api.status)}
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Latence</span>
                  <span>{api.latency || '-'} ms</span>
                </div>
                {api.quotaLimit && (
                  <div className="flex justify-between">
                    <span>Quota</span>
                    <span>{api.quotaUsed || 0} / {api.quotaLimit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Erreurs</span>
                  <span className={api.errorRate && api.errorRate > 1 ? 'text-red-600' : ''}>
                    {api.errorRate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Actions de maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => refetchHealth()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              onClick={() => flushCache.mutate(undefined)}
              disabled={flushCache.isPending}
            >
              {flushCache.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Vider le cache
            </Button>
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              Uptime: {formatUptime(serverHealth?.uptime || 0)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SystemHealth;
