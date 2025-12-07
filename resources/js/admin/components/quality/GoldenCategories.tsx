/**
 * Golden Categories Component
 * File 273 - Tree view for managing golden example categories
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Loader2,
  MoveRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  useGoldenCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useGoldenExamples';
import { GoldenCategoryWithStats, CreateCategoryInput } from '@/types/quality';
import { cn } from '@/lib/utils';

interface GoldenCategoriesProps {
  platformId: number;
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
  showActions?: boolean;
}

export function GoldenCategories({
  platformId,
  onCategorySelect,
  selectedCategory,
  showActions = true,
}: GoldenCategoriesProps) {
  const { t } = useTranslation();

  // State
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategoryData, setSelectedCategoryData] = useState<GoldenCategoryWithStats | null>(null);
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

  // Toggle expand
  const toggleExpand = (slug: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(slug)) {
      newExpanded.delete(slug);
    } else {
      newExpanded.add(slug);
    }
    setExpandedCategories(newExpanded);
  };

  // Open create dialog
  const openCreateDialog = (parent?: string) => {
    setFormData({ name: '', description: '', parent: parent || '' });
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (category: GoldenCategoryWithStats) => {
    setSelectedCategoryData(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent || '',
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (category: GoldenCategoryWithStats) => {
    setSelectedCategoryData(category);
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
    if (!selectedCategoryData) return;
    updateCategory.mutate(
      { slug: selectedCategoryData.slug, ...formData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedCategoryData(null);
        },
      }
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedCategoryData) return;
    deleteCategory.mutate(selectedCategoryData.slug, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedCategoryData(null);
      },
    });
  };

  // Render category item
  const renderCategory = (category: GoldenCategoryWithStats, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.slug);
    const isSelected = selectedCategory === category.slug;

    return (
      <div key={category.slug}>
        <Collapsible
          open={isExpanded}
          onOpenChange={() => hasChildren && toggleExpand(category.slug)}
        >
          <div
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg transition-colors',
              isSelected && 'bg-primary/10',
              !isSelected && 'hover:bg-muted'
            )}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            {/* Expand toggle */}
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <div className="w-6" />
            )}

            {/* Folder icon */}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-600" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-600" />
            )}

            {/* Category name - clickable */}
            <button
              onClick={() => onCategorySelect?.(category.slug)}
              className="flex-1 text-left font-medium text-sm"
            >
              {category.name}
            </button>

            {/* Stats */}
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs gap-1">
                <ThumbsUp className="h-3 w-3 text-green-500" />
                {category.positive_count}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <ThumbsDown className="h-3 w-3 text-red-500" />
                {category.negative_count}
              </Badge>
            </div>

            {/* Actions */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openCreateDialog(category.slug)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter sous-catégorie
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
            )}
          </div>

          {/* Children */}
          {hasChildren && (
            <CollapsibleContent>
              {category.children!.map(child => renderCategory(child, level + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          Catégories
        </CardTitle>
        {showActions && (
          <Button size="sm" onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {categories && categories.length > 0 ? (
          <div className="space-y-1">
            {/* All category */}
            <button
              onClick={() => onCategorySelect?.('')}
              className={cn(
                'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                !selectedCategory && 'bg-primary/10',
                selectedCategory && 'hover:bg-muted'
              )}
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Toutes les catégories</span>
              <Badge variant="secondary" className="ml-auto">
                {categories.reduce((acc, c) => acc + c.examples_count, 0)}
              </Badge>
            </button>

            {/* Category tree */}
            {categories.map(category => renderCategory(category))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Aucune catégorie</p>
            {showActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCreateDialog()}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une catégorie
              </Button>
            )}
          </div>
        )}
      </CardContent>

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
                    {categories.map(cat => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
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
              Êtes-vous sûr de vouloir supprimer la catégorie "{selectedCategoryData?.name}" ?
              {selectedCategoryData?.examples_count ? (
                <span className="block mt-2 text-red-600">
                  Cette catégorie contient {selectedCategoryData.examples_count} exemple(s) et ne peut pas être supprimée.
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
              disabled={(selectedCategoryData?.examples_count || 0) > 0 || deleteCategory.isPending}
            >
              {deleteCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default GoldenCategories;
