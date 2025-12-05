import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className,
  onClick,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div 
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <h3 
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <p 
      className={cn('text-sm text-gray-500', className)}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div 
      className={cn('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div 
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
};