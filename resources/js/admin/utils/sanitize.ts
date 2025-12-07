/**
 * HTML Sanitization Utilities
 * Uses DOMPurify for XSS-safe HTML rendering
 */
import DOMPurify from 'dompurify';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default DOMPurify config for rich text content
 * Allows common formatting but blocks dangerous elements
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'mark', 'small', 'abbr', 'code', 'pre', 'kbd', 'samp', 'var',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Links and media
    'a', 'img', 'figure', 'figcaption', 'picture', 'source',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Structure
    'div', 'article', 'section', 'aside', 'header', 'footer', 'nav', 'main',
    'blockquote', 'q', 'cite', 'hr', 'address', 'details', 'summary',
  ],
  ALLOWED_ATTR: [
    // Global attributes
    'id', 'class', 'style', 'title', 'lang', 'dir', 'data-*',
    // Links
    'href', 'target', 'rel',
    // Images
    'src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading',
    // Tables
    'colspan', 'rowspan', 'scope', 'headers',
    // Media
    'type', 'media',
    // Accessibility
    'role', 'aria-*', 'tabindex',
  ],
  // Security settings
  ALLOW_DATA_ATTR: true,
  ALLOW_ARIA_ATTR: true,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // Force safe links
  ADD_ATTR: ['target'],
};

/**
 * Strict config for user-generated content (comments, etc.)
 */
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'img'],
};

/**
 * Plain text only - strips all HTML
 */
const TEXT_ONLY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize HTML for rich text content (TipTap, articles, etc.)
 */
export function sanitizeHtml(html: string, config?: DOMPurify.Config): string {
  return DOMPurify.sanitize(html, config || DEFAULT_CONFIG);
}

/**
 * Sanitize HTML with strict rules for user-generated content
 */
export function sanitizeUserContent(html: string): string {
  return DOMPurify.sanitize(html, STRICT_CONFIG);
}

/**
 * Strip all HTML and return plain text
 */
export function sanitizeToText(html: string): string {
  return DOMPurify.sanitize(html, TEXT_ONLY_CONFIG);
}

/**
 * Sanitize HTML and ensure external links have proper attributes
 */
export function sanitizeWithSafeLinks(html: string): string {
  // First sanitize
  const clean = sanitizeHtml(html);

  // Then fix external links
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  const links = doc.querySelectorAll('a[href]');

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    // Check if external link
    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return doc.body.innerHTML;
}

// ============================================================================
// Hook for DOMPurify Configuration
// ============================================================================

/**
 * Add a hook to DOMPurify for custom processing
 */
export function addSanitizeHook(
  hookName: DOMPurify.HookName,
  callback: DOMPurify.HookEvent
): void {
  DOMPurify.addHook(hookName, callback);
}

/**
 * Remove all hooks
 */
export function removeAllHooks(): void {
  DOMPurify.removeAllHooks();
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if HTML contains potentially dangerous content
 */
export function containsDangerousHtml(html: string): boolean {
  const dangerous = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /data:text\/html/i,
  ];

  return dangerous.some((pattern) => pattern.test(html));
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(url: string): string {
  // Remove any javascript: or data: URLs
  const sanitized = url.trim();

  if (
    sanitized.toLowerCase().startsWith('javascript:') ||
    sanitized.toLowerCase().startsWith('data:text/html') ||
    sanitized.toLowerCase().startsWith('vbscript:')
  ) {
    return '#';
  }

  return sanitized;
}

// ============================================================================
// Export Default Instance
// ============================================================================

export default {
  sanitize: sanitizeHtml,
  sanitizeStrict: sanitizeUserContent,
  toText: sanitizeToText,
  withSafeLinks: sanitizeWithSafeLinks,
  sanitizeUrl,
  containsDangerous: containsDangerousHtml,
  addHook: addSanitizeHook,
  removeAllHooks,
};
