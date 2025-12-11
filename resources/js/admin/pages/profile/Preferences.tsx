/**
 * Profile Preferences Page
 * User preferences for notifications, display, language, and behavior
 */

import React, { useState } from 'react';
import { Settings, Bell, Monitor, Globe, Palette, Zap, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

export default function ProfilePreferencesPage() {
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState({
    // Display
    theme: 'system',
    compactMode: false,
    animationsEnabled: true,
    
    // Language
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Europe/Paris',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationSound: true,
    
    // Notification Types
    contentGenerated: true,
    contentPublished: true,
    systemAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
    
    // Behavior
    autoSave: true,
    confirmBeforeDelete: true,
    showTutorials: true,
    defaultView: 'grid',
  });

  const handleSave = () => {
    toast({ title: 'Préférences enregistrées avec succès' });
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences({ ...preferences, [key]: value });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Préférences
          </h1>
          <p className="text-muted-foreground">Personnalisez votre expérience</p>
        </div>
        <Button onClick={handleSave}>
          Enregistrer les modifications
        </Button>
      </div>

      <Tabs defaultValue="display" className="space-y-6">
        <TabsList>
          <TabsTrigger value="display">
            <Monitor className="w-4 h-4 mr-2" />
            Affichage
          </TabsTrigger>
          <TabsTrigger value="language">
            <Globe className="w-4 h-4 mr-2" />
            Langue & Région
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Zap className="w-4 h-4 mr-2" />
            Comportement
          </TabsTrigger>
        </TabsList>

        {/* Display Tab */}
        <TabsContent value="display">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Thème
                </CardTitle>
                <CardDescription>Choisissez l'apparence de l'interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={preferences.theme}
                  onValueChange={(value) => updatePreference('theme', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex-1 cursor-pointer">
                      <div className="font-medium">Clair</div>
                      <div className="text-xs text-muted-foreground">Interface lumineuse</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex-1 cursor-pointer">
                      <div className="font-medium">Sombre</div>
                      <div className="text-xs text-muted-foreground">Interface sombre</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex-1 cursor-pointer">
                      <div className="font-medium">Système</div>
                      <div className="text-xs text-muted-foreground">Suit les réglages de l'appareil</div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options d'affichage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Mode compact</div>
                    <div className="text-sm text-muted-foreground">
                      Interface plus dense
                    </div>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => updatePreference('compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Animations</div>
                    <div className="text-sm text-muted-foreground">
                      Transitions et effets visuels
                    </div>
                  </div>
                  <Switch
                    checked={preferences.animationsEnabled}
                    onCheckedChange={(checked) => updatePreference('animationsEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vue par défaut</Label>
                  <Select
                    value={preferences.defaultView}
                    onValueChange={(value) => updatePreference('defaultView', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grille</SelectItem>
                      <SelectItem value="list">Liste</SelectItem>
                      <SelectItem value="table">Tableau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Language & Region Tab */}
        <TabsContent value="language">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Langue et localisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Langue de l'interface</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => updatePreference('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => updatePreference('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Format de date</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) => updatePreference('dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format d'heure</Label>
                  <Select
                    value={preferences.timeFormat}
                    onValueChange={(value) => updatePreference('timeFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 heures</SelectItem>
                      <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Canaux de notification</CardTitle>
                <CardDescription>Choisissez comment recevoir vos notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">
                        williams@sos-expat.com
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Push</div>
                      <div className="text-sm text-muted-foreground">
                        Notifications navigateur
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">SMS</div>
                      <div className="text-sm text-muted-foreground">
                        +33 6 12 34 56 78
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) => updatePreference('smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Son des notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Alertes sonores
                    </div>
                  </div>
                  <Switch
                    checked={preferences.notificationSound}
                    onCheckedChange={(checked) => updatePreference('notificationSound', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Types de notifications</CardTitle>
                <CardDescription>Choisissez ce que vous souhaitez recevoir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Contenu généré</div>
                    <div className="text-sm text-muted-foreground">
                      Nouveaux articles créés
                    </div>
                  </div>
                  <Switch
                    checked={preferences.contentGenerated}
                    onCheckedChange={(checked) => updatePreference('contentGenerated', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Contenu publié</div>
                    <div className="text-sm text-muted-foreground">
                      Articles mis en ligne
                    </div>
                  </div>
                  <Switch
                    checked={preferences.contentPublished}
                    onCheckedChange={(checked) => updatePreference('contentPublished', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alertes système</div>
                    <div className="text-sm text-muted-foreground">
                      Erreurs et maintenances
                    </div>
                  </div>
                  <Switch
                    checked={preferences.systemAlerts}
                    onCheckedChange={(checked) => updatePreference('systemAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Emails marketing</div>
                    <div className="text-sm text-muted-foreground">
                      Nouveautés et promotions
                    </div>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Résumé hebdomadaire</div>
                    <div className="text-sm text-muted-foreground">
                      Statistiques de la semaine
                    </div>
                  </div>
                  <Switch
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comportement de l'application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sauvegarde automatique</div>
                    <div className="text-sm text-muted-foreground">
                      Enregistrer les modifications automatiquement
                    </div>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => updatePreference('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Confirmer avant suppression</div>
                    <div className="text-sm text-muted-foreground">
                      Demander confirmation pour les suppressions
                    </div>
                  </div>
                  <Switch
                    checked={preferences.confirmBeforeDelete}
                    onCheckedChange={(checked) => updatePreference('confirmBeforeDelete', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Afficher les tutoriels</div>
                    <div className="text-sm text-muted-foreground">
                      Guides d'utilisation pour les nouvelles fonctionnalités
                    </div>
                  </div>
                  <Switch
                    checked={preferences.showTutorials}
                    onCheckedChange={(checked) => updatePreference('showTutorials', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Éléments par page</Label>
                  <Select defaultValue="25">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Qualité des images</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse (rapide)</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
