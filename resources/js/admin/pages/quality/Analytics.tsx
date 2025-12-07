/**
 * Quality Analytics Page
 * File 283 - Detailed analytics, trends, comparisons and insights
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Loader2,
  Lightbulb,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useQualityDashboard,
  useQualityTrends,
  useQualityChecks,
} from '@/hooks/useQuality';
import { QualityTrends } from '@/components/quality/QualityTrends';
import {
  QUALITY_CRITERIA,
  QualityCriterion,
  getScoreColor,
  getScoreLabel,
} from '@/types/quality';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '3 derniers mois' },
  { value: '1y', label: '1 an' },
];

export default function QualityAnalyticsPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [period, setPeriod] = useState('30d');
  const [comparePeriod, setComparePeriod] = useState<string | null>(null);

  // API hooks
  const { data: stats, isLoading: statsLoading, refetch } = useQualityDashboard(platformId);
  const { data: trends } = useQualityTrends(platformId, period);
  const { data: recentChecks } = useQualityChecks({ platform_id: platformId, per_page: 10 });

  // Calculate insights
  const insights = useMemo(() => {
    if (!stats || !trends) return [];

    const insightsList: { type: 'success' | 'warning' | 'info'; title: string; description: string }[] = [];

    // Score trend insight
    if (trends.length >= 2) {
      const firstScore = trends[0].overall_score;
      const lastScore = trends[trends.length - 1].overall_score;
      const change = lastScore - firstScore;

      if (change >= 5) {
        insightsList.push({
          type: 'success',
          title: 'Score en hausse',
          description: `Le score moyen a augmenté de ${change.toFixed(0)} points sur la période.`,
        });
      } else if (change <= -5) {
        insightsList.push({
          type: 'warning',
          title: 'Score en baisse',
          description: `Le score moyen a diminué de ${Math.abs(change).toFixed(0)} points sur la période.`,
        });
      }
    }

    // Weak criteria insight
    const weakCriteria = QUALITY_CRITERIA.filter(
      c => (stats.scores_by_criterion[c.key] || 0) < 70
    );
    if (weakCriteria.length > 0) {
      insightsList.push({
        type: 'warning',
        title: 'Critères à améliorer',
        description: `Les critères suivants ont un score inférieur à 70: ${weakCriteria.map(c => c.label).join(', ')}.`,
      });
    }

    // Failed checks insight
    if (stats.failed_count > 0) {
      const failedRatio = (stats.failed_count / stats.total_checks) * 100;
      if (failedRatio > 10) {
        insightsList.push({
          type: 'warning',
          title: 'Taux d\'échec élevé',
          description: `${failedRatio.toFixed(0)}% des contenus ont un score insuffisant.`,
        });
      }
    }

    // Success insight
    if (stats.passed_count / stats.total_checks > 0.8) {
      insightsList.push({
        type: 'success',
        title: 'Excellente qualité',
        description: `Plus de 80% des contenus passent le contrôle qualité.`,
      });
    }

    return insightsList;
  }, [stats, trends]);

  // Best and worst criteria
  const criteriaRanking = useMemo(() => {
    if (!stats) return { best: [], worst: [] };

    const sorted = QUALITY_CRITERIA
      .map(c => ({ ...c, score: stats.scores_by_criterion[c.key] || 0 }))
      .sort((a, b) => b.score - a.score);

    return {
      best: sorted.slice(0, 2),
      worst: sorted.slice(-2).reverse(),
    };
  }, [stats]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/quality">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Analytics Qualité
            </h1>
            <p className="text-muted-foreground">
              Analyses détaillées et tendances sur la période
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Score moyen</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: getScoreColor(stats.average_score) }}
                >
                  {stats.average_score}
                </span>
                {stats.trend && (
                  <Badge
                    variant={stats.trend.direction === 'up' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {stats.trend.direction === 'up' ? '+' : ''}{stats.trend.change}%
                  </Badge>
                )}
              </div>
              <Progress
                value={stats.average_score}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Contenus vérifiés</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.total_checks}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Sur la période
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Taux de réussite</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {stats.total_checks > 0
                  ? ((stats.passed_count / stats.total_checks) * 100).toFixed(0)
                  : 0}%
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500"
                    style={{ width: `${(stats.passed_count / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${(stats.warning_count / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${(stats.failed_count / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Alertes</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.failed_count}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Contenus avec score &lt; 60
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Chart */}
      <QualityTrends platformId={platformId} initialPeriod={period} />

      {/* Insights & Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </CardTitle>
            <CardDescription>
              Observations et recommandations basées sur l'analyse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'success'
                        ? 'border-green-200 bg-green-50'
                        : insight.type === 'warning'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {insight.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : insight.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-blue-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{insight.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Pas assez de données pour générer des insights
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best/Worst Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Classement critères
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Best */}
            <div>
              <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Meilleurs scores
              </p>
              <div className="space-y-2">
                {criteriaRanking.best.map(criterion => (
                  <div
                    key={criterion.key}
                    className="flex items-center justify-between p-2 rounded bg-green-50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: criterion.color }}
                      />
                      <span className="text-sm">{criterion.label}</span>
                    </div>
                    <span className="font-bold text-green-600">{criterion.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Worst */}
            <div>
              <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                À améliorer
              </p>
              <div className="space-y-2">
                {criteriaRanking.worst.map(criterion => (
                  <div
                    key={criterion.key}
                    className="flex items-center justify-between p-2 rounded bg-red-50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: criterion.color }}
                      />
                      <span className="text-sm">{criterion.label}</span>
                    </div>
                    <span className="font-bold text-red-600">{criterion.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criteria Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail par critère</CardTitle>
            <CardDescription>
              Performance sur les 6 critères de qualité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {QUALITY_CRITERIA.map(criterion => {
                const score = stats.scores_by_criterion[criterion.key] || 0;
                return (
                  <div key={criterion.key} className="text-center">
                    {/* Circular gauge */}
                    <div className="relative w-20 h-20 mx-auto mb-2">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="transparent"
                          stroke="#e5e7eb"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="transparent"
                          stroke={getScoreColor(score)}
                          strokeWidth="10"
                          strokeDasharray={`${score * 2.83} 283`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-lg font-bold"
                          style={{ color: getScoreColor(score) }}
                        >
                          {score}
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-sm">{criterion.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Poids: {criterion.weight}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-3xl font-bold text-green-600">{stats.distribution.excellent}</p>
                <p className="text-sm text-muted-foreground">Excellent</p>
                <p className="text-xs text-muted-foreground">90-100</p>
                <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(stats.distribution.excellent / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-3xl font-bold text-blue-600">{stats.distribution.good}</p>
                <p className="text-sm text-muted-foreground">Bon</p>
                <p className="text-xs text-muted-foreground">70-89</p>
                <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(stats.distribution.good / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-3xl font-bold text-yellow-600">{stats.distribution.average}</p>
                <p className="text-sm text-muted-foreground">Moyen</p>
                <p className="text-xs text-muted-foreground">50-69</p>
                <div className="mt-2 h-2 bg-yellow-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${(stats.distribution.average / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-3xl font-bold text-red-600">{stats.distribution.poor}</p>
                <p className="text-sm text-muted-foreground">Insuffisant</p>
                <p className="text-xs text-muted-foreground">0-49</p>
                <div className="mt-2 h-2 bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(stats.distribution.poor / Math.max(stats.total_checks, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/quality/checks">
            <FileText className="h-4 w-4 mr-2" />
            Voir toutes les vérifications
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/quality/feedback">
            <Lightbulb className="h-4 w-4 mr-2" />
            Analyse du feedback
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/quality/golden">
            <Award className="h-4 w-4 mr-2" />
            Exemples dorés
          </Link>
        </Button>
      </div>
    </div>
  );
}
