/**
 * Traffic Analytics Page
 * File 337 - Detailed traffic analysis
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowLeft,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { TrafficChart } from '@/components/analytics/TrafficChart';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useTrafficData, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export default function TrafficPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data: trafficData, isLoading } = useTrafficData(period, dateRange);

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Device icon
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return Monitor;
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
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
              <TrendingUp className="h-6 w-6" />
              Analyse du trafic
            </h1>
            <p className="text-muted-foreground">Sources, tendances et géographie</p>
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

      {/* Main Chart */}
      <TrafficChart period={period} dateRange={dateRange} height={400} />

      {/* Tabs */}
      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="countries">Pays</TabsTrigger>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
          <TabsTrigger value="referrers">Référents</TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sources Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition des sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trafficData?.sources?.map(source => (
                    <div key={source.source}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          <span className="font-medium capitalize">{source.source}</span>
                        </div>
                        <span>{formatNumber(source.visitors)} ({source.percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trends Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analyse des tendances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trafficData?.sources?.map(source => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="capitalize">{source.source}</span>
                      </div>
                      <Badge variant={source.trend > 0 ? 'default' : 'destructive'}>
                        {source.trend > 0 ? '+' : ''}{source.trend.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carte géographique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Carte interactive</p>
                    <p className="text-xs text-muted-foreground">(Intégration carte)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Countries Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top pays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pays</TableHead>
                        <TableHead className="text-right">Visiteurs</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trafficData?.countries?.slice(0, 10).map(country => (
                        <TableRow key={country.countryCode}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{country.countryCode === 'FR' ? '🇫🇷' : '🌍'}</span>
                              <span>{country.country}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(country.visitors)}
                          </TableCell>
                          <TableCell className="text-right">
                            {country.percentage.toFixed(1)}%
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

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trafficData?.devices?.map(device => {
              const Icon = getDeviceIcon(device.device);
              return (
                <Card key={device.device}>
                  <CardContent className="pt-6 text-center">
                    <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-3xl font-bold">{device.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground capitalize">{device.device}</p>
                    <p className="text-sm mt-2">{formatNumber(device.visitors)} visiteurs</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Referrers Tab */}
        <TabsContent value="referrers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sites référents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référent</TableHead>
                      <TableHead className="text-right">Visiteurs</TableHead>
                      <TableHead className="text-right">Taux de rebond</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trafficData?.referrers?.slice(0, 15).map(referrer => (
                      <TableRow key={referrer.referrer}>
                        <TableCell className="font-medium">
                          {referrer.referrer}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(referrer.visitors)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            referrer.bounceRate > 70 ? 'text-red-600' :
                            referrer.bounceRate > 50 ? 'text-yellow-600' : 'text-green-600'
                          )}>
                            {referrer.bounceRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`https://${referrer.referrer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
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
    </div>
  );
}
