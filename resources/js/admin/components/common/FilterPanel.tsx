import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'dateRange' | 'multiSelect';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string | string[] | { from?: string; to?: string };
}

export interface FilterPanelProps {
  filters: FilterOption[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset?: () => void;
  className?: string;
  triggerClassName?: string;
  inline?: boolean;
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onReset,
  className,
  triggerClassName,
  inline = false,
}: FilterPanelProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const activeFiltersCount = Object.values(values).filter(
    (v) => v && (typeof v === 'string' ? v.length > 0 : Array.isArray(v) ? v.length > 0 : v.from || v.to)
  ).length;

  const handleChange = (key: string, value: string | string[] | { from?: string; to?: string }) => {
    onChange({ ...values, [key]: value });
  };

  const handleReset = () => {
    const emptyValues: FilterValues = {};
    filters.forEach((f) => {
      emptyValues[f.key] = f.type === 'multiSelect' ? [] : f.type === 'dateRange' ? {} : '';
    });
    onChange(emptyValues);
    onReset?.();
  };

  const renderFilter = (filter: FilterOption) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={(v) => handleChange(filter.key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || t('form.select')} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'text':
        return (
          <Input
            value={value as string}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value as string}
            onChange={(e) => handleChange(filter.key, e.target.value)}
          />
        );

      case 'dateRange':
        const rangeValue = (value as { from?: string; to?: string }) || {};
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={rangeValue.from || ''}
              onChange={(e) =>
                handleChange(filter.key, { ...rangeValue, from: e.target.value })
              }
              placeholder={t('filters.from')}
            />
            <Input
              type="date"
              value={rangeValue.to || ''}
              onChange={(e) =>
                handleChange(filter.key, { ...rangeValue, to: e.target.value })
              }
              placeholder={t('filters.to')}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const filterContent = (
    <div className={cn('space-y-4', className)}>
      {filters.map((filter) => (
        <div key={filter.key} className="space-y-2">
          <Label>{filter.label}</Label>
          {renderFilter(filter)}
        </div>
      ))}
    </div>
  );

  if (inline) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">{t('actions.filter')}</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('actions.reset')}
            </Button>
          )}
        </div>
        {filterContent}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className={cn('gap-2', triggerClassName)}>
          <Filter className="h-4 w-4" />
          {t('actions.filter')}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('actions.filter')}
          </SheetTitle>
        </SheetHeader>
        <div className="py-6">{filterContent}</div>
        <SheetFooter>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('actions.reset')}
          </Button>
          <Button onClick={() => setOpen(false)}>{t('filters.apply')}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default FilterPanel;
