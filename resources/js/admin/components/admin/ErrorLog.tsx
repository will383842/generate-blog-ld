/**
 * Error Log Component
 * File 353 - System error log display
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
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
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  useErrors,
  useAcknowledgeError,
  useAcknowledgeAllErrors,
  ErrorLogFilters,
} from '@/hooks/useSystem';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ErrorLogProps {
  limit?: number;
  showFilters?: boolean;
}

export function ErrorLog({ limit = 50, showFilters = true }: ErrorLogProps) {
  useTranslation();

  const [filters, setFilters] = useState<ErrorLogFilters>({ per_page: limit });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const { data, isLoading } = useErrors(filters);
  const acknowledgeError = useAcknowledgeError();
  const acknowledgeAllErrors = useAcknowledgeAllErrors();

  // Toggle expanded
  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Toggle selected
  const toggleSelected = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedItems.size === data?.data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data?.data.map(e => e.id)));
    }
  };

  // Bulk acknowledge
  const handleBulkAcknowledge = async () => {
    await acknowledgeAllErrors.mutateAsync(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const config: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      error: 'bg-red-50 text-red-700 border-red-100',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return config[severity] || 'bg-gray-100 text-gray-800';
  };

  // Export errors
  const handleExport = () => {
    const csv = [
      'id,severity,source,message,count,first_occurrence,last_occurrence,acknowledged',
      ...(data?.data?.map(e =>
        `${e.id},${e.severity},"${e.source}","${e.message.replace(/"/g, '""')}",${e.count},${e.firstOccurrence},${e.lastOccurrence},${e.acknowledged}`
      ) || []),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'errors.csv';
    a.click();
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
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Sévérité</Label>
                  <Select
                    value={filters.severity || 'all'}
                    onValueChange={(v) => setFilters({
                      ...filters,
                      severity: v === 'all' ? undefined : v,
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="error">Erreur</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Source</Label>
                  <Input
                    value={filters.source || ''}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    placeholder="Filtrer..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date de début</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date de fin</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedItems.size} erreur{selectedItems.size > 1 ? 's' : ''} sélectionnée{selectedItems.size > 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            onClick={handleBulkAcknowledge}
            disabled={acknowledgeAllErrors.isPending}
          >
            {acknowledgeAllErrors.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Acquitter la sélection
          </Button>
        </div>
      )}

      {/* Error List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Journal des erreurs
              {data?.total && (
                <Badge variant="secondary">{data.total}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center gap-3 p-2 border-b">
                <Checkbox
                  checked={selectedItems.size === data?.data.length && data.data.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-xs text-muted-foreground">Sélectionner tout</span>
              </div>

              {data?.data.map(error => (
                <div
                  key={error.id}
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    error.severity === 'critical' && 'border-red-300 bg-red-50/50',
                    error.severity === 'error' && 'border-red-200',
                    error.severity === 'warning' && 'border-yellow-200',
                    error.acknowledged && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3 p-3">
                    <Checkbox
                      checked={selectedItems.has(error.id)}
                      onCheckedChange={() => toggleSelected(error.id)}
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(error.severity)}
                          <Badge className={getSeverityBadge(error.severity)}>
                            {error.severity}
                          </Badge>
                          <Badge variant="outline">{error.source}</Badge>
                          {error.count > 1 && (
                            <Badge variant="secondary">×{error.count}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!error.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeError.mutate(error.id)}
                              disabled={acknowledgeError.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm mt-2">{error.message}</p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Premier: {formatDistanceToNow(new Date(error.firstOccurrence), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                        <span>
                          Dernier: {formatDistanceToNow(new Date(error.lastOccurrence), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>

                      {error.stackTrace && (
                        <Collapsible
                          open={expandedItems.has(error.id)}
                          onOpenChange={() => toggleExpanded(error.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs">
                              {expandedItems.has(error.id) ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Masquer le stack trace
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Voir le stack trace
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                              {error.stackTrace}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!data?.data || data.data.length === 0) && (
                <div className="text-center py-12">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune erreur</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {data && data.total > data.per_page && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {data.total} erreurs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= Math.ceil(data.total / data.per_page)}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorLog;
