/**
 * Worker Status Component
 * File 352 - Queue workers monitoring
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  RefreshCw,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  useQueueWorkers,
  useRestartWorker,
  useStopWorker,
  QueueWorker,
} from '@/hooks/useSystem';
import { cn } from '@/lib/utils';

export function WorkerStatus() {
  const { t } = useTranslation();
  const { data: workers, isLoading, refetch } = useQueueWorkers();
  const restartWorker = useRestartWorker();
  const stopWorker = useStopWorker();

  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<QueueWorker | null>(null);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      running: { variant: 'default', label: 'En cours' },
      stopped: { variant: 'secondary', label: 'Arrêté' },
      failed: { variant: 'destructive', label: 'Échoué' },
    };
    const c = config[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // Handle restart
  const handleRestart = async (workerId: string) => {
    await restartWorker.mutateAsync(workerId);
  };

  // Handle stop
  const handleStop = async (workerId: string) => {
    await stopWorker.mutateAsync(workerId);
  };

  // View logs
  const viewLogs = (worker: QueueWorker) => {
    setSelectedWorker(worker);
    setShowLogsDialog(true);
  };

  // Calculate totals
  const totals = workers?.reduce((acc, w) => ({
    pending: acc.pending + w.jobsPending,
    processing: acc.processing + w.jobsProcessing,
    failed: acc.failed + w.jobsFailed,
    completed: acc.completed + w.jobsCompleted,
  }), { pending: 0, processing: 0, failed: 0, completed: 0 }) || { pending: 0, processing: 0, failed: 0, completed: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Workers & Queues
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-600">{totals.pending}</p>
            <p className="text-xs text-blue-700">En attente</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-50">
            <p className="text-2xl font-bold text-yellow-600">{totals.processing}</p>
            <p className="text-xs text-yellow-700">En cours</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50">
            <p className="text-2xl font-bold text-green-600">{totals.completed}</p>
            <p className="text-xs text-green-700">Terminés</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50">
            <p className="text-2xl font-bold text-red-600">{totals.failed}</p>
            <p className="text-xs text-red-700">Échoués</p>
          </div>
        </div>

        {/* Workers Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">En attente</TableHead>
                <TableHead className="text-right">En cours</TableHead>
                <TableHead className="text-right">Échoués</TableHead>
                <TableHead className="text-right">Uptime</TableHead>
                <TableHead className="text-right">Mémoire</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers?.map(worker => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(worker.status)}
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-xs text-muted-foreground">{worker.queue}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(worker.status)}</TableCell>
                  <TableCell className="text-right">
                    {worker.jobsPending > 0 ? (
                      <Badge variant="secondary">{worker.jobsPending}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {worker.jobsProcessing > 0 ? (
                      <Badge className="bg-yellow-100 text-yellow-800">{worker.jobsProcessing}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {worker.jobsFailed > 0 ? (
                      <Badge variant="destructive">{worker.jobsFailed}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatUptime(worker.uptime)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatBytes(worker.memory)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {worker.status === 'running' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStop(worker.id)}
                          disabled={stopWorker.isPending}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestart(worker.id)}
                          disabled={restartWorker.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestart(worker.id)}
                        disabled={restartWorker.isPending}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewLogs(worker)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!workers || workers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun worker</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Logs - {selectedWorker?.name}</DialogTitle>
            <DialogDescription>
              Derniers logs du worker
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <pre className="p-4 bg-muted rounded-lg text-xs font-mono">
{`[2024-01-15 10:30:45] Processing job #12345
[2024-01-15 10:30:46] Job #12345 completed successfully
[2024-01-15 10:30:47] Processing job #12346
[2024-01-15 10:30:48] Job #12346 completed successfully
[2024-01-15 10:30:50] Processing job #12347
[2024-01-15 10:30:51] Job #12347 failed: Connection timeout
[2024-01-15 10:30:52] Retrying job #12347 (attempt 2/3)
[2024-01-15 10:30:54] Job #12347 completed successfully
[2024-01-15 10:30:55] Worker idle, waiting for jobs...`}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default WorkerStatus;
