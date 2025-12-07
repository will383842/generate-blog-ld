/**
 * Cache Manager Component
 * File 291 - Display and manage research cache
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  Trash2,
  RefreshCw,
  Clock,
  BarChart3,
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/Alert';
import { useCacheStats, useClearCache } from '@/hooks/useResearch';
import { CacheStats, formatBytes } from '@/types/research';
import { cn } from '@/lib/utils';

interface CacheManagerProps {
  platformId: number;
  compact?: boolean;
}

export function CacheManager({ platformId, compact = false }: CacheManagerProps) {
  const { t } = useTranslation();

  // State
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearSource, setClearSource] = useState<string>('all');

  // API hooks
  const { data: stats, isLoading, refetch } = useCacheStats(platformId);
  const clearCache = useClearCache();

  // Handle clear cache
  const handleClearCache = () => {
    clearCache.mutate(
      {
        platformId,
        source: clearSource === 'all' ? undefined : clearSource,
      },
      {
        onSuccess: () => {
          setClearDialogOpen(false);
          refetch();
        },
      }
    );
  };

  // Get hit rate status
  const getHitRateStatus = (rate: number) => {
    if (rate >= 0.7) return { color: 'text-green-600', label: 'Excellent' };
    if (rate >= 0.5) return { color: 'text-yellow-600', label: 'Bon' };
    if (rate >= 0.3) return { color: 'text-orange-600', label: 'Moyen' };
    return { color: 'text-red-600', label: 'Faible' };
  };

  // Get usage status
  const getUsageStatus = (percent: number) => {
    if (percent >= 90) return { color: 'text-red-600', alert: true };
    if (percent >= 75) return { color: 'text-yellow-600', alert: false };
    return { color: 'text-green-600', alert: false };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Cache non disponible</p>
        </CardContent>
      </Card>
    );
  }

  const hitRateStatus = getHitRateStatus(stats.hit_rate);
  const usageStatus = getUsageStatus(stats.usage_percent);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Taux de hit</p>
              <p className={cn('text-xl font-bold', hitRateStatus.color)}>
                {(stats.hit_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilisation</p>
              <p className={cn('text-xl font-bold', usageStatus.color)}>
                {stats.usage_percent.toFixed(1)}%
              </p>
            </div>
          </div>
          <Progress value={stats.usage_percent} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total_entries} entrées • {formatBytes(stats.total_size_bytes)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Gestion du cache
            </CardTitle>
            <CardDescription>
              Statistiques et gestion du cache de recherche
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vider
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Alert */}
        {usageStatus.alert && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cache presque plein</AlertTitle>
            <AlertDescription>
              Le cache utilise {stats.usage_percent.toFixed(1)}% de sa capacité.
              Pensez à le vider pour maintenir les performances.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Hit Rate */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taux de hit</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={cn('text-2xl font-bold', hitRateStatus.color)}>
              {(stats.hit_rate * 100).toFixed(1)}%
            </p>
            <Badge variant="outline" className={cn('mt-1', hitRateStatus.color)}>
              {hitRateStatus.label}
            </Badge>
          </div>

          {/* Entries */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Entrées</span>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.total_entries}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.hit_count} hits / {stats.miss_count} miss
            </p>
          </div>

          {/* Size */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taille</span>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{formatBytes(stats.total_size_bytes)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              / {formatBytes(stats.max_size_bytes)}
            </p>
          </div>

          {/* Usage */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Utilisation</span>
              {usageStatus.alert ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className={cn('text-2xl font-bold', usageStatus.color)}>
              {stats.usage_percent.toFixed(1)}%
            </p>
            <Progress
              value={stats.usage_percent}
              className="mt-2 h-2"
            />
          </div>
        </div>

        {/* Entries by Source */}
        {Object.keys(stats.entries_by_source).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Entrées par source</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(stats.entries_by_source).map(([source, count]) => (
                <div
                  key={source}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <span className="text-sm">{source}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Plus ancienne: {stats.oldest_entry_at
              ? new Date(stats.oldest_entry_at).toLocaleDateString()
              : 'N/A'}
          </div>
          <div>
            Plus récente: {stats.newest_entry_at
              ? new Date(stats.newest_entry_at).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>
      </CardContent>

      {/* Clear Cache Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vider le cache</DialogTitle>
            <DialogDescription>
              Cette action supprimera les entrées sélectionnées du cache.
              Les prochaines requêtes devront être recalculées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Source à vider</Label>
              <Select value={clearSource} onValueChange={setClearSource}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  {Object.keys(stats.entries_by_source).map(source => (
                    <SelectItem key={source} value={source}>
                      {source} ({stats.entries_by_source[source]} entrées)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {clearSource === 'all'
                  ? `Toutes les ${stats.total_entries} entrées seront supprimées.`
                  : `${stats.entries_by_source[clearSource] || 0} entrées de "${clearSource}" seront supprimées.`}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearCache}
              disabled={clearCache.isPending}
            >
              {clearCache.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Vider le cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CacheManager;
