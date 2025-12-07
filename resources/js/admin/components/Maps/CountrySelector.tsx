import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface Country {
  code: string;
  name: string;
  flag?: string;
  region?: string;
}

export interface CountrySelectorProps {
  countries: Country[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  maxDisplayed?: number;
  groupByRegion?: boolean;
}

// Sample countries data - in real app, this would come from an API or constants
const defaultCountries: Country[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'europe' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'europe' },
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'northAmerica' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'northAmerica' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'asia' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'asia' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'oceania' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'southAmerica' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'africa' },
];

export function CountrySelector({
  countries = defaultCountries,
  value,
  onChange,
  multiple = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  className,
  maxDisplayed = 3,
  groupByRegion = false,
}: CountrySelectorProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const selectedCountries = useMemo(() => {
    return countries.filter((c) => selectedValues.includes(c.code));
  }, [countries, selectedValues]);

  const groupedCountries = useMemo(() => {
    if (!groupByRegion) return { all: countries };
    return countries.reduce((acc, country) => {
      const region = country.region || 'other';
      if (!acc[region]) acc[region] = [];
      acc[region].push(country);
      return acc;
    }, {} as Record<string, Country[]>);
  }, [countries, groupByRegion]);

  const handleSelect = (countryCode: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(countryCode)
        ? selectedValues.filter((v) => v !== countryCode)
        : [...selectedValues, countryCode];
      onChange(newValues);
    } else {
      onChange(countryCode);
      setOpen(false);
    }
  };

  const getDisplayText = () => {
    if (selectedCountries.length === 0) {
      return placeholder || t('form.select');
    }

    if (selectedCountries.length === 1) {
      const country = selectedCountries[0];
      return (
        <span className="flex items-center gap-2">
          {country.flag && <span>{country.flag}</span>}
          {country.name}
        </span>
      );
    }

    if (selectedCountries.length <= maxDisplayed) {
      return (
        <span className="flex items-center gap-1">
          {selectedCountries.map((c) => c.flag || c.code).join(' ')}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2">
        {selectedCountries.slice(0, maxDisplayed).map((c) => (
          <span key={c.code}>{c.flag || c.code}</span>
        ))}
        <Badge variant="secondary" className="ml-1">
          +{selectedCountries.length - maxDisplayed}
        </Badge>
      </span>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {getDisplayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder || t('form.search')} />
          <CommandList>
            <CommandEmpty>
              {emptyMessage || t('form.noResults')}
            </CommandEmpty>
            {Object.entries(groupedCountries).map(([region, regionCountries]) => (
              <CommandGroup
                key={region}
                heading={groupByRegion ? t(`coverage:regions.${region}`) : undefined}
              >
                {regionCountries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.code}`}
                    onSelect={() => handleSelect(country.code)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {country.flag && <span>{country.flag}</span>}
                      <span>{country.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {country.code}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        selectedValues.includes(country.code)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CountrySelector;
