/**
 * Research Dashboard Component
 * File 286 - Overview dashboard with stats, cache, and recent queries
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Search,
  Database,
  Clock,
  DollarSign,
  Zap,
  RefreshCw,
  Loader2,
  ArrowRight,
  TrendingUp,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { useResearchDashboard, useSearch } from '@/hooks/useResearch';
import { formatCost, formatBytes, getSourceTypeMetadata } from '@/types/research';
import { cn } from '@/lib/utils';

interface ResearchDashboardProps {
  platformId: number;
}

export function ResearchDashboard({ platformId }: ResearchDashboardProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // API hooks
  const { data: stats, isLoading, refetch } = useResearchDashboard(platformId);
  const search = useSearch();

  // Handle quick search
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search.mutate({ query: searchQuery.trim() });
      setSearchQuery('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vue d'ensemble recherche</h2>
          <p className="text-sm text-muted-foreground">
            {stats.active_sources_count} source(s) active(s) sur {stats.sources_count}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Quick Search */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleQuickSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Recherche rapide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={search.isPending || !searchQuery.trim()}>
              {search.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Rechercher'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requêtes aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.queries_today}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.queries_this_week} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coût aujourd'hui</p>
                <p className="text-2xl font-bold">{formatCost(stats.cost_today)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatCost(stats.cost_this_week)} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
                <p className="text-2xl font-bold">{stats.avg_response_time}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total requêtes</p>
                <p className="text-2xl font-bold">{stats.total_queries}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatCost(stats.total_cost)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Taux de hit</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-green-600">
                  {(stats.cache_stats.hit_rate * 100).toFixed(1)}%
                </p>
              </div>
              <Progress
                value={stats.cache_stats.hit_rate * 100}
                className="mt-2 h-2"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entrées</p>
              <p className="text-2xl font-bold">{stats.cache_stats.total_entries}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.cache_stats.hit_count} hits / {stats.cache_stats.miss_count} miss
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilisation</p>
              <p className="text-2xl font-bold">
                {stats.cache_stats.usage_percent.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(stats.cache_stats.total_size_bytes)} / {formatBytes(stats.cache_stats.max_size_bytes)}
              </p>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/research/analytics">
                  Gérer le cache
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Sources & Recent Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Sources les plus utilisées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_sources.slice(0, 5).map((source, idx) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-4">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{source.count} requêtes</Badge>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-sm">{source.avg_reliability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" asChild className="mt-2 p-0">
              <Link to="/research/sources">Gérer les sources →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Requêtes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_queries.slice(0, 5).map(query => (
                <div
                  key={query.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{query.query}</p>
                    <p className="text-xs text-muted-foreground">
                      {query.results_count} résultats • {query.duration_ms}ms
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {query.is_from_cache && (
                      <Badge variant="secondary" className="text-xs">Cache</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {formatCost(query.cost)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" asChild className="mt-2 p-0">
              <Link to="/research/queries">Voir l'historique →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      {stats.queries_by_day && stats.queries_by_day.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activité sur 7 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-2">
              {stats.queries_by_day.map((day, idx) => {
                const maxCount = Math.max(...stats.queries_by_day.map(d => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </span>
                    <span className="text-xs font-medium">{day.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ResearchDashboard;
