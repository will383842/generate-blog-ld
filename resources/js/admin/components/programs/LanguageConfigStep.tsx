import { useMemo } from 'react';
import { Check, Info, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useLanguages } from '@/hooks/useLanguages';
import type { QuantityMode, LanguageCode } from '@/types/program';

export interface LanguageConfigStepProps {
  selectedLanguages: LanguageCode[];
  onChange: (languages: LanguageCode[]) => void;
  selectedCountries?: string[];
  quantityMode?: QuantityMode;
  autoMode?: boolean;
  onAutoModeChange?: (auto: boolean) => void;
  errors?: string[];
  className?: string;
}

// Country to primary language mapping (simplified)
const COUNTRY_LANGUAGES: Record<string, LanguageCode[]> = {
  FR: ['fr', 'en'],
  DE: ['de', 'en'],
  ES: ['es', 'en'],
  IT: ['en'],
  PT: ['pt', 'en'],
  GB: ['en'],
  US: ['en', 'es'],
  CA: ['en', 'fr'],
  BR: ['pt', 'en'],
  JP: ['en'],
  CN: ['zh', 'en'],
  RU: ['ru', 'en'],
  IN: ['hi', 'en'],
  AE: ['ar', 'en'],
  SA: ['ar', 'en'],
  // Add more mappings as needed
};

export function LanguageConfigStep({
  selectedLanguages,
  onChange,
  selectedCountries = [],
  quantityMode,
  autoMode = false,
  onAutoModeChange,
  errors,
  className,
}: LanguageConfigStepProps) {
  const { languages } = useLanguages();

  // Calculate recommended languages based on selected countries
  const recommendedLanguages = useMemo(() => {
    if (selectedCountries.length === 0) return [];
    
    const langSet = new Set<LanguageCode>();
    selectedCountries.forEach((countryCode) => {
      const langs = COUNTRY_LANGUAGES[countryCode] || ['en'];
      langs.forEach((lang) => langSet.add(lang as LanguageCode));
    });
    
    return Array.from(langSet);
  }, [selectedCountries]);

  const toggleLanguage = (code: LanguageCode) => {
    if (selectedLanguages.includes(code)) {
      onChange(selectedLanguages.filter((l) => l !== code));
    } else {
      onChange([...selectedLanguages, code]);
    }
  };

  const selectAll = () => {
    onChange(languages.map((l) => l.code as LanguageCode));
  };

  const selectNone = () => {
    onChange([]);
  };

  const applyRecommended = () => {
    onChange(recommendedLanguages);
  };

  const handleAutoModeToggle = (enabled: boolean) => {
    onAutoModeChange?.(enabled);
    if (enabled && recommendedLanguages.length > 0) {
      onChange(recommendedLanguages);
    }
  };

  const hasError = errors && errors.length > 0;
  const showMatrix = quantityMode === 'perCountryLanguage' && selectedCountries.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Langues de génération
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez les langues dans lesquelles générer le contenu
          </p>
        </div>

        {/* Auto mode toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Mode auto</span>
            <Switch
              checked={autoMode}
              onCheckedChange={handleAutoModeToggle}
            />
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px]">
                Le mode auto sélectionne automatiquement les langues en fonction des pays choisis
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.join('. ')}</p>
        </div>
      )}

      {/* Recommended languages */}
      {recommendedLanguages.length > 0 && !autoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Langues recommandées
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Basé sur les {selectedCountries.length} pays sélectionnés
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={applyRecommended}
              className="bg-white"
            >
              Appliquer
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {recommendedLanguages.map((code) => {
              const lang = languages.find((l) => l.code === code);
              if (!lang) return null;
              return (
                <Badge key={code} variant="secondary" className="bg-white">
                  {lang.flag} {lang.nativeName}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {!autoMode && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Tout sélectionner
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Tout désélectionner
          </Button>
        </div>
      )}

      {/* Language grid */}
      {!showMatrix && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {languages.map((language) => {
            const isSelected = selectedLanguages.includes(language.code as LanguageCode);
            const isRecommended = recommendedLanguages.includes(language.code as LanguageCode);

            return (
              <button
                key={language.code}
                onClick={() => !autoMode && toggleLanguage(language.code as LanguageCode)}
                disabled={autoMode}
                className={cn(
                  'relative flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300',
                  autoMode && 'opacity-70 cursor-not-allowed',
                  !autoMode && 'cursor-pointer'
                )}
              >
                {/* Recommended indicator */}
                {isRecommended && !autoMode && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      Recommandé
                    </Badge>
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                <span className="text-2xl">{language.flag}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {language.nativeName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language.name}
                    {language.dir === 'rtl' && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        RTL
                      </Badge>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Matrix view for perCountryLanguage mode */}
      {showMatrix && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium">Pays</th>
                  {languages.map((lang) => (
                    <th key={lang.code} className="px-2 py-3 text-center">
                      <span className="text-lg">{lang.flag}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedCountries.slice(0, 20).map((countryCode) => {
                  const countryLangs = COUNTRY_LANGUAGES[countryCode] || [];
                  return (
                    <tr key={countryCode} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{countryCode}</td>
                      {languages.map((lang) => (
                        <td key={lang.code} className="px-2 py-2 text-center">
                          <Checkbox
                            checked={
                              selectedLanguages.includes(lang.code as LanguageCode) &&
                              countryLangs.includes(lang.code as LanguageCode)
                            }
                            disabled={autoMode}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedCountries.length > 20 && (
            <p className="text-xs text-muted-foreground p-3 bg-gray-50 border-t">
              Affichage des 20 premiers pays sur {selectedCountries.length}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedLanguages.length} langue{selectedLanguages.length !== 1 ? 's' : ''} sélectionnée{selectedLanguages.length !== 1 ? 's' : ''}
            </p>
            {quantityMode === 'perCountryLanguage' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                = {selectedCountries.length} pays × {selectedLanguages.length} langues 
                = {selectedCountries.length * selectedLanguages.length} combinaisons
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
            {selectedLanguages.map((code) => {
              const lang = languages.find((l) => l.code === code);
              if (!lang) return null;
              return (
                <Badge key={code} variant="secondary">
                  {lang.flag} {lang.code.toUpperCase()}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LanguageConfigStep;
