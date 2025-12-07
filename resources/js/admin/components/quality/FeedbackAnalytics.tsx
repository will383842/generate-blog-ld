/**
 * Feedback Analytics Component
 * File 274 - Display feedback sentiment, patterns, and recommendations
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Check,
  X,
  RefreshCw,
  Loader2,
  BarChart3,
  Cloud,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  useFeedbackDashboard,
  useApplyRecommendation,
  useDismissRecommendation,
  useRefreshFeedbackAnalysis,
} from '@/hooks/useFeedback';
import {
  FeedbackData,
  FeedbackPattern,
  FeedbackRecommendation,
  getSentimentColor,
} from '@/types/quality';
import { cn } from '@/lib/utils';

interface FeedbackAnalyticsProps {
  platformId: number;
  compact?: boolean;
}

export function FeedbackAnalytics({ platformId, compact = false }: FeedbackAnalyticsProps) {
  const { t } = useTranslation();

  // API hooks
  const { data, isLoading, refetch } = useFeedbackDashboard(platformId);
  const applyRecommendation = useApplyRecommendation();
  const dismissRecommendation = useDismissRecommendation();
  const refreshAnalysis = useRefreshFeedbackAnalysis();

  // Handle apply recommendation
  const handleApply = (id: string) => {
    applyRecommendation.mutate(id);
  };

  // Handle dismiss recommendation
  const handleDismiss = (id: string) => {
    dismissRecommendation.mutate(id);
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshAnalysis.mutate(platformId);
  };

  // Get trend icon
  const getTrendIcon = (trend: FeedbackPattern['trend']) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  // Priority color
  const getPriorityColor = (priority: FeedbackRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 border-red-600';
      case 'medium':
        return 'text-yellow-600 border-yellow-600';
      default:
        return 'text-blue-600 border-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune donnée de feedback disponible</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sentiment distribution */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">{data.sentiment_distribution.positive}%</span>
            </div>
            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden flex">
              <div
                className="bg-green-500"
                style={{ width: `${data.sentiment_distribution.positive}%` }}
              />
              <div
                className="bg-gray-400"
                style={{ width: `${data.sentiment_distribution.neutral}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${data.sentiment_distribution.negative}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              <span className="font-medium">{data.sentiment_distribution.negative}%</span>
            </div>
          </div>

          {/* Top patterns */}
          <div className="space-y-2">
            {data.patterns.slice(0, 3).map(pattern => (
              <div
                key={pattern.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate">{pattern.pattern}</span>
                <Badge
                  variant="outline"
                  style={{ color: getSentimentColor(pattern.sentiment) }}
                >
                  {pattern.frequency}
                </Badge>
              </div>
            ))}
          </div>

          {/* Pending recommendations */}
          {data.recommendations.filter(r => r.status === 'pending').length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant="secondary">
                {data.recommendations.filter(r => r.status === 'pending').length} recommandation(s)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analyse du feedback</h2>
          <p className="text-sm text-muted-foreground">
            Sentiment et patterns détectés dans les retours utilisateurs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshAnalysis.isPending}
        >
          {refreshAnalysis.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualiser l'analyse
        </Button>
      </div>

      {/* Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution du sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            {/* Pie chart visualization (simplified) */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Positive */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray={`${data.sentiment_distribution.positive * 2.51} 251`}
                />
                {/* Neutral */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#6B7280"
                  strokeWidth="20"
                  strokeDasharray={`${data.sentiment_distribution.neutral * 2.51} 251`}
                  strokeDashoffset={`-${data.sentiment_distribution.positive * 2.51}`}
                />
                {/* Negative */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="20"
                  strokeDasharray={`${data.sentiment_distribution.negative * 2.51} 251`}
                  strokeDashoffset={`-${(data.sentiment_distribution.positive + data.sentiment_distribution.neutral) * 2.51}`}
                />
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Positif</span>
                </div>
                <span className="font-bold text-green-600">
                  {data.sentiment_distribution.positive}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span>Neutre</span>
                </div>
                <span className="font-bold text-gray-600">
                  {data.sentiment_distribution.neutral}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Négatif</span>
                </div>
                <span className="font-bold text-red-600">
                  {data.sentiment_distribution.negative}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="patterns">
        <TabsList>
          <TabsTrigger value="patterns">
            <BarChart3 className="h-4 w-4 mr-2" />
            Patterns ({data.patterns.length})
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Cloud className="h-4 w-4 mr-2" />
            Mots-clés ({data.keywords.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            Recommandations ({data.recommendations.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patterns détectés</CardTitle>
              <CardDescription>
                Thèmes récurrents identifiés dans les feedbacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.patterns.map(pattern => (
                  <div
                    key={pattern.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{pattern.pattern}</span>
                          {getTrendIcon(pattern.trend)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getSentimentColor(pattern.sentiment),
                              color: getSentimentColor(pattern.sentiment),
                            }}
                          >
                            {pattern.sentiment}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {pattern.frequency} occurrences
                          </span>
                        </div>
                      </div>
                    </div>
                    {pattern.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Exemples :</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {pattern.examples.slice(0, 2).map((ex, idx) => (
                            <li key={idx} className="truncate">"{ex}"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuage de mots-clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map(keyword => (
                  <TooltipProvider key={keyword.word}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="cursor-help"
                          style={{
                            fontSize: `${Math.min(14 + keyword.count / 5, 24)}px`,
                            borderColor: getSentimentColor(keyword.sentiment),
                            color: getSentimentColor(keyword.sentiment),
                          }}
                        >
                          {keyword.word}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{keyword.count} occurrences</p>
                        <p className="text-xs text-muted-foreground">{keyword.sentiment}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommandations</CardTitle>
              <CardDescription>
                Actions suggérées basées sur l'analyse du feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recommendations
                  .filter(r => r.status === 'pending')
                  .map(recommendation => (
                    <div
                      key={recommendation.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{recommendation.title}</span>
                            <Badge
                              variant="outline"
                              className={getPriorityColor(recommendation.priority)}
                            >
                              {recommendation.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {recommendation.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{recommendation.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Impact: {recommendation.impact}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismiss(recommendation.id)}
                            disabled={dismissRecommendation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApply(recommendation.id)}
                            disabled={applyRecommendation.isPending}
                          >
                            {applyRecommendation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Appliquer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {data.recommendations.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-8">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Toutes les recommandations ont été traitées
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FeedbackAnalytics;
