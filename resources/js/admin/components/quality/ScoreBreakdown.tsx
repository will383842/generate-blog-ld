/**
 * Score Breakdown Component
 * File 271 - Display 6 individual score gauges with color coding
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Search,
  Sparkles,
  Brain,
  Heart,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  QualityCheck,
  QualityCriterion,
  QUALITY_CRITERIA,
  getScoreColor,
  getScoreLabel,
} from '@/types/quality';
import { cn } from '@/lib/utils';

// Icon mapping
const CRITERION_ICONS: Record<QualityCriterion, React.ComponentType<{ className?: string }>> = {
  readability: BookOpen,
  seo: Search,
  brand: Sparkles,
  knowledge: Brain,
  engagement: Heart,
  accuracy: CheckCircle,
};

interface ScoreBreakdownProps {
  check: QualityCheck;
  compact?: boolean;
  showLabels?: boolean;
  showThresholds?: boolean;
}

export function ScoreBreakdown({
  check,
  compact = false,
  showLabels = true,
  showThresholds = true,
}: ScoreBreakdownProps) {
  const { t } = useTranslation();

  // Get score for criterion
  const getScore = (criterion: QualityCriterion): number => {
    return check[`${criterion}_score` as keyof QualityCheck] as number;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="grid grid-cols-6 gap-2">
          {QUALITY_CRITERIA.map(criterion => {
            const score = getScore(criterion.key);
            const Icon = CRITERION_ICONS[criterion.key];

            return (
              <Tooltip key={criterion.key}>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-help">
                    <div
                      className="w-10 h-10 mx-auto rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${getScoreColor(score)}20`,
                        color: getScoreColor(score),
                      }}
                    >
                      <span className="text-sm font-bold">{score}</span>
                    </div>
                    {showLabels && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {criterion.label.substring(0, 5)}
                      </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{criterion.label}</p>
                    <p className="text-sm">{score}/100 - {getScoreLabel(score)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {criterion.description}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition des scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {QUALITY_CRITERIA.map(criterion => {
            const score = getScore(criterion.key);
            const Icon = CRITERION_ICONS[criterion.key];
            const scoreColor = getScoreColor(score);

            return (
              <TooltipProvider key={criterion.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: `${criterion.color}20`,
                          }}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: criterion.color }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{criterion.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Poids: {criterion.weight}%
                          </p>
                        </div>
                      </div>

                      {/* Gauge */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-2xl font-bold"
                            style={{ color: scoreColor }}
                          >
                            {score}
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: scoreColor }}
                          >
                            {getScoreLabel(score)}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${score}%`,
                              backgroundColor: scoreColor,
                            }}
                          />
                          {/* Thresholds */}
                          {showThresholds && (
                            <>
                              <div
                                className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50"
                                style={{ left: '40%' }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50"
                                style={{ left: '60%' }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50"
                                style={{ left: '80%' }}
                              />
                            </>
                          )}
                        </div>
                        {showThresholds && (
                          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>0</span>
                            <span>40</span>
                            <span>60</span>
                            <span>80</span>
                            <span>100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">{criterion.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {criterion.description}
                    </p>
                    {check.criteria_details?.[criterion.key] && (
                      <div className="mt-2 pt-2 border-t">
                        {check.criteria_details[criterion.key].positive.length > 0 && (
                          <p className="text-xs text-green-600">
                            ✓ {check.criteria_details[criterion.key].positive[0]}
                          </p>
                        )}
                        {check.criteria_details[criterion.key].issues.length > 0 && (
                          <p className="text-xs text-red-600">
                            ✗ {check.criteria_details[criterion.key].issues[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Insuffisant (0-49)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">Moyen (50-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Bon (70-100)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ScoreBreakdown;
