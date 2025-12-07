import React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, showValue = false, value, min = 0, max = 100, ...props }, ref) => {
    const percentage = ((Number(value) - Number(min)) / (Number(max) - Number(min))) * 100;

    return (
      <div className="relative w-full">
        <input
          type="range"
          ref={ref}
          value={value}
          min={min}
          max={max}
          className={cn(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
            className
          )}
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary-600)) ${percentage}%, rgb(229, 231, 235) ${percentage}%)`,
          }}
          {...props}
        />
        {showValue && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400">
            {value}
          </span>
        )}
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
