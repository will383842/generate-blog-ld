/**
 * Style Presets Component
 * File 251 - Manage style presets (list, apply, create, edit, delete)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Plus,
  Check,
  Star,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
  useStylePresets,
  useCreateStylePreset,
  useUpdateStylePreset,
  useDeleteStylePreset,
  useApplyPreset,
  useSetDefaultPreset,
  useStyleSettings,
} from '@/hooks/useBrandValidation';
import { StylePreset, StyleSettings } from '@/types/brand';
import { cn } from '@/lib/utils';

interface StylePresetsProps {
  platformId: number;
  onPresetApplied?: (settings: StyleSettings) => void;
  compact?: boolean;
}

export function StylePresets({
  platformId,
  onPresetApplied,
  compact = false,
}: StylePresetsProps) {
  const { t } = useTranslation();

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  // API hooks
  const { data: presets, isLoading } = useStylePresets(platformId);
  const { data: currentSettings } = useStyleSettings(platformId);
  const createPreset = useCreateStylePreset();
  const updatePreset = useUpdateStylePreset();
  const deletePreset = useDeleteStylePreset();
  const applyPreset = useApplyPreset();
  const setDefault = useSetDefaultPreset();

  // Handle create preset from current settings
  const handleCreatePreset = () => {
    if (!newPresetName.trim() || !currentSettings) return;

    createPreset.mutate({
      platform_id: platformId,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      settings: {
        formality: currentSettings.formality,
        friendliness: currentSettings.friendliness,
        enthusiasm: currentSettings.enthusiasm,
        confidence: currentSettings.confidence,
        empathy: currentSettings.empathy,
        sentence_length: currentSettings.sentence_length,
        vocabulary_level: currentSettings.vocabulary_level,
        technical_depth: currentSettings.technical_depth,
        vocabulary: currentSettings.vocabulary,
        forbidden_terms: currentSettings.forbidden_terms,
        required_elements: currentSettings.required_elements,
        template_phrases: currentSettings.template_phrases,
        formatting_rules: currentSettings.formatting_rules,
      },
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setNewPresetName('');
        setNewPresetDescription('');
      },
    });
  };

  // Handle edit preset
  const handleEditPreset = () => {
    if (!selectedPreset || !newPresetName.trim()) return;

    updatePreset.mutate({
      id: selectedPreset.id,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedPreset(null);
        setNewPresetName('');
        setNewPresetDescription('');
      },
    });
  };

  // Handle delete preset
  const handleDeletePreset = () => {
    if (!selectedPreset) return;

    deletePreset.mutate(selectedPreset.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedPreset(null);
      },
    });
  };

  // Handle apply preset
  const handleApplyPreset = (preset: StylePreset) => {
    applyPreset.mutate(
      { platformId, presetId: preset.id },
      {
        onSuccess: (settings) => {
          onPresetApplied?.(settings);
        },
      }
    );
  };

  // Handle set as default
  const handleSetDefault = (preset: StylePreset) => {
    setDefault.mutate({ platformId, presetId: preset.id });
  };

  // Open edit dialog
  const openEditDialog = (preset: StylePreset) => {
    setSelectedPreset(preset);
    setNewPresetName(preset.name);
    setNewPresetDescription(preset.description || '');
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (preset: StylePreset) => {
    setSelectedPreset(preset);
    setDeleteDialogOpen(true);
  };

  // Get tone description from settings
  const getToneDescription = (settings: Partial<StyleSettings>) => {
    const parts = [];
    if (settings.formality !== undefined) {
      parts.push(settings.formality > 70 ? 'Formel' : settings.formality > 30 ? 'Équilibré' : 'Décontracté');
    }
    if (settings.friendliness !== undefined) {
      parts.push(settings.friendliness > 70 ? 'Chaleureux' : settings.friendliness > 30 ? 'Cordial' : 'Neutre');
    }
    return parts.join(', ') || 'Non défini';
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

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('brand.presets.title')}</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets?.map(preset => (
            <Button
              key={preset.id}
              variant={preset.is_default ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleApplyPreset(preset)}
              disabled={applyPreset.isPending}
            >
              {preset.is_default && <Star className="h-3 w-3 mr-1 fill-current" />}
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{t('brand.presets.title')}</span>
          <Badge variant="secondary">{presets?.length || 0}</Badge>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('brand.presets.saveAsCurrent')}
        </Button>
      </div>

      {/* Presets Grid */}
      {presets && presets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map(preset => (
            <Card
              key={preset.id}
              className={cn(
                'relative transition-all hover:shadow-md',
                preset.is_default && 'ring-2 ring-primary'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {preset.name}
                      {preset.is_default && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      {preset.is_system && (
                        <Badge variant="outline" className="text-xs">
                          Système
                        </Badge>
                      )}
                    </CardTitle>
                    {preset.description && (
                      <CardDescription className="mt-1">
                        {preset.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleApplyPreset(preset)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Appliquer
                      </DropdownMenuItem>
                      {!preset.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(preset)}>
                          <Star className="h-4 w-4 mr-2" />
                          Définir par défaut
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {!preset.is_system && (
                        <>
                          <DropdownMenuItem onClick={() => openEditDialog(preset)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(preset)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Ton :</strong> {getToneDescription(preset.settings)}
                  </p>
                  {preset.settings.vocabulary_level && (
                    <p>
                      <strong>Vocabulaire :</strong>{' '}
                      {preset.settings.vocabulary_level === 'simple' ? 'Simple' :
                       preset.settings.vocabulary_level === 'expert' ? 'Expert' : 'Standard'}
                    </p>
                  )}
                  {preset.settings.vocabulary && preset.settings.vocabulary.length > 0 && (
                    <p>
                      <strong>Termes :</strong> {preset.settings.vocabulary.length} privilégiés
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleApplyPreset(preset)}
                  disabled={applyPreset.isPending}
                >
                  {applyPreset.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Appliquer ce preset
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">Aucun preset</h3>
            <p className="text-muted-foreground text-center mt-2">
              Créez votre premier preset à partir des paramètres actuels
            </p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un preset
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un preset</DialogTitle>
            <DialogDescription>
              Sauvegardez les paramètres de style actuels comme un nouveau preset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">Nom du preset</Label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Ex: Ton professionnel"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="preset-description">Description (optionnel)</Label>
              <Textarea
                id="preset-description"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                placeholder="Décrivez ce preset..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreatePreset}
              disabled={!newPresetName.trim() || createPreset.isPending}
            >
              {createPreset.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-preset-name">Nom du preset</Label>
              <Input
                id="edit-preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-preset-description">Description</Label>
              <Textarea
                id="edit-preset-description"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
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
              onClick={handleEditPreset}
              disabled={!newPresetName.trim() || updatePreset.isPending}
            >
              {updatePreset.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Supprimer le preset
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le preset "{selectedPreset?.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePreset}
              disabled={deletePreset.isPending}
            >
              {deletePreset.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StylePresets;
