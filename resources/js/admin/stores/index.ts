// Auth
export { useAuthStore } from './authStore';

// Platform
export { usePlatformStore } from './platformStore';

// UI
export { useUIStore, useModal } from './uiStore';
// Note: useToast is in hooks/useToast.ts

// Drafts
export {
  useDraftStore,
  useAutoSave,
  useDraftRecovery,
  useProgramDrafts,
  useArticleDrafts,
  useSettingsDrafts,
  useTemplateDrafts,
  usePromptDrafts,
  type DraftType,
  type Draft,
  type DraftMetadata,
} from './draftStore';

// Filters
export {
  useFiltersStore,
  useArticleFilters,
  useProgramFilters,
  useQueueFilters,
  usePublicationFilters,
  useMediaFilters,
  useUserFilters,
  useLogFilters,
  useFilterPresets,
  type ArticleFilters,
  type ProgramFilters,
  type QueueFilters,
  type PublicationFilters,
  type MediaFilters,
  type UserFilters,
  type LogFilters,
  type FilterPreset,
  type PageFilterKey,
} from './filtersStore';

// Notifications
export {
  useNotificationStore,
  notify,
  useNotifications,
  useUnreadCount,
  useUnreadNotifications,
  type NotificationType,
  type NotificationCategory,
  type Notification,
  type CreateNotificationInput,
} from './notificationStore';