import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import SuspenseLayout from '@/layouts/SuspenseLayout';

// Lazy load pages
const SettingsCountriesPage = lazy(() => import('@/pages/settings/Countries'));
const SettingsPlatformsPage = lazy(() => import('@/pages/settings/Platforms'));
const SettingsNotificationsPage = lazy(() => import('@/pages/settings/Notifications'));

const AdminWorkersPage = lazy(() => import('@/pages/admin/Workers'));

const CoverageIndexPage = lazy(() => import('@/pages/coverage/index'));
const CoverageCountriesPage = lazy(() => import('@/pages/coverage/Countries'));
const CoverageLanguagesPage = lazy(() => import('@/pages/coverage/Languages'));
const CoverageFiltersPage = lazy(() => import('@/pages/coverage/Filters'));
const IntelligentDashboardPage = lazy(() => import('@/pages/coverage/IntelligentDashboard'));
const IntelligentCountryDetailsPage = lazy(() => import('@/pages/coverage/IntelligentCountryDetails'));

const SEOPerformancePage = lazy(() => import('@/pages/seo/Performance'));

const AnalyticsTrendsPage = lazy(() => import('@/pages/analytics/Trends'));
const AnalyticsCostsPage = lazy(() => import('@/pages/analytics/Costs'));

const LiveIndexPage = lazy(() => import('@/pages/live/index'));
const LiveGenerationPage = lazy(() => import('@/pages/live/Generation'));
const LiveTranslationPage = lazy(() => import('@/pages/live/Translation'));
const LivePublishingPage = lazy(() => import('@/pages/live/Publishing'));
const LiveIndexingPage = lazy(() => import('@/pages/live/Indexing'));
const LiveAlertsPage = lazy(() => import('@/pages/live/Alerts'));

const ProfileIndexPage = lazy(() => import('@/pages/profile/index'));
const ProfileSecurityPage = lazy(() => import('@/pages/profile/Security'));
const ProfilePreferencesPage = lazy(() => import('@/pages/profile/Preferences'));
const ProfileSessionsPage = lazy(() => import('@/pages/profile/Sessions'));

export const routes = [
  {
    path: 'settings',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <Navigate to="countries" replace /> },
      { path: 'countries', element: <SettingsCountriesPage /> },
      { path: 'platforms', element: <SettingsPlatformsPage /> },
      { path: 'notifications', element: <SettingsNotificationsPage /> },
    ],
  },
  {
    path: 'admin',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <Navigate to="workers" replace /> },
      { path: 'workers', element: <AdminWorkersPage /> },
    ],
  },
  {
    path: 'coverage',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <CoverageIndexPage /> },
      { path: 'countries', element: <CoverageCountriesPage /> },
      { path: 'languages', element: <CoverageLanguagesPage /> },
      { path: 'filters', element: <CoverageFiltersPage /> },
      { path: 'intelligent', element: <IntelligentDashboardPage /> },
      { path: 'countries/:id', element: <IntelligentCountryDetailsPage /> },
    ],
  },
  {
    path: 'seo',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <Navigate to="performance" replace /> },
      { path: 'performance', element: <SEOPerformancePage /> },
    ],
  },
  {
    path: 'analytics',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <Navigate to="trends" replace /> },
      { path: 'trends', element: <AnalyticsTrendsPage /> },
      { path: 'costs', element: <AnalyticsCostsPage /> },
    ],
  },
  {
    path: 'live',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <LiveIndexPage /> },
      { path: 'generation', element: <LiveGenerationPage /> },
      { path: 'translation', element: <LiveTranslationPage /> },
      { path: 'publishing', element: <LivePublishingPage /> },
      { path: 'indexing', element: <LiveIndexingPage /> },
      { path: 'alerts', element: <LiveAlertsPage /> },
    ],
  },
  {
    path: 'profile',
    element: <SuspenseLayout />,
    children: [
      { index: true, element: <ProfileIndexPage /> },
      { path: 'security', element: <ProfileSecurityPage /> },
      { path: 'preferences', element: <ProfilePreferencesPage /> },
      { path: 'sessions', element: <ProfileSessionsPage /> },
    ],
  },
];
