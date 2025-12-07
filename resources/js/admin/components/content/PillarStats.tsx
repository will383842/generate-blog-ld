/**
 * Pillar Stats
 * Display pillar content statistics
 */

import {
  BookOpen,
  Clock,
  List,
  BarChart3,
  Quote,
  Star,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import type { Pillar } from '@/types/pillar';

export interface PillarStatsProps {
  pillar: Pillar;
  className?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <Icon className={cn('w-5 h-5 mx-auto mb-1', color || 'text-muted-foreground')} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {subValue && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{subValue}</p>
      )}
    </div>
  );
}

function ScoreGauge({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">{label}</span>
          <span className={cn('text-sm font-medium', color)}>{score}%</span>
        </div>
        <ProgressBar value={score} className="h-2" />
      </div>
    </div>
  );
}

export function PillarStats({ pillar, className }: PillarStatsProps) {
  // Calculate reading time
  const readingTime = Math.ceil(pillar.wordCount / 200);

  // Calculate sections from TOC
  const sectionsCount = pillar.tableOfContents?.length || 0;
  const subSectionsCount = pillar.tableOfContents?.reduce(
    (sum, item) => sum + (item.children?.length || 0),
    0
  ) || 0;

  // Quality color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Statistiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={BookOpen}
            label="Mots"
            value={pillar.wordCount.toLocaleString()}
            color="text-blue-600"
          />
          <StatCard
            icon={Clock}
            label="Lecture"
            value={`${readingTime}`}
            subValue="minutes"
            color="text-purple-600"
          />
          <StatCard
            icon={List}
            label="Sections"
            value={sectionsCount}
            subValue={subSectionsCount > 0 ? `+${subSectionsCount} sous-sections` : undefined}
            color="text-green-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={BarChart3}
            label="Sources"
            value={pillar.sourcesCount}
            color="text-orange-600"
          />
          <StatCard
            icon={Quote}
            label="Citations"
            value={pillar.citationsCount}
            color="text-pink-600"
          />
          <StatCard
            icon={FileText}
            label="Stats"
            value={pillar.statistics?.length || 0}
            color="text-cyan-600"
          />
        </div>

        {/* Quality Scores */}
        <div className="pt-3 border-t space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4" />
            Scores de qualité
          </h4>
          
          <ScoreGauge
            score={pillar.qualityScore}
            label="Qualité globale"
            color={getScoreColor(pillar.qualityScore)}
          />
          
          {pillar.seoScore !== undefined && (
            <ScoreGauge
              score={pillar.seoScore}
              label="SEO"
              color={getScoreColor(pillar.seoScore)}
            />
          )}
          
          {pillar.readabilityScore !== undefined && (
            <ScoreGauge
              score={pillar.readabilityScore}
              label="Lisibilité"
              color={getScoreColor(pillar.readabilityScore)}
            />
          )}
        </div>

        {/* Word Count Benchmarks */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Benchmark contenu
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Minimum recommandé</span>
              <Badge
                variant={pillar.wordCount >= 3000 ? 'default' : 'outline'}
                className={pillar.wordCount >= 3000 ? 'bg-green-100 text-green-700' : ''}
              >
                3 000 mots
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Optimal</span>
              <Badge
                variant={pillar.wordCount >= 5000 ? 'default' : 'outline'}
                className={pillar.wordCount >= 5000 ? 'bg-green-100 text-green-700' : ''}
              >
                5 000 mots
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Contenu exhaustif</span>
              <Badge
                variant={pillar.wordCount >= 8000 ? 'default' : 'outline'}
                className={pillar.wordCount >= 8000 ? 'bg-green-100 text-green-700' : ''}
              >
                8 000+ mots
              </Badge>
            </div>
          </div>
        </div>

        {/* Child Articles */}
        {pillar.childArticleIds && pillar.childArticleIds.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Articles liés</span>
              <Badge variant="secondary">{pillar.childArticleIds.length}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PillarStats;
