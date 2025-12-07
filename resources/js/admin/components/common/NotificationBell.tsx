import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/Dropdown';

type NotificationType = 'info' | 'warning' | 'error' | 'success';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationBellProps {
  className?: string;
  notifications?: Notification[];
  maxDisplay?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  align?: 'start' | 'center' | 'end';
}

const TYPE_STYLES: Record<NotificationType, { dot: string; bg: string }> = {
  info: { dot: 'bg-blue-500', bg: 'bg-blue-50' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50' },
  error: { dot: 'bg-red-500', bg: 'bg-red-50' },
  success: { dot: 'bg-green-500', bg: 'bg-green-50' }
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function NotificationBell({
  className,
  notifications = [],
  maxDisplay = 5,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
  align = 'end'
}: NotificationBellProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = notifications.slice(0, maxDisplay);
  const hasMore = notifications.length > maxDisplay;

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
  }, [onMarkAsRead, onNotificationClick]);

  const handleMarkAllRead = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAllAsRead?.();
  }, [onMarkAllAsRead]);

  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClearAll?.();
  }, [onClearAll]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={t('navigation.header.notifications')}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} className="w-80">
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span>{t('navigation.header.notifications')}</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 text-xs text-blue-600 hover:text-blue-700"
              >
                <CheckCheck size={14} className="mr-1" />
                {t('common.actions.markAllRead', 'Tout lire')}
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">
              {t('common.messages.noNotifications', 'Aucune notification')}
            </p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            {displayedNotifications.map(notification => {
              const styles = TYPE_STYLES[notification.type];
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer border-b border-slate-100 last:border-0',
                    !notification.read && styles.bg
                  )}
                >
                  <div className="flex items-start gap-2 w-full">
                    <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', styles.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.link && (
                          <ExternalLink size={10} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        
        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between p-2">
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600"
                >
                  {t('common.actions.viewAll', 'Voir tout')} ({notifications.length})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-red-600 ml-auto"
              >
                <Trash2 size={12} className="mr-1" />
                {t('common.actions.clearAll', 'Effacer')}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}