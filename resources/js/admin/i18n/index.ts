/**
 * i18n Configuration
 * Internationalization setup with i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// French translations
import frNavigation from './locales/fr/navigation.json';
import frSeo from './locales/fr/seo.json';
import frPublishing from './locales/fr/publishing.json';
import frSettings from './locales/fr/settings.json';
import frCommon from './locales/fr/common.json';
import frContent from './locales/fr/content.json';
import frPrograms from './locales/fr/programs.json';
import frGeneration from './locales/fr/generation.json';
import frQuality from './locales/fr/quality.json';
import frAnalytics from './locales/fr/analytics.json';
import frAdmin from './locales/fr/admin.json';
import frErrors from './locales/fr/errors.json';

// ============================================================================
// Resources
// ============================================================================

const resources = {
  fr: {
    navigation: frNavigation,
    seo: frSeo,
    publishing: frPublishing,
    settings: frSettings,
    common: frCommon,
    content: frContent,
    programs: frPrograms,
    generation: frGeneration,
    quality: frQuality,
    analytics: frAnalytics,
    admin: frAdmin,
    errors: frErrors,
  },
  // Add other languages here
  // en: { ... },
  // es: { ... },
};

// ============================================================================
// Initialize i18n
// ============================================================================

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: [
      'common',
      'navigation',
      'seo',
      'publishing',
      'settings',
      'content',
      'programs',
      'generation',
      'quality',
      'analytics',
      'admin',
      'errors',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;

// ============================================================================
// Helper Types
// ============================================================================

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function changeLanguage(language: SupportedLanguage): void {
  i18n.changeLanguage(language);
}

export function getCurrentLanguage(): string {
  return i18n.language || 'fr';
}

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.name || code;
}
