/**
 * Quality Check Details Component
 * File 270 - Detailed view of quality check with all scores and suggestions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ExternalLink,
  FileText,
  Clock,
  Loader2,
  Lightbulb,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useRevalidate } from '@/hooks/useQuality';
import {
  QualityCheck,
  QualitySuggestion,
  QUALITY_CRITERIA,
  getCriterionMetadata,
  getScoreColor,
  getScoreLabel,
  getQualityStatusColor,
  getQualityStatusLabel,
} from '@/types/quality';
import { ScoreBreakdown } from './ScoreBreakdown';
import { cn } from '@/lib/utils';

interface QualityCheckDetailsProps {
  check: QualityCheck;
  onRevalidate?: () => void;
  isRevalidating?: boolean;
}

export function QualityCheckDetails({
  check,
  onRevalidate,
  isRevalidating = false,
}: QualityCheckDetailsProps) {
  const { t } = useTranslation();
  const revalidate = useRevalidate();

  const handleRevalidate = () => {
    if (onRevalidate) {
      onRevalidate();
    } else {
      revalidate.mutate(check.article_id);
    }
  };

  // Group suggestions by criterion
  const suggestionsByCriterion = check.suggestions.reduce((acc, s) => {
    if (!acc[s.criterion]) acc[s.criterion] = [];
    acc[s.criterion].push(s);
    return acc;
  }, {} as Record<string, QualitySuggestion[]>);

  // Get severity icon
  const getSeverityIcon = (severity: QualitySuggestion['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'major':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'minor':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{check.article_title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{check.content_type}</Badge>
            <Badge
              style={{
                backgroundColor: getQualityStatusColor(check.status),
                color: 'white',
              }}
            >
              {getQualityStatusLabel(check.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {check.language_code.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/content/${check.content_type}/${check.article_id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir l'article
            </Link>
          </Button>
          <Button
            onClick={handleRevalidate}
            disabled={isRevalidating || revalidate.isPending}
          >
            {(isRevalidating || revalidate.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Revalider
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div
                className="text-6xl font-bold"
                style={{ color: getScoreColor(check.overall_score) }}
              >
                {check.overall_score}
              </div>
              <p className="text-muted-foreground mt-1">Score global</p>
              <Badge
                className="mt-2"
                style={{
                  backgroundColor: getScoreColor(check.overall_score),
                  color: 'white',
                }}
              >
                {getScoreLabel(check.overall_score)}
              </Badge>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${check.overall_score}%`,
                    backgroundColor: getScoreColor(check.overall_score),
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {check.word_count} mots
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {check.reading_time} min lecture
                </div>
                <div>
                  Vérifié le {new Date(check.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <ScoreBreakdown check={check} />

      {/* Criterion Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail par critère</CardTitle>
          <CardDescription>
            Analyse détaillée pour chaque critère de qualité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {QUALITY_CRITERIA.map(criterion => {
              const detail = check.criteria_details?.[criterion.key];
              const score = check[`${criterion.key}_score` as keyof QualityCheck] as number;
              const suggestions = suggestionsByCriterion[criterion.key] || [];

              return (
                <AccordionItem key={criterion.key} value={criterion.key}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4 w-full pr-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: criterion.color }}
                      />
                      <span className="font-medium">{criterion.label}</span>
                      <div className="flex-1" />
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: getScoreColor(score),
                          color: getScoreColor(score),
                        }}
                      >
                        {score}/100
                      </Badge>
                      {suggestions.length > 0 && (
                        <Badge variant="secondary">
                          {suggestions.length} suggestion(s)
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Progress */}
                      <div>
                        <Progress value={score} className="h-2" />
                      </div>

                      {/* Positive Points */}
                      {detail?.positive && detail.positive.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Points positifs
                          </h4>
                          <ul className="space-y-1">
                            {detail.positive.map((point, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Issues */}
                      {detail?.issues && detail.issues.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Problèmes détectés
                          </h4>
                          <ul className="space-y-1">
                            {detail.issues.map((issue, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-1 shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {suggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Lightbulb className="h-4 w-4" />
                            Suggestions d'amélioration
                          </h4>
                          <div className="space-y-2">
                            {suggestions.map(suggestion => (
                              <div
                                key={suggestion.id}
                                className="p-3 rounded-lg border bg-muted/50"
                              >
                                <div className="flex items-start gap-2">
                                  {getSeverityIcon(suggestion.severity)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{suggestion.message}</p>
                                    {suggestion.suggestion && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        💡 {suggestion.suggestion}
                                      </p>
                                    )}
                                    {suggestion.auto_fixable && (
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        <Wand2 className="h-3 w-3 mr-1" />
                                        Auto-corrigeable
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* All Suggestions Summary */}
      {check.suggestions && check.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Toutes les suggestions ({check.suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {check.suggestions.map(suggestion => {
                  const criterionMeta = getCriterionMetadata(suggestion.criterion);
                  return (
                    <div
                      key={suggestion.id}
                      className="p-3 rounded-lg border"
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(suggestion.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: criterionMeta?.color,
                                color: criterionMeta?.color,
                              }}
                            >
                              {criterionMeta?.label || suggestion.criterion}
                            </Badge>
                            <Badge
                              variant={
                                suggestion.severity === 'critical' ? 'destructive' :
                                suggestion.severity === 'major' ? 'default' : 'secondary'
                              }
                            >
                              {suggestion.severity}
                            </Badge>
                          </div>
                          <p className="text-sm">{suggestion.message}</p>
                          {suggestion.suggestion && (
                            <p className="text-sm text-green-600 mt-1">
                              💡 {suggestion.suggestion}
                            </p>
                          )}
                        </div>
                        {suggestion.auto_fixable && (
                          <Button variant="outline" size="sm">
                            <Wand2 className="h-3 w-3 mr-1" />
                            Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default QualityCheckDetails;
