import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  MoreVertical,
  FileText,
  File,
  Archive,
  Table,
  Settings,
  History,
  AlertTriangle,
  ExternalLink,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useExportQueue,
  useExportStats,
  useCancelExport,
  useRetryExport,
  useDownloadExport,
  useDeleteExport,
} from '@/hooks/useExport';
import { ExportRequest, ExportFormat, ExportStatus, ExportQueueItem } from '@/types/media';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  word: <File className="h-4 w-4 text-blue-500" />,
  html: <FileText className="h-4 w-4 text-orange-500" />,
  zip: <Archive className="h-4 w-4 text-yellow-600" />,
  csv: <Table className="h-4 w-4 text-green-500" />,
  json: <FileText className="h-4 w-4 text-purple-500" />,
  xlsx: <Table className="h-4 w-4 text-green-600" />,
};

const STATUS_CONFIG: Record<
  ExportStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: 'En attente',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-700',
  },
  processing: {
    label: 'En cours',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Terminé',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-700',
  },
  failed: {
    label: 'Échoué',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-700',
  },
  cancelled: {
    label: 'Annulé',
    icon: <X className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-700',
  },
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function ExportIndexPage() {
  const { t } = useTranslation(['media', 'common']);
  const navigate = useNavigate();

  // State
  const [cancelDialog, setCancelDialog] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);

  // Queries
  const { data: queue = [], isLoading: queueLoading, refetch } = useExportQueue();
  const { data: stats } = useExportStats();

  // Mutations
  const cancelMutation = useCancelExport();
  const retryMutation = useRetryExport();
  const downloadMutation = useDownloadExport();
  const deleteMutation = useDeleteExport();

  // Group queue items
  const groupedQueue = useMemo(() => {
    const processing = queue.filter(
      (e) => e.status === 'pending' || e.status === 'processing'
    );
    const completed = queue.filter((e) => e.status === 'completed');
    const failed = queue.filter((e) => e.status === 'failed' || e.status === 'cancelled');

    return { processing, completed, failed };
  }, [queue]);

  // Handle cancel
  const handleCancel = async (id: number) => {
    await cancelMutation.mutateAsync(id);
    setCancelDialog(null);
  };

  // Handle retry
  const handleRetry = async (id: number) => {
    await retryMutation.mutateAsync(id);
  };

  // Handle download
  const handleDownload = async (id: number) => {
    await downloadMutation.mutateAsync(id);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    setDeleteDialog(null);
  };

  // Render export item
  const renderExportItem = (item: ExportQueueItem) => {
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <Card key={item.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Format Icon */}
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {FORMAT_ICONS[item.format]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{item.entityTitle}</span>
                <Badge variant="outline" className="text-xs">
                  {item.entityType}
                </Badge>
                <Badge className={cn('text-xs', statusConfig.color)}>
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </Badge>
              </div>

              {/* Progress (for processing) */}
              {item.status === 'processing' && (
                <div className="mt-2 space-y-1">
                  <Progress value={item.progress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.progress}%</span>
                    {item.estimatedTime && (
                      <span>~{Math.ceil(item.estimatedTime / 60)} min restantes</span>
                    )}
                  </div>
                </div>
              )}

              {/* Completed info */}
              {item.status === 'completed' && item.fileSize && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{formatFileSize(item.fileSize)}</span>
                  {item.completedAt && (
                    <span>
                      Terminé{' '}
                      {formatDistanceToNow(new Date(item.completedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  )}
                </div>
              )}

              {/* Error message */}
              {item.status === 'failed' && item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}

              {/* Queue position */}
              {item.status === 'pending' && item.position && (
                <p className="text-xs text-muted-foreground mt-1">
                  Position dans la file: {item.position}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {item.status === 'completed' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(item.id)}
                      disabled={downloadMutation.isPending}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common:download')}</TooltipContent>
                </Tooltip>
              )}

              {item.status === 'failed' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRetry(item.id)}
                      disabled={retryMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common:retry')}</TooltipContent>
                </Tooltip>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {item.status === 'completed' && (
                    <>
                      <DropdownMenuItem onClick={() => handleDownload(item.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('common:download')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {(item.status === 'pending' || item.status === 'processing') && (
                    <DropdownMenuItem onClick={() => setCancelDialog(item.id)}>
                      <X className="h-4 w-4 mr-2" />
                      {t('common:cancel')}
                    </DropdownMenuItem>
                  )}

                  {item.status === 'failed' && (
                    <DropdownMenuItem onClick={() => handleRetry(item.id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('common:retry')}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setDeleteDialog(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common:delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title={t('media:export.pages.queue.title')}
        description={t('media:export.pages.queue.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/export/config')}>
              <Settings className="h-4 w-4 mr-2" />
              {t('media:export.config')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/export/history')}>
              <History className="h-4 w-4 mr-2" />
              {t('media:export.history')}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processing || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échoués</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {queueLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12">
            <Download className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t('media:export.noExports')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('media:export.noExportsDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Processing */}
            {groupedQueue.processing.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  En cours ({groupedQueue.processing.length})
                </h3>
                {groupedQueue.processing.map(renderExportItem)}
              </div>
            )}

            {/* Completed */}
            {groupedQueue.completed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Prêts au téléchargement ({groupedQueue.completed.length})
                </h3>
                {groupedQueue.completed.map(renderExportItem)}
              </div>
            )}

            {/* Failed */}
            {groupedQueue.failed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Échoués ({groupedQueue.failed.length})
                </h3>
                {groupedQueue.failed.map(renderExportItem)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialog !== null} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('media:export.dialogs.cancel.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('media:export.dialogs.cancel.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelDialog && handleCancel(cancelDialog)}
            >
              {cancelMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common:confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('media:export.dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('media:export.dialogs.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
