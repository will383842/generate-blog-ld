import React, { memo, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  Globe,
  Languages,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { PLATFORMS } from '@/utils/constants';
import type { ProgramSummary, ProgramStatus } from '@/types/program';

export interface ProgramCardProps {
  program: ProgramSummary;
  onEdit?: (id: string) => void;
  onClone?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onClick?: (id: string) => void;
  isSelected?: boolean;
  runningProgress?: number;
  className?: string;
}

const STATUS_CONFIG: Record<ProgramStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  draft: {
    label: 'Brouillon',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Edit,
  },
  active: {
    label: 'Actif',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  paused: {
    label: 'En pause',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Pause,
  },
  scheduled: {
    label: 'Planifié',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Clock,
  },
  running: {
    label: 'En cours',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Loader2,
  },
  completed: {
    label: 'Terminé',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: CheckCircle,
  },
  error: {
    label: 'Erreur',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
  },
};

export const ProgramCard = memo(function ProgramCard({
  program,
  onEdit,
  onClone,
  onDelete,
  onRun,
  onPause,
  onResume,
  onClick,
  isSelected,
  runningProgress,
  className,
}: ProgramCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const platform = PLATFORMS.find((p) => p.id === program.platformId);
  const statusConfig = STATUS_CONFIG[program.status];
  const StatusIcon = statusConfig.icon;

  // Memoized callbacks
  const handleEdit = useCallback(() => onEdit?.(program.id), [program.id, onEdit]);
  const handleClone = useCallback(() => onClone?.(program.id), [program.id, onClone]);
  const handleDelete = useCallback(() => onDelete?.(program.id), [program.id, onDelete]);
  const handleRun = useCallback(() => onRun?.(program.id), [program.id, onRun]);
  const handlePause = useCallback(() => onPause?.(program.id), [program.id, onPause]);
  const handleResume = useCallback(() => onResume?.(program.id), [program.id, onResume]);
  const handleCardClick = useCallback(() => onClick?.(program.id), [program.id, onClick]);

  const formatNextRun = () => {
    if (!program.nextRunAt) return 'Non planifié';
    try {
      return formatDistanceToNow(new Date(program.nextRunAt), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return program.nextRunAt;
    }
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 cursor-pointer hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        isHovered && 'scale-[1.02]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Platform indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
        style={{ backgroundColor: platform?.color || '#6B7280' }}
      />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {program.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {platform?.name}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <Badge className={cn('gap-1', statusConfig.bgColor, statusConfig.color)}>
              <StatusIcon className={cn(
                'w-3 h-3',
                program.status === 'running' && 'animate-spin'
              )} />
              {statusConfig.label}
            </Badge>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onClone && (
                  <DropdownMenuItem onClick={handleClone}>
                    <Copy className="w-4 h-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {program.status === 'active' && onPause && (
                  <DropdownMenuItem onClick={handlePause}>
                    <Pause className="w-4 h-4 mr-2" />
                    Mettre en pause
                  </DropdownMenuItem>
                )}
                {program.status === 'paused' && onResume && (
                  <DropdownMenuItem onClick={handleResume}>
                    <Play className="w-4 h-4 mr-2" />
                    Reprendre
                  </DropdownMenuItem>
                )}
                {onRun && program.status !== 'running' && (
                  <DropdownMenuItem onClick={handleRun}>
                    <Play className="w-4 h-4 mr-2" />
                    Lancer maintenant
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        {/* Running progress */}
        {program.status === 'running' && runningProgress !== undefined && (
          <div className="mb-3">
            <ProgressBar value={runningProgress} size="sm" showLabel />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {/* Assuming these would come from program data */}
              {program.countries?.length || '-'}
            </p>
            <p className="text-xs text-muted-foreground">Pays</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Languages className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {program.languages?.length || '-'}
            </p>
            <p className="text-xs text-muted-foreground">Langues</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {program.totalGenerated.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Générés</p>
          </div>
        </div>

        {/* Success rate */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Taux de succès</span>
          <span className={cn(
            'font-medium',
            program.successRate >= 90 ? 'text-green-600' :
            program.successRate >= 70 ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {program.successRate.toFixed(0)}%
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        <div className="w-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatNextRun()}</span>
          </div>
          <span className="text-muted-foreground">
            ${program.totalCost.toFixed(2)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
});

export default ProgramCard;
