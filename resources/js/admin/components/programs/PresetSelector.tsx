import { useState } from 'react';
import {
  ChevronDown,
  Check,
  Save,
  Star,
  Trash2,
  Edit,
  Settings,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { usePresets, useApplyPreset, useCreatePreset, useDeletePreset, useSetDefaultPreset } from '@/hooks/usePresets';
import type { Preset, PresetConfig } from '@/types/program';

export interface PresetSelectorProps {
  currentConfig?: Partial<PresetConfig>;
  onApply: (config: PresetConfig) => void;
  className?: string;
}

export function PresetSelector({
  currentConfig,
  onApply,
  className,
}: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const { data: presetsData, isLoading } = usePresets();
  const presets = presetsData?.data || [];
  
  const applyPreset = useApplyPreset();
  const createPreset = useCreatePreset();
  const deletePreset = useDeletePreset();
  const setDefaultPreset = useSetDefaultPreset();

  const handleApplyPreset = async (presetId: string) => {
    try {
      const result = await applyPreset.mutateAsync(presetId);
      if (result.data) {
        onApply(result.data);
        setSelectedPresetId(presetId);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  };

  const handleSaveAsPreset = async () => {
    if (!newPresetName.trim() || !currentConfig) return;

    try {
      await createPreset.mutateAsync({
        name: newPresetName,
        config: currentConfig as PresetConfig,
      });
      setSaveDialogOpen(false);
      setNewPresetName('');
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce preset ?')) return;

    try {
      await deletePreset.mutateAsync(presetId);
      if (selectedPresetId === presetId) {
        setSelectedPresetId(null);
      }
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const handleSetDefault = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await setDefaultPreset.mutateAsync(presetId);
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Preset dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            {selectedPreset ? selectedPreset.name : 'Charger un preset'}
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Aucun preset disponible
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => handleApplyPreset(preset.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  {selectedPresetId === preset.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{preset.name}</span>
                      {preset.isDefault && (
                        <Badge variant="secondary" className="text-[10px]">
                          Défaut
                        </Badge>
                      )}
                      {preset.isSystem && (
                        <Badge variant="outline" className="text-[10px]">
                          Système
                        </Badge>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {preset.description}
                      </p>
                    )}
                  </div>
                </div>

                {!preset.isSystem && (
                  <div className="flex items-center gap-1 ml-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleSetDefault(preset.id, e)}
                        >
                          <Star
                            className={cn(
                              'w-3.5 h-3.5',
                              preset.isDefault
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Définir par défaut</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-primary cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
              setSaveDialogOpen(true);
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder comme preset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear preset button */}
      {selectedPresetId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedPresetId(null)}
        >
          Personnalisé
        </Button>
      )}

      {/* Save preset dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder comme preset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nom du preset</Label>
              <Input
                id="preset-name"
                placeholder="Mon preset personnalisé"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>

            {currentConfig && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Configuration actuelle :</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Types : {currentConfig.contentTypes?.length || 0}</div>
                  <div>Pays : {currentConfig.countries?.length || 0}</div>
                  <div>Langues : {currentConfig.languages?.length || 0}</div>
                  <div>Thèmes : {currentConfig.themes?.length || 0}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveAsPreset}
              disabled={!newPresetName.trim() || createPreset.isPending}
            >
              {createPreset.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mini version for form headers
export function PresetSelectorMini({
  onApply,
  className,
}: {
  onApply: (config: PresetConfig) => void;
  className?: string;
}) {
  const { data: presetsData, isLoading } = usePresets();
  const presets = presetsData?.data || [];
  const applyPreset = useApplyPreset();

  const handleApply = async (presetId: string) => {
    try {
      const result = await applyPreset.mutateAsync(presetId);
      if (result.data) {
        onApply(result.data);
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  };

  if (isLoading || presets.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="text-muted-foreground">Presets :</span>
      {presets.slice(0, 3).map((preset) => (
        <Button
          key={preset.id}
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => handleApply(preset.id)}
        >
          {preset.name}
        </Button>
      ))}
      {presets.length > 3 && (
        <span className="text-muted-foreground text-xs">
          +{presets.length - 3}
        </span>
      )}
    </div>
  );
}

export default PresetSelector;
