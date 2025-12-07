/**
 * Source Manager Component
 * File 288 - Manage research sources with drag & drop priority
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  useAddSource,
  useUpdateSource,
  useDeleteSource,
  useReorderSources,
} from '@/hooks/useResearch';
import {
  ResearchSource,
  CreateSourceInput,
  SOURCE_TYPES,
  getSourceTypeMetadata,
} from '@/types/research';
import { cn } from '@/lib/utils';

interface SourceManagerProps {
  sources: ResearchSource[];
  isLoading?: boolean;
  compact?: boolean;
}

export function SourceManager({
  sources,
  isLoading = false,
  compact = false,
}: SourceManagerProps) {
  const { t } = useTranslation();

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);
  const [formData, setFormData] = useState<CreateSourceInput>({
    name: '',
    url: '',
    type: 'web',
    priority: 50,
    reliability_score: 60,
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // API hooks
  const addSource = useAddSource();
  const updateSource = useUpdateSource();
  const deleteSource = useDeleteSource();
  const reorderSources = useReorderSources();

  // Open create dialog
  const openCreateDialog = () => {
    setFormData({
      name: '',
      url: '',
      type: 'web',
      priority: 50,
      reliability_score: 60,
    });
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (source: ResearchSource) => {
    setSelectedSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      type: source.type,
      priority: source.priority,
      reliability_score: source.reliability_score,
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (source: ResearchSource) => {
    setSelectedSource(source);
    setDeleteDialogOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    addSource.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  // Handle update
  const handleUpdate = () => {
    if (!selectedSource) return;
    updateSource.mutate(
      { id: selectedSource.id, ...formData },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedSource(null);
        },
      }
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedSource) return;
    deleteSource.mutate(selectedSource.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedSource(null);
      },
    });
  };

  // Handle toggle active
  const handleToggleActive = (source: ResearchSource) => {
    updateSource.mutate({ id: source.id, is_active: !source.is_active });
  };

  // Drag & drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSources = [...sources];
    const [draggedSource] = newSources.splice(draggedIndex, 1);
    newSources.splice(index, 0, draggedSource);
    
    // Reorder would happen on drop
  };

  const handleDrop = () => {
    if (draggedIndex === null) return;
    const sourceIds = sources.map(s => s.id);
    reorderSources.mutate(sourceIds);
    setDraggedIndex(null);
  };

  // Get reliability color
  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {sources.slice(0, 5).map(source => {
          const typeMeta = getSourceTypeMetadata(source.type);
          return (
            <div
              key={source.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    source.is_active ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
                <span className="font-medium text-sm">{source.name}</span>
                <Badge variant="outline" className="text-xs">
                  {typeMeta?.label || source.type}
                </Badge>
              </div>
              <span className={cn('text-sm font-medium', getReliabilityColor(source.reliability_score))}>
                {source.reliability_score}%
              </span>
            </div>
          );
        })}
        {sources.length > 5 && (
          <p className="text-sm text-muted-foreground text-center">
            +{sources.length - 5} autres sources
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Sources de recherche ({sources.length})
        </CardTitle>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {sources.length > 0 ? (
          <div className="space-y-2">
            {sources.map((source, index) => {
              const typeMeta = getSourceTypeMetadata(source.type);
              return (
                <div
                  key={source.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                    draggedIndex === index && 'opacity-50',
                    !source.is_active && 'opacity-60 bg-muted'
                  )}
                >
                  {/* Drag handle */}
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                  {/* Status indicator */}
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      source.is_active ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />

                  {/* Source info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.name}</span>
                      {source.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        style={{ borderColor: typeMeta?.color, color: typeMeta?.color }}
                      >
                        {typeMeta?.label || source.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {source.url}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <TooltipProvider>
                    <div className="flex items-center gap-4 text-sm">
                      <Tooltip>
                        <TooltipTrigger className="text-center">
                          <div className={cn('font-medium', getReliabilityColor(source.reliability_score))}>
                            {source.reliability_score}%
                          </div>
                          <div className="text-xs text-muted-foreground">Fiabilité</div>
                        </TooltipTrigger>
                        <TooltipContent>Score de fiabilité</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger className="text-center">
                          <div className="font-medium">{source.priority}</div>
                          <div className="text-xs text-muted-foreground">Priorité</div>
                        </TooltipTrigger>
                        <TooltipContent>Priorité (1-100)</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger className="text-center">
                          <div className="font-medium">{source.usage_count}</div>
                          <div className="text-xs text-muted-foreground">Utilisations</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Taux de succès: {(source.success_rate * 100).toFixed(0)}%
                          <br />
                          Temps moyen: {source.avg_response_time}ms
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(source)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(source)}>
                        {source.is_active ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(source)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune source configurée</p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une source
            </Button>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editDialogOpen ? 'Modifier la source' : 'Nouvelle source'}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de la source de recherche
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Google Scholar"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => {
                  const typeMeta = getSourceTypeMetadata(v);
                  setFormData({
                    ...formData,
                    type: v,
                    reliability_score: typeMeta?.default_reliability || 60,
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map(type => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priorité: {formData.priority}</Label>
              <Slider
                value={[formData.priority || 50]}
                onValueChange={([v]) => setFormData({ ...formData, priority: v })}
                min={1}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Fiabilité: {formData.reliability_score}%</Label>
              <Slider
                value={[formData.reliability_score || 60]}
                onValueChange={([v]) => setFormData({ ...formData, reliability_score: v })}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={editDialogOpen ? handleUpdate : handleCreate}
              disabled={
                !formData.name.trim() ||
                !formData.url.trim() ||
                addSource.isPending ||
                updateSource.isPending
              }
            >
              {(addSource.isPending || updateSource.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editDialogOpen ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la source</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer "{selectedSource?.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSource.isPending}
            >
              {deleteSource.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default SourceManager;
