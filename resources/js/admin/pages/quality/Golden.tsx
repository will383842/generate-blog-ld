/**
 * Golden Examples Page
 * File 279 - List and manage golden examples for training
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Star,
  Search,
  Filter,
  Download,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  MoreHorizontal,
  Eye,
  Trash2,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useGoldenExamples,
  useGoldenCategories,
  useUnmarkGolden,
  useMoveToCategory,
  useExportTraining,
} from '@/hooks/useGoldenExamples';
import { GoldenExampleCard } from '@/components/quality/GoldenExampleCard';
import { GoldenCategories } from '@/components/quality/GoldenCategories';
import {
  GoldenExample,
  GoldenExampleFilters,
  GoldenExampleType,
  ContentType,
} from '@/types/quality';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'comparative', label: 'Comparatif' },
  { value: 'pillar', label: 'Pilier' },
  { value: 'press', label: 'Communiqué' },
];

export default function GoldenExamplesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState('');

  // Filters from URL
  const filters: GoldenExampleFilters = {
    platform_id: platformId,
    content_type: searchParams.get('type') as ContentType || undefined,
    category: searchParams.get('category') || undefined,
    example_type: searchParams.get('example_type') as GoldenExampleType || undefined,
    is_active: searchParams.get('active') === 'false' ? false : undefined,
    search: search || undefined,
    page: Number(searchParams.get('page')) || 1,
    per_page: 20,
  };

  // API hooks
  const { data, isLoading, refetch } = useGoldenExamples(filters);
  const { data: categories } = useGoldenCategories(platformId);
  const unmarkGolden = useUnmarkGolden();
  const moveToCategory = useMoveToCategory();
  const exportTraining = useExportTraining();

  // Update filter
  const updateFilter = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (data?.data) {
      setSelectedIds(new Set(data.data.map(e => e.id)));
    }
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Handle move
  const handleMove = () => {
    if (selectedIds.size === 0 || !targetCategory) return;
    moveToCategory.mutate(
      { exampleIds: Array.from(selectedIds), category: targetCategory },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setMoveDialogOpen(false);
          setTargetCategory('');
        },
      }
    );
  };

  // Pagination
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;
  const currentPage = data?.page || 1;

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  // Count by type
  const positiveCount = data?.data?.filter(e => e.example_type === 'positive').length || 0;
  const negativeCount = data?.data?.filter(e => e.example_type === 'negative').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6" />
            Exemples dorés
          </h1>
          <p className="text-muted-foreground">
            {data?.total || 0} exemples de référence pour le training
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/quality/categories">
              <FolderTree className="h-4 w-4 mr-2" />
              Gérer catégories
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/quality/training">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total exemples</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-green-100">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
              <p className="text-sm text-muted-foreground">Exemples positifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-red-100">
              <ThumbsDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
              <p className="text-sm text-muted-foreground">Exemples négatifs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <GoldenCategories
            platformId={platformId}
            selectedCategory={filters.category}
            onCategorySelect={(cat) => updateFilter('category', cat || undefined)}
            showActions={false}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateFilter('search', search)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Content type */}
                <Select
                  value={filters.content_type || 'all'}
                  onValueChange={(v) => updateFilter('type', v === 'all' ? undefined : v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Example type */}
                <Select
                  value={filters.example_type || 'all'}
                  onValueChange={(v) => updateFilter('example_type', v === 'all' ? undefined : v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type exemple" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="positive">Positifs</SelectItem>
                    <SelectItem value="negative">Négatifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} sélectionné(s)
                  </span>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Désélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMoveDialogOpen(true)}
                  >
                    <FolderTree className="h-4 w-4 mr-2" />
                    Déplacer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Examples grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.data.map(example => (
                <div key={example.id} className="relative">
                  <div className="absolute top-4 left-4 z-10">
                    <Checkbox
                      checked={selectedIds.has(example.id)}
                      onCheckedChange={() => toggleSelection(example.id)}
                    />
                  </div>
                  <GoldenExampleCard example={example} />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun exemple doré trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Marquez des contenus de qualité depuis les vérifications
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déplacer vers une catégorie</DialogTitle>
            <DialogDescription>
              Déplacer {selectedIds.size} exemple(s) vers une autre catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={targetCategory} onValueChange={setTargetCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.examples_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleMove}
              disabled={!targetCategory || moveToCategory.isPending}
            >
              {moveToCategory.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Déplacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
