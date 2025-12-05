import { FileText, Globe, Languages, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useStats';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: statsData, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = statsData?.data;
  const articles = stats?.articles || {};
  const costs = stats?.costs || {};

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Articles Total"
          value={articles.total?.toLocaleString('fr-FR') || '0'}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Publiés"
          value={articles.published?.toLocaleString('fr-FR') || '0'}
          icon={<Globe className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Brouillons"
          value={articles.draft?.toLocaleString('fr-FR') || '0'}
          icon={<Languages className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Coûts ce mois"
          value={`$${costs.month?.toFixed(2) || '0.00'}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/admin/coverage')}
        >
          <CardHeader>
            <CardTitle>Coverage Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Visualisez la couverture par pays et langue
            </p>
            <Button variant="outline" size="sm">
              Voir la matrice →
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/admin/generation')}
        >
          <CardHeader>
            <CardTitle>Générer du contenu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Lancez une nouvelle génération d'articles
            </p>
            <Button variant="outline" size="sm">
              Commencer →
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/admin/content')}
        >
          <CardHeader>
            <CardTitle>Content Hub</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gérez tous vos types de contenu
            </p>
            <Button variant="outline" size="sm">
              Accéder →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.generation_24h ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {stats.generation_24h.successful} générations réussies
                    </p>
                    <p className="text-xs text-gray-500">
                      Coût : ${stats.generation_24h.total_cost?.toFixed(4) || '0.0000'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-medium">Succès</span>
              </div>

              {stats.generation_24h.failed > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {stats.generation_24h.failed} échecs
                      </p>
                      <p className="text-xs text-gray-500">À vérifier</p>
                    </div>
                  </div>
                  <span className="text-xs text-red-600 font-medium">Erreur</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Durée moyenne : {stats.generation_24h.avg_duration_seconds?.toFixed(1) || '0'}s
                    </p>
                    <p className="text-xs text-gray-500">Par génération</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune activité récente
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}