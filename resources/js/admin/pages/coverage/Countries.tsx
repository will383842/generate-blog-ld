/**
 * Coverage Countries Page
 * Detailed coverage view for all 197 countries
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

export default function CoverageCountriesPage() {
  const navigate = useNavigate();
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
            <Globe className="w-6 h-6" />
            Couverture par pays
          </h1>
          <p className="text-muted-foreground">
            Analyse détaillée pour {stats.total} pays
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <QuickGenerateButton gaps={countryGaps} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total pays</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
            <p className="text-xs text-muted-foreground">Complets (90%+)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
            <p className="text-xs text-muted-foreground">Partiels (50-90%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-600">{stats.minimal}</p>
            <p className="text-xs text-muted-foreground">Minimaux (10-50%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
            <p className="text-xs text-muted-foreground">Manquants (&lt;10%)</p>
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
              placeholder="Rechercher un pays..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CoverageStatus | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Pays
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Région</TableHead>
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
                onClick={() => handleSort('languages')}
              >
                <div className="flex items-center gap-1">
                  Langues
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Manquant</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-6 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCountries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun pays trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredCountries.map((country) => (
                <TableRow
                  key={country.countryId}
                  className={cn(
                    'cursor-pointer hover:bg-gray-50',
                    selectedCountryId === country.countryId && 'bg-primary/5'
                  )}
                  onClick={() => setSelectedCountryId(
                    selectedCountryId === country.countryId ? null : country.countryId
                  )}
                >
                  <TableCell>
                    <span className="font-medium">{country.countryName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{country.region}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={country.percentage}
                        className="w-24 h-2"
                        indicatorClassName={getStatusColor(country.percentage)}
                      />
                      <span className="text-sm font-medium w-12">
                        {country.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {country.totalArticles}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      {Object.keys(country.byLanguage).length}
                    </div>
                  </TableCell>
                  <TableCell>
                    {country.missingLanguages.length > 0 && (
                      <div className="flex gap-1">
                        {country.missingLanguages.slice(0, 3).map((lang) => (
                          <Badge key={lang} variant="outline" className="text-red-600">
                            {lang.toUpperCase()}
                          </Badge>
                        ))}
                        {country.missingLanguages.length > 3 && (
                          <Badge variant="outline">
                            +{country.missingLanguages.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/coverage/countries/${country.countryId}`);
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selected Country Detail */}
      {selectedCountryId && (
        <CountryDetail
          country={countries.find((c) => c.countryId === selectedCountryId)!}
          gaps={countryGaps}
          onClose={() => setSelectedCountryId(null)}
        />
      )}
    </div>
  );
}

function CountryDetail({
  country,
  gaps,
  onClose,
}: {
  country: CountryCoverage;
  gaps: CoverageGap[];
  onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{country.countryName}</CardTitle>
        <div className="flex gap-2">
          <QuickGenerateButton gaps={gaps} />
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          {/* By Language */}
          <div>
            <h4 className="font-medium mb-3">Par langue</h4>
            <div className="space-y-2">
              {Object.entries(country.byLanguage).map(([lang, count]) => (
                <div key={lang} className="flex items-center justify-between">
                  <span className="text-sm">{lang.toUpperCase()}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {country.missingLanguages.map((lang) => (
                <div key={lang} className="flex items-center justify-between text-red-600">
                  <span className="text-sm">{lang.toUpperCase()}</span>
                  <Badge className="bg-red-100 text-red-700">Manquant</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* By Content Type */}
          <div>
            <h4 className="font-medium mb-3">Par type</h4>
            <div className="space-y-2">
              {Object.entries(country.byContentType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {country.missingTypes.map((type) => (
                <div key={type} className="flex items-center justify-between text-red-600">
                  <span className="text-sm">{type}</span>
                  <Badge className="bg-red-100 text-red-700">Manquant</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps */}
          <div>
            <h4 className="font-medium mb-3">Lacunes à combler</h4>
            {gaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune lacune identifiée</p>
            ) : (
              <div className="space-y-2">
                {gaps.slice(0, 5).map((gap) => (
                  <div key={gap.id} className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">{gap.languageId.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {gap.estimatedArticles} articles estimés
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
