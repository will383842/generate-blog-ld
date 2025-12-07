/**
 * System Admin Page
 * File 358 - System monitoring and maintenance
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Server,
  Database,
  Activity,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SystemHealth } from '@/components/admin/SystemHealth';
import { WorkerStatus } from '@/components/admin/WorkerStatus';
import {
  useServerHealth,
  useDatabaseStatus,
  useRedisStatus,
  useApisStatus,
  useAlerts,
  useBackups,
} from '@/hooks/useSystem';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SystemPage() {
  const { t } = useTranslation();

  const { data: serverHealth, refetch: refetchHealth } = useServerHealth();
  const { data: dbStatus } = useDatabaseStatus();
  const { data: redisStatus } = useRedisStatus();
  const { data: apis } = useApisStatus();
  const { data: alerts } = useAlerts();
  const { data: backups } = useBackups();

  // Get last backup
  const lastBackup = backups?.find(b => b.status === 'completed');

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days} jours ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} minutes`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Unacknowledged alerts count
  const activeAlertsCount = alerts?.filter(a => !a.acknowledged).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Système
          </h1>
          <p className="text-muted-foreground">Surveillance et maintenance du système</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchHealth()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {activeAlertsCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {activeAlertsCount} alerte{activeAlertsCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
          <Link to="/admin/errors">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Erreurs</p>
                  <p className="text-sm text-muted-foreground">Voir les logs</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
          <Link to="/admin/backups">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Sauvegardes</p>
                  <p className="text-sm text-muted-foreground">Gérer les backups</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
          <Link to="/admin/activity">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Activité</p>
                  <p className="text-sm text-muted-foreground">Voir les logs</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Uptime</p>
                <p className="text-sm text-muted-foreground">
                  {formatUptime(serverHealth?.uptime || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <SystemHealth />

      {/* Workers Status */}
      <WorkerStatus />

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Base de données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={cn(
                  dbStatus?.status === 'healthy' && 'bg-green-100 text-green-800',
                  dbStatus?.status === 'degraded' && 'bg-yellow-100 text-yellow-800',
                  dbStatus?.status === 'down' && 'bg-red-100 text-red-800'
                )}>
                  {dbStatus?.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connexions</span>
                <span className="text-sm font-medium">
                  {dbStatus?.connections.active || 0} / {dbStatus?.connections.max || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taille</span>
                <span className="text-sm font-medium">{formatBytes(dbStatus?.size || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tables</span>
                <span className="text-sm font-medium">{dbStatus?.tables || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Slow queries</span>
                <span className={cn(
                  'text-sm font-medium',
                  (dbStatus?.slowQueries || 0) > 0 && 'text-yellow-600'
                )}>
                  {dbStatus?.slowQueries || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Redis Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={cn(
                  redisStatus?.status === 'healthy' && 'bg-green-100 text-green-800',
                  redisStatus?.status === 'degraded' && 'bg-yellow-100 text-yellow-800',
                  redisStatus?.status === 'down' && 'bg-red-100 text-red-800'
                )}>
                  {redisStatus?.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mémoire</span>
                <span className="text-sm font-medium">
                  {formatBytes(redisStatus?.memory.used || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clés</span>
                <span className="text-sm font-medium">
                  {redisStatus?.keys?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hit rate</span>
                <span className="text-sm font-medium text-green-600">
                  {redisStatus?.hitRate?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium">
                  {formatUptime(redisStatus?.uptime || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Dernière sauvegarde
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastBackup ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(new Date(lastBackup.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{lastBackup.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taille</span>
                  <span className="text-sm font-medium">{formatBytes(lastBackup.size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cloud</span>
                  <Badge className={lastBackup.cloudSynced ? 'bg-green-100 text-green-800' : ''}>
                    {lastBackup.cloudSynced ? 'Synchronisé' : 'Local'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/admin/backups">Gérer les sauvegardes</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune sauvegarde</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link to="/admin/backups">Créer une sauvegarde</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* APIs Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status des APIs externes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {apis?.map(api => (
              <div
                key={api.id}
                className={cn(
                  'p-4 rounded-lg border',
                  api.status === 'operational' && 'border-green-200 bg-green-50',
                  api.status === 'degraded' && 'border-yellow-200 bg-yellow-50',
                  api.status === 'down' && 'border-red-200 bg-red-50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{api.name}</span>
                  <Badge className={cn(
                    api.status === 'operational' && 'bg-green-100 text-green-800',
                    api.status === 'degraded' && 'bg-yellow-100 text-yellow-800',
                    api.status === 'down' && 'bg-red-100 text-red-800'
                  )}>
                    {api.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Latence</span>
                    <span>{api.latency || '-'} ms</span>
                  </div>
                  {api.quotaLimit && (
                    <div className="flex justify-between">
                      <span>Quota</span>
                      <span>{api.quotaUsed} / {api.quotaLimit}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
