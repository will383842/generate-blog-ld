import { FileText, Globe, Languages, DollarSign, Activity, BarChart3, RefreshCw, Zap, Plus, Search } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useStats';
import { useState } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: statsData, isLoading, error, refetch } = useDashboardStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Dashboard
          </h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">Erreur lors du chargement des données</p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // L'intercepteur axios extrait déjà .data du wrapper, donc statsData EST les données
  const stats = statsData as unknown as {
    articles?: { total?: number; published?: number; draft?: number; review?: number };
    costs?: { month?: number };
    generation_24h?: { successful?: number; failed?: number; total_cost?: number; avg_duration_seconds?: number };
    trends?: { total?: { value: number; isPositive: boolean }; published?: { value: number; isPositive: boolean }; draft?: { value: number; isPositive: boolean }; review?: { value: number; isPositive: boolean }; costs?: { value: number; isPositive: boolean } };
    coverage?: { countries?: number };
  };
  const articles = stats?.articles || {};
  const costs = stats?.costs || {};
  const generation24h = stats?.generation_24h || {};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/content?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('all');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de votre activité de génération de contenu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => navigate('/generation')}>
            <Zap className="w-4 h-4 mr-2" />
            Générer
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher des contenus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
        
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les plateformes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les plateformes</SelectItem>
            <SelectItem value="sos-expat">SOS-Expat</SelectItem>
            <SelectItem value="ulixai">Ulixai</SelectItem>
            <SelectItem value="ulysse-ai">Ulysse.AI</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || selectedPlatform !== 'all') && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Effacer les filtres
          </Button>
        )}
      </div>

      {/* Stats - 6 cartes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total"
          value={articles.total?.toLocaleString('fr-FR') || '0'}
          icon={FileText}
          trend={stats?.trends?.total}
        />
        <StatCard
          title="Publiés"
          value={articles.published?.toLocaleString('fr-FR') || '0'}
          icon={Globe}
          trend={stats?.trends?.published}
        />
        <StatCard
          title="Brouillons"
          value={articles.draft?.toLocaleString('fr-FR') || '0'}
          icon={FileText}
          trend={stats?.trends?.draft}
        />
        <StatCard
          title="En révision"
          value={articles.review?.toLocaleString('fr-FR') || '0'}
          icon={Activity}
          trend={stats?.trends?.review}
        />
        <StatCard
          title="Générés 24h"
          value={generation24h.successful?.toLocaleString('fr-FR') || '0'}
          icon={Zap}
          trend={{ value: generation24h.successful || 0, isPositive: true }}
        />
        <StatCard
          title="Coûts"
          value={`$${costs.month?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          trend={stats?.trends?.costs}
        />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all group"
          onClick={() => navigate('/coverage')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Couverture mondiale</span>
              <Globe className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Visualisez la couverture par pays et langue avec la carte interactive
            </p>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                Voir la carte →
              </Button>
              {stats?.coverage && (
                <span className="text-xs text-gray-500">
                  {stats.coverage.countries} pays
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all group"
          onClick={() => navigate('/generation')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Générer du contenu</span>
              <Zap className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Lancez une nouvelle génération d'articles automatisée
            </p>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Commencer →
              </Button>
              {generation24h.successful > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  +{generation24h.successful} aujourd'hui
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all group"
          onClick={() => navigate('/content')}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bibliothèque de contenus</span>
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gérez tous vos articles, comparatifs et contenus
            </p>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                Accéder →
              </Button>
              <span className="text-xs text-gray-500">
                {articles.total?.toLocaleString('fr-FR') || '0'} contenus
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activité récente (24h)</span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/monitoring')}>
              Voir tout →
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generation24h.successful > 0 || generation24h.failed > 0 ? (
            <div className="space-y-4">
              {generation24h.successful > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {generation24h.successful} générations réussies
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Coût total : ${generation24h.total_cost?.toFixed(4) || '0.0000'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    Succès
                  </span>
                </div>
              )}

              {generation24h.failed > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {generation24h.failed} échecs de génération
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Action requise
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-red-600 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                    Erreur
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Durée moyenne : {generation24h.avg_duration_seconds?.toFixed(1) || '0'}s
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Par génération
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/analytics/trends')}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Voir tendances
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune activité dans les dernières 24 heures
              </p>
              <Button onClick={() => navigate('/generation')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Lancer une génération
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
