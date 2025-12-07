import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  ExternalLink,
  Palette,
  BarChart3,
  Plus,
  X,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { Separator } from '@/components/ui/Separator';
import { CtaConfig, CtaStyle } from '@/types/landing';
import { cn } from '@/lib/utils';

interface CtaEditorProps {
  value: CtaConfig | undefined;
  onChange: (value: CtaConfig | undefined) => void;
  label?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

const STYLE_OPTIONS: { value: CtaStyle; label: string; preview: string }[] = [
  { value: 'primary', label: 'Principal', preview: 'bg-primary text-primary-foreground' },
  { value: 'secondary', label: 'Secondaire', preview: 'bg-secondary text-secondary-foreground' },
  { value: 'outline', label: 'Outline', preview: 'border border-primary text-primary bg-transparent' },
  { value: 'ghost', label: 'Ghost', preview: 'text-primary hover:bg-primary/10 bg-transparent' },
  { value: 'gradient', label: 'Dégradé', preview: 'bg-gradient-to-r from-primary to-purple-600 text-white' },
];

const DEFAULT_CTA: CtaConfig = {
  text: '',
  url: '',
  style: 'primary',
};

const COMMON_ICONS = [
  { value: '', label: 'Aucune' },
  { value: 'arrow-right', label: 'Flèche droite →' },
  { value: 'arrow-up-right', label: 'Flèche externe ↗' },
  { value: 'check', label: 'Check ✓' },
  { value: 'download', label: 'Télécharger ↓' },
  { value: 'play', label: 'Play ▶' },
  { value: 'phone', label: 'Téléphone 📞' },
  { value: 'mail', label: 'Email ✉' },
];

export const CtaEditor: React.FC<CtaEditorProps> = ({
  value,
  onChange,
  label = 'Call-to-Action',
  showPreview = true,
  disabled = false,
}) => {
  const { t } = useTranslation(['landing', 'common']);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // Initialize with default if undefined
  const ctaValue = value || DEFAULT_CTA;

  // Update field
  const updateField = useCallback(
    <K extends keyof CtaConfig>(field: K, fieldValue: CtaConfig[K]) => {
      onChange({ ...ctaValue, [field]: fieldValue });
    },
    [ctaValue, onChange]
  );

  // Update tracking param
  const updateTracking = useCallback(
    (key: string, trackingValue: string) => {
      const newTracking = {
        ...ctaValue.tracking,
        [key]: trackingValue || undefined,
      };
      
      // Clean up empty values
      Object.keys(newTracking).forEach((k) => {
        if (!newTracking[k as keyof typeof newTracking]) {
          delete newTracking[k as keyof typeof newTracking];
        }
      });

      onChange({
        ...ctaValue,
        tracking: Object.keys(newTracking).length > 0 ? newTracking : undefined,
      });
    },
    [ctaValue, onChange]
  );

  // Add custom tracking param
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamValue, setNewParamValue] = useState('');

  const addCustomParam = useCallback(() => {
    if (!newParamKey.trim()) return;
    
    const customParams = {
      ...ctaValue.tracking?.custom_params,
      [newParamKey]: newParamValue,
    };

    onChange({
      ...ctaValue,
      tracking: {
        ...ctaValue.tracking,
        custom_params: customParams,
      },
    });

    setNewParamKey('');
    setNewParamValue('');
  }, [ctaValue, newParamKey, newParamValue, onChange]);

  // Remove custom param
  const removeCustomParam = useCallback(
    (key: string) => {
      const customParams = { ...ctaValue.tracking?.custom_params };
      delete customParams[key];

      onChange({
        ...ctaValue,
        tracking: {
          ...ctaValue.tracking,
          custom_params: Object.keys(customParams).length > 0 ? customParams : undefined,
        },
      });
    },
    [ctaValue, onChange]
  );

  // Build full URL with tracking
  const fullUrl = useMemo(() => {
    if (!ctaValue.url) return '';
    
    try {
      const url = new URL(ctaValue.url);
      
      if (ctaValue.tracking?.utm_source) {
        url.searchParams.set('utm_source', ctaValue.tracking.utm_source);
      }
      if (ctaValue.tracking?.utm_medium) {
        url.searchParams.set('utm_medium', ctaValue.tracking.utm_medium);
      }
      if (ctaValue.tracking?.utm_campaign) {
        url.searchParams.set('utm_campaign', ctaValue.tracking.utm_campaign);
      }
      if (ctaValue.tracking?.utm_content) {
        url.searchParams.set('utm_content', ctaValue.tracking.utm_content);
      }
      if (ctaValue.tracking?.custom_params) {
        Object.entries(ctaValue.tracking.custom_params).forEach(([key, val]) => {
          url.searchParams.set(key, val);
        });
      }

      return url.toString();
    } catch {
      return ctaValue.url;
    }
  }, [ctaValue.url, ctaValue.tracking]);

  // Get preview style
  const previewStyle = STYLE_OPTIONS.find((s) => s.value === ctaValue.style)?.preview || '';

  // Clear CTA
  const handleClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{label}</CardTitle>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-1" />
              {t('common:clear')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text */}
        <div>
          <Label htmlFor="ctaText">{t('landing:cta.text')}</Label>
          <Input
            id="ctaText"
            value={ctaValue.text}
            onChange={(e) => updateField('text', e.target.value)}
            placeholder={t('landing:cta.textPlaceholder')}
            className="mt-1"
            disabled={disabled}
          />
        </div>

        {/* URL */}
        <div>
          <Label htmlFor="ctaUrl">{t('landing:cta.url')}</Label>
          <div className="relative mt-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="ctaUrl"
              value={ctaValue.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://..."
              className="pl-9"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Style */}
        <div>
          <Label>{t('landing:cta.style')}</Label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {STYLE_OPTIONS.map(({ value: styleValue, label: styleLabel, preview }) => (
              <button
                key={styleValue}
                type="button"
                onClick={() => updateField('style', styleValue)}
                disabled={disabled}
                className={cn(
                  'p-2 rounded-lg border-2 transition-colors text-center text-xs',
                  ctaValue.style === styleValue
                    ? 'border-primary'
                    : 'border-transparent hover:border-muted-foreground/30'
                )}
              >
                <div className={cn('h-8 rounded flex items-center justify-center text-xs font-medium mb-1', preview)}>
                  Btn
                </div>
                {styleLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <Label>{t('landing:cta.icon')}</Label>
          <Select
            value={ctaValue.icon || ''}
            onValueChange={(v) => updateField('icon', v || undefined)}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('landing:cta.noIcon')} />
            </SelectTrigger>
            <SelectContent>
              {COMMON_ICONS.map(({ value: iconValue, label: iconLabel }) => (
                <SelectItem key={iconValue} value={iconValue}>
                  {iconLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Open in new tab */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="openNewTab" className="text-sm">
              {t('landing:cta.openNewTab')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('landing:cta.openNewTabDesc')}
            </p>
          </div>
          <Switch
            id="openNewTab"
            checked={ctaValue.openInNewTab || false}
            onCheckedChange={(checked) => updateField('openInNewTab', checked)}
            disabled={disabled}
          />
        </div>

        <Separator />

        {/* Tracking Parameters */}
        <Collapsible open={trackingOpen} onOpenChange={setTrackingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" disabled={disabled}>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('landing:cta.tracking')}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  trackingOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* UTM Parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="utmSource" className="text-xs">UTM Source</Label>
                <Input
                  id="utmSource"
                  value={ctaValue.tracking?.utm_source || ''}
                  onChange={(e) => updateTracking('utm_source', e.target.value)}
                  placeholder="google"
                  className="mt-1 h-8 text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="utmMedium" className="text-xs">UTM Medium</Label>
                <Input
                  id="utmMedium"
                  value={ctaValue.tracking?.utm_medium || ''}
                  onChange={(e) => updateTracking('utm_medium', e.target.value)}
                  placeholder="cpc"
                  className="mt-1 h-8 text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="utmCampaign" className="text-xs">UTM Campaign</Label>
                <Input
                  id="utmCampaign"
                  value={ctaValue.tracking?.utm_campaign || ''}
                  onChange={(e) => updateTracking('utm_campaign', e.target.value)}
                  placeholder="summer_sale"
                  className="mt-1 h-8 text-sm"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="utmContent" className="text-xs">UTM Content</Label>
                <Input
                  id="utmContent"
                  value={ctaValue.tracking?.utm_content || ''}
                  onChange={(e) => updateTracking('utm_content', e.target.value)}
                  placeholder="hero_button"
                  className="mt-1 h-8 text-sm"
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Custom Parameters */}
            <div>
              <Label className="text-xs">{t('landing:cta.customParams')}</Label>
              {ctaValue.tracking?.custom_params && Object.keys(ctaValue.tracking.custom_params).length > 0 && (
                <div className="space-y-2 mt-2">
                  {Object.entries(ctaValue.tracking.custom_params).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input value={key} className="h-8 text-sm flex-1" disabled />
                      <Input value={val} className="h-8 text-sm flex-1" disabled />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeCustomParam(key)}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newParamKey}
                  onChange={(e) => setNewParamKey(e.target.value)}
                  placeholder="Clé"
                  className="h-8 text-sm flex-1"
                  disabled={disabled}
                />
                <Input
                  value={newParamValue}
                  onChange={(e) => setNewParamValue(e.target.value)}
                  placeholder="Valeur"
                  className="h-8 text-sm flex-1"
                  disabled={disabled}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={addCustomParam}
                  disabled={disabled || !newParamKey.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Full URL Preview */}
            {fullUrl && fullUrl !== ctaValue.url && (
              <div>
                <Label className="text-xs">{t('landing:cta.fullUrl')}</Label>
                <div className="mt-1 p-2 bg-muted rounded text-xs break-all font-mono">
                  {fullUrl}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Preview */}
        {showPreview && ctaValue.text && (
          <>
            <Separator />
            <div>
              <Label className="text-xs mb-2 block flex items-center gap-2">
                <Eye className="h-3 w-3" />
                {t('landing:cta.preview')}
              </Label>
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                <button
                  type="button"
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2',
                    previewStyle
                  )}
                >
                  {ctaValue.text}
                  {ctaValue.openInNewTab && <ExternalLink className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CtaEditor;
