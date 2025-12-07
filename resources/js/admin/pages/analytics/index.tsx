/**
 * Analytics Dashboard Page
 * File 336 - Main analytics overview page
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  FileText,
  Download,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useExportAnalytics, PeriodType, DateRange } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export default function AnalyticsIndexPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const exportAnalytics = useExportAnalytics();

  const quickLinks = [
    {
      title: 'Trafic',
      description: 'Sources et tendances',
      icon: TrendingUp,
      href: '/analytics/traffic',
      color: 'text-blue-500',
      bg: 'bg-blue-100',
    },
    {
      title: 'Conversions',
      description: 'Entonnoir et objectifs',
      icon: Target,
      href: '/analytics/conversions',
      color: 'text-green-500',
      bg: 'bg-green-100',
    },
    {
      title: 'Top contenu',
      description: 'Meilleures performances',
      icon: BarChart3,
      href: '/analytics/top-performers',
      color: 'text-yellow-500',
      bg: 'bg-yellow-100',
    },
    {
      title: 'Benchmarks',
      description: 'Comparaison plateformes',
      icon: Users,
      href: '/analytics/benchmarks',
      color: 'text-purple-500',
      bg: 'bg-purple-100',
    },
    {
      title: 'Rapports',
      description: 'Génération et planification',
      icon: FileText,
      href: '/analytics/reports',
      color: 'text-cyan-500',
      bg: 'bg-cyan-100',
    },
  ];

  // Handle export
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    exportAnalytics.mutate({
      type: 'dashboard',
      format,
      period,
      dateRange,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics & Reporting
          </h1>
          <p className="text-muted-foreground">
            Analyse des performances et du trafic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" asChild>
            <Link to="/analytics/reports">
              <Settings className="h-4 w-4 mr-2" />
              Rapports
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickLinks.map(link => (
          <Link key={link.href} to={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', link.bg)}>
                  <link.icon className={cn('h-5 w-5', link.color)} />
                </div>
                <p className="font-medium text-sm">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Dashboard */}
      <AnalyticsDashboard period={period} dateRange={dateRange} />
    </div>
  );
}
