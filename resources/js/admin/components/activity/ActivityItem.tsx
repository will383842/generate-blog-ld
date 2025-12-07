import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  FileText,
  Upload,
  Trash2,
  Edit,
  Eye,
  Send,
  Settings,
  User,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'view'
  | 'generate'
  | 'settings'
  | 'user'
  | 'upload';

export type ActivityStatus = 'success' | 'error' | 'pending';

export interface ActivityItemData {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  status?: ActivityStatus;
  metadata?: Record<string, any>;
}

export interface ActivityItemProps {
  activity: ActivityItemData;
  showUser?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  onClick?: (activity: ActivityItemData) => void;
  className?: string;
}

const typeIcons: Record<ActivityType, React.ReactNode> = {
  create: <FileText className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  publish: <Send className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  generate: <Zap className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
};

const typeColors: Record<ActivityType, string> = {
  create: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  publish: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  view: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  generate: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  settings: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
  user: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  upload: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const statusIcons: Record<ActivityStatus, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Clock className="h-4 w-4 text-amber-500" />,
};

export function ActivityItem({
  activity,
  showUser = true,
  showStatus = true,
  compact = false,
  onClick,
  className,
}: ActivityItemProps) {
  const { t } = useTranslation('common');

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 py-2',
          onClick && 'cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2',
          className
        )}
        onClick={() => onClick?.(activity)}
      >
        <div className={cn('p-1.5 rounded-full', typeColors[activity.type])}>
          {typeIcons[activity.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activity.title}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTime(activity.timestamp)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-4 py-4',
        onClick && 'cursor-pointer hover:bg-muted/50 rounded-lg px-3 -mx-3',
        className
      )}
      onClick={() => onClick?.(activity)}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-full h-fit', typeColors[activity.type])}>
        {typeIcons[activity.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {activity.description}
              </p>
            )}
          </div>
          {showStatus && activity.status && (
            <div className="flex-shrink-0">{statusIcons[activity.status]}</div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {showUser && activity.user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="text-[10px]">
                  {getUserInitials(activity.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {activity.user.name}
              </span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {formatTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ActivityItem;
