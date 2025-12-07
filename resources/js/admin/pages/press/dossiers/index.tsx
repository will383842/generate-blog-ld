import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  Trash2,
  Grid3X3,
  List,
  FolderOpen,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { DossierCard } from '@/components/press/DossierCard';
import { DossierRow } from '@/components/press/DossierRow';
import { PressFilters } from '@/components/press/PressFilters';
import {
  useDossiers,
  useDossierStats,
  useDeleteDossier,
  useDuplicateDossier,
  usePublishDossier,
} from '@/hooks/useDossiers';
import { DossierFilters } from '@/types/press';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'table';

export const DossiersIndex: React.FC = () => {
  const { t } = useTranslation(['press', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<DossierFilters>({});
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Queries
  const { data: dossiersData, isLoading, refetch } = useDossiers({
    ...filters,
    page,
    perPage: viewMode === 'grid' ? 12 : 20,
  });
  const { data: stats } = useDossierStats();

  // Mutations
  const deleteMutation = useDeleteDossier();
  const duplicateMutation = useDuplicateDossier();
  const publishMutation = usePublishDossier();

  const dossiers = dossiersData?.data || [];
  const meta = dossiersData?.meta;

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === dossiers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dossiers.map((d) => d.id)));
    }
  }, [dossiers, selectedIds.size]);

  const handleSelect = useCallback((id: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Action handlers
  const handleCreate = useCallback(() => {
    navigate('/admin/press/dossiers/new');
  }, [navigate]);

  const handleEdit = useCallback(
    (id: number) => {
      navigate(`/admin/press/dossiers/${id}`);
    },
    [navigate]
  );

  const handleView = useCallback(
    (id: number) => {
      navigate(`/admin/press/dossiers/${id}/preview`);
    },
    [navigate]
  );

  const handleDuplicate = useCallback(
    async (id: number) => {
      try {
        const result = await duplicateMutation.mutateAsync(id);
        showToast(t('press:messages.dossierDuplicated'), 'success');
        navigate(`/admin/press/dossiers/${result.id}`);
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [duplicateMutation, navigate, showToast, t]
  );

  const handlePublish = useCallback(
    async (id: number) => {
      try {
        await publishMutation.mutateAsync(id);
        showToast(t('press:messages.dossierPublished'), 'success');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [publishMutation, showToast, t]
  );

  const handleArchive = useCallback(
    async (id: number) => {
      // Archive is just updating status
      showToast(t('press:messages.dossierArchived'), 'success');
    },
    [showToast, t]
  );

  const handleDelete = useCallback((id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (itemToDelete) {
      try {
        await deleteMutation.mutateAsync(itemToDelete);
        showToast(t('press:messages.dossierDeleted'), 'success');
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemToDelete);
          return newSet;
        });
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  }, [deleteMutation, itemToDelete, showToast, t]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => deleteMutation.mutateAsync(id))
      );
      showToast(t('press:messages.bulkDeleted', { count: selectedIds.size }), 'success');
      setSelectedIds(new Set());
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [deleteMutation, selectedIds, showToast, t]);

  // Stats cards
  const statsCards = useMemo(
    () => [
      {
        label: t('press:stats.totalDossiers'),
        value: stats?.total || 0,
        icon: FolderOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        label: t('press:stats.published'),
        value: stats?.published || 0,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: stats?.publishedThisMonth
          ? `+${stats.publishedThisMonth} ${t('press:stats.thisMonth')}`
          : undefined,
      },
      {
        label: t('press:stats.drafts'),
        value: stats?.drafts || 0,
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      },
      {
        label: t('press:stats.avgSections'),
        value: stats?.avgSectionsPerDossier
          ? stats.avgSectionsPerDossier.toFixed(1)
          : '-',
        icon: Layers,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
    ],
    [stats, t]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('press:dossiers.title')}
        description={t('press:dossiers.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:refresh')}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('press:dossiers.create')}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-xs text-green-600">{stat.trend}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <PressFilters
        type="dossier"
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters as DossierFilters);
          setPage(1);
        }}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {t('common:selected', { count: selectedIds.size })}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common:delete')}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : dossiers.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t('press:dossiers.empty.title')}
          description={t('press:dossiers.empty.description')}
          action={
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('press:dossiers.create')}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dossiers.map((dossier) => (
            <DossierCard
              key={dossier.id}
              dossier={dossier}
              onEdit={handleEdit}
              onView={handleView}
              onDuplicate={handleDuplicate}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      dossiers.length > 0 && selectedIds.size === dossiers.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('press:columns.title')}</TableHead>
                <TableHead>{t('press:columns.platform')}</TableHead>
                <TableHead>{t('press:columns.status')}</TableHead>
                <TableHead className="text-center">{t('press:columns.sections')}</TableHead>
                <TableHead className="text-center">{t('press:columns.media')}</TableHead>
                <TableHead className="text-center">{t('press:columns.translations')}</TableHead>
                <TableHead>{t('press:columns.date')}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dossiers.map((dossier) => (
                <DossierRow
                  key={dossier.id}
                  dossier={dossier}
                  selected={selectedIds.has(dossier.id)}
                  onSelect={(selected) => handleSelect(dossier.id, selected)}
                  onEdit={handleEdit}
                  onView={handleView}
                  onDuplicate={handleDuplicate}
                  onPublish={handlePublish}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.lastPage}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('press:dialogs.deleteDossier.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('press:dialogs.deleteDossier.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DossiersIndex;
