import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  ExternalLink,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Link as LinkIcon,
  Globe,
  Gauge,
  Clock,
  Eye,
  MousePointer,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  FileText,
  Image as ImageIcon,
  Code,
  ChevronDown,
  ChevronUp,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  useLanding,
  useLandingSections,
  useLandingPerformance,
  useExportLanding,
} from '@/hooks/useLandings';
import { LandingSection, FeaturesSectionConfig, PricingSectionConfig, PartnersSectionConfig } from '@/types/landing';

interface FeatureItem {
  link?: string;
}

interface PlanItem {
  name?: string;
  cta?: { url?: string };
}

interface PartnerItem {
  url?: string;
}

interface SectionConfig {
  features?: FeatureItem[];
  cta?: { url?: string };
  plans?: PlanItem[];
  partners?: PartnerItem[];
}
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type Orientation = 'portrait' | 'landscape';

// Les 9 langues supportées
const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number; label: string }> = {
  desktop: { width: 1440, height: 900, label: 'Desktop (1440×900)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768×1024)' },
  mobile: { width: 375, height: 812, label: 'Mobile (375×812)' },
};

interface LinkCheckResult {
  url: string;
  status: 'ok' | 'broken' | 'pending';
  statusCode?: number;
  section?: string;
}

interface PerformanceMetric {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'bad';
  description?: string;
}

export const LandingPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['landing', 'common']);
  const { showToast } = useToast();

  const landingId = parseInt(id || '0');

  // Queries
  const { data: landing, isLoading } = useLanding(landingId);
  const { data: sections = [] } = useLandingSections(landingId);
  const { data: performance } = useLandingPerformance(landingId);

  // Mutations
  const exportMutation = useExportLanding();

  // State
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [linksCheckOpen, setLinksCheckOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [linkCheckResults, setLinkCheckResults] = useState<LinkCheckResult[]>([]);
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);

  // Initialize language
  useEffect(() => {
    if (landing && !selectedLanguage) {
      setSelectedLanguage(landing.language);
    }
  }, [landing, selectedLanguage]);

  // Calculate scale based on device and container
  useEffect(() => {
    const updateScale = () => {
      const container = document.getElementById('preview-container');
      if (!container) return;

      const containerWidth = container.clientWidth - 48; // padding
      const containerHeight = container.clientHeight - 48;
      const deviceSize = DEVICE_SIZES[device];

      const deviceWidth = orientation === 'landscape' ? deviceSize.height : deviceSize.width;
      const deviceHeight = orientation === 'landscape' ? deviceSize.width : deviceSize.height;

      const scaleX = containerWidth / deviceWidth;
      const scaleY = containerHeight / deviceHeight;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [device, orientation]);

  // Extract all links from sections
  const extractLinks = useMemo(() => {
    const links: { url: string; section: string }[] = [];

    // Add CTA links
    if (landing?.primaryCta?.url) {
      links.push({ url: landing.primaryCta.url, section: 'Primary CTA' });
    }
    if (landing?.secondaryCta?.url) {
      links.push({ url: landing.secondaryCta.url, section: 'Secondary CTA' });
    }

    // Extract from sections
    sections.forEach((section) => {
      const config = section.config as SectionConfig | undefined;

      // Features links
      if (config?.features) {
        config.features.forEach((feature: FeatureItem) => {
          if (feature.link) {
            links.push({ url: feature.link, section: `${section.title} - Features` });
          }
        });
      }

      // CTA links
      if (config?.cta?.url) {
        links.push({ url: config.cta.url, section: section.title });
      }

      // Pricing plan links
      if (config?.plans) {
        config.plans.forEach((plan: PlanItem) => {
          if (plan.cta?.url) {
            links.push({ url: plan.cta.url, section: `${section.title} - ${plan.name}` });
          }
        });
      }

      // Partners links
      if (config?.partners) {
        config.partners.forEach((partner: PartnerItem) => {
          if (partner.url) {
            links.push({ url: partner.url, section: `${section.title} - Partners` });
          }
        });
      }
    });

    return links;
  }, [landing, sections]);

  // Check links
  const checkLinks = useCallback(async () => {
    setIsCheckingLinks(true);
    setLinkCheckResults(
      extractLinks.map((link) => ({
        url: link.url,
        section: link.section,
        status: 'pending',
      }))
    );

    // Simulate link checking (in production, this would call an API)
    for (let i = 0; i < extractLinks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLinkCheckResults((prev) =>
        prev.map((result, index) => {
          if (index === i) {
            // Simulate random results
            const random = Math.random();
            return {
              ...result,
              status: random > 0.1 ? 'ok' : 'broken',
              statusCode: random > 0.1 ? 200 : 404,
            };
          }
          return result;
        })
      );
    }

    setIsCheckingLinks(false);
  }, [extractLinks]);

  // Copy URL
  const handleCopyUrl = useCallback(async () => {
    if (!landing?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(landing.publicUrl);
      setCopied(true);
      showToast(t('common:copied'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [landing?.publicUrl, showToast, t]);

  // Export
  const handleExport = useCallback(
    async (format: 'html' | 'pdf') => {
      if (!landing) return;

      try {
        const result = await exportMutation.mutateAsync({ id: landing.id, format });
        window.open(result.url, '_blank');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [exportMutation, landing, showToast, t]
  );

  // Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Performance metrics
  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    if (!performance) {
      return [
        {
          label: t('landing:performance.views'),
          value: landing?.viewCount || 0,
          icon: <Eye className="h-4 w-4" />,
          status: 'good',
        },
        {
          label: t('landing:performance.avgTime'),
          value: '0s',
          icon: <Clock className="h-4 w-4" />,
          status: 'good',
        },
        {
          label: t('landing:performance.bounceRate'),
          value: '0%',
          icon: <MousePointer className="h-4 w-4" />,
          status: 'good',
        },
        {
          label: t('landing:performance.conversionRate'),
          value: `${landing?.conversionRate || 0}%`,
          icon: <Zap className="h-4 w-4" />,
          status: (landing?.conversionRate || 0) >= 5 ? 'good' : (landing?.conversionRate || 0) >= 2 ? 'warning' : 'bad',
        },
      ];
    }

    return [
      {
        label: t('landing:performance.views'),
        value: performance.views.toLocaleString(),
        icon: <Eye className="h-4 w-4" />,
        status: 'good',
      },
      {
        label: t('landing:performance.avgTime'),
        value: `${Math.round(performance.avgTimeOnPage)}s`,
        icon: <Clock className="h-4 w-4" />,
        status: performance.avgTimeOnPage >= 60 ? 'good' : performance.avgTimeOnPage >= 30 ? 'warning' : 'bad',
        description: performance.avgTimeOnPage >= 60 ? 'Excellent' : performance.avgTimeOnPage >= 30 ? 'Average' : 'Low',
      },
      {
        label: t('landing:performance.bounceRate'),
        value: `${performance.bounceRate.toFixed(1)}%`,
        icon: <MousePointer className="h-4 w-4" />,
        status: performance.bounceRate <= 40 ? 'good' : performance.bounceRate <= 60 ? 'warning' : 'bad',
      },
      {
        label: t('landing:performance.conversionRate'),
        value: `${performance.conversionRate.toFixed(2)}%`,
        icon: <Zap className="h-4 w-4" />,
        status: performance.conversionRate >= 5 ? 'good' : performance.conversionRate >= 2 ? 'warning' : 'bad',
      },
    ];
  }, [landing, performance, t]);

  // Available languages (original + translations)
  const availableLanguages = useMemo(() => {
    if (!landing) return SUPPORTED_LANGUAGES;

    const codes = new Set([landing.language]);
    landing.translations?.forEach((t) => {
      if (t.status === 'completed') {
        codes.add(t.language);
      }
    });

    return SUPPORTED_LANGUAGES.filter((lang) => codes.has(lang.code));
  }, [landing]);

  // Link check stats
  const linkStats = useMemo(() => {
    const ok = linkCheckResults.filter((r) => r.status === 'ok').length;
    const broken = linkCheckResults.filter((r) => r.status === 'broken').length;
    const pending = linkCheckResults.filter((r) => r.status === 'pending').length;
    return { ok, broken, pending, total: linkCheckResults.length };
  }, [linkCheckResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!landing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('landing:notFound')}</p>
        <Button asChild className="mt-4">
          <Link to="/admin/content/landings">{t('common:back')}</Link>
        </Button>
      </div>
    );
  }

  const deviceSize = DEVICE_SIZES[device];
  const frameWidth = orientation === 'landscape' ? deviceSize.height : deviceSize.width;
  const frameHeight = orientation === 'landscape' ? deviceSize.width : deviceSize.height;

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/admin/content/landings/${landing.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">{landing.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t('landing:preview.title')}
              </p>
            </div>
          </div>

          {/* Center - Device Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={device === 'desktop' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDevice('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desktop</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={device === 'tablet' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDevice('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tablet</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={device === 'mobile' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDevice('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mobile</TooltipContent>
              </Tooltip>
            </div>

            {device !== 'desktop' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'))
                    }
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('landing:preview.rotate')}</TooltipContent>
              </Tooltip>
            )}

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Language Selector */}
            {availableLanguages.length > 1 && (
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[140px]">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Links Check */}
            <Sheet open={linksCheckOpen} onOpenChange={setLinksCheckOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {t('landing:preview.checkLinks')}
                  {linkStats.broken > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {linkStats.broken}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('landing:preview.linksCheck')}</SheetTitle>
                  <SheetDescription>
                    {t('landing:preview.linksCheckDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {extractLinks.length} {t('landing:preview.linksFound')}
                    </span>
                    <Button
                      size="sm"
                      onClick={checkLinks}
                      disabled={isCheckingLinks || extractLinks.length === 0}
                    >
                      {isCheckingLinks ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {t('landing:preview.runCheck')}
                    </Button>
                  </div>

                  {linkCheckResults.length > 0 && (
                    <>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {linkStats.ok} OK
                        </Badge>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          {linkStats.broken} Broken
                        </Badge>
                        {linkStats.pending > 0 && (
                          <Badge variant="secondary">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            {linkStats.pending} Checking
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {linkCheckResults.map((result, index) => (
                          <div
                            key={index}
                            className={cn(
                              'p-3 rounded-lg border',
                              result.status === 'ok' && 'bg-green-50 border-green-200',
                              result.status === 'broken' && 'bg-red-50 border-red-200',
                              result.status === 'pending' && 'bg-gray-50 border-gray-200'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{result.url}</p>
                                <p className="text-xs text-muted-foreground">
                                  {result.section}
                                </p>
                              </div>
                              <div className="ml-2">
                                {result.status === 'ok' && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                                {result.status === 'broken' && (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                {result.status === 'pending' && (
                                  <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                                )}
                              </div>
                            </div>
                            {result.statusCode && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'mt-2 text-xs',
                                  result.status === 'ok' && 'text-green-600',
                                  result.status === 'broken' && 'text-red-600'
                                )}
                              >
                                HTTP {result.statusCode}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {extractLinks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('landing:preview.noLinks')}</p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Performance */}
            <Sheet open={performanceOpen} onOpenChange={setPerformanceOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Gauge className="h-4 w-4 mr-2" />
                  {t('landing:preview.performance')}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('landing:preview.performanceTitle')}</SheetTitle>
                  <SheetDescription>
                    {t('landing:preview.performanceDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {performanceMetrics.map((metric, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            {metric.icon}
                            <span className="text-xs">{metric.label}</span>
                          </div>
                          <p
                            className={cn(
                              'text-2xl font-semibold',
                              metric.status === 'good' && 'text-green-600',
                              metric.status === 'warning' && 'text-yellow-600',
                              metric.status === 'bad' && 'text-red-600'
                            )}
                          >
                            {metric.value}
                          </p>
                          {metric.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {metric.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Page Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('landing:preview.pageAnalysis')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {t('landing:preview.sections')}
                        </span>
                        <span className="font-medium">{sections.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          {t('landing:preview.images')}
                        </span>
                        <span className="font-medium">
                          {landing.featuredImage ? 1 : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          {t('landing:preview.links')}
                        </span>
                        <span className="font-medium">{extractLinks.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {t('landing:preview.translations')}
                        </span>
                        <span className="font-medium">
                          {landing.translations?.length || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SEO Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('landing:preview.seoScore')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-muted"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(landing.seoScore || 0) * 1.76} 176`}
                              className={cn(
                                (landing.seoScore || 0) >= 80
                                  ? 'text-green-500'
                                  : (landing.seoScore || 0) >= 60
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                              )}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-semibold">
                            {landing.seoScore || 0}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            {landing.metaTitle ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Meta Title</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {landing.metaDescription ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Meta Description</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {landing.focusKeyword ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>Focus Keyword</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>

            <Separator orientation="vertical" className="h-6" />

            {/* Share */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('landing:preview.share')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyUrl} disabled={!landing.publicUrl}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {t('landing:preview.copyUrl')}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <QrCode className="h-4 w-4 mr-2" />
                  {t('landing:preview.generateQr')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  {t('landing:preview.print')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                  <Code className="h-4 w-4 mr-2" />
                  {t('landing:preview.exportHtml')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('landing:preview.exportPdf')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {landing.publicUrl && (
              <Button asChild>
                <a href={landing.publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('landing:preview.openInNewTab')}
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Device Info Bar */}
      <div className="bg-background border-b px-4 py-2 text-center">
        <span className="text-xs text-muted-foreground">
          {DEVICE_SIZES[device].label}
          {orientation === 'landscape' && device !== 'desktop' && ' (Landscape)'}
          {scale < 1 && ` • ${Math.round(scale * 100)}% zoom`}
        </span>
      </div>

      {/* Preview Container */}
      <div id="preview-container" className="flex-1 overflow-auto p-6 flex items-start justify-center">
        <div
          className="bg-background shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: frameWidth * scale,
            height: frameHeight * scale,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Simulated Browser Chrome for Desktop */}
          {device === 'desktop' && (
            <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground truncate">
                  {landing.publicUrl || 'https://preview.example.com/landing'}
                </div>
              </div>
            </div>
          )}

          {/* Landing Content */}
          <div
            className="overflow-auto"
            style={{
              height: device === 'desktop' ? frameHeight * scale - 40 : frameHeight * scale,
            }}
          >
            {/* Hero */}
            {landing.featuredImage && (
              <div
                className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${landing.featuredImage})` }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 text-center text-white p-8">
                  <h1 className="text-4xl font-bold mb-4">{landing.title}</h1>
                  {landing.description && (
                    <p className="text-xl opacity-90 mb-6">{landing.description}</p>
                  )}
                  {landing.primaryCta && (
                    <Button
                      size="lg"
                      className={cn(
                        landing.primaryCta.style === 'gradient' &&
                          'bg-gradient-to-r from-primary to-purple-600'
                      )}
                    >
                      {landing.primaryCta.text}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Sections */}
            <div className="p-8 space-y-12">
              {!landing.featuredImage && (
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold mb-4">{landing.title}</h1>
                  {landing.description && (
                    <p className="text-xl text-muted-foreground">{landing.description}</p>
                  )}
                </div>
              )}

              {sections.map((section) => (
                <div key={section.id} className="border-b pb-8 last:border-b-0">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    {section.subtitle && (
                      <p className="text-muted-foreground mt-2">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="bg-muted/30 rounded-lg p-6 text-center">
                    <Badge variant="outline" className="mb-2">
                      {section.type}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Section content preview
                    </p>
                  </div>
                </div>
              ))}

              {sections.length === 0 && !landing.featuredImage && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t('landing:preview.noContent')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPreview;
