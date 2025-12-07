import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES, RTL_LANGUAGES, getLanguageDirection } from './languages';

// Import des traductions FR
import commonFr from './locales/fr/common.json';
import navigationFr from './locales/fr/navigation.json';
import dashboardFr from './locales/fr/dashboard.json';
import programsFr from './locales/fr/programs.json';
import generationFr from './locales/fr/generation.json';
import contentFr from './locales/fr/content.json';
import pressFr from './locales/fr/press.json';
import landingsFr from './locales/fr/landings.json';
import coverageFr from './locales/fr/coverage.json';
import qualityFr from './locales/fr/quality.json';
import researchFr from './locales/fr/research.json';
import aiFr from './locales/fr/ai.json';
import seoFr from './locales/fr/seo.json';
import analyticsFr from './locales/fr/analytics.json';
import mediaFr from './locales/fr/media.json';
import publishingFr from './locales/fr/publishing.json';
import settingsFr from './locales/fr/settings.json';
import adminFr from './locales/fr/admin.json';
import errorsFr from './locales/fr/errors.json';

// Import des traductions EN
import commonEn from './locales/en/common.json';
import navigationEn from './locales/en/navigation.json';
import dashboardEn from './locales/en/dashboard.json';
import programsEn from './locales/en/programs.json';
import generationEn from './locales/en/generation.json';
import contentEn from './locales/en/content.json';
import pressEn from './locales/en/press.json';
import landingsEn from './locales/en/landings.json';
import coverageEn from './locales/en/coverage.json';
import qualityEn from './locales/en/quality.json';
import researchEn from './locales/en/research.json';
import aiEn from './locales/en/ai.json';
import seoEn from './locales/en/seo.json';
import analyticsEn from './locales/en/analytics.json';
import mediaEn from './locales/en/media.json';
import publishingEn from './locales/en/publishing.json';
import settingsEn from './locales/en/settings.json';
import adminEn from './locales/en/admin.json';
import errorsEn from './locales/en/errors.json';

// Import des traductions DE
import commonDe from './locales/de/common.json';

// Import des traductions ES
import commonEs from './locales/es/common.json';

// Import des traductions PT
import commonPt from './locales/pt/common.json';

// Import des traductions RU
import commonRu from './locales/ru/common.json';

// Import des traductions ZH
import commonZh from './locales/zh/common.json';

// Import des traductions AR
import commonAr from './locales/ar/common.json';

// Import des traductions HI
import commonHi from './locales/hi/common.json';

export const defaultNS = 'common';
export const namespaces = [
  'common',
  'navigation',
  'dashboard',
  'programs',
  'generation',
  'content',
  'press',
  'landings',
  'coverage',
  'quality',
  'research',
  'ai',
  'seo',
  'analytics',
  'media',
  'publishing',
  'settings',
  'admin',
  'errors'
] as const;

export type Namespace = typeof namespaces[number];

const resources = {
  fr: {
    common: commonFr,
    navigation: navigationFr,
    dashboard: dashboardFr,
    programs: programsFr,
    generation: generationFr,
    content: contentFr,
    press: pressFr,
    landings: landingsFr,
    coverage: coverageFr,
    quality: qualityFr,
    research: researchFr,
    ai: aiFr,
    seo: seoFr,
    analytics: analyticsFr,
    media: mediaFr,
    publishing: publishingFr,
    settings: settingsFr,
    admin: adminFr,
    errors: errorsFr
  },
  en: {
    common: commonEn,
    navigation: navigationEn,
    dashboard: dashboardEn,
    programs: programsEn,
    generation: generationEn,
    content: contentEn,
    press: pressEn,
    landings: landingsEn,
    coverage: coverageEn,
    quality: qualityEn,
    research: researchEn,
    ai: aiEn,
    seo: seoEn,
    analytics: analyticsEn,
    media: mediaEn,
    publishing: publishingEn,
    settings: settingsEn,
    admin: adminEn,
    errors: errorsEn
  },
  de: {
    common: commonDe
  },
  es: {
    common: commonEs
  },
  pt: {
    common: commonPt
  },
  ru: {
    common: commonRu
  },
  zh: {
    common: commonZh
  },
  ar: {
    common: commonAr
  },
  hi: {
    common: commonHi
  }
};

const LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES);

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('admin_language');
    if (stored && LANGUAGE_CODES.includes(stored)) {
      return stored;
    }
    const browserLang = navigator.language.split('-')[0];
    if (LANGUAGE_CODES.includes(browserLang)) {
      return browserLang;
    }
  }
  return 'fr';
};

// Apply RTL direction to document
const applyLanguageDirection = (lang: string) => {
  if (typeof document !== 'undefined') {
    const dir = getLanguageDirection(lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
};

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'fr',
  defaultNS,
  ns: namespaces,
  interpolation: {
    escapeValue: false,
    formatSeparator: ','
  },
  react: {
    useSuspense: false
  }
});

// Apply initial direction
applyLanguageDirection(initialLang);

// Listen for language changes
i18n.on('languageChanged', (lang) => {
  applyLanguageDirection(lang);
});

export type SupportedLanguageCode = keyof typeof resources;

export const changeLanguage = (lang: SupportedLanguageCode) => {
  localStorage.setItem('admin_language', lang);
  i18n.changeLanguage(lang);
};

export { SUPPORTED_LANGUAGES, RTL_LANGUAGES, getLanguageDirection };

export default i18n;