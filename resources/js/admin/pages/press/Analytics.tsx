import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Globe,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
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
} from 'recharts';
import { usePressStats } from '@/hooks/usePressReleases';
import { useDossierStats } from '@/hooks/useDossiers';
import { PLATFORMS } from '@/utils/constants';

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
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

type DateRange = '7d' | '30d' | '90d' | '12m';

export const PressAnalytics: React.FC = () => {
  const { t } = useTranslation(['press', 'common']);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Fetch stats from hooks
  const { data: pressStats, isLoading: pressLoading, refetch: refetchPress } = usePressStats();
  const { data: dossierStats, isLoading: dossierLoading, refetch: refetchDossier } = useDossierStats();

  // Fetch analytics data from API
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['press', 'analytics', dateRange, selectedPlatform],
    queryFn: async () => {
      const res = await fetch(`/api/admin/press/analytics?range=${dateRange}&platform=${selectedPlatform}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  const isLoading = pressLoading || dossierLoading || analyticsLoading;

  const handleRefresh = () => {
    refetchPress();
    refetchDossier();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Presse
          </h1>
          <p className="text-muted-foreground">
            Analyse des performances des communiqués et dossiers de presse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="12m">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes plateformes</SelectItem>
              {PLATFORMS.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Communiqués</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pressStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {pressStats?.growth || 0}% vs période précédente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dossiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dossierStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {dossierStats?.growth || 0}% vs période précédente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground">Sur la période</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Partages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalShares || 0}</div>
            <p className="text-xs text-muted-foreground">Sur la période</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="production">
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="languages">Langues</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
          <TabsTrigger value="quality">Qualité</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production quotidienne</CardTitle>
              <CardDescription>Nombre de communiqués et dossiers créés par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.productionData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="releases" stroke="#3B82F6" name="Communiqués" />
                  <Line type="monotone" dataKey="dossiers" stroke="#10B981" name="Dossiers" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution par langue</CardTitle>
              <CardDescription>Répartition des contenus par langue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.languageDistribution || []}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {(analytics?.languageDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par plateforme</CardTitle>
              <CardDescription>Statistiques de production et vues par plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.platformStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="releases" fill="#3B82F6" name="Communiqués" />
                  <Bar dataKey="dossiers" fill="#10B981" name="Dossiers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution qualité</CardTitle>
              <CardDescription>Répartition par score de qualité</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.qualityDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {(analytics?.qualityDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PressAnalytics;
