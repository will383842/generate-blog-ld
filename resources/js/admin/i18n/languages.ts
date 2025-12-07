/**
 * Language Configuration
 * Defines all supported languages with their properties
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  dateLocale: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
    dateLocale: 'fr',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    dateLocale: 'en-US',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
    dateLocale: 'de',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
    dateLocale: 'es',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    dir: 'ltr',
    dateLocale: 'pt',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr',
    dateLocale: 'ru',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    dir: 'ltr',
    dateLocale: 'zh-CN',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
    dateLocale: 'ar-SA',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
    dateLocale: 'hi',
  },
};

export const RTL_LANGUAGES = Object.values(SUPPORTED_LANGUAGES)
  .filter((lang) => lang.dir === 'rtl')
  .map((lang) => lang.code);

export const LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES);

export function isRtlLanguage(code: string): boolean {
  return RTL_LANGUAGES.includes(code);
}

export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES[code];
}

export function getLanguageDirection(code: string): 'ltr' | 'rtl' {
  return SUPPORTED_LANGUAGES[code]?.dir || 'ltr';
}
