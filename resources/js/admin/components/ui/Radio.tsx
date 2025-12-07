import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
	label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
	({ className, label, id, ...props }, ref) => {
		const inputId = id || React.useId();

		return (
			<label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer text-sm text-foreground">
				<input
					id={inputId}
					ref={ref}
					type="radio"
					className={cn(
						'h-4 w-4 rounded-full border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
						className
					)}
					{...props}
				/>
				{label && <span>{label}</span>}
			</label>
		);
	}
);

Radio.displayName = 'Radio';

export default Radio;
