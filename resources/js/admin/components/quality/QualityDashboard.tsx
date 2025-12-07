/**
 * Quality Dashboard Component
 * File 268 - Overview dashboard with scores, trends, and alerts
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Loader2,
  BarChart3,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useQualityDashboard, useRevalidate } from '@/hooks/useQuality';
import {
  QUALITY_CRITERIA,
  QualityCheck,
  getScoreColor,
  getScoreLabel,
  getQualityStatusColor,
} from '@/types/quality';
import { cn } from '@/lib/utils';

interface QualityDashboardProps {
  platformId: number;
}

export function QualityDashboard({ platformId }: QualityDashboardProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading, refetch } = useQualityDashboard(platformId);
  const revalidate = useRevalidate();

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
          <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vue d'ensemble qualité</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total_checks} vérifications au total
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <Gauge
                className="h-12 w-12 mx-auto mb-2"
                style={{ color: getScoreColor(stats.average_score) }}
              />
              <div
                className="text-4xl font-bold"
                style={{ color: getScoreColor(stats.average_score) }}
              >
                {stats.average_score}
              </div>
              <p className="text-sm text-muted-foreground">Score moyen</p>
              {stats.trend && (
                <Badge
                  variant={stats.trend.direction === 'up' ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {stats.trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stats.trend.change}% sur {stats.trend.period}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Counts */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Validés</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.passed_count}</div>
            <Progress
              value={(stats.passed_count / Math.max(stats.total_checks, 1)) * 100}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Attention</span>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.warning_count}</div>
            <Progress
              value={(stats.warning_count / Math.max(stats.total_checks, 1)) * 100}
              className="mt-2 h-1 [&>div]:bg-yellow-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Échecs</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failed_count}</div>
            <Progress
              value={(stats.failed_count / Math.max(stats.total_checks, 1)) * 100}
              className="mt-2 h-1 [&>div]:bg-red-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Criteria Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scores par critère</CardTitle>
          <CardDescription>Performance moyenne sur les 6 critères de qualité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {QUALITY_CRITERIA.map(criterion => {
              const score = stats.scores_by_criterion[criterion.key] || 0;
              return (
                <div
                  key={criterion.key}
                  className="text-center p-4 rounded-lg bg-muted"
                >
                  <div
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(score) }}
                  >
                    {score}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{criterion.label}</p>
                  <Progress
                    value={score}
                    className="mt-2 h-1"
                    style={{
                      ['--progress-background' as keyof React.CSSProperties]: getScoreColor(score),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution des scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.distribution.excellent}</div>
              <p className="text-xs text-muted-foreground">Excellent (90-100)</p>
              <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(stats.distribution.excellent / Math.max(stats.total_checks, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.distribution.good}</div>
              <p className="text-xs text-muted-foreground">Bon (70-89)</p>
              <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(stats.distribution.good / Math.max(stats.total_checks, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{stats.distribution.average}</div>
              <p className="text-xs text-muted-foreground">Moyen (50-69)</p>
              <div className="mt-2 h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${(stats.distribution.average / Math.max(stats.total_checks, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{stats.distribution.poor}</div>
              <p className="text-xs text-muted-foreground">Insuffisant (0-49)</p>
              <div className="mt-2 h-2 bg-red-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${(stats.distribution.poor / Math.max(stats.total_checks, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Score Alerts */}
        {stats.low_score_alerts && stats.low_score_alerts.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Alertes scores bas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.low_score_alerts.slice(0, 5).map(check => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/quality/checks/${check.id}`}
                        className="font-medium text-sm hover:underline truncate block"
                      >
                        {check.article_title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {check.content_type} • {new Date(check.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{check.overall_score}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revalidate.mutate(check.article_id)}
                        disabled={revalidate.isPending}
                      >
                        <RefreshCw className={cn('h-3 w-3', revalidate.isPending && 'animate-spin')} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {stats.low_score_alerts.length > 5 && (
                <Button variant="link" asChild className="mt-2 p-0">
                  <Link to="/quality/checks?status=failed">
                    Voir tous ({stats.low_score_alerts.length}) →
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Vérifications récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_checks.slice(0, 5).map(check => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/quality/checks/${check.id}`}
                      className="font-medium text-sm hover:underline truncate block"
                    >
                      {check.article_title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(check.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getScoreColor(check.overall_score),
                      color: getScoreColor(check.overall_score),
                    }}
                  >
                    {check.overall_score}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="link" asChild className="mt-2 p-0">
              <Link to="/quality/checks">
                Voir toutes les vérifications →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/quality/checks">
                <BarChart3 className="h-4 w-4 mr-2" />
                Toutes les vérifications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/quality/golden">
                <FileText className="h-4 w-4 mr-2" />
                Exemples dorés
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/quality/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/quality/feedback">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Feedback
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QualityDashboard;
