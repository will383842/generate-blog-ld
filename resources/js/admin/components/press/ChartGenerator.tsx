import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Plus,
  Trash2,
  Download,
  Check,
  Palette,
  Table,
  FileText,
  Settings,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import { ChartData, ChartType } from '@/types/press';

interface ChartGeneratorProps {
  onInsert: (chartData: ChartData) => void;
  initialData?: ChartData;
}

interface DataRow {
  id: string;
  label: string;
  values: number[];
}

interface ChartConfig {
  showLegend: boolean;
  showGrid: boolean;
  showValues: boolean;
  animated: boolean;
  colors: string[];
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

const CHART_TYPES: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: 'bar', icon: <BarChart3 className="h-5 w-5" />, label: 'Barres' },
  { type: 'line', icon: <LineChart className="h-5 w-5" />, label: 'Lignes' },
  { type: 'area', icon: <AreaChart className="h-5 w-5" />, label: 'Aires' },
  { type: 'pie', icon: <PieChart className="h-5 w-5" />, label: 'Camembert' },
];

export const ChartGenerator: React.FC<ChartGeneratorProps> = ({
  onInsert,
  initialData,
}) => {
  const { t } = useTranslation(['press', 'common']);

  // Chart type
  const [chartType, setChartType] = useState<ChartType>(
    initialData?.type || 'bar'
  );

  // Data input mode
  const [inputMode, setInputMode] = useState<'table' | 'csv'>('table');

  // CSV input
  const [csvInput, setCsvInput] = useState('');

  // Column headers (for multi-series)
  const [columns, setColumns] = useState<string[]>(
    initialData?.labels || ['Série 1']
  );

  // Data rows
  const [rows, setRows] = useState<DataRow[]>(() => {
    if (initialData?.datasets) {
      return initialData.labels?.map((label, idx) => ({
        id: `row-${idx}`,
        label,
        values: initialData.datasets.map((ds) => ds.data[idx] || 0),
      })) || [];
    }
    return [
      { id: 'row-1', label: 'Item 1', values: [100] },
      { id: 'row-2', label: 'Item 2', values: [80] },
      { id: 'row-3', label: 'Item 3', values: [60] },
    ];
  });

  // Chart title and source
  const [chartTitle, setChartTitle] = useState(initialData?.title || '');
  const [chartSource, setChartSource] = useState(initialData?.source || '');

  // Config options
  const [config, setConfig] = useState<ChartConfig>({
    showLegend: true,
    showGrid: true,
    showValues: false,
    animated: true,
    colors: DEFAULT_COLORS,
  });

  // Generate unique ID
  const generateId = () => `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add row
  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: generateId(),
        label: `Item ${prev.length + 1}`,
        values: columns.map(() => 0),
      },
    ]);
  }, [columns]);

  // Remove row
  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  // Update row label
  const updateRowLabel = useCallback((id: string, label: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, label } : row))
    );
  }, []);

  // Update row value
  const updateRowValue = useCallback(
    (id: string, colIndex: number, value: number) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id === id) {
            const newValues = [...row.values];
            newValues[colIndex] = value;
            return { ...row, values: newValues };
          }
          return row;
        })
      );
    },
    []
  );

  // Add column
  const addColumn = useCallback(() => {
    setColumns((prev) => [...prev, `Série ${prev.length + 1}`]);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        values: [...row.values, 0],
      }))
    );
  }, []);

  // Remove column
  const removeColumn = useCallback((index: number) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        values: row.values.filter((_, i) => i !== index),
      }))
    );
  }, [columns.length]);

  // Update column name
  const updateColumnName = useCallback((index: number, name: string) => {
    setColumns((prev) => prev.map((col, i) => (i === index ? name : col)));
  }, []);

  // Parse CSV
  const parseCSV = useCallback(() => {
    const lines = csvInput.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(/[,;\t]/).map((h) => h.trim());
    const newColumns = headers.slice(1);
    const newRows: DataRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,;\t]/).map((c) => c.trim());
      if (cells.length > 1) {
        newRows.push({
          id: generateId(),
          label: cells[0],
          values: cells.slice(1).map((v) => parseFloat(v) || 0),
        });
      }
    }

    if (newColumns.length > 0 && newRows.length > 0) {
      setColumns(newColumns);
      setRows(newRows);
      setInputMode('table');
    }
  }, [csvInput]);

  // Chart data for Recharts
  const chartData = useMemo(() => {
    return rows.map((row) => {
      const dataPoint: Record<string, string | number> = { name: row.label };
      columns.forEach((col, idx) => {
        dataPoint[col] = row.values[idx] || 0;
      });
      return dataPoint;
    });
  }, [rows, columns]);

  // Pie chart data
  const pieData = useMemo(() => {
    return rows.map((row, idx) => ({
      name: row.label,
      value: row.values[0] || 0,
      color: config.colors[idx % config.colors.length],
    }));
  }, [rows, config.colors]);

  // Render chart preview
  const renderChart = () => {
    if (rows.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {t('press:chart.noData')}
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {config.showLegend && <Legend />}
              {columns.map((col, idx) => (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={config.colors[idx % config.colors.length]}
                  animationDuration={config.animated ? 500 : 0}
                  label={config.showValues ? { position: 'top' } : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {config.showLegend && <Legend />}
              {columns.map((col, idx) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={config.colors[idx % config.colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  animationDuration={config.animated ? 500 : 0}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsAreaChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {config.showLegend && <Legend />}
              {columns.map((col, idx) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={config.colors[idx % config.colors.length]}
                  fill={config.colors[idx % config.colors.length]}
                  fillOpacity={0.3}
                  animationDuration={config.animated ? 500 : 0}
                />
              ))}
            </RechartsAreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={config.showValues}
                label={
                  config.showValues
                    ? ({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                    : undefined
                }
                outerRadius={100}
                dataKey="value"
                animationDuration={config.animated ? 500 : 0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              {config.showLegend && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Build chart data for insertion
  const buildChartData = (): ChartData => {
    return {
      type: chartType,
      title: chartTitle,
      labels: rows.map((r) => r.label),
      datasets: columns.map((col, idx) => ({
        label: col,
        data: rows.map((r) => r.values[idx] || 0),
        backgroundColor: config.colors[idx % config.colors.length],
        borderColor: config.colors[idx % config.colors.length],
      })),
      options: {
        showLegend: config.showLegend,
        showGrid: config.showGrid,
        showValues: config.showValues,
        animate: config.animated,
      },
      source: chartSource || undefined,
    };
  };

  // Handle insert
  const handleInsert = () => {
    onInsert(buildChartData());
  };

  // Handle export PNG
  const handleExportPng = () => {
    // TODO: Implementation would capture the chart as PNG
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selection */}
      <div>
        <Label className="mb-3 block">{t('press:chart.type')}</Label>
        <div className="grid grid-cols-4 gap-2">
          {CHART_TYPES.map(({ type, icon, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setChartType(type)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors',
                chartType === type
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Title */}
      <div>
        <Label htmlFor="chartTitle">{t('press:chart.title')}</Label>
        <Input
          id="chartTitle"
          value={chartTitle}
          onChange={(e) => setChartTitle(e.target.value)}
          placeholder={t('press:chart.titlePlaceholder')}
          className="mt-1"
        />
      </div>

      {/* Data Input */}
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'table' | 'csv')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            {t('press:chart.tableInput')}
          </TabsTrigger>
          <TabsTrigger value="csv" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('press:chart.csvInput')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="flex bg-muted">
              <div className="w-32 p-2 border-r font-medium text-sm">
                {t('press:chart.label')}
              </div>
              {columns.map((col, idx) => (
                <div key={idx} className="flex-1 p-2 border-r">
                  <div className="flex items-center gap-1">
                    <Input
                      value={col}
                      onChange={(e) => updateColumnName(idx, e.target.value)}
                      className="h-7 text-xs"
                    />
                    {columns.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeColumn(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="w-16 p-2 flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={addColumn}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Table Rows */}
            {rows.map((row) => (
              <div key={row.id} className="flex border-t">
                <div className="w-32 p-2 border-r">
                  <Input
                    value={row.label}
                    onChange={(e) => updateRowLabel(row.id, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {columns.map((_, colIdx) => (
                  <div key={colIdx} className="flex-1 p-2 border-r">
                    <Input
                      type="number"
                      value={row.values[colIdx] || 0}
                      onChange={(e) =>
                        updateRowValue(row.id, colIdx, parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                <div className="w-16 p-2 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Row */}
            <div className="p-2 border-t bg-muted/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRow}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('press:chart.addRow')}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="csv" className="mt-4 space-y-3">
          <Textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder={`Label,Série 1,Série 2\nItem 1,100,80\nItem 2,80,90\nItem 3,60,70`}
            rows={6}
            className="font-mono text-sm"
          />
          <Button type="button" onClick={parseCSV} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('press:chart.parseCSV')}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Chart Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('press:chart.options')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showLegend" className="text-sm">
                {t('press:chart.showLegend')}
              </Label>
              <Switch
                id="showLegend"
                checked={config.showLegend}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, showLegend: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showGrid" className="text-sm">
                {t('press:chart.showGrid')}
              </Label>
              <Switch
                id="showGrid"
                checked={config.showGrid}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, showGrid: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showValues" className="text-sm">
                {t('press:chart.showValues')}
              </Label>
              <Switch
                id="showValues"
                checked={config.showValues}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, showValues: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animated" className="text-sm">
                {t('press:chart.animated')}
              </Label>
              <Switch
                id="animated"
                checked={config.animated}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, animated: checked }))
                }
              />
            </div>
          </div>

          {/* Colors */}
          <div>
            <Label className="text-sm mb-2 block">{t('press:chart.colors')}</Label>
            <div className="flex gap-2">
              {config.colors.slice(0, columns.length).map((color, idx) => (
                <Popover key={idx}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md border-2 border-border"
                      style={{ backgroundColor: color }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-4 gap-1">
                      {DEFAULT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            'w-8 h-8 rounded-md border-2',
                            color === c ? 'border-primary' : 'border-transparent'
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            const newColors = [...config.colors];
                            newColors[idx] = c;
                            setConfig((prev) => ({ ...prev, colors: newColors }));
                          }}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Attribution */}
      <div>
        <Label htmlFor="chartSource">{t('press:chart.source')}</Label>
        <Input
          id="chartSource"
          value={chartSource}
          onChange={(e) => setChartSource(e.target.value)}
          placeholder={t('press:chart.sourcePlaceholder')}
          className="mt-1"
        />
      </div>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('press:chart.preview')}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartTitle && (
            <h3 className="text-center font-semibold mb-4">{chartTitle}</h3>
          )}
          {renderChart()}
          {chartSource && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Source: {chartSource}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleExportPng}>
          <Download className="h-4 w-4 mr-2" />
          {t('press:chart.exportPng')}
        </Button>
        <Button type="button" onClick={handleInsert}>
          <Check className="h-4 w-4 mr-2" />
          {t('press:chart.insert')}
        </Button>
      </div>
    </div>
  );
};

export default ChartGenerator;
