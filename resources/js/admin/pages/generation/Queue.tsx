/**
 * Queue Page
 * Real-time queue management
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pause,
  Play,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Bell,
  BellOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { QueueStats } from '@/components/generation/QueueStats';
import { QueueFilters } from '@/components/generation/QueueFilters';
import { JobCard } from '@/components/generation/JobCard';
import {
  useQueue,
  useQueueConfig,
  useCancelJob,
  useRetryJob,
  usePriorityJob,
  usePauseQueue,
  useResumeQueue,
  useClearCompleted,
  useBulkCancelJobs,
} from '@/hooks/useQueue';
import type { GenerationJobFilters } from '@/types/generation';

export function QueuePage() {
  const [filters, setFilters] = useState<GenerationJobFilters>({});
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(true);

  const { data: queueData, isLoading } = useQueue(filters);
  const { data: configData } = useQueueConfig();
  const cancelJob = useCancelJob();
  const retryJob = useRetryJob();
  const priorityJob = usePriorityJob();
  const pauseQueue = usePauseQueue();
  const resumeQueue = useResumeQueue();
  const clearCompleted = useClearCompleted();
  const bulkCancel = useBulkCancelJobs();

  const jobs = queueData?.data || [];
  const isPaused = configData?.data?.isPaused || false;

  // Notifications for completed/failed jobs
  useEffect(() => {
    if (!notifications) return;
    // Notifications could be implemented here; noop to avoid unused vars
  }, [notifications]);

  const handleBulkCancel = async () => {
    if (selectedJobs.length === 0) return;
    if (!confirm(`Annuler ${selectedJobs.length} jobs ?`)) return;
    
    await bulkCancel.mutateAsync(selectedJobs);
    setSelectedJobs([]);
  };

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
            <h1 className="text-2xl font-bold">Queue de génération</h1>
            <p className="text-muted-foreground">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} dans la queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setNotifications(!notifications)}
          >
            {notifications ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </Button>

          {/* Pause/Resume */}
          {isPaused ? (
            <Button onClick={() => resumeQueue.mutate()}>
              <Play className="w-4 h-4 mr-2" />
              Reprendre
            </Button>
          ) : (
            <Button variant="outline" onClick={() => pauseQueue.mutate()}>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {/* Clear completed */}
          <Button
            variant="outline"
            onClick={() => clearCompleted.mutate()}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Vider terminés
          </Button>
        </div>
      </div>

      {/* Paused banner */}
      {isPaused && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pause className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Queue en pause</p>
                <p className="text-sm text-yellow-700">
                  Les jobs ne sont pas traités actuellement
                </p>
              </div>
            </div>
            <Button onClick={() => resumeQueue.mutate()}>
              <Play className="w-4 h-4 mr-2" />
              Reprendre
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <QueueStats />

      {/* Filters */}
      <QueueFilters filters={filters} onChange={setFilters} />

      {/* Bulk actions */}
      {selectedJobs.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm">
            {selectedJobs.length} sélectionné{selectedJobs.length > 1 ? 's' : ''}
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkCancel}>
            Annuler
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedJobs([])}>
            Désélectionner
          </Button>
        </div>
      )}

      {/* Jobs list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucun job dans la queue</p>
            <Button className="mt-4" asChild>
              <Link to="/generation/wizard">Lancer une génération</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                'relative',
                selectedJobs.includes(job.id) && 'ring-2 ring-primary rounded-lg'
              )}
            >
              {/* Selection checkbox */}
              <input
                type="checkbox"
                checked={selectedJobs.includes(job.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedJobs([...selectedJobs, job.id]);
                  } else {
                    setSelectedJobs(selectedJobs.filter((id) => id !== job.id));
                  }
                }}
                className="absolute top-4 left-4 z-10"
              />
              
              <JobCard
                job={job}
                onCancel={(id) => cancelJob.mutate(id)}
                onRetry={(id) => retryJob.mutate(id)}
                onPriority={(id, priority) =>
                  priorityJob.mutate({ jobId: id, priority })
                }
                className="pl-10"
              />
            </div>
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Actualisation automatique toutes les 3 secondes
      </div>
    </div>
  );
}

export default QueuePage;
