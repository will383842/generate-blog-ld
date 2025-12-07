import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  FileText,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  Languages,
  Layers,
  RefreshCw,
  Download,
  Calendar,
  PieChart,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  useKnowledgeList,
  useKnowledgeStats,
  useTranslationMatrix,
} from '@/hooks/usePlatformKnowledge';
import { usePlatform } from '@/hooks/usePlatform';
import { KNOWLEDGE_TYPES } from '@/types/knowledge';
import { cn } from '@/lib/utils';

const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru'];

interface Recommendation {
  type: 'critical' | 'warning' | 'suggestion';
  title: string;
  description: string;
  action: string;
  actionLink?: string;
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();

  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: knowledgeData, isLoading: listLoading } = useKnowledgeList({
    platform_id: currentPlatform?.id,
    per_page: 200,
  });

  const { data: stats, isLoading: statsLoading, refetch } = useKnowledgeStats(
    currentPlatform?.id || 0
  );

  const { data: matrix, isLoading: matrixLoading } = useTranslationMatrix(
    currentPlatform?.id || 0
  );

  const isLoading = listLoading || statsLoading || matrixLoading;

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!knowledgeData?.data) return null;

    const items = knowledgeData.data;
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Type distribution
    const typeDistribution = KNOWLEDGE_TYPES.map(type => ({
      ...type,
      count: items.filter(k => k.type === type.value).length,
      active: items.filter(k => k.type === type.value && k.is_active).length,
    }));

    // Usage stats
    const usageStats = {
      articles: items.filter(k => k.use_in_articles).length,
      landings: items.filter(k => k.use_in_landings).length,
      comparatives: items.filter(k => k.use_in_comparatives).length,
      pillars: items.filter(k => k.use_in_pillars).length,
      press: items.filter(k => k.use_in_press).length,
    };

    // Recent activity
    const recentItems = items.filter(k => new Date(k.updated_at) >= cutoffDate);
    const newItems = items.filter(k => new Date(k.created_at) >= cutoffDate);

    // Priority distribution
    const priorityDistribution = {
      high: items.filter(k => k.priority >= 8).length,
      medium: items.filter(k => k.priority >= 5 && k.priority < 8).length,
      low: items.filter(k => k.priority < 5).length,
    };

    // Translation coverage
    const translationCoverage = SUPPORTED_LANGUAGES.map(lang => {
      const langData = matrix?.languages[lang] || { done: 0, pending: 0, missing: 0 };
      const total = langData.done + langData.pending + langData.missing;
      return {
        code: lang,
        percentage: total > 0 ? Math.round((langData.done / total) * 100) : 0,
        ...langData,
      };
    });

    // Essential types coverage
    const essentialTypes = KNOWLEDGE_TYPES.filter(t => t.required);
    const essentialCoverage = essentialTypes.map(type => ({
      type: type.value,
      label: type.label,
      count: items.filter(k => k.type === type.value && k.is_active).length,
      required: true,
    }));

    return {
      total: items.length,
      active: items.filter(k => k.is_active).length,
      inactive: items.filter(k => !k.is_active).length,
      typeDistribution,
      usageStats,
      recentItems: recentItems.length,
      newItems: newItems.length,
      priorityDistribution,
      translationCoverage,
      essentialCoverage,
      averagePriority: items.length > 0
        ? (items.reduce((acc, k) => acc + k.priority, 0) / items.length).toFixed(1)
        : 0,
    };
  }, [knowledgeData, matrix, dateRange]);

  // Generate recommendations
  const recommendations = useMemo((): Recommendation[] => {
    if (!analytics) return [];

    const recs: Recommendation[] = [];

    // Check essential types
    analytics.essentialCoverage.forEach(ec => {
      if (ec.count === 0) {
        recs.push({
          type: 'critical',
          title: `Type "${ec.label}" manquant`,
          description: `Aucun élément de type "${ec.label}" n'est défini. Ce type est essentiel pour la génération de contenu.`,
          action: 'Ajouter',
          actionLink: `/settings/knowledge/new?type=${ec.type}`,
        });
      }
    });

    // Check translation coverage
    const lowTranslationLangs = analytics.translationCoverage.filter(tc => tc.percentage < 50);
    if (lowTranslationLangs.length > 0) {
      recs.push({
        type: 'warning',
        title: 'Traductions incomplètes',
        description: `${lowTranslationLangs.length} langue(s) ont moins de 50% de couverture de traduction.`,
        action: 'Traduire',
        actionLink: '/settings/knowledge/translations',
      });
    }

    // Check inactive items
    if (analytics.inactive > analytics.active * 0.3) {
      recs.push({
        type: 'warning',
        title: 'Nombreux éléments inactifs',
        description: `${analytics.inactive} éléments sont désactivés. Vérifiez s'ils sont toujours pertinents.`,
        action: 'Réviser',
        actionLink: '/settings/knowledge/by-type',
      });
    }

    // Check recent activity
    if (analytics.newItems === 0 && parseInt(dateRange) >= 30) {
      recs.push({
        type: 'suggestion',
        title: 'Base de connaissances statique',
        description: 'Aucun nouvel élément ajouté récemment. Pensez à enrichir votre base de connaissances.',
        action: 'Ajouter',
        actionLink: '/settings/knowledge/new',
      });
    }

    // Check usage distribution
    const usageValues = Object.values(analytics.usageStats);
    const maxUsage = Math.max(...usageValues);
    const minUsage = Math.min(...usageValues);
    if (maxUsage > 0 && minUsage === 0) {
      recs.push({
        type: 'suggestion',
        title: 'Distribution d\'usage inégale',
        description: 'Certains types de contenu n\'ont aucun élément de connaissance associé.',
        action: 'Configurer',
        actionLink: '/settings/knowledge/by-type',
      });
    }

    return recs;
  }, [analytics, dateRange]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground">
          {t('settings.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/settings/knowledge" className="hover:text-foreground">
          {t('knowledge.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{t('knowledge.analytics.title')}</span>
      </nav>

      <PageHeader
        title={t('knowledge.analytics.title')}
        description={t('knowledge.analytics.description')}
        actions={
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="365">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              {t('common.refresh')}
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="text-3xl font-bold mt-2">{analytics.total}</div>
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Badge variant="outline" className="text-green-600">
                  {analytics.active} actifs
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Activité</span>
              </div>
              <div className="text-3xl font-bold mt-2">{analytics.recentItems}</div>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {dateRange} derniers jours
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Priorité moy.</span>
              </div>
              <div className="text-3xl font-bold mt-2">{analytics.averagePriority}</div>
              <Progress
                value={parseFloat(analytics.averagePriority.toString()) * 10}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Traductions</span>
              </div>
              <div className="text-3xl font-bold mt-2">
                {Math.round(
                  analytics.translationCoverage.reduce((acc, tc) => acc + tc.percentage, 0) /
                  analytics.translationCoverage.length
                )}%
              </div>
              <Progress
                value={
                  analytics.translationCoverage.reduce((acc, tc) => acc + tc.percentage, 0) /
                  analytics.translationCoverage.length
                }
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommandations
              <Badge variant="secondary">{recommendations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    rec.type === 'critical' && 'bg-red-50 border border-red-200',
                    rec.type === 'warning' && 'bg-yellow-50 border border-yellow-200',
                    rec.type === 'suggestion' && 'bg-blue-50 border border-blue-200'
                  )}
                >
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                  </div>
                  {rec.actionLink && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={rec.actionLink}>{rec.action}</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="types">Par type</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
          <TabsTrigger value="translations">Traductions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribution par priorité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Haute (8-10)</span>
                        <span className="text-green-600">{analytics.priorityDistribution.high}</span>
                      </div>
                      <Progress
                        value={(analytics.priorityDistribution.high / analytics.total) * 100}
                        className="h-3"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Moyenne (5-7)</span>
                        <span className="text-yellow-600">{analytics.priorityDistribution.medium}</span>
                      </div>
                      <Progress
                        value={(analytics.priorityDistribution.medium / analytics.total) * 100}
                        className="h-3"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Basse (1-4)</span>
                        <span className="text-gray-600">{analytics.priorityDistribution.low}</span>
                      </div>
                      <Progress
                        value={(analytics.priorityDistribution.low / analytics.total) * 100}
                        className="h-3"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Essential Types Coverage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Types essentiels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.essentialCoverage.map(ec => (
                      <div key={ec.type} className="flex items-center gap-3">
                        {ec.count > 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{ec.label}</span>
                            <Badge variant={ec.count > 0 ? 'default' : 'destructive'}>
                              {ec.count}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribution par type</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Actifs</TableHead>
                      <TableHead className="text-center">Requis</TableHead>
                      <TableHead className="w-48">Couverture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.typeDistribution.map(type => (
                      <TableRow key={type.value}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            <span className="font-medium">{type.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{type.count}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={type.active > 0 ? 'default' : 'secondary'}>
                            {type.active}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {type.required ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Progress
                            value={type.maxItems ? (type.count / type.maxItems) * 100 : type.count > 0 ? 100 : 0}
                            className="h-2"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Utilisation par type de contenu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.usageStats).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{key}</span>
                          <span>{value} éléments</span>
                        </div>
                        <Progress
                          value={(value / analytics.total) * 100}
                          className="h-3"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conseils d'optimisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Activez les éléments de connaissance pour chaque type de contenu pertinent</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Priorisez les éléments les plus importants (8-10) pour une meilleure intégration</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Mettez à jour régulièrement les éléments de type "facts" et "differentiators"</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Utilisez le validateur pour vérifier la cohérence de votre contenu</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="translations" className="space-y-4">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Couverture par langue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
                  {analytics.translationCoverage.map(tc => (
                    <div
                      key={tc.code}
                      className={cn(
                        'text-center p-4 rounded-lg border',
                        tc.percentage === 100 && 'bg-green-50 border-green-200',
                        tc.percentage >= 50 && tc.percentage < 100 && 'bg-yellow-50 border-yellow-200',
                        tc.percentage < 50 && 'bg-red-50 border-red-200'
                      )}
                    >
                      <div className="font-bold text-lg uppercase">{tc.code}</div>
                      <div className={cn(
                        'text-3xl font-bold mt-1',
                        tc.percentage === 100 && 'text-green-600',
                        tc.percentage >= 50 && tc.percentage < 100 && 'text-yellow-600',
                        tc.percentage < 50 && 'text-red-600'
                      )}>
                        {tc.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {tc.done} / {tc.done + tc.pending + tc.missing}
                      </div>
                      <Progress value={tc.percentage} className="mt-2 h-1" />
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-6">
                  <Button asChild>
                    <Link to="/settings/knowledge/translations">
                      <Languages className="h-4 w-4 mr-2" />
                      Gérer les traductions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
