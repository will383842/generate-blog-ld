/**
 * Webhook Logs Component
 * File 383 - Webhook execution logs table
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  useWebhookLogs,
  useRetryWebhookLog,
} from '@/hooks/useWebhooks';
import { WebhookLogFilters, WebhookEvent, WEBHOOK_EVENTS } from '@/types/publishing';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Get all events flat
const ALL_EVENTS = WEBHOOK_EVENTS.flatMap(g => g.events);

interface WebhookLogsProps {
  webhookId: number;
  maxHeight?: string;
}

export function WebhookLogs({ webhookId, maxHeight = '500px' }: WebhookLogsProps) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<WebhookLogFilters>({ per_page: 20 });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data: logsData, isLoading, refetch } = useWebhookLogs(webhookId, filters);
  const retryLog = useRetryWebhookLog();

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

  // Get event label
  const getEventLabel = (event: WebhookEvent) => {
    return ALL_EVENTS.find(e => e.value === event)?.label || event;
  };

  // Get event badge color
  const getEventColor = (event: WebhookEvent) => {
    if (event.startsWith('article.')) return 'bg-blue-100 text-blue-800';
    if (event.startsWith('publication.')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
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
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={filters.event || 'all'}
          onValueChange={(v) => setFilters({
            ...filters,
            event: v === 'all' ? undefined : v as WebhookEvent,
          })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Événement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les événements</SelectItem>
            {ALL_EVENTS.map(event => (
              <SelectItem key={event.value} value={event.value}>
                {event.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.success === undefined ? 'all' : String(filters.success)}
          onValueChange={(v) => setFilters({
            ...filters,
            success: v === 'all' ? undefined : v === 'true',
          })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="true">Succès</SelectItem>
            <SelectItem value="false">Échecs</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Logs Table */}
      <ScrollArea style={{ height: maxHeight }}>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsData?.data && logsData.data.length > 0 ? (
                logsData.data.map(log => (
                  <React.Fragment key={log.id}>
                    <TableRow className={cn(!log.success && 'bg-red-50')}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(log.id)}
                        >
                          {expandedRows.has(log.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEventColor(log.event)}>
                          {getEventLabel(log.event)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {log.response?.statusCode || 200}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 gap-1">
                            <XCircle className="h-3 w-3" />
                            Échec
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {log.duration}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {format(new Date(log.createdAt), 'dd/MM HH:mm:ss', { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!log.success && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryLog.mutate(log.id)}
                            disabled={retryLog.isPending}
                          >
                            <RefreshCw className={cn(
                              'h-4 w-4',
                              retryLog.isPending && 'animate-spin'
                            )} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {/* Expanded Details */}
                    {expandedRows.has(log.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50">
                          <div className="p-4 space-y-4">
                            {/* Payload */}
                            <div>
                              <p className="text-sm font-medium mb-2">Payload envoyé</p>
                              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-[150px]">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                            {/* Response */}
                            {log.response && (
                              <div>
                                <p className="text-sm font-medium mb-2">
                                  Réponse (Status: {log.response.statusCode})
                                </p>
                                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-[150px]">
                                  {log.response.body || 'Pas de contenu'}
                                </pre>
                              </div>
                            )}
                            {/* Error */}
                            {log.error && (
                              <div>
                                <p className="text-sm font-medium mb-2 text-red-600">Erreur</p>
                                <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto">
                                  {log.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun log</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {/* Pagination */}
      {logsData && logsData.total > logsData.per_page && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {logsData.total} log{logsData.total > 1 ? 's' : ''}
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
              disabled={(filters.page || 1) >= Math.ceil(logsData.total / logsData.per_page)}
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

export default WebhookLogs;
