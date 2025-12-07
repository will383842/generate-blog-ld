/**
 * Quality Dashboard Page
 * File 276 - Main quality overview with dashboard, alerts, and quick actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Gauge,
  BarChart3,
  Star,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Settings,
  FileText,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlatform } from '@/hooks/usePlatform';
import { useQualityDashboard } from '@/hooks/useQuality';
import { QualityDashboard } from '@/components/quality/QualityDashboard';
import { QualityTrends } from '@/components/quality/QualityTrends';
import { FeedbackAnalytics } from '@/components/quality/FeedbackAnalytics';
import { QualityCheckCard } from '@/components/quality/QualityCheckCard';
import { getScoreColor } from '@/types/quality';

export default function QualityIndexPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  const { data: stats } = useQualityDashboard(platformId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="h-6 w-6" />
            Qualité & Feedback
          </h1>
          <p className="text-muted-foreground">
            Contrôle qualité des contenus générés et analyse du feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/quality/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics détaillées
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings/quality">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {stats && stats.failed_count > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {stats.failed_count} contenu(s) avec un score insuffisant
                </p>
                <p className="text-sm text-red-600">
                  Ces contenus nécessitent une attention particulière
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link to="/quality/checks?status=failed">
                Voir les alertes
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <QualityDashboard platformId={platformId} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <QualityTrends platformId={platformId} compact />

        {/* Feedback */}
        <FeedbackAnalytics platformId={platformId} compact />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/quality/checks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Vérifications</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.total_checks || 0} contrôles
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quality/golden">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Exemples dorés</p>
                <p className="text-sm text-muted-foreground">
                  Contenus de référence
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quality/feedback">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-purple-100">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Feedback</p>
                <p className="text-sm text-muted-foreground">
                  Analyse des retours
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quality/training">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-lg bg-green-100">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Export Training</p>
                <p className="text-sm text-muted-foreground">
                  Données d'entraînement
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Checks Preview */}
      {stats && stats.recent_checks && stats.recent_checks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Vérifications récentes</CardTitle>
              <CardDescription>Derniers contrôles qualité effectués</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/quality/checks">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recent_checks.slice(0, 6).map(check => (
                <QualityCheckCard key={check.id} check={check} compact />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
