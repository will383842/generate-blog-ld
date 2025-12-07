import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  showClearButton?: boolean;
  showSearchButton?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder,
  debounceMs = 300,
  loading = false,
  autoFocus = false,
  className,
  inputClassName,
  showClearButton = true,
  showSearchButton = false,
  size = 'default',
}: SearchInputProps) {
  const { t } = useTranslation('common');
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedValue = useDebounce(internalValue, debounceMs);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    if (debouncedValue !== controlledValue) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleSearch = () => {
    onSearch?.(internalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch?.(internalValue);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    default: 'h-10',
    lg: 'h-12 text-lg',
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
            iconSizeClasses[size]
          )}
        />
        <Input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('form.search')}
          autoFocus={autoFocus}
          className={cn(
            'pl-9',
            showClearButton && internalValue && 'pr-9',
            sizeClasses[size],
            inputClassName
          )}
        />
        {loading && (
          <Loader2
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground',
              iconSizeClasses[size]
            )}
          />
        )}
        {!loading && showClearButton && internalValue && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent'
            )}
            onClick={handleClear}
          >
            <X className={iconSizeClasses[size]} />
          </Button>
        )}
      </div>
      {showSearchButton && (
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="ml-2"
          size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
        >
          {loading ? (
            <Loader2 className={cn('animate-spin', iconSizeClasses[size])} />
          ) : (
            <Search className={iconSizeClasses[size]} />
          )}
          <span className="ml-2 hidden sm:inline">{t('actions.search')}</span>
        </Button>
      )}
    </div>
  );
}

export default SearchInput;
