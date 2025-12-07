import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  className?: string;
  valueFormatter?: (value: number) => string;
  colors?: string[];
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#84CC16', // lime
];

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: LabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PieChart({
  data,
  title,
  subtitle,
  height = 300,
  innerRadius = 0,
  outerRadius = 100,
  showLegend = true,
  showTooltip = true,
  showLabels = true,
  className,
  valueFormatter = (value) => value.toLocaleString(),
  colors = defaultColors,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabels ? renderCustomLabel : undefined}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
              className="stroke-background"
              strokeWidth={2}
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            formatter={(value: number, name: string) => [
              valueFormatter(value),
              name,
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
        )}
        {showLegend && (
          <Legend
            formatter={(value: string) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );

  // Center content for donut chart
  const centerContent = innerRadius > 0 && (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{ top: '15%', bottom: showLegend ? '25%' : '15%' }}
    >
      <span className="text-2xl font-bold">{valueFormatter(total)}</span>
      <span className="text-sm text-muted-foreground">Total</span>
    </div>
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
        <CardContent className="relative">
          {chartContent}
          {centerContent}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {chartContent}
      {centerContent}
    </div>
  );
}

export default PieChart;
