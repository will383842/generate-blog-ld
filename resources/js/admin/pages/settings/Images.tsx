/**
 * Images Settings Page
 * File 364 - Image source and optimization settings
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface ImageSettings {
  defaultSource: string;
  dalle: {
    style: string;
    size: string;
    quality: string;
    model: string;
  };
  unsplash: {
    orientation: string;
    color: string;
    safeSearch: boolean;
  };
  optimization: {
    enabled: boolean;
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: string;
    lazyLoading: boolean;
  };
  attribution: {
    enabled: boolean;
    template: string;
    position: string;
  };
}

export default function ImagesSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Fetch image settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings', 'images'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings/images');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  const [sources, setSources] = useState<ImageSource[]>([]);
  const [settings, setSettings] = useState<ImageSettings | null>(null);

  // Update local state when data is loaded
  useEffect(() => {
    if (settingsData) {
      setSources(settingsData.sources || []);
      setSettings(settingsData.settings || null);
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { sources: ImageSource[], settings: ImageSettings }) => {
      const res = await fetch('/api/admin/settings/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'images'] });
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres d\'images ont été mis à jour',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      });
    },
  });

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
  const handleSave = () => {
    if (settings) {
      saveMutation.mutate({ sources, settings });
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6" />
            Configuration Images
          </h1>
          <p className="text-muted-foreground">
            Gérez les sources et l'optimisation des images
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Image Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Sources d'images</CardTitle>
          <CardDescription>
            Configurez l'ordre de priorité des sources d'images (glisser-déposer)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              draggable
              onDragStart={() => handleDragStart(source.id)}
              onDragOver={(e) => handleDragOver(e, source.id)}
              onDrop={handleDrop}
              className={cn(
                'flex items-center justify-between p-4 border rounded-lg cursor-move',
                'hover:bg-accent transition-colors',
                draggedItem === source.id && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl">{source.icon}</span>
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Priorité: {source.priority}
                  </p>
                </div>
              </div>
              <Switch
                checked={source.enabled}
                onCheckedChange={() => toggleSource(source.id)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Default Source */}
      <Card>
        <CardHeader>
          <CardTitle>Source par défaut</CardTitle>
          <CardDescription>
            Choisissez la source utilisée par défaut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.defaultSource}
            onValueChange={(value) => setSettings({ ...settings, defaultSource: value })}
          >
            {sources.filter(s => s.enabled).map(source => (
              <div key={source.id} className="flex items-center space-x-2">
                <RadioGroupItem value={source.id} id={source.id} />
                <Label htmlFor={source.id} className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xl">{source.icon}</span>
                  {source.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* DALL-E Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres DALL-E</CardTitle>
          <CardDescription>
            Configuration pour la génération d'images IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Style</Label>
              <Select
                value={settings.dalle.style}
                onValueChange={(value) => setSettings({
                  ...settings,
                  dalle: { ...settings.dalle, style: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Naturel</SelectItem>
                  <SelectItem value="vivid">Vif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Taille</Label>
              <Select
                value={settings.dalle.size}
                onValueChange={(value) => setSettings({
                  ...settings,
                  dalle: { ...settings.dalle, size: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024x1024</SelectItem>
                  <SelectItem value="1792x1024">1792x1024</SelectItem>
                  <SelectItem value="1024x1792">1024x1792</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Optimisation</CardTitle>
          <CardDescription>
            Paramètres d'optimisation automatique des images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activer l'optimisation</Label>
            <Switch
              checked={settings.optimization.enabled}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                optimization: { ...settings.optimization, enabled: checked }
              })}
            />
          </div>

          {settings.optimization.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Largeur max (px)</Label>
                  <Input
                    type="number"
                    value={settings.optimization.maxWidth}
                    onChange={(e) => setSettings({
                      ...settings,
                      optimization: { ...settings.optimization, maxWidth: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label>Hauteur max (px)</Label>
                  <Input
                    type="number"
                    value={settings.optimization.maxHeight}
                    onChange={(e) => setSettings({
                      ...settings,
                      optimization: { ...settings.optimization, maxHeight: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Qualité: {settings.optimization.quality}%</Label>
                <Slider
                  value={[settings.optimization.quality]}
                  onValueChange={([value]) => setSettings({
                    ...settings,
                    optimization: { ...settings.optimization, quality: value }
                  })}
                  min={1}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Format de sortie</Label>
                <Select
                  value={settings.optimization.format}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    optimization: { ...settings.optimization, format: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>Attribution</CardTitle>
          <CardDescription>
            Configuration de l'attribution des sources d'images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activer l'attribution</Label>
            <Switch
              checked={settings.attribution.enabled}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                attribution: { ...settings.attribution, enabled: checked }
              })}
            />
          </div>

          {settings.attribution.enabled && (
            <>
              <div>
                <Label>Template d'attribution</Label>
                <Input
                  value={settings.attribution.template}
                  onChange={(e) => setSettings({
                    ...settings,
                    attribution: { ...settings.attribution, template: e.target.value }
                  })}
                  placeholder="Photo by {author} on {source}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: {'{author}'}, {'{source}'}
                </p>
              </div>

              <div>
                <Label>Position</Label>
                <Select
                  value={settings.attribution.position}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    attribution: { ...settings.attribution, position: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caption">Légende</SelectItem>
                    <SelectItem value="overlay">Superposition</SelectItem>
                    <SelectItem value="footer">Pied de page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
