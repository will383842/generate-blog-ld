/**
 * Golden Categories Page
 * File 280 - Full page for managing golden example categories
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  ArrowLeft,
  Search,
  Loader2,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  MoveRight,
  ThumbsUp,
  ThumbsDown,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useGoldenCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useGoldenExamples';
import { GoldenCategories } from '@/components/quality/GoldenCategories';
import { GoldenCategoryWithStats, CreateCategoryInput } from '@/types/quality';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GoldenCategoryWithStats | null>(null);
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    parent: '',
  });

  // API hooks
  const { data: categories, isLoading } = useGoldenCategories(platformId);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({ name: '', description: '', parent: '' });
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (category: GoldenCategoryWithStats) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent || '',
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (category: GoldenCategoryWithStats) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    createCategory.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ name: '', description: '', parent: '' });
      },
    });
  };

  // Handle update
  const handleUpdate = () => {
    if (!selectedCategory) return;
    updateCategory.mutate(
      { slug: selectedCategory.slug, ...formData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedCategory(null);
        },
      }
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedCategory) return;
    deleteCategory.mutate(selectedCategory.slug, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedCategory(null);
      },
    });
  };

  // Flatten categories for table view
  const flattenCategories = (
    cats: GoldenCategoryWithStats[],
    level: number = 0
  ): (GoldenCategoryWithStats & { level: number })[] => {
    const result: (GoldenCategoryWithStats & { level: number })[] = [];
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = categories ? flattenCategories(categories) : [];
  const filteredCategories = search
    ? flatCategories.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : flatCategories;

  // Total stats
  const totalExamples = categories?.reduce((acc, c) => acc + c.examples_count, 0) || 0;
  const totalPositive = categories?.reduce((acc, c) => acc + c.positive_count, 0) || 0;
  const totalNegative = categories?.reduce((acc, c) => acc + c.negative_count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/quality/golden">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderTree className="h-6 w-6" />
              Catégories
            </h1>
            <p className="text-muted-foreground">
              Organisez vos exemples dorés par catégories
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FolderTree className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Catégories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalExamples}</p>
              <p className="text-sm text-muted-foreground">Exemples total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-green-100">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalPositive}</p>
              <p className="text-sm text-muted-foreground">Positifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-red-100">
              <ThumbsDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{totalNegative}</p>
              <p className="text-sm text-muted-foreground">Négatifs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Toutes les catégories</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="w-32">Exemples</TableHead>
                  <TableHead className="w-24">Positifs</TableHead>
                  <TableHead className="w-24">Négatifs</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map(category => (
                  <TableRow key={category.slug}>
                    <TableCell>
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${category.level * 20}px` }}
                      >
                        <Folder className="h-4 w-4 text-yellow-600" />
                        <div>
                          <Link
                            to={`/quality/golden?category=${category.slug}`}
                            className="font-medium hover:underline"
                          >
                            {category.name}
                          </Link>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.examples_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600">{category.positive_count}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600">{category.negative_count}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/quality/golden?category=${category.slug}`}>
                              <Star className="h-4 w-4 mr-2" />
                              Voir les exemples
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(category)}
                            className="text-red-600"
                            disabled={category.examples_count > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Aucune catégorie trouvée' : 'Aucune catégorie créée'}
              </p>
              {!search && (
                <Button variant="outline" onClick={openCreateDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une catégorie
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie pour organiser vos exemples
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Articles techniques"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la catégorie..."
                className="mt-1"
                rows={3}
              />
            </div>
            {categories && categories.length > 0 && (
              <div>
                <Label>Catégorie parente (optionnel)</Label>
                <Select
                  value={formData.parent || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, parent: v === 'none' ? '' : v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Aucune (racine)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (racine)</SelectItem>
                    {flatCategories.map(cat => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {'  '.repeat(cat.level)}{cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name.trim() || createCategory.isPending}
            >
              {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name.trim() || updateCategory.isPending}
            >
              {updateCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{selectedCategory?.name}" ?
              {selectedCategory?.examples_count ? (
                <span className="block mt-2 text-red-600">
                  Cette catégorie contient {selectedCategory.examples_count} exemple(s) et ne peut pas être supprimée.
                </span>
              ) : (
                <span className="block mt-2">Cette action est irréversible.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={(selectedCategory?.examples_count || 0) > 0 || deleteCategory.isPending}
            >
              {deleteCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
