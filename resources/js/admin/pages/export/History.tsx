import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Download,
  Trash2,
  RefreshCw,
  Search,
  X,
  Calendar,
  Filter,
  FileText,
  File,
  Archive,
  Table,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import { Label } from '@/components/ui/Label';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useExportHistory,
  useDownloadExport,
  useRetryExport,
  useDeleteExport,
  useBulkDeleteExports,
  ExportHistoryFilters,
} from '@/hooks/useExport';
import { ExportRequest, ExportFormat, ExportStatus, ExportEntityType } from '@/types/media';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  word: <File className="h-4 w-4 text-blue-500" />,
  html: <FileText className="h-4 w-4 text-orange-500" />,
  zip: <Archive className="h-4 w-4 text-yellow-600" />,
  csv: <Table className="h-4 w-4 text-green-500" />,
  json: <FileText className="h-4 w-4 text-purple-500" />,
  xlsx: <Table className="h-4 w-4 text-green-600" />,
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'PDF',
  word: 'Word',
  html: 'HTML',
  zip: 'ZIP',
  csv: 'CSV',
  json: 'JSON',
  xlsx: 'Excel',
};

const STATUS_CONFIG: Record<
  ExportStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: 'En attente',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-700',
  },
  processing: {
    label: 'En cours',
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Terminé',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-700',
  },
  failed: {
    label: 'Échoué',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-700',
  },
  cancelled: {
    label: 'Annulé',
    icon: <X className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-700',
  },
};

const ENTITY_TYPE_LABELS: Record<ExportEntityType, string> = {
  article: 'Article',
  landing: 'Landing Page',
  press_release: 'Communiqué',
  dossier: 'Dossier',
  media: 'Média',
  report: 'Rapport',
};

const DATE_PRESETS = [
  { label: '7 derniers jours', days: 7 },
  { label: '30 derniers jours', days: 30 },
  { label: 'Ce mois', value: 'this_month' },
  { label: 'Mois dernier', value: 'last_month' },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function ExportHistoryPage() {
  const { t } = useTranslation(['media', 'common']);
  const navigate = useNavigate();

  // State
  const [filters, setFilters] = useState<ExportHistoryFilters>({
    page: 1,
    perPage: 20,
    sortBy: 'requested_at',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<number | null>(null);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Query
  const { data, isLoading, refetch } = useExportHistory(filters);
  const exports = data?.data || [];
  const meta = data?.meta;

  // Mutations
  const downloadMutation = useDownloadExport();
  const retryMutation = useRetryExport();
  const deleteMutation = useDeleteExport();
  const bulkDeleteMutation = useBulkDeleteExports();

  // Update filter
  const updateFilter = useCallback((key: keyof ExportHistoryFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: key === 'page' ? value : 1,
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      perPage: 20,
      sortBy: 'requested_at',
      sortOrder: 'desc',
    });
    setSearch('');
    setDateRange({});
  }, []);

  // Apply date preset
  const applyDatePreset = useCallback((preset: typeof DATE_PRESETS[0]) => {
    if (preset.days) {
      const from = subDays(new Date(), preset.days);
      const to = new Date();
      setDateRange({ from, to });
      setFilters((prev) => ({
        ...prev,
        dateFrom: format(from, 'yyyy-MM-dd'),
        dateTo: format(to, 'yyyy-MM-dd'),
        page: 1,
      }));
    } else if (preset.value === 'this_month') {
      const from = startOfMonth(new Date());
      const to = endOfMonth(new Date());
      setDateRange({ from, to });
      setFilters((prev) => ({
        ...prev,
        dateFrom: format(from, 'yyyy-MM-dd'),
        dateTo: format(to, 'yyyy-MM-dd'),
        page: 1,
      }));
    } else if (preset.value === 'last_month') {
      const lastMonth = subDays(startOfMonth(new Date()), 1);
      const from = startOfMonth(lastMonth);
      const to = endOfMonth(lastMonth);
      setDateRange({ from, to });
      setFilters((prev) => ({
        ...prev,
        dateFrom: format(from, 'yyyy-MM-dd'),
        dateTo: format(to, 'yyyy-MM-dd'),
        page: 1,
      }));
    }
  }, []);

  // Selection
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === exports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(exports.map((e) => e.id)));
    }
  }, [exports, selectedIds.size]);

  // Actions
  const handleDownload = useCallback(async (id: number) => {
    await downloadMutation.mutateAsync(id);
  }, [downloadMutation]);

  const handleRetry = useCallback(async (id: number) => {
    await retryMutation.mutateAsync(id);
  }, [retryMutation]);

  const handleDelete = useCallback(async (id: number) => {
    await deleteMutation.mutateAsync(id);
    setDeleteDialog(null);
  }, [deleteMutation]);

  const handleBulkDelete = useCallback(async () => {
    await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkDeleteDialog(false);
  }, [bulkDeleteMutation, selectedIds]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.format) count++;
    if (filters.entityType) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title={t('media:export.pages.history.title')}
        description={t('media:export.pages.history.description')}
        backLink="/admin/export"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
            )}
          </div>
        }
      />

      {/* Filters Toolbar */}
      <div className="px-6 py-4 border-b space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => updateFilter('status', v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Format Filter */}
          <Select
            value={filters.format || 'all'}
            onValueChange={(v) => updateFilter('format', v)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les formats</SelectItem>
              {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                  </>
                ) : (
                  'Période'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-2 border-b">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => applyDatePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <CalendarComponent
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  setDateRange(range || {});
                  if (range?.from && range?.to) {
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: format(range.from!, 'yyyy-MM-dd'),
                      dateTo: format(range.to!, 'yyyy-MM-dd'),
                      page: 1,
                    }));
                  }
                }}
                locale={fr}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setDateRange({});
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: undefined,
                        dateTo: undefined,
                        page: 1,
                      }));
                    }}
                  >
                    Effacer
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Advanced Filters */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtres avancés</SheetTitle>
                <SheetDescription>
                  Affinez la recherche dans l'historique
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div>
                  <Label>Type de contenu</Label>
                  <Select
                    value={filters.entityType || 'all'}
                    onValueChange={(v) => updateFilter('entityType', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Trier par</Label>
                  <Select
                    value={`${filters.sortBy}:${filters.sortOrder}`}
                    onValueChange={(v) => {
                      const [sortBy, sortOrder] = v.split(':');
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: sortBy as 'requested_at' | 'file_size',
                        sortOrder: sortOrder as 'asc' | 'desc',
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requested_at:desc">Date (récent)</SelectItem>
                      <SelectItem value="requested_at:asc">Date (ancien)</SelectItem>
                      <SelectItem value="file_size:desc">Taille (décroissant)</SelectItem>
                      <SelectItem value="file_size:asc">Taille (croissant)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Effacer tout
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Appliquer
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.status && (
              <Badge variant="secondary">
                Statut: {STATUS_CONFIG[filters.status].label}
                <button
                  type="button"
                  onClick={() => updateFilter('status', undefined)}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.format && (
              <Badge variant="secondary">
                Format: {FORMAT_LABELS[filters.format]}
                <button
                  type="button"
                  onClick={() => updateFilter('format', undefined)}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.entityType && (
              <Badge variant="secondary">
                Type: {ENTITY_TYPE_LABELS[filters.entityType]}
                <button
                  type="button"
                  onClick={() => updateFilter('entityType', undefined)}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary">
                Période: {filters.dateFrom} - {filters.dateTo}
                <button
                  type="button"
                  onClick={() => {
                    setDateRange({});
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: undefined,
                      dateTo: undefined,
                    }));
                  }}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Effacer tout
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t('media:export.noHistory')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header Row */}
            <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
              <Checkbox
                checked={exports.length > 0 && selectedIds.size === exports.length}
                onCheckedChange={selectAll}
              />
              <div className="w-10"></div>
              <div className="flex-1">Contenu</div>
              <div className="w-24 text-center">Format</div>
              <div className="w-24 text-center">Statut</div>
              <div className="w-24 text-right">Taille</div>
              <div className="w-32">Date</div>
              <div className="w-20"></div>
            </div>

            {/* Rows */}
            {exports.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status];

              return (
                <Card
                  key={item.id}
                  className={cn(selectedIds.has(item.id) && 'border-primary')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                      />

                      {/* Format Icon */}
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {FORMAT_ICONS[item.format]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {item.entityTitle}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {ENTITY_TYPE_LABELS[item.entityType]}
                          </Badge>
                        </div>
                        {item.error && (
                          <p className="text-xs text-red-500 mt-1 truncate">
                            {item.error}
                          </p>
                        )}
                      </div>

                      {/* Format */}
                      <div className="w-24 text-center">
                        <Badge variant="secondary">
                          {FORMAT_LABELS[item.format]}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="w-24 text-center">
                        <Badge className={cn('text-xs', statusConfig.color)}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </div>

                      {/* Size */}
                      <div className="w-24 text-right text-sm text-muted-foreground">
                        {item.fileSize ? formatFileSize(item.fileSize) : '-'}
                      </div>

                      {/* Date */}
                      <div className="w-32 text-sm text-muted-foreground">
                        {format(new Date(item.requestedAt), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                      </div>

                      {/* Actions */}
                      <div className="w-20 flex items-center justify-end gap-1">
                        {item.status === 'completed' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownload(item.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Télécharger</TooltipContent>
                          </Tooltip>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.status === 'completed' && (
                              <>
                                <DropdownMenuItem onClick={() => handleDownload(item.id)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {item.status === 'failed' && (
                              <DropdownMenuItem onClick={() => handleRetry(item.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Réessayer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              {meta.total} exports au total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('page', meta.currentPage - 1)}
                disabled={meta.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {meta.currentPage} / {meta.lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('page', meta.currentPage + 1)}
                disabled={meta.currentPage === meta.lastPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'export</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'export sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedIds.size} exports</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les exports sélectionnés seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
