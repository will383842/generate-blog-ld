/**
 * Conversions Analytics Page
 * File 338 - Detailed conversion analysis
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Target,
  ArrowLeft,
  Plus,
  Settings,
  Download,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useConversionsData, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export default function ConversionsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [attributionModel, setAttributionModel] = useState('last_click');

  const { data: conversionsData, isLoading } = useConversionsData(period, dateRange);

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
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
            <Link to="/analytics">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6" />
              Conversions
            </h1>
            <p className="text-muted-foreground">Entonnoir, objectifs et attribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={() => setShowGoalDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel objectif
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Main Funnel */}
      <ConversionFunnel period={period} dateRange={dateRange} />

      {/* Tabs */}
      <Tabs defaultValue="attribution">
        <TabsList>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="daily">Évolution</TabsTrigger>
          <TabsTrigger value="goals">Objectifs</TabsTrigger>
        </TabsList>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Modèle d'attribution</CardTitle>
                  <CardDescription>
                    Comment les conversions sont attribuées aux canaux
                  </CardDescription>
                </div>
                <Select value={attributionModel} onValueChange={setAttributionModel}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_click">Dernier clic</SelectItem>
                    <SelectItem value="first_click">Premier clic</SelectItem>
                    <SelectItem value="linear">Linéaire</SelectItem>
                    <SelectItem value="time_decay">Décroissance temporelle</SelectItem>
                    <SelectItem value="position_based">Basé sur la position</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionsData?.bySource?.map(source => (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">{source.source}</span>
                      <div className="flex items-center gap-4">
                        <span>{source.conversions} conv.</span>
                        <Badge variant="outline">{source.rate.toFixed(2)}%</Badge>
                      </div>
                    </div>
                    <Progress
                      value={(source.conversions / (conversionsData?.totalConversions || 1)) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">À propos du modèle "{attributionModel.replace('_', ' ')}"</h4>
                <p className="text-sm text-muted-foreground">
                  {attributionModel === 'last_click' && 
                    'Attribue 100% de la conversion au dernier canal avant la conversion.'
                  }
                  {attributionModel === 'first_click' && 
                    'Attribue 100% de la conversion au premier canal de contact.'
                  }
                  {attributionModel === 'linear' && 
                    'Distribue le crédit de façon égale entre tous les canaux du parcours.'
                  }
                  {attributionModel === 'time_decay' && 
                    'Donne plus de crédit aux canaux proches de la conversion.'
                  }
                  {attributionModel === 'position_based' && 
                    '40% au premier, 40% au dernier, 20% répartis entre les autres.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Tab */}
        <TabsContent value="daily" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution quotidienne</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mini Chart */}
              <div className="h-[200px] mb-6">
                <svg viewBox="0 0 800 200" className="w-full h-full">
                  {conversionsData?.daily?.map((d, i, arr) => {
                    const maxConv = Math.max(...arr.map(x => x.conversions));
                    const x = (i / (arr.length - 1)) * 780 + 10;
                    const y = 190 - (d.conversions / maxConv) * 180;
                    const prevX = i > 0 ? ((i - 1) / (arr.length - 1)) * 780 + 10 : x;
                    const prevY = i > 0 ? 190 - (arr[i - 1].conversions / maxConv) * 180 : y;
                    
                    return (
                      <g key={i}>
                        {i > 0 && (
                          <line
                            x1={prevX}
                            y1={prevY}
                            x2={x}
                            y2={y}
                            stroke="#22C55E"
                            strokeWidth="2"
                          />
                        )}
                        <circle cx={x} cy={y} r="4" fill="#22C55E" />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Daily Table */}
              <div className="rounded-lg border max-h-[300px] overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-right p-3 font-medium">Conversions</th>
                      <th className="text-right p-3 font-medium">Taux</th>
                      <th className="text-right p-3 font-medium">Variation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversionsData?.daily?.slice().reverse().map((day, idx, arr) => {
                      const prevDay = arr[idx + 1];
                      const variation = prevDay
                        ? ((day.conversions - prevDay.conversions) / prevDay.conversions) * 100
                        : 0;
                      
                      return (
                        <tr key={day.date} className="border-b">
                          <td className="p-3">
                            {new Date(day.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </td>
                          <td className="text-right p-3 font-medium">{day.conversions}</td>
                          <td className="text-right p-3">{day.rate.toFixed(2)}%</td>
                          <td className="text-right p-3">
                            {prevDay && (
                              <span className={cn(
                                'flex items-center justify-end',
                                variation > 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                                {variation > 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conversionsData?.goals?.map(goal => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">
                          {formatNumber(goal.current)}
                        </span>
                        <span className="text-muted-foreground">
                          / {formatNumber(goal.target)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(goal.percentage, 100)}
                        className={cn(
                          'h-3',
                          goal.percentage >= 100 && '[&>div]:bg-green-500'
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {goal.percentage.toFixed(1)}% atteint
                      </span>
                      <Badge className={cn(
                        goal.trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {goal.trend > 0 ? '+' : ''}{goal.trend.toFixed(1)}% cette période
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Goal Card */}
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                <Button variant="outline" onClick={() => setShowGoalDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un objectif
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel objectif</DialogTitle>
            <DialogDescription>
              Définissez un nouvel objectif de conversion à suivre
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de l'objectif</Label>
              <Input placeholder="Ex: Inscriptions newsletter" className="mt-1" />
            </div>
            <div>
              <Label>Cible</Label>
              <Input type="number" placeholder="Ex: 1000" className="mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Select defaultValue="event">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="pageview">Page vue</SelectItem>
                  <SelectItem value="duration">Durée de session</SelectItem>
                  <SelectItem value="pages_per_session">Pages par session</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowGoalDialog(false)}>
              Créer l'objectif
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
