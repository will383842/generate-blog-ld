import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Context for Tooltip state
interface TooltipContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  side: 'top' | 'right' | 'bottom' | 'left';
  setSide: (side: 'top' | 'right' | 'bottom' | 'left') => void;
  delayDuration: number;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
}

// Provider for global tooltip settings (optional)
interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

function TooltipProvider({ children, delayDuration = 200 }: TooltipProviderProps) {
  return <>{children}</>;
}

// Main Tooltip component (shadcn/ui compatible)
interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

function Tooltip({ children, open, defaultOpen = false, onOpenChange, delayDuration = 200 }: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('top');
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpen = open !== undefined ? open : internalOpen;

  const setIsOpen = useCallback((newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [open, onOpenChange]);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef, contentRef, side, setSide, delayDuration }}>
      <div className="relative inline-flex">
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

// Trigger wrapper
interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

function TooltipTrigger({ children, asChild, className }: TooltipTriggerProps) {
  const { setIsOpen, delayDuration } = useTooltipContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  return (
    <span
      className={cn('inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
    </span>
  );
}

// Content wrapper
interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

function TooltipContent({
  children,
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
}: TooltipContentProps) {
  const { isOpen, contentRef } = useTooltipContext();

  if (!isOpen) return null;

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={contentRef}
      role="tooltip"
      className={cn(
        'absolute z-50 px-3 py-1.5 text-xs text-white bg-gray-900 rounded-md shadow-md max-w-xs dark:bg-gray-700',
        'animate-in fade-in-0 zoom-in-95',
        sideClasses[side],
        alignClasses[align],
        className
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : undefined, marginBottom: side === 'top' ? sideOffset : undefined }}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
