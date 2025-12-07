/**
 * Coverage Languages Page
 * Coverage breakdown for all 9 supported languages
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Languages,
  Globe,
  FileText,
  TrendingUp,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { LanguageBreakdown } from '@/components/coverage/LanguageBreakdown';
import { CoverageMatrix } from '@/components/coverage/CoverageMatrix';
import { useCoverageLanguages, useCoverageByLanguage } from '@/hooks/useCoverage';
import { PLATFORMS } from '@/utils/constants';
import type { LanguageCoverage } from '@/types/coverage';
import type { PlatformId } from '@/types/program';

// 9 langues supportées: fr, en, de, es, pt, ru, zh, ar, hi
const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export default function CoverageLanguagesPage() {
  const navigate = useNavigate();
  const [platformId, setPlatformId] = useState<PlatformId | ''>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const selectedPlatformId = platformId || undefined;

  const { data: languagesData, isLoading } = useCoverageLanguages({
    platformId: selectedPlatformId,
  });

  const { data: languageDetailData } = useCoverageByLanguage(selectedLanguage || '');

  const languages = languagesData?.data || [];
  const languageDetail = languageDetailData?.data;

  // Merge with language info
  const languagesWithInfo = useMemo(() => {
    return LANGUAGES.map((lang) => {
      const coverage = languages.find((l) => l.languageId === lang.code);
      return {
        ...lang,
        ...coverage,
        totalArticles: coverage?.totalArticles || 0,
        coveredCountries: coverage?.coveredCountries || 0,
        percentage: coverage?.percentage || 0,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [languages]);

  // Stats
  const stats = useMemo(() => {
    const totalArticles = languagesWithInfo.reduce((sum, l) => sum + l.totalArticles, 0);
    const avgCoverage = languagesWithInfo.reduce((sum, l) => sum + l.percentage, 0) / 9;
    const topLanguage = languagesWithInfo[0];
    const bottomLanguage = languagesWithInfo[languagesWithInfo.length - 1];
    return { totalArticles, avgCoverage, topLanguage, bottomLanguage };
  }, [languagesWithInfo]);

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
            <Languages className="w-6 h-6" />
            Couverture par langue
          </h1>
          <p className="text-muted-foreground">
            Analyse de couverture pour les 9 langues supportées
          </p>
        </div>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">9</p>
                <p className="text-xs text-muted-foreground">Langues</p>
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
                <p className="text-xs text-muted-foreground">Articles total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
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
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.topLanguage?.flag} {stats.topLanguage?.name}
                </p>
                <p className="text-xs text-muted-foreground">Meilleure couverture</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Language Cards */}
        <div className="col-span-2 space-y-4">
          <h2 className="font-semibold">Toutes les langues</h2>
          <div className="grid grid-cols-3 gap-4">
            {languagesWithInfo.map((lang) => (
              <Card
                key={lang.code}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary',
                  selectedLanguage === lang.code && 'border-primary bg-primary/5'
                )}
                onClick={() => setSelectedLanguage(
                  selectedLanguage === lang.code ? null : lang.code
                )}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    <Badge
                      className={cn(
                        lang.percentage >= 90 && 'bg-green-100 text-green-700',
                        lang.percentage >= 50 && lang.percentage < 90 && 'bg-yellow-100 text-yellow-700',
                        lang.percentage < 50 && 'bg-red-100 text-red-700'
                      )}
                    >
                      {lang.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <ProgressBar
                    value={lang.percentage}
                    className="h-2 mb-3"
                    indicatorClassName={getStatusColor(lang.percentage)}
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {lang.totalArticles.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {lang.coveredCountries} pays
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageBreakdown
                platformId={platformId || undefined}
                onLanguageClick={setSelectedLanguage}
              />
            </CardContent>
          </Card>

          {selectedLanguage && languageDetail && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.flag}
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/coverage/languages/${selectedLanguage}`)}
                >
                  Détails
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Couverture</p>
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={languageDetail.percentage}
                        className="h-3 flex-1"
                        indicatorClassName={getStatusColor(languageDetail.percentage)}
                      />
                      <span className="font-bold">{languageDetail.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{languageDetail.totalArticles}</p>
                      <p className="text-xs text-muted-foreground">Articles</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{languageDetail.coveredCountries}</p>
                      <p className="text-xs text-muted-foreground">Pays couverts</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice Langues × Pays</CardTitle>
        </CardHeader>
        <CardContent>
          <CoverageMatrix
            platformId={platformId || undefined}
            initialConfig={{ rowAxis: 'language', colAxis: 'country' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
