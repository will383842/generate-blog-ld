/**
 * Hooks
 * Export all custom hooks
 */

// ============================================================================
// API & Data Fetching
// ============================================================================

export {
  useApi,
  useApiQuery,
  useApiMutation,
  useApiInfinite,
  useApiGet,
  useApiPost,
  useApiPut,
  useApiPatch,
  useApiDelete,
  type PaginatedResponse,
} from './useApi';

// ============================================================================
// Global Stats & Monitoring
// ============================================================================

export {
  useGlobalStats,
  useGenerationStats,
  useTranslationStats,
  usePublishingStats,
  useIndexingStats,
  useProgramStats,
  useAlerts,
  useProgressStats,
  useTodayStats,
  useWeeklyTrend,
} from './useGlobalStats';

// ============================================================================
// Activity & Logging
// ============================================================================

export {
  useActivities,
  useRecentActivities,
  useActivityStats,
  useLogActivity,
  useActivityLogger,
  activityKeys,
  type Activity,
  type ActivityType,
  type ActivityFilters,
  type ActivityStats,
} from './useActivity';

export {
  useActivityStream,
  type ActivityStreamOptions,
  type ActivityStreamState,
} from './useActivityStream';

// ============================================================================
// Analytics
// ============================================================================

export {
  useAnalyticsDashboard,
  useTrafficData,
  useConversionsData,
  useTopPerformers,
  useBenchmarks,
  useReports as useAnalyticsReports,
  useCreateReport as useCreateAnalyticsReport,
  useScheduleReport as useScheduleAnalyticsReport,
  useDeleteReport as useDeleteAnalyticsReport,
  useGenerateReport as useGenerateAnalyticsReport,
  useExportAnalytics,
  analyticsKeys,
} from './useAnalytics';

// ============================================================================
// API Keys
// ============================================================================

export {
  useApiKeys,
  useApiKeyUsage,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
  useRotateApiKey,
  useValidateApiKey,
  useApiKeyForService,
  useHasApiKey,
  apiKeyKeys,
  type ApiKey,
  type ApiService,
  type ApiKeyUsage,
} from './useApiKeys';

// ============================================================================
// Articles
// ============================================================================

export { useArticles } from './useArticles';

// ============================================================================
// Authentication
// ============================================================================

export { useAuth } from './useAuth';

// ============================================================================
// Automation
// ============================================================================

export { useAutomationSettings } from './useAutomationSettings';

// ============================================================================
// Brand Validation
// ============================================================================

export { useBrandValidation } from './useBrandValidation';

// ============================================================================
// Comparatives
// ============================================================================

export { useComparatives } from './useComparatives';

// ============================================================================
// Countries & Coverage
// ============================================================================

export { useCountries } from './useCountries';
export { useCoverage } from './useCoverage';

// ============================================================================
// DALL-E & Media
// ============================================================================

export { useDalle } from './useDalle';
export { useMedia } from './useMedia';
export { useUnsplash } from './useUnsplash';

// ============================================================================
// Dossiers
// ============================================================================

export { useDossiers } from './useDossiers';

// ============================================================================
// Export
// ============================================================================

export { useExport } from './useExport';

// ============================================================================
// Fact Checking
// ============================================================================

export {
  useFactCheckResult,
  useFactCheckHistory,
  useRunFactCheck,
  useUpdateClaimVerdict,
  useFactCheckSettings,
  useUpdateFactCheckSettings,
  getVerdictColor,
  getVerdictLabel,
  factCheckKeys,
  type FactCheckResult,
  type FactCheckStatus,
  type FactCheckClaim,
  type ClaimVerdict,
  type FactCheckSource,
} from './useFactCheck';

// ============================================================================
// Feedback
// ============================================================================

export { useFeedback } from './useFeedback';

// ============================================================================
// Generation
// ============================================================================

export { useGeneration } from './useGeneration';

// ============================================================================
// Golden Examples
// ============================================================================

export { useGoldenExamples } from './useGoldenExamples';

// ============================================================================
// Indexing
// ============================================================================

export { useIndexing } from './useIndexing';
export { useIndexingQueue } from './useIndexingQueue';

// ============================================================================
// Landings
// ============================================================================

export { useLandings } from './useLandings';

// ============================================================================
// Language & Translations
// ============================================================================

export {
  useLanguage,
  useLanguageInfo,
  isLanguageSupported,
  getBrowserLanguage,
  LanguageProvider,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type LanguageInfo,
} from './useLanguage';

export { useLanguages } from './useLanguages';

// ============================================================================
// Manual Titles
// ============================================================================

export { useManualTitles } from './useManualTitles';

// ============================================================================
// Monitoring
// ============================================================================

export { useMonitoring } from './useMonitoring';

// ============================================================================
// Pillars
// ============================================================================

export { usePillars } from './usePillars';

// ============================================================================
// Platform
// ============================================================================

export {
  usePlatforms,
  usePlatform,
  useCreatePlatform,
  useUpdatePlatform,
  useDeletePlatform,
  useCurrentPlatform,
  usePlatformBySlug,
  useActivePlatforms,
  platformKeys,
  type Platform,
  type PlatformSettings,
  type PlatformStats,
} from './usePlatform';

export { usePlatformKnowledge } from './usePlatformKnowledge';
export { usePlatformStats } from './usePlatformStats';

// ============================================================================
// Presets
// ============================================================================

export { usePresets } from './usePresets';

// ============================================================================
// Press
// ============================================================================

export { usePressReleases } from './usePressReleases';

// ============================================================================
// Programs
// ============================================================================

export { usePrograms } from './usePrograms';

// ============================================================================
// Publication Queue
// ============================================================================

export { usePublicationQueue } from './usePublicationQueue';
export { usePublishing } from './usePublishing';

// ============================================================================
// Quality
// ============================================================================

export { useQuality } from './useQuality';

// ============================================================================
// Queue Management
// ============================================================================

export {
  useQueue,
  useQueueStats,
  useQueueConfig,
  useJob,
  useCancelJob,
  useRetryJob,
  usePriorityJob,
  usePauseQueue,
  useResumeQueue,
  useClearCompleted,
  useBulkCancelJobs,
  useBulkRetryJobs,
  useUpdateQueueConfig,
  usePendingJobsCount,
  useIsQueuePaused,
  useQueueETA,
  queueKeys,
} from './useQueue';

export {
  useQueueRealtime,
  useJobProgress,
  useRealtimeQueueStats,
  type QueueRealtimeOptions,
  type QueueRealtimeState,
  type QueueEventType,
  type QueueEvent,
} from './useQueueRealtime';

// ============================================================================
// Realtime Stats
// ============================================================================

export { useRealtimeStats } from './useRealtimeStats';

// ============================================================================
// Reports
// ============================================================================

export {
  useReports,
  useReport,
  useReportTemplates,
  useCreateReport,
  useGenerateReport,
  useDeleteReport,
  useScheduleReport,
  useUnscheduleReport,
  useDownloadReport,
  useScheduledReports,
  reportKeys,
  type Report,
  type ReportType,
  type ReportFormat,
  type ReportStatus,
  type ReportSchedule,
  type ReportTemplate,
} from './useReports';

// ============================================================================
// Research
// ============================================================================

export { useResearch } from './useResearch';

// ============================================================================
// Roles & Permissions
// ============================================================================

export {
  useRoles,
  useRole,
  usePermissions,
  usePermissionsByCategory,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRoles,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useCurrentPermissions,
  roleKeys,
  type Role,
  type Permission,
  type PermissionCategory,
} from './useRoles';

// ============================================================================
// SEO
// ============================================================================

export { useSeo } from './useSeo';

// ============================================================================
// Settings
// ============================================================================

export { useSettings } from './useSettings';

// ============================================================================
// Stats
// ============================================================================

export { useStats } from './useStats';

// ============================================================================
// System
// ============================================================================

export { useSystem } from './useSystem';

// ============================================================================
// Templates
// ============================================================================

export { useTemplates } from './useTemplates';

// ============================================================================
// Themes
// ============================================================================

export { useThemes } from './useThemes';

// ============================================================================
// Toast
// ============================================================================

export { useToast } from './useToast';

// ============================================================================
// Users
// ============================================================================

export { useUsers } from './useUsers';

// ============================================================================
// Utility Hooks
// ============================================================================

export {
  useDebounce,
  usePersistedState,
  useFavorites,
  useRecentSearches,
  useLocalStorage,
  useSidebarState,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useOnlineStatus,
  usePrevious,
  useClickOutside,
} from './useUtils';

// ============================================================================
// Webhooks
// ============================================================================

export { useWebhooks } from './useWebhooks';

// ============================================================================
// Automation
// ============================================================================

export { useAutomation } from './useAutomation';
