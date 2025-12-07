import React from 'react';
import { cn } from '@/lib/utils';

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonPulse className="h-4 w-24 mb-2" />
          <SkeletonPulse className="h-8 w-16" />
        </div>
        <SkeletonPulse className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

function QuickActionCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <SkeletonPulse className="h-5 w-32 mb-4" />
      <SkeletonPulse className="h-4 w-full mb-2" />
      <SkeletonPulse className="h-4 w-3/4 mb-4" />
      <SkeletonPulse className="h-9 w-28" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <SkeletonPulse className="h-5 w-40" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <SkeletonPulse className="h-2 w-2 rounded-full" />
              <div>
                <SkeletonPulse className="h-4 w-40 mb-1" />
                <SkeletonPulse className="h-3 w-24" />
              </div>
            </div>
            <SkeletonPulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <QuickActionCardSkeleton key={i} />
        ))}
      </div>

      {/* Activity Skeleton */}
      <ActivitySkeleton />
    </div>
  );
}

export { StatCardSkeleton, QuickActionCardSkeleton, ActivitySkeleton };
export default DashboardSkeleton;
