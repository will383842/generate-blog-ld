/**
 * Publication Queue Stats Component
 * File 371 - Publication queue statistics cards
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Calendar,
  CalendarPlus,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PublicationQueueStats as PublicationQueueStatsType, PublicationQueueItem } from '@/types/automation';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PublicationQueueStatsProps {
  stats: PublicationQueueStatsType;
  upcomingPublications?: PublicationQueueItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function PublicationQueueStats({
  stats,
  upcomingPublications = [],
  isLoading = false,
  onViewAll,
}: PublicationQueueStatsProps) {
  const { t } = useTranslation();

  // Format average time
  const formatAvgTime = (seconds: number) => {
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `~${minutes} min`;
  };

  // Get trend icon
  const TrendIcon = stats.trend === 'up' ? TrendingUp : stats.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'up' ? 'text-green-500' : stats.trend === 'down' ? 'text-red-500' : 'text-gray-500';

  // Stats configuration
  const statCards = [
    {
      label: 'En attente',
      value: stats.pending,
      icon: Clock,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
    {
      label: 'Planifiés',
      value: stats.scheduled,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'En cours',
      value: stats.publishing,
      icon: Loader2,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      animate: stats.publishing > 0,
    },
    {
      label: "Publiés aujourd'hui",
      value: stats.publishedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Échoués',
      value: stats.failed,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      alert: stats.failed > 0,
    },
    {
      label: "Planifiés aujourd'hui",
      value: stats.scheduledToday,
      icon: CalendarPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4">
              <div className="h-8 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={cn(
                'transition-all',
                stat.alert && 'border-red-300 bg-red-50'
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('p-1.5 rounded', stat.bgColor)}>
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        stat.color,
                        stat.animate && 'animate-spin'
                      )}
                    />
                  </div>
                </div>
                <p className={cn('text-2xl font-bold', stat.alert && 'text-red-600')}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats & Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Indicators */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Average Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Temps moyen</span>
                <span className="font-medium">{formatAvgTime(stats.avgPublishTime)}</span>
              </div>

              {/* Success Rate */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taux de succès</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium',
                    stats.successRate >= 95 && 'text-green-600',
                    stats.successRate >= 80 && stats.successRate < 95 && 'text-yellow-600',
                    stats.successRate < 80 && 'text-red-600'
                  )}>
                    {stats.successRate.toFixed(1)}%
                  </span>
                  <TrendIcon className={cn('h-4 w-4', trendColor)} />
                </div>
              </div>

              {/* Mini Sparkline (simplified) */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Publications (24h)</p>
                <div className="flex items-end gap-1 h-12">
                  {stats.hourlyStats.map((hourData, idx) => {
                    const maxCount = Math.max(...stats.hourlyStats.map(h => h.count), 1);
                    const height = (hourData.count / maxCount) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${hourData.hour}h: ${hourData.count}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Publications */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Prochaines publications</CardTitle>
              {onViewAll && (
                <Button variant="ghost" size="sm" onClick={onViewAll} className="h-6 text-xs">
                  Voir tout
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingPublications.length > 0 ? (
              <div className="space-y-3">
                {upcomingPublications.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.article?.title || `Article #${item.articleId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.scheduledAt
                          ? format(new Date(item.scheduledAt), 'HH:mm', { locale: fr })
                          : 'Non planifié'
                        }
                      </p>
                    </div>
                    {item.platform && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.platform.name}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucune publication planifiée
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PublicationQueueStats;
