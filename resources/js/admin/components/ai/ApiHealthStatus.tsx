/**
 * API Health Status Component
 * File 305 - Monitor health status of external AI APIs
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
  TrendingUp,
  ExternalLink,
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
import { useApiHealth, usePingApi, ApiHealth } from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

interface ApiHealthStatusProps {
  compact?: boolean;
}

export function ApiHealthStatus({ compact = false }: ApiHealthStatusProps) {
  const { t } = useTranslation();

  // API hooks
  const { data: apis, isLoading, refetch } = useApiHealth();
  const pingApi = usePingApi();

  // Get status config
  const getStatusConfig = (status: ApiHealth['status']) => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          label: 'Opérationnel',
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          label: 'Dégradé',
        };
      case 'down':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          label: 'Hors service',
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          label: 'Inconnu',
        };
    }
  };

  // Get API logo/color
  const getApiStyle = (api: string) => {
    const styles: Record<string, { color: string; bg: string }> = {
      openai: { color: '#10A37F', bg: '#ECFDF5' },
      anthropic: { color: '#D97706', bg: '#FEF3C7' },
      perplexity: { color: '#7C3AED', bg: '#EDE9FE' },
      'dall-e': { color: '#EC4899', bg: '#FCE7F3' },
      google: { color: '#4285F4', bg: '#DBEAFE' },
    };
    return styles[api.toLowerCase()] || { color: '#6B7280', bg: '#F3F4F6' };
  };

  // Format time since
  const formatTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
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
            <Activity className="h-4 w-4" />
            Status APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {apis?.map(api => {
              const statusConfig = getStatusConfig(api.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={api.api}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                    <span className="font-medium capitalize">{api.api}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{api.latency}ms</span>
                    <Badge className={cn(statusConfig.bg, statusConfig.color, 'text-xs')}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall status
  const overallStatus = apis?.every(a => a.status === 'operational')
    ? 'operational'
    : apis?.some(a => a.status === 'down')
    ? 'down'
    : 'degraded';
  const overallConfig = getStatusConfig(overallStatus);
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={cn('border-2', overallConfig.border)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn('p-3 rounded-full', overallConfig.bg)}>
                <OverallIcon className={cn('h-8 w-8', overallConfig.color)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Tous les systèmes {overallConfig.label.toLowerCase()}s
                </h3>
                <p className="text-sm text-muted-foreground">
                  {apis?.filter(a => a.status === 'operational').length} sur {apis?.length} APIs actives
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apis?.map(api => {
          const statusConfig = getStatusConfig(api.status);
          const apiStyle = getApiStyle(api.api);
          const StatusIcon = statusConfig.icon;
          
          return (
            <Card key={api.api} className={cn('border-l-4', statusConfig.border)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: apiStyle.bg }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: apiStyle.color }}
                      >
                        {api.api.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base capitalize">{api.api}</CardTitle>
                    </div>
                  </div>
                  <Badge className={cn(statusConfig.bg, statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Latency */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>Latence</span>
                  </div>
                  <span className={cn(
                    'font-medium',
                    api.latency < 500 ? 'text-green-600' :
                    api.latency < 1000 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {api.latency}ms
                  </span>
                </div>

                {/* Error Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Taux d'erreur (24h)</span>
                    <span className={cn(
                      'text-sm font-medium',
                      api.error_rate_24h < 1 ? 'text-green-600' :
                      api.error_rate_24h < 5 ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {api.error_rate_24h.toFixed(2)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(api.error_rate_24h * 10, 100)}
                    className={cn(
                      'h-1',
                      api.error_rate_24h < 1 && '[&>div]:bg-green-500',
                      api.error_rate_24h >= 1 && api.error_rate_24h < 5 && '[&>div]:bg-yellow-500',
                      api.error_rate_24h >= 5 && '[&>div]:bg-red-500'
                    )}
                  />
                </div>

                {/* Requests */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requêtes (24h)</span>
                  <span className="font-medium">{api.requests_24h.toLocaleString()}</span>
                </div>

                {/* Uptime */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uptime (30j)</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className={cn(
                            api.uptime_30d >= 99.9 && 'border-green-500 text-green-600',
                            api.uptime_30d >= 99 && api.uptime_30d < 99.9 && 'border-yellow-500 text-yellow-600',
                            api.uptime_30d < 99 && 'border-red-500 text-red-600'
                          )}
                        >
                          {api.uptime_30d.toFixed(2)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Disponibilité sur les 30 derniers jours
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Last Events */}
                <div className="pt-3 border-t space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dernier succès</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {formatTimeSince(api.last_success)}
                    </span>
                  </div>
                  {api.last_error && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dernière erreur</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            Voir
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs break-words">{api.last_error}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>

                {/* Ping Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => pingApi.mutate(api.api)}
                  disabled={pingApi.isPending}
                >
                  {pingApi.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Tester la connexion
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts Section */}
      {apis?.some(a => a.status !== 'operational') && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              Alertes actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {apis
                .filter(a => a.status !== 'operational')
                .map(api => (
                  <div
                    key={api.api}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border"
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className={cn(
                        'h-5 w-5',
                        api.status === 'down' ? 'text-red-600' : 'text-yellow-600'
                      )} />
                      <div>
                        <p className="font-medium capitalize">{api.api}</p>
                        <p className="text-sm text-muted-foreground">
                          {api.status === 'down' ? 'Service indisponible' : 'Performance dégradée'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={api.status === 'down' ? 'destructive' : 'default'}>
                      {api.status === 'down' ? 'Critique' : 'Avertissement'}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ApiHealthStatus;
