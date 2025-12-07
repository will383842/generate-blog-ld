/**
 * Publishing Dashboard Page
 * Main overview of publishing system with stats and quick actions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Globe,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Settings,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePublishing } from '@/hooks/usePublishing';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PublishingIndexPage() {
  const { stats, isLoading, refetch } = usePublishing();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6" />
            Publication
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerez la publication de vos contenus sur les differentes plateformes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings/publication">
              <Settings className="h-4 w-4 mr-2" />
              Parametres
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {stats?.failed_count > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  {stats.failed_count} publication(s) en echec
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Ces publications necessitent une attention particuliere
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link to="/publishing/queue?status=failed">
                Voir les echecs
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-3xl font-bold">{stats?.pending_count || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Publiees aujourd'hui</p>
                <p className="text-3xl font-bold">{stats?.published_today || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planifiees</p>
                <p className="text-3xl font-bold">{stats?.scheduled_count || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Echecs</p>
                <p className="text-3xl font-bold text-red-600">{stats?.failed_count || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/publishing/queue">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Queue de publication</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.pending_count || 0} en attente
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/publishing/platforms">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Plateformes</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.platforms_count || 0} configurees
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/publishing/endpoints">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <Server className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Endpoints</p>
                <p className="text-sm text-muted-foreground">
                  APIs de publication
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics/publishing">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Statistiques</p>
                <p className="text-sm text-muted-foreground">
                  Performances
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Publications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Publications recentes</CardTitle>
              <CardDescription>Dernieres publications effectuees</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/publishing/queue?status=published">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recent_publications && stats.recent_publications.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_publications.slice(0, 5).map((pub: { id: number; title: string; platform_name: string; published_at: string }) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pub.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {pub.platform_name} - {new Date(pub.published_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Publie
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Aucune publication recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Prochaines publications</CardTitle>
              <CardDescription>Publications planifiees</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/publishing/queue?status=scheduled">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.upcoming_publications && stats.upcoming_publications.length > 0 ? (
              <div className="space-y-3">
                {stats.upcoming_publications.slice(0, 5).map((pub: { id: number; title: string; platform_name: string; scheduled_at: string }) => (
                  <div
                    key={pub.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pub.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {pub.platform_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(pub.scheduled_at).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Aucune publication planifiee</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      {stats?.weekly_trend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendance hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {stats.weekly_trend.map((day: { day: string; count: number }, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {day.day}
                  </div>
                  <div
                    className="h-16 bg-primary/20 rounded relative"
                    style={{
                      background: `linear-gradient(to top, hsl(var(--primary)) ${(day.count / Math.max(...stats.weekly_trend.map((d: { count: number }) => d.count || 1))) * 100}%, transparent 0%)`,
                    }}
                  />
                  <div className="text-sm font-medium mt-1">{day.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
