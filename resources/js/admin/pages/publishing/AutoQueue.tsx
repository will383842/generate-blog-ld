/**
 * Auto Publication Queue Page
 * File 373 - Automatic publication queue management
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Send,
  RefreshCw,
  Download,
  Search,
  Filter,
  ExternalLink,
  Clock,
  XCircle,
  PlayCircle,
  ChevronUp,
  ChevronDown,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { PublicationQueueStats } from '@/components/automation/PublicationQueueStats';
import {
  usePublicationQueue,
  usePublicationQueueStats,
  usePublicationHistory,
  useCancelPublication,
  useRetryPublication,
  usePublishNow,
  useUpdatePriority,
  useBulkCancel,
  useBulkUpdatePriority,
  useBulkPublishNow,
} from '@/hooks/usePublicationQueue';
import {
  PublicationQueueFilters,
  PublicationQueueItem,
  PublicationStatus,
  QueuePriority,
  PUBLICATION_STATUS_CONFIG,
  QUEUE_PRIORITY_CONFIG,
} from '@/types/automation';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AutoQueuePage() {
  const { t } = useTranslation();

  // Filters state
  const [filters, setFilters] = useState<PublicationQueueFilters>({
    per_page: 20,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('queue');

  // Data fetching
  const {
    data: queueData,
    isLoading: queueLoading,
    refetch: refetchQueue,
    isFetching,
  } = usePublicationQueue(filters);

  const { data: stats, isLoading: statsLoading } = usePublicationQueueStats();
  const { data: historyData, isLoading: historyLoading } = usePublicationHistory({
    per_page: 20,
  });

  // Mutations
  const cancelPublication = useCancelPublication();
  const retryPublication = useRetryPublication();
  const publishNow = usePublishNow();
  const updatePriority = useUpdatePriority();
  const bulkCancel = useBulkCancel();
  const bulkUpdatePriority = useBulkUpdatePriority();
  const bulkPublishNow = useBulkPublishNow();

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (queueData?.data && selectedIds.size === queueData.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queueData?.data.map(item => item.id) || []));
    }
  };

  // Export CSV
  const handleExport = () => {
    if (!queueData?.data) return;
    const csv = [
      'id,article_id,platform,priority,status,scheduled_at,attempts',
      ...queueData.data.map(item =>
        `${item.id},${item.articleId},"${item.platform?.name || ''}",${item.priority},${item.status},${item.scheduledAt || ''},${item.attempts}/${item.maxAttempts}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publication-queue-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Bulk actions
  const handleBulkCancel = () => {
    bulkCancel.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  const handleBulkPriority = (priority: QueuePriority) => {
    bulkUpdatePriority.mutate(
      { ids: Array.from(selectedIds), priority },
      { onSuccess: () => setSelectedIds(new Set()) }
    );
  };

  const handleBulkPublish = () => {
    bulkPublishNow.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  // Render status badge
  const renderStatusBadge = (status: PublicationStatus) => {
    const config = PUBLICATION_STATUS_CONFIG[status];
    return (
      <Badge
        variant="outline"
        className={cn(
          status === 'published' && 'bg-green-100 text-green-800 border-green-200',
          status === 'publishing' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
          status === 'failed' && 'bg-red-100 text-red-800 border-red-200',
          status === 'scheduled' && 'bg-blue-100 text-blue-800 border-blue-200',
          status === 'cancelled' && 'bg-gray-100 text-gray-800 border-gray-200',
          status === 'pending' && 'bg-slate-100 text-slate-800 border-slate-200'
        )}
      >
        {status === 'publishing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        {config.label}
      </Badge>
    );
  };

  // Render priority badge
  const renderPriorityBadge = (priority: QueuePriority) => {
    const config = QUEUE_PRIORITY_CONFIG[priority];
    return (
      <Badge
        variant="outline"
        className={cn(
          priority === 'high' && 'bg-red-100 text-red-800 border-red-200',
          priority === 'default' && 'bg-gray-100 text-gray-800 border-gray-200',
          priority === 'low' && 'bg-blue-100 text-blue-800 border-blue-200'
        )}
      >
        {priority === 'high' && <ChevronUp className="h-3 w-3 mr-1" />}
        {priority === 'low' && <ChevronDown className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  // Render table row
  const renderQueueRow = (item: PublicationQueueItem) => (
    <TableRow key={item.id} className={cn(item.status === 'failed' && 'bg-red-50')}>
      <TableCell>
        <Checkbox
          checked={selectedIds.has(item.id)}
          onCheckedChange={() => toggleSelection(item.id)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {item.article?.thumbnail && (
            <Avatar className="h-10 w-10 rounded">
              <AvatarImage src={item.article.thumbnail} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <Link
              to={`/articles/${item.articleId}`}
              className="font-medium hover:underline truncate block max-w-[200px]"
            >
              {item.article?.title || `Article #${item.articleId}`}
            </Link>
            <span className="text-xs text-muted-foreground">#{item.articleId}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {item.platform && (
          <Badge variant="outline" className="gap-1">
            {item.platform.logo && (
              <img src={item.platform.logo} alt={`Logo ${item.platform.name}`} className="h-3 w-3" />
            )}
            {item.platform.name}
          </Badge>
        )}
      </TableCell>
      <TableCell>{renderPriorityBadge(item.priority)}</TableCell>
      <TableCell>{renderStatusBadge(item.status)}</TableCell>
      <TableCell>
        {item.scheduledAt ? (
          <div>
            <p className="text-sm">{format(new Date(item.scheduledAt), 'dd/MM HH:mm', { locale: fr })}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.scheduledAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className={cn(item.attempts >= item.maxAttempts && 'text-red-600')}>
            {item.attempts}/{item.maxAttempts}
          </span>
          {item.attempts > 0 && item.attempts < item.maxAttempts && (
            <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${(item.attempts / item.maxAttempts) * 100}%` }}
              />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(item.status === 'pending' || item.status === 'scheduled') && (
              <DropdownMenuItem onClick={() => cancelPublication.mutate(item.id)}>
                <XCircle className="h-4 w-4 mr-2" />
                Annuler
              </DropdownMenuItem>
            )}
            {item.status === 'failed' && (
              <DropdownMenuItem onClick={() => retryPublication.mutate(item.id)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => publishNow.mutate(item.id)}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Publier maintenant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Clock className="h-4 w-4 mr-2" />
                Priorité
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => updatePriority.mutate({ id: item.id, priority: 'high' })}>
                  <ChevronUp className="h-4 w-4 mr-2 text-red-500" />
                  Haute
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updatePriority.mutate({ id: item.id, priority: 'default' })}>
                  Normale
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updatePriority.mutate({ id: item.id, priority: 'low' })}>
                  <ChevronDown className="h-4 w-4 mr-2 text-blue-500" />
                  Basse
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`/articles/${item.articleId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir l'article
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6" />
            Queue de Publication
          </h1>
          <p className="text-muted-foreground">
            Articles planifiés pour publication automatique
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchQueue()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <PublicationQueueStats
          stats={stats}
          upcomingPublications={queueData?.data?.filter(
            item => item.status === 'scheduled'
          ).slice(0, 5)}
          isLoading={statsLoading}
          onViewAll={() => setActiveTab('queue')}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">
            Queue active
            {queueData?.total ? (
              <Badge variant="secondary" className="ml-2">
                {queueData.total}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un article..."
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.status as string || 'all'}
                  onValueChange={(v) => setFilters({
                    ...filters,
                    status: v === 'all' ? undefined : v as PublicationStatus,
                  })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="scheduled">Planifiés</SelectItem>
                    <SelectItem value="publishing">En cours</SelectItem>
                    <SelectItem value="failed">Échoués</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.priority || 'all'}
                  onValueChange={(v) => setFilters({
                    ...filters,
                    priority: v === 'all' ? undefined : v as QueuePriority,
                  })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="default">Normale</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">
                {selectedIds.size} élément{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkCancel}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Priorité
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkPriority('high')}>
                      Haute
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkPriority('default')}>
                      Normale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkPriority('low')}>
                      Basse
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" onClick={handleBulkPublish}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Publier maintenant
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="pt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={queueData?.data && selectedIds.size === queueData.data.length && queueData.data.length > 0}
                          onCheckedChange={selectAll}
                        />
                      </TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Planifié pour</TableHead>
                      <TableHead>Tentatives</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queueLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : queueData?.data && queueData.data.length > 0 ? (
                      queueData.data.map(renderQueueRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Queue vide</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {queueData && queueData.total > queueData.per_page && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {queueData.total} élément{queueData.total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) >= Math.ceil(queueData.total / queueData.per_page)}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="pt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Publié le</TableHead>
                      <TableHead>Tentatives</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : historyData?.data && historyData.data.length > 0 ? (
                      historyData.data.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Link
                              to={`/articles/${item.articleId}`}
                              className="font-medium hover:underline"
                            >
                              {item.article?.title || `Article #${item.articleId}`}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {item.platform && (
                              <Badge variant="outline">{item.platform.name}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{renderStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.publishedAt
                              ? format(new Date(item.publishedAt), 'dd/MM/yyyy HH:mm', { locale: fr })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{item.attempts}/{item.maxAttempts}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">Aucun historique</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
