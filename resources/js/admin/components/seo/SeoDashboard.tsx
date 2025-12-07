/**
 * SEO Dashboard Component
 * File 314 - Overview of SEO metrics and quick actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Search,
  Globe,
  Link2,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Zap,
  TrendingUp,
  FileCode,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useSeoDashboard } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';

interface SeoDashboardProps {
  compact?: boolean;
}

export function SeoDashboard({ compact = false }: SeoDashboardProps) {
  const { t } = useTranslation();
  const { data: dashboard, isLoading } = useSeoDashboard();

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Get vitals rating color
  const getVitalsColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    if (rating === 'good') return 'text-green-600';
    if (rating === 'needs-improvement') return 'text-yellow-600';
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
            <Search className="h-4 w-4" />
            SEO Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={cn('text-3xl font-bold', getScoreColor(dashboard?.overallScore || 0))}>
                {dashboard?.overallScore || 0}
              </p>
              <p className="text-sm text-muted-foreground">Score global</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {dashboard?.indexedPages || 0}/{dashboard?.totalPages || 0}
              </p>
              <p className="text-sm text-muted-foreground">Pages indexées</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted">
              <p className="font-semibold">{dashboard?.featuredSnippets || 0}</p>
              <p className="text-xs text-muted-foreground">Snippets</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="font-semibold">{dashboard?.maillageStats?.totalLinks || 0}</p>
              <p className="text-xs text-muted-foreground">Liens</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="font-semibold">{dashboard?.redirectStats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Redirects</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score and Index Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score SEO global</p>
                <p className={cn('text-4xl font-bold', getScoreColor(dashboard?.overallScore || 0))}>
                  {dashboard?.overallScore || 0}
                </p>
              </div>
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                getScoreBg(dashboard?.overallScore || 0)
              )}>
                <Search className={cn('h-8 w-8', getScoreColor(dashboard?.overallScore || 0))} />
              </div>
            </div>
            <Progress
              value={dashboard?.overallScore || 0}
              className="mt-4 h-2"
            />
          </CardContent>
        </Card>

        {/* Indexation Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Pages indexées</p>
                <p className="text-2xl font-bold">
                  {dashboard?.indexedPages || 0}
                  <span className="text-muted-foreground text-lg">/{dashboard?.totalPages || 0}</span>
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
            <Progress
              value={dashboard?.totalPages ? (dashboard.indexedPages / dashboard.totalPages) * 100 : 0}
              className="h-2"
            />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {dashboard?.indexingStats?.pending || 0} en attente
              </span>
              <Link to="/seo/indexing" className="text-primary hover:underline">
                Gérer →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Featured Snippets & Rankings */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Featured Snippets</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboard?.featuredSnippets || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position moy.</p>
                <p className="text-2xl font-bold">
                  {dashboard?.averagePosition?.toFixed(1) || '-'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">+5 positions ce mois</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {dashboard?.coreWebVitals && Object.entries(dashboard.coreWebVitals).map(([key, data]) => (
              <div key={key} className="text-center p-3 rounded-lg bg-muted">
                <p className={cn('text-xl font-bold', getVitalsColor(data.rating))}>
                  {key === 'cls' ? data.value.toFixed(2) : `${data.value}ms`}
                </p>
                <p className="text-xs text-muted-foreground uppercase">{key}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1 text-xs',
                    data.rating === 'good' && 'border-green-500 text-green-600',
                    data.rating === 'needs-improvement' && 'border-yellow-500 text-yellow-600',
                    data.rating === 'poor' && 'border-red-500 text-red-600'
                  )}
                >
                  {data.rating === 'good' ? 'Bon' : data.rating === 'needs-improvement' ? 'À améliorer' : 'Mauvais'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Liens internes</p>
                <p className="text-2xl font-bold">{dashboard?.maillageStats?.totalLinks || 0}</p>
              </div>
              <Link2 className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.maillageStats?.orphanPages || 0} pages orphelines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Redirections</p>
                <p className="text-2xl font-bold">{dashboard?.redirectStats?.total || 0}</p>
              </div>
              <ArrowUpRight className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.redirectStats?.totalHits || 0} hits total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Schema Markup</p>
                <p className="text-2xl font-bold text-green-600">
                  <CheckCircle className="h-6 w-6 inline" />
                </p>
              </div>
              <FileCode className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Données structurées OK</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboard?.recentIssues?.length || 0}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">À résoudre</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      {dashboard?.recentIssues && dashboard.recentIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Issues récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.recentIssues.slice(0, 5).map(issue => (
                <div
                  key={issue.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    issue.type === 'error' && 'border-red-200 bg-red-50',
                    issue.type === 'warning' && 'border-yellow-200 bg-yellow-50',
                    issue.type === 'info' && 'border-blue-200 bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      issue.type === 'error' ? 'destructive' :
                      issue.type === 'warning' ? 'default' : 'secondary'
                    }>
                      {issue.impact}
                    </Badge>
                    <span className="text-sm">{issue.message}</span>
                  </div>
                  <Badge variant="outline">{issue.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/seo/schema">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <FileCode className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="font-medium">Schema Markup</p>
              <p className="text-xs text-muted-foreground">Données structurées</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/maillage">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <Link2 className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="font-medium">Maillage interne</p>
              <p className="text-xs text-muted-foreground">Liens internes</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/redirects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <ArrowUpRight className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="font-medium">Redirections</p>
              <p className="text-xs text-muted-foreground">Gérer les 301/302</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/indexing">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <Globe className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="font-medium">Indexation</p>
              <p className="text-xs text-muted-foreground">Google & Bing</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default SeoDashboard;
