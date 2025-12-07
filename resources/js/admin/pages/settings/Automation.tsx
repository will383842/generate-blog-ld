/**
 * Automation Settings Page
 * File 372 - Full automation configuration page
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Zap,
  Save,
  RotateCcw,
  Languages,
  Image,
  Send,
  Search,
  Shield,
  Clock,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/Alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { AutomationChain } from '@/components/automation/AutomationChain';
import { AutomationStatus } from '@/components/automation/AutomationStatus';
import { WorkersMonitor } from '@/components/automation/WorkersMonitor';
import {
  useAutomationSettings,
  useAutomationStatus,
  useUpdateAutomationSettings,
  useToggleAutomation,
  useTestAutomation,
  useAutomationLevel,
} from '@/hooks/useAutomation';
import { AutomationSettings, AutomationSettingsInput, DAYS_OF_WEEK } from '@/types/automation';
import { cn } from '@/lib/utils';

// Validation schema
const automationSchema = z.object({
  autoTranslate: z.boolean(),
  autoGenerateImage: z.boolean(),
  autoPublish: z.boolean(),
  autoIndex: z.boolean(),
  minQualityScore: z.number().min(0).max(100),
  articlesPerDay: z.number().min(1).max(500),
  maxPerHour: z.number().min(1).max(60),
  minIntervalMinutes: z.number().min(1).max(60),
  activeHours: z.array(z.number()),
  activeDays: z.array(z.number()),
  indexingProviders: z.object({
    google: z.boolean(),
    bing: z.boolean(),
    indexNow: z.boolean(),
  }),
});

export default function AutomationPage() {
  const { t } = useTranslation();

  const { data: settings, isLoading: settingsLoading } = useAutomationSettings();
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useAutomationStatus();
  const updateSettings = useUpdateAutomationSettings();
  const toggleAutomation = useToggleAutomation();
  const testAutomation = useTestAutomation();
  const { level, label, color } = useAutomationLevel();

  const [localSettings, setLocalSettings] = useState<AutomationSettingsInput | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize local settings
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  // Update local setting
  const updateLocalSetting = <K extends keyof AutomationSettingsInput>(
    key: K,
    value: AutomationSettingsInput[K]
  ) => {
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
    setIsDirty(true);
  };

  // Handle toggle (immediate)
  const handleToggle = async (
    key: keyof Pick<AutomationSettings, 'autoTranslate' | 'autoGenerateImage' | 'autoPublish' | 'autoIndex'>,
    value: boolean
  ) => {
    toggleAutomation.mutate({ key, value });
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  // Handle test
  const handleTest = async () => {
    return testAutomation.mutateAsync();
  };

  // Save all settings
  const handleSave = () => {
    if (localSettings) {
      updateSettings.mutate(localSettings, {
        onSuccess: () => setIsDirty(false),
      });
    }
  };

  // Reset to saved
  const handleReset = () => {
    if (settings) {
      setLocalSettings(settings);
      setIsDirty(false);
    }
  };

  // Toggle hour
  const toggleHour = (hour: number) => {
    const current = localSettings?.activeHours || [];
    const newHours = current.includes(hour)
      ? current.filter(h => h !== hour)
      : [...current, hour].sort((a, b) => a - b);
    updateLocalSetting('activeHours', newHours);
  };

  // Toggle day
  const toggleDay = (day: number) => {
    const current = localSettings?.activeDays || [];
    const newDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    updateLocalSetting('activeDays', newDays);
  };

  if (settingsLoading || statusLoading || !localSettings || !status) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Automatisation
          </h1>
          <p className="text-muted-foreground">
            Configurez la chaîne d'automatisation post-génération
          </p>
        </div>
        <Badge variant="outline" className={cn(
          'text-sm',
          color === 'green' && 'bg-green-100 text-green-800 border-green-200',
          color === 'orange' && 'bg-orange-100 text-orange-800 border-orange-200',
          color === 'gray' && 'bg-gray-100 text-gray-800 border-gray-200'
        )}>
          {label}
        </Badge>
      </div>

      {/* Status & Chain */}
      <div className="space-y-6">
        <AutomationStatus
          settings={localSettings as AutomationSettings}
          status={status}
          onToggle={handleToggle}
          onTest={handleTest}
          isTestRunning={testAutomation.isPending}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chaîne d'automatisation</CardTitle>
          </CardHeader>
          <CardContent>
            <AutomationChain
              settings={localSettings as AutomationSettings}
              status={status}
            />
          </CardContent>
        </Card>
      </div>

      {/* Workers Monitor */}
      <Card>
        <CardContent className="pt-6">
          <WorkersMonitor
            status={status}
            onRefresh={() => refetchStatus()}
            isAdmin={true}
          />
        </CardContent>
      </Card>

      {/* Post-Generation Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Configuration Post-Génération
          </CardTitle>
          <CardDescription>
            Actions automatiques après la génération d'un article
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Translate */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Traduction automatique</p>
                <p className="text-sm text-muted-foreground">
                  Traduit automatiquement dans les langues cibles configurées
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.autoTranslate}
              onCheckedChange={(v) => handleToggle('autoTranslate', v)}
            />
          </div>

          {/* Auto-Image */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Génération d'image automatique</p>
                <p className="text-sm text-muted-foreground">
                  Génère ou sélectionne une image à la une
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.autoGenerateImage}
              onCheckedChange={(v) => handleToggle('autoGenerateImage', v)}
            />
          </div>

          {/* Auto-Publish */}
          <div className={cn(
            'flex items-center justify-between py-3 border-b rounded-lg px-3',
            localSettings.autoPublish && 'bg-orange-50 border-orange-200'
          )}>
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-violet-600" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Publication automatique</p>
                  {localSettings.autoPublish && (
                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Attention
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Publie automatiquement les articles validés
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.autoPublish}
              onCheckedChange={(v) => handleToggle('autoPublish', v)}
            />
          </div>

          {localSettings.autoPublish && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Les articles seront publiés automatiquement sans validation manuelle.
                Assurez-vous d'avoir configuré des seuils de qualité appropriés.
              </AlertDescription>
            </Alert>
          )}

          {/* Min Quality Score */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Label>Score de qualité minimum</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Articles sous ce seuil ne seront pas publiés automatiquement</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-medium">{localSettings.minQualityScore}%</span>
            </div>
            <Slider
              value={[localSettings.minQualityScore || 70]}
              onValueChange={(v) => updateLocalSetting('minQualityScore', v[0])}
              min={0}
              max={100}
              step={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Anti-Spam Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Limites Anti-Spam
          </CardTitle>
          <CardDescription>
            Protégez vos sites contre la détection spam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Articles par jour (max)</Label>
              <Input
                type="number"
                value={localSettings.articlesPerDay}
                onChange={(e) => updateLocalSetting('articlesPerDay', parseInt(e.target.value) || 1)}
                min={1}
                max={500}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Articles par heure (max)</Label>
              <Input
                type="number"
                value={localSettings.maxPerHour}
                onChange={(e) => updateLocalSetting('maxPerHour', parseInt(e.target.value) || 1)}
                min={1}
                max={60}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Intervalle minimum (minutes)</Label>
              <Input
                type="number"
                value={localSettings.minIntervalMinutes}
                onChange={(e) => updateLocalSetting('minIntervalMinutes', parseInt(e.target.value) || 1)}
                min={1}
                max={60}
                className="mt-1"
              />
            </div>
          </div>

          {/* Active Hours */}
          <div>
            <Label className="mb-3 block">Heures actives</Label>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 24 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => toggleHour(i)}
                  className={cn(
                    'p-2 text-xs rounded transition-colors',
                    localSettings.activeHours?.includes(i)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {i}h
                </button>
              ))}
            </div>
          </div>

          {/* Active Days */}
          <div>
            <Label className="mb-3 block">Jours actifs</Label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    localSettings.activeDays?.includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indexing SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Indexation SEO
          </CardTitle>
          <CardDescription>
            Soumission automatique aux moteurs de recherche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Index Main Toggle */}
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Indexation automatique</p>
              <p className="text-sm text-muted-foreground">
                Soumet automatiquement les articles publiés
              </p>
            </div>
            <Switch
              checked={localSettings.autoIndex}
              onCheckedChange={(v) => handleToggle('autoIndex', v)}
            />
          </div>

          {/* Provider Toggles */}
          {localSettings.autoIndex && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔍</span>
                  <span className="font-medium">Google</span>
                </div>
                <Switch
                  checked={localSettings.indexingProviders?.google ?? true}
                  onCheckedChange={(v) => updateLocalSetting('indexingProviders', {
                    ...localSettings.indexingProviders,
                    google: v,
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔎</span>
                  <span className="font-medium">Bing</span>
                </div>
                <Switch
                  checked={localSettings.indexingProviders?.bing ?? true}
                  onCheckedChange={(v) => updateLocalSetting('indexingProviders', {
                    ...localSettings.indexingProviders,
                    bing: v,
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium">IndexNow</span>
                </div>
                <Switch
                  checked={localSettings.indexingProviders?.indexNow ?? true}
                  onCheckedChange={(v) => updateLocalSetting('indexingProviders', {
                    ...localSettings.indexingProviders,
                    indexNow: v,
                  })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-end gap-4 z-50">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!isDirty}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isDirty || updateSettings.isPending}
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
