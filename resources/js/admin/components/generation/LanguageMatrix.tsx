/**
 * Language Matrix
 * Grid of 9 languages with checkboxes
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLanguages } from '@/hooks/useLanguages';
import type { LanguageCode } from '@/types/program';

export interface LanguageMatrixProps {
  selected: LanguageCode[];
  onChange: (languages: LanguageCode[]) => void;
  countries?: string[];
  disabled?: LanguageCode[];
  className?: string;
}

// Country to recommended languages mapping
// 9 langues supportées: fr, en, de, es, pt, ru, zh, ar, hi
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
  RU: ['ru', 'en'],
  CN: ['zh', 'en'],
  JP: ['en'],
  IN: ['hi', 'en'],
  AE: ['ar', 'en'],
  SA: ['ar', 'en'],
};

export function LanguageMatrix({
  selected,
  onChange,
  countries = [],
  disabled = [],
  className,
}: LanguageMatrixProps) {
  const { data: languagesData, isLoading } = useLanguages();
  const languages = languagesData?.data || [];

  // Get recommended languages based on selected countries
  const recommendedLanguages = new Set<LanguageCode>();
  countries.forEach((code) => {
    const langs = COUNTRY_LANGUAGES[code] || ['en'];
    langs.forEach((l) => recommendedLanguages.add(l as LanguageCode));
  });

  const toggleLanguage = (code: LanguageCode) => {
    if (disabled.includes(code)) return;
    
    if (selected.includes(code)) {
      onChange(selected.filter((l) => l !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const selectAll = () => {
    const allCodes = languages
      .filter((l) => !disabled.includes(l.code as LanguageCode))
      .map((l) => l.code as LanguageCode);
    onChange(allCodes);
  };

  const selectNone = () => {
    onChange([]);
  };

  const selectRecommended = () => {
    onChange(Array.from(recommendedLanguages).filter((l) => !disabled.includes(l)));
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Langues de génération</h3>
          <p className="text-sm text-muted-foreground">
            {selected.length} langue{selected.length !== 1 ? 's' : ''} sélectionnée{selected.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Tout
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Aucun
          </Button>
          {recommendedLanguages.size > 0 && (
            <Button variant="outline" size="sm" onClick={selectRecommended}>
              Recommandées ({recommendedLanguages.size})
            </Button>
          )}
        </div>
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {languages.map((language) => {
          const code = language.code as LanguageCode;
          const isSelected = selected.includes(code);
          const isDisabled = disabled.includes(code);
          const isRecommended = recommendedLanguages.has(code);

          return (
            <button
              key={code}
              type="button"
              onClick={() => toggleLanguage(code)}
              disabled={isDisabled}
              className={cn(
                'relative flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
                isSelected && 'border-primary bg-primary/5',
                !isSelected && !isDisabled && 'border-gray-200 hover:border-gray-300',
                isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Recommended badge */}
              {isRecommended && !isSelected && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    ★
                  </Badge>
                </div>
              )}

              {/* Flag */}
              <span className="text-3xl">{language.flag}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {language.nativeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language.name}
                  {language.dir === 'rtl' && (
                    <span className="ml-1 text-yellow-600">(RTL)</span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
          {selected.map((code) => {
            const lang = languages.find((l) => l.code === code);
            if (!lang) return null;
            return (
              <Badge
                key={code}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-200"
                onClick={() => toggleLanguage(code)}
              >
                {lang.flag} {lang.nativeName}
                <span className="ml-1 text-muted-foreground">×</span>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageMatrix;
