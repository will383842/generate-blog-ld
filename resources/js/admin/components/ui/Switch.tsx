import React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
  label?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, id, checked, defaultChecked, onCheckedChange, disabled, name, value, ...props }, ref) => {
    const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);

    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleClick = () => {
      if (disabled) return;
      const newChecked = !isChecked;
      if (checked === undefined) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };

    return (
      <div className="flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={isChecked}
          id={inputId}
          ref={ref}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            isChecked ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
              isChecked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name={name}
          value={isChecked ? (value || 'on') : ''}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            onClick={handleClick}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
