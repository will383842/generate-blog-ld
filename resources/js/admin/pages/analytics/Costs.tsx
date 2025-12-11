import React, { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';

export default function CostsPage() {
  const costs = {
    total: 2847.32,
    openai: 1245.67,
    anthropic: 892.45,
    google: 432.18,
    dalle: 277.02,
  };

  const monthlyTrend = +12.3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Coûts API
        </h1>
        <p className="text-muted-foreground">Suivi des coûts de génération IA</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${costs.total.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm mt-1">
              {monthlyTrend > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">+{monthlyTrend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">{monthlyTrend}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">OpenAI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs.openai}</div>
            <Badge variant="outline" className="mt-1">43.7%</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Anthropic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs.anthropic}</div>
            <Badge variant="outline" className="mt-1">31.3%</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Google</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs.google}</div>
            <Badge variant="outline" className="mt-1">15.2%</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Mensuel</TabsTrigger>
          <TabsTrigger value="daily">Quotidien</TabsTrigger>
          <TabsTrigger value="provider">Par provider</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Janvier 2025</span>
                  <span className="font-bold">$2,534.18</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Février 2025</span>
                  <span className="font-bold">$2,847.32</span>
                </div>
                <div className="flex items-center justify-between py-2 text-muted-foreground">
                  <span>Projection Mars</span>
                  <span>~$3,100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Coûts quotidiens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Graphique des coûts journaliers</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provider">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(costs).filter(([k]) => k !== 'total').map(([provider, cost]) => (
                  <div key={provider} className="flex items-center justify-between py-2">
                    <span className="capitalize">{provider}</span>
                    <span className="font-medium">${cost}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}