import { useMemo } from 'react';
import { Info, AlertTriangle, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import type { QuantityMode } from '@/types/program';

export interface QuantityConfigStepProps {
  quantityMode: QuantityMode;
  quantityValue: number;
  onModeChange: (mode: QuantityMode) => void;
  onValueChange: (value: number) => void;
  selectedCountries: string[];
  selectedLanguages: string[];
  selectedThemes: string[];
  errors?: string[];
  className?: string;
}

const QUANTITY_MODES: Array<{
  id: QuantityMode;
  name: string;
  description: string;
  example: string;
}> = [
  {
    id: 'total',
    name: 'Total',
    description: 'Nombre total d\'articles à générer',
    example: '100 articles au total',
  },
  {
    id: 'perCountry',
    name: 'Par pays',
    description: 'Nombre d\'articles par pays sélectionné',
    example: '10 × 20 pays = 200 articles',
  },
  {
    id: 'perLanguage',
    name: 'Par langue',
    description: 'Nombre d\'articles par langue sélectionnée',
    example: '20 × 5 langues = 100 articles',
  },
  {
    id: 'perCountryLanguage',
    name: 'Par pays × langue',
    description: 'Nombre d\'articles par combinaison pays/langue',
    example: '5 × 20 pays × 3 langues = 300 articles',
  },
  {
    id: 'perTheme',
    name: 'Par thème',
    description: 'Nombre d\'articles par thème sélectionné',
    example: '10 × 15 thèmes = 150 articles',
  },
];

export function QuantityConfigStep({
  quantityMode,
  quantityValue,
  onModeChange,
  onValueChange,
  selectedCountries,
  selectedLanguages,
  selectedThemes,
  errors,
  className,
}: QuantityConfigStepProps) {
  // Calculate estimated total articles
  const estimation = useMemo(() => {
    let total = 0;
    let formula = '';

    switch (quantityMode) {
      case 'total':
        total = quantityValue;
        formula = `${quantityValue} articles`;
        break;
      case 'perCountry':
        total = quantityValue * selectedCountries.length;
        formula = `${quantityValue} × ${selectedCountries.length} pays`;
        break;
      case 'perLanguage':
        total = quantityValue * selectedLanguages.length;
        formula = `${quantityValue} × ${selectedLanguages.length} langues`;
        break;
      case 'perCountryLanguage':
        total = quantityValue * selectedCountries.length * selectedLanguages.length;
        formula = `${quantityValue} × ${selectedCountries.length} pays × ${selectedLanguages.length} langues`;
        break;
      case 'perTheme':
        total = quantityValue * selectedThemes.length;
        formula = `${quantityValue} × ${selectedThemes.length} thèmes`;
        break;
    }

    return { total, formula };
  }, [quantityMode, quantityValue, selectedCountries, selectedLanguages, selectedThemes]);

  // Estimated cost (rough calculation)
  const estimatedCost = useMemo(() => {
    const costPerArticle = 0.15; // Average cost
    return (estimation.total * costPerArticle).toFixed(2);
  }, [estimation.total]);

  // Estimated time (rough calculation)
  const estimatedTime = useMemo(() => {
    const minutesPerArticle = 1.5;
    const totalMinutes = estimation.total * minutesPerArticle;
    
    if (totalMinutes < 60) {
      return `~${Math.round(totalMinutes)} minutes`;
    } else if (totalMinutes < 1440) {
      return `~${Math.round(totalMinutes / 60)} heures`;
    } else {
      return `~${Math.round(totalMinutes / 1440)} jours`;
    }
  }, [estimation.total]);

  const hasError = errors && errors.length > 0;
  const isLargeVolume = estimation.total > 1000;
  const isVeryLargeVolume = estimation.total > 5000;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Configuration de la quantité
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez le volume de contenu à générer
        </p>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.join('. ')}</p>
        </div>
      )}

      {/* Quantity mode selection */}
      <div className="space-y-3">
        <Label>Mode de calcul</Label>
        <RadioGroup
          value={quantityMode}
          onValueChange={(value: string) => onModeChange(value as QuantityMode)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {QUANTITY_MODES.map((mode) => (
            <Label
              key={mode.id}
              htmlFor={mode.id}
              className={cn(
                'flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all',
                quantityMode === mode.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={mode.id} id={mode.id} className="mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{mode.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode.description}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Ex: {mode.example}
                  </p>
                </div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Quantity value input */}
      <div className="space-y-2">
        <Label htmlFor="quantity">
          Nombre d'articles
          {quantityMode !== 'total' && (
            <span className="text-muted-foreground font-normal">
              {' '}(par {
                quantityMode === 'perCountry' ? 'pays' :
                quantityMode === 'perLanguage' ? 'langue' :
                quantityMode === 'perCountryLanguage' ? 'combinaison' :
                'thème'
              })
            </span>
          )}
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="quantity"
            type="number"
            min={1}
            max={quantityMode === 'total' ? 10000 : 100}
            value={quantityValue}
            onChange={(e) => onValueChange(parseInt(e.target.value) || 1)}
            className="w-32"
          />
          <div className="flex-1 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {estimation.formula}
            </span>
          </div>
        </div>
      </div>

      {/* Estimation card */}
      <div className={cn(
        'rounded-lg p-4 border-2',
        isVeryLargeVolume ? 'bg-red-50 border-red-200' :
        isLargeVolume ? 'bg-yellow-50 border-yellow-200' :
        'bg-gray-50 border-gray-200'
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Estimation totale
            </p>
            <p className={cn(
              'text-3xl font-bold mt-1',
              isVeryLargeVolume ? 'text-red-600' :
              isLargeVolume ? 'text-yellow-600' :
              'text-gray-900'
            )}>
              {estimation.total.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">articles</p>
          </div>

          <div className="text-right space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Coût estimé</p>
              <p className="text-lg font-semibold text-gray-900">~${estimatedCost}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durée estimée</p>
              <p className="text-sm font-medium text-gray-700">{estimatedTime}</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {isVeryLargeVolume && (
          <div className="mt-4 flex items-start gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Volume très important</p>
              <p>Plus de 5000 articles peuvent prendre plusieurs jours et coûter cher. Considérez de réduire la portée ou de fractionner en plusieurs programmes.</p>
            </div>
          </div>
        )}

        {isLargeVolume && !isVeryLargeVolume && (
          <div className="mt-4 flex items-start gap-2 text-yellow-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Volume important</p>
              <p>Plus de 1000 articles. Assurez-vous que votre budget est suffisant.</p>
            </div>
          </div>
        )}
      </div>

      {/* Context info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {selectedCountries.length}
          </p>
          <p className="text-xs text-muted-foreground">pays sélectionnés</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {selectedLanguages.length}
          </p>
          <p className="text-xs text-muted-foreground">langues sélectionnées</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {selectedThemes.length}
          </p>
          <p className="text-xs text-muted-foreground">thèmes sélectionnés</p>
        </div>
      </div>

      {/* Help tooltip */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <p>
          Les estimations de coût et de temps sont approximatives et peuvent varier
          selon les types de contenu sélectionnés et les conditions actuelles.
        </p>
      </div>
    </div>
  );
}

export default QuantityConfigStep;
