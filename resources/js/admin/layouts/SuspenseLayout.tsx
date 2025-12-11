/**
 * Suspense Layout Component
 * Simply wraps routes with MainLayout (which includes Sidebar and Suspense)
 */

import MainLayout from './MainLayout';

export default function SuspenseLayout() {
  return <MainLayout />;
}
