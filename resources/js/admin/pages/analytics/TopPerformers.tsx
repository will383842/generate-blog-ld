/**
 * Top Performers Analytics Page
 * File 339 - Top performing content with tabs
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TopPerformers } from '@/components/analytics/TopPerformers';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useTopPerformers, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface Insight {
  type: 'success' | 'opportunity' | 'warning';
  title: string;
  message: string;
}

export default function TopPerformersPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [activeTab, setActiveTab] = useState('articles');

  // Fetch AI insights
  const { data: insights = [], isLoading: insightsLoading } = useQuery<Insight[]>({
    queryKey: ['analytics', 'insights', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
      const res = await fetch(`/api/admin/analytics/insights?${params}`);
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    },
  });

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

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
          {insightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun insight disponible pour cette période</p>
            </div>
          ) : (
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
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="articles">
            <FileText className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="countries">
            <Globe className="h-4 w-4 mr-2" />
            Pays
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Tag className="h-4 w-4 mr-2" />
            Mots-clés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6">
          <TopPerformers period={period} type="articles" />
        </TabsContent>

        <TabsContent value="countries" className="mt-6">
          <TopPerformers period={period} type="countries" />
        </TabsContent>

        <TabsContent value="keywords" className="mt-6">
          <TopPerformers period={period} type="keywords" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
