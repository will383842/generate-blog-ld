import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useProgramAnalytics } from '@/hooks/usePrograms';
import type { Program, ProgramAnalytics } from '@/types/program';

export interface ProgramStatsProps {
  program: Program;
  analytics?: ProgramAnalytics;
  period?: '7d' | '30d' | '90d';
  className?: string;
}

export function ProgramStats({
  program,
  analytics: providedAnalytics,
  period = '30d',
  className,
}: ProgramStatsProps) {
  // Map period to API format
  const apiPeriod = useMemo(() => {
    switch (period) {
      case '7d': return 'week';
      case '90d': return 'year';
      default: return 'month';
    }
  }, [period]);

  // Fetch analytics from API if not provided
  const { data: fetchedAnalyticsData, isLoading } = useProgramAnalytics(
    program.id,
    apiPeriod as 'day' | 'week' | 'month' | 'year'
  );

  // Use provided analytics or fetched data
  const analytics = providedAnalytics || fetchedAnalyticsData?.data;

  // Build timeline data from analytics or from program totals
  const timelineData = useMemo(() => {
    if (analytics?.timeline && analytics.timeline.length > 0) {
      return analytics.timeline;
    }

    // If no timeline data, create empty timeline structure based on period
    // This ensures the chart displays without mock random data
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    });

    return interval.map((date) => ({
      date: format(date, 'yyyy-MM-dd'),
      generated: 0,
      published: 0,
      failed: 0,
      cost: 0,
    }));
  }, [analytics, period]);

  // Calculate totals from analytics or program data
  const totals = useMemo(() => {
    if (analytics) {
      return {
        generated: analytics.totalGenerated || program.totalGenerated || 0,
        published: analytics.totalPublished || 0,
        failed: analytics.totalFailed || program.totalFailed || 0,
        cost: analytics.totalCost || program.totalCost || 0,
        successRate: analytics.successRate || program.successRate || 0,
      };
    }

    // Fall back to program-level stats
    const generated = program.totalGenerated || 0;
    const failed = program.totalFailed || 0;
    const cost = program.totalCost || 0;

    return {
      generated,
      published: Math.floor(generated * 0.85), // Estimate if not available
      failed,
      cost,
      successRate: program.successRate || (generated > 0 ? ((generated - failed) / generated) * 100 : 0),
    };
  }, [analytics, program]);

  // Status breakdown pie data
  const statusData = useMemo(() => [
    { name: 'Publiés', value: totals.published, color: '#10B981' },
    { name: 'En attente', value: Math.max(0, totals.generated - totals.published - totals.failed), color: '#F59E0B' },
    { name: 'Échoués', value: totals.failed, color: '#EF4444' },
  ].filter((d) => d.value > 0), [totals]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.generated.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Articles générés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.published.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Publiés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.failed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Échecs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totals.cost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Coût total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Taux de succès
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar
                value={totals.successRate}
                size="lg"
                className={cn(
                  totals.successRate >= 90 ? 'bg-green-100' :
                  totals.successRate >= 70 ? 'bg-yellow-100' :
                  'bg-red-100'
                )}
              />
            </div>
            <span className={cn(
              'text-2xl font-bold',
              totals.successRate >= 90 ? 'text-green-600' :
              totals.successRate >= 70 ? 'text-yellow-600' :
              'text-red-600'
            )}>
              {totals.successRate.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Évolution de la production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: fr })}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(value) => format(new Date(value), 'PPP', { locale: fr })}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="generated"
                      name="Générés"
                      stackId="1"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="published"
                      name="Publiés"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Répartition statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Aucune donnée
                </div>
              )}
            </div>
            {statusData.length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by content type */}
      {analytics?.byContentType && analytics.byContentType.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Par type de contenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.byContentType.map((item) => (
                <div key={item.contentType} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.contentType}</span>
                    <span className="text-muted-foreground">
                      {item.count} articles · ${item.cost.toFixed(2)}
                    </span>
                  </div>
                  <ProgressBar
                    value={(item.count / Math.max(totals.generated, 1)) * 100}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-lg font-bold">{program.totalRuns || 0}</p>
          <p className="text-xs text-muted-foreground">Exécutions totales</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-lg font-bold">
            ${(totals.cost / Math.max(totals.generated, 1)).toFixed(3)}
          </p>
          <p className="text-xs text-muted-foreground">Coût moyen/article</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <FileText className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-lg font-bold">
            {Math.round(totals.generated / Math.max(program.totalRuns || 1, 1))}
          </p>
          <p className="text-xs text-muted-foreground">Articles/exécution</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-lg font-bold">
            ${(totals.cost / Math.max(program.totalRuns || 1, 1)).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Coût moyen/exécution</p>
        </div>
      </div>
    </div>
  );
}

export default ProgramStats;
