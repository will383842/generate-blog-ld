import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wand2,
  RefreshCw,
  Download,
  Save,
  History,
  Sparkles,
  Image,
  Settings,
  ChevronDown,
  Check,
  Copy,
  Trash2,
  AlertCircle,
  Zap,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  SelectRoot as Select,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import {
  useGenerateDalle,
  useSaveDalleToLibrary,
  useDalleHistory,
} from '@/hooks/useMedia';
import {
  DalleImage,
  DalleStyle,
  DalleQuality,
  DalleSize,
  DalleStylePreset,
  DalleGenerationParams,
  MediaItem,
} from '@/types/media';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DalleGeneratorProps {
  folderId?: number;
  onSelect?: (media: MediaItem) => void;
}

// Style Presets
const STYLE_PRESETS: DalleStylePreset[] = [
  {
    id: 'none',
    name: 'Aucun style',
    description: 'Utiliser le prompt tel quel',
    promptSuffix: '',
    category: 'photography',
  },
  {
    id: 'photo-realistic',
    name: 'Photo réaliste',
    description: 'Image photo-réaliste haute définition',
    promptSuffix: ', photorealistic, high resolution, professional photography, detailed',
    category: 'photography',
  },
  {
    id: 'studio-portrait',
    name: 'Portrait studio',
    description: 'Portrait professionnel avec éclairage studio',
    promptSuffix: ', studio lighting, professional portrait, soft shadows, high-end photography',
    category: 'photography',
  },
  {
    id: 'product-photo',
    name: 'Photo produit',
    description: 'Photo produit e-commerce sur fond blanc',
    promptSuffix: ', product photography, white background, studio lighting, e-commerce style',
    category: 'photography',
  },
  {
    id: 'flat-illustration',
    name: 'Illustration flat',
    description: 'Illustration vectorielle style flat design',
    promptSuffix: ', flat design illustration, vector art, minimal, clean lines, modern',
    category: 'illustration',
  },
  {
    id: 'hand-drawn',
    name: 'Dessin à la main',
    description: 'Style croquis dessiné à la main',
    promptSuffix: ', hand-drawn sketch, pencil illustration, artistic, organic lines',
    category: 'illustration',
  },
  {
    id: 'watercolor',
    name: 'Aquarelle',
    description: 'Peinture style aquarelle',
    promptSuffix: ', watercolor painting, soft colors, artistic, flowing, delicate',
    category: 'art',
  },
  {
    id: 'oil-painting',
    name: 'Peinture à l\'huile',
    description: 'Style peinture classique',
    promptSuffix: ', oil painting, classical art style, rich colors, textured brushstrokes',
    category: 'art',
  },
  {
    id: 'digital-art',
    name: 'Art digital',
    description: 'Illustration digitale moderne',
    promptSuffix: ', digital art, vibrant colors, detailed, contemporary illustration',
    category: 'art',
  },
  {
    id: '3d-render',
    name: 'Rendu 3D',
    description: 'Image 3D photoréaliste',
    promptSuffix: ', 3D render, octane render, realistic lighting, high detail, CGI',
    category: '3d',
  },
  {
    id: 'isometric',
    name: 'Isométrique',
    description: 'Vue isométrique 3D',
    promptSuffix: ', isometric view, 3D illustration, clean, modern, technical',
    category: '3d',
  },
  {
    id: 'abstract',
    name: 'Abstrait',
    description: 'Art abstrait moderne',
    promptSuffix: ', abstract art, modern, geometric shapes, vibrant colors, artistic',
    category: 'abstract',
  },
  {
    id: 'minimalist',
    name: 'Minimaliste',
    description: 'Design épuré et minimaliste',
    promptSuffix: ', minimalist, simple, clean, white space, elegant',
    category: 'abstract',
  },
];

const SIZE_OPTIONS: { value: DalleSize; label: string; dimensions: string }[] = [
  { value: '1024x1024', label: 'Carré', dimensions: '1024×1024' },
  { value: '1792x1024', label: 'Paysage', dimensions: '1792×1024' },
  { value: '1024x1792', label: 'Portrait', dimensions: '1024×1792' },
];

const QUALITY_OPTIONS: { value: DalleQuality; label: string; credits: number }[] = [
  { value: 'standard', label: 'Standard', credits: 1 },
  { value: 'hd', label: 'HD', credits: 2 },
];

const STYLE_OPTIONS: { value: DalleStyle; label: string }[] = [
  { value: 'natural', label: 'Naturel' },
  { value: 'vivid', label: 'Vif' },
];

export const DalleGenerator: React.FC<DalleGeneratorProps> = ({
  folderId,
  onSelect,
}) => {
  const { t } = useTranslation(['media', 'common']);

  // State
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('none');
  const [size, setSize] = useState<DalleSize>('1024x1024');
  const [quality, setQuality] = useState<DalleQuality>('standard');
  const [style, setStyle] = useState<DalleStyle>('natural');
  const [numImages, setNumImages] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<DalleImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<DalleImage | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Queries & Mutations
  const generateMutation = useGenerateDalle();
  const saveMutation = useSaveDalleToLibrary();
  const { data: history = [], isLoading: historyLoading } = useDalleHistory();

  // Get preset
  const currentPreset = useMemo(
    () => STYLE_PRESETS.find((p) => p.id === selectedPreset),
    [selectedPreset]
  );

  // Build final prompt
  const finalPrompt = useMemo(() => {
    if (!prompt.trim()) return '';
    const preset = STYLE_PRESETS.find((p) => p.id === selectedPreset);
    return prompt.trim() + (preset?.promptSuffix || '');
  }, [prompt, selectedPreset]);

  // Estimated credits
  const estimatedCredits = useMemo(() => {
    const qualityMultiplier = quality === 'hd' ? 2 : 1;
    return numImages * qualityMultiplier;
  }, [numImages, quality]);

  // Generate images
  const handleGenerate = useCallback(async () => {
    if (!finalPrompt.trim()) return;

    try {
      const result = await generateMutation.mutateAsync({
        prompt: finalPrompt,
        style,
        quality,
        size,
        n: numImages,
      });

      setGeneratedImages(result.images);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }, [finalPrompt, generateMutation, numImages, quality, size, style]);

  // Regenerate with same settings
  const handleRegenerate = useCallback(async () => {
    await handleGenerate();
  }, [handleGenerate]);

  // Save to library
  const handleSave = useCallback(
    async (image: DalleImage) => {
      try {
        const result = await saveMutation.mutateAsync({
          image: { url: image.url, prompt: image.prompt },
          folderId,
        });

        if (onSelect) {
          onSelect(result);
        }
      } catch (error) {
        console.error('Save failed:', error);
      }
    },
    [folderId, onSelect, saveMutation]
  );

  // Copy prompt
  const handleCopyPrompt = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }, []);

  // Load from history
  const handleLoadFromHistory = useCallback((item: { prompt: string; style: DalleStyle; quality: DalleQuality; size: DalleSize }) => {
    setPrompt(item.prompt);
    setStyle(item.style);
    setQuality(item.quality);
    setSize(item.size);
    setActiveTab('generate');
  }, []);

  // Preset categories
  const presetsByCategory = useMemo(() => {
    return STYLE_PRESETS.reduce(
      (acc, preset) => {
        if (!acc[preset.category]) {
          acc[preset.category] = [];
        }
        acc[preset.category].push(preset);
        return acc;
      },
      {} as Record<string, DalleStylePreset[]>
    );
  }, []);

  const categoryLabels: Record<string, string> = {
    photography: 'Photographie',
    illustration: 'Illustration',
    art: 'Art',
    '3d': '3D',
    abstract: 'Abstrait',
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'generate' | 'history')}>
        <TabsList>
          <TabsTrigger value="generate">
            <Wand2 className="h-4 w-4 mr-2" />
            {t('media:dalle.generate')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            {t('media:dalle.history')}
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">{t('media:dalle.prompt')}</Label>
              <span className="text-xs text-muted-foreground">
                {prompt.length} / 4000
              </span>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('media:dalle.promptPlaceholder')}
              className="min-h-[120px] resize-none"
              maxLength={4000}
            />
            {currentPreset && currentPreset.id !== 'none' && (
              <p className="text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Style appliqué: {currentPreset.name}
              </p>
            )}
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <Label>{t('media:dalle.stylePreset')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(presetsByCategory).map(([category, presets]) => (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-between',
                        presets.some((p) => p.id === selectedPreset) &&
                          'border-primary bg-primary/5'
                      )}
                    >
                      {categoryLabels[category]}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {presets.map((preset) => (
                      <DropdownMenuItem
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{preset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {preset.description}
                          </p>
                        </div>
                        {selectedPreset === preset.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-3 gap-4">
            {/* Size */}
            <div className="space-y-2">
              <Label>{t('media:dalle.size')}</Label>
              <Select value={size} onValueChange={(v) => setSize(v as DalleSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map(({ value, label, dimensions }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{label}</span>
                        <span className="text-xs text-muted-foreground">{dimensions}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <Label>{t('media:dalle.quality')}</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as DalleQuality)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map(({ value, label, credits }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {credits} crédit{credits > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label>{t('media:dalle.style')}</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as DalleStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                {t('media:dalle.advancedSettings')}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 ml-2 transition-transform',
                    showAdvanced && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {/* Number of images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('media:dalle.numImages')}</Label>
                  <span className="text-sm font-medium">{numImages}</span>
                </div>
                <Slider
                  value={[numImages]}
                  onValueChange={([v]) => setNumImages(v)}
                  min={1}
                  max={4}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t('media:dalle.numImagesHint')}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <Zap className="h-4 w-4 inline mr-1" />
              {t('media:dalle.estimatedCredits', { credits: estimatedCredits })}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generateMutation.isPending}
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('media:dalle.generating')}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {t('media:dalle.generateButton')}
                </>
              )}
            </Button>
          </div>

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t('media:dalle.results')}</h3>
                <Button variant="outline" size="sm" onClick={handleRegenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('media:dalle.regenerate')}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      'group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                      selectedImage?.id === image.id
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-primary/50'
                    )}
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-square">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Selection indicator */}
                    {selectedImage?.id === image.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSave(image);
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('media:dalle.saveToLibrary')}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(image.url, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common:download')}</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Revised prompt indicator */}
                    {image.revisedPrompt && image.revisedPrompt !== image.prompt && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {t('media:dalle.promptRevised')}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{image.revisedPrompt}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>

              {/* Save selected button */}
              {selectedImage && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedImage.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium">{t('media:dalle.selectedImage')}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {selectedImage.prompt}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => handleSave(selectedImage)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('media:dalle.saveToLibrary')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2">{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.createdAt), 'PPp', { locale: fr })}
                          <Badge variant="outline" className="text-xs">
                            {item.style}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.quality}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.size}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopyPrompt(item.prompt)}
                            >
                              {copiedPrompt ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('media:dalle.copyPrompt')}</TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleLoadFromHistory({
                              prompt: item.prompt,
                              style: item.style,
                              quality: item.quality,
                              size: item.size,
                            })
                          }
                        >
                          {t('media:dalle.useAgain')}
                        </Button>
                      </div>
                    </div>

                    {/* Generated images */}
                    <div className="grid grid-cols-4 gap-2">
                      {item.images.slice(0, 4).map((img) => (
                        <div
                          key={img.id}
                          className="aspect-square rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(img.url, '_blank')}
                        >
                          <img
                            src={img.url}
                            alt={img.prompt}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {item.imagesCount} image{item.imagesCount > 1 ? 's' : ''} générée{item.imagesCount > 1 ? 's' : ''}
                      </span>
                      <span>
                        <Zap className="h-3 w-3 inline mr-1" />
                        {item.creditsUsed} crédit{item.creditsUsed > 1 ? 's' : ''} utilisé{item.creditsUsed > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t('media:dalle.noHistory')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('media:dalle.tips.title')}
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {t('media:dalle.tips.tip1')}</li>
          <li>• {t('media:dalle.tips.tip2')}</li>
          <li>• {t('media:dalle.tips.tip3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default DalleGenerator;
