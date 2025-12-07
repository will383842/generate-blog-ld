/**
 * Publishing Dashboard Component
 * File 377 - Publishing overview and quick actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Send,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Progress';
import {
  usePlatforms,
  usePublishingStats,
  useRetryPublish,
} from '@/hooks/usePublishing';
import { PLATFORM_TYPE_CONFIG, PUBLISH_STATUS_CONFIG } from '@/types/publishing';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PublishingDashboardProps {
  onQuickPublish?: () => void;
}

export function PublishingDashboard({ onQuickPublish }: PublishingDashboardProps) {
  const { t } = useTranslation();

  const { data: platforms, isLoading: platformsLoading } = usePlatforms();
  const { data: stats, isLoading: statsLoading } = usePublishingStats();
  const retryPublish = useRetryPublish();

  // Get active platforms
  const activePlatforms = platforms?.filter(p => p.isActive) || [];

  if (platformsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.today || 0}</p>
            <p className="text-xs text-muted-foreground">Publiés aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-blue-100">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-yellow-100">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className={cn(
              'text-2xl font-bold',
              (stats?.successRate || 0) >= 95 && 'text-green-600',
              (stats?.successRate || 0) >= 80 && (stats?.successRate || 0) < 95 && 'text-yellow-600',
              (stats?.successRate || 0) < 80 && 'text-red-600'
            )}>
              {stats?.successRate?.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taux de succès</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Platforms */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Plateformes connectées
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/publishing/platforms">
                  Gérer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activePlatforms.length > 0 ? (
              <div className="space-y-3">
                {activePlatforms.slice(0, 5).map(platform => (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
                        {PLATFORM_TYPE_CONFIG[platform.type]?.icon || '🔗'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.baseUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {platform.articlesCount} articles
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          platform.successRate >= 95 && 'bg-green-50 text-green-700 border-green-200',
                          platform.successRate >= 80 && platform.successRate < 95 && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                          platform.successRate < 80 && 'bg-red-50 text-red-700 border-red-200'
                        )}
                      >
                        {platform.successRate.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune plateforme connectée</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link to="/publishing/platforms">Ajouter une plateforme</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Queue de publication
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/publishing/queue">
                  Voir tout
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xl font-bold">{stats?.byStatus?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-600">{stats?.byStatus?.scheduled || 0}</p>
                <p className="text-xs text-muted-foreground">Planifiés</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">{stats?.byStatus?.failed || 0}</p>
                <p className="text-xs text-muted-foreground">Échoués</p>
              </div>
            </div>

            {/* Recent Errors */}
            {stats?.recentErrors && stats.recentErrors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Erreurs récentes
                </p>
                {stats.recentErrors.slice(0, 3).map(error => (
                  <div
                    key={error.id}
                    className="flex items-center justify-between p-2 bg-red-50 rounded-lg text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-red-800">{error.error}</p>
                      <p className="text-xs text-red-600">
                        {error.platformName} • {formatDistanceToNow(new Date(error.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryPublish.mutate({ id: error.id })}
                      disabled={retryPublish.isPending}
                    >
                      <RefreshCw className={cn(
                        'h-4 w-4',
                        retryPublish.isPending && 'animate-spin'
                      )} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats */}
      {stats?.byPlatform && stats.byPlatform.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publications par plateforme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byPlatform.map(platform => {
                const maxCount = Math.max(...stats.byPlatform.map(p => p.count));
                return (
                  <div key={platform.platformId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{platform.platformName}</span>
                      <div className="flex items-center gap-2">
                        <span>{platform.count} publications</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            platform.successRate >= 95 && 'bg-green-50 text-green-700',
                            platform.successRate >= 80 && platform.successRate < 95 && 'bg-yellow-50 text-yellow-700',
                            platform.successRate < 80 && 'bg-red-50 text-red-700'
                          )}
                        >
                          {platform.successRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={(platform.count / maxCount) * 100}
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        {onQuickPublish && (
          <Button onClick={onQuickPublish}>
            <Send className="h-4 w-4 mr-2" />
            Publication rapide
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/publishing/scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Voir le calendrier
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/publishing/history">
            <ExternalLink className="h-4 w-4 mr-2" />
            Historique complet
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default PublishingDashboard;
