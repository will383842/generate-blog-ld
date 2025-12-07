import { Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { CONTENT_TYPES, type ContentTypeId } from '@/utils/constants';

export interface ContentTypeStepProps {
  selectedTypes: ContentTypeId[];
  onChange: (types: ContentTypeId[]) => void;
  platformId?: string;
  errors?: string[];
  className?: string;
}

export function ContentTypeStep({
  selectedTypes,
  onChange,
  errors,
  className,
}: ContentTypeStepProps) {
  const toggleType = (typeId: ContentTypeId) => {
    if (selectedTypes.includes(typeId)) {
      onChange(selectedTypes.filter((t) => t !== typeId));
    } else {
      onChange([...selectedTypes, typeId]);
    }
  };

  const selectAll = () => {
    onChange(CONTENT_TYPES.map((t) => t.id as ContentTypeId));
  };

  const selectNone = () => {
    onChange([]);
  };

  // Calculate estimated cost per type
  const getEstimatedCost = (costMultiplier: number) => {
    const baseCost = 0.15; // Base cost per article in $
    return (baseCost * costMultiplier).toFixed(2);
  };

  const hasError = errors && errors.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Types de contenu
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez au moins un type de contenu à générer
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-primary hover:underline"
          >
            Tout sélectionner
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            onClick={selectNone}
            className="text-sm text-muted-foreground hover:text-gray-900"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            {errors.join('. ')}
          </p>
        </div>
      )}

      {/* Content types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type.id as ContentTypeId);
          const Icon = type.icon;

          return (
            <div
              key={type.id}
              className={cn(
                'relative rounded-lg border-2 p-4 cursor-pointer transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300',
                hasError && selectedTypes.length === 0 && 'border-red-200'
              )}
              onClick={() => toggleType(type.id as ContentTypeId)}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Icon and name */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary/10' : 'bg-gray-100'
                  )}
                  style={{
                    backgroundColor: isSelected ? `${type.color}20` : undefined,
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isSelected ? type.color : '#6B7280' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p className="font-medium mb-1">{type.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.wordCountMin.toLocaleString()} - {type.wordCountMax.toLocaleString()} mots
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Coût: ~${getEstimatedCost(type.costMultiplier)} / article
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Word count range */}
                  <p className="text-sm text-muted-foreground mt-1">
                    {type.wordCountMin.toLocaleString()} - {type.wordCountMax.toLocaleString()} mots
                  </p>

                  {/* Cost badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: type.color,
                        color: type.color,
                      }}
                    >
                      ~${getEstimatedCost(type.costMultiplier)}
                    </Badge>
                    {type.costMultiplier > 1.5 && (
                      <Badge variant="secondary" className="text-xs">
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden checkbox for accessibility */}
              <Checkbox
                checked={isSelected}
                onChange={() => toggleType(type.id as ContentTypeId)}
                className="sr-only"
              />
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} sélectionné{selectedTypes.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Coût moyen estimé : ~$
              {selectedTypes.length > 0
                ? (
                    selectedTypes.reduce((sum, typeId) => {
                      const type = CONTENT_TYPES.find((t) => t.id === typeId);
                      return sum + (type?.costMultiplier || 1) * 0.15;
                    }, 0) / selectedTypes.length
                  ).toFixed(2)
                : '0.00'
              } par article
            </p>
          </div>

          {/* Selected types badges */}
          <div className="flex flex-wrap gap-1 max-w-[50%] justify-end">
            {selectedTypes.map((typeId) => {
              const type = CONTENT_TYPES.find((t) => t.id === typeId);
              if (!type) return null;
              return (
                <Badge
                  key={typeId}
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${type.color}20`, color: type.color }}
                >
                  {type.name}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentTypeStep;
