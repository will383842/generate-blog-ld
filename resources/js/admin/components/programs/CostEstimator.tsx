import { useMemo } from 'react';
import { DollarSign, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { CONTENT_TYPES } from '@/utils/constants';
import type { QuantityMode, ContentTypeId } from '@/types/program';

export interface CostEstimatorProps {
  contentTypes: ContentTypeId[];
  countries: string[];
  languages: string[];
  themes?: string[];
  quantityMode: QuantityMode;
  quantityValue: number;
  generateImage?: boolean;
  imageModel?: 'dall-e-3' | 'dall-e-2' | 'stable-diffusion' | 'unsplash';
  dailyBudget?: number;
  monthlyBudget?: number;
  className?: string;
}

// Cost constants (approximate values in USD)
const COSTS = {
  // Per 1000 tokens (approximate article)
  models: {
    'gpt-4': 0.12,
    'gpt-4-turbo': 0.06,
    'gpt-3.5-turbo': 0.004,
  },
  // Per image
  images: {
    'dall-e-3': 0.04,
    'dall-e-2': 0.02,
    'stable-diffusion': 0.01,
    'unsplash': 0,
  },
  // Base cost per article type (includes all processing)
  basePerArticle: 0.08,
};

export function CostEstimator({
  contentTypes,
  countries,
  languages,
  themes = [],
  quantityMode,
  quantityValue,
  generateImage = true,
  imageModel = 'unsplash',
  dailyBudget = 50,
  monthlyBudget = 500,
  className,
}: CostEstimatorProps) {
  // Calculate total articles
  const totalArticles = useMemo(() => {
    switch (quantityMode) {
      case 'total': return quantityValue;
      case 'perCountry': return quantityValue * countries.length;
      case 'perLanguage': return quantityValue * languages.length;
      case 'perCountryLanguage': return quantityValue * countries.length * languages.length;
      case 'perTheme': return quantityValue * themes.length;
      default: return quantityValue;
    }
  }, [quantityMode, quantityValue, countries, languages, themes]);

  // Calculate cost breakdown
  const costBreakdown = useMemo(() => {
    const selectedTypes = CONTENT_TYPES.filter((t) =>
      contentTypes.includes(t.id as ContentTypeId)
    );
    
    if (selectedTypes.length === 0) {
      return {
        gpt4: 0,
        gpt35: 0,
        dalle: 0,
        other: 0,
        total: 0,
        perArticle: 0,
      };
    }

    // Calculate average cost multiplier from selected types
    const avgMultiplier = selectedTypes.reduce((sum, t) => sum + t.costMultiplier, 0) / selectedTypes.length;
    
    // Estimate GPT-4 usage (70% of content)
    const gpt4Cost = totalArticles * COSTS.models['gpt-4'] * avgMultiplier * 0.7;
    
    // Estimate GPT-3.5 usage (30% for simpler tasks)
    const gpt35Cost = totalArticles * COSTS.models['gpt-3.5-turbo'] * avgMultiplier * 0.3;
    
    // Image costs
    const imageCost = generateImage
      ? totalArticles * (COSTS.images[imageModel] || 0)
      : 0;
    
    // Other costs (API calls, processing, etc.)
    const otherCost = totalArticles * COSTS.basePerArticle;
    
    const total = gpt4Cost + gpt35Cost + imageCost + otherCost;
    
    return {
      gpt4: gpt4Cost,
      gpt35: gpt35Cost,
      dalle: imageCost,
      other: otherCost,
      total,
      perArticle: totalArticles > 0 ? total / totalArticles : 0,
    };
  }, [contentTypes, totalArticles, generateImage, imageModel]);

  // Estimate duration
  const estimatedDuration = useMemo(() => {
    const minutesPerArticle = 1.5; // Average generation time
    const totalMinutes = totalArticles * minutesPerArticle;
    
    if (totalMinutes < 60) {
      return { value: Math.round(totalMinutes), unit: 'minutes' };
    } else if (totalMinutes < 1440) {
      return { value: Math.round(totalMinutes / 60 * 10) / 10, unit: 'heures' };
    } else {
      return { value: Math.round(totalMinutes / 1440 * 10) / 10, unit: 'jours' };
    }
  }, [totalArticles]);

  // Budget warnings
  const budgetWarnings = useMemo(() => {
    const warnings: Array<{ type: 'warning' | 'error'; message: string }> = [];
    
    if (costBreakdown.total > dailyBudget) {
      warnings.push({
        type: costBreakdown.total > dailyBudget * 2 ? 'error' : 'warning',
        message: `Dépasse le budget journalier ($${dailyBudget})`,
      });
    }
    
    if (costBreakdown.total > monthlyBudget * 0.5) {
      warnings.push({
        type: costBreakdown.total > monthlyBudget ? 'error' : 'warning',
        message: `${Math.round(costBreakdown.total / monthlyBudget * 100)}% du budget mensuel`,
      });
    }
    
    return warnings;
  }, [costBreakdown.total, dailyBudget, monthlyBudget]);

  const hasWarnings = budgetWarnings.length > 0;
  const hasErrors = budgetWarnings.some((w) => w.type === 'error');

  return (
    <div className={cn(
      'rounded-lg border-2 p-4',
      hasErrors ? 'bg-red-50 border-red-200' :
      hasWarnings ? 'bg-yellow-50 border-yellow-200' :
      'bg-gray-50 border-gray-200',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Estimation des coûts
        </h4>
        <Badge variant="outline" className="gap-1">
          <Zap className="w-3 h-3" />
          Temps réel
        </Badge>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {totalArticles.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">articles</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-primary">
            ${costBreakdown.total.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">coût total</p>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            ~{estimatedDuration.value}
          </p>
          <p className="text-xs text-muted-foreground">{estimatedDuration.unit}</p>
        </div>
      </div>

      {/* Cost per article */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">Coût moyen par article</span>
        <span className="font-medium">${costBreakdown.perArticle.toFixed(4)}</span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-gray-700">Répartition des coûts</p>
        
        {/* GPT-4 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">GPT-4</span>
            <span>${costBreakdown.gpt4.toFixed(2)}</span>
          </div>
          <ProgressBar
            value={(costBreakdown.gpt4 / costBreakdown.total) * 100 || 0}
            size="sm"
            className="bg-purple-100"
          />
        </div>

        {/* GPT-3.5 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">GPT-3.5</span>
            <span>${costBreakdown.gpt35.toFixed(2)}</span>
          </div>
          <ProgressBar
            value={(costBreakdown.gpt35 / costBreakdown.total) * 100 || 0}
            size="sm"
            className="bg-blue-100"
          />
        </div>

        {/* Images */}
        {generateImage && imageModel !== 'unsplash' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Images ({imageModel})</span>
              <span>${costBreakdown.dalle.toFixed(2)}</span>
            </div>
            <ProgressBar
              value={(costBreakdown.dalle / costBreakdown.total) * 100 || 0}
              size="sm"
              className="bg-green-100"
            />
          </div>
        )}

        {/* Other */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Autres (API, processing)</span>
            <span>${costBreakdown.other.toFixed(2)}</span>
          </div>
          <ProgressBar
            value={(costBreakdown.other / costBreakdown.total) * 100 || 0}
            size="sm"
            className="bg-gray-200"
          />
        </div>
      </div>

      {/* Budget comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2 bg-white rounded text-center">
          <p className="text-xs text-muted-foreground">Budget jour</p>
          <p className={cn(
            'text-sm font-medium',
            costBreakdown.total > dailyBudget ? 'text-red-600' : 'text-green-600'
          )}>
            {Math.round((costBreakdown.total / dailyBudget) * 100)}%
          </p>
        </div>
        <div className="p-2 bg-white rounded text-center">
          <p className="text-xs text-muted-foreground">Budget mois</p>
          <p className={cn(
            'text-sm font-medium',
            costBreakdown.total > monthlyBudget * 0.5 ? 'text-yellow-600' : 'text-green-600'
          )}>
            {Math.round((costBreakdown.total / monthlyBudget) * 100)}%
          </p>
        </div>
      </div>

      {/* Warnings */}
      {budgetWarnings.length > 0 && (
        <div className="space-y-2">
          {budgetWarnings.map((warning, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 p-2 rounded text-xs',
                warning.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              )}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground mt-4">
        * Les estimations sont basées sur des moyennes et peuvent varier selon le contenu réel généré.
      </p>
    </div>
  );
}

export default CostEstimator;
