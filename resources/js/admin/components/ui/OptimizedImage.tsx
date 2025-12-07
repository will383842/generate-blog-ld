/**
 * OptimizedImage Component
 * Provides lazy loading, responsive images, and fallback support
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ImageSize {
  width: number;
  suffix?: string;
}

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Aspect ratio (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Object fit behavior */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Placeholder to show while loading */
  placeholder?: 'blur' | 'skeleton' | 'none';
  /** Blur data URL for blur placeholder */
  blurDataUrl?: string;
  /** Fallback component or URL when image fails to load */
  fallback?: React.ReactNode | string;
  /** Responsive sizes for srcset generation */
  sizes?: string;
  /** Image widths for srcset generation */
  srcSetWidths?: number[];
  /** Callback when image loads successfully */
  onLoadComplete?: () => void;
  /** Callback when image fails to load */
  onLoadError?: () => void;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate srcset string from base URL and widths
 */
function generateSrcSet(src: string, widths: number[]): string {
  // If src contains query params or is a data URL, skip srcset
  if (src.startsWith('data:') || src.includes('?')) {
    return '';
  }

  // Try to generate srcset for common image services
  const lastDotIndex = src.lastIndexOf('.');
  if (lastDotIndex === -1) return '';

  const basePath = src.substring(0, lastDotIndex);
  const extension = src.substring(lastDotIndex);

  return widths
    .map((width) => `${basePath}-${width}w${extension} ${width}w`)
    .join(', ');
}

/**
 * Get placeholder style based on type
 */
function getPlaceholderStyle(
  type: 'blur' | 'skeleton' | 'none',
  blurDataUrl?: string
): React.CSSProperties {
  if (type === 'blur' && blurDataUrl) {
    return {
      backgroundImage: `url(${blurDataUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'blur(20px)',
      transform: 'scale(1.1)',
    };
  }
  return {};
}

// ============================================================================
// Component
// ============================================================================

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      className,
      aspectRatio,
      objectFit = 'cover',
      lazy = true,
      placeholder = 'skeleton',
      blurDataUrl,
      fallback,
      sizes,
      srcSetWidths,
      onLoadComplete,
      onLoadError,
      rootMargin = '200px',
      threshold = 0.1,
      style,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(!lazy);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Merge refs
    const setRefs = (element: HTMLImageElement | null) => {
      imgRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (!lazy || isInView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin, threshold }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [lazy, isInView, rootMargin, threshold]);

    // Handle image load
    const handleLoad = () => {
      setIsLoaded(true);
      setHasError(false);
      onLoadComplete?.();
    };

    // Handle image error
    const handleError = () => {
      setHasError(true);
      setIsLoaded(true);
      onLoadError?.();
    };

    // Generate srcset if widths provided
    const srcSet = srcSetWidths ? generateSrcSet(src, srcSetWidths) : undefined;

    // Aspect ratio style
    const aspectRatioStyle: React.CSSProperties = aspectRatio
      ? { aspectRatio }
      : {};

    // Object fit classes
    const objectFitClasses = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill',
      none: 'object-none',
      'scale-down': 'object-scale-down',
    };

    // Render fallback
    if (hasError) {
      if (typeof fallback === 'string') {
        return (
          <div
            ref={containerRef}
            className={cn('relative overflow-hidden', className)}
            style={{ ...aspectRatioStyle, ...style }}
          >
            <img
              src={fallback}
              alt={alt}
              className={cn('w-full h-full', objectFitClasses[objectFit])}
              loading={lazy ? 'lazy' : 'eager'}
            />
          </div>
        );
      }

      if (fallback) {
        return (
          <div
            ref={containerRef}
            className={cn('relative overflow-hidden', className)}
            style={{ ...aspectRatioStyle, ...style }}
          >
            {fallback}
          </div>
        );
      }

      // Default fallback
      return (
        <div
          ref={containerRef}
          className={cn(
            'relative overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
            className
          )}
          style={{ ...aspectRatioStyle, ...style }}
        >
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden', className)}
        style={{ ...aspectRatioStyle, ...style }}
      >
        {/* Placeholder */}
        {!isLoaded && placeholder !== 'none' && (
          <div
            className={cn(
              'absolute inset-0',
              placeholder === 'skeleton' && 'animate-pulse bg-gray-200 dark:bg-gray-700'
            )}
            style={getPlaceholderStyle(placeholder, blurDataUrl)}
            aria-hidden="true"
          />
        )}

        {/* Image */}
        {isInView && (
          <img
            ref={setRefs}
            src={src}
            alt={alt}
            srcSet={srcSet || undefined}
            sizes={sizes}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full transition-opacity duration-300',
              objectFitClasses[objectFit],
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// ============================================================================
// Preset Variants
// ============================================================================

/**
 * Thumbnail image with small size optimization
 */
export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'srcSetWidths'>> = (props) => (
  <OptimizedImage
    {...props}
    srcSetWidths={[100, 200, 300]}
    sizes="(max-width: 640px) 100px, 150px"
  />
);

/**
 * Card image with medium size optimization
 */
export const CardImage: React.FC<Omit<OptimizedImageProps, 'srcSetWidths' | 'aspectRatio'>> = (props) => (
  <OptimizedImage
    {...props}
    aspectRatio="16/9"
    srcSetWidths={[320, 480, 640, 768]}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
);

/**
 * Hero/Banner image with large size optimization
 */
export const HeroImage: React.FC<Omit<OptimizedImageProps, 'srcSetWidths'>> = (props) => (
  <OptimizedImage
    {...props}
    srcSetWidths={[640, 768, 1024, 1280, 1536]}
    sizes="100vw"
    lazy={false} // Hero images should load immediately
  />
);

/**
 * Avatar image with circular styling
 */
export const AvatarImage: React.FC<
  Omit<OptimizedImageProps, 'srcSetWidths' | 'aspectRatio' | 'objectFit'> & {
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }
> = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <OptimizedImage
      {...props}
      aspectRatio="1/1"
      objectFit="cover"
      className={cn('rounded-full', sizeClasses[size], className)}
      srcSetWidths={[64, 128, 256]}
      sizes="64px"
    />
  );
};

export default OptimizedImage;
