import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { usePublicationQueue, PublicationQueueItem } from '@/hooks/usePublicationQueue';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  ArrowUp,
  Calendar,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
  scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-4 w-4" /> },
  publishing: { label: 'Publication...', color: 'bg-purple-100 text-purple-800', icon: <Send className="h-4 w-4 animate-pulse" /> },
  published: { label: 'Publié', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800', icon: <Pause className="h-4 w-4" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: 'Haute', color: 'bg-red-500' },
  default: { label: 'Normale', color: 'bg-gray-400' },
  low: { label: 'Basse', color: 'bg-blue-400' },
};

export default function PublicationQueue() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const {
    items,
    meta,
    stats,
    isLoading,
    isLoadingStats,
    publishNow,
    cancel,
    retry,
    prioritize,
    isPublishing,
    isCancelling,
    isRetrying,
    refetch,
  } = usePublicationQueue({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    per_page: 20,
  });

  const handlePublishNow = async (id: number) => {
    try {
      await publishNow(id);
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancel(id);
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await retry(id);
    } catch (error) {
      console.error('Erreur relance:', error);
    }
  };

  const handlePrioritize = async (id: number, priority: 'low' | 'default' | 'high') => {
    try {
      await prioritize({ id, priority });
    } catch (error) {
      console.error('Erreur priorité:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6" />
            Queue de publication
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les publications planifiées et en cours
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(stats.by_status).map(([status, count]) => {
            if (status === 'total') return null;
            const config = STATUS_CONFIG[status];
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{config?.label || status}</span>
                    {config?.icon}
                  </div>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Files d'attente</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucune publication dans la queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: PublicationQueueItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-4">
                    {/* Priorité */}
                    <div className={`w-1 h-12 rounded-full ${PRIORITY_CONFIG[item.priority]?.color || 'bg-gray-400'}`} />

                    {/* Info article */}
                    <div>
                      <p className="font-medium">{item.article?.title || `Article #${item.article_id}`}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.platform?.name || 'Plateforme inconnue'}</span>
                        {item.scheduled_at && (
                          <>
                            <span>"</span>
                            <span>{new Date(item.scheduled_at).toLocaleString('fr-FR')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Badge statut */}
                    <Badge className={STATUS_CONFIG[item.status]?.color || ''}>
                      <span className="flex items-center gap-1">
                        {STATUS_CONFIG[item.status]?.icon}
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </span>
                    </Badge>

                    {/* Erreur */}
                    {item.error_message && (
                      <span title={item.error_message} className="text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    )}

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {['pending', 'scheduled'].includes(item.status) && (
                          <>
                            <DropdownMenuItem onClick={() => handlePublishNow(item.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Publier maintenant
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancel(item.id)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrioritize(item.id, 'high')}>
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Priorité haute
                            </DropdownMenuItem>
                          </>
                        )}
                        {item.status === 'failed' && (
                          <DropdownMenuItem onClick={() => handleRetry(item.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Relancer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination info */}
          {meta && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-muted-foreground">
              <span>
                {meta.total} élément{meta.total > 1 ? 's' : ''} au total
              </span>
              <span>
                Page {meta.current_page} / {meta.last_page}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prochaines publications */}
      {stats?.upcoming && stats.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prochaines publications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.upcoming.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">{item.article?.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.scheduled_at && new Date(item.scheduled_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
