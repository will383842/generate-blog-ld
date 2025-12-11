import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Zap, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/useToast';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    email: { generationComplete: true, generationFailed: true, publishingSuccess: true, publishingFailed: true, weeklyReport: true },
    slack: { generationComplete: false, generationFailed: true, errors: true },
    webhook: { enabled: false, url: '' },
  });

  const updateEmailSetting = (key: string, value: boolean) => {
    setSettings({ ...settings, email: { ...settings.email, [key]: value } });
  };

  const updateSlackSetting = (key: string, value: boolean) => {
    setSettings({ ...settings, slack: { ...settings.slack, [key]: value } });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({ title: 'Notifications enregistrées' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-muted-foreground">Configuration des alertes et notifications</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email</TabsTrigger>
          <TabsTrigger value="slack"><MessageSquare className="h-4 w-4 mr-2" />Slack</TabsTrigger>
          <TabsTrigger value="webhook"><Zap className="h-4 w-4 mr-2" />Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Email</CardTitle>
              <CardDescription>Recevez des alertes par email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="gen-complete">Génération terminée</Label>
                <Switch id="gen-complete" checked={settings.email.generationComplete} onCheckedChange={(v) => updateEmailSetting('generationComplete', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gen-failed">Génération échouée</Label>
                <Switch id="gen-failed" checked={settings.email.generationFailed} onCheckedChange={(v) => updateEmailSetting('generationFailed', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pub-success">Publication réussie</Label>
                <Switch id="pub-success" checked={settings.email.publishingSuccess} onCheckedChange={(v) => updateEmailSetting('publishingSuccess', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pub-failed">Publication échouée</Label>
                <Switch id="pub-failed" checked={settings.email.publishingFailed} onCheckedChange={(v) => updateEmailSetting('publishingFailed', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly">Rapport hebdomadaire</Label>
                <Switch id="weekly" checked={settings.email.weeklyReport} onCheckedChange={(v) => updateEmailSetting('weeklyReport', v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Slack</CardTitle>
              <CardDescription>Intégration avec votre workspace Slack</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Génération terminée</Label>
                <Switch checked={settings.slack.generationComplete} onCheckedChange={(v) => updateSlackSetting('generationComplete', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Génération échouée</Label>
                <Switch checked={settings.slack.generationFailed} onCheckedChange={(v) => updateSlackSetting('generationFailed', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Erreurs système</Label>
                <Switch checked={settings.slack.errors} onCheckedChange={(v) => updateSlackSetting('errors', v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Envoyez des événements vers une URL</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configuration des webhooks disponible prochainement</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}