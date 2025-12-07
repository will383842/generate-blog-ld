/**
 * Comparatives Index Page
 * List and manage comparison articles
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  List,
  Grid3X3,
  Trash2,
  Send,
  Scale,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ComparativeCard } from '@/components/content/ComparativeCard';
import { ComparativeRow } from '@/components/content/ComparativeRow';
import { ArticleFilters } from '@/components/content/ArticleFilters';
import { useComparatives, useComparativeStats, useDeleteComparative } from '@/hooks/useComparatives';
import { useBulkDeleteArticles, useBulkPublishArticles } from '@/hooks/useArticles';
import type { ComparativeFilters, ComparativeType } from '@/types/comparative';

const COMPARATIVE_TYPES: { value: ComparativeType; label: string }[] = [
  { value: 'product', label: 'Produits' },
  { value: 'service', label: 'Services' },
  { value: 'provider', label: 'Prestataires' },
  { value: 'location', label: 'Destinations' },
  { value: 'method', label: 'Méthodes' },
  { value: 'general', label: 'Général' },
];

export default function ComparativesIndexPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ComparativeFilters>({
    page: 1,
    perPage: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const { data: comparativesData, isLoading } = useComparatives(filters);
  const { data: statsData } = useComparativeStats();
  const deleteComparative = useDeleteComparative();
  const bulkDelete = useBulkDeleteArticles();
  const bulkPublish = useBulkPublishArticles();

  const comparatives = comparativesData?.data || [];
  const meta = comparativesData?.meta;
  const stats = statsData?.data;

  // Selection handlers - memoized
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(comparatives.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [comparatives]);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Actions - memoized
  const handleView = useCallback((id: string) => {
    navigate(`/content/comparatives/${id}/preview`);
  }, [navigate]);

  const handleEdit = useCallback((id: string) => {
    navigate(`/content/comparatives/${id}`);
  }, [navigate]);

  const handleDuplicate = useCallback((_id: string) => {
    // TODO: Implement duplicate functionality
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Supprimer ce comparatif ?')) return;
    await deleteComparative.mutateAsync(id);
  }, [deleteComparative]);

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Supprimer ${selectedIds.size} comparatifs ?`)) return;
    await bulkDelete.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, bulkDelete]);

  const handleBulkPublish = useCallback(async () => {
    await bulkPublish.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, bulkPublish]);

  // Export CSV - memoized
  const handleExport = useCallback(() => {
    const headers = ['ID', 'Titre', 'Type', 'Plateforme', 'Pays', 'Éléments', 'Critères', 'Status', 'Date'];
    const rows = comparatives.map((c) => [
      c.id,
      c.title,
      c.comparativeType,
      c.platformId,
      c.countryId,
      c.items.length,
      c.criteria.length,
      c.status,
      c.updatedAt,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparatives-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [comparatives]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6" />
            Comparatifs
          </h1>
          <p className="text-muted-foreground">Articles de comparaison avec scoring</p>
        </div>
        <Button onClick={() => navigate('/content/comparatives/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau comparatif
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.publishedCount}</p>
                  <p className="text-xs text-muted-foreground">Publiés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgItemsCount?.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Éléments moyens</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgCriteriaCount?.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Critères moyens</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.byType?.product || 0}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>

          {/* Type Filter */}
          <Select
            value={filters.comparativeType || 'all'}
            onValueChange={(v) =>
              setFilters({ ...filters, comparativeType: v === 'all' ? undefined : (v as ComparativeType) })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {COMPARATIVE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              <Badge variant="secondary">{selectedIds.size} sélectionné(s)</Badge>
              <Button variant="outline" size="sm" onClick={handleBulkPublish}>
                <Send className="w-4 h-4 mr-1" />
                Publier
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Exporter
          </Button>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <ArticleFilters
              filters={filters}
              onChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
              onClear={() => setFilters({ page: 1, perPage: 20, sortBy: 'updatedAt', sortOrder: 'desc' })}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : comparatives.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun comparatif</h3>
              <p className="text-muted-foreground mb-4">Créez votre premier article comparatif</p>
              <Button onClick={() => navigate('/content/comparatives/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un comparatif
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {comparatives.map((comparative) => (
                <ComparativeCard
                  key={comparative.id}
                  comparative={comparative}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === comparatives.length && comparatives.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Contexte</TableHead>
                    <TableHead>Éléments</TableHead>
                    <TableHead>Critères</TableHead>
                    <TableHead>Gagnant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparatives.map((comparative) => (
                    <ComparativeRow
                      key={comparative.id}
                      comparative={comparative}
                      isSelected={selectedIds.has(comparative.id)}
                      onSelect={(checked) => handleSelect(comparative.id, checked)}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.lastPage > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} sur {meta.lastPage} ({meta.total} résultats)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setFilters({ ...filters, page: meta.page - 1 })}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.lastPage}
                  onClick={() => setFilters({ ...filters, page: meta.page + 1 })}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
