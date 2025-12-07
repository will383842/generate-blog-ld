import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Download, Filter } from 'lucide-react';

export default function Coverage() {
  const [platform, setPlatform] = useState('all');
  
  const languages = ['FR', 'EN', 'ES', 'DE', 'PT', 'RU', 'AR', 'ZH', 'HI'];
  const countries = ['France', 'USA', 'Spain', 'Germany', 'Portugal', 'Russia', 'UAE', 'China', 'India'];

  const getCellColor = (count: number) => {
    if (count > 300) return 'bg-green-500 hover:bg-green-600';
    if (count > 100) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="all">Toutes les plateformes</option>
                <option value="sos-expat">SOS-Expat</option>
                <option value="ulixai">Ulixai</option>
                <option value="ulysse">Ulysse.AI</option>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice de Couverture Pays × Langues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-50 sticky left-0 z-10">Pays</th>
                  {languages.map((lang) => (
                    <th key={lang} className="border border-gray-300 p-2 bg-gray-50 text-center min-w-[80px]">
                      {lang}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 bg-gray-50 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((country) => (
                  <tr key={country} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium bg-white sticky left-0 z-10">
                      {country}
                    </td>
                    {languages.map((lang) => {
                      const count = Math.floor(Math.random() * 500);
                      return (
                        <td key={lang} className="border border-gray-300 p-0">
                          <button
                            className={`w-full h-full p-2 text-white font-medium transition-colors ${getCellColor(count)}`}
                            onClick={() => alert(`${country} - ${lang}: ${count} articles`)}
                          >
                            {count}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 p-2 text-center font-bold">
                      {Math.floor(Math.random() * 3000 + 1000)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">&gt; 300 articles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">100-300 articles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">&lt; 100 articles</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}