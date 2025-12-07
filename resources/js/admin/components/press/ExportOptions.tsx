import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  FileDown,
  File,
  Globe,
  Download,
  Check,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import { ExportFormat, ExportResult } from '@/types/press';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportOptionsProps {
  contentType: 'press-release' | 'dossier';
  contentId: number;
  availableLanguages: string[];
  onExport: (options: ExportPayload) => Promise<ExportResult>;
}

interface ExportPayload {
  format: ExportFormat;
  language: string;
  includeMedia: boolean;
  includeCharts: boolean;
  layout: 'standard' | 'compact' | 'presentation';
  pdfOptions?: {
    paperSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    headerLogo?: string;
    footerText?: string;
  };
}

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'pdf',
    label: 'PDF',
    icon: <FileText className="h-6 w-6" />,
    description: 'Document PDF prêt à imprimer',
  },
  {
    value: 'word',
    label: 'Word',
    icon: <File className="h-6 w-6" />,
    description: 'Document Microsoft Word éditable',
  },
  {
    value: 'html',
    label: 'HTML',
    icon: <Globe className="h-6 w-6" />,
    description: 'Page web autonome',
  },
];

const LAYOUT_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' },
  { value: 'presentation', label: 'Présentation' },
];

const PAPER_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
];

// Les 9 langues supportées par la plateforme
const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
  zh: '中文',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी',
};

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  contentType,
  contentId,
  availableLanguages,
  onExport,
}) => {
  const { t } = useTranslation(['press', 'common']);

  // Export options state
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedLanguage, setSelectedLanguage] = useState(
    availableLanguages[0] || 'fr'
  );
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [layout, setLayout] = useState<'standard' | 'compact' | 'presentation'>(
    'standard'
  );

  // PDF specific options
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [headerLogo, setHeaderLogo] = useState('');
  const [footerText, setFooterText] = useState('');

  // Export state
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle export
  const handleExport = useCallback(async () => {
    setExportState('exporting');
    setProgress(0);
    setError(null);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const payload: ExportPayload = {
        format: selectedFormat,
        language: selectedLanguage,
        includeMedia,
        includeCharts,
        layout,
      };

      if (selectedFormat === 'pdf') {
        payload.pdfOptions = {
          paperSize,
          orientation,
          headerLogo: headerLogo || undefined,
          footerText: footerText || undefined,
        };
      }

      const exportResult = await onExport(payload);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(exportResult);
      setExportState('success');
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : t('common:error.unknown'));
      setExportState('error');
    }
  }, [
    selectedFormat,
    selectedLanguage,
    includeMedia,
    includeCharts,
    layout,
    paperSize,
    orientation,
    headerLogo,
    footerText,
    onExport,
    t,
  ]);

  // Reset to try again
  const handleReset = () => {
    setExportState('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  };

  // Download result
  const handleDownload = () => {
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <Label className="mb-3 block">{t('press:export.format')}</Label>
        <div className="grid grid-cols-3 gap-3">
          {FORMAT_OPTIONS.map(({ value, label, icon, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedFormat(value)}
              disabled={exportState === 'exporting'}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center',
                selectedFormat === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                exportState === 'exporting' && 'opacity-50 cursor-not-allowed'
              )}
            >
              {icon}
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      {availableLanguages.length > 1 && (
        <div>
          <Label htmlFor="exportLanguage">{t('press:export.language')}</Label>
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            disabled={exportState === 'exporting'}
          >
            <SelectTrigger id="exportLanguage" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('press:export.contentOptions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includeMedia" className="text-sm">
                {t('press:export.includeMedia')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('press:export.includeMediaDesc')}
              </p>
            </div>
            <Switch
              id="includeMedia"
              checked={includeMedia}
              onCheckedChange={setIncludeMedia}
              disabled={exportState === 'exporting'}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includeCharts" className="text-sm">
                {t('press:export.includeCharts')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('press:export.includeChartsDesc')}
              </p>
            </div>
            <Switch
              id="includeCharts"
              checked={includeCharts}
              onCheckedChange={setIncludeCharts}
              disabled={exportState === 'exporting'}
            />
          </div>

          <Separator />

          <div>
            <Label className="text-sm mb-2 block">{t('press:export.layout')}</Label>
            <RadioGroup
              value={layout}
              onValueChange={(v) => setLayout(v as typeof layout)}
              disabled={exportState === 'exporting'}
              className="flex gap-4"
            >
              {LAYOUT_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`layout-${value}`} />
                  <Label htmlFor={`layout-${value}`} className="text-sm font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* PDF Options */}
      {selectedFormat === 'pdf' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('press:export.pdfOptions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paperSize">{t('press:export.paperSize')}</Label>
                <Select
                  value={paperSize}
                  onValueChange={(v) => setPaperSize(v as typeof paperSize)}
                  disabled={exportState === 'exporting'}
                >
                  <SelectTrigger id="paperSize" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('press:export.orientation')}</Label>
                <RadioGroup
                  value={orientation}
                  onValueChange={(v) => setOrientation(v as typeof orientation)}
                  disabled={exportState === 'exporting'}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="portrait" id="orientation-portrait" />
                    <Label htmlFor="orientation-portrait" className="text-sm font-normal">
                      Portrait
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landscape" id="orientation-landscape" />
                    <Label htmlFor="orientation-landscape" className="text-sm font-normal">
                      Paysage
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label htmlFor="headerLogo">{t('press:export.headerLogo')}</Label>
              <Input
                id="headerLogo"
                value={headerLogo}
                onChange={(e) => setHeaderLogo(e.target.value)}
                placeholder="https://..."
                className="mt-1"
                disabled={exportState === 'exporting'}
              />
            </div>

            <div>
              <Label htmlFor="footerText">{t('press:export.footerText')}</Label>
              <Input
                id="footerText"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder={t('press:export.footerTextPlaceholder')}
                className="mt-1"
                disabled={exportState === 'exporting'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Progress */}
      {exportState === 'exporting' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">{t('press:export.generating')}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {progress}% {t('common:completed')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success Result */}
      {exportState === 'success' && result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">
                  {t('press:export.success')}
                </h4>
                <div className="mt-2 space-y-1 text-sm text-green-800">
                  <p>
                    <span className="font-medium">{t('press:export.filename')}:</span>{' '}
                    {result.filename}
                  </p>
                  <p>
                    <span className="font-medium">{t('press:export.size')}:</span>{' '}
                    {formatFileSize(result.size)}
                  </p>
                  {result.expiresAt && (
                    <p className="flex items-center gap-1 text-green-700">
                      <Clock className="h-3 w-3" />
                      {t('press:export.expiresAt')}{' '}
                      {format(new Date(result.expiresAt), 'PPp', { locale: fr })}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleDownload} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {t('common:download')}
                  </Button>
                  <Button onClick={handleReset} variant="outline" size="sm">
                    {t('press:export.exportAnother')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {exportState === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common:error.title')}</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="mt-3 block"
            >
              {t('common:retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Export Button */}
      {exportState === 'idle' && (
        <Button onClick={handleExport} className="w-full">
          <FileDown className="h-4 w-4 mr-2" />
          {t('press:export.generate')}
        </Button>
      )}
    </div>
  );
};

export default ExportOptions;
