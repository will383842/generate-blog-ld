/**
 * Coverage Index Page - AVEC WORLDMAP INTÉGRÉE
 * Global coverage overview with interactive map, stats, and quick actions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Globe,
  Languages,
  Layers,
  Target,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Download,
  Map as MapIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { CoverageStats, CoverageSummaryCards } from '@/components/coverage/CoverageStats';
import { CoverageMatrix } from '@/components/coverage/CoverageMatrix';
import { LanguageBreakdown } from '@/components/coverage/LanguageBreakdown';
import { ObjectivesTracker } from '@/components/coverage/ObjectivesTracker';
import { QuickGenerateButton } from '@/components/coverage/QuickGenerate';
import { IntelligentMap } from '@/pages/coverage/IntelligentMap';
import { WorldMap } from '@/components/Maps/WorldMap';
import type { CountryData } from '@/components/Maps/WorldMap';
import { useCoverageGlobal, useCoverageGaps, useExportCoverageReport } from '@/hooks/useCoverage';
import { PLATFORMS } from '@/utils/constants';
import type { PlatformId } from '@/types/program';

export default function CoverageIndexPage() {
  const navigate = useNavigate();
  const [platformId, setPlatformId] = useState<PlatformId | ''>('');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const selectedPlatformId = platformId || undefined;

  const { data: coverageData } = useCoverageGlobal({ platformId: selectedPlatformId });
  const { data: gapsData } = useCoverageGaps({ priority: ['critical', 'high'], perPage: 5 });
  const exportReport = useExportCoverageReport();

  const summary = coverageData?.data?.summary;
  const countries = coverageData?.data?.countries || [];
  const topCountries = coverageData?.data?.topCountries || [];
  const bottomCountries = coverageData?.data?.bottomCountries || [];
  const recentProgress = coverageData?.data?.recentProgress || [];
  const criticalGaps = gapsData?.data || [];

  // Préparer les données pour la WorldMap
  const mapData: CountryData[] = useMemo(() => {
    return countries.map((country) => ({
      code: country.countryId,
      name: country.countryName,
      value: country.percentage,
      metadata: {
        articles: country.articlesCount,
        languages: country.languagesCount,
      },
    }));
  }, [countries]);

  const handleExport = () => {
    exportReport.mutate({ format: 'xlsx', filters: { platformId: platformId || undefined } });
  };

  const handleCountryClick = (country: CountryData) => {
    navigate(`/coverage/countries?code=${country.code}`);
  };

  const handleCountryHover = (country: CountryData | null) => {
    setHoveredCountry(country?.code || null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Couverture de contenu
          </h1>
          <p className="text-muted-foreground">
            Analyse de la couverture par pays, langue et type de contenu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platformId} onValueChange={(v) => setPlatformId(v as PlatformId | '')}>
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <QuickGenerateButton gaps={criticalGaps} />
        </div>
      </div>

      {/* Main Stats */}
      <CoverageStats platformId={platformId || undefined} />

      {/* Summary Cards */}
      <CoverageSummaryCards platformId={platformId || undefined} />


      {/* WORLDMAP & INTELLIGENT MAP - TABS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="w-5 h-5" />
            Carte de couverture mondiale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="worldmap">
            <TabsList>
              <TabsTrigger value="worldmap">Carte Globale</TabsTrigger>
              <TabsTrigger value="intelligent">Carte Intelligente</TabsTrigger>
            </TabsList>

            <TabsContent value="worldmap" className="mt-4">
              <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span>&lt; 40% couverture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded" />
                  <span>40-79% couverture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span>≥ 80% couverture</span>
                </div>
                <div className="ml-auto text-xs">
                  Cliquez sur un pays pour voir le détail
                </div>
              </div>
              <WorldMap
                data={mapData}
                onCountryClick={handleCountryClick}
                onCountryHover={handleCountryHover}
                height={500}
                showLegend={true}
                colorScale={{
                  low: '#ef4444', // red-500
                  medium: '#f59e0b', // amber-500
                  high: '#22c55e', // green-500
                }}
                thresholds={{
                  low: 40,
                  high: 80,
                }}
              />
            </TabsContent>

            <TabsContent value="intelligent" className="mt-4">
              <IntelligentMap platformId={selectedPlatformId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Coverage Matrix */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Matrice de couverture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CoverageMatrix
                platformId={platformId || undefined}
                initialConfig={{ rowAxis: 'country', colAxis: 'language' }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Language Breakdown */}
        <div>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Par langue
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/coverage/languages')}
              >
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <LanguageBreakdown platformId={platformId || undefined} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Top & Bottom Countries */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Top pays</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/coverage/countries')}
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.slice(0, 5).map((country, index) => (
                <div
                  key={country.countryId}
                  className={cn(
                    "flex items-center justify-between transition-colors rounded-md p-2",
                    hoveredCountry === country.countryId && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-4">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{country.countryName}</span>
                  </div>
                  <Badge
                    className={cn(
                      country.percentage >= 90 && 'bg-green-100 text-green-700',
                      country.percentage >= 50 && country.percentage < 90 && 'bg-yellow-100 text-yellow-700',
                      country.percentage < 50 && 'bg-red-100 text-red-700'
                    )}
                  >
                    {country.percentage.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Critical Gaps */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Lacunes critiques
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/coverage/gaps')}
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {criticalGaps.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Aucune lacune critique
              </div>
            ) : (
              <div className="space-y-3">
                {criticalGaps.slice(0, 5).map((gap) => (
                  <div
                    key={gap.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{gap.countryName}</p>
                      <p className="text-xs text-muted-foreground">
                        {gap.languageId.toUpperCase()} - {gap.estimatedArticles} articles
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        gap.priority === 'critical' && 'bg-red-100 text-red-700',
                        gap.priority === 'high' && 'bg-orange-100 text-orange-700'
                      )}
                    >
                      {gap.priority === 'critical' ? 'Critique' : 'Haute'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objectifs
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/coverage/objectives')}
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            <ObjectivesTracker compact limit={3} />
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      {recentProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ProgressChart data={recentProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickActionCard
          title="Analyser les lacunes"
          description="Identifier les pays et thèmes manquants"
          icon={AlertTriangle}
          onClick={() => navigate('/coverage/gaps')}
        />
        <QuickActionCard
          title="Voir par pays"
          description="Détail de couverture pour 197 pays"
          icon={Globe}
          onClick={() => navigate('/coverage/countries')}
        />
        <QuickActionCard
          title="Voir par thème"
          description="Couverture par thématique"
          icon={Layers}
          onClick={() => navigate('/coverage/themes')}
        />
        <QuickActionCard
          title="Générer du contenu"
          description="Combler les lacunes automatiquement"
          icon={Sparkles}
          onClick={() => navigate('/generation')}
        />
      </div>
    </div>
  );
}

function ProgressChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="flex items-end justify-between h-full gap-1">
      {data.map((item) => (
        <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary rounded-t transition-all"
            style={{ height: `${(item.count / maxCount) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(item.date), 'dd/MM', { locale: fr })}
          </span>
        </div>
      ))}
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: typeof Globe;
  onClick: () => void;
}

function QuickActionCard({ title, description, icon: Icon, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
    >
      <Icon className="w-6 h-6 text-primary mb-2" />
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}
