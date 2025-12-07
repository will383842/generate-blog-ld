/**
 * Coverage Stats Component
 * Display coverage statistics cards with trends
 */

import {
  Globe,
  Languages,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useCoverageGlobal } from '@/hooks/useCoverage';
import type { PlatformId } from '@/types/program';

type StatColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

interface CoverageStatsProps {
  platformId?: PlatformId;
  className?: string;
}

export function CoverageStats({ platformId, className }: CoverageStatsProps) {
  const { data: coverageData, isLoading } = useCoverageGlobal({ platformId });
  const summary = coverageData?.data?.summary;

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-4 gap-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const stats: Array<{
    label: string;
    value: string;
    icon: typeof Globe;
    color: StatColor;
    trend?: number;
    subValue?: string;
    progress?: number;
  }> = [
    {
      label: 'Couverture globale',
      value: `${summary.globalPercentage.toFixed(1)}%`,
      icon: Globe,
      color: 'blue',
      trend: summary.weeklyChange,
      progress: summary.globalPercentage,
    },
    {
      label: 'Pays couverts',
      value: `${summary.coveredCountries}/${summary.totalCountries}`,
      icon: Globe,
      color: 'green',
      subValue: `${((summary.coveredCountries / summary.totalCountries) * 100).toFixed(0)}%`,
    },
    {
      label: 'Langues actives',
      value: `${summary.coveredLanguages}/${summary.totalLanguages}`,
      icon: Languages,
      color: 'purple',
      subValue: `${((summary.coveredLanguages / summary.totalLanguages) * 100).toFixed(0)}%`,
    },
    {
      label: 'Types de contenu',
      value: summary.totalContentTypes.toString(),
      icon: FileText,
      color: 'orange',
    },
  ];

  return (
    <div className={cn('grid grid-cols-4 gap-4', className)}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: typeof Globe;
  color: StatColor;
  trend?: number;
  subValue?: string;
  progress?: number;
}

function StatCard({ label, value, icon: Icon, color, trend, subValue, progress }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  // Map StatColor to ProgressBar color prop
  const getProgressColor = (c: StatColor): 'primary' | 'success' | 'warning' | 'danger' => {
    switch (c) {
      case 'green':
        return 'success';
      case 'orange':
        return 'warning';
      case 'red':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <TrendBadge value={trend} />
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        {progress !== undefined && (
          <div className="mt-3">
            <ProgressBar
              value={progress}
              size="sm"
              color={getProgressColor(color)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Minus className="w-3 h-3 mr-1" />
        0%
      </Badge>
    );
  }

  if (value > 0) {
    return (
      <Badge className="bg-green-100 text-green-700 text-xs">
        <TrendingUp className="w-3 h-3 mr-1" />
        +{value.toFixed(1)}%
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-700 text-xs">
      <TrendingDown className="w-3 h-3 mr-1" />
      {value.toFixed(1)}%
    </Badge>
  );
}

/**
 * Coverage Summary Cards
 * More detailed stats with breakdown
 */
export function CoverageSummaryCards({ platformId }: { platformId?: PlatformId }) {
  const { data: coverageData, isLoading } = useCoverageGlobal({ platformId });
  const summary = coverageData?.data?.summary;

  if (isLoading || !summary) return null;

  // Count by status
  const completeCount = Object.values(summary.byCountry).filter(
    (c) => c.percentage >= 90
  ).length;
  const partialCount = Object.values(summary.byCountry).filter(
    (c) => c.percentage >= 50 && c.percentage < 90
  ).length;
  const minimalCount = Object.values(summary.byCountry).filter(
    (c) => c.percentage >= 10 && c.percentage < 50
  ).length;
  const missingCount = Object.values(summary.byCountry).filter(
    (c) => c.percentage < 10
  ).length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{completeCount}</p>
              <p className="text-xs text-muted-foreground">Couverture complète</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{partialCount}</p>
              <p className="text-xs text-muted-foreground">Couverture partielle</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{minimalCount}</p>
              <p className="text-xs text-muted-foreground">Couverture minimale</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{missingCount}</p>
              <p className="text-xs text-muted-foreground">Non couvert</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}