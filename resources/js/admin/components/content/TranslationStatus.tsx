/**
 * Translation Status
 * Grid showing translation status for all languages
 */

import { useState } from 'react';
import {
  Languages,
  Check,
  Clock,
  AlertCircle,
  Minus,
  Wand2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { LANGUAGES } from '@/utils/constants';
import type { ArticleTranslation, TranslationStatus as TStatus } from '@/types/article';
import type { LanguageCode } from '@/types/program';

export interface TranslationStatusProps {
  translations: ArticleTranslation[];
  primaryLanguage: LanguageCode;
  availableLanguages?: LanguageCode[];
  onNavigate?: (languageId: LanguageCode) => void;
  onTranslate?: (targetLanguageId: LanguageCode, useAI: boolean) => void;
  onCopyFrom?: (fromLanguageId: LanguageCode, toLanguageId: LanguageCode) => void;
  isTranslating?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  TStatus,
  { label: string; icon: typeof Check; color: string; bgColor: string }
> = {
  done: {
    label: 'Terminé',
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  in_progress: {
    label: 'En cours',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  missing: {
    label: 'Manquant',
    icon: Minus,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
  },
  needs_update: {
    label: 'À mettre à jour',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
};

export function TranslationStatus({
  translations,
  primaryLanguage,
  availableLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'],
  onNavigate,
  onTranslate,
  onCopyFrom,
  isTranslating,
  className,
}: TranslationStatusProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);

  // Get translation status for a language
  const getTranslation = (langCode: LanguageCode): ArticleTranslation | undefined => {
    return translations.find((t) => t.languageId === langCode);
  };

  const getStatus = (langCode: LanguageCode): TStatus => {
    if (langCode === primaryLanguage) return 'done';
    const translation = getTranslation(langCode);
    return translation?.status || 'missing';
  };

  // Calculate progress
  const doneCount = availableLanguages.filter(
    (l) => getStatus(l) === 'done'
  ).length;
  const progress = Math.round((doneCount / availableLanguages.length) * 100);

  // Group by status
  const groupedLanguages = {
    done: availableLanguages.filter((l) => getStatus(l) === 'done'),
    in_progress: availableLanguages.filter((l) => getStatus(l) === 'in_progress'),
    pending: availableLanguages.filter((l) => getStatus(l) === 'pending'),
    needs_update: availableLanguages.filter((l) => getStatus(l) === 'needs_update'),
    missing: availableLanguages.filter((l) => getStatus(l) === 'missing'),
  };

  const handleLanguageClick = (langCode: LanguageCode) => {
    setSelectedLanguage(langCode === selectedLanguage ? null : langCode);
    onNavigate?.(langCode);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="w-4 h-4" />
            Traductions
          </CardTitle>
          <Badge variant="secondary">
            {doneCount}/{availableLanguages.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Languages grid */}
        <div className="grid grid-cols-3 gap-2">
          {availableLanguages.map((langCode) => {
            const lang = LANGUAGES.find((l) => l.code === langCode);
            const status = getStatus(langCode);
            const config = STATUS_CONFIG[status];
            const isPrimary = langCode === primaryLanguage;
            const isSelected = langCode === selectedLanguage;

            return (
              <Tooltip key={langCode}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-gray-50',
                      isPrimary && 'bg-blue-50'
                    )}
                    onClick={() => handleLanguageClick(langCode)}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded flex items-center justify-center',
                        config.bgColor
                      )}
                    >
                      <config.icon className={cn('w-3.5 h-3.5', config.color)} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1">
                        <span>{lang?.flag}</span>
                        <span className="text-xs font-medium">
                          {langCode.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {isPrimary && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        Source
                      </Badge>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {lang?.name} - {config.label}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Actions for selected language */}
        {selectedLanguage && selectedLanguage !== primaryLanguage && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}{' '}
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_CONFIG[getStatus(selectedLanguage)].label}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.(selectedLanguage)}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Ouvrir
              </Button>
            </div>

            <div className="flex gap-2">
              {onTranslate && getStatus(selectedLanguage) !== 'done' && (
                <Button
                  size="sm"
                  onClick={() => onTranslate(selectedLanguage, true)}
                  disabled={isTranslating}
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  Traduire (IA)
                </Button>
              )}
              {onCopyFrom && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCopyFrom(primaryLanguage, selectedLanguage)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copier source
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-1 text-center text-xs">
          {Object.entries(groupedLanguages).map(([status, langs]) => {
            const config = STATUS_CONFIG[status as TStatus];
            return (
              <div key={status} className="p-2 rounded bg-gray-50">
                <p className={cn('font-bold', config.color)}>{langs.length}</p>
                <p className="text-muted-foreground truncate">{config.label}</p>
              </div>
            );
          })}
        </div>

        {/* Bulk translate */}
        {onTranslate && groupedLanguages.missing.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Translate all missing
              groupedLanguages.missing.forEach((lang) => {
                onTranslate(lang, true);
              });
            }}
            disabled={isTranslating}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Traduire les {groupedLanguages.missing.length} langues manquantes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default TranslationStatus;
