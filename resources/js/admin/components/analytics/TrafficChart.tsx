/**
 * Traffic Chart Component
 * File 330 - Multi-series line chart for traffic data
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useTrafficData, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface TrafficChartProps {
  period?: PeriodType;
  dateRange?: DateRange;
  height?: number;
}

interface Series {
  key: string;
  label: string;
  color: string;
  visible: boolean;
}

export function TrafficChart({ period = '30d', dateRange, height = 300 }: TrafficChartProps) {
  const { t } = useTranslation();
  const { data: trafficData } = useTrafficData(period, dateRange);

  const [series, setSeries] = useState<Series[]>([
    { key: 'views', label: 'Pages vues', color: '#3B82F6', visible: true },
    { key: 'visitors', label: 'Visiteurs', color: '#8B5CF6', visible: true },
    { key: 'organic', label: 'Organique', color: '#22C55E', visible: false },
    { key: 'direct', label: 'Direct', color: '#F59E0B', visible: false },
    { key: 'referral', label: 'Référents', color: '#EF4444', visible: false },
  ]);

  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    values: Record<string, number>;
    x: number;
    y: number;
  } | null>(null);

  // Toggle series visibility
  const toggleSeries = (key: string) => {
    setSeries(series.map(s => 
      s.key === key ? { ...s, visible: !s.visible } : s
    ));
  };

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Get visible series data
  const visibleSeries = series.filter(s => s.visible);
  const data = trafficData?.dailyTraffic || [];

  // Calculate scales
  const maxValue = Math.max(
    ...data.flatMap(d => visibleSeries.map(s => (d as Record<string, number>)[s.key] || 0))
  );
  const yScale = (value: number) => plotHeight - (value / maxValue) * plotHeight;
  const xScale = (index: number) => (index / (data.length - 1)) * plotWidth;

  // Generate path for a series
  const generatePath = (seriesKey: string) => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = xScale(i);
      const y = yScale((d as Record<string, number>)[seriesKey] || 0);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Export chart as image
  const exportChart = () => {
    // TODO: Implement canvas/svg export for charts
  };

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Évolution du trafic</CardTitle>
          <Button variant="outline" size="sm" onClick={exportChart}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {series.map(s => (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors',
                s.visible ? 'bg-muted' : 'bg-transparent opacity-50'
              )}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
              {s.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full"
            style={{ height }}
          >
            {/* Grid lines */}
            <g className="grid">
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = padding.top + plotHeight * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + plotWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeDasharray="4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs fill-gray-500"
                    >
                      {formatNumber(Math.round(maxValue * (1 - ratio)))}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* X-axis labels */}
            <g className="x-axis">
              {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((d, i) => {
                const originalIndex = data.indexOf(d);
                const x = padding.left + xScale(originalIndex);
                return (
                  <text
                    key={i}
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {new Date(d.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </text>
                );
              })}
            </g>

            {/* Lines */}
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {visibleSeries.map(s => (
                <path
                  key={s.key}
                  d={generatePath(s.key)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  className="transition-opacity"
                />
              ))}

              {/* Hover points */}
              {data.map((d, i) => (
                <g key={i}>
                  <rect
                    x={xScale(i) - 10}
                    y={0}
                    width={20}
                    height={plotHeight}
                    fill="transparent"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredPoint({
                        date: d.date,
                        values: visibleSeries.reduce((acc, s) => ({
                          ...acc,
                          [s.key]: (d as Record<string, number>)[s.key],
                        }), {}),
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {visibleSeries.map(s => (
                    <circle
                      key={s.key}
                      cx={xScale(i)}
                      cy={yScale((d as Record<string, number>)[s.key] || 0)}
                      r={hoveredPoint?.date === d.date ? 5 : 3}
                      fill={s.color}
                      className="transition-all"
                    />
                  ))}
                </g>
              ))}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 pointer-events-none"
              style={{
                left: hoveredPoint.x,
                top: hoveredPoint.y - 100,
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-medium text-sm mb-2">
                {new Date(hoveredPoint.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <div className="space-y-1">
                {visibleSeries.map(s => (
                  <div key={s.key} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(hoveredPoint.values[s.key] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sources Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
          {trafficData?.sources?.slice(0, 4).map(source => (
            <div key={source.source} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-sm capitalize">{source.source}</span>
              </div>
              <p className="text-lg font-bold">{formatNumber(source.visitors)}</p>
              <div className="flex items-center justify-center">
                {source.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : source.trend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                ) : null}
                <span className={cn(
                  'text-xs',
                  source.trend > 0 ? 'text-green-600' : source.trend < 0 ? 'text-red-600' : 'text-gray-500'
                )}>
                  {source.trend > 0 ? '+' : ''}{source.trend.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrafficChart;
