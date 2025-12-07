import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Download,
  TrendingUp,
  FileText,
  DollarSign,
  CheckCircle,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { usePrograms } from '@/hooks/usePrograms';
import { PLATFORMS } from '@/utils/constants';
import type { PlatformId } from '@/types/program';

type PeriodType = '7d' | '30d' | '90d' | '1y';

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: '1y', label: '12 derniers mois' },
];

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function ProgramsAnalytics() {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | 'all'>('all');

  const { data: programsData, isLoading } = usePrograms({
    perPage: 100,
    platformId: selectedPlatform !== 'all' ? selectedPlatform : undefined,
  });

  const programs = programsData?.data || [];

  // Calculate global stats
  const globalStats = useMemo(() => {
    const totalGenerated = programs.reduce((sum, p) => sum + p.totalGenerated, 0);
    const totalCost = programs.reduce((sum, p) => sum + p.totalCost, 0);
    const totalFailed = programs.reduce((sum, p) => sum + p.totalFailed, 0);
    const avgSuccessRate = programs.length > 0
      ? programs.reduce((sum, p) => sum + p.successRate, 0) / programs.length
      : 0;

    return {
      totalGenerated,
      totalCost,
      totalFailed,
      avgSuccessRate,
      activePrograms: programs.filter((p) => p.status === 'active').length,
      totalPrograms: programs.length,
    };
  }, [programs]);

  // Production by program (for bar chart)
  const productionByProgram = useMemo(() => {
    return programs
      .sort((a, b) => b.totalGenerated - a.totalGenerated)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.slice(0, 20) + (p.name.length > 20 ? '...' : ''),
        generated: p.totalGenerated,
        failed: p.totalFailed,
        platform: p.platformId,
      }));
  }, [programs]);

  // Cost by program (for pie chart)
  const costByProgram = useMemo(() => {
    return programs
      .filter((p) => p.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 8)
      .map((p, i) => ({
        name: p.name.slice(0, 15) + (p.name.length > 15 ? '...' : ''),
        value: p.totalCost,
        color: COLORS[i % COLORS.length],
      }));
  }, [programs]);

  // Success rate by program
  const successRateByProgram = useMemo(() => {
    return programs
      .filter((p) => p.totalGenerated > 0)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.slice(0, 20) + (p.name.length > 20 ? '...' : ''),
        rate: p.successRate,
        color: p.successRate >= 90 ? '#10B981' : p.successRate >= 70 ? '#F59E0B' : '#EF4444',
      }));
  }, [programs]);

  // Production by platform
  const productionByPlatform = useMemo(() => {
    const byPlatform: Record<string, { generated: number; cost: number }> = {};

    programs.forEach((p) => {
      if (!byPlatform[p.platformId]) {
        byPlatform[p.platformId] = { generated: 0, cost: 0 };
      }
      byPlatform[p.platformId].generated += p.totalGenerated;
      byPlatform[p.platformId].cost += p.totalCost;
    });

    return PLATFORMS.map((platform) => ({
      name: platform.name,
      generated: byPlatform[platform.id]?.generated || 0,
      cost: byPlatform[platform.id]?.cost || 0,
      color: platform.color,
    }));
  }, [programs]);

  // Mock timeline data (would come from API)
  const timelineData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, period === '1y' ? 'MMM yy' : 'dd/MM', { locale: fr }),
        generated: Math.floor(Math.random() * 100) + 20,
        cost: Math.random() * 20 + 5,
      });
    }

    return data;
  }, [period]);

  const handleExport = () => {
    // Generate CSV or PDF report
    const csvContent = [
      ['Programme', 'Générés', 'Échoués', 'Coût', 'Taux succès'],
      ...programs.map((p) => [
        p.name,
        p.totalGenerated,
        p.totalFailed,
        p.totalCost.toFixed(2),
        p.successRate.toFixed(1) + '%',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="h-80 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Analytics des programmes</h1>
              <p className="text-sm text-muted-foreground">
                Vue d'ensemble de la performance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as PlatformId | 'all')}
                className="w-40"
              >
                <option value="all">Toutes plateformes</option>
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>

              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="w-44"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>

              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-3">
                {globalStats.totalGenerated.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Articles générés</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-3">
                {globalStats.avgSuccessRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Taux de succès moyen</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-3">
                ${globalStats.totalCost.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Coût total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-purple-100">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-3">
                {globalStats.activePrograms}/{globalStats.totalPrograms}
              </p>
              <p className="text-sm text-muted-foreground">Programmes actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Évolution de la production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="generated"
                  name="Articles générés"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Production by Program */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Production par programme (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productionByProgram} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="generated" name="Générés" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="failed" name="Échoués" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Répartition des coûts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={costByProgram}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {costByProgram.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Success Rate Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Comparaison des taux de succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {successRateByProgram.map((program, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-48 text-sm truncate">{program.name}</div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${program.rate}%`,
                          backgroundColor: program.color,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="w-16 text-right font-medium text-sm"
                    style={{ color: program.color }}
                  >
                    {program.rate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Performance par plateforme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {productionByPlatform.map((platform) => (
                <div
                  key={platform.name}
                  className="p-4 rounded-lg border"
                  style={{ borderLeftColor: platform.color, borderLeftWidth: 4 }}
                >
                  <h4 className="font-medium">{platform.name}</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Générés:</span>{' '}
                      <span className="font-medium">{platform.generated.toLocaleString()}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Coût:</span>{' '}
                      <span className="font-medium">${platform.cost.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProgramsAnalytics;