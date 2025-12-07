import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps {
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

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, label, id, checked, defaultChecked, onCheckedChange, disabled, name, value, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
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
          role="checkbox"
          aria-checked={isChecked}
          id={inputId}
          ref={ref}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            'h-4 w-4 shrink-0 rounded border flex items-center justify-center',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            isChecked
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600',
            className
          )}
          {...props}
        >
          {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
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
            className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            onClick={handleClick}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
