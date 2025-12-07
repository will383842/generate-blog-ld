import { X, Globe, FileText, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface LanguageCoverage {
  code: string;
  name: string;
  flag: string;
  articles: number;
  coverage: number;
}

export interface ContentTypeCoverage {
  type: string;
  name: string;
  count: number;
  coverage: number;
}

export interface TopTheme {
  id: number;
  name: string;
  articles: number;
}

export interface ContentGap {
  id: string;
  theme: string;
  language: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTraffic: number;
}

export interface CountryDetailsData {
  countryCode: string;
  countryName: string;
  flag: string;
  totalArticles: number;
  publishedArticles: number;
  overallCoverage: number;
  languageCoverage: LanguageCoverage[];
  contentTypeCoverage: ContentTypeCoverage[];
  topThemes: TopTheme[];
  gaps: ContentGap[];
  lastPublished?: string;
}

export interface CountryDetailsProps {
  data: CountryDetailsData | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateMissing?: (countryCode: string, gaps: ContentGap[]) => void;
  className?: string;
}

export function CountryDetails({
  data,
  isOpen,
  onClose,
  onGenerateMissing,
  className,
}: CountryDetailsProps) {
  if (!data) return null;

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  const handleGenerateMissing = () => {
    if (onGenerateMissing) {
      onGenerateMissing(data.countryCode, data.gaps);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{data.flag}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{data.countryName}</h2>
              <p className="text-sm text-muted-foreground">{data.countryCode}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] p-4 space-y-6">
          {/* Overall stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{data.totalArticles}</p>
              <p className="text-xs text-blue-600">Articles total</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{data.overallCoverage}%</p>
              <p className="text-xs text-green-600">Couverture</p>
            </div>
          </div>

          {/* Language breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Couverture par langue
            </h3>
            <div className="space-y-3">
              {data.languageCoverage.map((lang) => (
                <div key={lang.code} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span className="text-gray-700">{lang.name}</span>
                    </span>
                    <span className="font-medium">
                      {lang.articles} ({lang.coverage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        lang.coverage >= 80 ? 'bg-green-500' :
                        lang.coverage >= 50 ? 'bg-yellow-500' :
                        lang.coverage >= 20 ? 'bg-orange-500' :
                        'bg-red-500'
                      )}
                      style={{ width: `${lang.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content type breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Par type de contenu
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {data.contentTypeCoverage.map((ct) => (
                <div
                  key={ct.type}
                  className="bg-gray-50 rounded-lg p-3 text-center"
                >
                  <p className="text-lg font-bold text-gray-900">{ct.count}</p>
                  <p className="text-xs text-muted-foreground">{ct.name}</p>
                  <p className="text-xs text-blue-600">{ct.coverage}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top themes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Top thèmes
            </h3>
            <div className="space-y-2">
              {data.topThemes.map((theme, index) => (
                <div
                  key={theme.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{theme.name}</span>
                  </div>
                  <Badge variant="secondary">{theme.articles}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Content gaps */}
          {data.gaps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Lacunes identifiées ({data.gaps.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.gaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="bg-gray-50 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{gap.theme}</p>
                        <p className="text-xs text-muted-foreground">
                          Langue : {gap.language}
                        </p>
                      </div>
                      <Badge className={priorityColors[gap.priority]}>
                        {gap.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Trafic estimé : {gap.estimatedTraffic.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          {data.gaps.length > 0 && (
            <Button
              onClick={handleGenerateMissing}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générer le contenu manquant ({data.gaps.length})
            </Button>
          )}

          {/* Last published */}
          {data.lastPublished && (
            <p className="text-xs text-muted-foreground text-center">
              Dernière publication : {new Date(data.lastPublished).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default CountryDetails;