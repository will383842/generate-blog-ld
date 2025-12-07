/**
 * Model Comparison Component
 * File 301 - Compare AI models features, costs, and performance
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  Check,
  X,
  Zap,
  DollarSign,
  Star,
  ArrowUpDown,
  Info,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useModelInfo, ModelInfo } from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

interface ModelComparisonProps {
  selectedModels?: string[];
  onSelectModel?: (modelId: string) => void;
  compact?: boolean;
}

export function ModelComparison({
  selectedModels = [],
  onSelectModel,
  compact = false,
}: ModelComparisonProps) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'cost' | 'speed' | 'quality'>('quality');
  const [sortAsc, setSortAsc] = useState(false);

  const { data: models, isLoading } = useModelInfo();

  // Sort models
  const sortedModels = [...(models || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'cost':
        comparison = (a.input_cost_per_1k + a.output_cost_per_1k) - (b.input_cost_per_1k + b.output_cost_per_1k);
        break;
      case 'speed':
        const speedOrder = { fast: 1, medium: 2, slow: 3 };
        comparison = speedOrder[a.speed] - speedOrder[b.speed];
        break;
      case 'quality':
        const qualityOrder = { premium: 1, high: 2, standard: 3 };
        comparison = qualityOrder[a.quality] - qualityOrder[b.quality];
        break;
    }
    return sortAsc ? comparison : -comparison;
  });

  // Toggle sort
  const toggleSort = (column: 'cost' | 'speed' | 'quality') => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };

  // Get speed badge
  const getSpeedBadge = (speed: ModelInfo['speed']) => {
    const config = {
      fast: { color: 'bg-green-100 text-green-800', icon: Zap },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Zap },
      slow: { color: 'bg-red-100 text-red-800', icon: Zap },
    };
    const { color, icon: Icon } = config[speed];
    return (
      <Badge className={cn(color, 'gap-1')}>
        <Icon className="h-3 w-3" />
        {speed === 'fast' ? 'Rapide' : speed === 'medium' ? 'Moyen' : 'Lent'}
      </Badge>
    );
  };

  // Get quality badge
  const getQualityBadge = (quality: ModelInfo['quality']) => {
    const config = {
      premium: { color: 'bg-purple-100 text-purple-800', label: 'Premium', stars: 3 },
      high: { color: 'bg-blue-100 text-blue-800', label: 'Haute', stars: 2 },
      standard: { color: 'bg-gray-100 text-gray-800', label: 'Standard', stars: 1 },
    };
    const { color, label, stars } = config[quality];
    return (
      <Badge className={cn(color, 'gap-1')}>
        {[...Array(stars)].map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
        {label}
      </Badge>
    );
  };

  // Get provider color
  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'text-green-600',
      anthropic: 'text-orange-600',
      google: 'text-blue-600',
      perplexity: 'text-purple-600',
    };
    return colors[provider.toLowerCase()] || 'text-gray-600';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {sortedModels.slice(0, 4).map(model => (
          <div
            key={model.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{model.name}</span>
                <span className={cn('text-xs', getProviderColor(model.provider))}>
                  {model.provider}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getQualityBadge(model.quality)}
                {getSpeedBadge(model.speed)}
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${(model.input_cost_per_1k + model.output_cost_per_1k).toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">par 1k tokens</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Comparaison des modèles
        </CardTitle>
        <CardDescription>
          Comparez les caractéristiques, coûts et performances des modèles IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {onSelectModel && <TableHead className="w-12"></TableHead>}
                <TableHead>Modèle</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Contexte</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('cost')}
                    className="flex items-center gap-1 -ml-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Coût
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('speed')}
                    className="flex items-center gap-1 -ml-2"
                  >
                    <Zap className="h-4 w-4" />
                    Vitesse
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('quality')}
                    className="flex items-center gap-1 -ml-2"
                  >
                    <Star className="h-4 w-4" />
                    Qualité
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Fonctionnalités</TableHead>
                <TableHead>Recommandé pour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModels.map(model => {
                const isSelected = selectedModels.includes(model.id);
                return (
                  <TableRow
                    key={model.id}
                    className={cn(isSelected && 'bg-primary/5')}
                  >
                    {onSelectModel && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onSelectModel(model.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.id}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-medium', getProviderColor(model.provider))}>
                        {model.provider}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span>{(model.context_length / 1000).toFixed(0)}k</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {model.context_length.toLocaleString()} tokens
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">In:</span>
                          <span>${model.input_cost_per_1k.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Out:</span>
                          <span>${model.output_cost_per_1k.toFixed(4)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getSpeedBadge(model.speed)}</TableCell>
                    <TableCell>{getQualityBadge(model.quality)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.features.slice(0, 3).map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {model.features.length > 3 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  +{model.features.length - 3}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {model.features.slice(3).join(', ')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.recommended_for.slice(0, 2).map(rec => (
                          <Badge key={rec} className="bg-green-100 text-green-800 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>Coûts en USD par 1000 tokens</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Vitesse:</span>
            {getSpeedBadge('fast')}
            {getSpeedBadge('medium')}
            {getSpeedBadge('slow')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModelComparison;
