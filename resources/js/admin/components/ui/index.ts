/**
 * UI Components Barrel Export
 * Centralized exports for all UI components
 */

// Layout & Structure
export * from './Accordion';
export * from './Card';
export * from './Collapsible';
export * from './Separator';
export * from './Sheet';
export * from './Tabs';

// Forms
export * from './Button';
export * from './Checkbox';
export * from './DatePicker';
export * from './Form';
export * from './Input';
export * from './Label';
export * from './Radio';
export * from './RadioGroup';
export * from './Select';
export * from './Slider';
export * from './Switch';
export * from './Textarea';

// Feedback
export * from './Alert';
export * from './AlertDialog';
export * from './Badge';
export * from './Progress';
export * from './ProgressBar';
export * from './Skeleton';
export * from './Tooltip';

// Overlays
export * from './Dialog';
export * from './Dropdown';
export * from './DropdownMenu';
export * from './Modal';
export * from './Popover';

// Navigation
export * from './Breadcrumb';
export * from './Command';
export * from './Pagination';
export * from './ScrollArea';

// Data Display
export * from './Avatar';
export * from './DataTable';
export * from './Table';

// Specialized
export * from './Calendar';
export * from './EmptyState';
export * from './LocaleBadge';
export * from './TipTapEditor';

// Toast System (legacy - prefer hooks/useToast)
export { ToastProvider, useToast as useToastSystem, createToastHelpers } from './toast-system';
export type { Toast, ToastOptions, ToastVariant, ToastAction } from './toast-system';
