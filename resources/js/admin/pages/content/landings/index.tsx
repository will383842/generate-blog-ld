import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  Trash2,
  Grid3X3,
  List,
  Layout,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  Sparkles,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { LandingCard } from '@/components/landings/LandingCard';
import { LandingRow } from '@/components/landings/LandingRow';
import { LandingFilters } from '@/components/landings/LandingFilters';
import {
  useLandings,
  useLandingStats,
  useDeleteLanding,
  useDuplicateLanding,
  usePublishLanding,
  useCreateLanding,
  useLandingTemplates,
} from '@/hooks/useLandings';
import { LandingFilters as LandingFiltersType, CreateLandingInput, Landing } from '@/types/landing';
import { PLATFORMS } from '@/utils/constants';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'table';

export const LandingsIndex: React.FC = () => {
  const { t } = useTranslation(['landing', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<LandingFiltersType>({});
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLanding, setNewLanding] = useState<CreateLandingInput>({
    title: '',
    platform: '',
    type: 'generic',
  });

  // Queries
  const { data: landingsData, isLoading, refetch } = useLandings({
    ...filters,
    page,
    perPage: viewMode === 'grid' ? 12 : 20,
  });
  const { data: stats } = useLandingStats();
  const { data: templates } = useLandingTemplates();

  // Mutations
  const createMutation = useCreateLanding();
  const deleteMutation = useDeleteLanding();
  const duplicateMutation = useDuplicateLanding();
  const publishMutation = usePublishLanding();

  const landings = landingsData?.data || [];
  const meta = landingsData?.meta;

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === landings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(landings.map((l) => l.id)));
    }
  }, [landings, selectedIds.size]);

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
  const handleCreate = useCallback(async () => {
    if (!newLanding.title.trim() || !newLanding.platform) {
      showToast(t('landing:messages.fillRequired'), 'error');
      return;
    }

    try {
      const result = await createMutation.mutateAsync(newLanding);
      setCreateDialogOpen(false);
      setNewLanding({ title: '', platform: '', type: 'generic' });
      navigate(`/admin/content/landings/${result.id}`);
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [createMutation, navigate, newLanding, showToast, t]);

  const handleEdit = useCallback(
    (id: number) => {
      navigate(`/admin/content/landings/${id}`);
    },
    [navigate]
  );

  const handleView = useCallback(
    (id: number) => {
      navigate(`/admin/content/landings/${id}/preview`);
    },
    [navigate]
  );

  const handleDuplicate = useCallback(
    async (id: number) => {
      try {
        const result = await duplicateMutation.mutateAsync(id);
        showToast(t('landing:messages.duplicated'), 'success');
        navigate(`/admin/content/landings/${result.id}`);
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
        showToast(t('landing:messages.published'), 'success');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [publishMutation, showToast, t]
  );

  const handleArchive = useCallback(
    async (id: number) => {
      // Implement archive logic
      showToast(t('landing:messages.archived'), 'success');
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
        showToast(t('landing:messages.deleted'), 'success');
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
      await Promise.all(Array.from(selectedIds).map((id) => deleteMutation.mutateAsync(id)));
      showToast(t('landing:messages.bulkDeleted', { count: selectedIds.size }), 'success');
      setSelectedIds(new Set());
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [deleteMutation, selectedIds, showToast, t]);

  // Stats cards
  const statsCards = useMemo(
    () => [
      {
        label: t('landing:stats.total'),
        value: stats?.total || 0,
        icon: Layout,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        label: t('landing:stats.published'),
        value: stats?.published || 0,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: stats?.publishedThisMonth
          ? `+${stats.publishedThisMonth} ${t('landing:stats.thisMonth')}`
          : undefined,
      },
      {
        label: t('landing:stats.drafts'),
        value: stats?.drafts || 0,
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      },
      {
        label: t('landing:stats.totalViews'),
        value: stats?.totalViews?.toLocaleString() || '0',
        icon: Eye,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
    ],
    [stats, t]
  );

  // Landing types
  const typeOptions: { value: Landing['type']; label: string }[] = [
    { value: 'service', label: 'Service' },
    { value: 'product', label: 'Produit' },
    { value: 'campaign', label: 'Campagne' },
    { value: 'event', label: 'Événement' },
    { value: 'generic', label: 'Générique' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('landing:title')}
        description={t('landing:description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:refresh')}
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('landing:create')}
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
      <LandingFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
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
      ) : landings.length === 0 ? (
        <EmptyState
          icon={Layout}
          title={t('landing:empty.title')}
          description={t('landing:empty.description')}
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('landing:create')}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {landings.map((landing) => (
            <LandingCard
              key={landing.id}
              landing={landing}
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
                      landings.length > 0 &&
                      selectedIds.size === landings.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('landing:columns.title')}</TableHead>
                <TableHead>{t('landing:columns.platform')}</TableHead>
                <TableHead>{t('landing:columns.type')}</TableHead>
                <TableHead>{t('landing:columns.status')}</TableHead>
                <TableHead className="text-center">{t('landing:columns.sections')}</TableHead>
                <TableHead className="text-center">{t('landing:columns.translations')}</TableHead>
                <TableHead className="text-center">{t('landing:columns.views')}</TableHead>
                <TableHead className="text-center">{t('landing:columns.conversion')}</TableHead>
                <TableHead>{t('landing:columns.date')}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {landings.map((landing) => (
                <LandingRow
                  key={landing.id}
                  landing={landing}
                  selected={selectedIds.has(landing.id)}
                  onSelect={(selected) => handleSelect(landing.id, selected)}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('landing:create')}</DialogTitle>
            <DialogDescription>{t('landing:createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newTitle">{t('landing:fields.title')}</Label>
              <Input
                id="newTitle"
                value={newLanding.title}
                onChange={(e) => setNewLanding((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t('landing:placeholders.title')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPlatform">{t('landing:fields.platform')}</Label>
              <Select
                value={newLanding.platform}
                onValueChange={(v) => setNewLanding((prev) => ({ ...prev, platform: v }))}
              >
                <SelectTrigger id="newPlatform" className="mt-1">
                  <SelectValue placeholder={t('landing:placeholders.platform')} />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newType">{t('landing:fields.type')}</Label>
              <Select
                value={newLanding.type}
                onValueChange={(v) => setNewLanding((prev) => ({ ...prev, type: v as Landing['type'] }))}
              >
                <SelectTrigger id="newType" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {templates && templates.length > 0 && (
              <div>
                <Label htmlFor="newTemplate">{t('landing:fields.template')}</Label>
                <Select
                  value={newLanding.templateId?.toString() || ''}
                  onValueChange={(v) =>
                    setNewLanding((prev) => ({
                      ...prev,
                      templateId: v ? parseInt(v) : undefined,
                    }))
                  }
                >
                  <SelectTrigger id="newTemplate" className="mt-1">
                    <SelectValue placeholder={t('landing:placeholders.noTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('landing:placeholders.noTemplate')}</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Sparkles className="h-4 w-4 mr-2" />
              {t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('landing:dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('landing:dialogs.delete.description')}
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

export default LandingsIndex;
