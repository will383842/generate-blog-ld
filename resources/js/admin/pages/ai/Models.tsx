/**
 * AI Models Page
 * File 307 - Full model configuration with comparison and A/B testing
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  Scale,
  FlaskConical,
  BarChart3,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/Alert';
import { useModelConfigs, useModelInfo } from '@/hooks/useMonitoring';
import { ModelConfigComponent } from '@/components/ai/ModelConfig';
import { ModelComparison } from '@/components/ai/ModelComparison';

export default function AIModelsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('config');

  // API hooks
  const { data: configs, isLoading: configsLoading } = useModelConfigs();
  const { data: models, isLoading: modelsLoading } = useModelInfo();

  // Stats
  const abTestingCount = configs?.filter(c => c.ab_testing_enabled).length || 0;
  const totalModelsUsed = new Set(configs?.map(c => c.primary_model)).size || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <Settings className="h-6 w-6" />
              Configuration des modèles
            </h1>
            <p className="text-muted-foreground">
              Gérez les modèles IA par type de contenu
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Configurations</p>
            <p className="text-2xl font-bold">{configs?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Modèles utilisés</p>
            <p className="text-2xl font-bold">{totalModelsUsed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Modèles disponibles</p>
            <p className="text-2xl font-bold">{models?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">A/B Tests actifs</p>
            <p className="text-2xl font-bold text-purple-600">{abTestingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Configuration des modèles</AlertTitle>
        <AlertDescription>
          Chaque type de contenu peut avoir un modèle principal et des modèles de repli.
          Activez les tests A/B pour comparer les performances de différents modèles.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="compare">
            <Scale className="h-4 w-4 mr-2" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="ab-testing">
            <FlaskConical className="h-4 w-4 mr-2" />
            A/B Testing ({abTestingCount})
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-6">
          {configsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ModelConfigComponent />
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="compare" className="mt-6">
          {modelsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ModelComparison />
          )}
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="ab-testing" className="mt-6">
          {abTestingCount > 0 ? (
            <div className="space-y-4">
              {configs
                ?.filter(c => c.ab_testing_enabled)
                .map(config => {
                  const primaryModel = models?.find(m => m.id === config.primary_model);
                  const variantModel = models?.find(m => m.id === config.ab_variant_model);
                  
                  return (
                    <Card key={config.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-purple-600" />
                              {config.content_type}
                            </CardTitle>
                            <CardDescription>
                              Test actif depuis {new Date(config.updated_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800">
                            {config.ab_traffic_percent}% trafic variant
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Control (Primary) */}
                          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">Contrôle</Badge>
                              <span className="text-sm text-muted-foreground">
                                {100 - (config.ab_traffic_percent || 50)}% trafic
                              </span>
                            </div>
                            <p className="font-semibold">{primaryModel?.name || config.primary_model}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {primaryModel?.provider}
                            </p>
                            {/* Mock results */}
                            <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Requêtes</span>
                                <span className="font-medium">1,234</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Latence moy.</span>
                                <span className="font-medium">450ms</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Score qualité</span>
                                <span className="font-medium">82%</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Coût</span>
                                <span className="font-medium">$12.34</span>
                              </div>
                            </div>
                          </div>

                          {/* Variant */}
                          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-purple-100 text-purple-800">Variant</Badge>
                              <span className="text-sm text-muted-foreground">
                                {config.ab_traffic_percent || 50}% trafic
                              </span>
                            </div>
                            <p className="font-semibold">{variantModel?.name || config.ab_variant_model}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {variantModel?.provider}
                            </p>
                            {/* Mock results */}
                            <div className="mt-4 pt-4 border-t border-purple-200 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Requêtes</span>
                                <span className="font-medium">987</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Latence moy.</span>
                                <span className="font-medium text-green-600">320ms ↓</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Score qualité</span>
                                <span className="font-medium text-green-600">85% ↑</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Coût</span>
                                <span className="font-medium text-green-600">$9.87 ↓</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>Recommandation :</strong> Le variant montre de meilleures performances
                            avec une latence 29% plus basse et un coût 20% inférieur.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Aucun test A/B actif.<br />
                  Activez un test dans la configuration des modèles.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab('config')}
                >
                  Configurer un test
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
