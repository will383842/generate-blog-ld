import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Loader2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

export interface ExportColumn {
  key: string;
  label: string;
  selected?: boolean;
}

export interface ExportReportProps {
  columns: ExportColumn[];
  onExport: (options: ExportOptions) => Promise<void>;
  defaultFormat?: ExportFormat;
  showDateRange?: boolean;
  showColumnSelection?: boolean;
  triggerText?: string;
  className?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  columns: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  filename?: string;
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="h-4 w-4" />,
  xlsx: <FileSpreadsheet className="h-4 w-4" />,
  pdf: <File className="h-4 w-4" />,
  json: <FileText className="h-4 w-4" />,
};

const formatLabels: Record<ExportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel (XLSX)',
  pdf: 'PDF',
  json: 'JSON',
};

export function ExportReport({
  columns,
  onExport,
  defaultFormat = 'csv',
  showDateRange = true,
  showColumnSelection = true,
  triggerText,
  className,
}: ExportReportProps) {
  const { t } = useTranslation('analytics');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => c.selected !== false).map((c) => c.key))
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filename, setFilename] = useState('');

  const handleColumnToggle = (key: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedColumns.size === columns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(columns.map((c) => c.key)));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.size === 0) return;

    setLoading(true);
    try {
      await onExport({
        format,
        columns: Array.from(selectedColumns),
        dateRange: showDateRange && dateFrom && dateTo
          ? { from: dateFrom, to: dateTo }
          : undefined,
        filename: filename || undefined,
      });
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          {triggerText || t('reports.export')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('reports.exportTitle')}</DialogTitle>
          <DialogDescription>
            {t('reports.exportDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>{t('reports.format')}</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(formatLabels) as ExportFormat[]).map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    <div className="flex items-center gap-2">
                      {formatIcons[fmt]}
                      {formatLabels[fmt]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label>{t('reports.filename')}</Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={`report.${format}`}
            />
          </div>

          {/* Date Range */}
          {showDateRange && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('reports.dateRange')}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder={t('filters.from')}
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder={t('filters.to')}
                />
              </div>
            </div>
          )}

          {/* Column Selection */}
          {showColumnSelection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('reports.columns')}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-auto py-1 px-2 text-xs"
                >
                  {selectedColumns.size === columns.length
                    ? t('actions.deselectAll')
                    : t('actions.selectAll')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border rounded-lg p-3">
                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedColumns.has(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                    />
                    {column.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedColumns.size} / {columns.length} {t('reports.columnsSelected')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('actions.cancel')}
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || selectedColumns.size === 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t('reports.export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportReport;
