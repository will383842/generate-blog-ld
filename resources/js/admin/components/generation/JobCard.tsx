/**
 * Job Card
 * Card displaying a queue job with actions
 */

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileText,
  Clock,
  DollarSign,
  MoreVertical,
  X,
  RefreshCw,
  ArrowUp,
  Eye,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ProgressBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CONTENT_TYPES, PLATFORMS } from '@/utils/constants';
import type { QueueItem, QueueStatus, JobPriority } from '@/types/generation';

export interface JobCardProps {
  job: QueueItem;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onPriority?: (id: string, priority: JobPriority) => void;
  onView?: (id: string) => void;
  className?: string;
}

const STATUS_CONFIG: Record<QueueStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Check;
}> = {
  pending: { label: 'En attente', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock },
  processing: { label: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Loader2 },
  completed: { label: 'Terminé', color: 'text-green-600', bgColor: 'bg-green-100', icon: Check },
  failed: { label: 'Échec', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
  cancelled: { label: 'Annulé', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: X },
};

const PRIORITY_CONFIG: Record<JobPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'text-gray-500' },
  normal: { label: 'Normale', color: 'text-blue-500' },
  high: { label: 'Haute', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
};

export function JobCard({
  job,
  onCancel,
  onRetry,
  onPriority,
  onView,
  className,
}: JobCardProps) {
  const contentType = CONTENT_TYPES.find((t) => t.id === job.type);
  const platform = PLATFORMS.find((p) => p.id === job.platformId);
  const statusConfig = STATUS_CONFIG[job.status];
  const priorityConfig = PRIORITY_CONFIG[job.priority];
  const StatusIcon = statusConfig.icon;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className={cn(
      'rounded-lg border bg-white p-4 transition-shadow hover:shadow-md',
      className
    )}>
      <div className="flex items-start justify-between">
        {/* Left: Type + Platform */}
        <div className="flex items-center gap-3">
          {contentType && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${contentType.color}20` }}
            >
              <contentType.icon
                className="w-5 h-5"
                style={{ color: contentType.color }}
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{contentType?.name || job.type}</span>
              <Badge
                variant="outline"
                style={{ borderColor: platform?.color, color: platform?.color }}
              >
                {platform?.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.countryId} • {job.languageId.toUpperCase()}
              {job.themeId && ` • ${job.themeId}`}
            </p>
          </div>
        </div>

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-2">
          <Badge className={cn(statusConfig.bgColor, statusConfig.color, 'gap-1')}>
            <StatusIcon className={cn(
              'w-3 h-3',
              job.status === 'processing' && 'animate-spin'
            )} />
            {statusConfig.label}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(job.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
              )}
              {job.status === 'pending' && onPriority && (
                <>
                  <DropdownMenuItem onClick={() => onPriority(job.id, 'high')}>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Priorité haute
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPriority(job.id, 'urgent')}>
                    <ArrowUp className="w-4 h-4 mr-2 text-red-500" />
                    Priorité urgente
                  </DropdownMenuItem>
                </>
              )}
              {job.status === 'failed' && onRetry && (
                <DropdownMenuItem onClick={() => onRetry(job.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </DropdownMenuItem>
              )}
              {(job.status === 'pending' || job.status === 'processing') && onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(job.id)}
                  className="text-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress (if processing) */}
      {job.status === 'processing' && job.progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{job.currentStep || 'Génération...'}</span>
            <span>{job.progress}%</span>
          </div>
          <ProgressBar value={job.progress} size="sm" />
        </div>
      )}

      {/* Error (if failed) */}
      {job.status === 'failed' && job.error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
          {job.error}
        </div>
      )}

      {/* Footer: Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {job.completedAt
              ? formatDuration(job.duration)
              : formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: fr })}
          </span>
        </div>
        {job.cost > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>${job.cost.toFixed(3)}</span>
          </div>
        )}
        {job.wordCount && (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{job.wordCount} mots</span>
          </div>
        )}
        <div className={cn('ml-auto', priorityConfig.color)}>
          Priorité: {priorityConfig.label}
        </div>
      </div>
    </div>
  );
}

export default JobCard;
