/**
 * Comparison Table
 * Editable comparison matrix with scoring
 */

import { useState, useMemo } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Star,
  Check,
  X,
  Trophy,
  Settings,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import type {
  Comparative,
  ComparisonCriteria,
  ComparisonItem,
  CriteriaValue,
  CriteriaType,
} from '@/types/comparative';

export interface ComparisonTableProps {
  comparative: Comparative;
  onUpdateItem?: (itemId: string, values: Record<string, CriteriaValue>) => void;
  onUpdateItemField?: (itemId: string, field: string, value: string | number | boolean) => void;
  onAddItem?: () => void;
  onDeleteItem?: (itemId: string) => void;
  onReorderItems?: (fromIndex: number, toIndex: number) => void;
  onRecalculate?: () => void;
  isEditable?: boolean;
  showScores?: boolean;
  className?: string;
}

function CellValue({
  criterion,
  value,
  isEditing,
  onChange,
}: {
  criterion: ComparisonCriteria;
  value?: CriteriaValue;
  isEditing: boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  const displayValue = value?.displayValue || value?.value;

  if (!isEditing) {
    switch (criterion.type) {
      case 'boolean':
        return displayValue ? (
          <Check className="w-5 h-5 text-green-600 mx-auto" />
        ) : (
          <X className="w-5 h-5 text-red-600 mx-auto" />
        );
      case 'rating':
        return (
          <div className="flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-4 h-4',
                  star <= Number(displayValue)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
        );
      case 'price':
        return (
          <span className="font-medium">
            {typeof displayValue === 'number'
              ? `$${displayValue.toLocaleString()}`
              : displayValue || '-'}
          </span>
        );
      case 'percentage':
        return <span>{displayValue ? `${displayValue}%` : '-'}</span>;
      default:
        return <span>{displayValue?.toString() || '-'}</span>;
    }
  }

  // Editing mode
  switch (criterion.type) {
    case 'boolean':
      return (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant={value?.value ? 'default' : 'outline'}
            className="w-16"
            onClick={() => onChange(!value?.value)}
          >
            {value?.value ? 'Oui' : 'Non'}
          </Button>
        </div>
      );
    case 'rating':
      return (
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onChange(star)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  'w-5 h-5',
                  star <= Number(value?.value)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300 hover:text-yellow-400'
                )}
              />
            </button>
          ))}
        </div>
      );
    case 'numeric':
    case 'price':
    case 'percentage':
      return (
        <Input
          type="number"
          value={value?.value as number || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 text-center"
          min={criterion.min}
          max={criterion.max}
        />
      );
    default:
      return (
        <Input
          value={value?.value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );
  }
}

export function ComparisonTable({
  comparative,
  onUpdateItem,
  onUpdateItemField,
  onAddItem,
  onDeleteItem,
  onReorderItems,
  onRecalculate,
  isEditable = false,
  showScores = true,
  className,
}: ComparisonTableProps) {
  const [editingCell, setEditingCell] = useState<{
    itemId: string;
    criterionId: string;
  } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { criteria, items, highlightWinner, winnerId } = comparative;

  // Sort items by score
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (showScores) return b.score - a.score;
      return a.order - b.order;
    });
  }, [items, showScores]);

  const handleCellChange = (
    itemId: string,
    criterionId: string,
    value: string | number | boolean
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const criterion = criteria.find((c) => c.id === criterionId);
    if (!criterion) return;

    const newValue: CriteriaValue = {
      criteriaId: criterionId,
      value,
      displayValue: formatValue(value, criterion.type),
      normalizedScore: 0, // Will be recalculated
    };

    onUpdateItem?.(itemId, {
      ...item.values,
      [criterionId]: newValue,
    });
  };

  const formatValue = (value: string | number | boolean | undefined, type: CriteriaType): string => {
    if (value === undefined) return '';
    switch (type) {
      case 'price':
        return `$${Number(value).toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'boolean':
        return value ? 'Oui' : 'Non';
      default:
        return String(value);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    onReorderItems?.(draggedIndex, targetIndex);
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {isEditable && <TableHead className="w-10" />}
            <TableHead className="min-w-[200px]">Élément</TableHead>
            {criteria
              .filter((c) => c.isVisible)
              .map((criterion) => (
                <TableHead key={criterion.id} className="text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <span>{criterion.name}</span>
                    {criterion.weight > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {criterion.weight}%
                      </Badge>
                    )}
                  </div>
                </TableHead>
              ))}
            {showScores && (
              <TableHead className="text-center min-w-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <span>Score</span>
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
              </TableHead>
            )}
            {isEditable && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item, index) => {
            const isWinner = highlightWinner && item.id === winnerId;
            const isDragging = draggedIndex === index;

            return (
              <TableRow
                key={item.id}
                draggable={isEditable}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  isWinner && 'bg-yellow-50',
                  isDragging && 'opacity-50',
                  item.isHighlighted && 'bg-blue-50'
                )}
              >
                {/* Drag Handle */}
                {isEditable && (
                  <TableCell>
                    <div className="cursor-grab hover:bg-gray-100 p-1 rounded">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                )}

                {/* Item Name */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {isWinner && (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Trophy className="w-3 h-3 mr-1" />
                            Gagnant
                          </Badge>
                        )}
                        {item.highlightLabel && (
                          <Badge variant="outline">{item.highlightLabel}</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Criteria Values */}
                {criteria
                  .filter((c) => c.isVisible)
                  .map((criterion) => {
                    const value = item.values[criterion.id];
                    const isEditing =
                      editingCell?.itemId === item.id &&
                      editingCell?.criterionId === criterion.id;

                    return (
                      <TableCell
                        key={criterion.id}
                        className={cn(
                          'text-center',
                          isEditable && !isEditing && 'cursor-pointer hover:bg-gray-50'
                        )}
                        onClick={() => {
                          if (isEditable && !isEditing) {
                            setEditingCell({ itemId: item.id, criterionId: criterion.id });
                          }
                        }}
                        onBlur={() => {
                          if (isEditing) {
                            setEditingCell(null);
                          }
                        }}
                      >
                        <CellValue
                          criterion={criterion}
                          value={value}
                          isEditing={isEditing}
                          onChange={(val) =>
                            handleCellChange(item.id, criterion.id, val)
                          }
                        />
                      </TableCell>
                    );
                  })}

                {/* Score */}
                {showScores && (
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'text-xl font-bold',
                          item.score >= 80 && 'text-green-600',
                          item.score >= 60 && item.score < 80 && 'text-yellow-600',
                          item.score < 60 && 'text-red-600'
                        )}
                      >
                        {item.score.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        #{item.rank}
                      </span>
                    </div>
                  </TableCell>
                )}

                {/* Delete */}
                {isEditable && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem?.(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {/* Add Row */}
          {isEditable && (
            <TableRow>
              <TableCell colSpan={criteria.length + 4}>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onAddItem}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un élément
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Recalculate Button */}
      {isEditable && onRecalculate && (
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onRecalculate}>
            <Settings className="w-4 h-4 mr-2" />
            Recalculer les scores
          </Button>
        </div>
      )}
    </div>
  );
}

export default ComparisonTable;
