/**
 * Webhooks Management Page
 * File 393 - Webhooks list with configuration and logs
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  Play,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
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
import { WebhookConfig } from '@/components/publishing/WebhookConfig';
import { WebhookLogs } from '@/components/publishing/WebhookLogs';
import {
  useWebhooks,
  useDeleteWebhook,
  useToggleWebhook,
  useTestWebhook,
} from '@/hooks/useWebhooks';
import { Webhook as WebhookType, WEBHOOK_EVENTS } from '@/types/publishing';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Get all events flat for display
const ALL_EVENTS = WEBHOOK_EVENTS.flatMap(g => g.events);

export default function WebhooksPage() {
  const { t } = useTranslation();

  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingLogs, setViewingLogs] = useState<WebhookType | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<WebhookType | null>(null);

  const { data: webhooks, isLoading, refetch } = useWebhooks();
  const deleteWebhook = useDeleteWebhook();
  const toggleWebhook = useToggleWebhook();
  const testWebhook = useTestWebhook();

  // Get event labels for display
  const getEventLabels = (events: string[]) => {
    return events.map(e => ALL_EVENTS.find(ae => ae.value === e)?.label || e);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingWebhook) return;
    await deleteWebhook.mutateAsync(deletingWebhook.id);
    setDeletingWebhook(null);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhooks
          </h1>
          <p className="text-muted-foreground">
            {webhooks?.length || 0} webhook{(webhooks?.length || 0) > 1 ? 's' : ''} configuré{(webhooks?.length || 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau webhook
          </Button>
        </div>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Événements</TableHead>
                <TableHead>Taux de succès</TableHead>
                <TableHead>Dernier appel</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks && webhooks.length > 0 ? (
                webhooks.map(webhook => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <p className="font-medium">{webhook.name}</p>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px] block">
                        {webhook.url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {ALL_EVENTS.find(e => e.value === event)?.label || event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          webhook.successRate >= 95 && 'bg-green-500',
                          webhook.successRate >= 80 && webhook.successRate < 95 && 'bg-yellow-500',
                          webhook.successRate < 80 && 'bg-red-500'
                        )} />
                        <span className={cn(
                          webhook.successRate >= 95 && 'text-green-600',
                          webhook.successRate >= 80 && webhook.successRate < 95 && 'text-yellow-600',
                          webhook.successRate < 80 && 'text-red-600'
                        )}>
                          {webhook.successRate.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({webhook.totalCalls} appels)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.lastTriggered ? (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(webhook.lastTriggered), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={webhook.isActive}
                        onCheckedChange={(checked) =>
                          toggleWebhook.mutate({ id: webhook.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => testWebhook.mutate(webhook.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Tester
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setViewingLogs(webhook)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Voir les logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditingWebhook(webhook)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingWebhook(webhook)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Aucun webhook configuré</p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un webhook
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || !!editingWebhook}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingWebhook(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Modifier le webhook' : 'Nouveau webhook'}
            </DialogTitle>
          </DialogHeader>
          <WebhookConfig
            webhook={editingWebhook}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingWebhook(null);
              refetch();
            }}
            onCancel={() => {
              setShowCreateModal(false);
              setEditingWebhook(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Logs Drawer */}
      <Sheet open={!!viewingLogs} onOpenChange={() => setViewingLogs(null)}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              Logs - {viewingLogs?.name}
            </SheetTitle>
          </SheetHeader>
          {viewingLogs && (
            <div className="mt-4">
              <WebhookLogs webhookId={viewingLogs.id} maxHeight="calc(100vh - 150px)" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingWebhook} onOpenChange={() => setDeletingWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce webhook ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le webhook "{deletingWebhook?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteWebhook.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
