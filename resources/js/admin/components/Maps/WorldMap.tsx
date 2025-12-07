import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

export interface CountryData {
  code: string;
  name: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface WorldMapProps {
  data: CountryData[];
  title?: string;
  subtitle?: string;
  colorScale?: {
    low: string;
    medium: string;
    high: string;
    none: string;
  };
  thresholds?: {
    low: number;
    high: number;
  };
  onCountryClick?: (country: CountryData) => void;
  onCountryHover?: (country: CountryData | null) => void;
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  className?: string;
  height?: number;
}

const defaultColorScale = {
  low: '#FEE2E2',    // red-100
  medium: '#FCD34D', // amber-300
  high: '#34D399',   // green-400
  none: '#F3F4F6',   // gray-100
};

const defaultThresholds = {
  low: 40,
  high: 80,
};

// Simplified SVG paths for major regions (simplified world map)
const regions: Record<string, { path: string; countries: string[] }> = {
  northAmerica: {
    path: 'M 50 80 L 150 60 L 180 120 L 120 180 L 40 150 Z',
    countries: ['US', 'CA', 'MX'],
  },
  southAmerica: {
    path: 'M 100 200 L 140 190 L 160 280 L 130 350 L 90 300 Z',
    countries: ['BR', 'AR', 'CO', 'CL', 'PE', 'VE'],
  },
  europe: {
    path: 'M 250 60 L 320 50 L 340 100 L 300 130 L 240 110 Z',
    countries: ['FR', 'DE', 'GB', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT'],
  },
  africa: {
    path: 'M 250 140 L 320 130 L 340 240 L 280 300 L 230 250 Z',
    countries: ['ZA', 'NG', 'EG', 'KE', 'MA', 'DZ', 'TN'],
  },
  asia: {
    path: 'M 350 50 L 480 40 L 500 150 L 420 180 L 340 130 Z',
    countries: ['CN', 'JP', 'IN', 'KR', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH'],
  },
  oceania: {
    path: 'M 450 220 L 520 210 L 540 280 L 480 300 L 440 260 Z',
    countries: ['AU', 'NZ'],
  },
  middleEast: {
    path: 'M 320 100 L 380 90 L 400 150 L 360 170 L 310 140 Z',
    countries: ['AE', 'SA', 'IL', 'TR', 'QA', 'KW'],
  },
};

export function WorldMap({
  data,
  title,
  subtitle,
  colorScale = defaultColorScale,
  thresholds = defaultThresholds,
  onCountryClick,
  onCountryHover,
  valueFormatter = (v) => `${v}%`,
  showLegend = true,
  className,
  height = 400,
}: WorldMapProps) {
  const { t } = useTranslation('coverage');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Create lookup map for country data
  const countryDataMap = useMemo(() => {
    const map = new Map<string, CountryData>();
    data.forEach((d) => map.set(d.code, d));
    return map;
  }, [data]);

  // Get color for a region based on its countries' data
  const getRegionColor = (regionKey: string) => {
    const region = regions[regionKey];
    const regionCountries = region.countries
      .map((code) => countryDataMap.get(code))
      .filter(Boolean) as CountryData[];

    if (regionCountries.length === 0) return colorScale.none;

    const avgValue =
      regionCountries.reduce((sum, c) => sum + c.value, 0) / regionCountries.length;

    if (avgValue >= thresholds.high) return colorScale.high;
    if (avgValue >= thresholds.low) return colorScale.medium;
    return colorScale.low;
  };

  // Get region summary for tooltip
  const getRegionSummary = (regionKey: string) => {
    const region = regions[regionKey];
    const regionCountries = region.countries
      .map((code) => countryDataMap.get(code))
      .filter(Boolean) as CountryData[];

    if (regionCountries.length === 0) return null;

    const avgValue =
      regionCountries.reduce((sum, c) => sum + c.value, 0) / regionCountries.length;

    return {
      name: t(`regions.${regionKey}`),
      countriesCount: regionCountries.length,
      avgValue,
    };
  };

  const handleRegionClick = (regionKey: string) => {
    const region = regions[regionKey];
    const firstCountry = region.countries
      .map((code) => countryDataMap.get(code))
      .find(Boolean);
    if (firstCountry && onCountryClick) {
      onCountryClick(firstCountry);
    }
  };

  const mapContent = (
    <TooltipProvider>
      <svg
        viewBox="0 0 600 400"
        className="w-full"
        style={{ height }}
      >
        {/* Background */}
        <rect width="600" height="400" fill="hsl(var(--muted))" opacity="0.2" />

        {/* Regions */}
        {Object.entries(regions).map(([key, region]) => {
          const summary = getRegionSummary(key);
          const isHovered = hoveredRegion === key;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <path
                  d={region.path}
                  fill={getRegionColor(key)}
                  stroke={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isHovered ? 2 : 1}
                  className={cn(
                    'transition-all duration-200 cursor-pointer',
                    isHovered && 'opacity-80'
                  )}
                  onMouseEnter={() => {
                    setHoveredRegion(key);
                    if (summary) {
                      const countryData = region.countries
                        .map((code) => countryDataMap.get(code))
                        .find(Boolean);
                      onCountryHover?.(countryData || null);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredRegion(null);
                    onCountryHover?.(null);
                  }}
                  onClick={() => handleRegionClick(key)}
                />
              </TooltipTrigger>
              {summary && (
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{summary.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {summary.countriesCount} {t('stats.covered')}
                    </p>
                    <p className="text-sm">
                      {t('stats.percentage')}: {valueFormatter(summary.avgValue)}
                    </p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </svg>
    </TooltipProvider>
  );

  const legend = showLegend && (
    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: colorScale.high }}
        />
        <span>{t('global.legend.high')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: colorScale.medium }}
        />
        <span>{t('global.legend.medium')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: colorScale.low }}
        />
        <span>{t('global.legend.low')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: colorScale.none }}
        />
        <span>{t('global.legend.none')}</span>
      </div>
    </div>
  );

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          {mapContent}
          {legend}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {mapContent}
      {legend}
    </div>
  );
}

export default WorldMap;
