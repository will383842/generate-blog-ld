/**
 * Backup Manager Component
 * File 354 - Backup creation, restore, and scheduling
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  Clock,
  Cloud,
  HardDrive,
  FileText,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  useBackups,
  useBackupSchedule,
  useCreateBackup,
  useRestoreBackup,
  useDownloadBackup,
  useDeleteBackup,
  useUpdateBackupSchedule,
  Backup,
  BackupSchedule,
} from '@/hooks/useSystem';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function BackupManager() {
  const { t } = useTranslation();

  const { data: backups, isLoading } = useBackups();
  const { data: schedule } = useBackupSchedule();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const downloadBackup = useDownloadBackup();
  const deleteBackup = useDeleteBackup();
  const updateSchedule = useUpdateBackupSchedule();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupType, setBackupType] = useState<'full' | 'database' | 'files'>('full');

  const [scheduleForm, setScheduleForm] = useState<Partial<BackupSchedule>>({
    enabled: schedule?.enabled || false,
    frequency: schedule?.frequency || 'daily',
    time: schedule?.time || '02:00',
    retentionDays: schedule?.retentionDays || 30,
    cloudSync: schedule?.cloudSync || false,
  });

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      completed: { variant: 'default', label: 'Terminé' },
      in_progress: { variant: 'secondary', label: 'En cours' },
      failed: { variant: 'destructive', label: 'Échoué' },
      scheduled: { variant: 'outline', label: 'Planifié' },
    };
    const c = config[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full: 'Complète',
      database: 'Base de données',
      files: 'Fichiers',
      incremental: 'Incrémentale',
    };
    return labels[type] || type;
  };

  // Handle create
  const handleCreate = async () => {
    await createBackup.mutateAsync(backupType);
    setShowCreateDialog(false);
  };

  // Handle restore
  const handleRestore = async () => {
    if (!selectedBackup) return;
    await restoreBackup.mutateAsync(selectedBackup.id);
    setShowRestoreDialog(false);
    setSelectedBackup(null);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedBackup) return;
    await deleteBackup.mutateAsync(selectedBackup.id);
    setShowDeleteDialog(false);
    setSelectedBackup(null);
  };

  // Handle schedule update
  const handleScheduleUpdate = async () => {
    await updateSchedule.mutateAsync(scheduleForm);
    setShowScheduleDialog(false);
  };

  // Open restore dialog
  const openRestoreDialog = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Sauvegardes</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les sauvegardes de votre système
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Planification
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle sauvegarde
          </Button>
        </div>
      </div>

      {/* Schedule Info */}
      {schedule && (
        <Card className={schedule.enabled ? 'border-green-200 bg-green-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  schedule.enabled ? 'bg-green-100' : 'bg-gray-100'
                )}>
                  <Clock className={cn(
                    'h-5 w-5',
                    schedule.enabled ? 'text-green-600' : 'text-gray-500'
                  )} />
                </div>
                <div>
                  <p className="font-medium">
                    Sauvegarde automatique {schedule.enabled ? 'activée' : 'désactivée'}
                  </p>
                  {schedule.enabled && (
                    <p className="text-sm text-muted-foreground">
                      {schedule.frequency === 'daily' && `Tous les jours à ${schedule.time}`}
                      {schedule.frequency === 'weekly' && `Chaque semaine à ${schedule.time}`}
                      {schedule.frequency === 'monthly' && `Chaque mois à ${schedule.time}`}
                      {' • '}Rétention: {schedule.retentionDays} jours
                    </p>
                  )}
                </div>
              </div>
              {schedule.cloudSync && (
                <Badge variant="outline" className="gap-1">
                  <Cloud className="h-3 w-3" />
                  Cloud sync
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backups Table */}
      <Card>
        <CardContent className="pt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cloud</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups?.map(backup => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(backup.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(backup.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(backup.type)}</Badge>
                    </TableCell>
                    <TableCell>{formatBytes(backup.size)}</TableCell>
                    <TableCell>
                      {backup.duration ? formatDuration(backup.duration) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        {getStatusBadge(backup.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {backup.cloudSynced ? (
                        <Badge variant="secondary" className="gap-1">
                          <Cloud className="h-3 w-3" />
                          {backup.cloudProvider}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <HardDrive className="h-3 w-3" />
                          Local
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">•••</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => downloadBackup.mutate(backup.id)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openRestoreDialog(backup)}
                            disabled={backup.status !== 'completed'}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(backup)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {(!backups || backups.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune sauvegarde</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle sauvegarde</DialogTitle>
            <DialogDescription>
              Créez une sauvegarde de votre système
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de sauvegarde</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'full', label: 'Complète', icon: Database, desc: 'DB + Fichiers' },
                  { value: 'database', label: 'Base de données', icon: FileText, desc: 'DB uniquement' },
                  { value: 'files', label: 'Fichiers', icon: HardDrive, desc: 'Fichiers uniquement' },
                ].map(option => (
                  <div
                    key={option.value}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-colors',
                      backupType === option.value && 'border-primary bg-primary/5'
                    )}
                    onClick={() => setBackupType(option.value as 'full' | 'database' | 'files')}
                  >
                    <option.icon className="h-6 w-6 mb-2 text-primary" />
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createBackup.isPending}>
              {createBackup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planification des sauvegardes</DialogTitle>
            <DialogDescription>
              Configurez les sauvegardes automatiques
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activer la planification</Label>
                <p className="text-sm text-muted-foreground">
                  Sauvegardes automatiques
                </p>
              </div>
              <Switch
                checked={scheduleForm.enabled}
                onCheckedChange={(enabled) => setScheduleForm({ ...scheduleForm, enabled })}
              />
            </div>

            {scheduleForm.enabled && (
              <>
                <div>
                  <Label>Fréquence</Label>
                  <Select
                    value={scheduleForm.frequency}
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, frequency: v as 'daily' | 'weekly' | 'monthly' })}
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

                <div>
                  <Label>Heure d'exécution</Label>
                  <Input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Rétention (jours)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={scheduleForm.retentionDays}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, retentionDays: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Synchronisation cloud</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer vers S3/GCS
                    </p>
                  </div>
                  <Switch
                    checked={scheduleForm.cloudSync}
                    onCheckedChange={(cloudSync) => setScheduleForm({ ...scheduleForm, cloudSync })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleScheduleUpdate} disabled={updateSchedule.isPending}>
              {updateSchedule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer cette sauvegarde ?</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                La sauvegarde du{' '}
                <strong>
                  {selectedBackup && format(new Date(selectedBackup.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </strong>{' '}
                sera restaurée.
              </p>
              <p className="text-yellow-600">
                ⚠️ Cette action remplacera les données actuelles. Une sauvegarde de l'état actuel sera créée automatiquement.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {restoreBackup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette sauvegarde ?</AlertDialogTitle>
            <AlertDialogDescription>
              La sauvegarde du{' '}
              <strong>
                {selectedBackup && format(new Date(selectedBackup.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </strong>{' '}
              sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteBackup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BackupManager;
