import React, { useState } from 'react';
import { TrendingUp, Activity, Globe, Search, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

export default function PerformancePage() {
  const metrics = {
    averagePosition: 12.4,
    totalKeywords: 2543,
    organicTraffic: 45231,
    clickThroughRate: 3.2,
    indexedPages: 1876,
    coreWebVitals: { lcp: 2.1, fid: 85, cls: 0.08 }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Performance SEO
        </h1>
        <p className="text-muted-foreground">Métriques et performances de référencement</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Position moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averagePosition}</div>
            <p className="text-xs text-muted-foreground">+2.3 vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Mots-clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalKeywords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">total indexés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trafic organique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.organicTraffic.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">visites/mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="indexing">Indexation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CTR moyen</span>
                  <span className="text-sm text-muted-foreground">{metrics.clickThroughRate}%</span>
                </div>
                <Progress value={metrics.clickThroughRate * 10} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pages indexées</span>
                  <span className="text-sm text-muted-foreground">{metrics.indexedPages}</span>
                </div>
                <Progress value={(metrics.indexedPages / 2000) * 100} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">LCP (Largest Contentful Paint)</div>
                  <div className="text-sm text-muted-foreground">Temps de chargement du contenu principal</div>
                </div>
                <Badge variant={metrics.coreWebVitals.lcp <= 2.5 ? 'default' : 'destructive'}>
                  {metrics.coreWebVitals.lcp}s
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">FID (First Input Delay)</div>
                  <div className="text-sm text-muted-foreground">Délai de première interaction</div>
                </div>
                <Badge variant={metrics.coreWebVitals.fid <= 100 ? 'default' : 'destructive'}>
                  {metrics.coreWebVitals.fid}ms
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">CLS (Cumulative Layout Shift)</div>
                  <div className="text-sm text-muted-foreground">Stabilité visuelle</div>
                </div>
                <Badge variant={metrics.coreWebVitals.cls <= 0.1 ? 'default' : 'destructive'}>
                  {metrics.coreWebVitals.cls}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexing">
          <Card>
            <CardHeader>
              <CardTitle>État de l'indexation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span>Pages indexées</span>
                  <span className="font-medium">{metrics.indexedPages}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Taux d'indexation</span>
                  <span className="font-medium">93.8%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Erreurs d'exploration</span>
                  <span className="font-medium">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}