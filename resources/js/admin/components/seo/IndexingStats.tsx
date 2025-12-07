/**
 * Indexing Stats Component
 * File 319 - Display indexing statistics with quotas and success rates
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Check,
  X,
  AlertTriangle,
  Zap,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { IndexingStats as IndexingStatsType } from '@/types/seo';
import { cn } from '@/lib/utils';

interface IndexingStatsProps {
  stats?: IndexingStatsType;
  onSubmitAll?: () => void;
  isLoading?: boolean;
}

export function IndexingStats({ stats, onSubmitAll, isLoading }: IndexingStatsProps) {
  const { t } = useTranslation();

  // Get quota color
  const getQuotaColor = (used: number, limit: number) => {
    const percent = (used / limit) * 100;
    if (percent >= 95) return 'text-red-600';
    if (percent >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getQuotaProgressColor = (used: number, limit: number) => {
    const percent = (used / limit) * 100;
    if (percent >= 95) return '[&>div]:bg-red-500';
    if (percent >= 75) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Google Quota */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Google API Quota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Circular Gauge */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    (stats.googleQuota.used / stats.googleQuota.limit) >= 0.95 ? '#ef4444' :
                    (stats.googleQuota.used / stats.googleQuota.limit) >= 0.75 ? '#f59e0b' : '#22c55e'
                  }
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.googleQuota.used / stats.googleQuota.limit) * 251} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('text-lg font-bold', getQuotaColor(stats.googleQuota.used, stats.googleQuota.limit))}>
                  {stats.googleQuota.used}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {stats.googleQuota.used} / {stats.googleQuota.limit} utilisés
              </p>
              <Progress
                value={(stats.googleQuota.used / stats.googleQuota.limit) * 100}
                className={cn('h-2 mt-2', getQuotaProgressColor(stats.googleQuota.used, stats.googleQuota.limit))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.googleQuota.limit - stats.googleQuota.used} restants aujourd'hui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bing Quota */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-500" />
            Bing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn('text-2xl font-bold', getQuotaColor(stats.bingQuota.used, stats.bingQuota.limit))}>
            {stats.bingQuota.used}/{stats.bingQuota.limit}
          </p>
          <p className="text-xs text-muted-foreground">par jour</p>
        </CardContent>
      </Card>

      {/* IndexNow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            IndexNow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
            Illimité
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">Soumission instantanée</p>
        </CardContent>
      </Card>

      {/* Today's Submissions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Soumis aujourd'hui</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.todaySubmitted}</p>
          <p className="text-xs text-muted-foreground">articles</p>
        </CardContent>
      </Card>

      {/* Not Indexed */}
      <Card className={stats.notIndexedCount > 0 ? 'border-yellow-200' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Non indexés
            {stats.notIndexedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.notIndexedCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.notIndexedCount > 0 ? (
            <>
              <p className="text-2xl font-bold text-yellow-600">{stats.notIndexedCount}</p>
              {onSubmitAll && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={onSubmitAll}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Tout indexer
                </Button>
              )}
            </>
          ) : (
            <p className="text-2xl font-bold text-green-600">0</p>
          )}
        </CardContent>
      </Card>

      {/* Success/Failure Stats - Full Width Row */}
      <Card className="col-span-2 md:col-span-4 lg:col-span-6">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Google Stats */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Google</p>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">{stats.googleSuccess}</span>
                    </TooltipTrigger>
                    <TooltipContent>Indexations réussies</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="font-bold text-red-600">{stats.googleFailed}</span>
                    </TooltipTrigger>
                    <TooltipContent>Indexations échouées</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* IndexNow Stats */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">IndexNow</p>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">{stats.indexnowSuccess}</span>
                    </TooltipTrigger>
                    <TooltipContent>Soumissions acceptées</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="font-bold text-red-600">{stats.indexnowFailed}</span>
                    </TooltipTrigger>
                    <TooltipContent>Soumissions échouées</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Queue Stats */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">File d'attente</p>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-yellow-50">
                        {stats.pending} en attente
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Articles en attente de soumission</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-blue-50">
                        {stats.processing} en cours
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Soumissions en cours</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Completed/Failed */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Résultats</p>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-green-100 text-green-800">
                        {stats.completed} terminés
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Indexations terminées avec succès</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive">
                        {stats.failed} échecs
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Indexations échouées</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IndexingStats;
