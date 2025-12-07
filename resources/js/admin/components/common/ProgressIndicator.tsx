import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: number;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const percentage = Math.round((completedSteps / steps.length) * 100);
  const hasError = steps.some((s) => s.status === 'error');

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progression
          </span>
          {showPercentage && (
            <span className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-600' : 'text-primary-600'
            )}>
              {percentage}%
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              hasError ? 'bg-red-500' : 'bg-primary-600'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              step.status === 'in_progress' && 'bg-primary-50',
              step.status === 'error' && 'bg-red-50',
              step.status === 'completed' && 'bg-green-50/50'
            )}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {step.status === 'in_progress' && (
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              )}
              {step.status === 'error' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {step.status === 'pending' && (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                step.status === 'completed' && 'text-green-700',
                step.status === 'in_progress' && 'text-primary-700',
                step.status === 'error' && 'text-red-700',
                step.status === 'pending' && 'text-gray-500'
              )}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>

            {/* Step number */}
            <span className="text-xs text-gray-400 font-medium">
              {index + 1}/{steps.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface OperationProgressProps {
  title: string;
  description?: string;
  progress: number; // 0-100
  status?: 'running' | 'completed' | 'error' | 'paused';
  estimatedTime?: string;
  elapsedTime?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function OperationProgress({
  title,
  description,
  progress,
  status = 'running',
  estimatedTime,
  elapsedTime,
  onCancel,
  onRetry,
  className,
}: OperationProgressProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {status === 'running' && (
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            )}
            {status === 'completed' && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {status === 'running' && onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </button>
          )}
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-white bg-primary-600 hover:bg-primary-700 px-3 py-1 rounded"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              status === 'running' && 'bg-primary-600',
              status === 'completed' && 'bg-green-500',
              status === 'error' && 'bg-red-500',
              status === 'paused' && 'bg-yellow-500'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>{Math.round(progress)}% terminé</span>
        <div className="flex gap-4">
          {elapsedTime && (
            <span>Temps écoulé: {elapsedTime}</span>
          )}
          {estimatedTime && status === 'running' && (
            <span>Temps restant: ~{estimatedTime}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressIndicator;
