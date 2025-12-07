/**
 * Router Configuration
 * File 395 - React Router v6 with lazy loading
 * Updated to match existing file structure
 */

import React, { Suspense, lazy } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
  ScrollRestoration,
} from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PageSuspense } from '@/components/common/PageSuspense';

// ============================================================================
// Loading Component
// ============================================================================

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// ============================================================================
// Lazy Page Wrapper with Error Boundary
// ============================================================================

function LazyPage({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType<any>> }) {
  return (
    <PageSuspense>
      <Component />
    </PageSuspense>
  );
}

// ============================================================================
// Layouts (Lazy)
// ============================================================================

const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));

// ============================================================================
// Auth Pages (Lazy)
// ============================================================================

const LoginPage = lazy(() => import('@/pages/Login'));

// ============================================================================
// Main Pages (Lazy) - Mapped to existing files
// ============================================================================

// Dashboard
const DashboardPage = lazy(() => import('@/pages/Dashboard'));

// Content - Articles
const ArticlesIndexPage = lazy(() => import('@/pages/content/articles/index'));
const ArticleDetailPage = lazy(() => import('@/pages/content/articles/[id]'));
const ArticlePreviewPage = lazy(() => import('@/pages/content/articles/Preview'));
const ArticleHistoryPage = lazy(() => import('@/pages/content/articles/History'));

// Content - Comparatives
const ComparativesIndexPage = lazy(() => import('@/pages/content/comparatives/index'));
const ComparativeDetailPage = lazy(() => import('@/pages/content/comparatives/[id]'));
const ComparativePreviewPage = lazy(() => import('@/pages/content/comparatives/Preview'));

// Content - Landings
const LandingsIndexPage = lazy(() => import('@/pages/content/landings/index'));
const LandingDetailPage = lazy(() => import('@/pages/content/landings/[id]'));
const LandingPreviewPage = lazy(() => import('@/pages/content/landings/Preview'));

// Content Hub (legacy)
const ContentHubPage = lazy(() => import('@/pages/ContentHub'));

// Coverage
const CoverageIndexPage = lazy(() => import('@/pages/coverage/index'));
const CoverageCountriesPage = lazy(() => import('@/pages/coverage/Countries'));
const CoverageLanguagesPage = lazy(() => import('@/pages/coverage/Languages'));
const CoverageThemesPage = lazy(() => import('@/pages/coverage/Themes'));
const CoverageGapsPage = lazy(() => import('@/pages/coverage/Gaps'));
const CoverageObjectivesPage = lazy(() => import('@/pages/coverage/Objectives'));
const CoverageLegacyPage = lazy(() => import('@/pages/Coverage'));

// Dashboards (platform-specific)
const DashboardsIndexPage = lazy(() => import('@/pages/dashboards/index'));
const DashboardSOSExpatPage = lazy(() => import('@/pages/dashboards/SOSExpat'));
const DashboardUlixaiPage = lazy(() => import('@/pages/dashboards/Ulixai'));
const DashboardUlyssePage = lazy(() => import('@/pages/dashboards/Ulysse'));

// Export
const ExportIndexPage = lazy(() => import('@/pages/export/index'));
const ExportConfigPage = lazy(() => import('@/pages/export/Config'));
const ExportHistoryPage = lazy(() => import('@/pages/export/History'));

// Generation
const GenerationIndexPage = lazy(() => import('@/pages/generation/index'));
const GenerationWizardPage = lazy(() => import('@/pages/generation/Wizard')); // ✅ AJOUTÉ
const GenerationQueuePage = lazy(() => import('@/pages/generation/Queue'));
const GenerationHistoryPage = lazy(() => import('@/pages/generation/History'));
const GenerationSettingsPage = lazy(() => import('@/pages/generation/Settings'));
const GenerationTemplatesPage = lazy(() => import('@/pages/generation/Templates'));
const GenerationManualTitlesPage = lazy(() => import('@/pages/generation/ManualTitles'));
const GenerationBulkCSVPage = lazy(() => import('@/pages/generation/BulkCSV'));
const GenerationLegacyPage = lazy(() => import('@/pages/Generation'));

// Media
const MediaIndexPage = lazy(() => import('@/pages/media/index'));
const MediaDallePage = lazy(() => import('@/pages/media/Dalle'));
const MediaUnsplashPage = lazy(() => import('@/pages/media/Unsplash'));
const MediaUploadPage = lazy(() => import('@/pages/media/Upload'));

// Press - Releases
const PressReleasesIndexPage = lazy(() => import('@/pages/press/releases/index'));
const PressReleaseDetailPage = lazy(() => import('@/pages/press/releases/[id]'));
const PressReleasePreviewPage = lazy(() => import('@/pages/press/releases/Preview'));

// Press - Dossiers
const PressDossiersIndexPage = lazy(() => import('@/pages/press/dossiers/index'));
const PressDossierDetailPage = lazy(() => import('@/pages/press/dossiers/[id]'));
const PressDossierPreviewPage = lazy(() => import('@/pages/press/dossiers/Preview'));

// Press - Other
const PressTemplatesPage = lazy(() => import('@/pages/press/Templates'));
const PressAnalyticsPage = lazy(() => import('@/pages/press/Analytics'));

// Programs
const ProgramsIndexPage = lazy(() => import('@/pages/programs/index'));
const ProgramDetailPage = lazy(() => import('@/pages/programs/[id]'));
const ProgramBuilderPage = lazy(() => import('@/pages/programs/Builder'));
const ProgramPresetsPage = lazy(() => import('@/pages/programs/Presets'));
const ProgramCalendarPage = lazy(() => import('@/pages/programs/Calendar'));
const ProgramAnalyticsPage = lazy(() => import('@/pages/programs/Analytics'));

// Publishing
const PublishingIndexPage = lazy(() => import('@/pages/publishing/index'));
const PublishingPlatformsPage = lazy(() => import('@/pages/publishing/Platforms'));
const PublishingEndpointsPage = lazy(() => import('@/pages/publishing/Endpoints'));
const PublishingQueuePage = lazy(() => import('@/pages/publishing/Queue'));

// Quality
const QualityIndexPage = lazy(() => import('@/pages/quality/index'));
const QualityChecksPage = lazy(() => import('@/pages/quality/Checks'));
const QualityCheckDetailPage = lazy(() => import('@/pages/quality/[checkId]'));
const QualityCategoriesPage = lazy(() => import('@/pages/quality/Categories'));
const QualityFeedbackPage = lazy(() => import('@/pages/quality/Feedback'));
const QualityGoldenPage = lazy(() => import('@/pages/quality/Golden'));
const QualityTrainingPage = lazy(() => import('@/pages/quality/Training'));
const QualityAnalyticsPage = lazy(() => import('@/pages/quality/Analytics'));

// SEO
const SEOIndexPage = lazy(() => import('@/pages/seo/index'));
const SEOIndexingPage = lazy(() => import('@/pages/seo/Indexing'));
const SEOMaillagePage = lazy(() => import('@/pages/seo/Maillage'));
const SEORedirectsPage = lazy(() => import('@/pages/seo/Redirects'));
const SEOSchemaPage = lazy(() => import('@/pages/seo/Schema'));
const SEOTechnicalPage = lazy(() => import('@/pages/seo/Technical'));

// AI
const AIIndexPage = lazy(() => import('@/pages/ai/index'));
const AIPromptsPage = lazy(() => import('@/pages/ai/Prompts'));
const AIModelsPage = lazy(() => import('@/pages/ai/Models'));
const AICostsPage = lazy(() => import('@/pages/ai/Costs'));
const AIPerformancePage = lazy(() => import('@/pages/ai/Performance'));

// Analytics
const AnalyticsIndexPage = lazy(() => import('@/pages/analytics/index'));
const AnalyticsTrafficPage = lazy(() => import('@/pages/analytics/Traffic'));
const AnalyticsConversionsPage = lazy(() => import('@/pages/analytics/Conversions'));
const AnalyticsReportsPage = lazy(() => import('@/pages/analytics/Reports'));
const AnalyticsBenchmarksPage = lazy(() => import('@/pages/analytics/Benchmarks'));
const AnalyticsTopPerformersPage = lazy(() => import('@/pages/analytics/TopPerformers'));

// Settings
const SettingsIndexPage = lazy(() => import('@/pages/settings/index'));
const SettingsAutomationPage = lazy(() => import('@/pages/settings/Automation'));
const SettingsApiKeysPage = lazy(() => import('@/pages/settings/ApiKeys'));
const SettingsPublicationPage = lazy(() => import('@/pages/settings/Publication'));
const SettingsImagesPage = lazy(() => import('@/pages/settings/Images'));

// Settings - Brand
const BrandIndexPage = lazy(() => import('@/pages/settings/brand/index'));
const BrandStylePage = lazy(() => import('@/pages/settings/brand/Style'));
const BrandPromptsPage = lazy(() => import('@/pages/settings/brand/Prompts'));
const BrandSectionsPage = lazy(() => import('@/pages/settings/brand/Sections'));
const BrandPresetsPage = lazy(() => import('@/pages/settings/brand/Presets'));
const BrandHistoryPage = lazy(() => import('@/pages/settings/brand/History'));
const BrandCompliancePage = lazy(() => import('@/pages/settings/brand/Compliance'));
const BrandAuditPage = lazy(() => import('@/pages/settings/brand/Audit'));

// Settings - Knowledge
const KnowledgeIndexPage = lazy(() => import('@/pages/settings/knowledge/index'));
const KnowledgeDetailPage = lazy(() => import('@/pages/settings/knowledge/[id]'));
const KnowledgeByTypePage = lazy(() => import('@/pages/settings/knowledge/ByType'));
const KnowledgeImportPage = lazy(() => import('@/pages/settings/knowledge/Import'));
const KnowledgeValidatorPage = lazy(() => import('@/pages/settings/knowledge/Validator'));
const KnowledgeTranslationsPage = lazy(() => import('@/pages/settings/knowledge/Translations'));
const KnowledgeAnalyticsPage = lazy(() => import('@/pages/settings/knowledge/Analytics'));

// Settings - Templates
const TemplatesIndexPage = lazy(() => import('@/pages/settings/templates/index'));
const TemplateEditorPage = lazy(() => import('@/pages/settings/templates/[id]'));
const TemplateImportPage = lazy(() => import('@/pages/settings/templates/import'));

// Admin
const AdminUsersPage = lazy(() => import('@/pages/admin/Users'));
const AdminRolesPage = lazy(() => import('@/pages/admin/Roles'));
const AdminActivityPage = lazy(() => import('@/pages/admin/Activity'));
const AdminSystemPage = lazy(() => import('@/pages/admin/System'));
const AdminErrorsPage = lazy(() => import('@/pages/admin/Errors'));
const AdminBackupsPage = lazy(() => import('@/pages/admin/Backups'));

// ============================================================================
// Protected Route Wrapper
// ============================================================================

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: string;
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Wait for auth to initialize before making decisions
  if (!isInitialized || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Simple role check using the user's role property
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children || <Outlet />}</>;
}

// ============================================================================
// Simple Error Page Component
// ============================================================================

function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Erreur</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Une erreur est survenue.</p>
        <a href="/" className="text-primary-600 hover:text-primary-700">
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page non trouvee</p>
        <a href="/" className="text-primary-600 hover:text-primary-700 font-medium">
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Router Configuration
// ============================================================================

export const router = createBrowserRouter([
  // Login Route (Public)
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthLayout />
      </Suspense>
    ),
    children: [
      { index: true, element: <LoginPage /> },
    ],
  },

  // Legacy auth routes redirect to /login
  {
    path: '/auth/login',
    element: <Navigate to="/login" replace />,
  },

  // Protected Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MainLayout />
        </Suspense>
        <ScrollRestoration />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      // Dashboard
      { index: true, element: <LazyPage component={DashboardPage} /> },

      // Content Hub (legacy route)
      { path: 'content-hub', element: <LazyPage component={ContentHubPage} /> },

      // Content - Articles
      {
        path: 'content',
        children: [
          { index: true, element: <Navigate to="/content/articles" replace /> },
          {
            path: 'articles',
            children: [
              { index: true, element: <LazyPage component={ArticlesIndexPage} /> },
              { path: ':id', element: <LazyPage component={ArticleDetailPage} /> },
              { path: ':id/preview', element: <LazyPage component={ArticlePreviewPage} /> },
              { path: ':id/history', element: <LazyPage component={ArticleHistoryPage} /> },
            ],
          },
          {
            path: 'comparatives',
            children: [
              { index: true, element: <LazyPage component={ComparativesIndexPage} /> },
              { path: ':id', element: <LazyPage component={ComparativeDetailPage} /> },
              { path: ':id/preview', element: <LazyPage component={ComparativePreviewPage} /> },
            ],
          },
          {
            path: 'landings',
            children: [
              { index: true, element: <LazyPage component={LandingsIndexPage} /> },
              { path: ':id', element: <LazyPage component={LandingDetailPage} /> },
              { path: ':id/preview', element: <LazyPage component={LandingPreviewPage} /> },
            ],
          },
        ],
      },

      // Coverage
      {
        path: 'coverage',
        children: [
          { index: true, element: <LazyPage component={CoverageIndexPage} /> },
          { path: 'countries', element: <LazyPage component={CoverageCountriesPage} /> },
          { path: 'languages', element: <LazyPage component={CoverageLanguagesPage} /> },
          { path: 'themes', element: <LazyPage component={CoverageThemesPage} /> },
          { path: 'gaps', element: <LazyPage component={CoverageGapsPage} /> },
          { path: 'objectives', element: <LazyPage component={CoverageObjectivesPage} /> },
        ],
      },

      // Dashboards (platform-specific)
      {
        path: 'dashboards',
        children: [
          { index: true, element: <LazyPage component={DashboardsIndexPage} /> },
          { path: 'sosexpat', element: <LazyPage component={DashboardSOSExpatPage} /> },
          { path: 'ulixai', element: <LazyPage component={DashboardUlixaiPage} /> },
          { path: 'ulysse', element: <LazyPage component={DashboardUlyssePage} /> },
        ],
      },

      // Export
      {
        path: 'export',
        children: [
          { index: true, element: <LazyPage component={ExportIndexPage} /> },
          { path: 'config', element: <LazyPage component={ExportConfigPage} /> },
          { path: 'history', element: <LazyPage component={ExportHistoryPage} /> },
        ],
      },

      // Generation
      {
        path: 'generation',
        children: [
          { index: true, element: <LazyPage component={GenerationIndexPage} /> },
          { path: 'wizard', element: <LazyPage component={GenerationWizardPage} /> }, // ✅ AJOUTÉ
          { path: 'queue', element: <LazyPage component={GenerationQueuePage} /> },
          { path: 'history', element: <LazyPage component={GenerationHistoryPage} /> },
          { path: 'settings', element: <LazyPage component={GenerationSettingsPage} /> },
          { path: 'templates', element: <LazyPage component={GenerationTemplatesPage} /> },
          { path: 'manual-titles', element: <LazyPage component={GenerationManualTitlesPage} /> },
          { path: 'bulk-csv', element: <LazyPage component={GenerationBulkCSVPage} /> },
        ],
      },

      // Media
      {
        path: 'media',
        children: [
          { index: true, element: <LazyPage component={MediaIndexPage} /> },
          { path: 'dalle', element: <LazyPage component={MediaDallePage} /> },
          { path: 'unsplash', element: <LazyPage component={MediaUnsplashPage} /> },
          { path: 'upload', element: <LazyPage component={MediaUploadPage} /> },
        ],
      },

      // Press
      {
        path: 'press',
        children: [
          { index: true, element: <Navigate to="/press/releases" replace /> },
          {
            path: 'releases',
            children: [
              { index: true, element: <LazyPage component={PressReleasesIndexPage} /> },
              { path: ':id', element: <LazyPage component={PressReleaseDetailPage} /> },
              { path: ':id/preview', element: <LazyPage component={PressReleasePreviewPage} /> },
            ],
          },
          {
            path: 'dossiers',
            children: [
              { index: true, element: <LazyPage component={PressDossiersIndexPage} /> },
              { path: ':id', element: <LazyPage component={PressDossierDetailPage} /> },
              { path: ':id/preview', element: <LazyPage component={PressDossierPreviewPage} /> },
            ],
          },
          { path: 'templates', element: <LazyPage component={PressTemplatesPage} /> },
          { path: 'analytics', element: <LazyPage component={PressAnalyticsPage} /> },
        ],
      },

      // Programs
      {
  path: 'programs',
  children: [
    { index: true, element: <LazyPage component={ProgramsIndexPage} /> },
    { path: 'new', element: <LazyPage component={ProgramBuilderPage} /> },  // ✅ AJOUTÉ
    { path: 'builder', element: <LazyPage component={ProgramBuilderPage} /> },
    { path: 'presets', element: <LazyPage component={ProgramPresetsPage} /> },
    { path: 'calendar', element: <LazyPage component={ProgramCalendarPage} /> },
    { path: 'analytics', element: <LazyPage component={ProgramAnalyticsPage} /> },
    { path: ':id', element: <LazyPage component={ProgramDetailPage} /> },
    { path: ':id/edit', element: <LazyPage component={ProgramBuilderPage} /> },  // ✅ AJOUTÉ pour édition
  ],
},

      // Publishing
      {
        path: 'publishing',
        children: [
          { index: true, element: <LazyPage component={PublishingIndexPage} /> },
          { path: 'platforms', element: <LazyPage component={PublishingPlatformsPage} /> },
          { path: 'endpoints', element: <LazyPage component={PublishingEndpointsPage} /> },
          { path: 'queue', element: <LazyPage component={PublishingQueuePage} /> },
        ],
      },

      // Quality
      {
        path: 'quality',
        children: [
          { index: true, element: <LazyPage component={QualityIndexPage} /> },
          { path: 'checks', element: <LazyPage component={QualityChecksPage} /> },
          { path: 'checks/:checkId', element: <LazyPage component={QualityCheckDetailPage} /> },
          { path: 'categories', element: <LazyPage component={QualityCategoriesPage} /> },
          { path: 'feedback', element: <LazyPage component={QualityFeedbackPage} /> },
          { path: 'golden', element: <LazyPage component={QualityGoldenPage} /> },
          { path: 'training', element: <LazyPage component={QualityTrainingPage} /> },
          { path: 'analytics', element: <LazyPage component={QualityAnalyticsPage} /> },
        ],
      },

      // SEO
      {
        path: 'seo',
        children: [
          { index: true, element: <LazyPage component={SEOIndexPage} /> },
          { path: 'indexing', element: <LazyPage component={SEOIndexingPage} /> },
          { path: 'maillage', element: <LazyPage component={SEOMaillagePage} /> },
          { path: 'redirects', element: <LazyPage component={SEORedirectsPage} /> },
          { path: 'schema', element: <LazyPage component={SEOSchemaPage} /> },
          { path: 'technical', element: <LazyPage component={SEOTechnicalPage} /> },
        ],
      },

      // AI
      {
        path: 'ai',
        children: [
          { index: true, element: <LazyPage component={AIIndexPage} /> },
          { path: 'prompts', element: <LazyPage component={AIPromptsPage} /> },
          { path: 'models', element: <LazyPage component={AIModelsPage} /> },
          { path: 'costs', element: <LazyPage component={AICostsPage} /> },
          { path: 'performance', element: <LazyPage component={AIPerformancePage} /> },
        ],
      },

      // Analytics
      {
        path: 'analytics',
        children: [
          { index: true, element: <LazyPage component={AnalyticsIndexPage} /> },
          { path: 'traffic', element: <LazyPage component={AnalyticsTrafficPage} /> },
          { path: 'conversions', element: <LazyPage component={AnalyticsConversionsPage} /> },
          { path: 'reports', element: <LazyPage component={AnalyticsReportsPage} /> },
          { path: 'benchmarks', element: <LazyPage component={AnalyticsBenchmarksPage} /> },
          { path: 'top-performers', element: <LazyPage component={AnalyticsTopPerformersPage} /> },
        ],
      },

      // Settings
      {
        path: 'settings',
        children: [
          { index: true, element: <LazyPage component={SettingsIndexPage} /> },
          { path: 'automation', element: <LazyPage component={SettingsAutomationPage} /> },
          { path: 'api-keys', element: <LazyPage component={SettingsApiKeysPage} /> },
          { path: 'publication', element: <LazyPage component={SettingsPublicationPage} /> },
          { path: 'images', element: <LazyPage component={SettingsImagesPage} /> },
          {
            path: 'brand',
            children: [
              { index: true, element: <LazyPage component={BrandIndexPage} /> },
              { path: 'style', element: <LazyPage component={BrandStylePage} /> },
              { path: 'prompts', element: <LazyPage component={BrandPromptsPage} /> },
              { path: 'sections', element: <LazyPage component={BrandSectionsPage} /> },
              { path: 'presets', element: <LazyPage component={BrandPresetsPage} /> },
              { path: 'history', element: <LazyPage component={BrandHistoryPage} /> },
              { path: 'compliance', element: <LazyPage component={BrandCompliancePage} /> },
              { path: 'audit', element: <LazyPage component={BrandAuditPage} /> },
            ],
          },
          {
            path: 'knowledge',
            children: [
              { index: true, element: <LazyPage component={KnowledgeIndexPage} /> },
              { path: 'by-type', element: <LazyPage component={KnowledgeByTypePage} /> },
              { path: 'import', element: <LazyPage component={KnowledgeImportPage} /> },
              { path: 'validator', element: <LazyPage component={KnowledgeValidatorPage} /> },
              { path: 'translations', element: <LazyPage component={KnowledgeTranslationsPage} /> },
              { path: 'analytics', element: <LazyPage component={KnowledgeAnalyticsPage} /> },
              { path: ':id', element: <LazyPage component={KnowledgeDetailPage} /> },
            ],
          },
          {
            path: 'templates',
            children: [
              { index: true, element: <LazyPage component={TemplatesIndexPage} /> },
              { path: 'new', element: <LazyPage component={TemplateEditorPage} /> },
              { path: 'import', element: <LazyPage component={TemplateImportPage} /> },
              { path: ':id', element: <LazyPage component={TemplateEditorPage} /> },
            ],
          },
        ],
      },

      // Admin (Protected by role)
      {
        path: 'admin',
        element: <ProtectedRoute requiredRole="admin" />,
        children: [
          { index: true, element: <Navigate to="/admin/users" replace /> },
          { path: 'users', element: <LazyPage component={AdminUsersPage} /> },
          { path: 'roles', element: <LazyPage component={AdminRolesPage} /> },
          { path: 'activity', element: <LazyPage component={AdminActivityPage} /> },
          { path: 'system', element: <LazyPage component={AdminSystemPage} /> },
          { path: 'errors', element: <LazyPage component={AdminErrorsPage} /> },
          { path: 'backups', element: <LazyPage component={AdminBackupsPage} /> },
        ],
      },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Catch-all 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  basename: '/admin',
});

// ============================================================================
// Router Component Export
// ============================================================================

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;