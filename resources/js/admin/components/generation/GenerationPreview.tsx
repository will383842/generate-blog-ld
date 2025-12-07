/**
 * Generation Preview
 * Preview before generation with cost estimation
 */

import { useMemo } from 'react';
import {
  FileText,
  Globe,
  Clock,
  DollarSign,
  Edit,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PLATFORMS, CONTENT_TYPES, LANGUAGES } from '@/utils/constants';
import type { GenerationWizardData } from './GenerationWizard';

export interface GenerationPreviewProps {
  data: GenerationWizardData;
  onEdit?: (step: number) => void;
  className?: string;
}

export function GenerationPreview({
  data,
  onEdit,
  className,
}: GenerationPreviewProps) {
  const platform = PLATFORMS.find((p) => p.id === data.platformId);
  const contentType = CONTENT_TYPES.find((t) => t.id === data.contentType);
  const selectedLanguages = LANGUAGES.filter((l) =>
    data.languages.includes(l.code)
  );

  // Calculate estimates
  const estimates = useMemo(() => {
    const articleCount = data.countries.length * data.languages.length;
    const costPerArticle = (contentType?.costMultiplier || 1) * 0.15;
    const imageCost = data.options.generateImage ? 0.02 : 0;
    const totalCost = articleCount * (costPerArticle + imageCost);
    const durationMinutes = articleCount * 1.5;

    return {
      articleCount,
      costPerArticle: costPerArticle + imageCost,
      totalCost,
      durationMinutes,
    };
  }, [data, contentType]);

  const warnings: string[] = [];
  if (estimates.articleCount > 100) {
    warnings.push(`Volume important: ${estimates.articleCount} articles`);
  }
  if (estimates.totalCost > 50) {
    warnings.push(`Coût élevé: $${estimates.totalCost.toFixed(2)}`);
  }
  if (data.options.autoPublish) {
    warnings.push('Les articles seront publiés automatiquement');
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold">Récapitulatif de la génération</h3>
        <p className="text-sm text-muted-foreground">
          Vérifiez les paramètres avant de lancer
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Points d'attention</p>
              <ul className="mt-1 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-yellow-700">• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{estimates.articleCount}</p>
            <p className="text-xs text-muted-foreground">articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">${estimates.totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">coût estimé</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">
              {estimates.durationMinutes < 60
                ? `${Math.round(estimates.durationMinutes)}m`
                : `${Math.round(estimates.durationMinutes / 60)}h`}
            </p>
            <p className="text-xs text-muted-foreground">durée estimée</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{data.countries.length}</p>
            <p className="text-xs text-muted-foreground">pays</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Content Type */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Type de contenu</CardTitle>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(0)}>
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {contentType && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${contentType.color}20` }}
                >
                  <contentType.icon className="w-5 h-5" style={{ color: contentType.color }} />
                </div>
                <div>
                  <p className="font-medium">{contentType.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contentType.wordCountMin}-{contentType.wordCountMax} mots
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Plateforme</CardTitle>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {platform && (
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="font-medium">{platform.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Pays ({data.countries.length})
            </CardTitle>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {data.countries.slice(0, 8).map((code) => (
                <Badge key={code} variant="outline">
                  {code}
                </Badge>
              ))}
              {data.countries.length > 8 && (
                <Badge variant="secondary">+{data.countries.length - 8}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Langues ({data.languages.length})
            </CardTitle>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
                <Edit className="w-3 h-3" />
              </Button>
            )}
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
      </div>

      {/* Options */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Options</CardTitle>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
              <Edit className="w-3 h-3" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Modèle</p>
              <p className="font-medium">{data.options.model}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ton</p>
              <p className="font-medium capitalize">{data.options.tone}</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className={cn(
                'w-4 h-4',
                data.options.generateImage ? 'text-green-500' : 'text-gray-300'
              )} />
              <span className="text-sm">Images</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className={cn(
                'w-4 h-4',
                data.options.autoPublish ? 'text-green-500' : 'text-gray-300'
              )} />
              <span className="text-sm">Auto-publication</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coût par article</p>
              <p className="font-medium">${estimates.costPerArticle.toFixed(3)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Coût total estimé</p>
              <p className="text-2xl font-bold text-primary">
                ${estimates.totalCost.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GenerationPreview;
