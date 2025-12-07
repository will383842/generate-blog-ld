import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { StatCard } from '@/components/StatCard';
import { ProductionChart } from '@/components/Charts/ProductionChart';
import { ApiCostsChart } from '@/components/Charts/ApiCostsChart';
import { BudgetGauge } from '@/components/Charts/BudgetGauge';
import { ActivityStream } from '@/components/activity/ActivityStream';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import { useProductionStats, useCostsTimeline, useActivityStream } from '@/hooks/useStats';
import { usePlatformStore } from '@/stores/platformStore';
import { PLATFORMS } from '@/utils/constants';

export default function DashboardIndex() {
  const { t } = useTranslation();
  const { activePlatform, setPlatform } = usePlatformStore();
  const [period, setPeriod] = useState('7d');
  const { stats, isLoading, isRefetching, refetch } = useRealtimeStats();

  // Get period days for API calls
  const periodDays = useMemo(() => {
    switch (period) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  }, [period]);

  // Fetch production stats from API
  const { data: productionData } = useProductionStats(periodDays);
  const { data: costsData } = useCostsTimeline(periodDays);
  const { data: activityData } = useActivityStream(10);

  // Transform production data for chart
  const productionChartData = useMemo(() => {
    if (!productionData?.data?.daily_breakdown) return [];
    return productionData.data.daily_breakdown.map((item: { date: string; count: number }) => ({
      date: item.date,
      articles: item.count,
      piliers: 0,
      landings: 0,
      press: 0,
    }));
  }, [productionData]);

  // Transform costs data for chart
  const costsChartData = useMemo(() => {
    if (!costsData?.data?.timeline) return [];
    return Object.entries(costsData.data.timeline).map(([date, data]) => ({
      date,
      gpt4: (data as { by_service?: Record<string, number> }).by_service?.['gpt-4'] || 0,
      gpt35: (data as { by_service?: Record<string, number> }).by_service?.['gpt-3.5-turbo'] || 0,
      dalle: (data as { by_service?: Record<string, number> }).by_service?.['dall-e-3'] || 0,
      perplexity: (data as { by_service?: Record<string, number> }).by_service?.['perplexity'] || 0,
    }));
  }, [costsData]);

  // Get activities
  const activities = useMemo(() => {
    return activityData?.data || [];
  }, [activityData]);

  const handlePlatformChange = (value: string) => {
    const platform = PLATFORMS.find((p) => p.id === value);
    if (platform) {
      setPlatform(platform.id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Calculate budget info
  const budgetInfo = useMemo(() => {
    if (!stats?.costs) {
      return { used: 0, total: 500, percentage: 0 };
    }
    const used = stats.costs.month || 0;
    const total = stats.costs.budgetTotal || 500;
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }, [stats]);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.title', 'Dashboard')}
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de la production de contenu
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={activePlatform?.id || 'all'}
            onValueChange={handlePlatformChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard
          title="Articles Total"
          value={stats?.articles?.total?.toLocaleString('fr-FR') || '0'}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Aujourd'hui"
          value={stats?.articles?.today?.toLocaleString('fr-FR') || '0'}
          icon={Calendar}
        />
        <StatCard
          title="Publiés"
          value={stats?.articles?.byStatus?.published?.toLocaleString('fr-FR') || '0'}
          icon={CheckCircle}
        />
        <StatCard
          title="En attente"
          value={stats?.articles?.byStatus?.pending?.toLocaleString('fr-FR') || '0'}
          icon={Clock}
        />
        <StatCard
          title="Coût Jour"
          value={`$${(stats?.costs?.today || 0).toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Coût Mois"
          value={`$${(stats?.costs?.month || 0).toFixed(2)}`}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: false }}
        />
        <StatCard
          title="File d'attente"
          value={stats?.queue?.pending?.toString() || '0'}
          icon={Loader2}
        />
        <StatCard
          title="Erreurs"
          value={stats?.queue?.failed?.toString() || '0'}
          icon={AlertCircle}
          className={stats?.queue?.failed ? 'border-red-200 bg-red-50' : ''}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Production (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionChart data={productionChartData} height={300} />
          </CardContent>
        </Card>

        {/* Budget Gauge */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Mensuel</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <BudgetGauge
              value={budgetInfo.percentage}
              total={budgetInfo.total}
              used={budgetInfo.used}
              size="lg"
            />
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Costs Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coûts API (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiCostsChart
              data={costsChartData}
              dailyBudget={budgetInfo.total / 30}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Activity Stream */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityStream
              activities={activities}
              refreshInterval={10000}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
