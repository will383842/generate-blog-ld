/**
 * Errors Admin Page
 * File 359 - Error log full page
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Download,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorLog } from '@/components/admin/ErrorLog';
import { useErrors } from '@/hooks/useSystem';
import { format, subDays } from 'date-fns';

export default function ErrorsPage() {
  const { t } = useTranslation();

  // Get stats for last 7 days
  const { data: errorsData } = useErrors({ per_page: 100 });

  // Mock chart data for last 7 days
  const chartData = [
    { day: 'Lun', errors: 12 },
    { day: 'Mar', errors: 8 },
    { day: 'Mer', errors: 15 },
    { day: 'Jeu', errors: 5 },
    { day: 'Ven', errors: 9 },
    { day: 'Sam', errors: 3 },
    { day: 'Dim', errors: 7 },
  ];

  const maxErrors = Math.max(...chartData.map(d => d.errors));
  const totalErrors = chartData.reduce((sum, d) => sum + d.errors, 0);
  const avgErrors = (totalErrors / chartData.length).toFixed(1);

  // Count by severity
  const severityCounts = errorsData?.data?.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Journal des erreurs
          </h1>
          <p className="text-muted-foreground">Surveillance et gestion des erreurs système</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{errorsData?.total || 0}</p>
            <p className="text-sm text-muted-foreground">Erreurs totales</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">{severityCounts.critical || 0}</p>
            <p className="text-sm text-red-700">Critiques</p>
          </CardContent>
        </Card>
        <Card className="border-red-100">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-500">{severityCounts.error || 0}</p>
            <p className="text-sm text-muted-foreground">Erreurs</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{severityCounts.warning || 0}</p>
            <p className="text-sm text-muted-foreground">Avertissements</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{severityCounts.info || 0}</p>
            <p className="text-sm text-muted-foreground">Info</p>
          </CardContent>
        </Card>
      </div>

      {/* 7-day Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Erreurs des 7 derniers jours
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{totalErrors}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Moy:</span>
                <span className="font-medium">{avgErrors}/jour</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end justify-between gap-2">
            {chartData.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-red-400 rounded-t transition-all hover:bg-red-500"
                  style={{
                    height: `${(day.errors / maxErrors) * 160}px`,
                    minHeight: '4px',
                  }}
                />
                <span className="text-xs text-muted-foreground">{day.day}</span>
                <span className="text-xs font-medium">{day.errors}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Log Component */}
      <ErrorLog limit={50} showFilters={true} />
    </div>
  );
}
