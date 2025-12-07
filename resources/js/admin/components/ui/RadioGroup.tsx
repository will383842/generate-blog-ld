import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

export function RadioGroup({
  className,
  children,
  value,
  defaultValue,
  onValueChange,
  name,
  ...props
}: RadioGroupProps) {
  const groupName = name || React.useId();
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const currentValue = value ?? internalValue;

  const handleChange = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <RadioGroupContext.Provider value={{ name: groupName, value: currentValue, onValueChange: handleChange }}>
      <div className={cn('space-y-2', className)} role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  label?: React.ReactNode;
  helperText?: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, label, helperText, id, disabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const inputId = id || React.useId();

    const checked = context?.value === value;

    const handleChange = () => {
      context?.onValueChange?.(value);
    };

    return (
      <label htmlFor={inputId} className={cn('flex items-start gap-3 cursor-pointer', disabled && 'opacity-60 cursor-not-allowed')}>
        <input
          id={inputId}
          ref={ref}
          type="radio"
          name={context?.name}
          value={value}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded-full border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
        {(label || helperText) && (
          <div className="space-y-1 text-sm">
            {label && <p className="font-medium text-foreground">{label}</p>}
            {helperText && <p className="text-muted-foreground">{helperText}</p>}
          </div>
        )}
      </label>
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export default RadioGroup;