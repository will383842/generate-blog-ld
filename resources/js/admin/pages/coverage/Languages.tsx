/**
 * Coverage Languages Page - AVEC TOGGLE 2 VUES
 * Detailed coverage view for all languages
 * Views: Table (default) | Intelligent Grid
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Languages as LanguagesIcon,
  Search,
  Download,
  ArrowUpDown,
  Table as TableIcon,
  Grid3x3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { IntelligentLanguages } from '@/pages/coverage/IntelligentLanguages';

type ViewMode = 'table' | 'grid';

// Mock data - remplacer par vraies données
const mockLanguages = [
  { code: 'fr', name: 'Français', articles: 1243, countries: 45, percentage: 85 },
  { code: 'en', name: 'English', articles: 1189, countries: 52, percentage: 92 },
  { code: 'es', name: 'Español', articles: 987, countries: 38, percentage: 78 },
  { code: 'de', name: 'Deutsch', articles: 856, countries: 28, percentage: 68 },
  { code: 'it', name: 'Italiano', articles: 745, countries: 22, percentage: 62 },
];

export default function LanguagesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = mockLanguages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LanguagesIcon className="w-6 h-6" />
            Couverture par langue
          </h1>
          <p className="text-muted-foreground">
            Analyse détaillée des langues disponibles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des langues</CardTitle>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-2"
                >
                  <TableIcon className="w-4 h-4" />
                  Tableau
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="gap-2"
                >
                  <Grid3x3 className="w-4 h-4" />
                  Intelligent
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une langue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Langue</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Couverture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLanguages.map((lang) => (
                  <TableRow key={lang.code} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{lang.name}</TableCell>
                    <TableCell className="font-mono text-sm">{lang.code}</TableCell>
                    <TableCell>{lang.articles.toLocaleString()}</TableCell>
                    <TableCell>{lang.countries} pays</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={lang.percentage} className="h-2 w-24" />
                        <span className="text-sm font-medium">{lang.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <IntelligentLanguages languages={filteredLanguages} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
