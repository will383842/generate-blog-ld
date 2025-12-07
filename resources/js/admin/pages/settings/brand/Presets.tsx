/**
 * Brand Style Presets Page
 * File 259 - Full page for managing style presets
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  GitCompare,
  Star,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { usePlatform } from '@/hooks/usePlatform';
import { useStyleSettings, useStylePresets } from '@/hooks/useBrandValidation';
import { StylePresets } from '@/components/settings/StylePresets';
import { StylePreset, StyleSettings } from '@/types/brand';
import { cn } from '@/lib/utils';

export default function BrandPresetsPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<StylePreset[]>([]);

  // API hooks
  const { data: settings, isLoading: settingsLoading, refetch } = useStyleSettings(platformId);
  const { data: presets, isLoading: presetsLoading } = useStylePresets(platformId);

  // Filter presets
  const filteredPresets = presets?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle preset applied
  const handlePresetApplied = () => {
    refetch();
  };

  // Handle preset selection for comparison
  const togglePresetSelection = (preset: StylePreset) => {
    if (selectedPresets.find(p => p.id === preset.id)) {
      setSelectedPresets(selectedPresets.filter(p => p.id !== preset.id));
    } else if (selectedPresets.length < 3) {
      setSelectedPresets([...selectedPresets, preset]);
    }
  };

  // Compare dialog
  const openCompareDialog = () => {
    if (selectedPresets.length >= 2) {
      setCompareDialogOpen(true);
    }
  };

  // Get setting value display
  const getSettingDisplay = (_key: string, value: unknown) => {
    if (typeof value === 'number') {
      return `${value}%`;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} items` : '-';
    }
    if (typeof value === 'string') {
      return value;
    }
    return '-';
  };

  const isLoading = settingsLoading || presetsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/brand">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Presets de style
            </h1>
            <p className="text-muted-foreground">
              Gérez et comparez vos presets de style
            </p>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un preset..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedPresets.length >= 2 && (
            <Button variant="outline" onClick={openCompareDialog}>
              <GitCompare className="h-4 w-4 mr-2" />
              Comparer ({selectedPresets.length})
            </Button>
          )}
          {selectedPresets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPresets([])}
            >
              <X className="h-4 w-4 mr-2" />
              Désélectionner
            </Button>
          )}
        </div>
      </div>

      {/* Current Settings Preview */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Paramètres actuels
          </CardTitle>
          <CardDescription>
            Configuration active pour la génération de contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Formalité</span>
                <div className="font-medium">{settings.formality}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Convivialité</span>
                <div className="font-medium">{settings.friendliness}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Enthousiasme</span>
                <div className="font-medium">{settings.enthusiasm}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Vocabulaire</span>
                <div className="font-medium">{settings.vocabulary?.length || 0} termes</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Presets List */}
      <StylePresets
        platformId={platformId}
        onPresetApplied={handlePresetApplied}
      />

      {/* Preset Selection for Comparison */}
      {filteredPresets && filteredPresets.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparer des presets</CardTitle>
            <CardDescription>
              Sélectionnez 2 ou 3 presets pour les comparer côte à côte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filteredPresets.map(preset => (
                <Button
                  key={preset.id}
                  variant={selectedPresets.find(p => p.id === preset.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePresetSelection(preset)}
                  disabled={
                    selectedPresets.length >= 3 &&
                    !selectedPresets.find(p => p.id === preset.id)
                  }
                >
                  {selectedPresets.find(p => p.id === preset.id) && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {preset.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comparaison des presets</DialogTitle>
            <DialogDescription>
              Comparaison côte à côte des paramètres de style
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-1/4">Paramètre</th>
                  {selectedPresets.map(preset => (
                    <th key={preset.id} className="text-center p-2">
                      <div className="flex items-center justify-center gap-2">
                        {preset.name}
                        {preset.is_default && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Tone Parameters */}
                <tr className="bg-muted/50">
                  <td colSpan={selectedPresets.length + 1} className="p-2 font-medium">
                    Ton
                  </td>
                </tr>
                {['formality', 'friendliness', 'enthusiasm', 'confidence', 'empathy'].map(key => (
                  <tr key={key} className="border-b">
                    <td className="p-2 capitalize">{key}</td>
                    {selectedPresets.map(preset => (
                      <td key={preset.id} className="text-center p-2">
                        {getSettingDisplay(key, preset.settings[key as keyof StyleSettings])}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Complexity */}
                <tr className="bg-muted/50">
                  <td colSpan={selectedPresets.length + 1} className="p-2 font-medium">
                    Complexité
                  </td>
                </tr>
                {['sentence_length', 'vocabulary_level', 'technical_depth'].map(key => (
                  <tr key={key} className="border-b">
                    <td className="p-2 capitalize">{key.replace(/_/g, ' ')}</td>
                    {selectedPresets.map(preset => (
                      <td key={preset.id} className="text-center p-2">
                        {getSettingDisplay(key, preset.settings[key as keyof StyleSettings])}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Vocabulary */}
                <tr className="bg-muted/50">
                  <td colSpan={selectedPresets.length + 1} className="p-2 font-medium">
                    Vocabulaire
                  </td>
                </tr>
                {['vocabulary', 'forbidden_terms'].map(key => (
                  <tr key={key} className="border-b">
                    <td className="p-2 capitalize">{key.replace(/_/g, ' ')}</td>
                    {selectedPresets.map(preset => (
                      <td key={preset.id} className="text-center p-2">
                        {getSettingDisplay(key, preset.settings[key as keyof StyleSettings])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
