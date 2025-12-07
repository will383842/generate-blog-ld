/**
 * Publishing Logs Page
 * File 394 - Detailed request/response logs
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Loader2,
  Code,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  usePublishQueue,
  usePublishLogs,
  usePlatforms,
} from '@/hooks/usePublishing';
import { PublishQueueFilters, PublishStatus, PublishLog, HttpMethod } from '@/types/publishing';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function LogsPage() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<PublishQueueFilters>({ per_page: 50 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { data: queueData, isLoading, refetch, isFetching } = usePublishQueue(filters);
  const { data: platforms } = usePlatforms();
  const { data: logsData } = usePublishLogs(selectedQueueId || 0);

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

  // Get method badge color
  const getMethodColor = (method: HttpMethod) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'PATCH': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status code badge
  const getStatusBadge = (statusCode: number | null) => {
    if (!statusCode) return <Badge variant="outline" className="bg-gray-100">N/A</Badge>;
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">{statusCode}</Badge>;
    }
    if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{statusCode}</Badge>;
    }
    if (statusCode >= 500) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">{statusCode}</Badge>;
    }
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  // Export logs
  const handleExport = () => {
    if (!logsData) return;
    const json = JSON.stringify(logsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publishing-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ per_page: 50 });
    setSearchQuery('');
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
            <FileText className="h-6 w-6" />
            Logs de publication
          </h1>
          <p className="text-muted-foreground">
            Logs détaillés des requêtes API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!logsData?.length}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les logs..."
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
                <SelectItem value="published">Succès</SelectItem>
                <SelectItem value="failed">Échecs</SelectItem>
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
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Plus
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres avancés</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Date de début</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={resetFilters} className="flex-1">
                      Réinitialiser
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1">
                      Appliquer
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Contenu</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueData?.data && queueData.data.length > 0 ? (
                queueData.data.map(item => (
                  <React.Fragment key={item.id}>
                    <TableRow
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        item.status === 'failed' && 'bg-red-50'
                      )}
                      onClick={() => {
                        toggleRow(item.id);
                        setSelectedQueueId(item.id);
                      }}
                    >
                      <TableCell>
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {item.content?.title || `#${item.contentId}`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.platform?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.status === 'published' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Succès
                          </Badge>
                        ) : item.status === 'failed' ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 gap-1">
                            <XCircle className="h-3 w-3" />
                            Échec
                          </Badge>
                        ) : (
                          <Badge variant="outline">{item.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {item.retries} tentative{item.retries > 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {format(new Date(item.updatedAt), 'dd/MM HH:mm:ss', { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded Details */}
                    {expandedRows.has(item.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <Tabs defaultValue="request">
                              <TabsList>
                                <TabsTrigger value="request">Requête</TabsTrigger>
                                <TabsTrigger value="response">Réponse</TabsTrigger>
                                {item.error && <TabsTrigger value="error">Erreur</TabsTrigger>}
                              </TabsList>
                              <TabsContent value="request" className="mt-4">
                                {item.payload ? (
                                  <ScrollArea className="h-[300px]">
                                    <pre className="text-xs bg-white p-4 rounded-lg border overflow-auto">
                                      {JSON.stringify(item.payload, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                ) : (
                                  <p className="text-muted-foreground">Aucune donnée de requête</p>
                                )}
                              </TabsContent>
                              <TabsContent value="response" className="mt-4">
                                {item.response ? (
                                  <ScrollArea className="h-[300px]">
                                    <pre className="text-xs bg-white p-4 rounded-lg border overflow-auto">
                                      {JSON.stringify(item.response, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                ) : (
                                  <p className="text-muted-foreground">Aucune donnée de réponse</p>
                                )}
                              </TabsContent>
                              {item.error && (
                                <TabsContent value="error" className="mt-4">
                                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-red-800">Erreur</p>
                                        <pre className="text-sm text-red-700 mt-2 whitespace-pre-wrap">
                                          {item.error}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              )}
                            </Tabs>
                            {/* External URL */}
                            {item.externalUrl && (
                              <div className="mt-4 flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">URL externe :</span>
                                <a
                                  href={item.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {item.externalUrl}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
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
                    <p className="text-muted-foreground">Aucun log trouvé</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {queueData && queueData.total > queueData.per_page && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {queueData.total} entrée{queueData.total > 1 ? 's' : ''}
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
            <span className="text-sm">
              Page {filters.page || 1} / {Math.ceil(queueData.total / queueData.per_page)}
            </span>
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
