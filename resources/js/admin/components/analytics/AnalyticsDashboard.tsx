/**
 * Analytics Dashboard Component
 * File 329 - Overview of analytics metrics
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
import { useAnalyticsDashboard, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  period?: PeriodType;
  dateRange?: DateRange;
  compact?: boolean;
}

export function AnalyticsDashboard({ period = '30d', dateRange, compact = false }: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const { data: dashboard, isLoading } = useAnalyticsDashboard(period, dateRange);

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Trend indicator
  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={cn(
      'flex items-center text-xs font-medium',
      value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
    )}>
      {value > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : 
       value < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

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
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{formatNumber(dashboard?.totalViews || 0)}</p>
              <p className="text-xs text-muted-foreground">Vues</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(dashboard?.uniqueVisitors || 0)}</p>
              <p className="text-xs text-muted-foreground">Visiteurs</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboard?.bounceRate?.toFixed(1) || 0}%</p>
              <p className="text-xs text-muted-foreground">Bounce</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboard?.conversionRate?.toFixed(2) || 0}%</p>
              <p className="text-xs text-muted-foreground">Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Counter */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-green-800">En temps réel</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">
                {dashboard?.realtimeUsers || 0}
              </span>
              <span className="text-green-600">visiteurs actifs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <TrendIndicator value={dashboard?.viewsTrend || 0} />
            </div>
            <p className="text-2xl font-bold">{formatNumber(dashboard?.totalViews || 0)}</p>
            <p className="text-sm text-muted-foreground">Pages vues</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <TrendIndicator value={dashboard?.visitorsTrend || 0} />
            </div>
            <p className="text-2xl font-bold">{formatNumber(dashboard?.uniqueVisitors || 0)}</p>
            <p className="text-sm text-muted-foreground">Visiteurs uniques</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <TrendIndicator value={dashboard?.durationTrend || 0} />
            </div>
            <p className="text-2xl font-bold">{formatDuration(dashboard?.avgSessionDuration || 0)}</p>
            <p className="text-sm text-muted-foreground">Durée moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <TrendIndicator value={-(dashboard?.bounceTrend || 0)} />
            </div>
            <p className="text-2xl font-bold">{dashboard?.bounceRate?.toFixed(1) || 0}%</p>
            <p className="text-sm text-muted-foreground">Taux de rebond</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <TrendIndicator value={dashboard?.conversionsTrend || 0} />
            </div>
            <p className="text-2xl font-bold">{dashboard?.conversions || 0}</p>
            <p className="text-sm text-muted-foreground">Conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources & Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sources de trafic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* Pie Chart */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {dashboard?.trafficSources?.reduce((acc, source, idx) => {
                    const startAngle = acc.offset;
                    const angle = (source.percentage / 100) * 360;
                    const endAngle = startAngle + angle;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);
                    
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    acc.paths.push(
                      <path
                        key={idx}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={source.color}
                      />
                    );
                    acc.offset = endAngle;
                    return acc;
                  }, { paths: [] as React.ReactNode[], offset: 0 }).paths}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {dashboard?.trafficSources?.map(source => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm capitalize">{source.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{source.percentage.toFixed(1)}%</span>
                      <TrendIndicator value={source.trend} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Mini Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Entonnoir de conversion
              <Badge variant="outline">{dashboard?.conversionRate?.toFixed(2)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Visiteurs</span>
                  <span className="text-sm font-medium">{formatNumber(dashboard?.uniqueVisitors || 0)}</span>
                </div>
                <Progress value={100} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Sessions engagées</span>
                  <span className="text-sm font-medium">
                    {formatNumber(Math.round((dashboard?.uniqueVisitors || 0) * 0.6))}
                  </span>
                </div>
                <Progress value={60} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Leads</span>
                  <span className="text-sm font-medium">
                    {formatNumber(Math.round((dashboard?.uniqueVisitors || 0) * 0.15))}
                  </span>
                </div>
                <Progress value={15} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Conversions</span>
                  <span className="text-sm font-medium">{dashboard?.conversions || 0}</span>
                </div>
                <Progress value={dashboard?.conversionRate || 0} className="h-3 [&>div]:bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Content Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Top contenu
            <Link to="/analytics/top-performers" className="text-sm text-primary hover:underline">
              Voir tout →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead className="text-right">Vues</TableHead>
                  <TableHead className="text-right">Durée moy.</TableHead>
                  <TableHead className="text-right">Bounce</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard?.topContent?.slice(0, 5).map(content => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[250px]">
                          {content.title}
                        </span>
                        <a
                          href={content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(content.views)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(content.avgTimeOnPage)}
                    </TableCell>
                    <TableCell className="text-right">
                      {content.bounceRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <TrendIndicator value={content.trend} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
