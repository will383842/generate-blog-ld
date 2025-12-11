/**
 * Benchmarks Analytics Page
 * File 340 - Platform comparison and benchmarks
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function BenchmarksPage() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedMetric, setSelectedMetric] = useState('all');

  const { data: benchmarks, isLoading: benchmarksLoading } = useBenchmarks();

  // Fetch historical data for trends
  const { data: historicalData = [], isLoading: historicalLoading } = useQuery<HistoricalDataPoint[]>({
    queryKey: ['analytics', 'historical', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
      const res = await fetch(`/api/admin/analytics/historical?${params}`);
      if (!res.ok) throw new Error('Failed to fetch historical data');
      return res.json();
    },
  });

  const isLoading = benchmarksLoading || historicalLoading;

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
                  <CardDescription>Performances des plateformes sur 6 mois</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes métriques</SelectItem>
                    <SelectItem value="traffic">Trafic</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="revenue">Revenus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {historicalData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée historique disponible</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatNumber} />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="platform1"
                      stroke="#3B82F6"
                      name="SOS-Expat"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="platform2"
                      stroke="#10B981"
                      name="Ulixai"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="platform3"
                      stroke="#F59E0B"
                      name="Ulysse"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarks?.platforms?.map((platform: any) => (
              <Card key={platform.id}>
                <CardHeader>
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Articles</span>
                    <span className="font-semibold">{formatNumber(platform.articles)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vues</span>
                    <span className="font-semibold">{formatNumber(platform.views)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux conversion</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{platform.conversionRate}%</span>
                      {platform.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
