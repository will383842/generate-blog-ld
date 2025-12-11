import React, { useState } from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface Trend {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export default function TrendsPage() {
  const trends: Trend[] = [
    { label: 'Articles générés', value: 1243, change: 12.4, trend: 'up' },
    { label: 'Articles publiés', value: 1156, change: 8.7, trend: 'up' },
    { label: 'Trafic organique', value: 45231, change: -3.2, trend: 'down' },
    { label: 'Taux de conversion', value: 3.4, change: 0.0, trend: 'stable' },
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Tendances
        </h1>
        <p className="text-muted-foreground">Analyse des tendances et évolutions</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {trends.map((trend) => (
          <Card key={trend.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{trend.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">{trend.value.toLocaleString()}</div>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend.trend)}`}>
                  {getTrendIcon(trend.trend)}
                  {trend.change !== 0 && `${Math.abs(trend.change)}%`}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="week">
        <TabsList>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="month">Mois</TabsTrigger>
          <TabsTrigger value="quarter">Trimestre</TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>Tendances hebdomadaires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Graphiques des tendances hebdomadaires</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>Tendances mensuelles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Graphiques des tendances mensuelles</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarter">
          <Card>
            <CardHeader>
              <CardTitle>Tendances trimestrielles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Graphiques des tendances trimestrielles</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}