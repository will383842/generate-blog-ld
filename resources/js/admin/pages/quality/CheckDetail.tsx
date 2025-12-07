/**
 * Quality Check Detail Page
 * File 278 - Detailed view of a single quality check
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Star,
  History,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  useQualityCheck,
  useQualityChecksByArticle,
  useRevalidate,
} from '@/hooks/useQuality';
import { useMarkAsGolden } from '@/hooks/useGoldenExamples';
import { QualityCheckDetails } from '@/components/quality/QualityCheckDetails';
import { QualityCheckCard } from '@/components/quality/QualityCheckCard';
import {
  getScoreColor,
  getQualityStatusColor,
  getQualityStatusLabel,
} from '@/types/quality';

export default function QualityCheckDetailPage() {
  const { t } = useTranslation();
  const { checkId } = useParams<{ checkId: string }>();
  const navigate = useNavigate();

  const id = Number(checkId);

  // API hooks
  const { data: check, isLoading, refetch } = useQualityCheck(id);
  const { data: articleHistory } = useQualityChecksByArticle(check?.article_id || 0);
  const revalidate = useRevalidate();
  const markAsGolden = useMarkAsGolden();

  // Handle revalidate
  const handleRevalidate = () => {
    if (check) {
      revalidate.mutate(check.article_id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  // Handle mark as golden
  const handleMarkAsGolden = () => {
    if (check) {
      markAsGolden.mutate({
        article_id: check.article_id,
        category: 'default',
        example_type: 'positive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!check) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vérification non trouvée</h2>
        <p className="text-muted-foreground mb-4">
          Cette vérification n'existe pas ou a été supprimée.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{check.article_title}</h1>
          <div className="flex items-center gap-2 mt-1">
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
              ID: {check.id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {check.overall_score >= 80 && (
            <Button
              variant="outline"
              onClick={handleMarkAsGolden}
              disabled={markAsGolden.isPending}
            >
              {markAsGolden.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              Marquer comme exemple
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={`/content/${check.content_type}/${check.article_id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir l'article
            </Link>
          </Button>
          <Button
            onClick={handleRevalidate}
            disabled={revalidate.isPending}
          >
            {revalidate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Revalider
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historique ({articleHistory?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <QualityCheckDetails
            check={check}
            onRevalidate={handleRevalidate}
            isRevalidating={revalidate.isPending}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des vérifications</CardTitle>
              <CardDescription>
                Toutes les vérifications effectuées sur cet article
              </CardDescription>
            </CardHeader>
            <CardContent>
              {articleHistory && articleHistory.length > 0 ? (
                <div className="space-y-4">
                  {articleHistory.map((historyCheck, index) => (
                    <div
                      key={historyCheck.id}
                      className={`p-4 rounded-lg border ${
                        historyCheck.id === check.id
                          ? 'border-primary bg-primary/5'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Timeline dot */}
                          <div className="relative">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                historyCheck.id === check.id
                                  ? 'bg-primary'
                                  : 'bg-muted-foreground'
                              }`}
                            />
                            {index < articleHistory.length - 1 && (
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-8 bg-muted" />
                            )}
                          </div>

                          {/* Content */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="font-bold text-lg"
                                style={{ color: getScoreColor(historyCheck.overall_score) }}
                              >
                                {historyCheck.overall_score}
                              </span>
                              <Badge
                                style={{
                                  backgroundColor: getQualityStatusColor(historyCheck.status),
                                  color: 'white',
                                }}
                              >
                                {getQualityStatusLabel(historyCheck.status)}
                              </Badge>
                              {historyCheck.id === check.id && (
                                <Badge variant="outline">Actuel</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(historyCheck.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Score comparison */}
                        {index > 0 && (
                          <div className="text-sm">
                            {historyCheck.overall_score > articleHistory[index - 1].overall_score ? (
                              <span className="text-green-600">
                                +{historyCheck.overall_score - articleHistory[index - 1].overall_score} pts
                              </span>
                            ) : historyCheck.overall_score < articleHistory[index - 1].overall_score ? (
                              <span className="text-red-600">
                                {historyCheck.overall_score - articleHistory[index - 1].overall_score} pts
                              </span>
                            ) : (
                              <span className="text-muted-foreground">=</span>
                            )}
                          </div>
                        )}

                        {/* View button */}
                        {historyCheck.id !== check.id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/quality/checks/${historyCheck.id}`}>
                              Voir
                            </Link>
                          </Button>
                        )}
                      </div>

                      {/* Mini breakdown */}
                      <div className="mt-3 pt-3 border-t flex gap-4">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Lisibilité:</span>
                          <span style={{ color: getScoreColor(historyCheck.readability_score) }}>
                            {historyCheck.readability_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">SEO:</span>
                          <span style={{ color: getScoreColor(historyCheck.seo_score) }}>
                            {historyCheck.seo_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Marque:</span>
                          <span style={{ color: getScoreColor(historyCheck.brand_score) }}>
                            {historyCheck.brand_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Suggestions:</span>
                          <span>{historyCheck.suggestions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucun historique disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
