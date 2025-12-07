/**
 * Maillage Page
 * File 325 - Internal linking management with graph visualization
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Link2,
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Network,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useMaillageStats, useLinkOpportunities } from '@/hooks/useSeo';
import { MaillageManager } from '@/components/seo/MaillageManager';
import { cn } from '@/lib/utils';

export default function MaillagePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('links');

  // API hooks
  const { data: stats, isLoading, refetch } = useMaillageStats();
  const { data: opportunities } = useLinkOpportunities();

  // Export data
  const exportData = () => {
    const data = {
      stats,
      opportunities,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maillage-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/seo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="h-6 w-6" />
              Maillage interne
            </h1>
            <p className="text-muted-foreground">
              Optimisez la structure de liens internes de vos sites
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total liens</p>
                <p className="text-2xl font-bold">{stats?.totalLinks || 0}</p>
              </div>
              <Link2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moy. par page</p>
                <p className="text-2xl font-bold">{stats?.averageLinksPerPage?.toFixed(1) || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Recommandé : 3-5 liens/page
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.orphanPages && stats.orphanPages > 0 ? 'border-yellow-200' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pages orphelines</p>
                <p className={cn(
                  'text-2xl font-bold',
                  stats?.orphanPages && stats.orphanPages > 0 ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {stats?.orphanPages || 0}
                </p>
              </div>
              <AlertTriangle className={cn(
                'h-8 w-8',
                stats?.orphanPages && stats.orphanPages > 0 ? 'text-yellow-500' : 'text-green-500'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opportunités</p>
                <p className="text-2xl font-bold text-green-600">{opportunities?.length || 0}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link Distribution */}
      {stats?.linkDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribution des liens par page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.linkDistribution.map(item => (
                <div key={item.range}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{item.range} liens</span>
                    <span className="text-sm font-medium">{item.count} pages</span>
                  </div>
                  <Progress
                    value={(item.count / stats.totalLinks) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="links">
            <Link2 className="h-4 w-4 mr-2" />
            Liens
          </TabsTrigger>
          <TabsTrigger value="graph">
            <Network className="h-4 w-4 mr-2" />
            Graphe
          </TabsTrigger>
          <TabsTrigger value="opportunities">
            <Lightbulb className="h-4 w-4 mr-2" />
            Opportunités ({opportunities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="links" className="mt-6">
          <MaillageManager />
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visualisation du graphe de liens</CardTitle>
              <CardDescription>
                Vue interactive de la structure de liens internes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Graphe interactif D3.js</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Visualisation des connexions entre pages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-500" />
                Opportunités de liens détectées
              </CardTitle>
              <CardDescription>
                Suggestions basées sur l'analyse sémantique du contenu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities && opportunities.length > 0 ? (
                <div className="space-y-3">
                  {opportunities.map(opp => (
                    <div
                      key={opp.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-white">
                            Score: {opp.relevanceScore}%
                          </Badge>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">{opp.fromArticleTitle}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="font-medium">{opp.toArticleTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ancre suggérée : "{opp.suggestedAnchor}"
                        </p>
                        <p className="text-xs text-green-700 mt-1">{opp.reason}</p>
                      </div>
                      <Button variant="outline" className="bg-white">
                        Ajouter le lien
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune opportunité détectée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Linked Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pages les plus liées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topLinkedPages?.map((page, idx) => (
                    <div
                      key={page.articleId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          idx === 0 && 'bg-yellow-500 text-white',
                          idx === 1 && 'bg-gray-400 text-white',
                          idx === 2 && 'bg-amber-600 text-white',
                          idx > 2 && 'bg-muted-foreground/20'
                        )}>
                          {idx + 1}
                        </span>
                        <span className="font-medium truncate max-w-[200px]">{page.title}</span>
                      </div>
                      <Badge>{page.incomingLinks} liens</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.orphanPages && stats.orphanPages > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Pages orphelines</p>
                        <p className="text-sm text-yellow-700">
                          {stats.orphanPages} pages n'ont aucun lien entrant.
                          Ajoutez des liens vers ces pages.
                        </p>
                      </div>
                    </div>
                  )}
                  {stats?.averageLinksPerPage && stats.averageLinksPerPage < 3 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Augmentez le maillage</p>
                        <p className="text-sm text-blue-700">
                          La moyenne de liens par page ({stats.averageLinksPerPage.toFixed(1)}) est faible.
                          Visez 3-5 liens par page.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Utilisez les opportunités</p>
                      <p className="text-sm text-green-700">
                        {opportunities?.length || 0} opportunités de liens détectées automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
