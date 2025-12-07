/**
 * Date Range Picker Component
 * File 335 - Date range selection with presets
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar } from '@/components/ui/Calendar';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  showCompare?: boolean;
}

const PRESETS = [
  { label: '7 derniers jours', value: '7d', getDates: () => ({
    start: subDays(new Date(), 7),
    end: new Date(),
  })},
  { label: '30 derniers jours', value: '30d', getDates: () => ({
    start: subDays(new Date(), 30),
    end: new Date(),
  })},
  { label: '90 derniers jours', value: '90d', getDates: () => ({
    start: subDays(new Date(), 90),
    end: new Date(),
  })},
  { label: 'Ce mois', value: 'this_month', getDates: () => ({
    start: startOfMonth(new Date()),
    end: new Date(),
  })},
  { label: 'Mois dernier', value: 'last_month', getDates: () => ({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
  })},
  { label: 'Depuis le début de l\'année', value: 'ytd', getDates: () => ({
    start: startOfYear(new Date()),
    end: new Date(),
  })},
];

export function DateRangePicker({
  value,
  onChange,
  className,
  showCompare = true,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [compareEnabled, setCompareEnabled] = useState(!!value.compareStart);
  const [tempRange, setTempRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: value.start ? new Date(value.start) : undefined,
    to: value.end ? new Date(value.end) : undefined,
  });

  // Apply preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    const dates = preset.getDates();
    setTempRange({ from: dates.start, to: dates.end });
    setSelectedPreset(preset.value);
  };

  // Apply selection
  const applySelection = () => {
    if (tempRange.from && tempRange.to) {
      const newRange: DateRange = {
        start: format(tempRange.from, 'yyyy-MM-dd'),
        end: format(tempRange.to, 'yyyy-MM-dd'),
      };

      if (compareEnabled) {
        const daysDiff = Math.ceil(
          (tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)
        );
        newRange.compareStart = format(subDays(tempRange.from, daysDiff + 1), 'yyyy-MM-dd');
        newRange.compareEnd = format(subDays(tempRange.from, 1), 'yyyy-MM-dd');
      }

      onChange(newRange);
      setIsOpen(false);
    }
  };

  // Format display
  const formatDisplay = () => {
    if (value.start && value.end) {
      const start = new Date(value.start);
      const end = new Date(value.end);
      
      // Check if matches a preset
      for (const preset of PRESETS) {
        const dates = preset.getDates();
        if (
          format(dates.start, 'yyyy-MM-dd') === value.start &&
          format(dates.end, 'yyyy-MM-dd') === value.end
        ) {
          return preset.label;
        }
      }

      return `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
    }
    return 'Sélectionner une période';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start text-left font-normal', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplay()}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-3 space-y-1 min-w-[180px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Périodes prédéfinies
            </p>
            {PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => applyPreset(preset)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selectedPreset === preset.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center justify-between">
                  {preset.label}
                  {selectedPreset === preset.value && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Période personnalisée
            </p>
            <Calendar
              mode="range"
              selected={{
                from: tempRange.from,
                to: tempRange.to,
              }}
              onSelect={(range) => {
                setTempRange({
                  from: range?.from,
                  to: range?.to,
                });
                setSelectedPreset(null);
              }}
              numberOfMonths={2}
              locale={fr}
            />

            {/* Compare Toggle */}
            {showCompare && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Label htmlFor="compare" className="text-sm">
                  Comparer avec période précédente
                </Label>
                <Switch
                  id="compare"
                  checked={compareEnabled}
                  onCheckedChange={setCompareEnabled}
                />
              </div>
            )}

            {/* Selected Range Display */}
            {tempRange.from && tempRange.to && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">
                    {format(tempRange.from, 'd MMM yyyy', { locale: fr })}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">
                    {format(tempRange.to, 'd MMM yyyy', { locale: fr })}
                  </Badge>
                </div>
                {compareEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Comparé avec:{' '}
                    {format(
                      subDays(tempRange.from, Math.ceil(
                        (tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)
                      ) + 1),
                      'd MMM',
                      { locale: fr }
                    )}{' '}
                    -{' '}
                    {format(subDays(tempRange.from, 1), 'd MMM yyyy', { locale: fr })}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button onClick={applySelection} disabled={!tempRange.from || !tempRange.to}>
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
