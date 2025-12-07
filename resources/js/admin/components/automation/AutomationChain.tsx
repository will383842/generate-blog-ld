/**
 * Automation Chain Component
 * File 368 - Horizontal visualization of automation chain
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Languages,
  Image,
  Send,
  Search,
  CheckCircle,
  Circle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  AutomationSettings,
  AutomationStatus,
  AutomationStep,
  AUTOMATION_STEPS,
} from '@/types/automation';
import { cn } from '@/lib/utils';

interface AutomationChainProps {
  settings: AutomationSettings;
  status: AutomationStatus;
  onStepClick?: (step: AutomationStep) => void;
}

// Icon components map
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Languages,
  Image,
  Send,
  Search,
};

// Color classes map
const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
};

export function AutomationChain({ settings, status, onStepClick }: AutomationChainProps) {
  const { t } = useTranslation();

  // Check if a step is enabled
  const isStepEnabled = (step: AutomationStep): boolean => {
    switch (step) {
      case 'generation':
        return true; // Always enabled (manual trigger)
      case 'translation':
        return settings.autoTranslate;
      case 'image':
        return settings.autoGenerateImage;
      case 'publication':
        return settings.autoPublish;
      case 'indexing':
        return settings.autoIndex;
      default:
        return false;
    }
  };

  // Check if a step is currently processing
  const isStepProcessing = (step: AutomationStep): boolean => {
    const queueMap: Record<AutomationStep, string> = {
      generation: 'content-generation',
      translation: 'translation',
      image: 'image-generation',
      publication: 'default',
      indexing: 'indexing',
    };
    const queue = status.queues.find(q => q.name === queueMap[step]);
    return queue ? queue.processing > 0 : false;
  };

  // Get queue stats for a step
  const getStepStats = (step: AutomationStep): { pending: number; processing: number; failed: number } | null => {
    const queueMap: Record<AutomationStep, string> = {
      generation: 'content-generation',
      translation: 'translation',
      image: 'image-generation',
      publication: 'default',
      indexing: 'indexing',
    };
    const queue = status.queues.find(q => q.name === queueMap[step]);
    if (!queue) return null;
    return {
      pending: queue.size,
      processing: queue.processing,
      failed: queue.failed,
    };
  };

  // Get step description
  const getStepDescription = (step: AutomationStep): string => {
    switch (step) {
      case 'generation':
        return 'Création du contenu par IA';
      case 'translation':
        return 'Traduction automatique dans les langues cibles';
      case 'image':
        return 'Génération ou sélection d\'image à la une';
      case 'publication':
        return 'Publication sur les plateformes WordPress';
      case 'indexing':
        return 'Soumission aux moteurs de recherche';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      {/* Desktop: Horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {AUTOMATION_STEPS.map((stepConfig, index) => {
          const Icon = IconMap[stepConfig.icon];
          const colors = colorClasses[stepConfig.color];
          const enabled = isStepEnabled(stepConfig.key);
          const processing = isStepProcessing(stepConfig.key);
          const stats = getStepStats(stepConfig.key);

          return (
            <React.Fragment key={stepConfig.key}>
              {/* Step */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onStepClick?.(stepConfig.key)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-w-[120px]',
                        enabled
                          ? `${colors.bg} ${colors.border} hover:shadow-md`
                          : 'bg-gray-50 border-gray-200',
                        processing && 'animate-pulse',
                        onStepClick && 'cursor-pointer'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          enabled ? colors.bg : 'bg-gray-100'
                        )}
                      >
                        {processing ? (
                          <Loader2 className={cn('h-6 w-6 animate-spin', enabled ? colors.text : 'text-gray-400')} />
                        ) : (
                          <Icon className={cn('h-6 w-6', enabled ? colors.text : 'text-gray-400')} />
                        )}
                      </div>

                      {/* Label */}
                      <span className={cn('text-sm font-medium', enabled ? 'text-gray-900' : 'text-gray-500')}>
                        {stepConfig.label}
                      </span>

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        {enabled ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">Activé</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Désactivé</span>
                          </>
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[250px]">
                    <div className="space-y-2">
                      <p className="font-medium">{stepConfig.label}</p>
                      <p className="text-sm text-muted-foreground">{getStepDescription(stepConfig.key)}</p>
                      {stats && (
                        <div className="flex gap-3 text-xs pt-2 border-t">
                          <span>En attente: {stats.pending}</span>
                          <span>En cours: {stats.processing}</span>
                          {stats.failed > 0 && (
                            <span className="text-red-500">Échoués: {stats.failed}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Arrow */}
              {index < AUTOMATION_STEPS.length - 1 && (
                <ChevronRight
                  className={cn(
                    'h-6 w-6 flex-shrink-0',
                    isStepEnabled(AUTOMATION_STEPS[index + 1].key)
                      ? 'text-gray-400'
                      : 'text-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden space-y-3">
        {AUTOMATION_STEPS.map((stepConfig, index) => {
          const Icon = IconMap[stepConfig.icon];
          const colors = colorClasses[stepConfig.color];
          const enabled = isStepEnabled(stepConfig.key);
          const processing = isStepProcessing(stepConfig.key);
          const stats = getStepStats(stepConfig.key);

          return (
            <React.Fragment key={stepConfig.key}>
              <button
                onClick={() => onStepClick?.(stepConfig.key)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                  enabled
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-gray-50 border-gray-200',
                  processing && 'animate-pulse',
                  onStepClick && 'cursor-pointer'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    enabled ? colors.bg : 'bg-gray-100'
                  )}
                >
                  {processing ? (
                    <Loader2 className={cn('h-5 w-5 animate-spin', enabled ? colors.text : 'text-gray-400')} />
                  ) : (
                    <Icon className={cn('h-5 w-5', enabled ? colors.text : 'text-gray-400')} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-medium', enabled ? 'text-gray-900' : 'text-gray-500')}>
                      {stepConfig.label}
                    </span>
                    {enabled ? (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Activé
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Désactivé
                      </Badge>
                    )}
                  </div>
                  {stats && enabled && (
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>{stats.pending} en attente</span>
                      {stats.failed > 0 && (
                        <span className="text-red-500">{stats.failed} échoués</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </button>

              {/* Vertical connector */}
              {index < AUTOMATION_STEPS.length - 1 && (
                <div className="flex justify-center">
                  <div
                    className={cn(
                      'w-0.5 h-4',
                      isStepEnabled(AUTOMATION_STEPS[index + 1].key)
                        ? 'bg-gray-300'
                        : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default AutomationChain;
