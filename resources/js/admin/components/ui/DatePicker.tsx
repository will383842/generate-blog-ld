/**
 * DatePicker component
 * Combines Calendar with Popover for date selection
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr, enUS, de, es, pt, ru, zhCN, ar } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Calendar } from './Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

const locales: Record<string, Locale> = {
  fr,
  en: enUS,
  de,
  es,
  pt,
  ru,
  zh: zhCN,
  ar,
};

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  locale?: string;
  className?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  disabled = false,
  locale = 'fr',
  className,
  format: dateFormat = 'PPP',
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  const dateLocale = locales[locale] || fr;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-gray-500',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, dateFormat, { locale: dateLocale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          locale={dateLocale}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePickerProps {
  value?: { from: Date | undefined; to: Date | undefined };
  onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  placeholder?: string;
  disabled?: boolean;
  locale?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

function DateRangePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une période',
  disabled = false,
  locale = 'fr',
  className,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateLocale = locales[locale] || fr;

  const formatRange = () => {
    if (!value?.from) return placeholder;
    if (!value.to) return format(value.from, 'PP', { locale: dateLocale });
    return `${format(value.from, 'PP', { locale: dateLocale })} - ${format(value.to, 'PP', { locale: dateLocale })}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value?.from && 'text-gray-500',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => onChange?.(range || { from: undefined, to: undefined })}
          locale={dateLocale}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

DatePicker.displayName = 'DatePicker';
DateRangePicker.displayName = 'DateRangePicker';

export { DatePicker, DateRangePicker };
export default DatePicker;
