import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Attribution {
  source: 'unsplash' | 'pexels' | 'dalle' | 'custom';
  authorName?: string;
  authorUrl?: string;
  sourceUrl?: string;
  license?: string;
}

export interface AttributionBadgeProps {
  attribution: Attribution;
  variant?: 'inline' | 'overlay' | 'card';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const sourceLabels: Record<string, string> = {
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  dalle: 'DALL-E',
  custom: 'Custom',
};

const sourceIcons: Record<string, React.ReactNode> = {
  unsplash: <Camera className="h-3 w-3" />,
  pexels: <Camera className="h-3 w-3" />,
  dalle: <span className="text-xs">🎨</span>,
  custom: <User className="h-3 w-3" />,
};

export function AttributionBadge({
  attribution,
  variant = 'inline',
  size = 'default',
  showIcon = true,
  className,
}: AttributionBadgeProps) {
  const { t } = useTranslation('media');

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    default: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const renderAuthorLink = () => {
    if (!attribution.authorName) return null;

    if (attribution.authorUrl) {
      return (
        <a
          href={attribution.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline inline-flex items-center gap-1"
        >
          {attribution.authorName}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      );
    }

    return <span className="font-medium">{attribution.authorName}</span>;
  };

  const renderSourceLink = () => {
    const label = sourceLabels[attribution.source] || attribution.source;

    if (attribution.sourceUrl) {
      return (
        <a
          href={attribution.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline inline-flex items-center gap-1"
        >
          {label}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      );
    }

    return <span>{label}</span>;
  };

  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-black/60 text-white backdrop-blur-sm',
          sizeClasses[size],
          'flex items-center justify-between',
          className
        )}
      >
        <div className="flex items-center gap-1">
          {showIcon && sourceIcons[attribution.source]}
          {attribution.authorName && (
            <>
              <span className="opacity-70">Photo by</span>
              {renderAuthorLink()}
            </>
          )}
        </div>
        <span className="opacity-70">{renderSourceLink()}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-lg border bg-card p-3 space-y-2',
          className
        )}
      >
        <div className="flex items-center gap-2">
          {showIcon && (
            <div className="p-1.5 rounded-full bg-muted">
              {sourceIcons[attribution.source]}
            </div>
          )}
          <div>
            <p className="font-medium">
              {attribution.authorName || 'Unknown Author'}
            </p>
            <p className="text-sm text-muted-foreground">
              via {renderSourceLink()}
            </p>
          </div>
        </div>
        {attribution.license && (
          <p className="text-xs text-muted-foreground">
            License: {attribution.license}
          </p>
        )}
      </div>
    );
  }

  // Inline variant (default)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-muted text-muted-foreground',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && sourceIcons[attribution.source]}
      {attribution.authorName && (
        <>
          {renderAuthorLink()}
          <span className="opacity-50">•</span>
        </>
      )}
      {renderSourceLink()}
    </span>
  );
}

export default AttributionBadge;
