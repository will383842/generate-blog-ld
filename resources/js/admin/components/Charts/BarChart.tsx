import { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color: string;
  stackId?: string;
}

export interface BarChartProps<T extends Record<string, unknown>> {
  data: T[];
  series: BarChartSeries[];
  xAxisKey: string;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  barSize?: number;
  className?: string;
  referenceLine?: { y: number; label: string; color: string };
  xAxisFormatter?: (value: string | number) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function BarChart<T extends Record<string, unknown>>({
  data,
  series,
  xAxisKey,
  height = 300,
  layout = 'horizontal',
  stacked = false,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animate = true,
  barSize = 20,
  className,
  referenceLine,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
}: BarChartProps<T>) {
  const defaultTooltipFormatter = useMemo(
    () => (value: number, name: string): [string, string] => {
      return [value.toLocaleString('fr-FR'), name];
    },
    []
  );

  const stackId = stacked ? 'stack' : undefined;

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          )}
          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                tickFormatter={xAxisFormatter}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tickFormatter={yAxisFormatter}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tickFormatter={yAxisFormatter}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                tickFormatter={xAxisFormatter}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                width={100}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              formatter={tooltipFormatter || defaultTooltipFormatter}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="rect"
              wrapperStyle={{ paddingBottom: 10 }}
            />
          )}
          {referenceLine && (
            <ReferenceLine
              y={referenceLine.y}
              stroke={referenceLine.color}
              strokeDasharray="5 5"
              label={{
                value: referenceLine.label,
                position: 'right',
                fill: referenceLine.color,
                fontSize: 12,
              }}
            />
          )}
          {series.map((s) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={s.color}
              stackId={s.stackId || stackId}
              barSize={barSize}
              isAnimationActive={animate}
              animationDuration={500}
              radius={stacked ? 0 : [4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChart;