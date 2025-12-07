/**
 * Brand Style Settings Page
 * File 258 - Full page for style parameters configuration
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Settings2,
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useStyleSettings,
  useUpdateStyleSettings,
} from '@/hooks/useBrandValidation';
import { StyleSettingsForm } from '@/components/settings/StyleSettings';
import { StylePresets } from '@/components/settings/StylePresets';
import { StyleSettings } from '@/types/brand';

export default function BrandStylePage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // API hooks
  const { data: settings, isLoading, refetch } = useStyleSettings(platformId);
  const updateSettings = useUpdateStyleSettings();

  // Handle save
  const handleSave = (newSettings: Partial<StyleSettings>) => {
    updateSettings.mutate({
      platform_id: platformId,
      ...newSettings,
    });
  };

  // Handle preset applied
  const handlePresetApplied = () => {
    refetch();
  };

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
              <Settings2 className="h-6 w-6" />
              Paramètres de style
            </h1>
            <p className="text-muted-foreground">
              Configurez le ton et les règles de formatage de votre marque
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Ces paramètres influencent directement la génération de contenu.
          Les modifications sont appliquées immédiatement à tous les nouveaux contenus.
        </AlertDescription>
      </Alert>

      {/* Presets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presets rapides</CardTitle>
          <CardDescription>
            Appliquez un preset pour configurer rapidement le style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StylePresets
            platformId={platformId}
            onPresetApplied={handlePresetApplied}
            compact
          />
        </CardContent>
      </Card>

      {/* Main Settings Form */}
      <StyleSettingsForm
        settings={settings}
        onSave={handleSave}
        isSaving={updateSettings.isPending}
        showPreview
      />
    </div>
  );
}
