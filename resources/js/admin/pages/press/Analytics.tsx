import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Folder,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Share2,
  Clock,
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
import { PageHeader } from '@/components/layout/PageHeader';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { usePressStats } from '@/hooks/usePressReleases';
import { useDossierStats } from '@/hooks/useDossiers';
import { PLATFORMS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

// Les 9 langues supportées
const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', color: '#3B82F6' },
  { code: 'en', name: 'English', color: '#10B981' },
  { code: 'de', name: 'Deutsch', color: '#F59E0B' },
  { code: 'ru', name: 'Русский', color: '#EF4444' },
  { code: 'zh', name: '中文', color: '#8B5CF6' },
  { code: 'es', name: 'Español', color: '#EC4899' },
  { code: 'pt', name: 'Português', color: '#06B6D4' },
  { code: 'ar', name: 'العربية', color: '#84CC16' },
  { code: 'hi', name: 'हिन्दी', color: '#F97316' },
];

const CHART_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
];

type DateRange = '7d' | '30d' | '90d' | '12m';

export const PressAnalytics: React.FC = () => {
  const { t } = useTranslation(['press', 'common']);

  // State
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Queries
  const { data: pressStats, isLoading: pressLoading, refetch: refetchPress } = usePressStats();
  const { data: dossierStats, isLoading: dossierLoading, refetch: refetchDossier } = useDossierStats();

  const isLoading = pressLoading || dossierLoading;

  // Mock data for charts (would come from API in real implementation)
  const productionData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    return Array.from({ length: Math.min(days, 30) }, (_, i) => ({
      date: format(subDays(new Date(), days - i - 1), 'dd/MM'),
      releases: Math.floor(Math.random() * 10) + 1,
      dossiers: Math.floor(Math.random() * 3),
    }));
  }, [dateRange]);

  const languageDistribution = useMemo(() => {
    return SUPPORTED_LANGUAGES.map((lang) => ({
      ...lang,
      count: Math.floor(Math.random() * 100) + 20,
    }));
  }, []);

  const platformStats = useMemo(() => {
    return PLATFORMS.map((platform, index) => ({
      ...platform,
      releases: Math.floor(Math.random() * 50) + 10,
      dossiers: Math.floor(Math.random() * 20) + 5,
      views: Math.floor(Math.random() * 10000) + 1000,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);

  const qualityDistribution = useMemo(() => [
    { range: '90-100%', count: 45, color: '#10B981' },
    { range: '70-89%', count: 120, color: '#3B82F6' },
    { range: '50-69%', count: 35, color: '#F59E0B' },
    { range: '0-49%', count: 10, color: '#EF4444' },
  ], []);

  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return {
        month: format(date, 'MMM', { locale: fr }),
        releases: Math.floor(Math.random() * 100) + 50,
        dossiers: Math.floor(Math.random() * 30) + 10,
        translations: Math.floor(Math.random() * 200) + 100,
      };
    });
  }, []);

  // Stats cards data
  const statsCards = useMemo(() => [
    {
      title: t('press:analytics.totalReleases'),
      value: pressStats?.total || 0,
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('press:analytics.totalDossiers'),
      value: dossierStats?.total || 0,
      change: '+8%',
      trend: 'up',
      icon: Folder,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('press:analytics.publishedThisMonth'),
      value: (pressStats?.publishedThisMonth || 0) + (dossierStats?.publishedThisMonth || 0),
      change: '+25%',
      trend: 'up',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('press:analytics.avgQualityScore'),
      value: pressStats?.avgQualityScore ? `${pressStats.avgQualityScore}%` : '-',
      change: '+3%',
      trend: 'up',
      icon: BarChart3,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ], [pressStats, dossierStats, t]);

  // Refresh all data
  const handleRefresh = () => {
    refetchPress();
    refetchDossier();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('press:analytics.title')}
        description={t('press:analytics.description')}
        actions={
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('press:analytics.last7Days')}</SelectItem>
                <SelectItem value="30d">{t('press:analytics.last30Days')}</SelectItem>
                <SelectItem value="90d">{t('press:analytics.last90Days')}</SelectItem>
                <SelectItem value="12m">{t('press:analytics.last12Months')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('press:analytics.allPlatforms')}</SelectItem>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              {t('common:refresh')}
            </Button>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('common:export')}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.productionTrend')}</CardTitle>
            <CardDescription>{t('press:analytics.productionTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="releases"
                    name={t('press:analytics.releases')}
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="dossiers"
                    name={t('press:analytics.dossiers')}
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.languageDistribution')}</CardTitle>
            <CardDescription>{t('press:analytics.languageDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {languageDistribution.map((entry) => (
                      <Cell key={entry.code} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.platformPerformance')}</CardTitle>
            <CardDescription>{t('press:analytics.platformPerformanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="releases"
                    name={t('press:analytics.releases')}
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="dossiers"
                    name={t('press:analytics.dossiers')}
                    fill="#8B5CF6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quality Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.qualityDistribution')}</CardTitle>
            <CardDescription>{t('press:analytics.qualityDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityDistribution.map((item) => (
                <div key={item.range}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.range}</span>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                  <Progress
                    value={(item.count / 210) * 100}
                    className="h-2"
                    style={{ '--progress-background': item.color } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('press:analytics.avgScore')}</span>
                <span className="text-2xl font-bold text-green-600">
                  {pressStats?.avgQualityScore || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('press:analytics.monthlyOverview')}</CardTitle>
          <CardDescription>{t('press:analytics.monthlyOverviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="releases"
                  name={t('press:analytics.releases')}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="dossiers"
                  name={t('press:analytics.dossiers')}
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="translations"
                  name={t('press:analytics.translations')}
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Performing Releases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.topReleases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Communiqué de presse #{i}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(Math.random() * 5000) + 1000} vues
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <Eye className="h-3 w-3 mr-1" />
                    {Math.floor(Math.random() * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'published', type: 'release', time: '2h' },
                { action: 'translated', type: 'release', time: '4h' },
                { action: 'created', type: 'dossier', time: '6h' },
                { action: 'updated', type: 'release', time: '8h' },
                { action: 'published', type: 'dossier', time: '12h' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'release' ? (
                      <FileText className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Folder className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium capitalize">{activity.action}</span>{' '}
                      {activity.type === 'release' ? 'un communiqué' : 'un dossier'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('press:analytics.distributionStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{t('press:analytics.totalShares')}</span>
                </div>
                <span className="font-semibold">12,458</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{t('press:analytics.totalViews')}</span>
                </div>
                <span className="font-semibold">89,234</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">{t('press:analytics.totalDownloads')}</span>
                </div>
                <span className="font-semibold">3,567</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">{t('press:analytics.countriesReached')}</span>
                </div>
                <span className="font-semibold">197</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PressAnalytics;
