import { useState, useMemo, useCallback } from 'react';
import {
  Map,
  List,
  Bookmark,
  Search,
  X,
  Check,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { useCountries, CONTINENTS, CONTINENT_LABELS } from '@/hooks/useCountries';
import type { Country, Continent } from '@/hooks/useCountries';

export interface CountrySelectionStepProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  errors?: string[];
  className?: string;
}

type ViewMode = 'map' | 'list' | 'presets';

// Preset configurations
const PRESETS = [
  { id: 'all', name: 'Tous les pays (197)', filter: () => true },
  { id: 'europe', name: 'Europe (44)', filter: (c: Country) => c.continent === 'Europe' },
  { id: 'asia', name: 'Asie (48)', filter: (c: Country) => c.continent === 'Asia' },
  { id: 'africa', name: 'Afrique (54)', filter: (c: Country) => c.continent === 'Africa' },
  { id: 'north-america', name: 'Amérique du Nord (23)', filter: (c: Country) => c.continent === 'North America' },
  { id: 'south-america', name: 'Amérique du Sud (12)', filter: (c: Country) => c.continent === 'South America' },
  { id: 'oceania', name: 'Océanie (14)', filter: (c: Country) => c.continent === 'Oceania' },
  { id: 'top20', name: 'Top 20 SEO', filter: (c: Country) => 
    ['FR', 'DE', 'GB', 'US', 'ES', 'IT', 'PT', 'NL', 'BE', 'CH',
     'CA', 'AU', 'JP', 'BR', 'MX', 'AE', 'SG', 'TH', 'IN', 'CN'].includes(c.code)
  },
  { id: 'eu', name: 'Union Européenne (27)', filter: (c: Country) =>
    ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
     'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
     'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(c.code)
  },
  { id: 'francophonie', name: 'Francophonie', filter: (c: Country) =>
    ['FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'SN', 'CI', 'ML', 'BF',
     'NE', 'TG', 'BJ', 'CM', 'CF', 'TD', 'CG', 'CD', 'GA', 'GN',
     'DJ', 'KM', 'MG', 'MU', 'SC', 'HT', 'MA', 'TN', 'DZ'].includes(c.code)
  },
];

export function CountrySelectionStep({
  selectedCountries,
  onChange,
  errors,
  className,
}: CountrySelectionStepProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContinents, setExpandedContinents] = useState<Set<Continent>>(
    new Set(['Europe'])
  );

  const { data: countriesData } = useCountries();
  const countries = countriesData?.data || [];

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  // Group by continent
  const countriesByContinent = useMemo(() => {
    return CONTINENTS.reduce((acc, continent) => {
      acc[continent] = filteredCountries.filter((c) => c.continent === continent);
      return acc;
    }, {} as Record<Continent, Country[]>);
  }, [filteredCountries]);

  const toggleCountry = useCallback((code: string) => {
    if (selectedCountries.includes(code)) {
      onChange(selectedCountries.filter((c) => c !== code));
    } else {
      onChange([...selectedCountries, code]);
    }
  }, [selectedCountries, onChange]);

  const toggleContinent = useCallback((continent: Continent) => {
    const continentCodes = countriesByContinent[continent]?.map((c) => c.code) || [];
    const allSelected = continentCodes.every((code) =>
      selectedCountries.includes(code)
    );

    if (allSelected) {
      onChange(selectedCountries.filter((c) => !continentCodes.includes(c)));
    } else {
      const newSelection = new Set([...selectedCountries, ...continentCodes]);
      onChange(Array.from(newSelection));
    }
  }, [selectedCountries, countriesByContinent, onChange]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const presetCountries = countries
      .filter(preset.filter)
      .map((c) => c.code);
    onChange(presetCountries);
  }, [countries, onChange]);

  const clearSelection = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const toggleContinentExpand = (continent: Continent) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) {
        next.delete(continent);
      } else {
        next.add(continent);
      }
      return next;
    });
  };

  const hasError = errors && errors.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Sélection des pays
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez les pays cibles pour la génération de contenu
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="gap-1"
          >
            <Map className="w-4 h-4" />
            Carte
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1"
          >
            <List className="w-4 h-4" />
            Liste
          </Button>
          <Button
            variant={viewMode === 'presets' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('presets')}
            className="gap-1"
          >
            <Bookmark className="w-4 h-4" />
            Presets
          </Button>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.join('. ')}</p>
        </div>
      )}

      {/* Selection summary */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {selectedCountries.length} pays sélectionné{selectedCountries.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedCountries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="w-4 h-4 mr-1" />
            Tout effacer
          </Button>
        )}
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center bg-gray-50">
          <div className="text-center text-muted-foreground">
            <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Carte interactive</p>
            <p className="text-sm">Cliquez sur les pays pour les sélectionner</p>
            <p className="text-xs mt-2">(Intégration Leaflet requise)</p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Continents list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {CONTINENTS.map((continent) => {
              const continentCountries = countriesByContinent[continent] || [];
              if (continentCountries.length === 0) return null;

              const selectedInContinent = continentCountries.filter((c) =>
                selectedCountries.includes(c.code)
              ).length;
              const allSelected = selectedInContinent === continentCountries.length;
              const someSelected = selectedInContinent > 0 && !allSelected;

              return (
                <Collapsible
                  key={continent}
                  open={expandedContinents.has(continent)}
                  onOpenChange={() => toggleContinentExpand(continent)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            // @ts-ignore - indeterminate not typed
                            indeterminate={someSelected}
                            onCheckedChange={() => toggleContinent(continent)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium">
                            {CONTINENT_LABELS[continent] || continent}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedInContinent}/{continentCountries.length}
                          </Badge>
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-5 h-5 text-muted-foreground transition-transform',
                            expandedContinents.has(continent) && 'rotate-180'
                          )}
                        />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
                        {continentCountries.map((country) => {
                          const isSelected = selectedCountries.includes(country.code);
                          return (
                            <button
                              key={country.code}
                              onClick={() => toggleCountry(country.code)}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-primary/10 border-2 border-primary'
                                  : 'bg-white border border-gray-200 hover:border-gray-300'
                              )}
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="truncate flex-1">{country.name}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}

      {/* Presets View */}
      {viewMode === 'presets' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const presetCountries = countries.filter(preset.filter);
            const presetCodes = presetCountries.map((c) => c.code);
            const isApplied = presetCodes.every((code) =>
              selectedCountries.includes(code)
            ) && selectedCountries.length === presetCodes.length;

            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  isApplied
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{preset.name}</span>
                  {isApplied && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {presetCountries.length} pays
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected countries preview */}
      {selectedCountries.length > 0 && selectedCountries.length <= 20 && (
        <div className="flex flex-wrap gap-1">
          {selectedCountries.slice(0, 20).map((code) => {
            const country = countries.find((c) => c.code === code);
            if (!country) return null;
            return (
              <Badge
                key={code}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-gray-200"
                onClick={() => toggleCountry(code)}
              >
                {country.flag} {country.name}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            );
          })}
          {selectedCountries.length > 20 && (
            <Badge variant="outline">
              +{selectedCountries.length - 20} autres
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default CountrySelectionStep;
