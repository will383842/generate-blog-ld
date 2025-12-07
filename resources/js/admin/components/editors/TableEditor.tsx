import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableColumn {
  id: string;
  header: string;
  width?: number;
}

export interface TableRowData {
  id: string;
  cells: Record<string, string>;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRowData[];
}

export interface TableEditorProps {
  value: TableData;
  onChange?: (value: TableData) => void;
  readOnly?: boolean;
  minRows?: number;
  maxRows?: number;
  minColumns?: number;
  maxColumns?: number;
  className?: string;
  showRowNumbers?: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function TableEditor({
  value,
  onChange,
  readOnly = false,
  minRows = 1,
  maxRows = 100,
  minColumns = 1,
  maxColumns = 20,
  className,
  showRowNumbers = true,
}: TableEditorProps) {
  const { t } = useTranslation('common');
  const [editingHeader, setEditingHeader] = useState<string | null>(null);

  const updateData = useCallback((newData: TableData) => {
    onChange?.(newData);
  }, [onChange]);

  const addColumn = () => {
    if (value.columns.length >= maxColumns) return;
    const newColumn: TableColumn = {
      id: generateId(),
      header: `Column ${value.columns.length + 1}`,
    };
    const newRows = value.rows.map((row) => ({
      ...row,
      cells: { ...row.cells, [newColumn.id]: '' },
    }));
    updateData({ columns: [...value.columns, newColumn], rows: newRows });
  };

  const removeColumn = (columnId: string) => {
    if (value.columns.length <= minColumns) return;
    const newColumns = value.columns.filter((col) => col.id !== columnId);
    const newRows = value.rows.map((row) => {
      const { [columnId]: removed, ...cells } = row.cells;
      return { ...row, cells };
    });
    updateData({ columns: newColumns, rows: newRows });
  };

  const updateColumnHeader = (columnId: string, header: string) => {
    const newColumns = value.columns.map((col) =>
      col.id === columnId ? { ...col, header } : col
    );
    updateData({ ...value, columns: newColumns });
  };

  const addRow = () => {
    if (value.rows.length >= maxRows) return;
    const newRow: TableRowData = {
      id: generateId(),
      cells: value.columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
    };
    updateData({ ...value, rows: [...value.rows, newRow] });
  };

  const removeRow = (rowId: string) => {
    if (value.rows.length <= minRows) return;
    updateData({ ...value, rows: value.rows.filter((row) => row.id !== rowId) });
  };

  const duplicateRow = (rowId: string) => {
    if (value.rows.length >= maxRows) return;
    const rowIndex = value.rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) return;
    const newRow: TableRowData = {
      id: generateId(),
      cells: { ...value.rows[rowIndex].cells },
    };
    const newRows = [...value.rows];
    newRows.splice(rowIndex + 1, 0, newRow);
    updateData({ ...value, rows: newRows });
  };

  const moveRow = (rowId: string, direction: 'up' | 'down') => {
    const rowIndex = value.rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) return;
    if (direction === 'up' && rowIndex === 0) return;
    if (direction === 'down' && rowIndex === value.rows.length - 1) return;

    const newRows = [...value.rows];
    const targetIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    [newRows[rowIndex], newRows[targetIndex]] = [newRows[targetIndex], newRows[rowIndex]];
    updateData({ ...value, rows: newRows });
  };

  const updateCell = (rowId: string, columnId: string, cellValue: string) => {
    const newRows = value.rows.map((row) =>
      row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: cellValue } } : row
    );
    updateData({ ...value, rows: newRows });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addColumn} disabled={value.columns.length >= maxColumns}>
            <Plus className="h-4 w-4 mr-1" /> Add Column
          </Button>
          <Button variant="outline" size="sm" onClick={addRow} disabled={value.rows.length >= maxRows}>
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {showRowNumbers && <TableHead className="w-12">#</TableHead>}
              {!readOnly && <TableHead className="w-20"></TableHead>}
              {value.columns.map((column) => (
                <TableHead key={column.id} style={{ width: column.width }}>
                  {editingHeader === column.id ? (
                    <Input
                      value={column.header}
                      onChange={(e) => updateColumnHeader(column.id, e.target.value)}
                      onBlur={() => setEditingHeader(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingHeader(null)}
                      autoFocus
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span
                      className={cn(!readOnly && 'cursor-pointer')}
                      onClick={() => !readOnly && setEditingHeader(column.id)}
                    >
                      {column.header}
                    </span>
                  )}
                </TableHead>
              ))}
              {!readOnly && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.rows.map((row, rowIndex) => (
              <TableRow key={row.id} className="group">
                {showRowNumbers && <TableCell className="text-muted-foreground">{rowIndex + 1}</TableCell>}
                {!readOnly && (
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveRow(row.id, 'up')} disabled={rowIndex === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveRow(row.id, 'down')} disabled={rowIndex === value.rows.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                )}
                {value.columns.map((column) => (
                  <TableCell key={column.id}>
                    {readOnly ? (
                      <span>{row.cells[column.id]}</span>
                    ) : (
                      <Input
                        value={row.cells[column.id] || ''}
                        onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                        className="h-8 border-0 bg-transparent focus-visible:ring-1"
                      />
                    )}
                  </TableCell>
                ))}
                {!readOnly && (
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateRow(row.id)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {value.rows.length > minRows && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(row.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default TableEditor;
