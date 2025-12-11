/**
 * Redirects Page
 * File 326 - Full redirect management with import/export and analytics
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowLeft,
  Upload,
  Download,
  RefreshCw,
  BarChart3,
  Play,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useRedirects, useRedirectStats, useImportRedirects } from '@/hooks/useSeo';
import { RedirectsManager } from '@/components/seo/RedirectsManager';
import { cn } from '@/lib/utils';

export default function RedirectsPage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('manager');

  // API hooks
  const { data: redirectsData, refetch } = useRedirects();
  const { data: stats } = useRedirectStats();
  const importRedirects = useImportRedirects();

  // Handle import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importRedirects.mutate(file);
    }
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      'from,to,type,hits,is_active,created_at',
      ...(redirectsData?.data?.map(r =>
        `${r.from},${r.to},${r.type},${r.hits},${r.isActive},${r.createdAt}`
      ) || []),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redirects-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Mock analytics data
  const analyticsData = {
    topRedirects: [
      { from: '/old-page', to: '/new-page', hits: 1245 },
      { from: '/legacy-url', to: '/updated-url', hits: 892 },
      { from: '/article-2020', to: '/article-updated', hits: 567 },
    ],
    hitsOverTime: [
      { date: '2024-01-01', hits: 120 },
      { date: '2024-01-02', hits: 145 },
      { date: '2024-01-03', hits: 98 },
      { date: '2024-01-04', hits: 178 },
      { date: '2024-01-05', hits: 156 },
      { date: '2024-01-06', hits: 132 },
      { date: '2024-01-07', hits: 189 },
    ],
    byType: {
      '301': 85,
      '302': 12,
      '307': 2,
      '308': 1,
    },
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
              <ArrowUpRight className="h-6 w-6" />
              Redirections
            </h1>
            <p className="text-muted-foreground">
              Gérez les redirections URL pour le SEO
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total hits</p>
            <p className="text-2xl font-bold">{stats?.totalHits?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Hits récents (7j)</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.recentHits || 0}</p>
          </CardContent>
        </Card>
        <Card className={stats?.brokenCount && stats.brokenCount > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cassées</p>
            <p className={cn(
              'text-2xl font-bold',
              stats?.brokenCount && stats.brokenCount > 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {stats?.brokenCount || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manager">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Gérer
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="test">
            <Play className="h-4 w-4 mr-2" />
            Tester
          </TabsTrigger>
        </TabsList>

        {/* Manager Tab */}
        <TabsContent value="manager" className="mt-6">
          <RedirectsManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Redirects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top redirections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topRedirects.map((redirect, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <code className="text-sm">{redirect.from}</code>
                        <span className="text-muted-foreground mx-2">→</span>
                        <code className="text-sm">{redirect.to}</code>
                      </div>
                      <Badge variant="secondary">{(redirect.hits ?? 0).toLocaleString()} hits</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.byType).map(([type, percent]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{type}</span>
                        <span className="text-sm text-muted-foreground">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hits Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Hits sur 7 jours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end justify-between gap-2">
                  {analyticsData.hitsOverTime.map((day, idx) => {
                    const maxHits = Math.max(...analyticsData.hitsOverTime.map(d => d.hits));
                    const height = (day.hits / maxHits) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tester une URL</CardTitle>
                <CardDescription>
                  Vérifiez si une URL est redirigée et vers où
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="/url-a-tester"
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Tester
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détecter les chaînes</CardTitle>
                <CardDescription>
                  Trouvez les redirections en chaîne à optimiser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Analyser les chaînes
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Les chaînes de redirections impactent négativement le SEO
                </p>
              </CardContent>
            </Card>

            {/* Import Format */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Format d'import CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`from,to,type
/old-page,/new-page,301
/legacy-url,/updated-url,301
/temp-redirect,/destination,302`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Colonnes requises : from, to, type (301/302/307/308)
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
