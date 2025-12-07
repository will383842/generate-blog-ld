/**
 * Technical SEO Page
 * File 324 - Core Web Vitals, crawl issues, and technical recommendations
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useTechnicalSeoData, useTechnicalIssues, useMarkIssueFixed } from '@/hooks/useSeo';
import { TechnicalSeoPanel } from '@/components/seo/TechnicalSeoPanel';
import { cn } from '@/lib/utils';

export default function TechnicalPage() {
  const { t } = useTranslation();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [issueFilter, setIssueFilter] = useState<string>('all');

  // API hooks
  const { data: technicalData, isLoading, refetch } = useTechnicalSeoData();
  const { data: issuesData } = useTechnicalIssues();
  const markFixed = useMarkIssueFixed();

  // Filter issues
  const filteredIssues = issuesData?.data?.filter(issue => {
    if (issueFilter === 'all') return !issue.fixed;
    if (issueFilter === 'fixed') return issue.fixed;
    return issue.severity === issueFilter && !issue.fixed;
  });

  // Export report
  const exportReport = () => {
    const report = {
      date: new Date().toISOString(),
      coreWebVitals: technicalData?.coreWebVitals,
      scores: {
        mobile: technicalData?.mobileScore,
        desktop: technicalData?.desktopScore,
      },
      issues: issuesData?.data,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-technical-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <Zap className="h-6 w-6" />
              SEO Technique
            </h1>
            <p className="text-muted-foreground">
              Performance et santé technique de vos sites
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Zap className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="issues">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Issues ({filteredIssues?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommandations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <TechnicalSeoPanel />
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Issues techniques</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={issueFilter} onValueChange={setIssueFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes (actives)</SelectItem>
                      <SelectItem value="critical">Critiques</SelectItem>
                      <SelectItem value="major">Majeures</SelectItem>
                      <SelectItem value="minor">Mineures</SelectItem>
                      <SelectItem value="fixed">Résolues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredIssues?.map(issue => (
                    <div
                      key={issue.id}
                      className={cn(
                        'p-4 rounded-lg border',
                        issue.fixed && 'opacity-50',
                        !issue.fixed && issue.severity === 'critical' && 'border-red-200 bg-red-50',
                        !issue.fixed && issue.severity === 'major' && 'border-yellow-200 bg-yellow-50',
                        !issue.fixed && issue.severity === 'minor' && 'border-blue-200 bg-blue-50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              issue.severity === 'critical' ? 'destructive' :
                              issue.severity === 'major' ? 'default' : 'secondary'
                            }>
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline">{issue.type}</Badge>
                            {issue.fixed && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Résolu
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{issue.message}</p>
                          <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            {issue.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-xs text-muted-foreground mt-2">
                            Détecté le {new Date(issue.detectedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {!issue.fixed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markFixed.mutate(issue.id)}
                            disabled={markFixed.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Résolu
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!filteredIssues || filteredIssues.length === 0) && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune issue trouvée</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            {/* Priority Recommendations */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-800">Priorité haute</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {technicalData?.coreWebVitals?.lcp?.rating !== 'good' && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Améliorer le LCP</p>
                        <p className="text-sm text-red-700">
                          Le Largest Contentful Paint est trop lent ({technicalData?.coreWebVitals?.lcp?.value}ms).
                          Optimisez les images et le chargement des ressources critiques.
                        </p>
                      </div>
                    </div>
                  )}
                  {technicalData?.mobileScore && technicalData.mobileScore < 50 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Score mobile critique</p>
                        <p className="text-sm text-red-700">
                          Le score mobile est de {technicalData.mobileScore}/100.
                          Priorisez l'optimisation mobile-first.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medium Priority */}
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-base text-yellow-800">Priorité moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {technicalData?.coreWebVitals?.cls?.rating !== 'good' && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Réduire le CLS</p>
                        <p className="text-sm text-yellow-700">
                          Le Cumulative Layout Shift est de {technicalData?.coreWebVitals?.cls?.value}.
                          Définissez des dimensions fixes pour les images et publicités.
                        </p>
                      </div>
                    </div>
                  )}
                  {technicalData?.canonicalIssues && technicalData.canonicalIssues > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Corriger les canonicals</p>
                        <p className="text-sm text-yellow-700">
                          {technicalData.canonicalIssues} pages ont des problèmes de balise canonical.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Low Priority */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-base text-blue-800">Optimisations suggérées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Implémenter le lazy loading</p>
                      <p className="text-sm text-blue-700">
                        Ajoutez loading="lazy" aux images sous la ligne de flottaison.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Optimiser les polices</p>
                      <p className="text-sm text-blue-700">
                        Utilisez font-display: swap et préchargez les polices critiques.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Activer la compression Brotli</p>
                      <p className="text-sm text-blue-700">
                        Brotli offre une meilleure compression que Gzip pour les ressources textuelles.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outils de test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => window.open('https://pagespeed.web.dev/', '_blank')}
                  >
                    <Zap className="h-6 w-6 mb-2" />
                    PageSpeed Insights
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => window.open('https://search.google.com/test/mobile-friendly', '_blank')}
                  >
                    <CheckCircle className="h-6 w-6 mb-2" />
                    Mobile-Friendly Test
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
                  >
                    <CheckCircle className="h-6 w-6 mb-2" />
                    Rich Results Test
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col"
                    onClick={() => window.open('https://validator.w3.org/', '_blank')}
                  >
                    <CheckCircle className="h-6 w-6 mb-2" />
                    W3C Validator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
