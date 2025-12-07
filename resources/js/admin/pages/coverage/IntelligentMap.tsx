/**
 * INTELLIGENT COVERAGE - WORLD MAP
 * 
 * Carte mondiale interactive affichant les scores de couverture
 * par pays avec filtrage par composante et plateforme.
 * 
 * Fonctionnalités:
 * - Carte mondiale avec tous les 197 pays
 * - Couleurs selon le score (Global, Recrutement, Notoriété, Fondateur)
 * - Filtrage par plateforme (SOS-Expat, Ulixai, Ulysse.AI)
 * - Statistiques en temps réel
 * - Top pays et pays critiques
 * - Navigation vers détails du pays
 * - Export des données
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Map,
  BarChart3,
  Users,
  Megaphone,
  Crown,
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { CoverageHeatmap } from '@/components/Maps/CoverageHeatmap';
import type { CountryCoverage } from '@/components/Maps/CoverageHeatmap';
import { useCoverageCountries, useCoverageDashboard } from '@/hooks/useIntelligentCoverage';
import type { CountryListItem, CoverageStatus } from '@/types/intelligentCoverage';

// ============================================================================
// TYPES
// ============================================================================

type ScoreMode = 'overall' | 'recruitment' | 'awareness' | 'founder';
type PlatformFilter = 1 | 2 | 3; // SOS-Expat, Ulixai, Ulysse.AI

interface ScoreModeConfig {
  id: ScoreMode;
  label: string;
  icon: typeof Globe;
  description: string;
  weight?: string;
  color: string;
  bgColor: string;
}

interface PlatformConfig {
  id: PlatformFilter;
  code: string;
  name: string;
  color: string;
  bgColor: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCORE_MODES: ScoreModeConfig[] = [
  {
    id: 'overall',
    label: 'Score Global',
    icon: Globe,
    description: 'Score pondéré combinant les 3 composantes',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'recruitment',
    label: 'Recrutement',
    icon: Users,
    description: 'Couverture des spécialités/services',
    weight: '55%',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    id: 'awareness',
    label: 'Notoriété',
    icon: Megaphone,
    description: 'Articles de notoriété plateforme',
    weight: '35%',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'founder',
    label: 'Fondateur',
    icon: Crown,
    description: 'Couverture Williams Jullin',
    weight: '10%',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
];

const PLATFORMS: PlatformConfig[] = [
  { id: 1, code: 'sos-expat', name: 'SOS-Expat', color: 'text-red-600', bgColor: 'bg-red-100' },
  { id: 2, code: 'ulixai', name: 'Ulixai', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 3, code: 'ulysse', name: 'Ulysse.AI', color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

const STATUS_CONFIG: Record<CoverageStatus, { label: string; color: string; bgColor: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' },
  good: { label: 'Bon', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  partial: { label: 'Partiel', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  minimal: { label: 'Minimal', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  missing: { label: 'Manquant', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// ============================================================================
// HELPERS
// ============================================================================

function getScoreFromMode(country: CountryListItem, mode: ScoreMode): number {
  switch (mode) {
    case 'recruitment':
      return country.recruitment_score;
    case 'awareness':
      return country.awareness_score;
    case 'founder':
      return country.founder_score;
    default:
      return country.overall_score;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#3b82f6'; // blue-500
  if (score >= 40) return '#eab308'; // yellow-500
  if (score >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function getStatusFromScore(score: number): CoverageStatus {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'partial';
  if (score >= 20) return 'minimal';
  return 'missing';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function IntelligentMap() {
  const { t } = useTranslation('intelligentCoverage');
  const navigate = useNavigate();

  // State
  const [platformId, setPlatformId] = useState<PlatformFilter>(1);
  const [scoreMode, setScoreMode] = useState<ScoreMode>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Data
  const { data: countriesData, isLoading, refetch } = useCoverageCountries({ platform_id: platformId });
  const { data: dashboardData } = useCoverageDashboard(platformId);

  const countries = countriesData?.data || [];
  const dashboard = dashboardData?.data;

  // Transform data for heatmap
  const mapData: CountryCoverage[] = useMemo(() => {
    return countries.map((country) => ({
      countryCode: country.code,
      countryName: country.name,
      coverage: getScoreFromMode(country, scoreMode),
      articles: country.published_articles,
      flag: country.flag,
    }));
  }, [countries, scoreMode]);

  // Filtered and sorted countries for sidebar
  const filteredCountries = useMemo(() => {
    let result = [...countries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => getScoreFromMode(b, scoreMode) - getScoreFromMode(a, scoreMode));
  }, [countries, searchQuery, scoreMode]);

  // Statistics
  const stats = useMemo(() => {
    if (countries.length === 0) return null;

    const scores = countries.map((c) => getScoreFromMode(c, scoreMode));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const excellent = countries.filter((c) => getScoreFromMode(c, scoreMode) >= 80).length;
    const good = countries.filter((c) => getScoreFromMode(c, scoreMode) >= 60 && getScoreFromMode(c, scoreMode) < 80).length;
    const partial = countries.filter((c) => getScoreFromMode(c, scoreMode) >= 40 && getScoreFromMode(c, scoreMode) < 60).length;
    const minimal = countries.filter((c) => getScoreFromMode(c, scoreMode) >= 20 && getScoreFromMode(c, scoreMode) < 40).length;
    const missing = countries.filter((c) => getScoreFromMode(c, scoreMode) < 20).length;

    return { avgScore, excellent, good, partial, minimal, missing, total: countries.length };
  }, [countries, scoreMode]);

  // Top and critical countries
  const topCountries = useMemo(() => {
    return [...countries]
      .sort((a, b) => getScoreFromMode(b, scoreMode) - getScoreFromMode(a, scoreMode))
      .slice(0, 5);
  }, [countries, scoreMode]);

  const criticalCountries = useMemo(() => {
    return [...countries]
      .filter((c) => c.priority_score > 50) // High priority countries
      .sort((a, b) => getScoreFromMode(a, scoreMode) - getScoreFromMode(b, scoreMode))
      .slice(0, 5);
  }, [countries, scoreMode]);

  // Handlers
  const handleCountryClick = useCallback((country: CountryCoverage) => {
    setSelectedCountry(country.countryCode);
    // Find country ID from code
    const countryData = countries.find((c) => c.code === country.countryCode);
    if (countryData) {
      navigate(`/coverage/intelligent/countries/${countryData.id}`);
    }
  }, [countries, navigate]);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['Pays', 'Code', 'Score Global', 'Recrutement', 'Notoriété', 'Fondateur', 'Articles Publiés', 'Status'].join(','),
      ...countries.map((c) =>
        [
          c.name,
          c.code,
          c.overall_score.toFixed(1),
          c.recruitment_score.toFixed(1),
          c.awareness_score.toFixed(1),
          c.founder_score.toFixed(1),
          c.published_articles,
          c.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intelligent-coverage-${platformId}-${scoreMode}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [countries, platformId, scoreMode]);

  const currentPlatform = PLATFORMS.find((p) => p.id === platformId);
  const currentMode = SCORE_MODES.find((m) => m.id === scoreMode);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/coverage/intelligent')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', currentMode?.bgColor)}>
                  <Map className={cn('w-5 h-5', currentMode?.color)} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Carte Mondiale de Couverture
                  </h1>
                  <p className="text-sm text-gray-500">
                    {currentPlatform?.name} • {currentMode?.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Layers className="w-4 h-4 mr-2" />
                {showSidebar ? 'Masquer' : 'Afficher'} panneau
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-6">
            {/* Platform Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Plateforme:</span>
              <div className="flex gap-1">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform.id}
                    variant={platformId === platform.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlatformId(platform.id)}
                    className={cn(
                      'min-w-[100px]',
                      platformId === platform.id && platform.bgColor.replace('bg-', 'bg-')
                    )}
                  >
                    {platform.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Score Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Affichage:</span>
              <div className="flex gap-1">
                {SCORE_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <TooltipProvider key={mode.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={scoreMode === mode.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setScoreMode(mode.id)}
                            className="gap-2"
                          >
                            <Icon className="w-4 h-4" />
                            {mode.label}
                            {mode.weight && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {mode.weight}
                              </Badge>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{mode.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Map Area */}
        <div className={cn('flex-1 relative', showSidebar ? 'mr-80' : '')}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Chargement de la carte...</p>
              </div>
            </div>
          ) : (
            <>
              <CoverageHeatmap
                data={mapData}
                onCountryClick={handleCountryClick}
                selectedCountry={selectedCountry}
                height="100%"
                className="w-full h-full"
              />

              {/* Stats Overlay */}
              {stats && (
                <div className="absolute top-4 left-4 z-[1000]">
                  <Card className="w-64 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Statistiques {currentMode?.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Score moyen</span>
                        <span className="text-lg font-bold" style={{ color: getScoreColor(stats.avgScore) }}>
                          {stats.avgScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Excellent (≥80%)
                          </span>
                          <span className="font-medium">{stats.excellent}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            Bon (60-79%)
                          </span>
                          <span className="font-medium">{stats.good}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            Partiel (40-59%)
                          </span>
                          <span className="font-medium">{stats.partial}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            Minimal (20-39%)
                          </span>
                          <span className="font-medium">{stats.minimal}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Manquant (&lt;20%)
                          </span>
                          <span className="font-medium">{stats.missing}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total pays</span>
                          <span className="font-bold">{stats.total}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Mode Info */}
              <div className="absolute bottom-4 right-4 z-[1000]">
                <Card className="shadow-lg">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Cliquez sur un pays pour voir les détails
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-hidden flex flex-col fixed right-0 top-[140px] bottom-0 z-40">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Top Countries */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-500" />
                Top 5 Pays
              </h3>
              <div className="space-y-2">
                {topCountries.map((country, index) => {
                  const score = getScoreFromMode(country, scoreMode);
                  return (
                    <button
                      key={country.id}
                      onClick={() => navigate(`/coverage/intelligent/countries/${country.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-lg font-bold text-gray-400 w-5">
                        {index + 1}
                      </span>
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {country.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {country.published_articles} articles
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-bold"
                          style={{ color: getScoreColor(score) }}
                        >
                          {score.toFixed(0)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Critical Countries */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Pays Prioritaires à Améliorer
              </h3>
              <div className="space-y-2">
                {criticalCountries.length > 0 ? (
                  criticalCountries.map((country) => {
                    const score = getScoreFromMode(country, scoreMode);
                    return (
                      <button
                        key={country.id}
                        onClick={() => navigate(`/coverage/intelligent/countries/${country.id}`)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition-colors text-left border border-red-100"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {country.name}
                          </p>
                          <p className="text-xs text-red-600">
                            Priorité: {country.priority_score}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            {score.toFixed(0)}%
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Aucun pays critique
                  </p>
                )}
              </div>
            </div>

            {/* All Countries List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Tous les pays ({filteredCountries.length})
                </h3>
                <div className="space-y-1">
                  {filteredCountries.map((country) => {
                    const score = getScoreFromMode(country, scoreMode);
                    const status = getStatusFromScore(score);
                    const statusConfig = STATUS_CONFIG[status];

                    return (
                      <button
                        key={country.id}
                        onClick={() => navigate(`/coverage/intelligent/countries/${country.id}`)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left',
                          selectedCountry === country.code && 'bg-blue-50 ring-1 ring-blue-200'
                        )}
                      >
                        <span className="text-lg">{country.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {country.name}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            'text-xs',
                            statusConfig.bgColor,
                            statusConfig.color
                          )}
                        >
                          {score.toFixed(0)}%
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/coverage/intelligent/countries')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Voir liste complète
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
