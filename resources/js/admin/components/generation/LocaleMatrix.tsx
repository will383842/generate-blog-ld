/**
 * Locale Matrix
 * Grid showing language-country combinations (e.g., fr-DE, ar-AE)
 * Allows selection of specific locale combinations
 */

import { useState, useMemo } from 'react';
import { Check, Globe, Languages, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { LANGUAGES, type LanguageCode } from '@/utils/constants';
import { useCountries } from '@/hooks/useCountries';
import { formatLocale } from '@/utils/staticCountries';

export interface Locale {
  code: string;      // e.g., "fr-DE"
  language: string;  // e.g., "fr"
  country: string;   // e.g., "DE"
}

export interface LocaleMatrixProps {
  /** Array of country codes to show */
  countries: string[];
  /** Array of language codes to show */
  languages: LanguageCode[];
  /** Currently selected locale combinations */
  selectedLocales: Locale[];
  /** Callback when locales change */
  onChange: (locales: Locale[]) => void;
  /** Show as compact matrix or expanded list */
  variant?: 'matrix' | 'list';
  /** Maximum locales that can be selected */
  maxSelection?: number;
  className?: string;
}

export function LocaleMatrix({
  countries,
  languages,
  selectedLocales,
  onChange,
  variant = 'matrix',
  maxSelection,
  className,
}: LocaleMatrixProps) {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  
  const { countries: allCountries } = useCountries();
  const allLanguages = LANGUAGES;
  
  // Get country/language details
  const countryDetails = useMemo(() => {
    return countries.map(code => 
      allCountries.find(c => c.code === code) || { code, name: code, flag: '🏳️' }
    );
  }, [countries, allCountries]);
  
  const languageDetails = useMemo(() => {
    return languages.map(code =>
      allLanguages.find(l => l.code === code) || { code, name: code, flag: '🌐', nativeName: code }
    );
  }, [languages, allLanguages]);
  
  // Check if a locale is selected
  const isLocaleSelected = (langCode: string, countryCode: string): boolean => {
    return selectedLocales.some(
      l => l.language === langCode && l.country === countryCode
    );
  };
  
  // Toggle a single locale
  const toggleLocale = (langCode: string, countryCode: string) => {
    const localeCode = formatLocale(langCode, countryCode);
    const exists = isLocaleSelected(langCode, countryCode);
    
    if (exists) {
      onChange(selectedLocales.filter(l => l.code !== localeCode));
    } else {
      if (maxSelection && selectedLocales.length >= maxSelection) return;
      onChange([...selectedLocales, { code: localeCode, language: langCode, country: countryCode }]);
    }
  };
  
  // Select all locales for a country
  const selectAllForCountry = (countryCode: string) => {
    const newLocales = [...selectedLocales];
    languages.forEach(langCode => {
      if (!isLocaleSelected(langCode, countryCode)) {
        if (!maxSelection || newLocales.length < maxSelection) {
          newLocales.push({
            code: formatLocale(langCode, countryCode),
            language: langCode,
            country: countryCode,
          });
        }
      }
    });
    onChange(newLocales);
  };
  
  // Deselect all locales for a country
  const deselectAllForCountry = (countryCode: string) => {
    onChange(selectedLocales.filter(l => l.country !== countryCode));
  };
  
  // Select all locales for a language
  const selectAllForLanguage = (langCode: string) => {
    const newLocales = [...selectedLocales];
    countries.forEach(countryCode => {
      if (!isLocaleSelected(langCode, countryCode)) {
        if (!maxSelection || newLocales.length < maxSelection) {
          newLocales.push({
            code: formatLocale(langCode, countryCode),
            language: langCode,
            country: countryCode,
          });
        }
      }
    });
    onChange(newLocales);
  };
  
  // Select/deselect all
  const selectAll = () => {
    const allLocales: Locale[] = [];
    countries.forEach(countryCode => {
      languages.forEach(langCode => {
        if (!maxSelection || allLocales.length < maxSelection) {
          allLocales.push({
            code: formatLocale(langCode, countryCode),
            language: langCode,
            country: countryCode,
          });
        }
      });
    });
    onChange(allLocales);
  };
  
  const deselectAll = () => {
    onChange([]);
  };
  
  // Count selected per country/language
  const countForCountry = (countryCode: string) => 
    selectedLocales.filter(l => l.country === countryCode).length;
  
  const countForLanguage = (langCode: string) =>
    selectedLocales.filter(l => l.language === langCode).length;
  
  const totalPossible = countries.length * languages.length;
  
  // Matrix view
  if (variant === 'matrix') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Combinaisons Langue-Pays
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedLocales.length} / {totalPossible} sélectionnées
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Aucun
            </Button>
          </div>
        </div>
        
        {/* Matrix */}
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="max-h-[500px]">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left text-sm font-medium border-b">
                    Pays / Langue
                  </th>
                  {languageDetails.map(lang => (
                    <th 
                      key={lang.code} 
                      className="p-2 text-center border-b min-w-[60px]"
                    >
                      <button
                        onClick={() => selectAllForLanguage(lang.code)}
                        className="flex flex-col items-center gap-1 mx-auto hover:opacity-80"
                        title={`Sélectionner tous les ${lang.nativeName || lang.name}`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs font-medium uppercase">{lang.code}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {countForLanguage(lang.code)}
                        </Badge>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countryDetails.map(country => (
                  <tr key={country.code} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{country.flag}</span>
                        <div>
                          <span className="font-medium text-sm">{country.name}</span>
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            {countForCountry(country.code)}/{languages.length}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    {languageDetails.map(lang => {
                      const isSelected = isLocaleSelected(lang.code, country.code);
                      const localeCode = formatLocale(lang.code, country.code);
                      
                      return (
                        <td key={lang.code} className="p-2 text-center">
                          <button
                            onClick={() => toggleLocale(lang.code, country.code)}
                            className={cn(
                              'w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-primary border-primary text-white'
                                : 'border-gray-200 hover:border-gray-400 text-gray-400'
                            )}
                            title={localeCode}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-[10px] font-mono">{localeCode}</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
        
        {/* Selected Summary */}
        {selectedLocales.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">
              Locales sélectionnées ({selectedLocales.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedLocales.slice(0, 20).map(locale => {
                const country = countryDetails.find(c => c.code === locale.country);
                const lang = languageDetails.find(l => l.code === locale.language);
                
                return (
                  <Badge
                    key={locale.code}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => toggleLocale(locale.language, locale.country)}
                  >
                    {country?.flag} {locale.code}
                    <X className="h-3 w-3" />
                  </Badge>
                );
              })}
              {selectedLocales.length > 20 && (
                <Badge variant="outline">+{selectedLocales.length - 20}</Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // List view
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Locales par pays</h3>
          <p className="text-sm text-muted-foreground">
            {selectedLocales.length} sélectionnées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>Tout</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Aucun</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {countryDetails.map(country => {
          const isExpanded = expandedCountries.has(country.code);
          const selectedCount = countForCountry(country.code);
          
          return (
            <Collapsible
              key={country.code}
              open={isExpanded}
              onOpenChange={(open) => {
                const next = new Set(expandedCountries);
                if (open) next.add(country.code);
                else next.delete(country.code);
                setExpandedCountries(next);
              }}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                    <Badge variant={selectedCount > 0 ? 'default' : 'secondary'}>
                      {selectedCount}/{languages.length}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); selectAllForCountry(country.code); }}
                    >
                      Tout
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); deselectAllForCountry(country.code); }}
                    >
                      Aucun
                    </Button>
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-10 mt-2 flex flex-wrap gap-2 pb-2">
                  {languageDetails.map(lang => {
                    const isSelected = isLocaleSelected(lang.code, country.code);
                    const localeCode = formatLocale(lang.code, country.code);
                    
                    return (
                      <label
                        key={lang.code}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'border-gray-200 hover:border-gray-400'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleLocale(lang.code, country.code)}
                        />
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{localeCode}</span>
                      </label>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

export default LocaleMatrix;
