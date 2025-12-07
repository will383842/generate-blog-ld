import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  FileText,
  Link2,
  Image,
  Clock,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SeoCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SeoScoreData {
  overall: number;
  categories: {
    content: number;
    technical: number;
    links: number;
    performance: number;
  };
  checks: SeoCheck[];
}

export interface SeoScoreDetailsProps {
  data: SeoScoreData;
  showChecks?: boolean;
  showCategories?: boolean;
  compact?: boolean;
  className?: string;
}

const statusIcons = {
  pass: <CheckCircle className="h-4 w-4 text-green-500" />,
  fail: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const impactColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const categoryIcons = {
  content: <FileText className="h-4 w-4" />,
  technical: <Globe className="h-4 w-4" />,
  links: <Link2 className="h-4 w-4" />,
  performance: <Clock className="h-4 w-4" />,
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
};

const getProgressColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

export function SeoScoreDetails({
  data,
  showChecks = true,
  showCategories = true,
  compact = false,
  className,
}: SeoScoreDetailsProps) {
  const { t } = useTranslation('seo');

  const passedChecks = data.checks.filter((c) => c.status === 'pass').length;
  const totalChecks = data.checks.length;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="text-center">
          <div className={cn('text-3xl font-bold', getScoreColor(data.overall))}>
            {data.overall}
          </div>
          <div className="text-xs text-muted-foreground">/100</div>
        </div>
        <div className="flex-1">
          <Progress
            value={data.overall}
            className="h-2"
            indicatorClassName={getProgressColor(data.overall)}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {passedChecks}/{totalChecks} {t('analysis.checksPassed')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div
                className={cn(
                  'text-5xl font-bold',
                  getScoreColor(data.overall)
                )}
              >
                {data.overall}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t('analysis.overallScore')}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Progress
                value={data.overall}
                className="h-3"
                indicatorClassName={getProgressColor(data.overall)}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {passedChecks}/{totalChecks} {t('analysis.checksPassed')}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    data.overall >= 80
                      ? 'text-green-600'
                      : data.overall >= 60
                      ? 'text-amber-600'
                      : 'text-red-600'
                  )}
                >
                  {data.overall >= 80
                    ? t('scores.excellent')
                    : data.overall >= 60
                    ? t('scores.good')
                    : t('scores.needsWork')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {showCategories && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analysis.categories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(data.categories) as [keyof typeof categoryIcons, number][]).map(
                ([key, score]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {categoryIcons[key]}
                        {t(`analysis.${key}`)}
                      </div>
                      <span className={cn('font-bold', getScoreColor(score))}>
                        {score}
                      </span>
                    </div>
                    <Progress
                      value={score}
                      className="h-1.5"
                      indicatorClassName={getProgressColor(score)}
                    />
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checks */}
      {showChecks && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analysis.checks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {statusIcons[check.status]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{check.name}</span>
                      <Badge className={cn('text-xs', impactColors[check.impact])}>
                        {t(`analysis.impact.${check.impact}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {check.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SeoScoreDetails;
