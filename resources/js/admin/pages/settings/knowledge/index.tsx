/**
 * Knowledge Overview Page
 * File 240 - Dashboard for platform knowledge management
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Languages,
  TrendingUp,
  Plus,
  ChevronRight,
  FileText,
  Settings,
  Upload,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useKnowledgeStats, useKnowledgeList } from '@/hooks/usePlatformKnowledge';
import { usePlatform } from '@/hooks/usePlatform';
import { KNOWLEDGE_TYPES, getKnowledgeTypeColor, getRequiredKnowledgeTypes } from '@/types/knowledge';
import { cn } from '@/lib/utils';

export default function KnowledgeOverviewPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();

  const { data: stats, isLoading: statsLoading } = useKnowledgeStats(
    currentPlatform?.id || 0
  );

  const { data: recentData, isLoading: recentLoading } = useKnowledgeList({
    platform_id: currentPlatform?.id,
    sort_by: 'updated_at',
    sort_order: 'desc',
    per_page: 5,
  });

  const isLoading = statsLoading || recentLoading;

  // Calculate essential types coverage
  const requiredTypes = getRequiredKnowledgeTypes();
  const essentialCoverage = requiredTypes.map(type => ({
    ...type,
    count: stats?.by_type[type.value] || 0,
    isCovered: (stats?.by_type[type.value] || 0) > 0,
  }));
  const essentialComplete = essentialCoverage.filter(t => t.isCovered).length;
  const essentialPercentage = Math.round((essentialComplete / requiredTypes.length) * 100);

  // Missing essential types
  const missingEssential = essentialCoverage.filter(t => !t.isCovered);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground">
          {t('settings.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{t('knowledge.title')}</span>
      </nav>

      <PageHeader
        title={t('knowledge.title')}
        description={t('knowledge.description')}
        actions={
          <Button asChild>
            <Link to="/settings/knowledge/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('knowledge.actions.add')}
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('knowledge.stats.total')}
                  </span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {stats?.total || 0}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-green-600">
                    {stats?.active || 0} {t('knowledge.stats.active')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('knowledge.stats.completeness')}
                  </span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {essentialPercentage}%
                </div>
                <Progress value={essentialPercentage} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('knowledge.stats.essential')}
                  </span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {essentialComplete}/{requiredTypes.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t('knowledge.stats.typesConfigured')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('knowledge.stats.translations')}
                  </span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {stats?.translation_coverage || 0}%
                </div>
                <Progress 
                  value={stats?.translation_coverage || 0} 
                  className="mt-2 h-2" 
                />
              </CardContent>
            </Card>
          </div>

          {/* Missing Essential Alert */}
          {missingEssential.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  {t('knowledge.alerts.missingEssential.title')}
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {t('knowledge.alerts.missingEssential.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {missingEssential.map(type => (
                    <Button
                      key={type.value}
                      variant="outline"
                      size="sm"
                      asChild
                      className="bg-white"
                    >
                      <Link to={`/settings/knowledge/new?type=${type.value}`}>
                        <Plus className="h-3 w-3 mr-1" />
                        {type.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Type Coverage Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('knowledge.typeCoverage.title')}
              </CardTitle>
              <CardDescription>
                {t('knowledge.typeCoverage.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
                {KNOWLEDGE_TYPES.map(type => {
                  const count = stats?.by_type[type.value] || 0;
                  const isConfigured = count > 0;

                  return (
                    <Link
                      key={type.value}
                      to={`/settings/knowledge/by-type?type=${type.value}`}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all hover:shadow-md',
                        isConfigured
                          ? 'bg-white border-gray-200'
                          : type.required
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-2"
                        style={{ backgroundColor: `${type.color}20` }}
                      >
                        {isConfigured ? (
                          <CheckCircle2 
                            className="h-4 w-4" 
                            style={{ color: type.color }} 
                          />
                        ) : (
                          <Plus 
                            className={cn(
                              'h-4 w-4',
                              type.required ? 'text-red-500' : 'text-gray-400'
                            )} 
                          />
                        )}
                      </div>
                      <div className="font-medium text-sm truncate">
                        {type.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {count} {t('knowledge.items', { count })}
                      </div>
                      {type.required && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'mt-1 text-xs',
                            !isConfigured && 'border-red-300 text-red-600'
                          )}
                        >
                          {t('knowledge.required')}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates & Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('knowledge.recentUpdates.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentData?.data && recentData.data.length > 0 ? (
                  <div className="space-y-3">
                    {recentData.data.map(item => (
                      <Link
                        key={item.id}
                        to={`/settings/knowledge/${item.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: getKnowledgeTypeColor(item.type) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {item.type}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('knowledge.recentUpdates.empty')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('knowledge.quickLinks.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild className="h-auto py-4">
                    <Link to="/settings/knowledge/by-type" className="flex flex-col items-center gap-2">
                      <Layers className="h-5 w-5" />
                      <span className="text-sm">{t('knowledge.quickLinks.byType')}</span>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="h-auto py-4">
                    <Link to="/settings/knowledge/translations" className="flex flex-col items-center gap-2">
                      <Languages className="h-5 w-5" />
                      <span className="text-sm">{t('knowledge.quickLinks.translations')}</span>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="h-auto py-4">
                    <Link to="/settings/knowledge/validator" className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm">{t('knowledge.quickLinks.validator')}</span>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="h-auto py-4">
                    <Link to="/settings/knowledge/import" className="flex flex-col items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">{t('knowledge.quickLinks.import')}</span>
                    </Link>
                  </Button>

                  <Button variant="outline" asChild className="h-auto py-4 col-span-2">
                    <Link to="/settings/knowledge/analytics" className="flex flex-col items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-sm">{t('knowledge.quickLinks.analytics')}</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
