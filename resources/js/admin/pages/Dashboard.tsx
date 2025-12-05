import { FileText, Globe, Languages, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Articles ce mois"
          value="1,234"
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Pays couverts"
          value="197"
          icon={<Globe className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Langues actives"
          value="9"
          icon={<Languages className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Coûts ce mois"
          value="$1,245"
          icon={<DollarSign className="w-6 h-6" />}
          color="orange"
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/coverage')}>
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

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/generation')}>
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

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/content')}>
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
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      150 articles générés - France 🇫🇷
                    </p>
                    <p className="text-xs text-gray-500">Il y a {i} heure{i > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Succès</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}