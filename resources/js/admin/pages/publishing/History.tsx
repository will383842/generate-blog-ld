/**
 * Publication History Page
 * File 392 - Full page publication history with advanced filters
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Download,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  FileJson,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { PublishHistory } from '@/components/publishing/PublishHistory';
import {
  usePublishHistory,
  usePlatforms,
  usePublishingStats,
} from '@/hooks/usePublishing';
import { PublishQueueFilters, PublishStatus } from '@/types/publishing';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function HistoryPage() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<PublishQueueFilters>({
    per_page: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: historyData, isLoading, refetch, isFetching } = usePublishHistory(filters);
  const { data: platforms } = usePlatforms();
  const { data: stats } = usePublishingStats();

  // Quick date filters
  const applyDateFilter = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setFilters({
          ...filters,
          dateFrom: format(today, 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case 'week':
        setFilters({
          ...filters,
          dateFrom: format(startOfWeek(today, { locale: fr }), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case 'month':
        setFilters({
          ...filters,
          dateFrom: format(startOfMonth(today), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case '7days':
        setFilters({
          ...filters,
          dateFrom: format(subDays(today, 7), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      case '30days':
        setFilters({
          ...filters,
          dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
          dateTo: format(today, 'yyyy-MM-dd'),
        });
        break;
      default:
        setFilters({
          ...filters,
          dateFrom: undefined,
          dateTo: undefined,
        });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!historyData?.data) return;
    const csv = [
      'id,content_id,content_title,platform,status,scheduled_at,published_at,external_url',
      ...historyData.data.map(item =>
        `${item.id},${item.contentId},"${item.content?.title || ''}","${item.platform?.name || ''}",${item.status},${item.scheduledAt || ''},${item.publishedAt || ''},"${item.externalUrl || ''}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publications-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!historyData?.data) return;
    const json = JSON.stringify(historyData.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publications-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ per_page: 50 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
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
            <History className="h-6 w-6" />
            Historique des publications
          </h1>
          <p className="text-muted-foreground">
            {historyData?.total || 0} publication{(historyData?.total || 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Actualiser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats?.byStatus?.published || 0}
            </p>
            <p className="text-xs text-muted-foreground">Réussies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {stats?.byStatus?.failed || 0}
            </p>
            <p className="text-xs text-muted-foreground">Échouées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className={cn(
              'text-2xl font-bold',
              (stats?.successRate || 0) >= 95 && 'text-green-600',
              (stats?.successRate || 0) >= 80 && (stats?.successRate || 0) < 95 && 'text-yellow-600',
              (stats?.successRate || 0) < 80 && 'text-red-600'
            )}>
              {stats?.successRate?.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taux de succès</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {stats?.avgDuration ? `${stats.avgDuration.toFixed(0)}ms` : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Durée moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Date Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Période :</span>
              {[
                { label: 'Tout', value: 'all' },
                { label: "Aujourd'hui", value: 'today' },
                { label: '7 jours', value: '7days' },
                { label: '30 jours', value: '30days' },
                { label: 'Ce mois', value: 'month' },
              ].map(preset => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => applyDateFilter(preset.value)}
                  className={cn(
                    preset.value === 'all' && !filters.dateFrom && 'bg-primary text-primary-foreground'
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Status Filter */}
            <Select
              value={filters.status as string || 'all'}
              onValueChange={(v) => setFilters({
                ...filters,
                status: v === 'all' ? undefined : v as PublishStatus,
              })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les status</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>

            {/* Platform Filter */}
            <Select
              value={String(filters.platformId || 'all')}
              onValueChange={(v) => setFilters({
                ...filters,
                platformId: v === 'all' ? undefined : parseInt(v),
              })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plateforme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {platforms?.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres avancés
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres avancés</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Recherche</Label>
                    <Input
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Rechercher..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date de début</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Résultats par page</Label>
                    <Select
                      value={String(filters.per_page || 50)}
                      onValueChange={(v) => setFilters({ ...filters, per_page: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={resetFilters} className="flex-1">
                      Réinitialiser
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1">
                      Appliquer
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <PublishHistory />
    </div>
  );
}
