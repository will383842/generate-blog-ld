/**
 * Feedback Analytics Page
 * File 282 - Full page for feedback analysis and recommendations
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Check,
  X,
  Loader2,
  BarChart3,
  Calendar,
  FileText,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useFeedbackDashboard,
  useFeedbackPatterns,
  useRecommendations,
  useWeeklyReport,
  useApplyRecommendation,
  useDismissRecommendation,
  useRefreshFeedbackAnalysis,
} from '@/hooks/useFeedback';
import { FeedbackAnalytics } from '@/components/quality/FeedbackAnalytics';
import { getSentimentColor } from '@/types/quality';

export default function FeedbackPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();

  // API hooks
  const { data, isLoading, refetch } = useFeedbackDashboard(platformId);
  const { data: patterns } = useFeedbackPatterns(platformId);
  const { data: recommendations } = useRecommendations(platformId);
  const { data: weeklyReport } = useWeeklyReport(platformId, selectedWeek);
  const applyRecommendation = useApplyRecommendation();
  const dismissRecommendation = useDismissRecommendation();
  const refreshAnalysis = useRefreshFeedbackAnalysis();

  // Handle refresh
  const handleRefresh = () => {
    refreshAnalysis.mutate(platformId);
  };

  // Handle apply recommendation
  const handleApply = (id: string) => {
    applyRecommendation.mutate(id);
  };

  // Handle dismiss recommendation
  const handleDismiss = (id: string) => {
    dismissRecommendation.mutate(id);
  };

  // Get trend icon
  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Priority color
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 border-red-600';
      case 'medium':
        return 'text-yellow-600 border-yellow-600';
      default:
        return 'text-blue-600 border-blue-600';
    }
  };

  const pendingRecommendations = recommendations?.filter(r => r.status === 'pending') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/quality">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Analyse du Feedback
            </h1>
            <p className="text-muted-foreground">
              Sentiment, patterns et recommandations basées sur les retours
            </p>
          </div>
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
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-4">Distribution du sentiment</h3>
              <div className="flex items-center gap-6">
                {/* Mini pie chart */}
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="20"
                      strokeDasharray={`${data.sentiment_distribution.positive * 2.51} 251`}
                    />
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Positif</span>
                    <span className="font-bold text-green-600 ml-auto">
                      {data.sentiment_distribution.positive}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-sm">Neutre</span>
                    <span className="font-bold text-gray-600 ml-auto">
                      {data.sentiment_distribution.neutral}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Négatif</span>
                    <span className="font-bold text-red-600 ml-auto">
                      {data.sentiment_distribution.negative}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Patterns détectés</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{patterns?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Thèmes récurrents identifiés
              </p>
            </CardContent>
          </Card>

          <Card className={pendingRecommendations.length > 0 ? 'border-yellow-200' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recommandations</span>
                <Lightbulb className={`h-4 w-4 ${pendingRecommendations.length > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-3xl font-bold">{pendingRecommendations.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Actions suggérées
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="patterns">
        <TabsList>
          <TabsTrigger value="patterns">
            <BarChart3 className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Cloud className="h-4 w-4 mr-2" />
            Mots-clés
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            Recommandations ({pendingRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <Calendar className="h-4 w-4 mr-2" />
            Rapport hebdo
          </TabsTrigger>
        </TabsList>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patterns détectés</CardTitle>
              <CardDescription>
                Thèmes récurrents identifiés dans les feedbacks utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns && patterns.length > 0 ? (
                <div className="space-y-4">
                  {patterns.map(pattern => (
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
                            <span className="text-xs text-muted-foreground">
                              • Premier: {new Date(pattern.first_seen).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {pattern.examples.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Exemples:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {pattern.examples.slice(0, 3).map((ex, idx) => (
                              <li key={idx} className="truncate italic">"{ex}"</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun pattern détecté</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les patterns apparaîtront après analyse du feedback
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuage de mots-clés</CardTitle>
              <CardDescription>
                Termes les plus fréquents dans les feedbacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.keywords && data.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    {data.keywords.map(keyword => (
                      <Tooltip key={keyword.word}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="cursor-help"
                            style={{
                              fontSize: `${Math.min(12 + keyword.count / 3, 20)}px`,
                              borderColor: getSentimentColor(keyword.sentiment),
                              color: getSentimentColor(keyword.sentiment),
                            }}
                          >
                            {keyword.word}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{keyword.word}</p>
                          <p className="text-sm">{keyword.count} occurrences</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {keyword.sentiment}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun mot-clé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommandations</CardTitle>
              <CardDescription>
                Actions suggérées basées sur l'analyse du feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {pendingRecommendations.map(recommendation => (
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
                              {recommendation.priority === 'high' ? 'Haute' :
                               recommendation.priority === 'medium' ? 'Moyenne' : 'Basse'}
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
                </div>
              ) : (
                <div className="text-center py-12">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Toutes les recommandations ont été traitées
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Report Tab */}
        <TabsContent value="weekly" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Rapport hebdomadaire</CardTitle>
                  <CardDescription>
                    Synthèse du feedback de la semaine
                  </CardDescription>
                </div>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Cette semaine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Cette semaine</SelectItem>
                    <SelectItem value="last">Semaine dernière</SelectItem>
                    <SelectItem value="2-weeks">Il y a 2 semaines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyReport || data?.weekly_report ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {(weeklyReport || data?.weekly_report)?.total_feedback || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Feedbacks reçus</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color: getSentimentColor(
                            (weeklyReport || data?.weekly_report)?.sentiment_score > 0.3 ? 'positive' :
                            (weeklyReport || data?.weekly_report)?.sentiment_score < -0.3 ? 'negative' : 'neutral'
                          ),
                        }}
                      >
                        {((weeklyReport || data?.weekly_report)?.sentiment_score * 100 || 0).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Score sentiment</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {(weeklyReport || data?.weekly_report)?.top_patterns?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Patterns identifiés</p>
                    </div>
                  </div>

                  {/* Improvements */}
                  {(weeklyReport || data?.weekly_report)?.improvements?.length > 0 && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        Points positifs
                      </h4>
                      <ul className="space-y-1">
                        {(weeklyReport || data?.weekly_report)?.improvements?.map((item, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns */}
                  {(weeklyReport || data?.weekly_report)?.concerns?.length > 0 && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2 text-red-600">
                        <ThumbsDown className="h-4 w-4" />
                        Points d'attention
                      </h4>
                      <ul className="space-y-1">
                        {(weeklyReport || data?.weekly_report)?.concerns?.map((item, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <X className="h-4 w-4 text-red-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun rapport disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
