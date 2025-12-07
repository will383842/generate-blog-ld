/**
 * Notification Store
 * File 399 - Zustand store for notifications
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationCategory = 
  | 'system'
  | 'content'
  | 'generation'
  | 'publication'
  | 'quality'
  | 'user'
  | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
  autoRemove?: boolean;
  autoRemoveDelay?: number;
}

export interface CreateNotificationInput {
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  autoRemove?: boolean;
  autoRemoveDelay?: number;
}

// ============================================================================
// Store State
// ============================================================================

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  maxNotifications: number;
  defaultAutoRemoveDelay: number;
}

// ============================================================================
// Store Actions
// ============================================================================

interface NotificationActions {
  // Notification CRUD
  addNotification: (input: CreateNotificationInput) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearRead: () => void;
  
  // Bulk operations
  markMultipleAsRead: (ids: string[]) => void;
  removeMultiple: (ids: string[]) => void;
  
  // Getters
  getUnreadNotifications: () => Notification[];
  getNotificationsByCategory: (category: NotificationCategory) => Notification[];
  getNotificationById: (id: string) => Notification | undefined;
  
  // Settings
  setMaxNotifications: (max: number) => void;
  setDefaultAutoRemoveDelay: (delay: number) => void;
  
  // Cleanup
  removeExpired: () => void;
}

// ============================================================================
// Store Interface
// ============================================================================

type NotificationStore = NotificationState & NotificationActions;

// ============================================================================
// Auto-remove timers storage
// ============================================================================

const autoRemoveTimers: Map<string, NodeJS.Timeout> = new Map();

// ============================================================================
// Store Implementation
// ============================================================================

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      maxNotifications: 100,
      defaultAutoRemoveDelay: 10000, // 10 seconds

      // Add notification
      addNotification: (input) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const notification: Notification = {
          id,
          type: input.type,
          category: input.category || 'system',
          title: input.title,
          message: input.message,
          read: false,
          actionUrl: input.actionUrl,
          actionLabel: input.actionLabel,
          metadata: input.metadata,
          createdAt: new Date().toISOString(),
          expiresAt: input.expiresAt,
          autoRemove: input.autoRemove ?? false,
          autoRemoveDelay: input.autoRemoveDelay,
        };

        set((state) => {
          let notifications = [notification, ...state.notifications];
          
          // Limit to max notifications
          if (notifications.length > state.maxNotifications) {
            notifications = notifications.slice(0, state.maxNotifications);
          }

          return {
            notifications,
            unreadCount: state.unreadCount + 1,
          };
        });

        // Setup auto-remove timer
        if (input.autoRemove) {
          const delay = input.autoRemoveDelay || get().defaultAutoRemoveDelay;
          const timer = setTimeout(() => {
            get().removeNotification(id);
            autoRemoveTimers.delete(id);
          }, delay);
          autoRemoveTimers.set(id, timer);
        }

        return id;
      },

      // Remove notification
      removeNotification: (id) => {
        // Clear timer if exists
        const timer = autoRemoveTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          autoRemoveTimers.delete(id);
        }

        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      // Mark as read
      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      // Mark all as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      // Clear all notifications
      clearAll: () => {
        // Clear all timers
        autoRemoveTimers.forEach((timer) => clearTimeout(timer));
        autoRemoveTimers.clear();

        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      // Clear only read notifications
      clearRead: () => {
        set((state) => ({
          notifications: state.notifications.filter((n) => !n.read),
        }));
      },

      // Mark multiple as read
      markMultipleAsRead: (ids) => {
        set((state) => {
          let decrementCount = 0;
          const notifications = state.notifications.map((n) => {
            if (ids.includes(n.id) && !n.read) {
              decrementCount++;
              return { ...n, read: true };
            }
            return n;
          });

          return {
            notifications,
            unreadCount: Math.max(0, state.unreadCount - decrementCount),
          };
        });
      },

      // Remove multiple notifications
      removeMultiple: (ids) => {
        // Clear timers
        ids.forEach((id) => {
          const timer = autoRemoveTimers.get(id);
          if (timer) {
            clearTimeout(timer);
            autoRemoveTimers.delete(id);
          }
        });

        set((state) => {
          let decrementCount = 0;
          const notifications = state.notifications.filter((n) => {
            if (ids.includes(n.id)) {
              if (!n.read) decrementCount++;
              return false;
            }
            return true;
          });

          return {
            notifications,
            unreadCount: Math.max(0, state.unreadCount - decrementCount),
          };
        });
      },

      // Get unread notifications
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },

      // Get notifications by category
      getNotificationsByCategory: (category) => {
        return get().notifications.filter((n) => n.category === category);
      },

      // Get notification by id
      getNotificationById: (id) => {
        return get().notifications.find((n) => n.id === id);
      },

      // Set max notifications
      setMaxNotifications: (max) => {
        set({ maxNotifications: max });
      },

      // Set default auto-remove delay
      setDefaultAutoRemoveDelay: (delay) => {
        set({ defaultAutoRemoveDelay: delay });
      },

      // Remove expired notifications
      removeExpired: () => {
        const now = new Date().toISOString();
        set((state) => {
          let decrementCount = 0;
          const notifications = state.notifications.filter((n) => {
            if (n.expiresAt && n.expiresAt < now) {
              if (!n.read) decrementCount++;
              // Clear timer
              const timer = autoRemoveTimers.get(n.id);
              if (timer) {
                clearTimeout(timer);
                autoRemoveTimers.delete(n.id);
              }
              return false;
            }
            return true;
          });

          return {
            notifications,
            unreadCount: Math.max(0, state.unreadCount - decrementCount),
          };
        });
      },
    }),
    {
      name: 'content-engine-notifications',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Only persist last 50
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Quick notification creators
 */
export const notify = {
  info: (title: string, message: string, options?: Partial<CreateNotificationInput>) =>
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      ...options,
    }),

  success: (title: string, message: string, options?: Partial<CreateNotificationInput>) =>
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      autoRemove: true,
      ...options,
    }),

  warning: (title: string, message: string, options?: Partial<CreateNotificationInput>) =>
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    }),

  error: (title: string, message: string, options?: Partial<CreateNotificationInput>) =>
    useNotificationStore.getState().addNotification({
      type: 'error',
      category: 'error',
      title,
      message,
      ...options,
    }),
};

// ============================================================================
// Selector Hooks
// ============================================================================

export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useUnreadNotifications = () => 
  useNotificationStore((state) => state.notifications.filter((n) => !n.read));

export default useNotificationStore;
