/**
 * Generation Wizard
 * 5-step wizard for content generation
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { ContentTypeSelector } from './ContentTypeSelector';
import { CountryMultiSelect } from './CountryMultiSelect';
import { LanguageMatrix } from './LanguageMatrix';
import { TemplateSelector } from './TemplateSelector';
import { GenerationPreview } from './GenerationPreview';
import { PLATFORMS } from '@/utils/constants';
import type { ContentTypeId, LanguageCode, PlatformId } from '@/types/program';

export interface GenerationWizardData {
  contentType: ContentTypeId | null;
  platformId: PlatformId | null;
  countries: string[];
  themeId: string | null;
  languages: LanguageCode[];
  templateId: string | null;
  options: {
    model: string;
    tone: string;
    generateImage: boolean;
    autoPublish: boolean;
  };
}

export interface GenerationWizardProps {
  initialData?: Partial<GenerationWizardData>;
  onSubmit: (data: GenerationWizardData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

const STEPS = [
  { id: 'content-type', label: 'Type de contenu', description: 'Choisissez le type' },
  { id: 'context', label: 'Contexte', description: 'Plateforme et pays' },
  { id: 'languages', label: 'Langues', description: 'Langues cibles' },
  { id: 'options', label: 'Options', description: 'Template et style' },
  { id: 'review', label: 'Récapitulatif', description: 'Vérifier et lancer' },
];

const DEFAULT_DATA: GenerationWizardData = {
  contentType: null,
  platformId: null,
  countries: [],
  themeId: null,
  languages: [],
  templateId: null,
  options: {
    model: 'gpt-4-turbo',
    tone: 'professional',
    generateImage: true,
    autoPublish: false,
  },
};

export function GenerationWizard({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  className,
}: GenerationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<GenerationWizardData>({
    ...DEFAULT_DATA,
    ...initialData,
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateData = <K extends keyof GenerationWizardData>(
    key: K,
    value: GenerationWizardData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: return !!data.contentType;
      case 1: return !!data.platformId && data.countries.length > 0;
      case 2: return data.languages.length > 0;
      case 3: return true; // Options are optional
      case 4: return true; // Review step
      default: return false;
    }
  }, [currentStep, data]);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {STEPS[currentStep].label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep].description}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Étape {currentStep + 1} sur {STEPS.length}
          </div>
        </div>

        {/* Breadcrumb Steps */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                  index < currentStep && 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200',
                  index === currentStep && 'bg-primary text-white',
                  index > currentStep && 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                )}
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1',
                  index < currentStep ? 'bg-green-300' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        <ProgressBar value={progress} className="mt-4" size="sm" />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Step 1: Content Type */}
        {currentStep === 0 && (
          <ContentTypeSelector
            selected={data.contentType}
            onChange={(type) => updateData('contentType', type)}
          />
        )}

        {/* Step 2: Context */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Platform */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Plateforme *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => updateData('platformId', platform.id as PlatformId)}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      data.platformId === platform.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: platform.color }}
                    />
                    <p className="font-medium">{platform.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Pays *
              </label>
              <CountryMultiSelect
                selected={data.countries}
                onChange={(countries) => updateData('countries', countries)}
                maxSelection={50}
              />
            </div>
          </div>
        )}

        {/* Step 3: Languages */}
        {currentStep === 2 && (
          <LanguageMatrix
            selected={data.languages}
            onChange={(languages) => updateData('languages', languages)}
            countries={data.countries}
          />
        )}

        {/* Step 4: Options */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Template */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Template
              </label>
              <TemplateSelector
                contentType={data.contentType!}
                selected={data.templateId}
                onChange={(templateId) => updateData('templateId', templateId)}
              />
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ton
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['professional', 'friendly', 'formal', 'casual'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => updateData('options', { ...data.options, tone })}
                    className={cn(
                      'px-4 py-2 rounded-lg border-2 capitalize',
                      data.options.tone === tone
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.options.generateImage}
                  onChange={(e) => updateData('options', {
                    ...data.options,
                    generateImage: e.target.checked,
                  })}
                  className="w-4 h-4 rounded"
                />
                <span>Générer une image</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.options.autoPublish}
                  onChange={(e) => updateData('options', {
                    ...data.options,
                    autoPublish: e.target.checked,
                  })}
                  className="w-4 h-4 rounded"
                />
                <span>Publication automatique</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 4 && (
          <GenerationPreview
            data={data}
            onEdit={(step) => setCurrentStep(step)}
          />
        )}
      </div>

      {/* Footer Navigation */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={goPrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={goNext} disabled={!canGoNext}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Génération...' : 'Lancer la génération'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerationWizard;
