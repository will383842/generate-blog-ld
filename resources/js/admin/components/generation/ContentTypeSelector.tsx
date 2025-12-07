/**
 * Content Type Selector
 * Cards for selecting content type with cost info
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CONTENT_TYPES, type ContentTypeId } from '@/utils/constants';

export interface ContentTypeSelectorProps {
  selected: ContentTypeId | null;
  onChange: (type: ContentTypeId) => void;
  disabled?: ContentTypeId[];
  className?: string;
}

export function ContentTypeSelector({
  selected,
  onChange,
  disabled = [],
  className,
}: ContentTypeSelectorProps) {
  const getEstimatedCost = (multiplier: number) => {
    return (0.15 * multiplier).toFixed(2);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">Sélectionnez le type de contenu</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez le format d'article à générer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CONTENT_TYPES.map((type) => {
          const isSelected = selected === type.id;
          const isDisabled = disabled.includes(type.id as ContentTypeId);
          const Icon = type.icon;

          return (
            <button
              key={type.id}
              onClick={() => !isDisabled && onChange(type.id as ContentTypeId)}
              disabled={isDisabled}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                !isSelected && !isDisabled && 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
                isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
                  isSelected ? 'bg-primary/10' : 'bg-gray-100'
                )}
                style={{
                  backgroundColor: isSelected ? `${type.color}20` : undefined,
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: isSelected ? type.color : '#6B7280' }}
                />
              </div>

              {/* Name */}
              <h4 className="font-semibold text-gray-900">{type.name}</h4>

              {/* Word count */}
              <p className="text-sm text-muted-foreground mt-1">
                {type.wordCountMin.toLocaleString()} - {type.wordCountMax.toLocaleString()} mots
              </p>

              {/* Cost badge */}
              <Badge
                variant="outline"
                className="mt-3"
                style={{
                  borderColor: type.color,
                  color: type.color,
                }}
              >
                ~${getEstimatedCost(type.costMultiplier)}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ContentTypeSelector;
