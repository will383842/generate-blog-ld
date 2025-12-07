/**
 * Color Utilities
 * Helper functions for color manipulation and theming
 */

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
] as const;

export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  pending: '#6b7280',
  processing: '#8b5cf6',
} as const;

export const SCORE_COLORS = {
  excellent: '#10b981', // 90-100
  good: '#22c55e', // 75-89
  average: '#f59e0b', // 60-74
  poor: '#f97316', // 40-59
  critical: '#ef4444', // 0-39
} as const;

export const PLATFORM_COLORS: Record<string, string> = {
  sosexpat: '#1e40af',
  ulysse: '#7c3aed',
  ulixai: '#059669',
  default: '#6b7280',
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Get color for a score value (0-100)
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return SCORE_COLORS.excellent;
  if (score >= 75) return SCORE_COLORS.good;
  if (score >= 60) return SCORE_COLORS.average;
  if (score >= 40) return SCORE_COLORS.poor;
  return SCORE_COLORS.critical;
}

/**
 * Get background color class for a score
 */
export function getScoreBgClass(score: number): string {
  if (score >= 90) return 'bg-green-100 dark:bg-green-900';
  if (score >= 75) return 'bg-green-50 dark:bg-green-950';
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
  if (score >= 40) return 'bg-orange-100 dark:bg-orange-900';
  return 'bg-red-100 dark:bg-red-900';
}

/**
 * Get text color class for a score
 */
export function getScoreTextClass(score: number): string {
  if (score >= 90) return 'text-green-700 dark:text-green-300';
  if (score >= 75) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-700 dark:text-yellow-300';
  if (score >= 40) return 'text-orange-700 dark:text-orange-300';
  return 'text-red-700 dark:text-red-300';
}

/**
 * Get chart color by index (cycles through palette)
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Get platform-specific color
 */
export function getPlatformColor(platformSlug: string): string {
  return PLATFORM_COLORS[platformSlug.toLowerCase()] || PLATFORM_COLORS.default;
}

/**
 * Get status color
 */
export function getStatusColor(status: keyof typeof STATUS_COLORS): string {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

// ============================================================================
// COLOR MANIPULATION
// ============================================================================

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lighten a hex color
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = Math.round(255 * (percent / 100));
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);

  return rgbToHex(r, g, b);
}

/**
 * Darken a hex color
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = Math.round(255 * (percent / 100));
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);

  return rgbToHex(r, g, b);
}

/**
 * Add alpha to a hex color (returns rgba string)
 */
export function addAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Generate gradient colors between two colors
 */
export function generateGradient(startHex: string, endHex: string, steps: number): string[] {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  if (!start || !end) return [startHex];

  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    colors.push(rgbToHex(r, g, b));
  }
  return colors;
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(hex: string): '#000000' | '#ffffff' {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// ============================================================================
// TREND COLORS
// ============================================================================

/**
 * Get color for trend direction
 */
export function getTrendColor(trend: 'up' | 'down' | 'stable', inverted = false): string {
  if (trend === 'stable') return '#6b7280';
  if (inverted) {
    return trend === 'up' ? '#ef4444' : '#10b981';
  }
  return trend === 'up' ? '#10b981' : '#ef4444';
}

/**
 * Get CSS class for trend
 */
export function getTrendClass(trend: 'up' | 'down' | 'stable', inverted = false): string {
  if (trend === 'stable') return 'text-gray-500';
  if (inverted) {
    return trend === 'up' ? 'text-red-500' : 'text-green-500';
  }
  return trend === 'up' ? 'text-green-500' : 'text-red-500';
}

export default {
  CHART_COLORS,
  STATUS_COLORS,
  SCORE_COLORS,
  PLATFORM_COLORS,
  getScoreColor,
  getScoreBgClass,
  getScoreTextClass,
  getChartColor,
  getPlatformColor,
  getStatusColor,
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  addAlpha,
  generateGradient,
  getContrastColor,
  getTrendColor,
  getTrendClass,
};
