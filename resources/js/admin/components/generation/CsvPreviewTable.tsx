/**
 * CSV Preview Table
 * Preview uploaded CSV data with validation
 */

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import type { BulkUploadRow, BulkUploadColumnMapping } from '@/types/generation';

export interface CsvPreviewTableProps {
  rows: BulkUploadRow[];
  columns: string[];
  mappings: BulkUploadColumnMapping[];
  onEditCell?: (rowIndex: number, column: string, value: string) => void;
  onDeleteRow?: (rowIndex: number) => void;
  pageSize?: number;
  className?: string;
}

export function CsvPreviewTable({
  rows,
  columns,
  mappings,
  onEditCell,
  onDeleteRow,
  pageSize = 50,
  className,
}: CsvPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    column: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);

  const validRows = rows.filter((r) => r.isValid).length;
  const invalidRows = rows.filter((r) => !r.isValid).length;

  const getMappedField = (column: string) => {
    return mappings.find((m) => m.csvColumn === column)?.targetField;
  };

  const startEditing = (rowIndex: number, column: string, currentValue: string) => {
    if (!onEditCell) return;
    setEditingCell({ row: rowIndex, column });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCell && onEditCell) {
      onEditCell(editingCell.row, editingCell.column, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1">
            <Check className="w-3 h-3 text-green-600" />
            {validRows} valides
          </Badge>
          {invalidRows > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {invalidRows} invalides
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {rows.length} lignes au total
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-20">Status</TableHead>
                {columns.map((column) => {
                  const mappedField = getMappedField(column);
                  const isRequired = mappings.find(
                    (m) => m.csvColumn === column
                  )?.isRequired;

                  return (
                    <TableHead key={column}>
                      <div className="space-y-1">
                        <span>{column}</span>
                        {mappedField && mappedField !== 'ignore' && (
                          <Badge variant="outline" className="text-[10px] block">
                            → {mappedField}
                            {isRequired && ' *'}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
                {onDeleteRow && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, idx) => {
                const actualIndex = startIndex + idx;

                return (
                  <TableRow
                    key={row.rowNumber}
                    className={cn(!row.isValid && 'bg-red-50')}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {row.rowNumber}
                    </TableCell>
                    <TableCell>
                      {row.isValid ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600">
                            {row.errors.length}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    {columns.map((column) => {
                      const value = row.data[column] || '';
                      const isEditing =
                        editingCell?.row === actualIndex &&
                        editingCell?.column === column;
                      const hasError = row.errors.some((e) =>
                        e.toLowerCase().includes(column.toLowerCase())
                      );
                      const hasWarning = row.warnings.some((w) =>
                        w.toLowerCase().includes(column.toLowerCase())
                      );

                      return (
                        <TableCell
                          key={column}
                          className={cn(
                            'relative',
                            hasError && 'bg-red-100',
                            hasWarning && !hasError && 'bg-yellow-100'
                          )}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={saveEdit}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'flex items-center gap-1',
                                onEditCell && 'cursor-pointer hover:bg-gray-100 -mx-2 px-2 py-1 rounded'
                              )}
                              onClick={() =>
                                onEditCell && startEditing(actualIndex, column, value)
                              }
                            >
                              <span className="truncate max-w-[200px]">
                                {value || '-'}
                              </span>
                              {hasWarning && !hasError && (
                                <AlertTriangle className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                              )}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    {onDeleteRow && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => onDeleteRow(actualIndex)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Errors detail */}
      {invalidRows > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">
            Erreurs détectées ({invalidRows} lignes)
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {rows
              .filter((r) => !r.isValid)
              .slice(0, 10)
              .map((row) => (
                <div key={row.rowNumber} className="text-sm text-red-700">
                  <span className="font-medium">Ligne {row.rowNumber}:</span>{' '}
                  {row.errors.join(', ')}
                </div>
              ))}
            {invalidRows > 10 && (
              <p className="text-sm text-red-600">
                ... et {invalidRows - 10} autres erreurs
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage {startIndex + 1} - {Math.min(startIndex + pageSize, rows.length)} sur{' '}
            {rows.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CsvPreviewTable;
