/**
 * Backups Admin Page
 * File 360 - Backup management full page
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  Cloud,
  Settings,
  Calendar,
  HardDrive,
  Upload,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { BackupManager } from '@/components/admin/BackupManager';
import {
  useBackupSchedule,
  useUpdateBackupSchedule,
} from '@/hooks/useSystem';
import { cn } from '@/lib/utils';

export default function BackupsPage() {
  const { t } = useTranslation();

  const { data: schedule } = useBackupSchedule();
  const updateSchedule = useUpdateBackupSchedule();

  const [showCloudDialog, setShowCloudDialog] = useState(false);
  const [cloudConfig, setCloudConfig] = useState({
    provider: 's3',
    bucket: '',
    region: '',
    accessKey: '',
    secretKey: '',
  });

  // Save cloud config
  const handleSaveCloud = () => {
    updateSchedule.mutate({
      cloudSync: true,
      cloudProvider: cloudConfig.provider,
    });
    setShowCloudDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Sauvegardes
          </h1>
          <p className="text-muted-foreground">Gestion des sauvegardes et restauration</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="backups">
        <TabsList>
          <TabsTrigger value="backups">
            <Database className="h-4 w-4 mr-2" />
            Sauvegardes
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Planification
          </TabsTrigger>
          <TabsTrigger value="cloud">
            <Cloud className="h-4 w-4 mr-2" />
            Synchronisation Cloud
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Shield className="h-4 w-4 mr-2" />
            Rétention
          </TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="mt-6">
          <BackupManager />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planification automatique</CardTitle>
              <CardDescription>
                Configurez les sauvegardes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Activer les sauvegardes automatiques</p>
                  <p className="text-sm text-muted-foreground">
                    Les sauvegardes seront créées selon la planification
                  </p>
                </div>
                <Switch
                  checked={schedule?.enabled}
                  onCheckedChange={(enabled) => updateSchedule.mutate({ enabled })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Fréquence</Label>
                  <Select
                    value={schedule?.frequency}
                    onValueChange={(frequency) => updateSchedule.mutate({ frequency: frequency as 'daily' | 'weekly' | 'monthly' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {schedule?.frequency === 'weekly' && (
                  <div>
                    <Label>Jour de la semaine</Label>
                    <Select
                      value={String(schedule?.dayOfWeek || 0)}
                      onValueChange={(v) => updateSchedule.mutate({ dayOfWeek: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Dimanche</SelectItem>
                        <SelectItem value="1">Lundi</SelectItem>
                        <SelectItem value="2">Mardi</SelectItem>
                        <SelectItem value="3">Mercredi</SelectItem>
                        <SelectItem value="4">Jeudi</SelectItem>
                        <SelectItem value="5">Vendredi</SelectItem>
                        <SelectItem value="6">Samedi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {schedule?.frequency === 'monthly' && (
                  <div>
                    <Label>Jour du mois</Label>
                    <Select
                      value={String(schedule?.dayOfMonth || 1)}
                      onValueChange={(v) => updateSchedule.mutate({ dayOfMonth: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => (
                          <SelectItem key={i} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Heure</Label>
                  <Input
                    type="time"
                    value={schedule?.time || '03:00'}
                    onChange={(e) => updateSchedule.mutate({ time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Types de sauvegarde</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {(['full', 'database', 'files'] as const).map(type => (
                    <div
                      key={type}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-colors',
                        schedule?.types?.includes(type)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground'
                      )}
                      onClick={() => {
                        const types = schedule?.types || [];
                        const newTypes = types.includes(type)
                          ? types.filter(t => t !== type)
                          : [...types, type];
                        updateSchedule.mutate({ types: newTypes });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="font-medium">
                          {type === 'full' && 'Complète'}
                          {type === 'database' && 'Base de données'}
                          {type === 'files' && 'Fichiers'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloud Tab */}
        <TabsContent value="cloud" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Synchronisation Cloud</CardTitle>
              <CardDescription>
                Sauvegardez automatiquement vers le cloud
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Synchronisation Cloud</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule?.cloudSync
                        ? `Connecté à ${schedule.cloudProvider}`
                        : 'Non configuré'
                      }
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowCloudDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 's3', name: 'Amazon S3', icon: '🪣' },
                  { id: 'gcs', name: 'Google Cloud Storage', icon: '☁️' },
                  { id: 'azure', name: 'Azure Blob Storage', icon: '📦' },
                ].map(provider => (
                  <Card
                    key={provider.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      schedule?.cloudProvider === provider.id && 'border-primary'
                    )}
                  >
                    <CardContent className="pt-4 text-center">
                      <span className="text-4xl">{provider.icon}</span>
                      <p className="font-medium mt-2">{provider.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Politique de rétention</CardTitle>
              <CardDescription>
                Définissez combien de temps conserver les sauvegardes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Durée de rétention (jours)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="number"
                    value={schedule?.retentionDays || 30}
                    onChange={(e) => updateSchedule.mutate({ retentionDays: parseInt(e.target.value) })}
                    className="w-32"
                    min={1}
                    max={365}
                  />
                  <span className="text-sm text-muted-foreground">
                    Les sauvegardes plus anciennes seront automatiquement supprimées
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[7, 14, 30, 90].map(days => (
                  <Card
                    key={days}
                    className={cn(
                      'cursor-pointer transition-colors',
                      schedule?.retentionDays === days && 'border-primary bg-primary/5'
                    )}
                    onClick={() => updateSchedule.mutate({ retentionDays: days })}
                  >
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{days}</p>
                      <p className="text-sm text-muted-foreground">jours</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Les sauvegardes cloud peuvent être conservées plus longtemps selon votre configuration.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cloud Config Dialog */}
      <Dialog open={showCloudDialog} onOpenChange={setShowCloudDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration Cloud</DialogTitle>
            <DialogDescription>
              Configurez la synchronisation vers le cloud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fournisseur</Label>
              <Select
                value={cloudConfig.provider}
                onValueChange={(v) => setCloudConfig({ ...cloudConfig, provider: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s3">Amazon S3</SelectItem>
                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bucket / Container</Label>
              <Input
                value={cloudConfig.bucket}
                onChange={(e) => setCloudConfig({ ...cloudConfig, bucket: e.target.value })}
                placeholder="my-backup-bucket"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Région</Label>
              <Input
                value={cloudConfig.region}
                onChange={(e) => setCloudConfig({ ...cloudConfig, region: e.target.value })}
                placeholder="eu-west-1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Access Key</Label>
              <Input
                value={cloudConfig.accessKey}
                onChange={(e) => setCloudConfig({ ...cloudConfig, accessKey: e.target.value })}
                placeholder="AKIA..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Secret Key</Label>
              <Input
                type="password"
                value={cloudConfig.secretKey}
                onChange={(e) => setCloudConfig({ ...cloudConfig, secretKey: e.target.value })}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloudDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCloud}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
