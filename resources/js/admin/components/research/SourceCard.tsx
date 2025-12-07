import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ExternalLink,
  Star,
  StarOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  FileText,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SourceType = 'web' | 'document' | 'api' | 'database';
export type SourceReliability = 'high' | 'medium' | 'low' | 'unverified';

export interface SourceData {
  id: string;
  title: string;
  url?: string;
  type: SourceType;
  reliability: SourceReliability;
  lastVerified?: string;
  excerpt?: string;
  domain?: string;
  isFavorite?: boolean;
  metadata?: Record<string, any>;
}

export interface SourceCardProps {
  source: SourceData;
  onToggleFavorite?: (id: string) => void;
  onVerify?: (id: string) => void;
  onClick?: (source: SourceData) => void;
  showExcerpt?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const typeIcons: Record<SourceType, React.ReactNode> = {
  web: <Globe className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  api: <Database className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
};

const reliabilityConfig: Record<
  SourceReliability,
  { color: string; icon: React.ReactNode; label: string }
> = {
  high: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'High',
  },
  medium: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: <Clock className="h-3 w-3" />,
    label: 'Medium',
  },
  low: {
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Low',
  },
  unverified: {
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Unverified',
  },
};

export function SourceCard({
  source,
  onToggleFavorite,
  onVerify,
  onClick,
  showExcerpt = true,
  showActions = true,
  compact = false,
  className,
}: SourceCardProps) {
  const { t } = useTranslation('research');
  const reliability = reliabilityConfig[source.reliability];

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={() => onClick?.(source)}
      >
        <div className="p-2 rounded-full bg-muted">
          {typeIcons[source.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{source.title}</p>
          {source.domain && (
            <p className="text-sm text-muted-foreground truncate">
              {source.domain}
            </p>
          )}
        </div>
        <Badge className={cn('flex items-center gap-1', reliability.color)}>
          {reliability.icon}
          {reliability.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={() => onClick?.(source)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-2 rounded-full bg-muted flex-shrink-0">
            {typeIcons[source.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium leading-tight">{source.title}</h4>
                {source.domain && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {source.domain}
                  </p>
                )}
              </div>
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(source.id);
                  }}
                >
                  {source.isFavorite ? (
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Excerpt */}
            {showExcerpt && source.excerpt && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {source.excerpt}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge className={cn('flex items-center gap-1', reliability.color)}>
                {reliability.icon}
                {t(`sources.reliability.${source.reliability}`, reliability.label)}
              </Badge>
              {source.lastVerified && (
                <span className="text-xs text-muted-foreground">
                  {t('sources.verified')}: {formatDate(source.lastVerified)}
                </span>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2 mt-3">
                {source.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(source.url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    {t('actions.open')}
                  </Button>
                )}
                {onVerify && source.reliability !== 'high' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerify(source.id);
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {t('factCheck.verify')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SourceCard;
