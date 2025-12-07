/**
 * Automation Status Component
 * File 369 - Global automation status card with controls
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Languages,
  Image,
  Send,
  Search,
  AlertTriangle,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/Alert';
import {
  AutomationSettings,
  AutomationStatus as AutomationStatusType,
  AutomationTestRun,
} from '@/types/automation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AutomationStatusProps {
  settings: AutomationSettings;
  status: AutomationStatusType;
  onToggle: (key: keyof Pick<AutomationSettings, 'autoTranslate' | 'autoGenerateImage' | 'autoPublish' | 'autoIndex'>, value: boolean) => void;
  onTest: () => Promise<AutomationTestRun>;
  isTestRunning?: boolean;
}

export function AutomationStatus({
  settings,
  status,
  onToggle,
  onTest,
  isTestRunning = false,
}: AutomationStatusProps) {
  const { t } = useTranslation();
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<AutomationTestRun | null>(null);

  // Calculate automation level
  const features = [
    settings.autoTranslate,
    settings.autoGenerateImage,
    settings.autoPublish,
    settings.autoIndex,
  ];
  const enabledCount = features.filter(Boolean).length;
  const automationLevel = enabledCount === 4 ? 'full' : enabledCount > 0 ? 'partial' : 'manual';

  // Get level badge config
  const levelConfig = {
    full: { label: '100% Automatisé', color: 'bg-green-100 text-green-800 border-green-200' },
    partial: { label: 'Partiellement automatisé', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    manual: { label: 'Manuel', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  // Check for alerts/issues
  const hasIssues = status.alerts.length > 0 || !status.workers.running;
  const criticalAlerts = status.alerts.filter(a => a.type === 'error');
  const warningAlerts = status.alerts.filter(a => a.type === 'warning');

  // Run test
  const handleTest = async () => {
    try {
      const results = await onTest();
      setTestResults(results);
      setShowTestResults(true);
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <>
      <Card className={cn(hasIssues && 'border-orange-300')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Status de l'automatisation</CardTitle>
              <CardDescription>Configuration post-génération</CardDescription>
            </div>
            <Badge variant="outline" className={levelConfig[automationLevel].color}>
              {levelConfig[automationLevel].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alerts */}
          {hasIssues && (
            <div className="space-y-2">
              {!status.workers.running && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Workers arrêtés</AlertTitle>
                  <AlertDescription>
                    Les workers de queue sont arrêtés. L'automatisation ne fonctionne pas.
                  </AlertDescription>
                </Alert>
              )}
              {criticalAlerts.map(alert => (
                <Alert key={alert.id} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
              {warningAlerts.map(alert => (
                <Alert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Auto-Translation */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-green-600" />
                <Label htmlFor="autoTranslate" className="text-sm cursor-pointer">
                  Traduction
                </Label>
              </div>
              <Switch
                id="autoTranslate"
                checked={settings.autoTranslate}
                onCheckedChange={(v) => onToggle('autoTranslate', v)}
              />
            </div>

            {/* Auto-Image */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-yellow-600" />
                <Label htmlFor="autoGenerateImage" className="text-sm cursor-pointer">
                  Image
                </Label>
              </div>
              <Switch
                id="autoGenerateImage"
                checked={settings.autoGenerateImage}
                onCheckedChange={(v) => onToggle('autoGenerateImage', v)}
              />
            </div>

            {/* Auto-Publish */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    'flex items-center justify-between p-3 border rounded-lg',
                    settings.autoPublish && 'border-orange-300 bg-orange-50'
                  )}>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-violet-600" />
                      <Label htmlFor="autoPublish" className="text-sm cursor-pointer">
                        Publication
                      </Label>
                      {settings.autoPublish && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                    <Switch
                      id="autoPublish"
                      checked={settings.autoPublish}
                      onCheckedChange={(v) => onToggle('autoPublish', v)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>⚠️ Les articles seront publiés automatiquement</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Auto-Index */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-orange-600" />
                <Label htmlFor="autoIndex" className="text-sm cursor-pointer">
                  Indexation
                </Label>
              </div>
              <Switch
                id="autoIndex"
                checked={settings.autoIndex}
                onCheckedChange={(v) => onToggle('autoIndex', v)}
              />
            </div>
          </div>

          {/* Scheduler Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Scheduler</span>
                <Badge variant={status.scheduler.isActive ? 'default' : 'secondary'}>
                  {status.scheduler.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-x-4">
                {status.scheduler.lastRun && (
                  <span>
                    Dernière exécution: {formatDistanceToNow(new Date(status.scheduler.lastRun), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
                {status.scheduler.nextRun && (
                  <span>
                    Prochaine: {formatDistanceToNow(new Date(status.scheduler.nextRun), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTestRunning}
            >
              {isTestRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Tester la chaîne
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/admin/system" className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Voir les logs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Dialog */}
      <Dialog open={showTestResults} onOpenChange={setShowTestResults}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Résultats du test</DialogTitle>
            <DialogDescription>
              Test de la chaîne d'automatisation (dry-run)
            </DialogDescription>
          </DialogHeader>
          {testResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {testResults.overallSuccess ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700">Tous les tests réussis</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">Certains tests ont échoué</span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {testResults.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium capitalize">{result.step}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AutomationStatus;
