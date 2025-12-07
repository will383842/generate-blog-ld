/**
 * useLanguage Hook
 * Manage current UI language and translations
 * 
 * CORRIGÉ: 9 langues supportées (fr, en, de, es, pt, ru, zh, ar, hi)
 * - Arabe (ar) configuré en RTL
 * - nativeName en caractères natifs pour chaque langue
 */

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage } from './useUtils';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export type SupportedLanguage = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ar' | 'hi';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  script: string;
}

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

// ============================================================================
// Constants - 9 LANGUES SUPPORTÉES
// ============================================================================

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { 
    code: 'fr', 
    name: 'French', 
    nativeName: 'Français', 
    flag: '🇫🇷', 
    direction: 'ltr',
    script: 'Latin'
  },
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇬🇧', 
    direction: 'ltr',
    script: 'Latin'
  },
  { 
    code: 'de', 
    name: 'German', 
    nativeName: 'Deutsch', 
    flag: '🇩🇪', 
    direction: 'ltr',
    script: 'Latin'
  },
  { 
    code: 'es', 
    name: 'Spanish', 
    nativeName: 'Español', 
    flag: '🇪🇸', 
    direction: 'ltr',
    script: 'Latin'
  },
  { 
    code: 'pt', 
    name: 'Portuguese', 
    nativeName: 'Português', 
    flag: '🇵🇹', 
    direction: 'ltr',
    script: 'Latin'
  },
  { 
    code: 'ru', 
    name: 'Russian', 
    nativeName: 'Русский', 
    flag: '🇷🇺', 
    direction: 'ltr',
    script: 'Cyrillic'
  },
  { 
    code: 'zh', 
    name: 'Chinese', 
    nativeName: '中文', 
    flag: '🇨🇳', 
    direction: 'ltr',
    script: 'Han'
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    nativeName: 'العربية', 
    flag: '🇸🇦', 
    direction: 'rtl',  // ✅ RTL pour l'arabe
    script: 'Arabic'
  },
  { 
    code: 'hi', 
    name: 'Hindi', 
    nativeName: 'हिन्दी', 
    flag: '🇮🇳', 
    direction: 'ltr',
    script: 'Devanagari'
  },
];

// Liste des langues RTL
export const RTL_LANGUAGES = SUPPORTED_LANGUAGES
  .filter(lang => lang.direction === 'rtl')
  .map(lang => lang.code);

const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

// ============================================================================
// Translation Cache
// ============================================================================

const translationCache = new Map<SupportedLanguage, TranslationKeys>();

async function loadTranslations(language: SupportedLanguage): Promise<TranslationKeys> {
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    const { data } = await api.get<TranslationKeys>(`/admin/translations/${language}`);
    translationCache.set(language, data);
    return data;
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    return {};
  }
}

// ============================================================================
// Context
// ============================================================================

interface LanguageContextValue {
  language: SupportedLanguage;
  languageInfo: LanguageInfo;
  translations: TranslationKeys;
  isLoading: boolean;
  isRtl: boolean;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ============================================================================
// Provider (to be used in App.tsx)
// ============================================================================

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [storedLanguage, setStoredLanguage] = useLocalStorage<SupportedLanguage>(
    'ce-language',
    DEFAULT_LANGUAGE
  );
  const [translations, setTranslations] = useState<TranslationKeys>({});
  const [isLoading, setIsLoading] = useState(true);

  const languageInfo = SUPPORTED_LANGUAGES.find((l) => l.code === storedLanguage) || SUPPORTED_LANGUAGES[0];
  const isRtl = languageInfo.direction === 'rtl';

  // Load translations when language changes
  useEffect(() => {
    setIsLoading(true);
    loadTranslations(storedLanguage)
      .then(setTranslations)
      .finally(() => setIsLoading(false));
  }, [storedLanguage]);

  // Apply direction to document when language changes
  useEffect(() => {
    document.documentElement.lang = storedLanguage;
    document.documentElement.dir = languageInfo.direction;
    
    // Add/remove RTL class for CSS styling
    if (isRtl) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [storedLanguage, languageInfo.direction, isRtl]);

  // Translation function with interpolation
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: string | TranslationKeys = translations;

      for (const k of keys) {
        if (typeof value === 'object' && value !== null && k in value) {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      // Interpolate params
      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) => str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue)),
          value
        );
      }

      return value;
    },
    [translations]
  );

  const setLanguage = useCallback(
    (language: SupportedLanguage) => {
      setStoredLanguage(language);
    },
    [setStoredLanguage]
  );

  return (
    <LanguageContext.Provider
      value={{
        language: storedLanguage,
        languageInfo,
        translations,
        isLoading,
        isRtl,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    // Fallback for when used outside provider
    return {
      language: DEFAULT_LANGUAGE as SupportedLanguage,
      languageInfo: SUPPORTED_LANGUAGES[0],
      translations: {},
      isLoading: false,
      isRtl: false,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }

  return context;
}

/**
 * Get language info for a specific language code
 */
export function useLanguageInfo(code: SupportedLanguage): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(code: string): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

/**
 * Check if a language is RTL
 */
export function isRtlLanguage(code: string): boolean {
  return RTL_LANGUAGES.includes(code as SupportedLanguage);
}

/**
 * Get browser's preferred language
 */
export function getBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const browserLang = navigator.language.split('-')[0];
  
  if (isLanguageSupported(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get language direction
 */
export function getLanguageDirection(code: string): 'ltr' | 'rtl' {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.direction || 'ltr';
}

/**
 * Get all RTL languages
 */
export function getRtlLanguages(): SupportedLanguage[] {
  return RTL_LANGUAGES as SupportedLanguage[];
}