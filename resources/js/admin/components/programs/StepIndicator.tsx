import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  isOptional?: boolean;
}

export interface StepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Default 9 steps for program wizard
export const PROGRAM_WIZARD_STEPS: WizardStep[] = [
  { id: 'info', label: 'Informations', description: 'Nom et description' },
  { id: 'content-types', label: 'Types de contenu', description: 'Sélectionnez les types' },
  { id: 'countries', label: 'Pays', description: 'Zones géographiques' },
  { id: 'languages', label: 'Langues', description: 'Langues cibles' },
  { id: 'themes', label: 'Thèmes', description: 'Sujets à couvrir' },
  { id: 'quantity', label: 'Quantité', description: 'Volume de production' },
  { id: 'scheduling', label: 'Planification', description: 'Fréquence et horaires' },
  { id: 'options', label: 'Options', description: 'Paramètres avancés', isOptional: true },
  { id: 'review', label: 'Récapitulatif', description: 'Validation finale' },
];

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  allowNavigation = true,
  variant = 'horizontal',
  size = 'md',
  className,
}: StepIndicatorProps) {
  const isStepCompleted = (index: number) => completedSteps.includes(index);
  const isStepCurrent = (index: number) => index === currentStep;
  const isStepAccessible = (index: number) => {
    if (!allowNavigation) return false;
    // Can go to any completed step or the next uncompleted step
    return isStepCompleted(index) || index <= Math.max(...completedSteps, -1) + 1;
  };

  const sizeConfig = {
    sm: {
      circle: 'w-6 h-6 text-xs',
      line: 'h-0.5',
      text: 'text-xs',
      description: 'text-[10px]',
    },
    md: {
      circle: 'w-8 h-8 text-sm',
      line: 'h-0.5',
      text: 'text-sm',
      description: 'text-xs',
    },
    lg: {
      circle: 'w-10 h-10 text-base',
      line: 'h-1',
      text: 'text-base',
      description: 'text-sm',
    },
  };

  const config = sizeConfig[size];

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => {
          const completed = isStepCompleted(index);
          const current = isStepCurrent(index);
          const accessible = isStepAccessible(index);

          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Indicator */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => accessible && onStepClick?.(index)}
                  disabled={!accessible}
                  className={cn(
                    'rounded-full flex items-center justify-center font-medium transition-all',
                    config.circle,
                    completed && 'bg-green-500 text-white',
                    current && !completed && 'bg-primary text-white ring-4 ring-primary/20',
                    !completed && !current && 'bg-gray-200 text-gray-500',
                    accessible && !current && 'hover:ring-2 hover:ring-gray-300 cursor-pointer',
                    !accessible && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {completed ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {/* Vertical line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[24px] my-1',
                      isStepCompleted(index) ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pb-6">
                <p className={cn(
                  'font-medium',
                  config.text,
                  current ? 'text-gray-900' : 'text-gray-600'
                )}>
                  {step.label}
                  {step.isOptional && (
                    <span className="text-muted-foreground ml-1">(optionnel)</span>
                  )}
                </p>
                {step.description && (
                  <p className={cn('text-muted-foreground mt-0.5', config.description)}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const completed = isStepCompleted(index);
          const current = isStepCurrent(index);
          const accessible = isStepAccessible(index);

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => accessible && onStepClick?.(index)}
                  disabled={!accessible}
                  className={cn(
                    'rounded-full flex items-center justify-center font-medium transition-all',
                    config.circle,
                    completed && 'bg-green-500 text-white',
                    current && !completed && 'bg-primary text-white ring-4 ring-primary/20',
                    !completed && !current && 'bg-gray-200 text-gray-500',
                    accessible && !current && 'hover:ring-2 hover:ring-gray-300 cursor-pointer',
                    !accessible && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {completed ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                
                {/* Label below circle */}
                <div className="mt-2 text-center max-w-[80px]">
                  <p className={cn(
                    'font-medium leading-tight',
                    config.text,
                    current ? 'text-gray-900' : 'text-gray-500'
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 mt-[-24px]">
                  <div
                    className={cn(
                      'w-full',
                      config.line,
                      isStepCompleted(index) ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for mobile
export function StepIndicatorCompact({
  currentStep,
  totalSteps,
  stepLabel,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i < currentStep ? 'bg-green-500' :
              i === currentStep ? 'bg-primary' :
              'bg-gray-200'
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        Étape {currentStep + 1} sur {totalSteps}
        {stepLabel && ` - ${stepLabel}`}
      </span>
    </div>
  );
}

export default StepIndicator;
