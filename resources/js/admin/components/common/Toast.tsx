import React from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
};

/**
 * Toast notification utility
 * 
 * @example
 * // Simple usage
 * toast.success('Operation completed');
 * toast.error('Something went wrong');
 * 
 * @example
 * // With options
 * toast.success('File saved', {
 *   description: 'Your changes have been saved',
 *   action: {
 *     label: 'Undo',
 *     onClick: () => handleUndo()
 *   }
 * });
 * 
 * @example
 * // Loading toast with promise
 * toast.promise(saveData(), {
 *   loading: 'Saving...',
 *   success: 'Saved successfully',
 *   error: 'Failed to save'
 * });
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      icon: icons.success,
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      icon: icons.error,
      duration: options?.duration ?? 5000,
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      icon: icons.warning,
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      icon: icons.info,
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      icon: icons.loading,
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  custom: (component: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(() => component, options);
  },
};

export interface ToastProviderProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  expand?: boolean;
  richColors?: boolean;
  closeButton?: boolean;
  duration?: number;
}

/**
 * Toast Provider component - add to your app root
 * 
 * @example
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <Toast position="top-right" />
 *     </>
 *   );
 * }
 */
export function Toast({
  position = 'top-right',
  expand = false,
  richColors = true,
  closeButton = true,
  duration = 4000,
}: ToastProviderProps) {
  return (
    <SonnerToaster
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton={closeButton}
      duration={duration}
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  );
}

export default Toast;
