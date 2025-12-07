import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface ProductionDataPoint {
  date: string;
  articles: number;
  piliers: number;
  landings: number;
  press: number;
  // Previous period for comparison
  articles_prev?: number;
  piliers_prev?: number;
  landings_prev?: number;
  press_prev?: number;
}

export interface ProductionChartProps {
  data: ProductionDataPoint[];
  height?: number;
  showComparison?: boolean;
  className?: string;
}

const SERIES_CONFIG = [
  { key: 'articles', name: 'Articles', color: '#3B82F6', prevKey: 'articles_prev' },
  { key: 'piliers', name: 'Piliers', color: '#8B5CF6', prevKey: 'piliers_prev' },
  { key: 'landings', name: 'Landings', color: '#10B981', prevKey: 'landings_prev' },
  { key: 'press', name: 'Presse', color: '#F59E0B', prevKey: 'press_prev' },
];

export function ProductionChart({
  data,
  height = 350,
  showComparison = false,
  className,
}: ProductionChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    articles: true,
    piliers: true,
    landings: true,
    press: true,
  });

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const totals = useMemo(() => {
    return SERIES_CONFIG.reduce((acc, series) => {
      acc[series.key] = data.reduce((sum, d) => sum + (d[series.key as keyof ProductionDataPoint] as number || 0), 0);
      return acc;
    }, {} as Record<string, number>);
  }, [data]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'EEE dd', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; name: string; value: number }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{formatDate(label || '')}</p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <span className="text-sm font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {SERIES_CONFIG.map((series) => (
          <Button
            key={series.key}
            variant={visibleSeries[series.key] ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleSeries(series.key)}
            className="gap-2"
            style={{
              backgroundColor: visibleSeries[series.key] ? series.color : undefined,
              borderColor: series.color,
              color: visibleSeries[series.key] ? 'white' : series.color,
            }}
          >
            <span>{series.name}</span>
            <span className="font-bold">({totals[series.key]})</span>
          </Button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />

          {SERIES_CONFIG.map((series) => (
            visibleSeries[series.key] && (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={series.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={500}
              />
            )
          ))}

          {/* Comparison lines (dashed) */}
          {showComparison && SERIES_CONFIG.map((series) => (
            visibleSeries[series.key] && (
              <Line
                key={series.prevKey}
                type="monotone"
                dataKey={series.prevKey}
                name={`${series.name} (période préc.)`}
                stroke={series.color}
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                opacity={0.5}
                isAnimationActive
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {SERIES_CONFIG.map((series) => (
          <div
            key={series.key}
            className="text-center p-3 rounded-lg"
            style={{ backgroundColor: `${series.color}10` }}
          >
            <p className="text-2xl font-bold" style={{ color: series.color }}>
              {totals[series.key]}
            </p>
            <p className="text-sm text-muted-foreground">{series.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductionChart;