/**
 * Coverage Countries Page - AVEC TOGGLE 3 VUES
 * Detailed coverage view for all 197 countries
 * Views: Table (default) | Grid (intelligent) | List (intelligent)
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
  Languages,
  FileText,
  Table as TableIcon,
  Grid3x3,
  List,
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
import { QuickGenerateButton } from '@/components/coverage/QuickGenerate';
import { IntelligentCountriesGrid } from '@/pages/coverage/IntelligentCountriesGrid';
import { IntelligentCountriesList } from '@/pages/coverage/IntelligentCountriesList';
import { useCoverageCountries, useCoverageGaps } from '@/hooks/useCoverage';
import type { CountryCoverage, CoverageStatus, CoverageGap } from '@/types/coverage';

const REGIONS = [
  { value: 'all', label: 'Toutes les régions' },
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'Amérique du Nord' },
  { value: 'south-america', label: 'Amérique du Sud' },
  { value: 'asia', label: 'Asie' },
  { value: 'africa', label: 'Afrique' },
  { value: 'oceania', label: 'Océanie' },
  { value: 'middle-east', label: 'Moyen-Orient' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'complete', label: 'Complet (90%+)' },
  { value: 'partial', label: 'Partiel (50-90%)' },
  { value: 'minimal', label: 'Minimal (10-50%)' },
  { value: 'missing', label: 'Manquant (<10%)' },
];

type SortField = 'name' | 'percentage' | 'articles' | 'languages';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'grid' | 'list';

export default function CoverageCountriesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<CoverageStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  const { data: countriesData, isLoading } = useCoverageCountries({
    region: regionFilter !== 'all' ? regionFilter : undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
  });

  const { data: gapsData } = useCoverageGaps({
    countryIds: selectedCountryId ? [selectedCountryId] : undefined,
  });

  const countries = countriesData?.data || [];
  const countryGaps = gapsData?.data || [];

  // Filter and sort
  const filteredCountries = useMemo(() => {
    let result = [...countries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.countryName.toLowerCase().includes(query) ||
          c.countryId.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      switch (sortField) {
        case 'name':
          aVal = a.countryName;
          bVal = b.countryName;
          break;
        case 'percentage':
          aVal = a.percentage;
          bVal = b.percentage;
          break;
        case 'articles':
          aVal = a.totalArticles;
          bVal = b.totalArticles;
          break;
        case 'languages':
          aVal = Object.keys(a.byLanguage).length;
          bVal = Object.keys(b.byLanguage).length;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

    return result;
  }, [countries, searchQuery, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const total = countries.length;
    const complete = countries.filter((c) => c.percentage >= 90).length;
    const partial = countries.filter((c) => c.percentage >= 50 && c.percentage < 90).length;
    const minimal = countries.filter((c) => c.percentage >= 10 && c.percentage < 50).length;
    const missing = countries.filter((c) => c.percentage < 10).length;
    return { total, complete, partial, minimal, missing };
  }, [countries]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCountryClick = (country: CountryCoverage) => {
    navigate(`/coverage/countries/${country.countryId}`);
  };

  const getCoverageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 50) return 'text-amber-600';
    if (percentage >= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCoverageBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="default">Complet</Badge>;
    if (percentage >= 50) return <Badge variant="secondary">Partiel</Badge>;
    if (percentage >= 10) return <Badge>Minimal</Badge>;
    return <Badge variant="destructive">Manquant</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Couverture par pays
          </h1>
          <p className="text-muted-foreground">
            Analyse détaillée des 197 pays
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <QuickGenerateButton gaps={countryGaps} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Complet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complete}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              Partiel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Minimal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.minimal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Manquant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.missing}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des pays</CardTitle>
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
                  Grille
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  Liste
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CoverageStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Render based on view mode */}
          {viewMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Pays
                      {sortField === 'name' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('percentage')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Couverture
                      {sortField === 'percentage' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('articles')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Articles
                      {sortField === 'articles' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('languages')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Langues
                      {sortField === 'languages' && <ArrowUpDown className="w-3 h-3" />}
                    </button>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCountries.map((country, idx) => (
                  <TableRow
                    key={country.countryId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCountryClick(country)}
                  >
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {country.flag && <span className="mr-2">{country.flag}</span>}
                      {country.countryName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <ProgressBar value={country.percentage} className="h-2" />
                        <span className={cn('text-sm font-medium', getCoverageColor(country.percentage))}>
                          {country.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{country.totalArticles}</TableCell>
                    <TableCell>{Object.keys(country.byLanguage).length}</TableCell>
                    <TableCell>{getCoverageBadge(country.percentage)}</TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {viewMode === 'grid' && (
            <IntelligentCountriesGrid countries={filteredCountries} onCountryClick={handleCountryClick} />
          )}

          {viewMode === 'list' && (
            <IntelligentCountriesList countries={filteredCountries} onCountryClick={handleCountryClick} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
