import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { StepIndicator, PROGRAM_WIZARD_STEPS } from '@/components/programs/StepIndicator';
import { ContentTypeStep } from '@/components/programs/ContentTypeStep';
import { CountrySelectionStep } from '@/components/programs/CountrySelectionStep';
import { LanguageConfigStep } from '@/components/programs/LanguageConfigStep';
import { ThemeSelectionStep } from '@/components/programs/ThemeSelectionStep';
import { QuantityConfigStep } from '@/components/programs/QuantityConfigStep';
import { SchedulingStep } from '@/components/programs/SchedulingStep';
import { OptionsStep } from '@/components/programs/OptionsStep';
import { ReviewStep } from '@/components/programs/ReviewStep';
import { PresetSelector } from '@/components/programs/PresetSelector';
import { useCreateProgram } from '@/hooks/usePrograms';
import { usePreset } from '@/hooks/usePresets';
import { PLATFORMS } from '@/utils/constants';
import type {
  CreateProgramInput,
  GenerationOptions,
  PlatformId,
} from '@/types/program';

const STORAGE_KEY = 'program-builder-draft';

const DEFAULT_FORM_DATA: CreateProgramInput = {
  name: '',
  description: '',
  platformId: 'sos-expat',
  contentTypes: [],
  countries: [],
  languages: [],
  themes: [],
  quantityMode: 'total',
  quantityValue: 10,
  recurrenceType: 'once',
  recurrenceConfig: { type: 'once', scheduledAt: new Date().toISOString() },
  generationOptions: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    wordCount: { min: 800, max: 1500 },
    generateImage: true,
    imageModel: 'unsplash',
    seoOptimization: 'advanced',
    includeInternalLinks: true,
    includeExternalLinks: false,
    autoPublish: false,
    tone: 'professional',
  },
};

// Step validation
type ValidationErrors = Record<string, string[]>;

function validateStep(step: number, data: CreateProgramInput): ValidationErrors {
  const errors: ValidationErrors = {};

  switch (step) {
    case 0: // Info
      if (!data.name.trim()) {
        errors.name = ['Le nom du programme est requis'];
      }
      if (!data.platformId) {
        errors.platformId = ['Veuillez sélectionner une plateforme'];
      }
      break;
    case 1: // Content Types
      if (data.contentTypes.length === 0) {
        errors.contentTypes = ['Sélectionnez au moins un type de contenu'];
      }
      break;
    case 2: // Countries
      if (data.countries.length === 0) {
        errors.countries = ['Sélectionnez au moins un pays'];
      }
      break;
    case 3: // Languages
      if (data.languages.length === 0) {
        errors.languages = ['Sélectionnez au moins une langue'];
      }
      break;
    case 4: // Themes
      if (data.themes.length === 0) {
        errors.themes = ['Sélectionnez au moins un thème'];
      }
      break;
    case 5: // Quantity
      if (data.quantityValue < 1) {
        errors.quantity = ['La quantité doit être au moins 1'];
      }
      break;
    case 6: // Scheduling
      // Basic validation, more complex validation in backend
      break;
    case 7: // Options
      // Options are optional
      break;
    case 8: // Review
      // Final validation done in previous steps
      break;
  }

  return errors;
}

export function ProgramBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('preset');

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<CreateProgramInput>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const { mutate: createProgram, isPending: isCreating } = useCreateProgram();
  const { data: presetData } = usePreset(presetId || '');

  const generationOptions: GenerationOptions = {
    model: formData.generationOptions?.model ?? 'gpt-4',
    temperature: formData.generationOptions?.temperature,
    wordCount: formData.generationOptions?.wordCount,
    generateImage: formData.generationOptions?.generateImage,
    imageModel: formData.generationOptions?.imageModel,
    seoOptimization: formData.generationOptions?.seoOptimization,
    includeInternalLinks: formData.generationOptions?.includeInternalLinks,
    includeExternalLinks: formData.generationOptions?.includeExternalLinks,
    autoPublish: formData.generationOptions?.autoPublish,
    publishDelay: formData.generationOptions?.publishDelay,
    customInstructions: formData.generationOptions?.customInstructions,
    tone: formData.generationOptions?.tone,
  };

  // Check for saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setShowRestoreDialog(true);
    }
  }, []);

  // Apply preset if provided
  useEffect(() => {
    if (presetData?.data?.config) {
      setFormData((prev) => ({
        ...prev,
        ...presetData.data.config,
      }));
    }
  }, [presetData]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name || formData.contentTypes.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const restoreDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        // Find last completed step
        for (let i = 0; i < 8; i++) {
          const stepErrors = validateStep(i, parsed);
          if (Object.keys(stepErrors).length === 0) {
            setCompletedSteps((prev) => [...prev, i]);
          } else {
            break;
          }
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
    setShowRestoreDialog(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowRestoreDialog(false);
  };

  const updateFormData = useCallback(<K extends keyof CreateProgramInput>(
    key: K,
    value: CreateProgramInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear errors for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const goToStep = (step: number) => {
    if (step < currentStep || completedSteps.includes(step) || step === currentStep + 1) {
      // Validate current step before moving forward
      if (step > currentStep) {
        const stepErrors = validateStep(currentStep, formData);
        if (Object.keys(stepErrors).length > 0) {
          setErrors(stepErrors);
          return;
        }
        setCompletedSteps((prev) =>
          prev.includes(currentStep) ? prev : [...prev, currentStep]
        );
      }
      setCurrentStep(step);
      setErrors({});
    }
  };

  const goNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );
    setCurrentStep((prev) => Math.min(prev + 1, PROGRAM_WIZARD_STEPS.length - 1));
    setErrors({});
  };

  const goPrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  };

  const handleSaveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    // Could also save to backend as draft
    navigate('/programs');
  };

  const handleActivate = () => {
    createProgram(
      { ...formData },
      {
        onSuccess: () => {
          localStorage.removeItem(STORAGE_KEY);
          navigate('/programs');
        },
      }
    );
  };

  const handleRunNow = () => {
    createProgram(
      { ...formData },
      {
        onSuccess: (data) => {
          localStorage.removeItem(STORAGE_KEY);
          // Trigger immediate run (would need additional API call)
          navigate(`/programs/${data.data?.id}`);
        },
      }
    );
  };

  const handleExit = () => {
    if (formData.name || formData.contentTypes.length > 0) {
      setShowExitDialog(true);
    } else {
      navigate('/programs');
    }
  };

  const handleApplyPreset = (presetConfig: Partial<typeof formData>) => {
    setFormData((prev) => ({
      ...prev,
      ...presetConfig,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleExit}>
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {formData.name || 'Nouveau programme'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Étape {currentStep + 1} sur {PROGRAM_WIZARD_STEPS.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PresetSelector
                onApply={handleApplyPreset}
                currentConfig={formData}
              />
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator
            steps={PROGRAM_WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 0: Info */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Informations générales</h2>
              <p className="text-sm text-muted-foreground">
                Nommez votre programme et sélectionnez la plateforme cible
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom du programme *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Ex: Articles France - Visa"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary',
                    errors.name && 'border-red-500'
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Description optionnelle..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Plateforme *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => updateFormData('platformId', platform.id as PlatformId)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        formData.platformId === platform.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full mb-2"
                        style={{ backgroundColor: platform.color }}
                      />
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.domain}</p>
                    </button>
                  ))}
                </div>
                {errors.platformId && (
                  <p className="text-sm text-red-500 mt-1">{errors.platformId[0]}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Content Types */}
        {currentStep === 1 && (
          <ContentTypeStep
            selectedTypes={formData.contentTypes}
            onChange={(types) => updateFormData('contentTypes', types)}
            platformId={formData.platformId}
            errors={errors.contentTypes}
          />
        )}

        {/* Step 2: Countries */}
        {currentStep === 2 && (
          <CountrySelectionStep
            selectedCountries={formData.countries}
            onChange={(countries) => updateFormData('countries', countries)}
            errors={errors.countries}
          />
        )}

        {/* Step 3: Languages */}
        {currentStep === 3 && (
          <LanguageConfigStep
            selectedLanguages={formData.languages}
            onChange={(languages) => updateFormData('languages', languages)}
            selectedCountries={formData.countries}
            quantityMode={formData.quantityMode}
            errors={errors.languages}
          />
        )}

        {/* Step 4: Themes */}
        {currentStep === 4 && (
          <ThemeSelectionStep
            selectedThemes={formData.themes}
            onChange={(themes) => updateFormData('themes', themes)}
            platformId={formData.platformId}
            errors={errors.themes}
          />
        )}

        {/* Step 5: Quantity */}
        {currentStep === 5 && (
          <QuantityConfigStep
            quantityMode={formData.quantityMode}
            quantityValue={formData.quantityValue}
            onModeChange={(mode) => updateFormData('quantityMode', mode)}
            onValueChange={(value) => updateFormData('quantityValue', value)}
            selectedCountries={formData.countries}
            selectedLanguages={formData.languages}
            selectedThemes={formData.themes}
            errors={errors.quantity}
          />
        )}

        {/* Step 6: Scheduling */}
        {currentStep === 6 && (
          <SchedulingStep
            recurrenceType={formData.recurrenceType}
            recurrenceConfig={formData.recurrenceConfig}
            onTypeChange={(type) => updateFormData('recurrenceType', type)}
            onConfigChange={(config) => updateFormData('recurrenceConfig', config)}
            errors={errors.scheduling}
          />
        )}

        {/* Step 7: Options */}
        {currentStep === 7 && (
          <OptionsStep
            options={generationOptions}
            onChange={(options) => updateFormData('generationOptions', options)}
            errors={errors.options}
          />
        )}

        {/* Step 8: Review */}
        {currentStep === 8 && (
          <ReviewStep
            programData={formData}
            onSaveDraft={handleSaveDraft}
            onActivate={handleActivate}
            onRunNow={handleRunNow}
            isSubmitting={isCreating}
          />
        )}
      </div>

      {/* Footer Navigation */}
      {currentStep < 8 && (
        <div className="sticky bottom-0 bg-white border-t">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goPrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            <Button onClick={goNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Quitter sans sauvegarder ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de quitter ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/programs')}>
              Quitter sans sauvegarder
            </Button>
            <Button onClick={() => {
              handleSaveDraft();
              setShowExitDialog(false);
            }}>
              Sauvegarder et quitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Draft Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brouillon trouvé</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Un brouillon de programme a été trouvé. Voulez-vous le restaurer ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={discardDraft}>
              Ignorer
            </Button>
            <Button onClick={restoreDraft}>
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProgramBuilder;