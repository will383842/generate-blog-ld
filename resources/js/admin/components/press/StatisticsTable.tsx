import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface Column {
  id: string;
  header: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  width?: number;
}

interface DataRow {
  id: string;
  cells: Record<string, string | number>;
}

interface Footnote {
  id: string;
  marker: string;
  text: string;
}

interface StatisticsTableProps {
  title?: string;
  columns: Column[];
  data: DataRow[];
  footnotes?: Footnote[];
  source?: string;
  editable?: boolean;
  onColumnsChange?: (columns: Column[]) => void;
  onDataChange?: (data: DataRow[]) => void;
  onFootnotesChange?: (footnotes: Footnote[]) => void;
  onSourceChange?: (source: string) => void;
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'currency', label: 'Devise (€)' },
  { value: 'percentage', label: 'Pourcentage' },
  { value: 'date', label: 'Date' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const StatisticsTable: React.FC<StatisticsTableProps> = ({
  title,
  columns,
  data,
  footnotes = [],
  source,
  editable = true,
  onColumnsChange,
  onDataChange,
  onFootnotesChange,
  onSourceChange,
}) => {
  const { t } = useTranslation(['press', 'common']);

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Format cell value
  const formatCellValue = useCallback((value: string | number, type: string): string => {
    if (value === '' || value === null || value === undefined) return '';

    switch (type) {
      case 'number':
        return typeof value === 'number'
          ? value.toLocaleString('fr-FR')
          : parseFloat(value as string).toLocaleString('fr-FR');
      case 'currency':
        return typeof value === 'number'
          ? value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
          : parseFloat(value as string).toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            });
      case 'percentage':
        const num = typeof value === 'number' ? value : parseFloat(value as string);
        return `${num.toLocaleString('fr-FR')}%`;
      case 'date':
        return value.toString();
      default:
        return value.toString();
    }
  }, []);

  // Add column
  const handleAddColumn = useCallback(() => {
    if (!onColumnsChange) return;

    const newColumn: Column = {
      id: generateId(),
      header: `Colonne ${columns.length + 1}`,
      type: 'text',
    };

    onColumnsChange([...columns, newColumn]);

    // Add empty cells to all rows
    if (onDataChange) {
      const newData = data.map((row) => ({
        ...row,
        cells: { ...row.cells, [newColumn.id]: '' },
      }));
      onDataChange(newData);
    }
  }, [columns, data, onColumnsChange, onDataChange]);

  // Remove column
  const handleRemoveColumn = useCallback(
    (columnId: string) => {
      if (!onColumnsChange) return;

      onColumnsChange(columns.filter((c) => c.id !== columnId));

      // Remove cells from all rows
      if (onDataChange) {
        const newData = data.map((row) => {
          const { [columnId]: _, ...restCells } = row.cells;
          return { ...row, cells: restCells };
        });
        onDataChange(newData);
      }
    },
    [columns, data, onColumnsChange, onDataChange]
  );

  // Update column
  const handleUpdateColumn = useCallback(
    (columnId: string, updates: Partial<Column>) => {
      if (!onColumnsChange) return;

      onColumnsChange(
        columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c))
      );
    },
    [columns, onColumnsChange]
  );

  // Add row
  const handleAddRow = useCallback(() => {
    if (!onDataChange) return;

    const newRow: DataRow = {
      id: generateId(),
      cells: columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
    };

    onDataChange([...data, newRow]);
  }, [columns, data, onDataChange]);

  // Remove row
  const handleRemoveRow = useCallback(
    (rowId: string) => {
      if (!onDataChange) return;
      onDataChange(data.filter((r) => r.id !== rowId));
    },
    [data, onDataChange]
  );

  // Update cell
  const handleUpdateCell = useCallback(
    (rowId: string, columnId: string, value: string) => {
      if (!onDataChange) return;

      onDataChange(
        data.map((row) =>
          row.id === rowId
            ? { ...row, cells: { ...row.cells, [columnId]: value } }
            : row
        )
      );
    },
    [data, onDataChange]
  );

  // Add footnote
  const handleAddFootnote = useCallback(() => {
    if (!onFootnotesChange) return;

    const markers = '¹²³⁴⁵⁶⁷⁸⁹';
    const nextMarker = markers[footnotes.length] || `[${footnotes.length + 1}]`;

    const newFootnote: Footnote = {
      id: generateId(),
      marker: nextMarker,
      text: '',
    };

    onFootnotesChange([...footnotes, newFootnote]);
  }, [footnotes, onFootnotesChange]);

  // Remove footnote
  const handleRemoveFootnote = useCallback(
    (footnoteId: string) => {
      if (!onFootnotesChange) return;
      onFootnotesChange(footnotes.filter((f) => f.id !== footnoteId));
    },
    [footnotes, onFootnotesChange]
  );

  // Update footnote
  const handleUpdateFootnote = useCallback(
    (footnoteId: string, text: string) => {
      if (!onFootnotesChange) return;

      onFootnotesChange(
        footnotes.map((f) => (f.id === footnoteId ? { ...f, text } : f))
      );
    },
    [footnotes, onFootnotesChange]
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a.cells[sortColumn];
      const bVal = b.cells[sortColumn];

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Toggle sort
  const handleSort = useCallback(
    (columnId: string) => {
      if (sortColumn === columnId) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(columnId);
        setSortDirection('asc');
      }
    },
    [sortColumn]
  );

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = columns.map((c) => c.header).join(',');
    const rows = data.map((row) =>
      columns.map((col) => `"${row.cells[col.id] || ''}"`).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'statistics'}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }, [columns, data, title]);

  // Import from CSV
  const handleImportCSV = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !onColumnsChange || !onDataChange) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());

        if (lines.length === 0) return;

        // Parse headers
        const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
        const newColumns: Column[] = headers.map((header) => ({
          id: generateId(),
          header,
          type: 'text' as const,
        }));

        // Parse data
        const newData: DataRow[] = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.replace(/"/g, '').trim());
          const cells: Record<string, string> = {};
          newColumns.forEach((col, i) => {
            cells[col.id] = values[i] || '';
          });
          return { id: generateId(), cells };
        });

        onColumnsChange(newColumns);
        onDataChange(newData);
      };

      reader.readAsText(file);
      event.target.value = '';
    },
    [onColumnsChange, onDataChange]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {editable ? (
              <Input
                value={title || ''}
                onChange={(e) => {
                  // Title is managed externally
                }}
                placeholder={t('press:statistics.titlePlaceholder')}
                className="text-base font-semibold"
              />
            ) : (
              title || t('press:statistics.defaultTitle')
            )}
          </CardTitle>

          {editable && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-import"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('csv-import')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('press:statistics.importCSV')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('press:statistics.exportCSV')}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Table */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {editable && <TableHead className="w-10"></TableHead>}
                {columns.map((column) => (
                  <TableHead key={column.id} style={{ width: column.width }}>
                    {editable ? (
                      <div className="space-y-1">
                        <Input
                          value={column.header}
                          onChange={(e) =>
                            handleUpdateColumn(column.id, { header: e.target.value })
                          }
                          className="h-7 text-sm font-medium"
                        />
                        <div className="flex items-center gap-1">
                          <Select
                            value={column.type}
                            onValueChange={(value) =>
                              handleUpdateColumn(column.id, {
                                type: value as Column['type'],
                              })
                            }
                          >
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMN_TYPES.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveColumn(column.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary"
                        onClick={() => handleSort(column.id)}
                      >
                        {column.header}
                        {sortColumn === column.id &&
                          (sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </button>
                    )}
                  </TableHead>
                ))}
                {editable && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.id}>
                  {editable && (
                    <TableCell className="w-10">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {editable ? (
                        <Input
                          value={row.cells[column.id]?.toString() || ''}
                          onChange={(e) =>
                            handleUpdateCell(row.id, column.id, e.target.value)
                          }
                          className="h-8 text-sm"
                          type={column.type === 'number' ? 'number' : 'text'}
                        />
                      ) : (
                        <span
                          className={cn(
                            ['number', 'currency', 'percentage'].includes(column.type) &&
                              'text-right block'
                          )}
                        >
                          {formatCellValue(row.cells[column.id], column.type)}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  {editable && (
                    <TableCell className="w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Add buttons */}
        {editable && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddColumn}>
              <Plus className="h-4 w-4 mr-1" />
              {t('press:statistics.addColumn')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-1" />
              {t('press:statistics.addRow')}
            </Button>
          </div>
        )}

        {/* Footnotes */}
        {(footnotes.length > 0 || editable) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t('press:statistics.footnotes')}</Label>
              {editable && (
                <Button variant="ghost" size="sm" onClick={handleAddFootnote}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('press:statistics.addFootnote')}
                </Button>
              )}
            </div>
            {footnotes.map((footnote) => (
              <div key={footnote.id} className="flex items-start gap-2">
                <span className="text-xs font-medium min-w-[20px]">{footnote.marker}</span>
                {editable ? (
                  <>
                    <Input
                      value={footnote.text}
                      onChange={(e) => handleUpdateFootnote(footnote.id, e.target.value)}
                      placeholder={t('press:statistics.footnotePlaceholder')}
                      className="flex-1 h-7 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveFootnote(footnote.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{footnote.text}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Source */}
        <div>
          <Label className="text-sm">{t('press:statistics.source')}</Label>
          {editable ? (
            <Input
              value={source || ''}
              onChange={(e) => onSourceChange?.(e.target.value)}
              placeholder={t('press:statistics.sourcePlaceholder')}
              className="mt-1"
            />
          ) : (
            source && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('press:statistics.sourceLabel')}: {source}
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsTable;
