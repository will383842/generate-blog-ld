/**
 * Page Suspense Wrapper
 * Combines Suspense with ErrorBoundary for robust page loading
 */

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageErrorBoundary } from './PageErrorBoundary';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function PageSuspense({ children, fallback }: Props) {
  return (
    <PageErrorBoundary>
      <Suspense fallback={fallback || <DefaultLoader />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}

export default PageSuspense;
