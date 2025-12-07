import {
  Check,
  AlertTriangle,
  FileText,
  Globe,
  Languages,
  FolderTree,
  Calendar,
  Settings,
  Sparkles,
  Save,
  Play,
  Brain,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CostEstimator } from './CostEstimator';
import { PLATFORMS, CONTENT_TYPES, LANGUAGES } from '@/utils/constants';
import type { CreateProgramInput } from '@/types/program';

export interface ReviewStepProps {
  programData: CreateProgramInput;
  onSaveDraft: () => void;
  onActivate: () => void;
  onRunNow: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function ReviewStep({
  programData,
  onSaveDraft,
  onActivate,
  onRunNow,
  isSubmitting,
  className,
}: ReviewStepProps) {
  const platform = PLATFORMS.find((p) => p.id === programData.platformId);
  const selectedTypes = CONTENT_TYPES.filter((t) =>
    programData.contentTypes.includes(t.id)
  );
  const selectedLanguages = LANGUAGES.filter((l) =>
    programData.languages.includes(l.code)
  );

  // Calculate estimated total
  const estimatedTotal = (() => {
    const { quantityMode, quantityValue, countries, languages, themes } = programData;
    switch (quantityMode) {
      case 'total': return quantityValue;
      case 'perCountry': return quantityValue * countries.length;
      case 'perLanguage': return quantityValue * languages.length;
      case 'perCountryLanguage': return quantityValue * countries.length * languages.length;
      case 'perTheme': return quantityValue * themes.length;
      default: return quantityValue;
    }
  })();

  // Validation warnings
  const warnings: string[] = [];
  if (estimatedTotal > 1000) {
    warnings.push('Volume important : plus de 1000 articles par exécution');
  }
  if (programData.countries.length > 50) {
    warnings.push('Beaucoup de pays sélectionnés : considérez de fractionner');
  }
  if (programData.generationOptions?.autoPublish) {
    warnings.push('Auto-publication activée : les articles seront publiés sans révision');
  }

  const getRecurrenceLabel = () => {
    const config = programData.recurrenceConfig as Record<string, unknown>;
    switch (programData.recurrenceType) {
      case 'once': return `Une seule fois le ${format(new Date(config?.scheduledAt || new Date()), 'PPP', { locale: fr })}`;
      case 'daily': return `Tous les jours à ${config?.time || '09:00'}`;
      case 'weekly': return `Chaque semaine à ${config?.time || '09:00'}`;
      case 'monthly': return `Chaque mois le ${config?.dayOfMonth || 1} à ${config?.time || '09:00'}`;
      case 'cron': return `Expression cron : ${config?.expression || '0 9 * * *'}`;
      default: return 'Non défini';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Récapitulatif
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez la configuration avant de créer le programme
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1"
          style={{ borderColor: platform?.color, color: platform?.color }}
        >
          {platform?.name}
        </Badge>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Points d'attention</p>
              <ul className="mt-2 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-yellow-700">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main config grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Program Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Nom</p>
              <p className="font-medium">{programData.name || 'Sans nom'}</p>
            </div>
            {programData.description && (
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{programData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Types de contenu ({selectedTypes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {selectedTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant="secondary"
                  style={{ backgroundColor: `${type.color}20`, color: type.color }}
                >
                  {type.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Pays ({programData.countries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programData.countries.length <= 10 ? (
              <div className="flex flex-wrap gap-1">
                {programData.countries.map((code) => (
                  <Badge key={code} variant="outline">
                    {code}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {programData.countries.slice(0, 5).join(', ')} et {programData.countries.length - 5} autres
              </p>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Langues ({selectedLanguages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedLanguages.map((lang) => (
                <span key={lang.code} className="text-sm">
                  {lang.flag} {lang.nativeName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Themes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Thèmes ({programData.themes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {programData.themes.length} thème{programData.themes.length !== 1 ? 's' : ''} sélectionné{programData.themes.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Quantity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mode</span>
              <Badge variant="secondary">{programData.quantityMode}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantité</span>
              <span className="font-medium">{programData.quantityValue}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium">Total estimé</span>
              <span className="text-lg font-bold text-primary">
                {estimatedTotal.toLocaleString()} articles
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Planification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{getRecurrenceLabel()}</p>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Check className={cn(
                'w-4 h-4',
                programData.generationOptions?.generateImage ? 'text-green-500' : 'text-gray-300'
              )} />
              <span>Images</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className={cn(
                'w-4 h-4',
                programData.generationOptions?.autoPublish ? 'text-green-500' : 'text-gray-300'
              )} />
              <span>Auto-publication</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className={cn(
                'w-4 h-4',
                programData.generationOptions?.includeInternalLinks ? 'text-green-500' : 'text-gray-300'
              )} />
              <span>Liens internes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge auto-applied */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-900">
            <Brain className="w-4 h-4" />
            Knowledge auto-appliqué
            <Badge variant="secondary" className="ml-auto">3 sources</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            Le Knowledge de la plateforme sera automatiquement utilisé pour enrichir les articles.
          </p>
        </CardContent>
      </Card>

      {/* Cost Estimator */}
      <CostEstimator
        contentTypes={programData.contentTypes}
        countries={programData.countries}
        languages={programData.languages}
        quantityMode={programData.quantityMode}
        quantityValue={programData.quantityValue}
        generateImage={programData.generationOptions?.generateImage ?? true}
        imageModel={programData.generationOptions?.imageModel}
      />

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder brouillon
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRunNow}
            disabled={isSubmitting}
          >
            <Play className="w-4 h-4 mr-2" />
            Lancer maintenant
          </Button>
          <Button
            onClick={onActivate}
            disabled={isSubmitting}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Activer le programme
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
