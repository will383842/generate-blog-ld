/**
 * Query History Component
 * File 287 - Table of research queries with expand, replay, and export
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Trash2,
  Download,
  ExternalLink,
  Database,
  Loader2,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useSearch, useDeleteQuery } from '@/hooks/useResearch';
import {
  ResearchQuery,
  ResearchResult,
  formatCost,
} from '@/types/research';
import { cn } from '@/lib/utils';

interface QueryHistoryProps {
  queries: ResearchQuery[];
  isLoading?: boolean;
  onExport?: (queries: ResearchQuery[]) => void;
  compact?: boolean;
}

export function QueryHistory({
  queries,
  isLoading = false,
  onExport,
  compact = false,
}: QueryHistoryProps) {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // API hooks
  const search = useSearch();
  const deleteQuery = useDeleteQuery();

  // Toggle row expansion
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Replay query
  const handleReplay = (query: ResearchQuery) => {
    search.mutate({
      query: query.query,
      sources: query.sources_used,
      use_cache: false,
    });
  };

  // Copy query
  const handleCopy = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  // Get status color
  const getStatusColor = (status: ResearchQuery['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cached': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune requête dans l'historique</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {queries.map(query => (
          <div
            key={query.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{query.query}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{query.results_count} résultats</span>
                <span>•</span>
                <span>{query.duration_ms}ms</span>
                <span>•</span>
                <span>{new Date(query.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {query.is_from_cache && (
                <Badge variant="secondary" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  Cache
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReplay(query)}
                disabled={search.isPending}
              >
                <RefreshCw className={cn('h-4 w-4', search.isPending && 'animate-spin')} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Historique des requêtes
        </CardTitle>
        {onExport && (
          <Button variant="outline" size="sm" onClick={() => onExport(queries)}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Requête</TableHead>
              <TableHead>Résultats</TableHead>
              <TableHead>Temps</TableHead>
              <TableHead>Coût</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map(query => (
              <React.Fragment key={query.id}>
                <TableRow className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(query.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedRows.has(query.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell
                    className="font-medium max-w-xs truncate"
                    onClick={() => toggleExpand(query.id)}
                  >
                    {query.query}
                  </TableCell>
                  <TableCell>{query.results_count}</TableCell>
                  <TableCell>{query.duration_ms}ms</TableCell>
                  <TableCell>{formatCost(query.cost)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn('w-2 h-2 rounded-full', getStatusColor(query.status))}
                      />
                      {query.is_from_cache && (
                        <Badge variant="secondary" className="text-xs">
                          Cache
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(query.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReplay(query)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Relancer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(query.query)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteQuery.mutate(query.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Expanded Results */}
                {expandedRows.has(query.id) && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-muted/50 p-0">
                      <div className="p-4">
                        <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Sources: {query.sources_used.join(', ')}</span>
                          <span>•</span>
                          <span>Tokens: {query.tokens_used}</span>
                        </div>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {query.results.map((result, idx) => (
                              <ResultCard key={result.id || idx} result={result} />
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Result card sub-component
function ResultCard({ result }: { result: ResearchResult }) {
  return (
    <div className="p-3 rounded-lg border bg-background">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:underline text-primary"
            >
              {result.title}
            </a>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {result.snippet}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {result.source}
            </Badge>
            <span className="text-xs text-muted-foreground">{result.domain}</span>
            {result.published_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(result.published_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {result.key_facts && result.key_facts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.key_facts.slice(0, 3).map((fact, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {fact}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium">{result.relevance_score}%</div>
          <div className="text-xs text-muted-foreground">pertinence</div>
        </div>
      </div>
    </div>
  );
}

export default QueryHistory;
