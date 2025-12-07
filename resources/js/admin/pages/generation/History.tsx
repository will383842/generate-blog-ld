/**
 * History Page
 * Complete job history with filters and export
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Terminal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QueueFilters } from '@/components/generation/QueueFilters';
import { HistoryTable } from '@/components/generation/HistoryTable';
import { useQueue, useRetryJob } from '@/hooks/useQueue';
import type { GenerationJobFilters, GenerationJob } from '@/types/generation';

export function HistoryPage() {
  const [filters, setFilters] = useState<GenerationJobFilters>({
    status: ['completed', 'failed', 'cancelled'],
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [logsModal, setLogsModal] = useState<GenerationJob | null>(null);

  const { data: historyData, isLoading, refetch } = useQueue({
    ...filters,
    sortBy: sortBy as 'createdAt' | 'status' | 'type',
    sortOrder,
    perPage: 50,
  });
  const retryJob = useRetryJob();

  const jobs = historyData?.data || [];

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ['ID', 'Type', 'Plateforme', 'Pays', 'Langue', 'Status', 'Coût', 'Durée', 'Date'];
    const rows = jobs.map((job) => [
      job.id,
      job.type,
      job.platformId,
      job.countryId,
      job.languageId,
      job.status,
      job.cost.toFixed(3),
      job.duration || '',
      format(new Date(job.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generation-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRetry = (id: string) => {
    retryJob.mutate(id);
  };

  const handleView = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (job) setLogsModal(job);
  };

  // Stats
  const stats = useMemo(() => {
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const totalCost = jobs.reduce((sum, j) => sum + j.cost, 0);
    const avgDuration = jobs.filter((j) => j.duration).reduce((sum, j) => sum + (j.duration || 0), 0) / (jobs.filter((j) => j.duration).length || 1);

    return { completed, failed, totalCost, avgDuration };
  }, [jobs]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/generation">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historique</h1>
            <p className="text-muted-foreground">
              {jobs.length} jobs affichés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{jobs.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Réussis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Échoués</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Coût total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <QueueFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      {isLoading ? (
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <HistoryTable
          jobs={jobs}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onView={handleView}
          onRetry={handleRetry}
          onExport={handleExport}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

      {/* Logs Modal */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                <h3 className="font-semibold">Logs - {logsModal.id.slice(0, 8)}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogsModal(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <p>[{format(new Date(logsModal.createdAt), 'HH:mm:ss')}] Job started</p>
                <p>[{format(new Date(logsModal.createdAt), 'HH:mm:ss')}] Platform: {logsModal.platformId}</p>
                <p>[{format(new Date(logsModal.createdAt), 'HH:mm:ss')}] Country: {logsModal.countryId}</p>
                <p>[{format(new Date(logsModal.createdAt), 'HH:mm:ss')}] Language: {logsModal.languageId}</p>
                <p>[{format(new Date(logsModal.createdAt), 'HH:mm:ss')}] Type: {logsModal.type}</p>
                {logsModal.startedAt && (
                  <p>[{format(new Date(logsModal.startedAt), 'HH:mm:ss')}] Processing started</p>
                )}
                {logsModal.currentStep && (
                  <p className="text-yellow-400">[...] {logsModal.currentStep}</p>
                )}
                {logsModal.error && (
                  <p className="text-red-400">[ERROR] {logsModal.error}</p>
                )}
                {logsModal.completedAt && (
                  <p className="text-green-400">
                    [{format(new Date(logsModal.completedAt), 'HH:mm:ss')}] Job completed
                  </p>
                )}
                {logsModal.wordCount && (
                  <p>[INFO] Word count: {logsModal.wordCount}</p>
                )}
                {logsModal.tokensUsed && (
                  <p>[INFO] Tokens used: {logsModal.tokensUsed}</p>
                )}
                <p>[INFO] Cost: ${logsModal.cost.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              {logsModal.status === 'failed' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRetry(logsModal.id);
                    setLogsModal(null);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Relancer
                </Button>
              )}
              <Button onClick={() => setLogsModal(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
