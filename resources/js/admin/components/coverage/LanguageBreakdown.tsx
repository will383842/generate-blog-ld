/**
 * LanguageBreakdown Component
 * Progress bars showing coverage for each supported language
 */

import { useMemo } from 'react';
import { Globe, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useCoverageLanguages } from '@/hooks/useCoverage';
import type { PlatformId } from '@/types/program';

interface LanguageBreakdownProps {
  platformId?: PlatformId;
  onLanguageClick?: (languageId: string) => void;
  className?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
  nl: 'Nederlands',
  zh: '中文',
  ar: 'العربية',
};

const LANGUAGE_FLAGS: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  pt: '🇵🇹',
  de: '🇩🇪',
  it: '🇮🇹',
  nl: '🇳🇱',
  zh: '🇨🇳',
  ar: '🇸🇦',
};

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function LanguageBreakdown({
  platformId,
  onLanguageClick,
  className,
}: LanguageBreakdownProps) {
  const { data: languagesData, isLoading } = useCoverageLanguages({ platformId });
  const languages = languagesData?.data || [];

  // Sort by coverage percentage
  const sortedLanguages = useMemo(() => {
    return [...languages].sort((a, b) => b.percentage - a.percentage);
  }, [languages]);

  // Total stats
  const totalArticles = useMemo(() => {
    return languages.reduce((sum, l) => sum + l.totalArticles, 0);
  }, [languages]);

  const avgCoverage = useMemo(() => {
    if (languages.length === 0) return 0;
    return languages.reduce((sum, l) => sum + l.percentage, 0) / languages.length;
  }, [languages]);

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg border p-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Couverture par langue</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {totalArticles.toLocaleString()} articles
          </span>
          <Badge variant="outline">
            {avgCoverage.toFixed(0)}% moyen
          </Badge>
        </div>
      </div>

      {/* Language List */}
      <div className="p-4 space-y-4">
        {sortedLanguages.map((language) => (
          <div
            key={language.languageId}
            className={cn(
              'group',
              onLanguageClick && 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded'
            )}
            onClick={() => onLanguageClick?.(language.languageId)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {LANGUAGE_FLAGS[language.languageId] || '🌐'}
                </span>
                <span className="font-medium">
                  {LANGUAGE_NAMES[language.languageId] || language.languageName}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  ({language.languageId})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {language.totalArticles.toLocaleString()} articles
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold min-w-[3rem] text-right',
                    language.percentage >= 80 && 'text-green-600',
                    language.percentage >= 50 && language.percentage < 80 && 'text-yellow-600',
                    language.percentage < 50 && 'text-red-600'
                  )}
                >
                  {language.percentage.toFixed(0)}%
                </span>
                {onLanguageClick && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getProgressColor(language.percentage)
                )}
                style={{ width: `${language.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              <span>{language.coveredCountries} pays couverts</span>
              <span>
                {language.percentage >= 80 && '✓ Excellent'}
                {language.percentage >= 50 && language.percentage < 80 && '○ Bon'}
                {language.percentage >= 20 && language.percentage < 50 && '△ À améliorer'}
                {language.percentage < 20 && '✕ Critique'}
              </span>
            </div>
          </div>
        ))}

        {languages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée de langue disponible
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>{languages.filter((l) => l.percentage >= 80).length} excellents</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>{languages.filter((l) => l.percentage >= 50 && l.percentage < 80).length} bons</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>{languages.filter((l) => l.percentage < 50).length} critiques</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
