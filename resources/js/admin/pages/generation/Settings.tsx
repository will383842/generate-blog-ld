/**
 * Generation Settings Page
 * Configuration for content generation
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  RefreshCw,
  Zap,
  DollarSign,
  Shield,
  Bell,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import { CONTENT_TYPES } from '@/utils/constants';
import type { ContentTypeId } from '@/types/program';
import type { GenerationSettings } from '@/types/generation';

const AI_MODELS = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: '$0.03/1K tokens' },
  { id: 'gpt-4', name: 'GPT-4', cost: '$0.06/1K tokens' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: '$0.002/1K tokens' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', cost: '$0.015/1K tokens' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', cost: '$0.003/1K tokens' },
];

const DEFAULT_SETTINGS: GenerationSettings = {
  dailyLimit: 100,
  monthlyLimit: 2000,
  concurrentLimit: 5,
  defaultModels: {
    article: 'gpt-4-turbo',
    pillar: 'gpt-4-turbo',
    comparative: 'gpt-4-turbo',
    landing: 'gpt-4-turbo',
    press_release: 'gpt-4-turbo',
    press_dossier: 'gpt-4-turbo',
    faq: 'gpt-3.5-turbo',
    guide: 'gpt-4-turbo',
    glossary: 'gpt-3.5-turbo',
    news: 'gpt-4-turbo',
    review: 'gpt-4-turbo',
    comparison: 'gpt-4-turbo',
  } as Record<ContentTypeId, string>,
  defaultTemplates: {} as Record<ContentTypeId, string>,
  qualityThreshold: 70,
  autoRejectBelowThreshold: false,
  autoRetry: true,
  maxRetries: 3,
  retryDelayMinutes: 5,
  notifyOnComplete: false,
  notifyOnFail: true,
  notifyEmail: '',
  dailyBudget: 50,
  monthlyBudget: 500,
  alertOnBudgetPercent: 80,
};

export function SettingsPage() {
  const api = useApi();
  const { toast } = useToast();
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/settings', {
        params: { group: 'generation', format: 'keyvalue' },
      });

      if (response.data?.success && response.data?.data) {
        const apiSettings = response.data.data;

        // Merge API settings with defaults
        const mergedSettings: GenerationSettings = {
          ...DEFAULT_SETTINGS,
          dailyLimit: parseInt(apiSettings.daily_limit) || DEFAULT_SETTINGS.dailyLimit,
          monthlyLimit: parseInt(apiSettings.monthly_limit) || DEFAULT_SETTINGS.monthlyLimit,
          concurrentLimit: parseInt(apiSettings.concurrent_limit) || DEFAULT_SETTINGS.concurrentLimit,
          defaultModels: apiSettings.default_models
            ? (typeof apiSettings.default_models === 'string'
                ? JSON.parse(apiSettings.default_models)
                : apiSettings.default_models)
            : DEFAULT_SETTINGS.defaultModels,
          qualityThreshold: parseInt(apiSettings.quality_threshold) || DEFAULT_SETTINGS.qualityThreshold,
          autoRejectBelowThreshold: apiSettings.auto_reject_below_threshold === 'true' || apiSettings.auto_reject_below_threshold === true,
          autoRetry: apiSettings.auto_retry !== 'false' && apiSettings.auto_retry !== false,
          maxRetries: parseInt(apiSettings.max_retries) || DEFAULT_SETTINGS.maxRetries,
          retryDelayMinutes: parseInt(apiSettings.retry_delay_minutes) || DEFAULT_SETTINGS.retryDelayMinutes,
          notifyOnComplete: apiSettings.notify_on_complete === 'true' || apiSettings.notify_on_complete === true,
          notifyOnFail: apiSettings.notify_on_fail !== 'false' && apiSettings.notify_on_fail !== false,
          notifyEmail: apiSettings.notify_email || '',
          dailyBudget: parseFloat(apiSettings.daily_budget) || DEFAULT_SETTINGS.dailyBudget,
          monthlyBudget: parseFloat(apiSettings.monthly_budget) || DEFAULT_SETTINGS.monthlyBudget,
          alertOnBudgetPercent: parseInt(apiSettings.alert_on_budget_percent) || DEFAULT_SETTINGS.alertOnBudgetPercent,
        };

        setSettings(mergedSettings);
        setOriginalSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build settings object for API
      const settingsToSave: Record<string, string | number | boolean | object> = {
        daily_limit: settings.dailyLimit,
        monthly_limit: settings.monthlyLimit,
        concurrent_limit: settings.concurrentLimit,
        default_models: JSON.stringify(settings.defaultModels),
        quality_threshold: settings.qualityThreshold,
        auto_reject_below_threshold: settings.autoRejectBelowThreshold,
        auto_retry: settings.autoRetry,
        max_retries: settings.maxRetries,
        retry_delay_minutes: settings.retryDelayMinutes,
        notify_on_complete: settings.notifyOnComplete,
        notify_on_fail: settings.notifyOnFail,
        notify_email: settings.notifyEmail,
        daily_budget: settings.dailyBudget,
        monthly_budget: settings.monthlyBudget,
        alert_on_budget_percent: settings.alertOnBudgetPercent,
      };

      // Bulk update all settings
      await api.post('/settings/bulk-update', {
        settings: settingsToSave,
      });

      setOriginalSettings(settings);
      setHasChanges(false);

      toast({
        title: 'Paramètres enregistrés',
        description: 'Les modifications ont été sauvegardées avec succès',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/generation">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">
              Configuration de la génération de contenu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" onClick={handleCancel}>
              Annuler
            </Button>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Vous avez des modifications non enregistrées
          </span>
        </div>
      )}

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Limites
          </CardTitle>
          <CardDescription>
            Configurez les limites de génération
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Limite quotidienne</Label>
              <Input
                type="number"
                value={settings.dailyLimit}
                onChange={(e) => updateSetting('dailyLimit', parseInt(e.target.value) || 0)}
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">Articles par jour</p>
            </div>
            <div>
              <Label>Limite mensuelle</Label>
              <Input
                type="number"
                value={settings.monthlyLimit}
                onChange={(e) => updateSetting('monthlyLimit', parseInt(e.target.value) || 0)}
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">Articles par mois</p>
            </div>
            <div>
              <Label>Jobs simultanés</Label>
              <Input
                type="number"
                value={settings.concurrentLimit}
                onChange={(e) => updateSetting('concurrentLimit', parseInt(e.target.value) || 1)}
                min={1}
                max={20}
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum: 20</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Models */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles IA par défaut</CardTitle>
          <CardDescription>
            Sélectionnez le modèle IA pour chaque type de contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {CONTENT_TYPES.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <type.icon className="w-4 h-4" style={{ color: type.color }} />
                  <span className="font-medium">{type.name}</span>
                </div>
                <Select
                  value={settings.defaultModels[type.id as ContentTypeId] || 'gpt-4-turbo'}
                  onChange={(e) =>
                    updateSetting('defaultModels', {
                      ...settings.defaultModels,
                      [type.id]: e.target.value,
                    })
                  }
                  className="w-48"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Qualité
          </CardTitle>
          <CardDescription>
            Paramètres de contrôle qualité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Seuil de qualité minimum</Label>
              <Badge variant="outline">{settings.qualityThreshold}%</Badge>
            </div>
            <Slider
              value={[settings.qualityThreshold]}
              onValueChange={([value]) => updateSetting('qualityThreshold', value)}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Les articles en dessous de ce seuil seront marqués pour révision
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Rejet automatique</Label>
              <p className="text-xs text-muted-foreground">
                Rejeter automatiquement les articles sous le seuil
              </p>
            </div>
            <Switch
              checked={settings.autoRejectBelowThreshold}
              onCheckedChange={(checked) => updateSetting('autoRejectBelowThreshold', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Retry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Relance automatique
          </CardTitle>
          <CardDescription>
            Configuration des tentatives de relance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer la relance automatique</Label>
              <p className="text-xs text-muted-foreground">
                Relancer automatiquement les jobs échoués
              </p>
            </div>
            <Switch
              checked={settings.autoRetry}
              onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
            />
          </div>

          {settings.autoRetry && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre de tentatives</Label>
                <Input
                  type="number"
                  value={settings.maxRetries}
                  onChange={(e) => updateSetting('maxRetries', parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                />
              </div>
              <div>
                <Label>Délai entre tentatives (minutes)</Label>
                <Input
                  type="number"
                  value={settings.retryDelayMinutes}
                  onChange={(e) => updateSetting('retryDelayMinutes', parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget
          </CardTitle>
          <CardDescription>
            Limites de coûts et alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget quotidien ($)</Label>
              <Input
                type="number"
                value={settings.dailyBudget}
                onChange={(e) => updateSetting('dailyBudget', parseFloat(e.target.value) || 0)}
                min={0}
                step={10}
              />
            </div>
            <div>
              <Label>Budget mensuel ($)</Label>
              <Input
                type="number"
                value={settings.monthlyBudget}
                onChange={(e) => updateSetting('monthlyBudget', parseFloat(e.target.value) || 0)}
                min={0}
                step={50}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Alerte à</Label>
              <Badge variant="outline">{settings.alertOnBudgetPercent}%</Badge>
            </div>
            <Slider
              value={[settings.alertOnBudgetPercent]}
              onValueChange={([value]) => updateSetting('alertOnBudgetPercent', value)}
              min={50}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recevoir une alerte quand le budget atteint ce pourcentage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Paramètres de notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notifier à la complétion</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir un email quand un job est terminé
              </p>
            </div>
            <Switch
              checked={settings.notifyOnComplete}
              onCheckedChange={(checked) => updateSetting('notifyOnComplete', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Notifier en cas d'échec</Label>
              <p className="text-xs text-muted-foreground">
                Recevoir un email quand un job échoue
              </p>
            </div>
            <Switch
              checked={settings.notifyOnFail}
              onCheckedChange={(checked) => updateSetting('notifyOnFail', checked)}
            />
          </div>

          {(settings.notifyOnComplete || settings.notifyOnFail) && (
            <div>
              <Label>Email de notification</Label>
              <Input
                type="email"
                value={settings.notifyEmail || ''}
                onChange={(e) => updateSetting('notifyEmail', e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
