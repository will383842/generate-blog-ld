import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ApiCostDataPoint {
  date: string;
  gpt4: number;
  gpt35: number;
  dalle: number;
  perplexity: number;
  total?: number;
}

export interface ApiCostsChartProps {
  data: ApiCostDataPoint[];
  dailyBudget?: number;
  height?: number;
  className?: string;
}

const API_CONFIG = [
  { key: 'gpt4', name: 'GPT-4', color: '#8B5CF6' },
  { key: 'gpt35', name: 'GPT-3.5', color: '#3B82F6' },
  { key: 'dalle', name: 'DALL-E', color: '#10B981' },
  { key: 'perplexity', name: 'Perplexity', color: '#F59E0B' },
];

export function ApiCostsChart({
  data,
  dailyBudget,
  height = 350,
  className,
}: ApiCostsChartProps) {
  const enrichedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      total: d.gpt4 + d.gpt35 + d.dalle + d.perplexity,
    }));
  }, [data]);

  const totals = useMemo(() => {
    const result = {
      gpt4: 0,
      gpt35: 0,
      dalle: 0,
      perplexity: 0,
      total: 0,
    };
    enrichedData.forEach((d) => {
      result.gpt4 += d.gpt4;
      result.gpt35 += d.gpt35;
      result.dalle += d.dalle;
      result.perplexity += d.perplexity;
      result.total += d.total || 0;
    });
    return result;
  }, [enrichedData]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'EEE dd', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; color: string; name: string; value: number }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;

    const total = payload.reduce((sum: number, entry) => sum + (entry.value || 0), 0);

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
              <span className="text-sm font-medium">${entry.value.toFixed(4)}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-bold">${total.toFixed(4)}</span>
          </div>
          {dailyBudget && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Budget journalier</span>
              <span className={cn(
                'font-medium',
                total > dailyBudget ? 'text-red-600' : 'text-green-600'
              )}>
                ${dailyBudget.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={enrichedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />

          {dailyBudget && (
            <ReferenceLine
              y={dailyBudget}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{
                value: `Budget: $${dailyBudget}`,
                position: 'right',
                fill: '#EF4444',
                fontSize: 12,
              }}
            />
          )}

          {API_CONFIG.map((api) => (
            <Bar
              key={api.key}
              dataKey={api.key}
              name={api.name}
              fill={api.color}
              stackId="costs"
              isAnimationActive
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {API_CONFIG.map((api) => (
          <div
            key={api.key}
            className="text-center p-3 rounded-lg border"
            style={{ borderColor: `${api.color}40` }}
          >
            <div
              className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: `${api.color}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: api.color }} />
            </div>
            <p className="text-lg font-bold" style={{ color: api.color }}>
              ${totals[api.key as keyof typeof totals].toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{api.name}</p>
          </div>
        ))}
        <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center bg-gray-200">
            <span className="text-xs font-bold text-gray-600">Σ</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            ${totals.total.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}

export default ApiCostsChart;