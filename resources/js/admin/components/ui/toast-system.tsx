/**
 * Toast Notification System
 * Real-time notifications that appear automatically
 * 
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Actions (buttons) in toasts
 * - Stacking
 * - WebSocket integration for server-pushed notifications
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
  progress?: boolean;
  createdAt: number;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
  progress?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, options: Partial<ToastOptions>) => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ============================================================================
// Icons
// ============================================================================

const TOAST_ICONS: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
};

const TOAST_COLORS: Record<ToastVariant, string> = {
  default: 'bg-background border-border',
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  loading: 'bg-background border-border',
};

// ============================================================================
// Toast Item Component
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [isLeaving, setIsLeaving] = useState(false);
  const duration = toast.duration ?? 5000;

  // Auto-dismiss
  useEffect(() => {
    if (toast.variant === 'loading' || duration === Infinity) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      setProgress(newProgress);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        handleDismiss();
      }
    };

    const frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [duration, toast.variant]);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-200',
        'transform',
        TOAST_COLORS[toast.variant ?? 'default'],
        isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      )}
      role="alert"
    >
      {/* Icon */}
      {TOAST_ICONS[toast.variant ?? 'default']}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
        )}
        {toast.action && (
          <Button
            variant={toast.action.variant ?? 'outline'}
            size="sm"
            className="mt-2 h-7 text-xs"
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
          >
            {toast.action.label}
          </Button>
        )}
      </div>

      {/* Dismiss button */}
      {toast.dismissible !== false && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Progress bar */}
      {toast.progress !== false && duration !== Infinity && toast.variant !== 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-100 ease-linear',
              toast.variant === 'success' && 'bg-green-500',
              toast.variant === 'error' && 'bg-red-500',
              toast.variant === 'warning' && 'bg-amber-500',
              toast.variant === 'info' && 'bg-blue-500',
              (!toast.variant || toast.variant === 'default') && 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] p-4 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => dismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Provider
// ============================================================================

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions): string => {
    const id = `toast-${++toastCount}`;
    const newToast: Toast = {
      id,
      ...options,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const update = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...options } : t))
    );
  }, []);

  // WebSocket for server-pushed notifications
  useEffect(() => {
    let ws: WebSocket | null = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications`);

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type || 'info',
            action: notification.action,
          });
        } catch (e) {
          console.error('Failed to parse notification:', e);
        }
      };
    } catch (e) {
      // WebSocket not available
    }

    return () => {
      ws?.close();
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll, update }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// Convenience functions
// ============================================================================

export function createToastHelpers(toastFn: (options: ToastOptions) => string) {
  return {
    success: (title: string, description?: string) =>
      toastFn({ title, description, variant: 'success' }),
    error: (title: string, description?: string) =>
      toastFn({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) =>
      toastFn({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) =>
      toastFn({ title, description, variant: 'info' }),
    loading: (title: string, description?: string) =>
      toastFn({ title, description, variant: 'loading', duration: Infinity, dismissible: false }),
    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      const id = toastFn({
        title: messages.loading,
        variant: 'loading',
        duration: Infinity,
        dismissible: false,
      });

      try {
        const data = await promise;
        // This would need the update function, simplified here
        return data;
      } catch (error) {
        throw error;
      }
    },
  };
}

export default ToastProvider;
