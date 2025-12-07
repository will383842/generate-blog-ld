/**
 * Queue Stats
 * Real-time queue statistics with gauges
 */

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useQueueStats } from '@/hooks/useQueue';

export interface QueueStatsProps {
  className?: string;
}

interface StatGaugeProps {
  value: number;
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
  suffix?: string;
}

function StatGauge({ value, label, icon: Icon, color, bgColor, suffix }: StatGaugeProps) {
  return (
    <div className={cn('rounded-xl p-4', bgColor)}>
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-lg', color.replace('text-', 'bg-').replace('600', '100'))}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <Badge variant="secondary" className="text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>
      <div className="mt-4">
        <p className={cn('text-3xl font-bold', color)}>
          {value.toLocaleString()}{suffix}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export function QueueStats({ className }: QueueStatsProps) {
  const { data: statsData, isLoading } = useQueueStats();
  const stats = statsData?.data;

  const etaFormatted = useMemo(() => {
    if (!stats?.estimatedCompletionTime) return null;
    try {
      return formatDistanceToNow(new Date(stats.estimatedCompletionTime), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return null;
    }
  }, [stats?.estimatedCompletionTime]);

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-100 p-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="mt-4">
              <div className="h-8 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-24 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatGauge
          value={stats?.pending || 0}
          label="En attente"
          icon={Clock}
          color="text-gray-600"
          bgColor="bg-gray-50"
        />
        <StatGauge
          value={stats?.processing || 0}
          label="En cours"
          icon={Loader2}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatGauge
          value={stats?.completed || 0}
          label="Terminés"
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatGauge
          value={stats?.failed || 0}
          label="Échoués"
          icon={AlertCircle}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Jobs per minute */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-lg font-bold">{stats?.jobsPerMinute?.toFixed(1) || 0}/min</p>
            <p className="text-xs text-muted-foreground">Débit</p>
          </div>
        </div>

        {/* Avg duration */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-lg font-bold">
              {stats?.avgDuration ? `${Math.round(stats.avgDuration)}s` : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Durée moy.</p>
          </div>
        </div>

        {/* Today cost */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <DollarSign className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-lg font-bold">${stats?.todayCost?.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-muted-foreground">Coût aujourd'hui</p>
          </div>
        </div>

        {/* ETA */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-lg font-bold">{etaFormatted || '-'}</p>
            <p className="text-xs text-muted-foreground">Fin estimée</p>
          </div>
        </div>
      </div>

      {/* Today summary */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div>
          <p className="font-medium">Aujourd'hui</p>
          <p className="text-sm text-muted-foreground">
            {stats?.todayCompleted || 0} articles générés
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Taux d'échec</p>
          <p className={cn(
            'text-lg font-bold',
            (stats?.todayFailed || 0) / Math.max(stats?.todayCompleted || 1, 1) > 0.1
              ? 'text-red-600'
              : 'text-green-600'
          )}>
            {stats?.todayCompleted
              ? ((stats.todayFailed / stats.todayCompleted) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default QueueStats;
