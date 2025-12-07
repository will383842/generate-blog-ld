/**
 * Benchmark Comparison Component
 * File 333 - Compare metrics across platforms
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Medal,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useBenchmarks, PlatformBenchmark, MetricBenchmark } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface BenchmarkComparisonProps {
  compact?: boolean;
}

export function BenchmarkComparison({ compact = false }: BenchmarkComparisonProps) {
  const { t } = useTranslation();
  const { data: benchmarks, isLoading } = useBenchmarks();

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Trend indicator
  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={cn(
      'flex items-center text-xs font-medium',
      value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
    )}>
      {value > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : 
       value < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : null}
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

  // Get rank icon
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
    return null;
  };

  // Platform colors
  const platformColors = ['#3B82F6', '#8B5CF6', '#22C55E'];

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
            <BarChart3 className="h-4 w-4" />
            Comparaison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {benchmarks?.platforms?.slice(0, 3).map((platform, idx) => (
              <div key={platform.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRankIcon(idx + 1)}
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
                <span className="text-sm">{formatNumber(platform.metrics.views)} vues</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const platforms = benchmarks?.platforms || [];

  return (
    <div className="space-y-6">
      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform, idx) => (
          <Card key={platform.id} className={cn(idx === 0 && 'border-yellow-200 border-2')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getRankIcon(idx + 1)}
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                </div>
                {idx === 0 && <Badge className="bg-yellow-100 text-yellow-800">Leader</Badge>}
              </div>
              <CardDescription className="text-xs">{platform.domain}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Pages vues</span>
                    <TrendIndicator value={platform.metrics.viewsTrend} />
                  </div>
                  <p className="text-xl font-bold">{formatNumber(platform.metrics.views)}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Visiteurs</span>
                    <TrendIndicator value={platform.metrics.visitorsTrend} />
                  </div>
                  <p className="text-xl font-bold">{formatNumber(platform.metrics.visitors)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Bounce</p>
                    <p className="font-medium">{platform.metrics.bounceRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Durée moy.</p>
                    <p className="font-medium">{formatDuration(platform.metrics.avgDuration)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Conversions</span>
                    <TrendIndicator value={platform.metrics.conversionsTrend} />
                  </div>
                  <p className="text-lg font-bold text-green-600">{platform.metrics.conversions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparaison par métrique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrique</TableHead>
                  {platforms.map((p, idx) => (
                    <TableHead key={p.id} className="text-center">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full mb-1"
                          style={{ backgroundColor: platformColors[idx] }}
                        />
                        {p.name}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Moyenne</TableHead>
                  <TableHead className="text-center">Meilleur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks?.metrics?.map(metric => (
                  <TableRow key={metric.metric}>
                    <TableCell className="font-medium capitalize">
                      {metric.metric.replace('_', ' ')}
                    </TableCell>
                    {metric.platforms.map((p, idx) => (
                      <TableCell key={p.platformId} className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            {getRankIcon(p.rank)}
                            <span className={cn(p.rank === 1 && 'font-bold text-green-600')}>
                              {metric.metric.includes('rate') || metric.metric.includes('bounce')
                                ? `${p.value.toFixed(1)}%`
                                : metric.metric.includes('duration')
                                ? formatDuration(p.value)
                                : formatNumber(p.value)
                              }
                            </span>
                          </div>
                          <TrendIndicator value={p.trend} />
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-muted-foreground">
                      {metric.metric.includes('rate') || metric.metric.includes('bounce')
                        ? `${metric.average.toFixed(1)}%`
                        : metric.metric.includes('duration')
                        ? formatDuration(metric.average)
                        : formatNumber(metric.average)
                      }
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600">
                      {metric.metric.includes('rate') || metric.metric.includes('bounce')
                        ? `${metric.best.toFixed(1)}%`
                        : metric.metric.includes('duration')
                        ? formatDuration(metric.best)
                        : formatNumber(metric.best)
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Comparison Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance relative</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(['views', 'visitors', 'conversions'] as const).map(metricKey => {
              const maxValue = Math.max(...platforms.map(p => p.metrics[metricKey]));
              return (
                <div key={metricKey}>
                  <p className="text-sm font-medium mb-2 capitalize">{metricKey}</p>
                  <div className="space-y-2">
                    {platforms.map((platform, idx) => {
                      const value = platform.metrics[metricKey];
                      const percentage = (value / maxValue) * 100;
                      return (
                        <div key={platform.id} className="flex items-center gap-3">
                          <span className="w-24 text-sm truncate">{platform.name}</span>
                          <div className="flex-1">
                            <div className="relative">
                              <Progress
                                value={percentage}
                                className="h-6"
                                style={{
                                  ['--progress-color' as keyof React.CSSProperties]: platformColors[idx],
                                }}
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                                {formatNumber(value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {benchmarks?.recommendations && benchmarks.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <Lightbulb className="h-4 w-4" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {benchmarks.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-600">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BenchmarkComparison;
