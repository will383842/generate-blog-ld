/**
 * CoverageMatrix Component
 * Interactive matrix showing content coverage across dimensions
 */

import { useState, useMemo } from 'react';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCoverageMatrix } from '@/hooks/useCoverage';
import {
  getCoverageStatus,
  getCoverageColor,
  type CoverageMatrixConfig,
  type CoverageStatus,
} from '@/types/coverage';
import type { PlatformId } from '@/types/program';

interface CoverageMatrixProps {
  platformId?: PlatformId;
  initialConfig?: Partial<CoverageMatrixConfig>;
  onCellClick?: (rowId: string, colId: string) => void;
  className?: string;
}

const AXIS_OPTIONS = [
  { value: 'country', label: 'Pays' },
  { value: 'language', label: 'Langues' },
  { value: 'contentType', label: 'Types de contenu' },
  { value: 'theme', label: 'Thèmes' },
];

const STATUS_COLORS: Record<CoverageStatus, string> = {
  complete: 'bg-green-500',
  partial: 'bg-yellow-500',
  minimal: 'bg-orange-500',
  missing: 'bg-red-500',
};

export function CoverageMatrix({
  platformId,
  initialConfig,
  onCellClick,
  className,
}: CoverageMatrixProps) {
  const [config, setConfig] = useState<CoverageMatrixConfig>({
    rowAxis: initialConfig?.rowAxis || 'country',
    colAxis: initialConfig?.colAxis || 'language',
    valueType: initialConfig?.valueType || 'percentage',
    platformId,
  });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: matrixData, isLoading } = useCoverageMatrix(config);
  const matrix = matrixData?.data;

  // Cell size based on zoom
  const cellSize = useMemo(() => {
    const baseSize = 40;
    return Math.round(baseSize * zoom);
  }, [zoom]);

  // Export as image
  const handleExport = () => {
    const element = document.getElementById('coverage-matrix');
    if (!element) return;

    // Use html2canvas if available
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(element).then((canvas) => {
        const link = document.createElement('a');
        link.download = `coverage-matrix-${config.rowAxis}-${config.colAxis}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    });
  };

  // Toggle fullscreen
  const handleFullscreen = () => {
    const element = document.getElementById('coverage-matrix-container');
    if (!element) return;

    if (!isFullscreen) {
      element.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg border p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className={cn('bg-white rounded-lg border p-6 text-center', className)}>
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div
      id="coverage-matrix-container"
      className={cn('bg-white rounded-lg border', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Matrice de couverture</h3>

        <div className="flex items-center gap-4">
          {/* Axis Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes:</span>
            <Select
              value={config.rowAxis}
              onValueChange={(v) => setConfig({ ...config, rowAxis: v as 'country' | 'language' | 'theme' })}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AXIS_OPTIONS.filter((o) => o.value !== config.colAxis).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Colonnes:</span>
            <Select
              value={config.colAxis}
              onValueChange={(v) => setConfig({ ...config, colAxis: v as 'country' | 'language' | 'theme' })}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AXIS_OPTIONS.filter((o) => o.value !== config.rowAxis).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l pl-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              disabled={zoom >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 border-l pl-4">
            <Button variant="ghost" size="icon" onClick={handleFullscreen}>
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div id="coverage-matrix" className="overflow-auto p-4">
        <TooltipProvider>
          <table className="border-collapse">
            <thead>
              <tr>
                <th
                  className="sticky left-0 top-0 z-20 bg-gray-100 p-2 border text-xs font-medium"
                  style={{ minWidth: 120 }}
                />
                {matrix.cols.map((col) => (
                  <th
                    key={col.id}
                    className="sticky top-0 z-10 bg-gray-100 p-2 border text-xs font-medium"
                    style={{ width: cellSize, minWidth: cellSize }}
                  >
                    <div
                      className="truncate"
                      style={{ maxWidth: cellSize - 8 }}
                      title={col.label}
                    >
                      {col.label}
                    </div>
                  </th>
                ))}
                <th className="sticky top-0 z-10 bg-gray-200 p-2 border text-xs font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.id}>
                  <td
                    className="sticky left-0 z-10 bg-gray-50 p-2 border text-xs font-medium truncate"
                    style={{ maxWidth: 120 }}
                    title={row.label}
                  >
                    {row.label}
                  </td>
                  {matrix.cols.map((col) => {
                    const cell = matrix.cells.find(
                      (c) => c.rowId === row.id && c.colId === col.id
                    );
                    const value = cell?.value || 0;
                    const percentage = cell?.percentage || 0;
                    const status = getCoverageStatus(percentage);

                    return (
                      <Tooltip key={col.id}>
                        <TooltipTrigger asChild>
                          <td
                            className={cn(
                              'border text-center text-xs cursor-pointer transition-opacity hover:opacity-80',
                              STATUS_COLORS[status]
                            )}
                            style={{
                              width: cellSize,
                              height: cellSize,
                              opacity: percentage > 0 ? 0.2 + (percentage / 100) * 0.8 : 0.1,
                            }}
                            onClick={() => onCellClick?.(row.id, col.id)}
                          >
                            {config.valueType === 'count' ? value : `${percentage}%`}
                          </td>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-medium">{row.label} × {col.label}</p>
                            <p>{value} articles ({percentage}%)</p>
                            <Badge className={cn('mt-1', getCoverageColor(status))}>
                              {status === 'complete' && 'Complet'}
                              {status === 'partial' && 'Partiel'}
                              {status === 'minimal' && 'Minimal'}
                              {status === 'missing' && 'Manquant'}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <td className="bg-gray-100 p-2 border text-xs font-medium text-center">
                    {matrix.totals.byRow[row.id] || 0}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 bg-gray-200 p-2 border text-xs font-medium">
                  Total
                </td>
                {matrix.cols.map((col) => (
                  <td
                    key={col.id}
                    className="bg-gray-100 p-2 border text-xs font-medium text-center"
                  >
                    {matrix.totals.byCol[col.id] || 0}
                  </td>
                ))}
                <td className="bg-gray-200 p-2 border text-xs font-bold text-center">
                  {matrix.totals.overall}
                </td>
              </tr>
            </tbody>
          </table>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 p-4 border-t bg-gray-50">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('w-4 h-4 rounded', color)} />
            <span className="text-xs capitalize">
              {status === 'complete' && 'Complet (≥90%)'}
              {status === 'partial' && 'Partiel (50-89%)'}
              {status === 'minimal' && 'Minimal (10-49%)'}
              {status === 'missing' && 'Manquant (<10%)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
