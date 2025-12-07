import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  FileText,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/StatCard';
import { CoverageHeatmap, CountryCoverage } from '@/components/Maps/CoverageHeatmap';
import { CountryDetails, CountryDetailsData, ContentGap } from '@/components/coverage/CountryDetails';
import { LineChart } from '@/components/Charts/LineChart';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useCoverageHeatmap, useCoverageGaps } from '@/hooks/useStats';

export default function SOSExpatDashboard() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryDetailsData, setCountryDetailsData] = useState<CountryDetailsData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch real data from APIs
  const {
    isLoading,
    refetch,
    isRefetching,
    overview,
    countryCoverage: platformCoverage,
    topCountries: apiTopCountries,
    gaps: apiGaps,
    evolution: apiEvolution,
  } = usePlatformStats();

  const { data: heatmapData } = useCoverageHeatmap();
  const { data: gapsData } = useCoverageGaps('sos-expat');

  // Transform coverage data for heatmap
  const coverageData = useMemo((): CountryCoverage[] => {
    if (heatmapData?.data) {
      return heatmapData.data.map((item: { country_code: string; country_name: string; coverage: number; articles: number; flag?: string }) => ({
        countryCode: item.country_code,
        countryName: item.country_name,
        coverage: item.coverage,
        articles: item.articles,
        flag: item.flag || '',
      }));
    }
    // Fallback to platform coverage
    return platformCoverage.map((c) => ({
      countryCode: c.countryCode,
      countryName: c.countryName,
      coverage: c.coveragePercent,
      articles: c.totalArticles,
      flag: c.flag,
    }));
  }, [heatmapData, platformCoverage]);

  // Transform top countries
  const topCountries = useMemo(() => {
    return apiTopCountries.map((c, i) => ({
      rank: i + 1,
      code: c.countryCode,
      name: c.countryName,
      flag: c.flag,
      articles: c.articlesCount,
      growth: c.growthPercent,
    }));
  }, [apiTopCountries]);

  // Transform gaps data
  const priorityGaps = useMemo(() => {
    const gaps = gapsData?.data || apiGaps;
    return gaps.slice(0, 5).map((g: { id: string; countryName?: string; country?: string; language: string; theme: string; priority: string; estimatedTraffic?: number }) => ({
      id: g.id,
      country: g.countryName || g.country || '',
      language: g.language,
      theme: g.theme,
      priority: g.priority as 'high' | 'medium' | 'low',
      traffic: g.estimatedTraffic || 0,
    }));
  }, [gapsData, apiGaps]);

  // Transform evolution data
  const evolutionData = useMemo(() => {
    return apiEvolution.map((e) => ({
      date: e.date,
      articles: e.articles,
      coverage: 0, // Calculate from total if needed
    }));
  }, [apiEvolution]);

  const handleCountryClick = useCallback((country: CountryCoverage) => {
    setSelectedCountry(country.countryCode);

    // Build details from available data
    setCountryDetailsData({
      countryCode: country.countryCode,
      countryName: country.countryName,
      flag: country.flag || '🏳️',
      totalArticles: country.articles,
      publishedArticles: Math.floor(country.articles * 0.85),
      overallCoverage: country.coverage,
      languageCoverage: [],
      contentTypeCoverage: [],
      topThemes: [],
      gaps: [],
      lastPublished: new Date().toISOString(),
    });

    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCountry(null);
  };

  const handleGenerateMissing = useCallback((countryCode: string, gaps: ContentGap[]) => {
    // Navigate to generation page with pre-filled data
    navigate('/generation', {
      state: {
        prefill: {
          country: countryCode,
          gaps: gaps.map((g) => ({ theme: g.theme, language: g.language })),
        },
      },
    });
  }, [navigate]);

  const handleGenerateAllGaps = () => {
    // Navigate to bulk generation with all gaps
    navigate('/generation/bulk', {
      state: {
        prefill: {
          platform: 'sos-expat',
          gaps: priorityGaps,
        },
      },
    });
  };

  const stats = useMemo(() => {
    if (overview) {
      return {
        totalArticles: overview.totalArticles,
        avgCoverage: overview.avgCoveragePercent,
        countriesCovered: overview.totalCountries,
      };
    }
    const totalArticles = coverageData.reduce((sum, c) => sum + c.articles, 0);
    const avgCoverage = coverageData.length > 0
      ? coverageData.reduce((sum, c) => sum + c.coverage, 0) / coverageData.length
      : 0;
    const countriesCovered = coverageData.filter((c) => c.coverage > 0).length;
    return { totalArticles, avgCoverage, countriesCovered };
  }, [overview, coverageData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SOS-Expat</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard couverture internationale
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Articles Total"
          value={stats.totalArticles.toLocaleString('fr-FR')}
          icon={FileText}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Couverture Moyenne"
          value={`${stats.avgCoverage.toFixed(1)}%`}
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Pays Couverts"
          value={`${stats.countriesCovered}/197`}
          icon={Globe}
        />
        <StatCard
          title="Lacunes Prioritaires"
          value={priorityGaps.filter((g: { priority: string }) => g.priority === 'high').length.toString()}
          icon={AlertTriangle}
          className="border-orange-200 bg-orange-50"
        />
      </div>

      {/* Map and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Carte de Couverture
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CoverageHeatmap
              data={coverageData}
              onCountryClick={handleCountryClick}
              selectedCountry={selectedCountry}
              height={450}
            />
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map((country) => (
                <div
                  key={country.code}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2"
                  onClick={() => handleCountryClick({
                    countryCode: country.code,
                    countryName: country.name,
                    coverage: 75,
                    articles: country.articles,
                    flag: country.flag,
                  })}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">
                      #{country.rank}
                    </span>
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {country.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{country.articles}</span>
                    <span className={`text-xs font-medium ${
                      country.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {country.growth >= 0 ? '↑' : '↓'}{Math.abs(country.growth)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Gaps and Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Gaps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Lacunes Prioritaires
            </CardTitle>
            <Button size="sm" onClick={handleGenerateAllGaps}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityGaps.map((gap: { id: string; country: string; theme: string; language: string; priority: string; traffic: number }) => (
                <div
                  key={gap.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{gap.country}</p>
                    <p className="text-sm text-muted-foreground">
                      {gap.theme} • {gap.language}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        gap.priority === 'high' ? 'bg-red-100 text-red-700' :
                        gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }
                    >
                      {gap.priority}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~{gap.traffic.toLocaleString()} trafic
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Évolution (30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={evolutionData}
              series={[
                { dataKey: 'articles', name: 'Articles', color: '#3B82F6' },
                { dataKey: 'coverage', name: 'Couverture %', color: '#10B981' },
              ]}
              xAxisKey="date"
              height={280}
              xAxisFormatter={(value) => {
                const date = new Date(value);
                return date.getDate().toString();
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Country Details Sidebar */}
      <CountryDetails
        data={countryDetailsData}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onGenerateMissing={handleGenerateMissing}
      />
    </div>
  );
}
