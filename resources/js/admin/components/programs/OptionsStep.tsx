import { Info, ImageIcon, Wand2, CheckSquare, BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Textarea } from '@/components/ui/Textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import type { GenerationOptions } from '@/types/program';

export interface OptionsStepProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
  errors?: string[];
  className?: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professionnel', description: 'Ton formel et expert' },
  { value: 'friendly', label: 'Amical', description: 'Ton chaleureux et accessible' },
  { value: 'formal', label: 'Formel', description: 'Ton très soutenu' },
  { value: 'casual', label: 'Décontracté', description: 'Ton conversationnel' },
  { value: 'expert', label: 'Expert', description: 'Ton technique et détaillé' },
];

const MODEL_OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4', description: 'Meilleure qualité, plus lent', cost: '$$$$' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Rapide et qualité', cost: '$$$' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Économique', cost: '$' },
];

const IMAGE_MODE_OPTIONS = [
  { value: 'unsplash', label: 'Unsplash d\'abord', description: 'Images stock gratuites' },
  { value: 'dalle', label: 'DALL-E d\'abord', description: 'Images générées par IA' },
  { value: 'none', label: 'Pas d\'images', description: 'Texte uniquement' },
];

const SEO_OPTIONS = [
  { value: 'basic', label: 'Basique', description: 'Meta title et description' },
  { value: 'advanced', label: 'Avancé', description: '+ Structured data, headings' },
  { value: 'maximum', label: 'Maximum', description: '+ FAQ, internal links, schema' },
];

export function OptionsStep({
  options,
  onChange,
  errors,
  className,
}: OptionsStepProps) {
  const updateOption = <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  const hasError = errors && errors.length > 0;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Options de génération
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez le comportement de la génération de contenu
        </p>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.join('. ')}</p>
        </div>
      )}

      {/* Model & Quality Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Modèle & Qualité
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Modèle IA</Label>
            <Select
              id="model"
              value={options.model}
              onChange={(e) => updateOption('model', e.target.value as GenerationOptions['model'])}
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.cost})
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              {MODEL_OPTIONS.find((m) => m.value === options.model)?.description}
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Créativité</Label>
              <span className="text-sm text-muted-foreground">
                {(options.temperature ?? 0.7).toFixed(1)}
              </span>
            </div>
            <Slider
              value={[options.temperature ?? 0.7]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={([value]) => updateOption('temperature', value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Factuel</span>
              <span>Créatif</span>
            </div>
          </div>
        </div>

        {/* Word count */}
        <div className="space-y-2">
          <Label>Nombre de mots</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Min"
                value={options.wordCount?.min || 800}
                onChange={(e) => updateOption('wordCount', {
                  ...options.wordCount,
                  min: parseInt(e.target.value) || 800,
                  max: options.wordCount?.max || 1500,
                })}
              />
            </div>
            <span className="text-muted-foreground">à</span>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Max"
                value={options.wordCount?.max || 1500}
                onChange={(e) => updateOption('wordCount', {
                  ...options.wordCount,
                  min: options.wordCount?.min || 800,
                  max: parseInt(e.target.value) || 1500,
                })}
              />
            </div>
            <span className="text-sm text-muted-foreground">mots</span>
          </div>
        </div>
      </div>

      {/* Tone Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Ton & Style
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() => updateOption('tone', tone.value as GenerationOptions['tone'])}
              className={cn(
                'p-3 rounded-lg border-2 text-center transition-all',
                options.tone === tone.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <p className="font-medium text-sm">{tone.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{tone.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Images
        </h4>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label>Générer des images</Label>
            <p className="text-xs text-muted-foreground">
              Ajouter une image principale à chaque article
            </p>
          </div>
          <Switch
            checked={options.generateImage ?? true}
            onCheckedChange={(checked) => updateOption('generateImage', checked)}
          />
        </div>

        {options.generateImage && (
          <div className="grid grid-cols-3 gap-2">
            {IMAGE_MODE_OPTIONS.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => updateOption('imageModel', mode.value as 'unsplash' | 'dalle' | 'none')}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all',
                  (options.imageModel || 'unsplash') === mode.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className="font-medium text-sm">{mode.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SEO Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          SEO & Optimisation
        </h4>

        <div className="space-y-2">
          <Label>Niveau d'optimisation SEO</Label>
          <div className="grid grid-cols-3 gap-2">
            {SEO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateOption('seoOptimization', opt.value as GenerationOptions['seoOptimization'])}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all',
                  options.seoOptimization === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm">Liens internes</Label>
              <p className="text-xs text-muted-foreground">Auto-linking</p>
            </div>
            <Switch
              checked={options.includeInternalLinks ?? true}
              onCheckedChange={(checked) => updateOption('includeInternalLinks', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm">Liens externes</Label>
              <p className="text-xs text-muted-foreground">Sources citées</p>
            </div>
            <Switch
              checked={options.includeExternalLinks ?? false}
              onCheckedChange={(checked) => updateOption('includeExternalLinks', checked)}
            />
          </div>
        </div>
      </div>

      {/* Publishing Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Publication
        </h4>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label>Auto-publication</Label>
            <p className="text-xs text-muted-foreground">
              Publier automatiquement après génération
            </p>
          </div>
          <Switch
            checked={options.autoPublish ?? false}
            onCheckedChange={(checked) => updateOption('autoPublish', checked)}
          />
        </div>

        {options.autoPublish && (
          <div className="space-y-2">
            <Label htmlFor="publishDelay">Délai avant publication (secondes)</Label>
            <Input
              id="publishDelay"
              type="number"
              min={0}
              max={3600}
              value={options.publishDelay || 0}
              onChange={(e) => updateOption('publishDelay', parseInt(e.target.value) || 0)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              0 = publication immédiate
            </p>
          </div>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="customInstructions">Instructions personnalisées</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px]">
                Instructions additionnelles pour guider la génération de contenu
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          id="customInstructions"
          placeholder="Ex: Toujours inclure une section FAQ, mentionner les aspects légaux..."
          value={options.customInstructions || ''}
          onChange={(e) => updateOption('customInstructions', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

export default OptionsStep;
