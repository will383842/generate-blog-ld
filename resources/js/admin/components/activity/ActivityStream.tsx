import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileText,
  Upload,
  AlertCircle,
  Settings,
  Clock,
  RefreshCw,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export type ActivityType = 'generation' | 'publication' | 'error' | 'system';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    articleId?: number;
    country?: string;
    language?: string;
    platform?: string;
    errorCode?: string;
    link?: string;
  };
}

export interface ActivityStreamProps {
  activities?: Activity[];
  onLoadMore?: () => Promise<Activity[]>;
  onRefresh?: () => Promise<Activity[]>;
  refreshInterval?: number;
  className?: string;
}

const TYPE_CONFIG: Record<ActivityType, {
  icon: typeof FileText;
  color: string;
  bgColor: string;
  label: string;
}> = {
  generation: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Génération',
  },
  publication: {
    icon: Upload,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Publication',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Erreur',
  },
  system: {
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Système',
  },
};

export function ActivityStream({
  activities: initialActivities = [],
  onLoadMore,
  onRefresh,
  refreshInterval = 10000,
  className,
}: ActivityStreamProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [filteredTypes, setFilteredTypes] = useState<Set<ActivityType>>(
    new Set(['generation', 'publication', 'error', 'system'])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Auto-refresh
  useEffect(() => {
    if (!onRefresh || refreshInterval <= 0) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        const newActivities = await onRefresh();
        setActivities((prev) => {
          // Merge new activities, avoiding duplicates
          const existingIds = new Set(prev.map((a) => a.id));
          const uniqueNew = newActivities.filter((a) => !existingIds.has(a.id));
          return [...uniqueNew, ...prev];
        });
      } catch (error) {
        console.error('Failed to refresh activities:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [onRefresh, refreshInterval]);

  // Infinite scroll
  useEffect(() => {
    if (!onLoadMore || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          try {
            const moreActivities = await onLoadMore();
            if (moreActivities.length === 0) {
              setHasMore(false);
            } else {
              setActivities((prev) => [...prev, ...moreActivities]);
            }
          } catch (error) {
            console.error('Failed to load more activities:', error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onLoadMore, hasMore, isLoading]);

  const toggleFilter = (type: ActivityType) => {
    setFilteredTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filteredActivities = activities.filter((a) => filteredTypes.has(a.type));

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return timestamp;
    }
  };

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      const newActivities = await onRefresh();
      setActivities(newActivities);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <Button
              key={type}
              variant={filteredTypes.has(type as ActivityType) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter(type as ActivityType)}
              className={cn(
                'gap-1 text-xs',
                filteredTypes.has(type as ActivityType) && config.bgColor,
                filteredTypes.has(type as ActivityType) && config.color
              )}
            >
              <config.icon className="w-3 h-3" />
              {config.label}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
        </Button>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px]">
        {isRefreshing && activities.length === 0 && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {filteredActivities.length === 0 && !isRefreshing ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune activité à afficher
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const config = TYPE_CONFIG[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={cn('p-2 rounded-full h-fit', config.bgColor)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      {activity.metadata?.link && (
                        <a
                          href={activity.metadata.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  {activity.metadata && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {activity.metadata.country && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.metadata.country}
                        </Badge>
                      )}
                      {activity.metadata.language && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.metadata.language}
                        </Badge>
                      )}
                      {activity.metadata.platform && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.metadata.platform}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Load more trigger */}
        {hasMore && onLoadMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoading && <LoadingSpinner size="sm" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityStream;