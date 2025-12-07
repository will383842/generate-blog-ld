/**
 * Indexing Queue Component
 * File 320 - Display and manage the indexing queue
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Check,
  X,
  Loader2,
  RotateCw,
  ExternalLink,
  Copy,
  MoreHorizontal,
  Eye,
  Globe,
  Zap,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  IndexingQueueItem,
  IndexingQueueFilters,
  INDEXING_STATUS_LABELS,
  GOOGLE_STATUS_LABELS,
  IndexingStatusType,
  GoogleIndexingStatus,
} from '@/types/seo';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface IndexingQueueProps {
  data?: {
    data: IndexingQueueItem[];
    total: number;
    page: number;
    per_page: number;
  };
  filters: IndexingQueueFilters;
  onFilterChange: (filters: IndexingQueueFilters) => void;
  onRetry: (id: number) => void;
  onCancel: (id: number) => void;
  onSubmitSelected: (ids: number[]) => void;
  isLoading?: boolean;
}

export function IndexingQueue({
  data,
  filters,
  onFilterChange,
  onRetry,
  onCancel,
  onSubmitSelected,
  isLoading,
}: IndexingQueueProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.size === data?.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data?.data.map(item => item.id)));
    }
  };

  // Copy URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  // Get status icon
  const getStatusIcon = (status: 'pending' | 'submitted' | 'indexed' | 'accepted' | 'failed' | 'not_found') => {
    switch (status) {
      case 'indexed':
      case 'accepted':
      case 'submitted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'not_found':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Get global status badge
  const getStatusBadge = (status: IndexingStatusType) => {
    const config = INDEXING_STATUS_LABELS[status];
    return (
      <Badge
        variant="outline"
        className={cn(
          config.color === 'green' && 'border-green-500 text-green-600 bg-green-50',
          config.color === 'yellow' && 'border-yellow-500 text-yellow-600 bg-yellow-50',
          config.color === 'blue' && 'border-blue-500 text-blue-600 bg-blue-50',
          config.color === 'red' && 'border-red-500 text-red-600 bg-red-50',
          config.color === 'gray' && 'border-gray-500 text-gray-600 bg-gray-50'
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
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => onFilterChange({ ...filters, status: v === 'all' ? undefined : v as IndexingStatusType })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les status</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.google_status || 'all'}
              onValueChange={(v) => onFilterChange({ ...filters, google_status: v === 'all' ? undefined : v as GoogleIndexingStatus })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Google Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous Google</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="submitted">Soumis</SelectItem>
                <SelectItem value="indexed">Indexé</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} sélectionné(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSubmitSelected(Array.from(selectedIds))}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === data?.data.length && data.data.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Globe className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>Google</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Zap className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>IndexNow</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-center">Bing</TableHead>
                  <TableHead className="text-center">Tentatives</TableHead>
                  <TableHead>Dernière tentative</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[200px]">
                          {item.articleTitle}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1 rounded truncate max-w-[200px]">
                          {item.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyUrl(item.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {getStatusIcon(item.googleStatus)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {GOOGLE_STATUS_LABELS[item.googleStatus]?.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {getStatusIcon(item.indexnowStatus)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.indexnowStatus === 'accepted' ? 'Accepté' :
                             item.indexnowStatus === 'submitted' ? 'Soumis' :
                             item.indexnowStatus === 'failed' ? 'Échoué' : 'En attente'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {getStatusIcon(item.bingStatus)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.bingStatus === 'indexed' ? 'Indexé' :
                             item.bingStatus === 'submitted' ? 'Soumis' :
                             item.bingStatus === 'failed' ? 'Échoué' : 'En attente'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'font-medium',
                        item.attempts >= item.maxAttempts && 'text-red-600'
                      )}>
                        {item.attempts}/{item.maxAttempts}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.lastAttemptAt ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.lastAttemptAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRetry(item.id)}>
                            <RotateCw className="h-4 w-4 mr-2" />
                            Réessayer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/admin/articles/${item.articleId}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir l'article
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyUrl(item.url)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copier l'URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onCancel(item.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Annuler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun élément dans la file d'attente</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > data.per_page && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} sur {Math.ceil(data.total / data.per_page)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => onFilterChange({ ...filters, page: (filters.page || 1) - 1 })}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= Math.ceil(data.total / data.per_page)}
              onClick={() => onFilterChange({ ...filters, page: (filters.page || 1) + 1 })}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndexingQueue;
