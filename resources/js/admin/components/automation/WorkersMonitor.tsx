/**
 * Workers Monitor Component
 * File 370 - Queue workers monitoring grid
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
  XCircle,
  Pause,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { AutomationStatus, QueueName } from '@/types/automation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkersMonitorProps {
  status: AutomationStatus;
  onRefresh?: () => void;
  isAdmin?: boolean;
  onAction?: (action: 'restart' | 'clear-failed', queueName: QueueName) => void;
}

// Queue configuration
const queueConfig: Record<QueueName, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'content-generation': { label: 'Génération', icon: Sparkles, color: 'blue' },
  'translation': { label: 'Traduction', icon: Languages, color: 'green' },
  'image-generation': { label: 'Images', icon: Image, color: 'yellow' },
  'default': { label: 'Publication', icon: Send, color: 'violet' },
  'indexing': { label: 'Indexation', icon: Search, color: 'orange' },
};

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
};

export function WorkersMonitor({ status, onRefresh, isAdmin, onAction }: WorkersMonitorProps) {
  const { t } = useTranslation();

  // Get border color based on queue load
  const getBorderColor = (pending: number): string => {
    if (pending >= 50) return 'border-red-300';
    if (pending >= 10) return 'border-orange-300';
    return 'border-green-200';
  };

  // Get load level
  const getLoadLevel = (pending: number): { label: string; color: string } => {
    if (pending >= 50) return { label: 'Surchargé', color: 'text-red-600' };
    if (pending >= 10) return { label: 'Chargé', color: 'text-orange-600' };
    return { label: 'Normal', color: 'text-green-600' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Workers & Queues</h3>
        <div className="flex items-center gap-2">
          {/* Global worker status */}
          <Badge
            variant={status.workers.running ? 'default' : 'destructive'}
            className="gap-1"
          >
            {status.workers.running ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Workers actifs
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Workers arrêtés
              </>
            )}
          </Badge>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {status.queues.map(queue => {
          const config = queueConfig[queue.name];
          if (!config) return null;

          const Icon = config.icon;
          const colors = colorClasses[config.color];
          const borderColor = getBorderColor(queue.size);
          const loadLevel = getLoadLevel(queue.size);
          const isProcessing = queue.processing > 0;
          const totalInQueue = queue.size + queue.processing;

          return (
            <TooltipProvider key={queue.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      'transition-all hover:shadow-md',
                      colors.bg,
                      borderColor,
                      'border-2'
                    )}
                  >
                    <CardContent className="pt-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-2 rounded-lg', colors.bg)}>
                            <Icon className={cn('h-4 w-4', colors.text)} />
                          </div>
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        {isAdmin && onAction && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <span className="sr-only">Actions</span>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onAction('restart', queue.name)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Redémarrer
                              </DropdownMenuItem>
                              {queue.failed > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onAction('clear-failed', queue.name)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Vider échecs
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mb-3">
                        {status.workers.running ? (
                          isProcessing ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              En cours
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Prêt
                            </Badge>
                          )
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <Pause className="h-3 w-3" />
                            Arrêté
                          </Badge>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">En attente</span>
                          <span className={cn('font-medium', loadLevel.color)}>
                            {queue.size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">En cours</span>
                          <span className="font-medium">{queue.processing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Échoués</span>
                          <span className={cn('font-medium', queue.failed > 0 && 'text-red-600')}>
                            {queue.failed}
                            {queue.failed > 0 && (
                              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                                !
                              </Badge>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Progress if processing */}
                      {isProcessing && totalInQueue > 0 && (
                        <div className="mt-3">
                          <Progress
                            value={(queue.processing / totalInQueue) * 100}
                            className="h-1"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-medium">{queue.displayName}</p>
                    <p className="text-xs">Charge: {loadLevel.label}</p>
                    <p className="text-xs">Complétés: {queue.completed}</p>
                    {queue.lastProcessed && (
                      <p className="text-xs">
                        Dernier traité: {formatDistanceToNow(new Date(queue.lastProcessed), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Global Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>
          Traités aujourd'hui: <strong className="text-foreground">{status.workers.processedToday}</strong>
        </span>
        {status.workers.lastHeartbeat && (
          <span>
            Dernière activité: {formatDistanceToNow(new Date(status.workers.lastHeartbeat), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        )}
      </div>
    </div>
  );
}

export default WorkersMonitor;
