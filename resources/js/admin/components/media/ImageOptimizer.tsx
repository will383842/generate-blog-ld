import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Image,
  Download,
  Loader2,
  RefreshCw,
  Maximize2,
  FileImage,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OptimizationSettings {
  quality: number;
  format: 'webp' | 'jpg' | 'png' | 'avif';
  maxWidth: number;
  maxHeight: number;
  maintainAspectRatio: boolean;
}

export interface OptimizedResult {
  url: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  format: string;
}

export interface ImageOptimizerProps {
  imageUrl: string;
  imageName?: string;
  onOptimize?: (settings: OptimizationSettings) => Promise<OptimizedResult>;
  onDownload?: (result: OptimizedResult) => void;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ImageOptimizer({
  imageUrl,
  imageName = 'image',
  onOptimize,
  onDownload,
  className,
}: ImageOptimizerProps) {
  const { t } = useTranslation('media');
  const [settings, setSettings] = useState<OptimizationSettings>({
    quality: 80,
    format: 'webp',
    maxWidth: 1920,
    maxHeight: 1080,
    maintainAspectRatio: true,
  });
  const [result, setResult] = useState<OptimizedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(imageUrl);

  const handleOptimize = useCallback(async () => {
    if (!onOptimize) return;
    setLoading(true);
    try {
      const optimized = await onOptimize(settings);
      setResult(optimized);
      setPreviewUrl(optimized.url);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setLoading(false);
    }
  }, [settings, onOptimize]);

  const handleReset = () => {
    setPreviewUrl(imageUrl);
    setResult(null);
  };

  const savings = result
    ? ((result.originalSize - result.optimizedSize) / result.originalSize) * 100
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          {t('optimization.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Result stats */}
        {result && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Original</p>
              <p className="font-semibold">{formatBytes(result.originalSize)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Optimized</p>
              <p className="font-semibold">{formatBytes(result.optimizedSize)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Savings</p>
              <Badge variant={savings > 50 ? 'default' : 'secondary'}>
                -{savings.toFixed(1)}%
              </Badge>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="space-y-4">
          {/* Quality */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t('optimization.quality')}</Label>
              <span className="text-sm text-muted-foreground">
                {settings.quality}%
              </span>
            </div>
            <Slider
              value={[settings.quality]}
              onValueChange={([value]) =>
                setSettings((s) => ({ ...s, quality: value }))
              }
              min={10}
              max={100}
              step={5}
            />
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>{t('optimization.format')}</Label>
            <Select
              value={settings.format}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, format: value as 'webp' | 'avif' | 'jpg' | 'png' }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP (Recommended)</SelectItem>
                <SelectItem value="avif">AVIF (Best compression)</SelectItem>
                <SelectItem value="jpg">JPEG</SelectItem>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('optimization.maxWidth')}</Label>
              <Select
                value={settings.maxWidth.toString()}
                onValueChange={(value) =>
                  setSettings((s) => ({ ...s, maxWidth: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="640">640px</SelectItem>
                  <SelectItem value="1280">1280px</SelectItem>
                  <SelectItem value="1920">1920px</SelectItem>
                  <SelectItem value="2560">2560px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('optimization.maxHeight')}</Label>
              <Select
                value={settings.maxHeight.toString()}
                onValueChange={(value) =>
                  setSettings((s) => ({ ...s, maxHeight: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480">480px</SelectItem>
                  <SelectItem value="720">720px</SelectItem>
                  <SelectItem value="1080">1080px</SelectItem>
                  <SelectItem value="1440">1440px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleOptimize}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Maximize2 className="h-4 w-4 mr-2" />
            )}
            {t('optimization.optimize')}
          </Button>
          {result && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => onDownload?.(result)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ImageOptimizer;
