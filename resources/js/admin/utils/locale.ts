/**
 * Locale Helpers
 * Utilities for locale formatting (fr-DE, ar-AE, etc.)
 * 
 * À ajouter dans: resources/js/admin/utils/locale.ts
 */

import { LANGUAGES } from './constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Locale {
  code: string;       // "fr-DE"
  language: string;   // "fr"
  country: string;    // "DE"
}

export interface LocaleDisplay {
  code: string;       // "fr-DE"
  label: string;      // "🇫🇷 Français - 🇩🇪 Allemagne"
  shortLabel: string; // "🇫🇷 fr-DE"
  isRTL: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combine language and country into locale code
 * @example formatLocale('fr', 'DE') => 'fr-DE'
 */
export function formatLocale(languageCode: string, countryCode: string): string {
  return `${languageCode.toLowerCase()}-${countryCode.toUpperCase()}`;
}

/**
 * Parse locale code into components
 * @example parseLocale('fr-DE') => { language: 'fr', country: 'DE' }
 */
export function parseLocale(locale: string): Locale | null {
  const match = locale.match(/^([a-z]{2})-([A-Z]{2})$/i);
  if (!match) return null;
  
  return {
    code: locale,
    language: match[1].toLowerCase(),
    country: match[2].toUpperCase(),
  };
}

/**
 * Get language info from code
 */
export function getLanguageInfo(code: string) {
  return LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase());
}

/**
 * Check if locale is RTL (Right-to-Left)
 */
export function isRTLLocale(languageCode: string): boolean {
  const lang = getLanguageInfo(languageCode);
  return lang?.dir === 'rtl';
}

/**
 * Format locale for display with flags
 * @example formatLocaleDisplay('fr', 'DE', countryName) => "🇫🇷 fr-DE (Allemagne)"
 */
export function formatLocaleDisplay(
  languageCode: string, 
  countryCode: string, 
  countryName?: string
): string {
  const lang = getLanguageInfo(languageCode);
  const flag = lang?.flag || '🌐';
  const locale = formatLocale(languageCode, countryCode);
  
  if (countryName) {
    return `${flag} ${locale} (${countryName})`;
  }
  return `${flag} ${locale}`;
}

/**
 * Format locale as badge label
 * @example formatLocaleBadge('fr', 'DE') => "🇫🇷 fr-DE"
 */
export function formatLocaleBadge(languageCode: string, countryCode: string): string {
  const lang = getLanguageInfo(languageCode);
  const flag = lang?.flag || '🌐';
  return `${flag} ${formatLocale(languageCode, countryCode)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SLUG HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate slug with locale prefix
 * @example generateLocalizedSlug('Mon Article', 'fr', 'DE') => 'fr-de/mon-article'
 */
export function generateLocalizedSlug(
  title: string, 
  languageCode: string, 
  countryCode: string
): string {
  // Simple slugify
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const locale = formatLocale(languageCode, countryCode).toLowerCase();
  return `${locale}/${slug}`;
}

/**
 * Extract locale from URL path
 * @example extractLocaleFromPath('/fr-de/mon-article') => { locale: 'fr-DE', slug: 'mon-article' }
 */
export function extractLocaleFromPath(path: string): { locale: string | null; slug: string } {
  const match = path.match(/^\/?([a-z]{2}-[a-z]{2})\/(.+)$/i);
  
  if (match) {
    return {
      locale: formatLocale(match[1].split('-')[0], match[1].split('-')[1]),
      slug: match[2],
    };
  }
  
  return { locale: null, slug: path.replace(/^\//, '') };
}

/**
 * Build full URL with locale
 * @example buildLocalizedUrl('https://sos-expat.com', 'fr', 'DE', 'mon-article') 
 *          => 'https://sos-expat.com/fr-de/mon-article'
 */
export function buildLocalizedUrl(
  baseUrl: string,
  languageCode: string,
  countryCode: string,
  slug: string
): string {
  const locale = formatLocale(languageCode, countryCode).toLowerCase();
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanSlug = slug.replace(/^\//, '');
  
  return `${cleanBase}/${locale}/${cleanSlug}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate all locale combinations from countries and languages
 */
export function generateLocaleCombinations(
  countries: string[],
  languages: string[]
): Locale[] {
  const locales: Locale[] = [];
  
  for (const country of countries) {
    for (const language of languages) {
      locales.push({
        code: formatLocale(language, country),
        language,
        country,
      });
    }
  }
  
  return locales;
}

/**
 * Group locales by country
 */
export function groupLocalesByCountry(locales: Locale[]): Record<string, Locale[]> {
  return locales.reduce((acc, locale) => {
    if (!acc[locale.country]) {
      acc[locale.country] = [];
    }
    acc[locale.country].push(locale);
    return acc;
  }, {} as Record<string, Locale[]>);
}

/**
 * Group locales by language
 */
export function groupLocalesByLanguage(locales: Locale[]): Record<string, Locale[]> {
  return locales.reduce((acc, locale) => {
    if (!acc[locale.language]) {
      acc[locale.language] = [];
    }
    acc[locale.language].push(locale);
    return acc;
  }, {} as Record<string, Locale[]>);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  formatLocale,
  parseLocale,
  formatLocaleDisplay,
  formatLocaleBadge,
  isRTLLocale,
  generateLocalizedSlug,
  extractLocaleFromPath,
  buildLocalizedUrl,
  generateLocaleCombinations,
  groupLocalesByCountry,
  groupLocalesByLanguage,
};
