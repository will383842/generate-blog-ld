/**
 * Article Stats
 * Quick stats for a single article
 */

import {
  FileText,
  Clock,
  BarChart3,
  Target,
  Languages,
  Check,
  AlertCircle,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { LANGUAGES } from '@/utils/constants';
import type { Article, ArticleTranslation, TranslationStatus } from '@/types/article';
import type { LanguageCode } from '@/types/program';

export interface ArticleStatsProps {
  article: Article;
  translations?: ArticleTranslation[];
  availableLanguages?: LanguageCode[];
  className?: string;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, subValue, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          color || 'bg-gray-200'
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}

interface ScoreGaugeProps {
  label: string;
  score: number;
  icon: React.ElementType;
}

function ScoreGauge({ label, score, icon: Icon }: ScoreGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', getColor(score))} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={cn('text-lg font-bold', getColor(score))}>
          {score}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', getProgressColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const TRANSLATION_STATUS_CONFIG: Record<
  TranslationStatus,
  { icon: typeof Check; color: string }
> = {
  done: { icon: Check, color: 'text-green-600' },
  pending: { icon: Clock, color: 'text-blue-600' },
  in_progress: { icon: Clock, color: 'text-yellow-600' },
  missing: { icon: Minus, color: 'text-gray-400' },
  needs_update: { icon: AlertCircle, color: 'text-orange-600' },
};

export function ArticleStats({
  article,
  translations = [],
  availableLanguages = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'],
  className,
}: ArticleStatsProps) {
  // Calculate translation progress
  const getTranslationStatus = (langCode: LanguageCode): TranslationStatus => {
    if (langCode === article.languageId) return 'done';
    const translation = translations.find((t) => t.languageId === langCode);
    return translation?.status || 'missing';
  };

  const doneCount = availableLanguages.filter(
    (l) => getTranslationStatus(l) === 'done'
  ).length;
  const translationProgress = Math.round(
    (doneCount / availableLanguages.length) * 100
  );

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={FileText}
            label="Mots"
            value={article.wordCount.toLocaleString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Clock}
            label="Temps de lecture"
            value={`${article.readingTime} min`}
            color="bg-purple-500"
          />
        </div>

        {/* Quality Scores */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Scores</h4>
          <ScoreGauge
            label="Qualité globale"
            score={article.qualityScore}
            icon={BarChart3}
          />
          {article.seoScore !== undefined && (
            <ScoreGauge
              label="SEO"
              score={article.seoScore}
              icon={Target}
            />
          )}
          {article.readabilityScore !== undefined && (
            <ScoreGauge
              label="Lisibilité"
              score={article.readabilityScore}
              icon={FileText}
            />
          )}
        </div>

        {/* Translations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Traductions
            </h4>
            <Badge variant="secondary">
              {doneCount}/{availableLanguages.length}
            </Badge>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${translationProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {availableLanguages.map((langCode) => {
              const lang = LANGUAGES.find((l) => l.code === langCode);
              const status = getTranslationStatus(langCode);
              const config = TRANSLATION_STATUS_CONFIG[status];

              return (
                <div
                  key={langCode}
                  className="flex items-center gap-1.5 text-sm"
                  title={status}
                >
                  <config.icon className={cn('w-3.5 h-3.5', config.color)} />
                  <span>{lang?.flag}</span>
                  <span className="text-xs text-muted-foreground">
                    {langCode.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Keywords */}
        {article.focusKeyword && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Mot-clé principal</h4>
            <Badge variant="outline">{article.focusKeyword}</Badge>
            {article.secondaryKeywords && article.secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {article.secondaryKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ArticleStats;
