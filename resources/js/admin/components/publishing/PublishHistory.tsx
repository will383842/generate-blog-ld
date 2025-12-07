/**
 * Publish History Component
 * File 381 - Publication history table with filters
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Download,
  RefreshCw,
  Eye,
  ExternalLink,
  Search,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  usePublishHistory,
  useRetryPublish,
  usePlatforms,
} from '@/hooks/usePublishing';
import {
  PublishQueue,
  PublishQueueFilters,
  PublishStatus,
  PUBLISH_STATUS_CONFIG,
} from '@/types/publishing';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PublishHistoryProps {
  onViewLogs?: (queueId: number) => void;
}

export function PublishHistory({ onViewLogs }: PublishHistoryProps) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<PublishQueueFilters>({ per_page: 20 });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data: historyData, isLoading, refetch } = usePublishHistory(filters);
  const { data: platforms } = usePlatforms();
  const retryPublish = useRetryPublish();

  // Toggle row expansion
  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Export CSV
  const handleExport = () => {
    if (!historyData?.data) return;
    const csv = [
      'id,content_id,platform,status,published_at,duration',
      ...historyData.data.map(item =>
        `${item.id},${item.contentId},"${item.platform?.name || ''}",${item.status},${item.publishedAt || ''},${item.response ? 'success' : 'failed'}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publish-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Render status badge
  const renderStatusBadge = (status: PublishStatus) => {
    const config = PUBLISH_STATUS_CONFIG[status];
    return (
      <Badge
        variant="outline"
        className={cn(
          status === 'published' && 'bg-green-100 text-green-800 border-green-200',
          status === 'failed' && 'bg-red-100 text-red-800 border-red-200',
          status === 'cancelled' && 'bg-gray-100 text-gray-800 border-gray-200'
        )}
      >
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{historyData?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">
              {historyData?.data?.filter(i => i.status === 'published').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Réussis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">
              {historyData?.data?.filter(i => i.status === 'failed').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Échoués</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-gray-600">
              {historyData?.data?.filter(i => i.status === 'cancelled').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Annulés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
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
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
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
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-[150px]"
            />
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-[150px]"
            />
            <div className="flex-1" />
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Contenu</TableHead>
              <TableHead>Plateforme</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publié le</TableHead>
              <TableHead>URL externe</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyData?.data && historyData.data.length > 0 ? (
              historyData.data.map(item => (
                <React.Fragment key={item.id}>
                  <TableRow className={cn(item.status === 'failed' && 'bg-red-50')}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRow(item.id)}
                      >
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {item.content?.title || `Contenu #${item.contentId}`}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.platform?.name}</Badge>
                    </TableCell>
                    <TableCell>{renderStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.publishedAt ? (
                        <div>
                          <p className="text-sm">
                            {format(new Date(item.publishedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Voir
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryPublish.mutate({ id: item.id })}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewLogs?.(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded Response */}
                  {expandedRows.has(item.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50">
                        <div className="p-4">
                          <p className="text-sm font-medium mb-2">Réponse API</p>
                          <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-[200px]">
                            {item.response
                              ? JSON.stringify(item.response, null, 2)
                              : item.error || 'Aucune donnée'
                            }
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun historique</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {historyData && historyData.total > historyData.per_page && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {historyData.total} élément{historyData.total > 1 ? 's' : ''}
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
              disabled={(filters.page || 1) >= Math.ceil(historyData.total / historyData.per_page)}
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

export default PublishHistory;
