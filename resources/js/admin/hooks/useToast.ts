/**
 * Unified Toast Hook
 * Uses Sonner for all toast notifications
 * Provides backwards-compatible API for migration from react-hot-toast
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

interface ShowToastOptions {
  duration?: number;
  description?: string;
}

/**
 * Unified toast hook - uses Sonner under the hood
 */
export function useToast() {
  /**
   * Show toast with options object (shadcn/ui style)
   */
  const toastWithOptions = ({ title, description, duration = 4000, variant }: ToastOptions) => {
    const options: ExternalToast = { duration, description };

    if (variant === 'destructive') {
      return sonnerToast.error(title, options);
    }
    return sonnerToast.success(title, options);
  };

  /**
   * Simple showToast(message, type) for compatibility
   */
  const showToast = (
    message: string,
    type: ToastType = 'success',
    options?: ShowToastOptions
  ) => {
    const toastOptions: ExternalToast = {
      duration: options?.duration || 4000,
      description: options?.description,
    };

    switch (type) {
      case 'error':
        return sonnerToast.error(message, toastOptions);
      case 'warning':
        return sonnerToast.warning(message, toastOptions);
      case 'info':
        return sonnerToast.info(message, toastOptions);
      case 'loading':
        return sonnerToast.loading(message, toastOptions);
      case 'success':
      default:
        return sonnerToast.success(message, toastOptions);
    }
  };

  return {
    // Main API
    toast: toastWithOptions,
    showToast,

    // Convenience methods
    success: (message: string, options?: ShowToastOptions) => {
      return sonnerToast.success(message, {
        duration: options?.duration || 4000,
        description: options?.description,
      });
    },

    error: (message: string, options?: ShowToastOptions) => {
      return sonnerToast.error(message, {
        duration: options?.duration || 4000,
        description: options?.description,
      });
    },

    warning: (message: string, options?: ShowToastOptions) => {
      return sonnerToast.warning(message, {
        duration: options?.duration || 4000,
        description: options?.description,
      });
    },

    info: (message: string, options?: ShowToastOptions) => {
      return sonnerToast.info(message, {
        duration: options?.duration || 4000,
        description: options?.description,
      });
    },

    loading: (message: string, options?: ShowToastOptions) => {
      return sonnerToast.loading(message, {
        duration: options?.duration,
        description: options?.description,
      });
    },

    dismiss: (toastId?: string | number) => {
      if (toastId !== undefined) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    },

    /**
     * Promise helper - shows loading, then success/error
     */
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => {
      return sonnerToast.promise(promise, msgs);
    },
  };
}

// Direct toast export for simple usage: toast.success('Message')
export const toast = {
  success: (message: string, options?: ExternalToast) => sonnerToast.success(message, options),
  error: (message: string, options?: ExternalToast) => sonnerToast.error(message, options),
  warning: (message: string, options?: ExternalToast) => sonnerToast.warning(message, options),
  info: (message: string, options?: ExternalToast) => sonnerToast.info(message, options),
  loading: (message: string, options?: ExternalToast) => sonnerToast.loading(message, options),
  message: (message: string, options?: ExternalToast) => sonnerToast.message(message, options),
  dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  promise: sonnerToast.promise,
};

export default useToast;
