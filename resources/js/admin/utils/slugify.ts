/**
 * Slugify Utilities
 * Functions for generating URL-friendly slugs from text
 */

// ============================================================================
// CHARACTER MAPS
// ============================================================================

/**
 * Map of special characters to their ASCII equivalents
 */
const CHAR_MAP: Record<string, string> = {
  // Latin
  'a': 'a', 'A': 'A',
  'e': 'e', 'E': 'E',
  'i': 'i', 'I': 'I',
  'o': 'o', 'O': 'O',
  'u': 'u', 'U': 'U',
  // French
  'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a', 'ae': 'ae',
  'c': 'c', 'C': 'C',
  'e': 'e', 'e': 'e', 'e': 'e', 'e': 'e',
  'i': 'i', 'i': 'i',
  'o': 'o', 'o': 'o', 'oe': 'oe',
  'u': 'u', 'u': 'u', 'u': 'u',
  'y': 'y',
  // German
  'ae': 'ae', 'Ae': 'Ae',
  'oe': 'oe', 'Oe': 'Oe',
  'ue': 'ue', 'Ue': 'Ue',
  'ss': 'ss',
  // Spanish
  'n': 'n', 'N': 'N',
  // Portuguese
  'a': 'a', 'o': 'o',
  // Symbols
  '&': 'et',
  '@': 'at',
  '#': '',
  '$': '',
  '%': 'pct',
  '+': 'plus',
  '=': 'egal',
};

/**
 * Unicode to ASCII mapping for accented characters
 */
const ACCENT_MAP: Record<string, string> = {
  // Lowercase
  '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a', '\u00e4': 'a', '\u00e5': 'a',
  '\u00e6': 'ae',
  '\u00e7': 'c',
  '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e',
  '\u00ec': 'i', '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
  '\u00f0': 'd',
  '\u00f1': 'n',
  '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o', '\u00f6': 'o', '\u00f8': 'o',
  '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u',
  '\u00fd': 'y', '\u00ff': 'y',
  '\u00fe': 'th',
  '\u0153': 'oe',
  '\u0161': 's',
  '\u017e': 'z',
  // Uppercase
  '\u00c0': 'A', '\u00c1': 'A', '\u00c2': 'A', '\u00c3': 'A', '\u00c4': 'A', '\u00c5': 'A',
  '\u00c6': 'AE',
  '\u00c7': 'C',
  '\u00c8': 'E', '\u00c9': 'E', '\u00ca': 'E', '\u00cb': 'E',
  '\u00cc': 'I', '\u00cd': 'I', '\u00ce': 'I', '\u00cf': 'I',
  '\u00d0': 'D',
  '\u00d1': 'N',
  '\u00d2': 'O', '\u00d3': 'O', '\u00d4': 'O', '\u00d5': 'O', '\u00d6': 'O', '\u00d8': 'O',
  '\u00d9': 'U', '\u00da': 'U', '\u00db': 'U', '\u00dc': 'U',
  '\u00dd': 'Y',
  '\u00de': 'TH',
  '\u0152': 'OE',
  '\u0160': 'S',
  '\u017d': 'Z',
};

// ============================================================================
// SLUGIFY OPTIONS
// ============================================================================

export interface SlugifyOptions {
  /** Separator between words (default: '-') */
  separator?: string;
  /** Convert to lowercase (default: true) */
  lowercase?: boolean;
  /** Remove special characters (default: true) */
  strict?: boolean;
  /** Maximum length (default: unlimited) */
  maxLength?: number;
  /** Trim separator from start/end (default: true) */
  trim?: boolean;
  /** Custom character replacements */
  customReplacements?: Record<string, string>;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  const {
    separator = '-',
    lowercase = true,
    strict = true,
    maxLength,
    trim = true,
    customReplacements = {},
  } = options;

  let slug = text;

  // Apply custom replacements first
  for (const [from, to] of Object.entries(customReplacements)) {
    slug = slug.replace(new RegExp(from, 'g'), to);
  }

  // Replace accented characters
  slug = removeAccents(slug);

  // Replace special characters
  for (const [from, to] of Object.entries(CHAR_MAP)) {
    slug = slug.replace(new RegExp(from, 'g'), to);
  }

  // Convert to lowercase if needed
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Replace spaces and special chars with separator
  if (strict) {
    slug = slug
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove non-alphanumeric
      .replace(/\s+/g, separator) // Replace spaces
      .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove duplicate separators
  } else {
    slug = slug
      .replace(/\s+/g, separator)
      .replace(new RegExp(`${separator}+`, 'g'), separator);
  }

  // Trim separator from ends
  if (trim) {
    slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
  }

  // Limit length
  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Don't cut in the middle of a word
    const lastSeparator = slug.lastIndexOf(separator);
    if (lastSeparator > maxLength * 0.75) {
      slug = slug.substring(0, lastSeparator);
    }
    // Remove trailing separator
    slug = slug.replace(new RegExp(`${separator}+$`, 'g'), '');
  }

  return slug;
}

/**
 * Remove accents from a string
 */
export function removeAccents(text: string): string {
  let result = text;
  for (const [accented, plain] of Object.entries(ACCENT_MAP)) {
    result = result.replace(new RegExp(accented, 'g'), plain);
  }
  // Fallback using normalize for any remaining characters
  return result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function uniqueSlug(
  text: string,
  existingSlugs: string[],
  options: SlugifyOptions = {}
): string {
  const baseSlug = slugify(text, options);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlugValue = `${baseSlug}${options.separator || '-'}${counter}`;

  while (existingSlugs.includes(uniqueSlugValue)) {
    counter++;
    uniqueSlugValue = `${baseSlug}${options.separator || '-'}${counter}`;
  }

  return uniqueSlugValue;
}

/**
 * Generate slug from title with smart truncation
 */
export function titleToSlug(title: string, maxLength = 60): string {
  return slugify(title, {
    maxLength,
    lowercase: true,
    strict: true,
  });
}

/**
 * Generate a URL-safe filename
 */
export function filenameSlug(filename: string): string {
  // Extract extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot) : '';

  return slugify(name, {
    lowercase: true,
    strict: true,
    maxLength: 100,
  }) + ext.toLowerCase();
}

/**
 * Convert camelCase or PascalCase to slug
 */
export function camelToSlug(text: string, separator = '-'): string {
  return text
    .replace(/([a-z])([A-Z])/g, `$1${separator}$2`)
    .replace(/([A-Z])([A-Z][a-z])/g, `$1${separator}$2`)
    .toLowerCase();
}

/**
 * Convert slug to Title Case
 */
export function slugToTitle(slug: string, separator = '-'): string {
  return slug
    .split(separator)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert slug to camelCase
 */
export function slugToCamel(slug: string, separator = '-'): string {
  return slug
    .split(separator)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

/**
 * Convert slug to PascalCase
 */
export function slugToPascal(slug: string, separator = '-'): string {
  return slug
    .split(separator)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Validate if a string is a valid slug
 */
export function isValidSlug(text: string, separator = '-'): boolean {
  const regex = new RegExp(`^[a-z0-9]+(?:${separator}[a-z0-9]+)*$`);
  return regex.test(text);
}

export default {
  slugify,
  removeAccents,
  uniqueSlug,
  titleToSlug,
  filenameSlug,
  camelToSlug,
  slugToTitle,
  slugToCamel,
  slugToPascal,
  isValidSlug,
};
