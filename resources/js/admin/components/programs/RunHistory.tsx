import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RotateCcw,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import type { ProgramRun, ProgramItem, ProgramRunStatus } from '@/types/program';

export interface RunHistoryProps {
  runs?: ProgramRun[];
  programId?: string;
  onRetry?: (runId: string) => void;
  onViewLogs?: (runId: string) => void;
  onViewArticle?: (articleId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<ProgramRunStatus, {
  label: string;
  icon: typeof CheckCircle;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  running: {
    label: 'En cours',
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  completed: {
    label: 'Terminé',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  partial: {
    label: 'Partiel',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  failed: {
    label: 'Échoué',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  cancelled: {
    label: 'Annulé',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

function RunRow({
  run,
  onRetry,
  onViewLogs,
  onViewArticle,
}: {
  run: ProgramRun;
  onRetry?: (runId: string) => void;
  onViewLogs?: (runId: string) => void;
  onViewArticle?: (articleId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[run.status];
  const StatusIcon = statusConfig.icon;

  const formatDuration = (seconds?: number | null) => {
    if (seconds == null) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const progress = run.itemsPlanned > 0
    ? ((run.itemsCompleted + run.itemsFailed) / run.itemsPlanned) * 100
    : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow className="hover:bg-gray-50">
        {/* Expand button */}
        <TableCell className="w-10">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>

        {/* Date */}
        <TableCell>
          <div>
            <p className="font-medium">
              {format(new Date(run.startedAt), 'dd/MM/yyyy HH:mm')}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(run.startedAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge className={cn('gap-1', statusConfig.bgColor, statusConfig.color)}>
            <StatusIcon className={cn(
              'w-3 h-3',
              run.status === 'running' && 'animate-spin'
            )} />
            {statusConfig.label}
          </Badge>
        </TableCell>

        {/* Progress */}
        <TableCell className="min-w-[150px]">
          {run.status === 'running' ? (
            <div className="space-y-1">
              <ProgressBar value={run.progress || progress} size="sm" />
              <p className="text-xs text-muted-foreground text-center">
                {run.progress?.toFixed(0) || progress.toFixed(0)}%
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-medium">{run.itemsCompleted}</span>
              <span className="text-muted-foreground">/</span>
              <span>{run.itemsPlanned}</span>
              {run.itemsFailed > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-red-600">{run.itemsFailed} échoués</span>
                </>
              )}
            </div>
          )}
        </TableCell>

        {/* Duration */}
        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{formatDuration(run.duration)}</span>
          </div>
        </TableCell>

        {/* Cost */}
        <TableCell>
          <span className="font-medium">${run.totalCost.toFixed(2)}</span>
        </TableCell>

        {/* Triggered by */}
        <TableCell>
          <Badge variant="outline" className="text-xs">
            {run.triggeredBy === 'schedule' ? 'Planifié' :
             run.triggeredBy === 'manual' ? 'Manuel' : 'API'}
          </Badge>
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center gap-1">
            {onViewLogs && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onViewLogs(run.id)}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voir les logs</TooltipContent>
              </Tooltip>
            )}
            {onRetry && run.status === 'failed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRetry(run.id)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Relancer les échecs</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded items */}
      <CollapsibleContent asChild>
        <TableRow className="bg-gray-50">
          <TableCell colSpan={8} className="p-0">
            <div className="p-4 border-t">
              <h4 className="text-sm font-medium mb-3">Détail des items</h4>
              {run.items && run.items.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {run.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onViewArticle={onViewArticle}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun détail disponible
                </p>
              )}

              {/* Cost breakdown */}
              {run.costBreakdown && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Répartition des coûts</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">GPT-4</p>
                      <p className="font-medium">${run.costBreakdown.gpt4.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">GPT-3.5</p>
                      <p className="font-medium">${run.costBreakdown.gpt35.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DALL-E</p>
                      <p className="font-medium">${run.costBreakdown.dalle.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Autres</p>
                      <p className="font-medium">${run.costBreakdown.other.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ItemRow({
  item,
  onViewArticle,
}: {
  item: ProgramItem;
  onViewArticle?: (articleId: string) => void;
}) {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border">
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{item.contentType}</Badge>
          <span className="text-xs text-muted-foreground">
            {item.countryId} · {item.languageId}
          </span>
        </div>
        {item.articleTitle && (
          <p className="text-sm truncate mt-0.5">{item.articleTitle}</p>
        )}
      </div>
      {item.wordCount && (
        <span className="text-xs text-muted-foreground">
          {item.wordCount.toLocaleString()} mots
        </span>
      )}
      {item.cost !== undefined && (
        <span className="text-xs font-medium">${item.cost.toFixed(3)}</span>
      )}
      {item.articleId && onViewArticle && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onViewArticle(String(item.articleId))}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      )}
      {item.errorMessage && (
        <Tooltip>
          <TooltipTrigger>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <p className="text-xs">{item.errorMessage}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function RunHistory({
  runs,
  onRetry,
  onViewLogs,
  onViewArticle,
  isLoading,
  className,
}: RunHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Aucune exécution</p>
        <p className="text-sm">Ce programme n'a pas encore été exécuté</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Coût</TableHead>
            <TableHead>Déclencheur</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <RunRow
              key={run.id}
              run={run}
              onRetry={onRetry}
              onViewLogs={onViewLogs}
              onViewArticle={onViewArticle}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default RunHistory;
