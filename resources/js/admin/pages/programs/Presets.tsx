import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Star,
  Eye,
  Lock,
  Globe,
  Languages,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CONTENT_TYPES } from '@/utils/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  usePresets,
  useCreatePreset,
  useDeletePreset,
  useSetDefaultPreset,
} from '@/hooks/usePresets';
import type { Preset, PresetConfig } from '@/types/program';

export function ProgramsPresets() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const { data: presetsData, isLoading } = usePresets({ search: searchQuery });
  const { mutate: createPreset, isPending: isCreating } = useCreatePreset();
  const { mutate: deletePreset, isPending: isDeleting } = useDeletePreset();
  const { mutate: setDefaultPreset } = useSetDefaultPreset();

  const presets = presetsData?.data || [];

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) return;

    createPreset(
      {
        name: newPresetName,
        description: newPresetDescription,
        config: {
          contentTypes: ['article'],
          countries: [],
          languages: ['fr'],
          themes: [],
          quantityMode: 'total',
          quantityValue: 10,
          recurrenceType: 'once',
          generationOptions: {
            model: 'gpt-4-turbo',
            temperature: 0.7,
            generateImage: true,
          },
        },
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setNewPresetName('');
          setNewPresetDescription('');
        },
      }
    );
  };

  const handleDeletePreset = () => {
    if (!selectedPreset) return;
    deletePreset(selectedPreset.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setSelectedPreset(null);
      },
    });
  };

  const handleSetDefault = (preset: Preset) => {
    setDefaultPreset(preset.id);
  };

  const handleDuplicate = (preset: Preset) => {
    createPreset({
      name: `${preset.name} (copie)`,
      description: preset.description,
      config: preset.config,
    });
  };

  const handleUsePreset = (preset: Preset) => {
    navigate(`/programs/builder?preset=${preset.id}`);
  };

  const renderPresetConfig = (config: PresetConfig) => {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Types de contenu</p>
          <div className="flex flex-wrap gap-1">
            {config.contentTypes?.map((typeId) => {
              const type = CONTENT_TYPES.find((t) => t.id === typeId);
              return (
                <Badge key={typeId} variant="secondary" className="text-xs">
                  {type?.name || typeId}
                </Badge>
              );
            })}
            {(!config.contentTypes || config.contentTypes.length === 0) && (
              <span className="text-sm text-muted-foreground">Non défini</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium mb-1">Pays</p>
            <p className="text-sm text-muted-foreground">
              {config.countries?.length || 0} sélectionnés
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Langues</p>
            <p className="text-sm text-muted-foreground">
              {config.languages?.length || 0} sélectionnées
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Thèmes</p>
            <p className="text-sm text-muted-foreground">
              {config.themes?.length || 0} sélectionnés
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Quantité</p>
          <p className="text-sm">
            {config.quantityValue} articles / {config.quantityMode}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Options de génération</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Modèle: {config.generationOptions?.model || 'gpt-4-turbo'}</p>
            <p>Images: {config.generationOptions?.generateImage ? 'Oui' : 'Non'}</p>
            <p>Auto-publish: {config.generationOptions?.autoPublish ? 'Oui' : 'Non'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Presets de programmes</h1>
              <p className="text-sm text-muted-foreground">
                Configurations réutilisables pour créer rapidement des programmes
              </p>
            </div>

            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau preset
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un preset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-20 bg-gray-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && presets.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucun preset</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre premier preset pour accélérer la création de programmes
            </p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un preset
            </Button>
          </div>
        )}

        {/* Presets grid */}
        {!isLoading && presets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <Card
                key={preset.id}
                className={cn(
                  'relative transition-shadow hover:shadow-md',
                  preset.isDefault && 'ring-2 ring-primary'
                )}
              >
                {/* System badge */}
                {preset.isSystem && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Système
                    </Badge>
                  </div>
                )}

                {/* Default indicator */}
                {preset.isDefault && (
                  <div className="absolute top-2 right-12">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUsePreset(preset)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Utiliser
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedPreset(preset);
                        setShowPreviewDialog(true);
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        Aperçu
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!preset.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(preset)}>
                          <Star className="w-4 h-4 mr-2" />
                          Définir par défaut
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(preset)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      {!preset.isSystem && (
                        <>
                          <DropdownMenuItem onClick={() => navigate(`/programs/presets/${preset.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPreset(preset);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent className="p-4 pt-10">
                  <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                  {preset.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  )}

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <Globe className="w-4 h-4 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium mt-1">
                        {preset.config.countries?.length || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <Languages className="w-4 h-4 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium mt-1">
                        {preset.config.languages?.length || 0}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <FileText className="w-4 h-4 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium mt-1">
                        {preset.config.contentTypes?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <span>Utilisé {preset.usageCount || 0} fois</span>
                    <span>
                      {format(new Date(preset.createdAt), 'dd/MM/yy', { locale: fr })}
                    </span>
                  </div>

                  {/* Use button */}
                  <Button
                    className="w-full mt-3"
                    variant="outline"
                    onClick={() => handleUsePreset(preset)}
                  >
                    Utiliser ce preset
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPreset?.name}</DialogTitle>
          </DialogHeader>
          {selectedPreset && (
            <div className="mt-4">
              {selectedPreset.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedPreset.description}
                </p>
              )}
              {renderPresetConfig(selectedPreset.config)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              if (selectedPreset) {
                handleUsePreset(selectedPreset);
              }
            }}>
              Utiliser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le preset ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Cette action est irréversible. Le preset "{selectedPreset?.name}" sera supprimé définitivement.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeletePreset} disabled={isDeleting}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Ex: Europe - Articles SEO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                placeholder="Description optionnelle..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePreset} disabled={isCreating || !newPresetName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProgramsPresets;