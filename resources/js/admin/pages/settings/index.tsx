/**
 * Settings Index Page
 * File 361 - General settings
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Globe,
  Clock,
  Bell,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

// Timezones list
const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/London', label: 'Londres (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+11)' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    theme: 'system',
    notifications: {
      email: true,
      browser: true,
      programStart: true,
      programEnd: true,
      errors: true,
      weeklyReport: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update setting
  const updateSetting = (key: string, value: string | boolean | Record<string, boolean>) => {
    setSettings({ ...settings, [key]: value });
  };

  // Update notification
  const updateNotification = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply language change
      if (settings.language !== i18n.language) {
        i18n.changeLanguage(settings.language);
      }

      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      }

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
            <Settings className="h-6 w-6" />
            Paramètres
          </h1>
          <p className="text-muted-foreground">Paramètres généraux de l'application</p>
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

      {/* Language & Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Langue et fuseau horaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Langue de l'interface</Label>
              <Select
                value={settings.language}
                onValueChange={(v) => updateSetting('language', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">
                    <div className="flex items-center gap-2">
                      <span>🇫🇷</span>
                      Français
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span>🇬🇧</span>
                      English
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fuseau horaire</Label>
              <Select
                value={settings.timezone}
                onValueChange={(v) => updateSetting('timezone', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(v) => updateSetting('theme', v)}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="light" id="theme-light" className="sr-only" />
              <Label
                htmlFor="theme-light"
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  settings.theme === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="font-medium">Clair</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
              <Label
                htmlFor="theme-dark"
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  settings.theme === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <Moon className="h-6 w-6 text-gray-200" />
                </div>
                <span className="font-medium">Sombre</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="system" id="theme-system" className="sr-only" />
              <Label
                htmlFor="theme-system"
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  settings.theme === 'system'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-medium">Système</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configurez comment vous souhaitez être notifié
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Notifications par email</p>
              <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(v) => updateNotification('email', v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Notifications navigateur</p>
              <p className="text-sm text-muted-foreground">Notifications push dans le navigateur</p>
            </div>
            <Switch
              checked={settings.notifications.browser}
              onCheckedChange={(v) => updateNotification('browser', v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Démarrage des programmes</p>
              <p className="text-sm text-muted-foreground">Notification quand un programme démarre</p>
            </div>
            <Switch
              checked={settings.notifications.programStart}
              onCheckedChange={(v) => updateNotification('programStart', v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Fin des programmes</p>
              <p className="text-sm text-muted-foreground">Notification quand un programme termine</p>
            </div>
            <Switch
              checked={settings.notifications.programEnd}
              onCheckedChange={(v) => updateNotification('programEnd', v)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Erreurs système</p>
              <p className="text-sm text-muted-foreground">Alertes en cas d'erreur critique</p>
            </div>
            <Switch
              checked={settings.notifications.errors}
              onCheckedChange={(v) => updateNotification('errors', v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Rapport hebdomadaire</p>
              <p className="text-sm text-muted-foreground">Résumé des statistiques chaque semaine</p>
            </div>
            <Switch
              checked={settings.notifications.weeklyReport}
              onCheckedChange={(v) => updateNotification('weeklyReport', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
