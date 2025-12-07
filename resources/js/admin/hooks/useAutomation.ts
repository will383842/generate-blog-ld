/**
 * Automation Hooks
 * File 366 - Hooks for automation settings and status
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  AutomationSettings,
  AutomationSettingsInput,
  AutomationStatus,
  AutomationTestRun,
  AutomationStep,
} from '@/types/automation';

// ============================================================================
// Query Keys
// ============================================================================

export const automationKeys = {
  all: ['automation'] as const,
  settings: () => [...automationKeys.all, 'settings'] as const,
  status: () => [...automationKeys.all, 'status'] as const,
  testRuns: () => [...automationKeys.all, 'test-runs'] as const,
  testRun: (id: string) => [...automationKeys.testRuns(), id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchAutomationSettings(): Promise<AutomationSettings> {
  const { data } = await api.get<AutomationSettings>('/admin/automation/settings');
  return data;
}

async function updateAutomationSettings(settingsData: AutomationSettingsInput): Promise<AutomationSettings> {
  const { data } = await api.put<AutomationSettings>('/admin/automation/settings', settingsData);
  return data;
}

async function fetchAutomationStatus(): Promise<AutomationStatus> {
  const { data } = await api.get<AutomationStatus>('/admin/automation/status');
  return data;
}

async function runAutomationTest(): Promise<AutomationTestRun> {
  const { data } = await api.post<AutomationTestRun>('/admin/automation/test');
  return data;
}

async function toggleAutomationFeature(
  key: keyof Pick<AutomationSettings, 'autoTranslate' | 'autoGenerateImage' | 'autoPublish' | 'autoIndex'>,
  value: boolean
): Promise<AutomationSettings> {
  const { data } = await api.patch<AutomationSettings>('/admin/automation/settings', { [key]: value });
  return data;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get automation settings
 * Cache for 5 minutes
 */
export function useAutomationSettings() {
  return useQuery({
    queryKey: automationKeys.settings(),
    queryFn: fetchAutomationSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get automation status (real-time)
 * Auto-refresh every 10 seconds
 */
export function useAutomationStatus() {
  return useQuery({
    queryKey: automationKeys.status(),
    queryFn: fetchAutomationStatus,
    refetchInterval: 10 * 1000, // 10 seconds
    staleTime: 5 * 1000, // 5 seconds
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Update automation settings
 */
export function useUpdateAutomationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateAutomationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(automationKeys.settings(), data);
      queryClient.invalidateQueries({ queryKey: automationKeys.status() });
      toast({
        title: 'Paramètres enregistrés',
        description: 'La configuration d\'automatisation a été mise à jour.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Test automation chain (dry-run)
 */
export function useTestAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: runAutomationTest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: automationKeys.status() });
      
      const successCount = data.results.filter(r => r.success).length;
      const totalCount = data.results.length;
      
      toast({
        title: data.overallSuccess ? 'Test réussi' : 'Test terminé avec erreurs',
        description: `${successCount}/${totalCount} étapes réussies.`,
        variant: data.overallSuccess ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exécuter le test.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Toggle individual automation feature
 * With optimistic update
 */
export function useToggleAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ key, value }: { 
      key: keyof Pick<AutomationSettings, 'autoTranslate' | 'autoGenerateImage' | 'autoPublish' | 'autoIndex'>;
      value: boolean;
    }) => toggleAutomationFeature(key, value),
    
    onMutate: async ({ key, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: automationKeys.settings() });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<AutomationSettings>(automationKeys.settings());

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData(automationKeys.settings(), {
          ...previousSettings,
          [key]: value,
        });
      }

      return { previousSettings };
    },
    
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(automationKeys.settings(), context.previousSettings);
      }
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier ce paramètre.',
        variant: 'destructive',
      });
    },
    
    onSuccess: (data, { key, value }) => {
      queryClient.setQueryData(automationKeys.settings(), data);
      queryClient.invalidateQueries({ queryKey: automationKeys.status() });
      
      const featureLabels: Record<string, string> = {
        autoTranslate: 'Traduction automatique',
        autoGenerateImage: 'Génération d\'image automatique',
        autoPublish: 'Publication automatique',
        autoIndex: 'Indexation automatique',
      };
      
      toast({
        title: value ? 'Activé' : 'Désactivé',
        description: `${featureLabels[key]} ${value ? 'activée' : 'désactivée'}.`,
      });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get automation level label
 */
export function useAutomationLevel() {
  const { data: settings } = useAutomationSettings();

  if (!settings) return { level: 'unknown', label: 'Chargement...', color: 'gray' };

  const features = [
    settings.autoTranslate,
    settings.autoGenerateImage,
    settings.autoPublish,
    settings.autoIndex,
  ];

  const enabledCount = features.filter(Boolean).length;

  if (enabledCount === 4) {
    return { level: 'full', label: '100% Automatisé', color: 'green' };
  } else if (enabledCount > 0) {
    return { level: 'partial', label: 'Partiellement automatisé', color: 'orange' };
  } else {
    return { level: 'manual', label: 'Manuel', color: 'gray' };
  }
}

/**
 * Check if a specific queue has issues
 */
export function useQueueHealth(queueName: string) {
  const { data: status } = useAutomationStatus();

  if (!status) return { healthy: true, issues: [] };

  const queue = status.queues.find(q => q.name === queueName);
  if (!queue) return { healthy: true, issues: [] };

  const issues: string[] = [];

  if (queue.failed > 0) {
    issues.push(`${queue.failed} tâches échouées`);
  }
  if (queue.size > 50) {
    issues.push(`Queue surchargée (${queue.size} en attente)`);
  }
  if (!status.workers.running) {
    issues.push('Workers arrêtés');
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}
