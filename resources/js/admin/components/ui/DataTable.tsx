import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
  variant?: 'default' | 'destructive';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  rowActions?: RowAction<T>[];
  onRowClick?: (row: T) => void;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  rowActions,
  onRowClick,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const { t } = useTranslation('common');

  const allSelected = data.length > 0 && data.every((row) => selectedRows.has(keyExtractor(row)));
  const someSelected = data.some((row) => selectedRows.has(keyExtractor(row))) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(data.map(keyExtractor));
      onSelectionChange?.(newSelected);
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const key = keyExtractor(row);
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    onSelectionChange?.(newSelected);
  };

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    let newDirection: SortDirection = 'asc';
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
    }
    onSort(columnKey, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
  };

  const renderLoadingSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {selectable && (
            <TableCell>
              <Skeleton className="h-4 w-4" />
            </TableCell>
          )}
          {columns.map((col) => (
            <TableCell key={col.key}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
          {rowActions && (
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell
        colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
        className="h-24 text-center text-muted-foreground"
      >
        {emptyMessage || t('table.empty')}
      </TableCell>
    </TableRow>
  );

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader className={cn(stickyHeader && 'sticky top-0 bg-background z-10')}>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.sortable && 'cursor-pointer select-none',
                  column.headerClassName
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
            {rowActions && rowActions.length > 0 && (
              <TableHead className="w-12">{t('table.actions')}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            renderLoadingSkeleton()
          ) : data.length === 0 ? (
            renderEmptyState()
          ) : (
            data.map((row, index) => {
              const key = keyExtractor(row);
              const isSelected = selectedRows.has(key);

              return (
                <TableRow
                  key={key}
                  data-state={isSelected ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(row, checked as boolean)}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(row, index)}
                    </TableCell>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions
                            .filter((action) => !action.hidden?.(row))
                            .map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                disabled={action.disabled?.(row)}
                                className={cn(
                                  action.variant === 'destructive' && 'text-destructive'
                                )}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
