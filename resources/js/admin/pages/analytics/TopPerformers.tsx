/**
 * Top Performers Analytics Page
 * File 339 - Top performing content with tabs
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Download,
  Lightbulb,
  FileText,
  Globe,
  Tag,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TopPerformers } from '@/components/analytics/TopPerformers';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useTopPerformers, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export default function TopPerformersPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [activeTab, setActiveTab] = useState('articles');

  // AI Insights (mock)
  const insights = [
    {
      type: 'success',
      title: 'Contenu performant',
      message: 'Les articles sur l\'expatriation en France génèrent 40% plus de conversions.',
    },
    {
      type: 'opportunity',
      title: 'Opportunité SEO',
      message: 'Les pages sur les visas ont un fort potentiel mais un bounce rate élevé.',
    },
    {
      type: 'warning',
      title: 'Attention',
      message: 'Le trafic mobile a diminué de 15% ce mois, vérifiez la performance mobile.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/analytics">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Top Contenu
            </h1>
            <p className="text-muted-foreground">Meilleures performances et insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-lg border bg-white',
                  insight.type === 'success' && 'border-green-200',
                  insight.type === 'opportunity' && 'border-blue-200',
                  insight.type === 'warning' && 'border-yellow-200'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className={cn(
                    'h-4 w-4',
                    insight.type === 'success' && 'text-green-500',
                    insight.type === 'opportunity' && 'text-blue-500',
                    insight.type === 'warning' && 'text-yellow-500'
                  )} />
                  <span className="font-medium text-sm">{insight.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles">
            <FileText className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="landings">
            <Globe className="h-4 w-4 mr-2" />
            Pages d'entrée
          </TabsTrigger>
          <TabsTrigger value="countries">
            <Globe className="h-4 w-4 mr-2" />
            Pays
          </TabsTrigger>
          <TabsTrigger value="themes">
            <Tag className="h-4 w-4 mr-2" />
            Thèmes
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="mt-6">
          <TopPerformers type="articles" period={period} limit={30} />
        </TabsContent>

        {/* Landings Tab */}
        <TabsContent value="landings" className="mt-6">
          <TopPerformers type="landings" period={period} limit={30} />
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance par pays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { country: 'France', code: '🇫🇷', views: 45000, conversions: 450, rate: 1.0 },
                  { country: 'Belgique', code: '🇧🇪', views: 12000, conversions: 180, rate: 1.5 },
                  { country: 'Suisse', code: '🇨🇭', views: 8000, conversions: 160, rate: 2.0 },
                  { country: 'Canada', code: '🇨🇦', views: 6000, conversions: 90, rate: 1.5 },
                  { country: 'Luxembourg', code: '🇱🇺', views: 3000, conversions: 75, rate: 2.5 },
                  { country: 'Monaco', code: '🇲🇨', views: 1500, conversions: 45, rate: 3.0 },
                ].map(country => (
                  <Card key={country.country}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{country.code}</span>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{(country.views / 1000).toFixed(1)}K</p>
                          <p className="text-xs text-muted-foreground">Vues</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{country.conversions}</p>
                          <p className="text-xs text-muted-foreground">Conv.</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{country.rate}%</p>
                          <p className="text-xs text-muted-foreground">Taux</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance par thème</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { theme: 'Expatriation', articles: 45, views: 125000, avgTime: 245, trend: 12 },
                  { theme: 'Visa & Immigration', articles: 32, views: 89000, avgTime: 312, trend: 8 },
                  { theme: 'Fiscalité', articles: 28, views: 67000, avgTime: 198, trend: -5 },
                  { theme: 'Assurance santé', articles: 22, views: 54000, avgTime: 276, trend: 15 },
                  { theme: 'Logement', articles: 18, views: 42000, avgTime: 234, trend: 3 },
                  { theme: 'Emploi', articles: 15, views: 38000, avgTime: 189, trend: -2 },
                ].map(theme => (
                  <div
                    key={theme.theme}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{theme.theme}</span>
                        <Badge variant="secondary">{theme.articles} articles</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">{(theme.views / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">vues</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.floor(theme.avgTime / 60)}m {theme.avgTime % 60}s</p>
                        <p className="text-xs text-muted-foreground">durée moy.</p>
                      </div>
                      <Badge className={cn(
                        theme.trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {theme.trend > 0 ? '+' : ''}{theme.trend}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trends Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendances clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-800 mb-1">Meilleure croissance</p>
              <p className="font-bold text-green-700">Assurance santé</p>
              <p className="text-sm text-green-600">+15% ce mois</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800 mb-1">Plus de conversions</p>
              <p className="font-bold text-blue-700">Visa & Immigration</p>
              <p className="text-sm text-blue-600">312 conversions</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-purple-800 mb-1">Engagement max</p>
              <p className="font-bold text-purple-700">Visa & Immigration</p>
              <p className="text-sm text-purple-600">5m 12s moy.</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-1">À améliorer</p>
              <p className="font-bold text-yellow-700">Fiscalité</p>
              <p className="text-sm text-yellow-600">-5% ce mois</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
