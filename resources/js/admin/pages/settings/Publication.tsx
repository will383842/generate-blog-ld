/**
 * Publication Settings Page
 * File 362 - Publication and anti-spam settings
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
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

export default function PublicationSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    antiSpam: {
      enabled: true,
      minDelayBetweenPosts: 30,
      maxPostsPerDay: 10,
      maxPostsPerHour: 2,
      randomDelay: true,
      randomDelayMin: 5,
      randomDelayMax: 15,
    },
    scheduling: {
      defaultTime: '09:00',
      timezone: 'Europe/Paris',
      preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      avoidWeekends: true,
    },
    quality: {
      minWordCount: 500,
      maxWordCount: 2500,
      minReadabilityScore: 60,
      requireImage: true,
      requireMeta: true,
    },
    autoPublish: {
      enabled: false,
      onlyHighQuality: true,
      requireReview: true,
      maxAutoPerDay: 5,
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Paramètres enregistrés' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
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
            <Send className="h-6 w-6" />
            Publication
          </h1>
          <p className="text-muted-foreground">Paramètres de publication et anti-spam</p>
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

      {/* Anti-Spam */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Protection anti-spam
          </CardTitle>
          <CardDescription>
            Évitez d'être détecté comme spam par les moteurs de recherche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Activer la protection anti-spam</p>
              <p className="text-sm text-muted-foreground">
                Ajoute des délais entre les publications
              </p>
            </div>
            <Switch
              checked={settings.antiSpam.enabled}
              onCheckedChange={(v) => setSettings({
                ...settings,
                antiSpam: { ...settings.antiSpam, enabled: v },
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Label>Délai minimum entre publications (minutes)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Temps minimum entre deux publications sur un même site</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                value={settings.antiSpam.minDelayBetweenPosts}
                onChange={(e) => setSettings({
                  ...settings,
                  antiSpam: { ...settings.antiSpam, minDelayBetweenPosts: parseInt(e.target.value) },
                })}
                className="mt-1"
                min={5}
                max={120}
              />
            </div>

            <div>
              <Label>Maximum de publications par jour</Label>
              <Input
                type="number"
                value={settings.antiSpam.maxPostsPerDay}
                onChange={(e) => setSettings({
                  ...settings,
                  antiSpam: { ...settings.antiSpam, maxPostsPerDay: parseInt(e.target.value) },
                })}
                className="mt-1"
                min={1}
                max={50}
              />
            </div>

            <div>
              <Label>Maximum de publications par heure</Label>
              <Input
                type="number"
                value={settings.antiSpam.maxPostsPerHour}
                onChange={(e) => setSettings({
                  ...settings,
                  antiSpam: { ...settings.antiSpam, maxPostsPerHour: parseInt(e.target.value) },
                })}
                className="mt-1"
                min={1}
                max={10}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Délai aléatoire</p>
                <p className="text-sm text-muted-foreground">
                  Ajoute une variation aléatoire au délai
                </p>
              </div>
              <Switch
                checked={settings.antiSpam.randomDelay}
                onCheckedChange={(v) => setSettings({
                  ...settings,
                  antiSpam: { ...settings.antiSpam, randomDelay: v },
                })}
              />
            </div>

            {settings.antiSpam.randomDelay && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                <div>
                  <Label>Variation min (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.antiSpam.randomDelayMin}
                    onChange={(e) => setSettings({
                      ...settings,
                      antiSpam: { ...settings.antiSpam, randomDelayMin: parseInt(e.target.value) },
                    })}
                    className="mt-1"
                    min={0}
                    max={60}
                  />
                </div>
                <div>
                  <Label>Variation max (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.antiSpam.randomDelayMax}
                    onChange={(e) => setSettings({
                      ...settings,
                      antiSpam: { ...settings.antiSpam, randomDelayMax: parseInt(e.target.value) },
                    })}
                    className="mt-1"
                    min={0}
                    max={60}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Planification par défaut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Heure de publication par défaut</Label>
              <Input
                type="time"
                value={settings.scheduling.defaultTime}
                onChange={(e) => setSettings({
                  ...settings,
                  scheduling: { ...settings.scheduling, defaultTime: e.target.value },
                })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Éviter les week-ends</p>
                <p className="text-sm text-muted-foreground">
                  Ne pas programmer de publications le week-end
                </p>
              </div>
              <Switch
                checked={settings.scheduling.avoidWeekends}
                onCheckedChange={(v) => setSettings({
                  ...settings,
                  scheduling: { ...settings.scheduling, avoidWeekends: v },
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Seuils de qualité
          </CardTitle>
          <CardDescription>
            Critères minimum pour la publication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre minimum de mots</Label>
              <Input
                type="number"
                value={settings.quality.minWordCount}
                onChange={(e) => setSettings({
                  ...settings,
                  quality: { ...settings.quality, minWordCount: parseInt(e.target.value) },
                })}
                className="mt-1"
                min={100}
                max={2000}
              />
            </div>

            <div>
              <Label>Nombre maximum de mots</Label>
              <Input
                type="number"
                value={settings.quality.maxWordCount}
                onChange={(e) => setSettings({
                  ...settings,
                  quality: { ...settings.quality, maxWordCount: parseInt(e.target.value) },
                })}
                className="mt-1"
                min={500}
                max={10000}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Score de lisibilité minimum</Label>
              <span className="font-medium">{settings.quality.minReadabilityScore}</span>
            </div>
            <Slider
              value={[settings.quality.minReadabilityScore]}
              onValueChange={(v) => setSettings({
                ...settings,
                quality: { ...settings.quality, minReadabilityScore: v[0] },
              })}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Difficile (0)</span>
              <span>Facile (100)</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Image obligatoire</p>
                <p className="text-sm text-muted-foreground">
                  Chaque article doit avoir une image
                </p>
              </div>
              <Switch
                checked={settings.quality.requireImage}
                onCheckedChange={(v) => setSettings({
                  ...settings,
                  quality: { ...settings.quality, requireImage: v },
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Méta-données obligatoires</p>
                <p className="text-sm text-muted-foreground">
                  Title et description SEO requis
                </p>
              </div>
              <Switch
                checked={settings.quality.requireMeta}
                onCheckedChange={(v) => setSettings({
                  ...settings,
                  quality: { ...settings.quality, requireMeta: v },
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-publish */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Publication automatique
          </CardTitle>
          <CardDescription>
            Publier automatiquement les contenus validés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <div>
              <p className="font-medium text-yellow-800">Activer la publication automatique</p>
              <p className="text-sm text-yellow-700">
                Les contenus seront publiés sans validation manuelle
              </p>
            </div>
            <Switch
              checked={settings.autoPublish.enabled}
              onCheckedChange={(v) => setSettings({
                ...settings,
                autoPublish: { ...settings.autoPublish, enabled: v },
              })}
            />
          </div>

          {settings.autoPublish.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Uniquement haute qualité</p>
                  <p className="text-sm text-muted-foreground">
                    Score de qualité &gt; 80%
                  </p>
                </div>
                <Switch
                  checked={settings.autoPublish.onlyHighQuality}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    autoPublish: { ...settings.autoPublish, onlyHighQuality: v },
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exiger une révision</p>
                  <p className="text-sm text-muted-foreground">
                    Validation humaine requise avant publication
                  </p>
                </div>
                <Switch
                  checked={settings.autoPublish.requireReview}
                  onCheckedChange={(v) => setSettings({
                    ...settings,
                    autoPublish: { ...settings.autoPublish, requireReview: v },
                  })}
                />
              </div>

              <div>
                <Label>Maximum de publications auto par jour</Label>
                <Input
                  type="number"
                  value={settings.autoPublish.maxAutoPerDay}
                  onChange={(e) => setSettings({
                    ...settings,
                    autoPublish: { ...settings.autoPublish, maxAutoPerDay: parseInt(e.target.value) },
                  })}
                  className="mt-1"
                  min={1}
                  max={20}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
