/**
 * Articles List Page
 * Comprehensive article management with filters and bulk actions
 */

import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus,
  Grid,
  List,
  Download,
  Trash2,
  Globe,
  FileText,
  Filter,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ArticleCard } from '@/components/content/ArticleCard';
import { ArticleRow } from '@/components/content/ArticleRow';
import { ArticleFilters } from '@/components/content/ArticleFilters';
import {
  useArticles,
  useArticleStats,
  useDeleteArticle,
  useDuplicateArticle,
  usePublishArticle,
  useBulkDeleteArticles,
  useBulkPublishArticles,
} from '@/hooks/useArticles';
import type { ArticleFilters as ArticleFiltersType } from '@/types/article';

type ViewMode = 'grid' | 'table';

export function ArticlesListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ArticleFiltersType>({
    page: 1,
    perPage: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Data fetching
  const { data: articlesData, isLoading, refetch } = useArticles(filters);
  const { data: statsData } = useArticleStats();
  const deleteArticle = useDeleteArticle();
  const duplicateArticle = useDuplicateArticle();
  const publishArticle = usePublishArticle();
  const bulkDelete = useBulkDeleteArticles();
  const bulkPublish = useBulkPublishArticles();

  const articles = articlesData?.data || [];
  const meta = articlesData?.meta;
  const stats = statsData?.data;

  // Selection handlers - memoized
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === articles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(articles.map((a) => a.id));
    }
  }, [selectedIds.length, articles]);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  }, []);

  // Action handlers - memoized
  const handleView = useCallback((id: string) => {
    navigate(`/content/articles/${id}/preview`);
  }, [navigate]);

  const handleEdit = useCallback((id: string) => {
    navigate(`/content/articles/${id}`);
  }, [navigate]);

  const handleDuplicate = useCallback(async (id: string) => {
    await duplicateArticle.mutateAsync(id);
  }, [duplicateArticle]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Supprimer cet article ?')) {
      await deleteArticle.mutateAsync(id);
    }
  }, [deleteArticle]);

  const handlePublish = useCallback(async (id: string) => {
    await publishArticle.mutateAsync({ articleId: id });
  }, [publishArticle]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} articles ?`)) return;
    await bulkDelete.mutateAsync(selectedIds);
    setSelectedIds([]);
  }, [selectedIds, bulkDelete]);

  const handleBulkPublish = useCallback(async () => {
    if (selectedIds.length === 0) return;
    await bulkPublish.mutateAsync(selectedIds);
    setSelectedIds([]);
  }, [selectedIds, bulkPublish]);

  // Export CSV - memoized
  const handleExport = useCallback(() => {
    // Generate CSV
    const headers = ['ID', 'Titre', 'Type', 'Plateforme', 'Pays', 'Langue', 'Status', 'Mots', 'Score', 'Date'];
    const rows = articles.map((article) => [
      article.id,
      `"${article.title.replace(/"/g, '""')}"`,
      article.type,
      article.platformId,
      article.countryId,
      article.languageId,
      article.status,
      article.wordCount,
      article.qualityScore,
      format(new Date(article.createdAt), 'yyyy-MM-dd'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `articles-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [articles]);

  // Pagination - memoized
  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return (
    <div className="flex h-full">
      {/* Filters Sidebar */}
      {showFilters && (
        <div className="w-72 border-r bg-white p-4 overflow-auto">
          <ArticleFilters
            filters={filters}
            onChange={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Articles</h1>
              <p className="text-muted-foreground">
                {meta?.total || 0} articles au total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button asChild>
                <Link to="/content/articles/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel article
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{stats.totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.publishedCount}</p>
                  <p className="text-xs text-muted-foreground">Publiés</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.draftCount}</p>
                  <p className="text-xs text-muted-foreground">Brouillons</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.scheduledCount}</p>
                  <p className="text-xs text-muted-foreground">Programmés</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{stats.avgQualityScore.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Score moyen</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtres
              </Button>

              {/* Bulk actions */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} sélectionné(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkPublish}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Publier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds([])}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun article trouvé</p>
                <Button className="mt-4" asChild>
                  <Link to="/content/articles/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un article
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 p-3">
                      <Checkbox
                        checked={selectedIds.length === articles.length}
                        onCheckedChange={() => handleSelectAll()}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Article</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Context</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="w-20 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      isSelected={selectedIds.includes(article.id)}
                      onSelect={handleSelect}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.lastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} sur {meta.lastPage}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.lastPage}
                  onClick={() => handlePageChange(meta.page + 1)}
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

export default ArticlesListPage;
