/**
 * SEO Index Page
 * File 322 - Main SEO dashboard with quick actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Search,
  FileCode,
  Link2,
  ArrowUpRight,
  Globe,
  Zap,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSeoDashboard } from '@/hooks/useSeo';
import { useIndexingStats } from '@/hooks/useIndexing';
import { SeoDashboard } from '@/components/seo/SeoDashboard';
import { cn } from '@/lib/utils';

export default function SeoIndexPage() {
  const { t } = useTranslation();
  const { data: dashboard, isLoading } = useSeoDashboard();
  const { data: indexingStats } = useIndexingStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            SEO Technique
          </h1>
          <p className="text-muted-foreground">
            Optimisez le référencement de vos plateformes
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/settings/seo">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link to="/seo/schema">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-blue-200 hover:border-blue-400">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <FileCode className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium">Schema Markup</p>
              <p className="text-xs text-muted-foreground mt-1">Données structurées</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/maillage">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-purple-200 hover:border-purple-400">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Link2 className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium">Maillage interne</p>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard?.maillageStats?.totalLinks || 0} liens
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/redirects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-green-200 hover:border-green-400">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Redirections</p>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard?.redirectStats?.total || 0} règles
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/indexing">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-yellow-200 hover:border-yellow-400">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="font-medium">Indexation</p>
              {indexingStats?.notIndexedCount && indexingStats.notIndexedCount > 0 ? (
                <Badge variant="destructive" className="mt-1">
                  {indexingStats.notIndexedCount} non indexés
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Google & Bing</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link to="/seo/technical">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-cyan-200 hover:border-cyan-400">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-cyan-600" />
              </div>
              <p className="font-medium">Performance</p>
              <p className="text-xs text-muted-foreground mt-1">Core Web Vitals</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Dashboard */}
      <SeoDashboard />

      {/* Recent Issues */}
      {dashboard?.recentIssues && dashboard.recentIssues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Issues à résoudre
                <Badge variant="secondary">{dashboard.recentIssues.length}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/seo/technical">
                  Voir tout
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
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
                    <Badge
                      variant={
                        issue.type === 'error' ? 'destructive' :
                        issue.type === 'warning' ? 'default' : 'secondary'
                      }
                    >
                      {issue.impact}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{issue.message}</p>
                      <p className="text-xs text-muted-foreground">{issue.category}</p>
                    </div>
                  </div>
                  {issue.fixable && (
                    <Button variant="outline" size="sm">
                      Corriger
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score SEO</p>
                <p className={cn(
                  'text-2xl font-bold',
                  (dashboard?.overallScore || 0) >= 80 ? 'text-green-600' :
                  (dashboard?.overallScore || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {dashboard?.overallScore || 0}/100
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pages indexées</p>
                <p className="text-2xl font-bold">
                  {dashboard?.indexedPages || 0}
                  <span className="text-muted-foreground text-lg">
                    /{dashboard?.totalPages || 0}
                  </span>
                </p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Featured Snippets</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboard?.featuredSnippets || 0}
                </p>
              </div>
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Position moyenne</p>
                <p className="text-2xl font-bold">
                  {dashboard?.averagePosition?.toFixed(1) || '-'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
