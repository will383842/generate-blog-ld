/**
 * Connection Test Component
 * File 386 - Platform connection test with step-by-step progress
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Shield,
  Key,
  Link2,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Progress } from '@/components/ui/Progress';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useTestConnection } from '@/hooks/usePublishing';
import { ConnectionTestResult, ConnectionTestStep } from '@/types/publishing';
import { cn } from '@/lib/utils';

// Test steps configuration
const TEST_STEPS = [
  {
    id: 'dns',
    name: 'Résolution DNS',
    description: 'Vérification du nom de domaine',
    icon: Globe,
  },
  {
    id: 'ssl',
    name: 'Certificat SSL',
    description: 'Validation du certificat HTTPS',
    icon: Shield,
  },
  {
    id: 'auth',
    name: 'Authentification',
    description: 'Vérification des credentials',
    icon: Key,
  },
  {
    id: 'endpoint',
    name: 'Endpoint accessible',
    description: 'Test de la connectivité API',
    icon: Link2,
  },
];

interface ConnectionTestProps {
  platformId: number;
  platformName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConnectionTest({
  platformId,
  platformName,
  open,
  onOpenChange,
  onSuccess,
}: ConnectionTestProps) {
  const { t } = useTranslation();

  const testConnection = useTestConnection();
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  // Run test when modal opens
  useEffect(() => {
    if (open && platformId > 0) {
      runTest();
    }
  }, [open, platformId]);

  // Run connection test
  const runTest = async () => {
    setResult(null);
    setCurrentStep(0);

    // Simulate step progression for UX
    const stepDelay = 500;
    for (let i = 0; i < TEST_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }

    try {
      const testResult = await testConnection.mutateAsync(platformId);
      setResult(testResult);
      setCurrentStep(-1);

      if (testResult.success) {
        onSuccess?.();
      }
    } catch (error) {
      setResult({
        success: false,
        steps: TEST_STEPS.map(s => ({
          name: s.name,
          status: 'failed',
          message: 'Erreur de test',
          duration: null,
        })),
        latency: null,
        response: null,
        error: 'Impossible de tester la connexion',
      });
      setCurrentStep(-1);
    }
  };

  // Get step status
  const getStepStatus = (index: number): ConnectionTestStep['status'] => {
    if (result) {
      return result.steps[index]?.status || 'pending';
    }
    if (currentStep > index) return 'success';
    if (currentStep === index) return 'running';
    return 'pending';
  };

  // Render step icon
  const renderStepIcon = (index: number) => {
    const status = getStepStatus(index);
    const StepIcon = TEST_STEPS[index].icon;

    if (status === 'running') {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    if (status === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === 'skipped') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <StepIcon className="h-5 w-5 text-muted-foreground" />;
  };

  // Calculate progress
  const progress = useMemo(() => {
    if (result) return 100;
    if (currentStep < 0) return 0;
    return ((currentStep + 1) / TEST_STEPS.length) * 100;
  }, [result, currentStep]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Test de connexion
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Platform Name */}
          <div className="text-center">
            <p className="font-medium">{platformName}</p>
            {!result && currentStep >= 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Test en cours...
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Steps */}
          <div className="space-y-3">
            {TEST_STEPS.map((step, index) => {
              const status = getStepStatus(index);
              const resultStep = result?.steps[index];

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    status === 'running' && 'bg-blue-50',
                    status === 'success' && 'bg-green-50',
                    status === 'failed' && 'bg-red-50',
                    status === 'skipped' && 'bg-yellow-50',
                    status === 'pending' && 'bg-muted/50'
                  )}
                >
                  {renderStepIcon(index)}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-sm',
                      status === 'pending' && 'text-muted-foreground'
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {resultStep?.message || step.description}
                    </p>
                  </div>
                  {resultStep?.duration && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {resultStep.duration}ms
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Result Summary */}
          {result && (
            <div className={cn(
              'p-4 rounded-lg text-center',
              result.success ? 'bg-green-100' : 'bg-red-100'
            )}>
              {result.success ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">Connexion réussie</p>
                  {result.latency && (
                    <p className="text-sm text-green-700">
                      Latence: {result.latency}ms
                    </p>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="font-medium text-red-800">Connexion échouée</p>
                  {result.error && (
                    <p className="text-sm text-red-700 mt-1">
                      {result.error}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Response Preview */}
          {result?.response && (
            <div>
              <p className="text-sm font-medium mb-2">Réponse API</p>
              <ScrollArea className="h-[100px]">
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            onClick={runTest}
            disabled={testConnection.isPending || currentStep >= 0}
          >
            {(testConnection.isPending || currentStep >= 0) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Retester
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline connection status indicator
interface ConnectionStatusProps {
  platformId: number;
  lastSync?: string | null;
  successRate?: number;
  onTest?: () => void;
}

export function ConnectionStatus({
  platformId,
  lastSync,
  successRate = 100,
  onTest,
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (successRate >= 95) return 'green';
    if (successRate >= 80) return 'yellow';
    return 'red';
  };

  const statusColor = getStatusColor();

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'h-2 w-2 rounded-full',
        statusColor === 'green' && 'bg-green-500',
        statusColor === 'yellow' && 'bg-yellow-500',
        statusColor === 'red' && 'bg-red-500'
      )} />
      <span className="text-sm text-muted-foreground">
        {successRate.toFixed(0)}%
      </span>
      {onTest && (
        <Button variant="ghost" size="sm" onClick={onTest} className="h-6 px-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Hook for useMemo
function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const [value, setValue] = React.useState<T>(factory);
  React.useEffect(() => {
    setValue(factory());
  }, deps);
  return value;
}

export default ConnectionTest;
