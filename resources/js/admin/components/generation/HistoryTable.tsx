/**
 * History Table
 * Table for job history with expand and actions
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Download,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { CONTENT_TYPES, PLATFORMS } from '@/utils/constants';
import type { GenerationJob, QueueStatus } from '@/types/generation';

export interface HistoryTableProps {
  jobs: GenerationJob[];
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onView?: (id: string) => void;
  onRetry?: (id: string) => void;
  onExport?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}

const STATUS_COLORS: Record<QueueStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function HistoryTable({
  jobs,
  selectedIds = [],
  onSelect,
  onView,
  onRetry,
  onExport,
  sortBy,
  sortOrder,
  onSort,
  className,
}: HistoryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const toggleSelect = (id: string) => {
    if (!onSelect) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onSelect(next);
  };

  const toggleSelectAll = () => {
    if (!onSelect) return;
    if (selectedIds.length === jobs.length) {
      onSelect([]);
    } else {
      onSelect(jobs.map((j) => j.id));
    }
  };

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSort?.(column)}
      className="flex items-center gap-1 hover:text-primary"
    >
      {children}
      {sortBy === column && (
        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedIds.forEach((id) => onRetry?.(id));
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Relancer
              </Button>
            </>
          )}
        </div>
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" />
            Exporter CSV
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelect && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.length === jobs.length && jobs.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-10" />
              <TableHead>
                <SortHeader column="id">ID</SortHeader>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plateforme</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Langue</TableHead>
              <TableHead>
                <SortHeader column="status">Status</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader column="cost">Coût</SortHeader>
              </TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>
                <SortHeader column="createdAt">Date</SortHeader>
              </TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const isExpanded = expandedIds.has(job.id);
              const contentType = CONTENT_TYPES.find((t) => t.id === job.type);
              const platform = PLATFORMS.find((p) => p.id === job.platformId);

              return (
                <>
                  <TableRow key={job.id} className={cn(isExpanded && 'bg-gray-50')}>
                    {onSelect && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(job.id)}
                          onCheckedChange={() => toggleSelect(job.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <button onClick={() => toggleExpand(job.id)}>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {contentType && (
                          <contentType.icon
                            className="w-4 h-4"
                            style={{ color: contentType.color }}
                          />
                        )}
                        <span>{contentType?.name || job.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{ borderColor: platform?.color, color: platform?.color }}
                      >
                        {platform?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.countryId}</TableCell>
                    <TableCell>{job.languageId.toUpperCase()}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[job.status]}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${job.cost.toFixed(3)}</TableCell>
                    <TableCell>
                      {job.duration ? `${job.duration}s` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(job.createdAt), 'dd/MM HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onView(job.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status === 'failed' && onRetry && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onRetry(job.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={12} className="bg-gray-50 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Article link */}
                          {job.articleId && (
                            <div>
                              <p className="text-xs text-muted-foreground">Article</p>
                              <a
                                href={job.articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {job.articleTitle || job.articleId}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {/* Word count */}
                          {job.wordCount && (
                            <div>
                              <p className="text-xs text-muted-foreground">Mots</p>
                              <p className="text-sm font-medium">{job.wordCount}</p>
                            </div>
                          )}

                          {/* Tokens */}
                          {job.tokensUsed && (
                            <div>
                              <p className="text-xs text-muted-foreground">Tokens</p>
                              <p className="text-sm font-medium">{job.tokensUsed}</p>
                            </div>
                          )}

                          {/* Retries */}
                          <div>
                            <p className="text-xs text-muted-foreground">Tentatives</p>
                            <p className="text-sm font-medium">
                              {job.retryCount} / {job.maxRetries}
                            </p>
                          </div>
                        </div>

                        {/* Error */}
                        {job.error && (
                          <div className="mt-4 p-3 bg-red-50 rounded-lg">
                            <p className="text-xs font-medium text-red-800 mb-1">Erreur</p>
                            <p className="text-sm text-red-700">{job.error}</p>
                            {job.errorCode && (
                              <p className="text-xs text-red-500 mt-1">Code: {job.errorCode}</p>
                            )}
                          </div>
                        )}

                        {/* Logs button */}
                        <Button variant="outline" size="sm" className="mt-4">
                          <Terminal className="w-4 h-4 mr-2" />
                          Voir les logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun job dans l'historique
        </div>
      )}
    </div>
  );
}

export default HistoryTable;
