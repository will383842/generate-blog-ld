/**
 * AI Costs Page
 * File 309 - Full cost management with breakdown, predictions, budgets, and reports
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ArrowLeft,
  Download,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  FileText,
  Bell,
  Check,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  useDailyCosts,
  useMonthlyCosts,
  useCostPredictions,
  useCostBreakdown,
  useCostAlerts,
  useAcknowledgeCostAlert,
} from '@/hooks/useMonitoring';
import { CostDashboard } from '@/components/ai/CostDashboard';
import { cn } from '@/lib/utils';

export default function AICostsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budget, setBudget] = useState({ monthly: 500, alert_threshold: 80 });

  const { data: dailyCosts } = useDailyCosts(period === '7d' ? 7 : period === '30d' ? 30 : 90);
  const { data: monthlyCosts } = useMonthlyCosts(12);
  const { data: predictions } = useCostPredictions();
  const { data: breakdown } = useCostBreakdown(period);
  const { data: alerts } = useCostAlerts();
  const acknowledgeAlert = useAcknowledgeCostAlert();

  const totalPeriod = dailyCosts?.reduce((sum, d) => sum + d.total, 0) || 0;
  const currentMonth = monthlyCosts?.[0];
  const lastMonth = monthlyCosts?.[1];
  const activeAlerts = alerts?.filter(a => !a.acknowledged_at).length || 0;

  const apiColors: Record<string, string> = {
    openai: '#10B981',
    anthropic: '#F59E0B',
    perplexity: '#8B5CF6',
    dalle: '#EC4899',
    other: '#6B7280',
  };

  const exportReport = () => {
    const data = dailyCosts?.map(d => ({
      date: d.date,
      total: d.total,
      openai: d.breakdown.openai,
      anthropic: d.breakdown.anthropic,
      perplexity: d.breakdown.perplexity,
      dalle: d.breakdown.dalle,
      other: d.breakdown.other,
      requests: d.requests_count,
      tokens: d.tokens_used,
    }));
    
    const csv = [
      Object.keys(data?.[0] || {}).join(','),
      ...(data?.map(row => Object.values(row).join(',')) || []),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-costs-report-${period}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ai">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Gestion des coûts IA
            </h1>
            <p className="text-muted-foreground">Suivez et optimisez vos dépenses IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBudgetDialog(true)}>
            <Target className="h-4 w-4 mr-2" />
            Budget
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={period} onValueChange={(v) => setPeriod(v)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
        {activeAlerts > 0 && (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {activeAlerts} alerte(s)
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total période</p>
            <p className="text-2xl font-bold">${totalPeriod.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ~${(totalPeriod / (period === '7d' ? 7 : period === '30d' ? 30 : 90)).toFixed(2)}/jour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ce mois</p>
            <p className="text-2xl font-bold">${currentMonth?.total.toFixed(2) || '0.00'}</p>
            {currentMonth?.budget && (
              <div className="mt-2">
                <Progress
                  value={currentMonth.budget_percent || 0}
                  className={cn(
                    'h-1',
                    (currentMonth.budget_percent || 0) > 90 && '[&>div]:bg-red-500',
                    (currentMonth.budget_percent || 0) > 75 && '[&>div]:bg-yellow-500'
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {currentMonth.budget_percent?.toFixed(0)}% du budget
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Prévision</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">${predictions?.end_of_month.toFixed(2) || '0.00'}</p>
              {predictions?.trend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
              {predictions?.trend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">vs mois dernier</p>
            <p className={cn(
              'text-2xl font-bold',
              (currentMonth?.trend || 0) > 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {(currentMonth?.trend || 0) > 0 ? '+' : ''}{currentMonth?.trend?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <PieChart className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <DollarSign className="h-4 w-4 mr-2" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Prévisions
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alertes ({activeAlerts})
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CostDashboard />
        </TabsContent>

        <TabsContent value="breakdown" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Par API</CardTitle>
              </CardHeader>
              <CardContent>
                {breakdown && (
                  <div className="space-y-4">
                    {Object.entries(breakdown)
                      .filter(([_, value]) => value > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([api, value]) => {
                        const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
                        const percent = (value / total) * 100;
                        return (
                          <div key={api}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: apiColors[api] }}
                                />
                                <span className="capitalize font-medium">{api}</span>
                              </div>
                              <span>${value.toFixed(2)} ({percent.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percent} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détail journalier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Requêtes</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyCosts?.slice(0, 15).map(day => (
                        <TableRow key={day.date}>
                          <TableCell>
                            {new Date(day.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${day.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(day.requests_count ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {(day.tokens_used / 1000).toFixed(1)}k
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="mt-6">
          {predictions && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prévision fin de mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-4xl font-bold">${predictions.end_of_month.toFixed(2)}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {predictions.trend === 'up' && (
                        <Badge variant="destructive">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          En hausse
                        </Badge>
                      )}
                      {predictions.trend === 'down' && (
                        <Badge className="bg-green-100 text-green-800">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          En baisse
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Confiance: {predictions.confidence}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Facteurs d'influence</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {predictions.factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base text-green-800">
                    Recommandations d'optimisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictions.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-lg bg-white border border-green-200"
                      >
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-green-800">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Alertes de coûts</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowBudgetDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border',
                        !alert.acknowledged_at && 'bg-red-50 border-red-200',
                        alert.acknowledged_at && 'bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={cn(
                          'h-5 w-5',
                          alert.severity === 'critical' && 'text-red-600',
                          alert.severity === 'warning' && 'text-yellow-600',
                          alert.severity === 'info' && 'text-blue-600'
                        )} />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">
                            ${alert.value.toFixed(2)} / ${alert.threshold.toFixed(2)} •
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'warning' ? 'default' : 'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                        {!alert.acknowledged_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert.mutate(alert.id)}
                            disabled={acknowledgeAlert.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune alerte</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rapports mensuels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Tendance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyCosts?.map(month => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {new Date(month.month + '-01').toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">${month.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {month.budget ? `$${month.budget.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {month.budget_percent !== undefined ? (
                            <Badge variant={
                              month.budget_percent > 100 ? 'destructive' :
                              month.budget_percent > 80 ? 'default' : 'secondary'
                            }>
                              {month.budget_percent.toFixed(0)}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            month.trend > 0 ? 'text-red-600' : 'text-green-600'
                          )}>
                            {month.trend > 0 ? '+' : ''}{month.trend.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration du budget</DialogTitle>
            <DialogDescription>
              Définissez votre budget mensuel et les seuils d'alerte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly_budget">Budget mensuel ($)</Label>
              <Input
                id="monthly_budget"
                type="number"
                value={budget.monthly}
                onChange={(e) => setBudget({ ...budget, monthly: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert_threshold">Seuil d'alerte (%)</Label>
              <Input
                id="alert_threshold"
                type="number"
                value={budget.alert_threshold}
                onChange={(e) => setBudget({ ...budget, alert_threshold: parseInt(e.target.value) })}
                className="mt-1"
                min={50}
                max={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alerte envoyée quand ce % du budget est atteint
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowBudgetDialog(false)}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
