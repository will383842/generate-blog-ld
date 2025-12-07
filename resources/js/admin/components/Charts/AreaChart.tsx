import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface AreaChartDataPoint {
  [key: string]: string | number;
}

export interface AreaConfig {
  dataKey: string;
  name?: string;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  stackId?: string;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  areas: AreaConfig[];
  xAxisKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  xAxisFormatter?: (value: string) => string;
  gradientColors?: boolean;
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
];

export function AreaChart({
  data,
  areas,
  xAxisKey,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
  yAxisFormatter,
  tooltipFormatter,
  xAxisFormatter,
  gradientColors = true,
}: AreaChartProps) {
  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        {gradientColors && (
          <defs>
            {areas.map((area, index) => {
              const color = area.color || defaultColors[index % defaultColors.length];
              return (
                <linearGradient
                  key={`gradient-${area.dataKey}`}
                  id={`gradient-${area.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
        )}
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={xAxisFormatter}
          className="text-xs fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={yAxisFormatter}
          className="text-xs fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
        )}
        {showLegend && <Legend />}
        {areas.map((area, index) => {
          const color = area.color || defaultColors[index % defaultColors.length];
          return (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              stroke={color}
              strokeWidth={area.strokeWidth || 2}
              fill={gradientColors ? `url(#gradient-${area.dataKey})` : color}
              fillOpacity={area.fillOpacity ?? (gradientColors ? 1 : 0.3)}
              stackId={area.stackId}
            />
          );
        })}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>{chartContent}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{chartContent}</div>;
}

export default AreaChart;
