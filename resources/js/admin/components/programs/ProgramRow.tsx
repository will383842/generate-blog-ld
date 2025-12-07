import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { ProgressBar } from '@/components/ProgressBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { PLATFORMS } from '@/utils/constants';
import type { ProgramSummary, ProgramStatus } from '@/types/program';

export interface ProgramRowProps {
  program: ProgramSummary;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onClone?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  runningProgress?: number;
  className?: string;
}

const STATUS_CONFIG: Record<ProgramStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: typeof CheckCircle;
  iconClass?: string;
}> = {
  draft: { label: 'Brouillon', variant: 'secondary', icon: Edit },
  active: { label: 'Actif', variant: 'default', icon: CheckCircle },
  paused: { label: 'Pause', variant: 'outline', icon: Pause },
  scheduled: { label: 'Planifié', variant: 'secondary', icon: Clock },
  running: { label: 'En cours', variant: 'default', icon: Loader2, iconClass: 'animate-spin' },
  completed: { label: 'Terminé', variant: 'secondary', icon: CheckCircle },
  error: { label: 'Erreur', variant: 'destructive', icon: AlertCircle },
};

export function ProgramRow({
  program,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onClone,
  onDelete,
  onRun,
  onPause,
  onResume,
  runningProgress,
  className,
}: ProgramRowProps) {
  const platform = PLATFORMS.find((p) => p.id === program.platformId);
  const statusConfig = STATUS_CONFIG[program.status];
  const StatusIcon = statusConfig.icon;

  const formatNextRun = () => {
    if (!program.nextRunAt) return '-';
    try {
      return formatDistanceToNow(new Date(program.nextRunAt), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return program.nextRunAt;
    }
  };

  const formatLastRun = () => {
    if (!program.lastRunAt) return '-';
    try {
      return formatDistanceToNow(new Date(program.lastRunAt), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return program.lastRunAt;
    }
  };

  return (
    <tr className={cn(
      'hover:bg-gray-50 transition-colors',
      isSelected && 'bg-blue-50',
      className
    )}>
      {/* Checkbox */}
      {onSelect && (
        <td className="w-12 px-4 py-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(program.id, !!checked)}
          />
        </td>
      )}

      {/* Platform indicator + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: platform?.color || '#6B7280' }}
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate max-w-[200px]">
              {program.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {platform?.name}
            </p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={statusConfig.variant} className="gap-1">
          <StatusIcon className={cn('w-3 h-3', statusConfig.iconClass)} />
          {statusConfig.label}
        </Badge>
      </td>

      {/* Content Types */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Show first 2 types + count */}
          <Badge variant="outline" className="text-xs">
            {program.contentTypes?.length || '-'} types
          </Badge>
        </div>
      </td>

      {/* Countries / Languages */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">{program.countries?.length || '-'}</span>
          <span className="text-muted-foreground"> pays</span>
          <span className="text-muted-foreground mx-1">·</span>
          <span className="font-medium">{program.languages?.length || '-'}</span>
          <span className="text-muted-foreground"> langues</span>
        </div>
      </td>

      {/* Progress (if running) or Generated count */}
      <td className="px-4 py-3 min-w-[120px]">
        {program.status === 'running' && runningProgress !== undefined ? (
          <div className="space-y-1">
            <ProgressBar value={runningProgress} size="sm" />
            <p className="text-xs text-muted-foreground text-center">
              {runningProgress.toFixed(0)}%
            </p>
          </div>
        ) : (
          <div className="text-sm">
            <span className="font-medium">{program.totalGenerated.toLocaleString()}</span>
            <span className="text-muted-foreground"> générés</span>
          </div>
        )}
      </td>

      {/* Success Rate */}
      <td className="px-4 py-3">
        <Tooltip>
          <TooltipTrigger>
            <div className={cn(
              'text-sm font-medium',
              program.successRate >= 90 ? 'text-green-600' :
              program.successRate >= 70 ? 'text-yellow-600' :
              'text-red-600'
            )}>
              {program.successRate.toFixed(0)}%
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Taux de succès des générations
          </TooltipContent>
        </Tooltip>
      </td>

      {/* Next Run */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <p className="text-gray-900">{formatNextRun()}</p>
          {program.lastRunAt && (
            <p className="text-xs text-muted-foreground">
              Dernière : {formatLastRun()}
            </p>
          )}
        </div>
      </td>

      {/* Cost */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium">
          ${program.totalCost.toFixed(2)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          {/* Quick actions */}
          {onView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onView(program.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voir détails</TooltipContent>
            </Tooltip>
          )}

          {program.status === 'active' && onPause && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPause(program.id)}
                >
                  <Pause className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mettre en pause</TooltipContent>
            </Tooltip>
          )}

          {program.status === 'paused' && onResume && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onResume(program.id)}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reprendre</TooltipContent>
            </Tooltip>
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(program.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              {onClone && (
                <DropdownMenuItem onClick={() => onClone(program.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
              )}
              {onRun && program.status !== 'running' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRun(program.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Lancer maintenant
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(program.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export default ProgramRow;
