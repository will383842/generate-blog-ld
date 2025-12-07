/**
 * Benchmarks Analytics Page
 * File 340 - Platform comparison and benchmarks
 */

import { useState } from 'react';

type HistoricalDataPoint = {
  month: string;
  [key: string]: string | number;
};

type MetricsMap = Record<string, number>;
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { BenchmarkComparison } from '@/components/analytics/BenchmarkComparison';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useBenchmarks, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export default function BenchmarksPage() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedMetric, setSelectedMetric] = useState('all');

  const { data: benchmarks, isLoading } = useBenchmarks();

  // Mock historical data for trends
  const historicalData: HistoricalDataPoint[] = [
    { month: 'Jan', platform1: 45000, platform2: 32000, platform3: 28000 },
    { month: 'Fév', platform1: 48000, platform2: 35000, platform3: 30000 },
    { month: 'Mar', platform1: 52000, platform2: 38000, platform3: 32000 },
    { month: 'Avr', platform1: 55000, platform2: 40000, platform3: 35000 },
    { month: 'Mai', platform1: 58000, platform2: 42000, platform3: 38000 },
    { month: 'Juin', platform1: 62000, platform2: 45000, platform3: 40000 },
  ];

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/analytics">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Benchmarks
            </h1>
            <p className="text-muted-foreground">Comparaison des plateformes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Main Comparison */}
      <BenchmarkComparison />

      {/* Tabs for Detailed Analysis */}
      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Tendances historiques</TabsTrigger>
          <TabsTrigger value="metrics">Détail par métrique</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Évolution comparative</CardTitle>
                  <CardDescription>Performance sur les 6 derniers mois</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes métriques</SelectItem>
                    <SelectItem value="views">Pages vues</SelectItem>
                    <SelectItem value="visitors">Visiteurs</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart */}
              <div className="h-[300px] mb-6">
                <svg viewBox="0 0 800 300" className="w-full h-full">
                  {/* Grid */}
                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                    <line
                      key={ratio}
                      x1="60"
                      y1={30 + ratio * 240}
                      x2="780"
                      y2={30 + ratio * 240}
                      stroke="#e5e7eb"
                      strokeDasharray="4"
                    />
                  ))}
                  
                  {/* Lines */}
                  {['platform1', 'platform2', 'platform3'].map((platform, pIdx) => {
                    const colors = ['#3B82F6', '#8B5CF6', '#22C55E'];
                    const maxValue = Math.max(...historicalData.flatMap(d => [d.platform1, d.platform2, d.platform3]));
                    
                    return (
                      <g key={platform}>
                        <polyline
                          points={historicalData.map((d, i) => {
                            const x = 60 + (i / (historicalData.length - 1)) * 720;
                            const y = 270 - ((d[platform] as number) / maxValue) * 240;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={colors[pIdx]}
                          strokeWidth="3"
                        />
                        {historicalData.map((d, i) => {
                          const x = 60 + (i / (historicalData.length - 1)) * 720;
                          const y = 270 - ((d[platform] as number) / maxValue) * 240;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="5"
                              fill={colors[pIdx]}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                  
                  {/* X-axis labels */}
                  {historicalData.map((d, i) => (
                    <text
                      key={i}
                      x={60 + (i / (historicalData.length - 1)) * 720}
                      y="295"
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                    >
                      {d.month}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6">
                {benchmarks?.platforms?.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ['#3B82F6', '#8B5CF6', '#22C55E'][idx] }}
                    />
                    <span className="text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Comparison Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Comparaison mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Mois</th>
                      {benchmarks?.platforms?.map(p => (
                        <th key={p.id} className="text-right p-3 font-medium">{p.name}</th>
                      ))}
                      <th className="text-right p-3 font-medium">Écart max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.map((row, idx) => {
                      const values = [row.platform1, row.platform2, row.platform3];
                      const max = Math.max(...values);
                      const min = Math.min(...values);
                      const gap = ((max - min) / min * 100).toFixed(1);
                      
                      return (
                        <tr key={idx} className="border-b">
                          <td className="p-3 font-medium">{row.month}</td>
                          <td className={cn(
                            'text-right p-3',
                            row.platform1 === max && 'text-green-600 font-bold'
                          )}>
                            {formatNumber(row.platform1)}
                          </td>
                          <td className={cn(
                            'text-right p-3',
                            row.platform2 === max && 'text-green-600 font-bold'
                          )}>
                            {formatNumber(row.platform2)}
                          </td>
                          <td className={cn(
                            'text-right p-3',
                            row.platform3 === max && 'text-green-600 font-bold'
                          )}>
                            {formatNumber(row.platform3)}
                          </td>
                          <td className="text-right p-3">
                            <Badge variant="outline">{gap}%</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'views', label: 'Pages vues', unit: '' },
              { key: 'visitors', label: 'Visiteurs uniques', unit: '' },
              { key: 'bounceRate', label: 'Taux de rebond', unit: '%' },
              { key: 'avgDuration', label: 'Durée moyenne', unit: 's' },
              { key: 'conversions', label: 'Conversions', unit: '' },
              { key: 'conversionRate', label: 'Taux de conversion', unit: '%' },
            ].map(metric => (
              <Card key={metric.key}>
                <CardHeader>
                  <CardTitle className="text-base">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {benchmarks?.platforms?.map((platform, idx) => {
                      const metricsMap = platform.metrics as MetricsMap;
                      const value = metricsMap[metric.key] ||
                                   metricsMap[metric.key.replace('Rate', 'Trend')] || 0;
                      const maxValue = Math.max(
                        ...benchmarks.platforms.map(p =>
                          (p.metrics as MetricsMap)[metric.key] || 0
                        )
                      );
                      const percentage = (value / maxValue) * 100;
                      
                      return (
                        <div key={platform.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ['#3B82F6', '#8B5CF6', '#22C55E'][idx] }}
                              />
                              <span className="text-sm">{platform.name}</span>
                            </div>
                            <span className="font-medium">
                              {metric.unit === '%' 
                                ? value.toFixed(1) + '%'
                                : metric.unit === 's'
                                ? `${Math.floor(value / 60)}m ${value % 60}s`
                                : formatNumber(value)
                              }
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: ['#3B82F6', '#8B5CF6', '#22C55E'][idx],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      {benchmarks?.recommendations && benchmarks.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">
              Recommandations d'amélioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarks.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-blue-800">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
