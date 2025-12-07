/**
 * Technical SEO Panel Component
 * File 316 - Core Web Vitals, mobile-first, and technical issues
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Smartphone,
  Monitor,
  FileCode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Bug,
  Shield,
  FileSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useTechnicalSeoData, useTechnicalIssues, useMarkIssueFixed } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';

interface TechnicalSeoPanelProps {
  compact?: boolean;
}

export function TechnicalSeoPanel({ compact = false }: TechnicalSeoPanelProps) {
  const { t } = useTranslation();
  const { data: technicalData, isLoading } = useTechnicalSeoData();
  const { data: issuesData } = useTechnicalIssues();
  const markFixed = useMarkIssueFixed();

  // Get rating color
  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    if (rating === 'good') return 'text-green-600';
    if (rating === 'needs-improvement') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBg = (rating: 'good' | 'needs-improvement' | 'poor') => {
    if (rating === 'good') return 'bg-green-100';
    if (rating === 'needs-improvement') return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Technical SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className={cn('text-2xl font-bold', getScoreColor(technicalData?.mobileScore || 0))}>
                {technicalData?.mobileScore || 0}
              </p>
              <p className="text-xs text-muted-foreground">Mobile</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', getScoreColor(technicalData?.desktopScore || 0))}>
                {technicalData?.desktopScore || 0}
              </p>
              <p className="text-xs text-muted-foreground">Desktop</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {issuesData?.data?.filter(i => !i.fixed).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>
            Métriques de performance essentielles pour le SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {technicalData?.coreWebVitals && Object.entries(technicalData.coreWebVitals).map(([key, data]) => (
              <div
                key={key}
                className={cn('text-center p-4 rounded-lg', getRatingBg(data.rating))}
              >
                <p className={cn('text-2xl font-bold', getRatingColor(data.rating))}>
                  {key === 'cls' ? data.value.toFixed(3) : `${data.value}`}
                </p>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  {key === 'lcp' && 'LCP (s)'}
                  {key === 'fid' && 'FID (ms)'}
                  {key === 'cls' && 'CLS'}
                  {key === 'ttfb' && 'TTFB (ms)'}
                  {key === 'fcp' && 'FCP (s)'}
                </p>
                <p className={cn('text-xs mt-1', getRatingColor(data.rating))}>
                  {data.rating === 'good' ? 'Bon' : data.rating === 'needs-improvement' ? 'À améliorer' : 'Mauvais'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span> Bon
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mx-1 ml-4"></span> À améliorer
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mx-1 ml-4"></span> Mauvais
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobile Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Score Mobile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                technicalData?.mobileScore && technicalData.mobileScore >= 90 ? 'bg-green-100' :
                technicalData?.mobileScore && technicalData.mobileScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              )}>
                <span className={cn(
                  'text-3xl font-bold',
                  getScoreColor(technicalData?.mobileScore || 0)
                )}>
                  {technicalData?.mobileScore || 0}
                </span>
              </div>
              <div className="flex-1 ml-6">
                <Progress value={technicalData?.mobileScore || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {technicalData?.mobileScore && technicalData.mobileScore >= 90 ? 'Excellent' :
                   technicalData?.mobileScore && technicalData.mobileScore >= 50 ? 'À améliorer' : 'Problématique'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Score Desktop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                technicalData?.desktopScore && technicalData.desktopScore >= 90 ? 'bg-green-100' :
                technicalData?.desktopScore && technicalData.desktopScore >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              )}>
                <span className={cn(
                  'text-3xl font-bold',
                  getScoreColor(technicalData?.desktopScore || 0)
                )}>
                  {technicalData?.desktopScore || 0}
                </span>
              </div>
              <div className="flex-1 ml-6">
                <Progress value={technicalData?.desktopScore || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {technicalData?.desktopScore && technicalData.desktopScore >= 90 ? 'Excellent' :
                   technicalData?.desktopScore && technicalData.desktopScore >= 50 ? 'À améliorer' : 'Problématique'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vérifications techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {technicalData?.structuredDataValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-sm">Données structurées</p>
                <p className="text-xs text-muted-foreground">
                  {technicalData?.structuredDataErrors || 0} erreurs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {technicalData?.sitemapStatus === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : technicalData?.sitemapStatus === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-sm">Sitemap</p>
                <p className="text-xs text-muted-foreground">{technicalData?.sitemapStatus}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {technicalData?.robotsTxtStatus === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : technicalData?.robotsTxtStatus === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-sm">Robots.txt</p>
                <p className="text-xs text-muted-foreground">{technicalData?.robotsTxtStatus}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              {technicalData?.httpsStatus ? (
                <Shield className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-sm">HTTPS</p>
                <p className="text-xs text-muted-foreground">
                  {technicalData?.httpsStatus ? 'Activé' : 'Non activé'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crawl Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Issues détectées
            {issuesData?.data && (
              <Badge variant="secondary">
                {issuesData.data.filter(i => !i.fixed).length} actives
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {issuesData?.data?.filter(i => !i.fixed).map(issue => (
                <div
                  key={issue.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    issue.severity === 'critical' && 'border-red-200 bg-red-50',
                    issue.severity === 'major' && 'border-yellow-200 bg-yellow-50',
                    issue.severity === 'minor' && 'border-blue-200 bg-blue-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Badge variant={
                      issue.severity === 'critical' ? 'destructive' :
                      issue.severity === 'major' ? 'default' : 'secondary'
                    }>
                      {issue.severity}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{issue.message}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {issue.url}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markFixed.mutate(issue.id)}
                    disabled={markFixed.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!issuesData?.data || issuesData.data.filter(i => !i.fixed).length === 0) && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune issue détectée</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base text-blue-800">Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {technicalData?.mobileScore && technicalData.mobileScore < 90 && (
              <li className="flex items-start gap-2 text-sm text-blue-800">
                <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
                Optimisez les images et réduisez le JavaScript pour améliorer le score mobile
              </li>
            )}
            {technicalData?.canonicalIssues && technicalData.canonicalIssues > 0 && (
              <li className="flex items-start gap-2 text-sm text-blue-800">
                <FileSearch className="h-4 w-4 mt-0.5 shrink-0" />
                {technicalData.canonicalIssues} pages ont des problèmes de balise canonical
              </li>
            )}
            {technicalData?.coreWebVitals?.lcp?.rating !== 'good' && (
              <li className="flex items-start gap-2 text-sm text-blue-800">
                <Zap className="h-4 w-4 mt-0.5 shrink-0" />
                Améliorez le LCP en optimisant le chargement des images principales
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default TechnicalSeoPanel;
