import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import {
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  overall: number; // -1 to 1
  confidence?: number;
  keywords?: {
    positive: string[];
    negative: string[];
  };
}

export interface SentimentChartProps {
  data: SentimentData;
  previousData?: SentimentData;
  title?: string;
  showKeywords?: boolean;
  showTrend?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const getSentimentLabel = (score: number): string => {
  if (score >= 0.3) return 'Positive';
  if (score <= -0.3) return 'Negative';
  return 'Neutral';
};

const getSentimentColor = (score: number): string => {
  if (score >= 0.3) return 'text-green-500';
  if (score <= -0.3) return 'text-red-500';
  return 'text-yellow-500';
};

const getSentimentIcon = (score: number) => {
  if (score >= 0.3) return <Smile className="h-5 w-5 text-green-500" />;
  if (score <= -0.3) return <Frown className="h-5 w-5 text-red-500" />;
  return <Meh className="h-5 w-5 text-yellow-500" />;
};

export function SentimentChart({
  data,
  previousData,
  title,
  showKeywords = true,
  showTrend = true,
  variant = 'full',
  className,
}: SentimentChartProps) {
  const { t } = useTranslation('quality');

  const trend = previousData
    ? {
        change: data.overall - previousData.overall,
        percentChange:
          previousData.overall !== 0
            ? ((data.overall - previousData.overall) / Math.abs(previousData.overall)) *
              100
            : 0,
      }
    : null;

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {getSentimentIcon(data.overall)}
        <span className={cn('font-medium', getSentimentColor(data.overall))}>
          {getSentimentLabel(data.overall)}
        </span>
        {data.confidence && (
          <Badge variant="outline" className="text-xs">
            {(data.confidence * 100).toFixed(0)}%
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSentimentIcon(data.overall)}
            <span className={cn('font-medium', getSentimentColor(data.overall))}>
              {getSentimentLabel(data.overall)}
            </span>
          </div>
          {trend && showTrend && (
            <Badge
              variant={trend.change > 0 ? 'default' : trend.change < 0 ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {trend.change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : trend.change < 0 ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : (
                <Minus className="h-3 w-3 mr-1" />
              )}
              {(trend.change * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="flex gap-1 h-2">
          <div
            className="bg-green-500 rounded-l"
            style={{ width: `${data.positive}%` }}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${data.neutral}%` }}
          />
          <div
            className="bg-red-500 rounded-r"
            style={{ width: `${data.negative}%` }}
          />
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getSentimentIcon(data.overall)}
              {title || t('analysis.sentiment')}
            </CardTitle>
            <CardDescription>
              {getSentimentLabel(data.overall)} sentiment detected
              {data.confidence && ` (${(data.confidence * 100).toFixed(0)}% confidence)`}
            </CardDescription>
          </div>
          {trend && showTrend && (
            <Badge
              variant={
                trend.change > 0 ? 'default' : trend.change < 0 ? 'destructive' : 'secondary'
              }
            >
              {trend.change > 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : trend.change < 0 ? (
                <TrendingDown className="h-4 w-4 mr-1" />
              ) : (
                <Minus className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend.change * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score gauge */}
        <div className="relative h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-2 border-gray-800 rounded-sm shadow-md"
            style={{
              left: `calc(${((data.overall + 1) / 2) * 100}% - 8px)`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-green-500" />
                Positive
              </span>
              <span className="font-medium">{data.positive.toFixed(1)}%</span>
            </div>
            <Progress value={data.positive} className="[&>div]:bg-green-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Meh className="h-4 w-4 text-yellow-500" />
                Neutral
              </span>
              <span className="font-medium">{data.neutral.toFixed(1)}%</span>
            </div>
            <Progress value={data.neutral} className="[&>div]:bg-yellow-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Frown className="h-4 w-4 text-red-500" />
                Negative
              </span>
              <span className="font-medium">{data.negative.toFixed(1)}%</span>
            </div>
            <Progress value={data.negative} className="[&>div]:bg-red-500" />
          </div>
        </div>

        {/* Keywords */}
        {showKeywords && data.keywords && (
          <div className="pt-4 border-t space-y-3">
            {data.keywords.positive.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Positive keywords</p>
                <div className="flex flex-wrap gap-1">
                  {data.keywords.positive.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-green-600 border-green-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.keywords.negative.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Negative keywords</p>
                <div className="flex flex-wrap gap-1">
                  {data.keywords.negative.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-red-600 border-red-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SentimentChart;
