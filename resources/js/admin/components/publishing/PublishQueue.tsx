/**
 * Publish Queue Component
 * File 380 - Manual publication queue table
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Search,
  Loader2,
  Send,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
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
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  usePublishQueue,
  useCancelPublish,
  useRetryPublish,
  usePlatforms,
} from '@/hooks/usePublishing';
import {
  PublishQueue as PublishQueueType,
  PublishQueueFilters,
  PublishStatus,
  PUBLISH_STATUS_CONFIG,
  PLATFORM_TYPE_CONFIG,
} from '@/types/publishing';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PublishQueueProps {
  onViewLogs?: (queueId: number) => void;
  compact?: boolean;
}

export function PublishQueue({ onViewLogs, compact = false }: PublishQueueProps) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<PublishQueueFilters>({ per_page: 20 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: queueData, isLoading, refetch, isFetching } = usePublishQueue(filters);
  const { data: platforms } = usePlatforms();
  const cancelPublish = useCancelPublish();
  const retryPublish = useRetryPublish();

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

  // Bulk cancel
  const handleBulkCancel = async () => {
    for (const id of selectedIds) {
      await cancelPublish.mutateAsync(id);
    }
    setSelectedIds(new Set());
  };

  // Render status badge
  const renderStatusBadge = (status: PublishStatus) => {
    const config = PUBLISH_STATUS_CONFIG[status];
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1',
          status === 'published' && 'bg-green-100 text-green-800 border-green-200',
          status === 'publishing' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
          status === 'failed' && 'bg-red-100 text-red-800 border-red-200',
          status === 'scheduled' && 'bg-blue-100 text-blue-800 border-blue-200',
          status === 'cancelled' && 'bg-gray-100 text-gray-800 border-gray-200',
          status === 'pending' && 'bg-slate-100 text-slate-800 border-slate-200'
        )}
      >
        {status === 'publishing' && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === 'published' && <CheckCircle className="h-3 w-3" />}
        {status === 'failed' && <XCircle className="h-3 w-3" />}
        {status === 'scheduled' && <Clock className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  // Render row
  const renderRow = (item: PublishQueueType) => (
    <TableRow key={item.id} className={cn(item.status === 'failed' && 'bg-red-50')}>
      {!compact && (
        <TableCell>
          <Checkbox
            checked={selectedIds.has(item.id)}
            onCheckedChange={() => toggleSelection(item.id)}
          />
        </TableCell>
      )}
      <TableCell>
        <div>
          <Link
            to={`/articles/${item.contentId}`}
            className="font-medium hover:underline"
          >
            {item.content?.title || `Contenu #${item.contentId}`}
          </Link>
          <p className="text-xs text-muted-foreground">#{item.contentId}</p>
        </div>
      </TableCell>
      <TableCell>
        {item.platform && (
          <Badge variant="outline" className="gap-1">
            <span>{PLATFORM_TYPE_CONFIG[item.platform.type as keyof typeof PLATFORM_TYPE_CONFIG]?.icon}</span>
            {item.platform.name}
          </Badge>
        )}
      </TableCell>
      <TableCell>{renderStatusBadge(item.status)}</TableCell>
      <TableCell>
        {item.scheduledAt ? (
          <div>
            <p className="text-sm">
              {format(new Date(item.scheduledAt), 'dd/MM HH:mm', { locale: fr })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.scheduledAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {!compact && (
        <TableCell>
          <span className={cn(item.retries >= item.maxRetries && 'text-red-600')}>
            {item.retries}/{item.maxRetries}
          </span>
        </TableCell>
      )}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(item.status === 'pending' || item.status === 'scheduled') && (
              <DropdownMenuItem onClick={() => cancelPublish.mutate(item.id)}>
                <XCircle className="h-4 w-4 mr-2" />
                Annuler
              </DropdownMenuItem>
            )}
            {item.status === 'failed' && (
              <DropdownMenuItem onClick={() => retryPublish.mutate({ id: item.id })}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onViewLogs?.(item.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les logs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {!compact && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.status as string || 'all'}
                onValueChange={(v) => setFilters({
                  ...filters,
                  status: v === 'all' ? undefined : v as PublishStatus,
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
                value={String(filters.platformId || 'all')}
                onValueChange={(v) => setFilters({
                  ...filters,
                  platformId: v === 'all' ? undefined : parseInt(v),
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Plateforme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {platforms?.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {!compact && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedIds.size} élément{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkCancel}>
            <XCircle className="h-4 w-4 mr-2" />
            Annuler la sélection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {!compact && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={queueData?.data && selectedIds.size === queueData.data.length && queueData.data.length > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
              )}
              <TableHead>Contenu</TableHead>
              <TableHead>Plateforme</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Planifié</TableHead>
              {!compact && <TableHead>Tentatives</TableHead>}
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queueData?.data && queueData.data.length > 0 ? (
              queueData.data.map(renderRow)
            ) : (
              <TableRow>
                <TableCell colSpan={compact ? 5 : 7} className="text-center py-8">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Queue vide</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!compact && queueData && queueData.total > queueData.per_page && (
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
    </div>
  );
}

export default PublishQueue;
