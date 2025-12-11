/**
 * Safe formatting utilities to prevent undefined/null errors
 * 
 * These utilities provide safe wrappers around JavaScript's built-in
 * formatting methods, ensuring that undefined or null values don't
 * cause runtime errors.
 * 
 * @fileoverview Formatting utilities for numbers, dates, and currencies
 * @author Williams Jullin
 * @version 1.0.0
 */

/**
 * Safely format a number with locale string
 * 
 * @param value - The number to format (can be undefined or null)
 * @param defaultValue - The default value to use if value is undefined/null (default: 0)
 * @param locale - The locale to use for formatting (default: browser locale)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1000) // "1,000"
 * formatNumber(undefined) // "0"
 * formatNumber(null, -1) // "-1"
 */
export const formatNumber = (
  value: number | undefined | null,
  defaultValue: number = 0,
  locale?: string
): string => {
  return (value ?? defaultValue).toLocaleString(locale);
};

/**
 * Safely format a date with locale string
 * 
 * @param date - The date to format (can be string, Date, undefined, or null)
 * @param defaultValue - The default string to return if date is invalid (default: '-')
 * @param locale - The locale to use for formatting (default: browser locale)
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string or default value
 * 
 * @example
 * formatDate('2024-01-01') // "1/1/2024, 12:00:00 AM"
 * formatDate(undefined) // "-"
 * formatDate(new Date(), '---', 'fr-FR') // "01/01/2024 00:00:00"
 */
export const formatDate = (
  date: string | Date | undefined | null,
  defaultValue: string = '-',
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return defaultValue;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return defaultValue;
    }
    
    return dateObj.toLocaleString(locale, options);
  } catch {
    return defaultValue;
  }
};

/**
 * Safely format a currency value
 * 
 * @param value - The number to format as currency (can be undefined or null)
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param defaultValue - The default value to use if value is undefined/null (default: 0)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1000) // "$1,000.00"
 * formatCurrency(1000, 'EUR', 'fr-FR') // "1 000,00 €"
 * formatCurrency(undefined) // "$0.00"
 */
export const formatCurrency = (
  value: number | undefined | null,
  currency: string = 'USD',
  locale: string = 'en-US',
  defaultValue: number = 0
): string => {
  return (value ?? defaultValue).toLocaleString(locale, {
    style: 'currency',
    currency,
  });
};

/**
 * Safely format a percentage
 * 
 * @param value - The number to format as percentage (can be undefined or null)
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - The locale to use for formatting (default: browser locale)
 * @param defaultValue - The default value to use if value is undefined/null (default: 0)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(0.1234) // "12%"
 * formatPercentage(0.1234, 2) // "12.34%"
 * formatPercentage(undefined) // "0%"
 */
export const formatPercentage = (
  value: number | undefined | null,
  decimals: number = 0,
  locale?: string,
  defaultValue: number = 0
): string => {
  return (value ?? defaultValue).toLocaleString(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Safely format a file size in bytes to human-readable format
 * 
 * @param bytes - The size in bytes (can be undefined or null)
 * @param decimals - Number of decimal places (default: 1)
 * @param defaultValue - The default value to use if bytes is undefined/null (default: 0)
 * @returns Formatted file size string
 * 
 * @example
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 * formatFileSize(undefined) // "0 B"
 */
export const formatFileSize = (
  bytes: number | undefined | null,
  decimals: number = 1,
  defaultValue: number = 0
): string => {
  const value = bytes ?? defaultValue;
  
  if (value === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(value) / Math.log(k));
  
  return `${parseFloat((value / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Safely format a relative time (e.g., "2 hours ago")
 * 
 * @param date - The date to format (can be string, Date, undefined, or null)
 * @param defaultValue - The default string to return if date is invalid (default: '-')
 * @param locale - The locale to use for formatting (default: browser locale)
 * @returns Formatted relative time string or default value
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 * formatRelativeTime(undefined) // "-"
 */
export const formatRelativeTime = (
  date: string | Date | undefined | null,
  defaultValue: string = '-',
  locale?: string
): string => {
  if (!date) return defaultValue;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return defaultValue;
    }
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        return rtf.format(
          diffInSeconds < 0 ? -count : count,
          interval.label as Intl.RelativeTimeFormatUnit
        );
      }
    }
    
    return rtf.format(0, 'second');
  } catch {
    return defaultValue;
  }
};

/**
 * Safely format a compact number (e.g., 1.2K, 1.5M)
 * 
 * @param value - The number to format (can be undefined or null)
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param defaultValue - The default value to use if value is undefined/null (default: 0)
 * @returns Formatted compact number string
 * 
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(undefined) // "0"
 */
export const formatCompactNumber = (
  value: number | undefined | null,
  locale: string = 'en-US',
  defaultValue: number = 0
): string => {
  return (value ?? defaultValue).toLocaleString(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  });
};

/**
 * Safely map over an array, returning empty array if undefined/null
 * 
 * @param array - The array to map (can be undefined or null)
 * @param callback - The mapping function
 * @returns Mapped array or empty array
 * 
 * @example
 * safeMap([1, 2, 3], n => n * 2) // [2, 4, 6]
 * safeMap(undefined, n => n * 2) // []
 */
export const safeMap = <T, R>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => R
): R[] => {
  return (array ?? []).map(callback);
};

/**
 * Safely filter an array, returning empty array if undefined/null
 * 
 * @param array - The array to filter (can be undefined or null)
 * @param predicate - The filter function
 * @returns Filtered array or empty array
 * 
 * @example
 * safeFilter([1, 2, 3], n => n > 1) // [2, 3]
 * safeFilter(undefined, n => n > 1) // []
 */
export const safeFilter = <T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] => {
  return (array ?? []).filter(predicate);
};

/**
 * Type guard to check if a value is defined (not null or undefined)
 * 
 * @param value - The value to check
 * @returns True if value is defined, false otherwise
 * 
 * @example
 * isDefined(123) // true
 * isDefined(null) // false
 * isDefined(undefined) // false
 */
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};
