/**
 * Country Multi-Select
 * Dropdown with search, regions, and chips
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCountries, CONTINENTS, CONTINENT_LABELS } from '@/hooks/useCountries';
import type { Country, Continent } from '@/hooks/useCountries';

export interface CountryMultiSelectProps {
  selected: string[];
  onChange: (countries: string[]) => void;
  maxSelection?: number;
  placeholder?: string;
  className?: string;
}

export function CountryMultiSelect({
  selected,
  onChange,
  maxSelection,
  placeholder = 'Sélectionnez des pays...',
  className,
}: CountryMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedContinents, setExpandedContinents] = useState<Set<Continent>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: countriesData, isLoading } = useCountries();
  const countries = countriesData?.data || [];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const query = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [countries, search]);

  // Group by continent
  const countriesByContinent = useMemo(() => {
    return CONTINENTS.reduce((acc, continent) => {
      acc[continent] = filteredCountries.filter((c) => c.continent === continent);
      return acc;
    }, {} as Record<Continent, Country[]>);
  }, [filteredCountries]);

  const toggleCountry = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      if (maxSelection && selected.length >= maxSelection) return;
      onChange([...selected, code]);
    }
  };

  const toggleContinent = (continent: Continent) => {
    const continentCodes = countriesByContinent[continent]?.map((c) => c.code) || [];
    const allSelected = continentCodes.every((code) => selected.includes(code));

    if (allSelected) {
      onChange(selected.filter((c) => !continentCodes.includes(c)));
    } else {
      const remaining = maxSelection ? maxSelection - selected.length : Infinity;
      const toAdd = continentCodes.filter((c) => !selected.includes(c)).slice(0, remaining);
      onChange([...selected, ...toAdd]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedCountries = countries.filter((c) => selected.includes(c.code));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary',
          isOpen && 'ring-2 ring-primary border-primary'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="truncate">
              {selected.length} pays sélectionné{selected.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedCountries.slice(0, 10).map((country) => (
            <Badge
              key={country.code}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleCountry(country.code)}
            >
              {country.flag} {country.name}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {selected.length > 10 && (
            <Badge variant="outline">+{selected.length - 10}</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs"
          >
            Tout effacer
          </Button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-[400px] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 h-9"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[320px]">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : (
              CONTINENTS.map((continent) => {
                const continentCountries = countriesByContinent[continent] || [];
                if (continentCountries.length === 0) return null;

                const selectedCount = continentCountries.filter((c) =>
                  selected.includes(c.code)
                ).length;
                const allSelected = selectedCount === continentCountries.length;
                const isExpanded = expandedContinents.has(continent) || !!search;

                return (
                  <div key={continent} className="border-b last:border-0">
                    {/* Continent header */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(expandedContinents);
                        if (next.has(continent)) {
                          next.delete(continent);
                        } else {
                          next.add(continent);
                        }
                        setExpandedContinents(next);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {CONTINENT_LABELS[continent] || continent}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedCount}/{continentCountries.length}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleContinent(continent);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {allSelected ? 'Désélectionner' : 'Tout sélectionner'}
                      </button>
                    </button>

                    {/* Countries */}
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-1 p-2">
                        {continentCountries.map((country) => {
                          const isSelected = selected.includes(country.code);
                          const isDisabled = !!(maxSelection && !isSelected && selected.length >= maxSelection);

                          return (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => !isDisabled && toggleCountry(country.code)}
                              disabled={isDisabled}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left',
                                isSelected && 'bg-primary/10',
                                !isSelected && !isDisabled && 'hover:bg-gray-100',
                                isDisabled && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <span>{country.flag}</span>
                              <span className="truncate flex-1">{country.name}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {maxSelection && (
            <div className="p-2 border-t bg-gray-50 text-xs text-muted-foreground text-center">
              {selected.length} / {maxSelection} sélectionnés
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CountryMultiSelect;
