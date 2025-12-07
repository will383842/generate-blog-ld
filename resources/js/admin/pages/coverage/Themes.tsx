/**
 * Coverage Themes Page
 * Coverage analysis by theme/topic
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Globe,
  Languages,
  FileText,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ThemeMatrix } from '@/components/coverage/ThemeMatrix';
import { QuickGenerateButton } from '@/components/coverage/QuickGenerate';
import { useCoverageThemes, useCoverageGaps } from '@/hooks/useCoverage';
import { PLATFORMS } from '@/utils/constants';
import type { ThemeCoverage } from '@/types/coverage';
import type { PlatformId } from '@/types/program';

type SortField = 'name' | 'percentage' | 'articles' | 'countries';
type SortOrder = 'asc' | 'desc';

export default function CoverageThemesPage() {
  const [platformId, setPlatformId] = useState<PlatformId | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const selectedPlatformId = platformId || undefined;

  const { data: themesData, isLoading } = useCoverageThemes({
    platformId: selectedPlatformId,
  });

  const { data: gapsData } = useCoverageGaps({
    themeIds: selectedThemeId ? [selectedThemeId] : undefined,
    perPage: 10,
  });

  const themes = themesData?.data || [];
  const themeGaps = gapsData?.data || [];

  // Filter and sort
  const filteredThemes = useMemo(() => {
    let result = [...themes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.themeName.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      switch (sortField) {
        case 'name':
          aVal = a.themeName;
          bVal = b.themeName;
          break;
        case 'percentage':
          aVal = a.percentage;
          bVal = b.percentage;
          break;
        case 'articles':
          aVal = a.totalArticles;
          bVal = b.totalArticles;
          break;
        case 'countries':
          aVal = Object.keys(a.byCountry).length;
          bVal = Object.keys(b.byCountry).length;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [themes, searchQuery, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const total = themes.length;
    const totalArticles = themes.reduce((sum, t) => sum + t.totalArticles, 0);
    const avgCoverage = themes.length > 0
      ? themes.reduce((sum, t) => sum + t.percentage, 0) / themes.length
      : 0;
    const lowCoverage = themes.filter((t) => t.percentage < 50).length;
    return { total, totalArticles, avgCoverage, lowCoverage };
  }, [themes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Couverture par thème
          </h1>
          <p className="text-muted-foreground">
            Analyse de couverture par thématique
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={platformId} onValueChange={setPlatformId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes les plateformes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les plateformes</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <QuickGenerateButton gaps={themeGaps} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Thèmes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalArticles.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgCoverage.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Couverture moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.lowCoverage}</p>
                <p className="text-xs text-muted-foreground">Faible couverture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un thème..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Theme Table */}
        <div className="col-span-2">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Thème
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('percentage')}
                  >
                    <div className="flex items-center gap-1">
                      Couverture
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('articles')}
                  >
                    <div className="flex items-center gap-1">
                      Articles
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('countries')}
                  >
                    <div className="flex items-center gap-1">
                      Pays
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead>Langues</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <div className="h-6 bg-gray-100 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredThemes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun thème trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredThemes.map((theme) => (
                    <TableRow
                      key={theme.themeId}
                      className={cn(
                        'cursor-pointer hover:bg-gray-50',
                        selectedThemeId === theme.themeId && 'bg-primary/5'
                      )}
                      onClick={() => setSelectedThemeId(
                        selectedThemeId === theme.themeId ? null : theme.themeId
                      )}
                    >
                      <TableCell>
                        <span className="font-medium">{theme.themeName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={theme.percentage}
                            className="w-20 h-2"
                            indicatorClassName={getStatusColor(theme.percentage)}
                          />
                          <span className="text-sm font-medium w-10">
                            {theme.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {theme.totalArticles}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          {Object.keys(theme.byCountry).length}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Languages className="w-4 h-4 text-muted-foreground" />
                          {Object.keys(theme.byLanguage).length}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Theme Detail */}
        <div>
          {selectedThemeId ? (
            <ThemeDetail
              theme={themes.find((t) => t.themeId === selectedThemeId)!}
              gaps={themeGaps}
            />
          ) : (
            <Card>
              <CardContent className="pt-4 text-center text-muted-foreground py-8">
                Sélectionnez un thème pour voir les détails
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice Thèmes × Pays</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeMatrix platformId={selectedPlatformId} />
        </CardContent>
      </Card>
    </div>
  );
}

interface GapItem {
  id: string;
  country?: string;
  theme?: string;
  language?: string;
  priority?: string;
}

function ThemeDetail({
  theme,
  gaps,
}: {
  theme: ThemeCoverage;
  gaps: GapItem[];
}) {
  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Top countries for this theme
  const topCountries = Object.entries(theme.byCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Languages for this theme
  const languages = Object.entries(theme.byLanguage)
    .sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{theme.themeName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Couverture globale</p>
          <div className="flex items-center gap-2">
            <ProgressBar
              value={theme.percentage}
              className="h-3 flex-1"
              indicatorClassName={getStatusColor(theme.percentage)}
            />
            <span className="font-bold">{theme.percentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xl font-bold">{theme.totalArticles}</p>
            <p className="text-xs text-muted-foreground">Articles</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xl font-bold">{Object.keys(theme.byCountry).length}</p>
            <p className="text-xs text-muted-foreground">Pays</p>
          </div>
        </div>

        {/* Top Countries */}
        <div>
          <p className="text-sm font-medium mb-2">Top pays</p>
          <div className="space-y-2">
            {topCountries.map(([countryId, count]) => (
              <div key={countryId} className="flex items-center justify-between">
                <span className="text-sm">{countryId}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <p className="text-sm font-medium mb-2">Par langue</p>
          <div className="flex flex-wrap gap-2">
            {languages.map(([lang, count]) => (
              <Badge key={lang} variant="secondary">
                {lang.toUpperCase()}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Lacunes ({gaps.length})
            </p>
            <div className="space-y-1">
              {gaps.slice(0, 3).map((gap) => (
                <div key={gap.id} className="text-sm p-2 bg-orange-50 rounded">
                  {gap.countryName} - {gap.languageId.toUpperCase()}
                </div>
              ))}
            </div>
            <QuickGenerateButton gaps={gaps} className="w-full mt-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
