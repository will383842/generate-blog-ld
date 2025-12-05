import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export function SkeletonLoader({ className, count = 1 }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            className
          )}
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}