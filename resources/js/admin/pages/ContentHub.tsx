import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { CONTENT_TYPES, ContentType } from '@/types';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContentHub() {
  const [activeTab, setActiveTab] = useState<ContentType>('article');
  const [searchQuery, setSearchQuery] = useState('');

  const activeType = CONTENT_TYPES.find(t => t.id === activeTab)!;

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
    green: 'border-green-500 bg-green-50 text-green-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    red: 'border-red-500 bg-red-50 text-red-700',
    cyan: 'border-cyan-500 bg-cyan-50 text-cyan-700',
    orange: 'border-orange-500 bg-orange-50 text-orange-700',
    indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  };

  const mockArticles = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Article ${i + 1} - ${activeType.name}`,
    country: 'France 🇫🇷',
    language: 'FR',
    status: i % 3 === 0 ? 'draft' : 'published',
    quality_score: 75 + Math.floor(Math.random() * 25),
    created_at: new Date(Date.now() - i * 86400000).toLocaleDateString('fr-FR'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Gérez tous vos types de contenu</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau contenu
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={cn(
                  'px-6 py-4 font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === type.id
                    ? colorClasses[type.color as keyof typeof colorClasses]
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <span className="mr-2">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <Select defaultValue="all">
                <option value="all">Toutes plateformes</option>
                <option value="sos-expat">SOS-Expat</option>
                <option value="ulixai">Ulixai</option>
              </Select>
              <Select defaultValue="all">
                <option value="all">Toutes langues</option>
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-900">45</p>
              <p className="text-sm text-yellow-700">Brouillons</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">1,189</p>
              <p className="text-sm text-green-700">Publiés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2">{activeType.icon}</span>
            Liste des {activeType.name}s
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Titre</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Pays</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Langue</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Statut</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Qualité</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockArticles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{article.title}</td>
                    <td className="p-3 text-sm text-gray-600">{article.country}</td>
                    <td className="p-3 text-sm text-gray-600">{article.language}</td>
                    <td className="p-3">
                      <Badge variant={article.status === 'published' ? 'success' : 'warning'}>
                        {article.status === 'published' ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className={`h-2 rounded-full ${
                              article.quality_score > 80 ? 'bg-green-500' :
                              article.quality_score > 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${article.quality_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{article.quality_score}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{article.created_at}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">
                        Modifier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}