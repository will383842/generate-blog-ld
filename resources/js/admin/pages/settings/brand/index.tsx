/**
 * Brand Overview Page
 * File 256 - Brand book dashboard with stats and quick actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Settings2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  FileText,
  History,
  Code,
  ArrowRight,
  Plus,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useBrandStats,
  useBrandSections,
  useAuditStats,
  useAuditResults,
} from '@/hooks/useBrandValidation';
import {
  BrandSectionType,
  BRAND_SECTION_TYPES,
  getBrandSectionTypeMetadata,
  getViolationSeverityColor,
} from '@/types/brand';
import { ViolationsList } from '@/components/settings/ViolationsList';
import { cn } from '@/lib/utils';

export default function BrandOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // API hooks
  const { data: stats, isLoading: statsLoading } = useBrandStats(platformId);
  const { data: sections, isLoading: sectionsLoading } = useBrandSections(platformId);
  const { data: auditStats, isLoading: auditLoading } = useAuditStats(platformId);
  const { data: recentAudits } = useAuditResults(platformId, { status: 'pending' });

  const isLoading = statsLoading || sectionsLoading || auditLoading;

  // Calculate section coverage
  const sectionCoverage = sections
    ? Math.round((sections.length / BRAND_SECTION_TYPES.length) * 100)
    : 0;

  // Find missing essential sections
  const essentialSections = ['mission', 'values', 'tone', 'vocabulary', 'donts'];
  const configuredTypes = new Set(sections?.map(s => s.section_type) || []);
  const missingEssential = essentialSections.filter(s => !configuredTypes.has(s));

  // Recent violations from audits
  const recentViolations = recentAudits
    ?.flatMap(audit => 
      audit.violations.map(v => ({
        ...v,
        article_id: audit.content_id,
        article_title: audit.content_title,
        article_type: audit.content_type,
      }))
    )
    .slice(0, 5) || [];

  // Quick actions
  const quickActions = [
    {
      label: 'Configurer les sections',
      description: 'Définir le contenu des sections du brand book',
      icon: BookOpen,
      href: '/settings/brand/sections',
      color: 'bg-blue-500',
    },
    {
      label: 'Paramètres de style',
      description: 'Ajuster le ton et les règles de rédaction',
      icon: Settings2,
      href: '/settings/brand/style',
      color: 'bg-purple-500',
    },
    {
      label: 'Tester la conformité',
      description: 'Vérifier un contenu par rapport aux guidelines',
      icon: CheckCircle2,
      href: '/settings/brand/compliance',
      color: 'bg-green-500',
    },
    {
      label: 'Lancer un audit',
      description: 'Analyser tous les contenus existants',
      icon: BarChart3,
      href: '/settings/brand/audit',
      color: 'bg-orange-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('brand.title')}</h1>
          <p className="text-muted-foreground">
            Gérez les guidelines et le style de votre marque
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/settings/brand/history">
              <History className="h-4 w-4 mr-2" />
              Historique
            </Link>
          </Button>
          <Button asChild>
            <Link to="/settings/brand/sections">
              <Plus className="h-4 w-4 mr-2" />
              Configurer
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {missingEssential.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sections essentielles manquantes</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {missingEssential.length} section(s) essentielle(s) non configurée(s) :{' '}
              {missingEssential.map(s => getBrandSectionTypeMetadata(s as BrandSectionType)?.label).join(', ')}
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link to="/settings/brand/sections">
                Configurer
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Score de conformité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className={cn(
                'text-3xl font-bold',
                (stats?.compliance_score || 0) >= 80 ? 'text-green-600' :
                (stats?.compliance_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {stats?.compliance_score || 0}
              </span>
              <span className="text-muted-foreground mb-1">/100</span>
            </div>
            <Progress
              value={stats?.compliance_score || 0}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        {/* Section Coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Couverture sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">
                {stats?.sections_configured || 0}
              </span>
              <span className="text-muted-foreground mb-1">
                /{BRAND_SECTION_TYPES.length}
              </span>
            </div>
            <Progress value={sectionCoverage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        {/* Presets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Presets de style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.style_presets_count || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              configurations sauvegardées
            </p>
          </CardContent>
        </Card>

        {/* Pending Violations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Violations en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-3xl font-bold',
              (stats?.pending_violations || 0) > 10 ? 'text-red-600' :
              (stats?.pending_violations || 0) > 0 ? 'text-orange-600' : 'text-green-600'
            )}>
              {stats?.pending_violations || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              à corriger
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  to={action.href}
                  className="group flex flex-col p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3',
                    action.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium group-hover:text-primary">
                    {action.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                  <ArrowRight className="h-4 w-4 mt-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Sections du brand book</CardTitle>
              <CardDescription>
                État de configuration des sections
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings/brand/sections">
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {BRAND_SECTION_TYPES.map(sectionType => {
                const isConfigured = configuredTypes.has(sectionType.value);
                const isEssential = essentialSections.includes(sectionType.value);

                return (
                  <div
                    key={sectionType.value}
                    className={cn(
                      'flex items-center justify-between p-2 rounded',
                      isConfigured ? 'bg-green-50' : 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sectionType.color }}
                      />
                      <span className="text-sm">{sectionType.label}</span>
                      {isEssential && (
                        <Badge variant="outline" className="text-xs">
                          Essentiel
                        </Badge>
                      )}
                    </div>
                    {isConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => navigate(`/settings/brand/sections?type=${sectionType.value}`)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Violations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Violations récentes</CardTitle>
              <CardDescription>
                Problèmes détectés lors des audits
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings/brand/audit">
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentViolations.length > 0 ? (
              <ViolationsList
                violations={recentViolations}
                compact
                showArticleLinks
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-medium">Aucune violation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tous les contenus sont conformes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/settings/brand/presets"
          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <Layers className="h-5 w-5 text-purple-500" />
          <div>
            <p className="font-medium">Presets</p>
            <p className="text-xs text-muted-foreground">
              {stats?.style_presets_count || 0} preset(s)
            </p>
          </div>
        </Link>

        <Link
          to="/settings/brand/prompts"
          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <Code className="h-5 w-5 text-blue-500" />
          <div>
            <p className="font-medium">Prompts</p>
            <p className="text-xs text-muted-foreground">
              Aperçu des prompts
            </p>
          </div>
        </Link>

        <Link
          to="/settings/brand/history"
          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <History className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium">Historique</p>
            <p className="text-xs text-muted-foreground">
              {stats?.recent_changes || 0} changement(s)
            </p>
          </div>
        </Link>

        <Link
          to="/settings/brand/audit"
          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <BarChart3 className="h-5 w-5 text-orange-500" />
          <div>
            <p className="font-medium">Audit</p>
            <p className="text-xs text-muted-foreground">
              {stats?.last_audit_date
                ? `Dernier: ${new Date(stats.last_audit_date).toLocaleDateString()}`
                : 'Aucun audit'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
