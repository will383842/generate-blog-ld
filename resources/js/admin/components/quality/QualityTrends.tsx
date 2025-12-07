/**
 * Quality Trends Component
 * File 275 - Line chart showing quality scores over time
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { useQualityTrends } from '@/hooks/useQuality';
import {
  QualityTrend,
  QualityCriterion,
  QUALITY_CRITERIA,
  getScoreColor,
} from '@/types/quality';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '3 derniers mois' },
  { value: '1y', label: '1 an' },
];

interface QualityTrendsProps {
  platformId: number;
  initialPeriod?: string;
  compact?: boolean;
}

export function QualityTrends({
  platformId,
  initialPeriod = '30d',
  compact = false,
}: QualityTrendsProps) {
  const { t } = useTranslation();

  // State
  const [period, setPeriod] = useState(initialPeriod);
  const [showCriteria, setShowCriteria] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<Set<QualityCriterion>>(
    new Set(['readability', 'seo', 'brand'])
  );

  // API hooks
  const { data: trends, isLoading } = useQualityTrends(platformId, period);

  // Calculate trend direction
  const trendDirection = useMemo(() => {
    if (!trends || trends.length < 2) return 'stable';
    const first = trends[0].overall_score;
    const last = trends[trends.length - 1].overall_score;
    if (last > first + 2) return 'up';
    if (last < first - 2) return 'down';
    return 'stable';
  }, [trends]);

  // Calculate change
  const change = useMemo(() => {
    if (!trends || trends.length < 2) return 0;
    const first = trends[0].overall_score;
    const last = trends[trends.length - 1].overall_score;
    return Math.round(last - first);
  }, [trends]);

  // Min/max for chart
  const { minScore, maxScore } = useMemo(() => {
    if (!trends || trends.length === 0) return { minScore: 0, maxScore: 100 };
    const scores = trends.map(t => t.overall_score);
    return {
      minScore: Math.max(0, Math.min(...scores) - 10),
      maxScore: Math.min(100, Math.max(...scores) + 10),
    };
  }, [trends]);

  // Toggle criterion
  const toggleCriterion = (criterion: QualityCriterion) => {
    const newSelected = new Set(selectedCriteria);
    if (newSelected.has(criterion)) {
      newSelected.delete(criterion);
    } else {
      newSelected.add(criterion);
    }
    setSelectedCriteria(newSelected);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Pas assez de données pour afficher les tendances</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendances
            </CardTitle>
            <Badge variant={trendDirection === 'up' ? 'default' : trendDirection === 'down' ? 'destructive' : 'secondary'}>
              {trendDirection === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trendDirection === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trendDirection === 'stable' && <Minus className="h-3 w-3 mr-1" />}
              {change > 0 ? '+' : ''}{change} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Simplified sparkline */}
          <div className="h-16 flex items-end gap-1">
            {trends.slice(-14).map((point, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${((point.overall_score - minScore) / (maxScore - minScore)) * 100}%`,
                  backgroundColor: getScoreColor(point.overall_score),
                  opacity: 0.5 + (idx / trends.slice(-14).length) * 0.5,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Évolution des scores
            </CardTitle>
            <CardDescription>
              Tendances de qualité sur la période sélectionnée
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Period selector */}
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

            {/* Toggle criteria */}
            <div className="flex items-center gap-2">
              <Switch
                id="show-criteria"
                checked={showCriteria}
                onCheckedChange={setShowCriteria}
              />
              <Label htmlFor="show-criteria" className="text-sm">
                Par critère
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tendance:</span>
            <Badge variant={trendDirection === 'up' ? 'default' : trendDirection === 'down' ? 'destructive' : 'secondary'}>
              {trendDirection === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trendDirection === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trendDirection === 'stable' && <Minus className="h-3 w-3 mr-1" />}
              {change > 0 ? '+' : ''}{change} points
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Moyenne: <span className="font-medium" style={{ color: getScoreColor(trends[trends.length - 1].overall_score) }}>
              {Math.round(trends.reduce((acc, t) => acc + t.overall_score, 0) / trends.length)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {trends.reduce((acc, t) => acc + t.checks_count, 0)} vérifications
          </div>
        </div>

        {/* Criteria selector */}
        {showCriteria && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg">
            {QUALITY_CRITERIA.map(criterion => (
              <div key={criterion.key} className="flex items-center gap-2">
                <Checkbox
                  id={`criterion-${criterion.key}`}
                  checked={selectedCriteria.has(criterion.key)}
                  onCheckedChange={() => toggleCriterion(criterion.key)}
                />
                <label
                  htmlFor={`criterion-${criterion.key}`}
                  className="text-sm cursor-pointer flex items-center gap-1"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: criterion.color }}
                  />
                  {criterion.label}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-muted-foreground">
            <span>{maxScore}</span>
            <span>{Math.round((maxScore + minScore) / 2)}</span>
            <span>{minScore}</span>
          </div>

          {/* Chart area */}
          <div className="ml-10 h-full relative border-l border-b">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-dashed border-muted" />
              <div className="border-t border-dashed border-muted" />
              <div className="border-t border-dashed border-muted" />
            </div>

            {/* Data points */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Overall score line */}
              <polyline
                fill="none"
                stroke={getScoreColor(trends[trends.length - 1].overall_score)}
                strokeWidth="2"
                points={trends.map((point, idx) => {
                  const x = (idx / (trends.length - 1)) * 100;
                  const y = 100 - ((point.overall_score - minScore) / (maxScore - minScore)) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
              />

              {/* Criteria lines */}
              {showCriteria && Array.from(selectedCriteria).map(criterionKey => {
                const criterion = QUALITY_CRITERIA.find(c => c.key === criterionKey);
                if (!criterion) return null;

                return (
                  <polyline
                    key={criterionKey}
                    fill="none"
                    stroke={criterion.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                    strokeDasharray="4,4"
                    points={trends.map((point, idx) => {
                      const score = point[`${criterionKey}_score` as keyof QualityTrend] as number;
                      const x = (idx / (trends.length - 1)) * 100;
                      const y = 100 - ((score - minScore) / (maxScore - minScore)) * 100;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                  />
                );
              })}

              {/* Data points circles */}
              {trends.map((point, idx) => {
                const x = (idx / (trends.length - 1)) * 100;
                const y = 100 - ((point.overall_score - minScore) / (maxScore - minScore)) * 100;
                return (
                  <circle
                    key={idx}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={getScoreColor(point.overall_score)}
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                );
              })}
            </svg>

            {/* Hover tooltips would go here */}
          </div>

          {/* X-axis labels */}
          <div className="ml-10 mt-2 flex justify-between text-xs text-muted-foreground">
            {trends.filter((_, idx) => idx % Math.ceil(trends.length / 6) === 0).map((point, idx) => (
              <span key={idx}>
                {new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-xs text-muted-foreground">Score global</span>
          </div>
          {showCriteria && Array.from(selectedCriteria).map(criterionKey => {
            const criterion = QUALITY_CRITERIA.find(c => c.key === criterionKey);
            if (!criterion) return null;
            return (
              <div key={criterionKey} className="flex items-center gap-2">
                <div
                  className="w-4 h-0.5"
                  style={{ backgroundColor: criterion.color, borderStyle: 'dashed' }}
                />
                <span className="text-xs text-muted-foreground">{criterion.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QualityTrends;
