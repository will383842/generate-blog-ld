/**
 * Images Settings Page
 * File 364 - Image source and optimization settings
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  GripVertical,
  Settings,
  Sparkles,
  Camera,
  Upload,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Textarea } from '@/components/ui/Textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface ImageSource {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  priority: number;
}

export default function ImagesSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [sources, setSources] = useState<ImageSource[]>([
    { id: 'unsplash', name: 'Unsplash', icon: '📷', enabled: true, priority: 1 },
    { id: 'dalle', name: 'DALL-E', icon: '🎨', enabled: true, priority: 2 },
    { id: 'upload', name: 'Upload manuel', icon: '📤', enabled: true, priority: 3 },
  ]);

  const [settings, setSettings] = useState({
    defaultSource: 'unsplash',
    dalle: {
      style: 'natural',
      size: '1024x1024',
      quality: 'standard',
      model: 'dall-e-3',
    },
    unsplash: {
      orientation: 'landscape',
      color: '',
      safeSearch: true,
    },
    optimization: {
      enabled: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
      lazyLoading: true,
    },
    attribution: {
      enabled: true,
      template: 'Photo by {author} on {source}',
      position: 'caption',
    },
  });

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle drag start
  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newSources = [...sources];
    const draggedIndex = newSources.findIndex(s => s.id === draggedItem);
    const targetIndex = newSources.findIndex(s => s.id === targetId);

    const [removed] = newSources.splice(draggedIndex, 1);
    newSources.splice(targetIndex, 0, removed);

    // Update priorities
    newSources.forEach((s, i) => s.priority = i + 1);
    setSources(newSources);
  };

  // Handle drop
  const handleDrop = () => {
    setDraggedItem(null);
  };

  // Toggle source
  const toggleSource = (id: string) => {
    setSources(sources.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Paramètres enregistrés' });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6" />
            Images
          </h1>
          <p className="text-muted-foreground">Configuration des sources d'images</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Sources Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sources d'images</CardTitle>
          <CardDescription>
            Glissez-déposez pour définir l'ordre de priorité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sources.sort((a, b) => a.priority - b.priority).map(source => (
              <div
                key={source.id}
                draggable
                onDragStart={() => handleDragStart(source.id)}
                onDragOver={(e) => handleDragOver(e, source.id)}
                onDrop={handleDrop}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg cursor-move transition-colors',
                  draggedItem === source.id && 'opacity-50 bg-muted',
                  !source.enabled && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl">{source.icon}</span>
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">Priorité {source.priority}</p>
                  </div>
                </div>
                <Switch
                  checked={source.enabled}
                  onCheckedChange={() => toggleSource(source.id)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Label>Source par défaut</Label>
            <Select
              value={settings.defaultSource}
              onValueChange={(v) => setSettings({ ...settings, defaultSource: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sources.filter(s => s.enabled).map(source => (
                  <SelectItem key={source.id} value={source.id}>
                    <div className="flex items-center gap-2">
                      <span>{source.icon}</span>
                      {source.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* DALL-E Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Paramètres DALL-E
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Modèle</Label>
              <Select
                value={settings.dalle.model}
                onValueChange={(v) => setSettings({
                  ...settings,
                  dalle: { ...settings.dalle, model: v },
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dall-e-3">DALL-E 3 (Recommandé)</SelectItem>
                  <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Taille</Label>
              <Select
                value={settings.dalle.size}
                onValueChange={(v) => setSettings({
                  ...settings,
                  dalle: { ...settings.dalle, size: v },
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024×1024 (Carré)</SelectItem>
                  <SelectItem value="1792x1024">1792×1024 (Paysage)</SelectItem>
                  <SelectItem value="1024x1792">1024×1792 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Style</Label>
              <RadioGroup
                value={settings.dalle.style}
                onValueChange={(v) => setSettings({
                  ...settings,
                  dalle: { ...settings.dalle, style: v },
                })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="natural" id="natural" />
                  <Label htmlFor="natural">Naturel</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="vivid" id="vivid" />
                  <Label htmlFor="vivid">Vivide</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Qualité</Label>
              <RadioGroup
                value={settings.dalle.quality}
                onValueChange={(v) => setSettings({
                  ...settings,
                  dalle: { ...settings.dalle, quality: v },
                })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="hd" id="hd" />
                  <Label htmlFor="hd">HD</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsplash Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Paramètres Unsplash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Orientation par défaut</Label>
              <Select
                value={settings.unsplash.orientation}
                onValueChange={(v) => setSettings({
                  ...settings,
                  unsplash: { ...settings.unsplash, orientation: v },
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape">Paysage</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="squarish">Carré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Couleur dominante</Label>
              <Select
                value={settings.unsplash.color || 'any'}
                onValueChange={(v) => setSettings({
                  ...settings,
                  unsplash: { ...settings.unsplash, color: v === 'any' ? '' : v },
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Toutes couleurs</SelectItem>
                  <SelectItem value="black_and_white">Noir & Blanc</SelectItem>
                  <SelectItem value="black">Noir</SelectItem>
                  <SelectItem value="white">Blanc</SelectItem>
                  <SelectItem value="blue">Bleu</SelectItem>
                  <SelectItem value="green">Vert</SelectItem>
                  <SelectItem value="red">Rouge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Recherche sécurisée</p>
              <p className="text-sm text-muted-foreground">Filtrer le contenu adulte</p>
            </div>
            <Switch
              checked={settings.unsplash.safeSearch}
              onCheckedChange={(v) => setSettings({
                ...settings,
                unsplash: { ...settings.unsplash, safeSearch: v },
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Optimisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Optimisation automatique</p>
              <p className="text-sm text-muted-foreground">
                Compresser et redimensionner les images
              </p>
            </div>
            <Switch
              checked={settings.optimization.enabled}
              onCheckedChange={(v) => setSettings({
                ...settings,
                optimization: { ...settings.optimization, enabled: v },
              })}
            />
          </div>

          {settings.optimization.enabled && (
            <div className="space-y-6 pl-4 border-l-2 border-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Largeur maximum (px)</Label>
                  <Input
                    type="number"
                    value={settings.optimization.maxWidth}
                    onChange={(e) => setSettings({
                      ...settings,
                      optimization: { ...settings.optimization, maxWidth: parseInt(e.target.value) },
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Hauteur maximum (px)</Label>
                  <Input
                    type="number"
                    value={settings.optimization.maxHeight}
                    onChange={(e) => setSettings({
                      ...settings,
                      optimization: { ...settings.optimization, maxHeight: parseInt(e.target.value) },
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Qualité de compression</Label>
                  <span className="font-medium">{settings.optimization.quality}%</span>
                </div>
                <Slider
                  value={[settings.optimization.quality]}
                  onValueChange={(v) => setSettings({
                    ...settings,
                    optimization: { ...settings.optimization, quality: v[0] },
                  })}
                  min={50}
                  max={100}
                  step={5}
                />
              </div>

              <div>
                <Label>Format de sortie</Label>
                <Select
                  value={settings.optimization.format}
                  onValueChange={(v) => setSettings({
                    ...settings,
                    optimization: { ...settings.optimization, format: v },
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP (Recommandé)</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lazy loading</p>
                  <p className="text-sm text-muted-foreground">Charger les images à la demande</p>
                </div>
                <Switch
                  checked={settings.optimization.lazyLoading}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    optimization: { ...settings.optimization, lazyLoading: v },
                  })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attribution</CardTitle>
          <CardDescription>
            Créditez automatiquement les sources d'images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Activer les attributions</p>
              <p className="text-sm text-muted-foreground">
                Requis pour Unsplash
              </p>
            </div>
            <Switch
              checked={settings.attribution.enabled}
              onCheckedChange={(v) => setSettings({
                ...settings,
                attribution: { ...settings.attribution, enabled: v },
              })}
            />
          </div>

          {settings.attribution.enabled && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Template d'attribution</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Variables: {'{author}'}, {'{source}'}, {'{url}'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  value={settings.attribution.template}
                  onChange={(e) => setSettings({
                    ...settings,
                    attribution: { ...settings.attribution, template: e.target.value },
                  })}
                  className="mt-1"
                  placeholder="Photo by {author} on {source}"
                />
              </div>

              <div>
                <Label>Position</Label>
                <Select
                  value={settings.attribution.position}
                  onValueChange={(v) => setSettings({
                    ...settings,
                    attribution: { ...settings.attribution, position: v },
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caption">Légende de l'image</SelectItem>
                    <SelectItem value="footer">Pied de page</SelectItem>
                    <SelectItem value="overlay">Overlay sur l'image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
