import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Region {
  id: string;
  name: string;
  countriesCount?: number;
  coverage?: number;
}

export interface RegionFilterProps {
  regions?: Region[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  showAll?: boolean;
  showCounts?: boolean;
  showCoverage?: boolean;
  variant?: 'buttons' | 'pills' | 'list';
  className?: string;
}

const defaultRegions: Region[] = [
  { id: 'europe', name: 'Europe', countriesCount: 44 },
  { id: 'northAmerica', name: 'North America', countriesCount: 23 },
  { id: 'southAmerica', name: 'South America', countriesCount: 12 },
  { id: 'asia', name: 'Asia', countriesCount: 48 },
  { id: 'africa', name: 'Africa', countriesCount: 54 },
  { id: 'oceania', name: 'Oceania', countriesCount: 14 },
  { id: 'middleEast', name: 'Middle East', countriesCount: 17 },
];

export function RegionFilter({
  regions = defaultRegions,
  value,
  onChange,
  multiple = false,
  showAll = true,
  showCounts = false,
  showCoverage = false,
  variant = 'buttons',
  className,
}: RegionFilterProps) {
  const { t } = useTranslation('coverage');

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const isAllSelected = selectedValues.length === 0;

  const handleSelect = (regionId: string) => {
    if (regionId === 'all') {
      onChange(multiple ? [] : '');
      return;
    }

    if (multiple) {
      const newValues = selectedValues.includes(regionId)
        ? selectedValues.filter((v) => v !== regionId)
        : [...selectedValues, regionId];
      onChange(newValues);
    } else {
      onChange(regionId === selectedValues[0] ? '' : regionId);
    }
  };

  const isSelected = (regionId: string) => {
    if (regionId === 'all') return isAllSelected;
    return selectedValues.includes(regionId);
  };

  const renderButton = (region: Region | { id: string; name: string }) => {
    const selected = isSelected(region.id);
    const fullRegion = regions.find((r) => r.id === region.id);

    if (variant === 'pills') {
      return (
        <Badge
          key={region.id}
          variant={selected ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer transition-colors',
            selected && 'bg-primary text-primary-foreground',
            !selected && 'hover:bg-muted'
          )}
          onClick={() => handleSelect(region.id)}
        >
          {region.name}
          {showCounts && fullRegion?.countriesCount && (
            <span className="ml-1 opacity-70">({fullRegion.countriesCount})</span>
          )}
        </Badge>
      );
    }

    if (variant === 'list') {
      return (
        <button
          key={region.id}
          onClick={() => handleSelect(region.id)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors',
            selected
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{region.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {showCounts && fullRegion?.countriesCount && (
              <span className="text-xs opacity-70">
                {fullRegion.countriesCount} {t('stats.covered')}
              </span>
            )}
            {showCoverage && fullRegion?.coverage !== undefined && (
              <Badge variant={selected ? 'secondary' : 'outline'}>
                {fullRegion.coverage}%
              </Badge>
            )}
          </div>
        </button>
      );
    }

    // Default: buttons variant
    return (
      <Button
        key={region.id}
        variant={selected ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleSelect(region.id)}
        className="gap-1"
      >
        {region.id === 'all' && <Globe className="h-4 w-4" />}
        {region.name}
        {showCounts && fullRegion?.countriesCount && (
          <span className="text-xs opacity-70">({fullRegion.countriesCount})</span>
        )}
      </Button>
    );
  };

  const allRegions = showAll
    ? [{ id: 'all', name: t('regions.all') }, ...regions]
    : regions;

  return (
    <div
      className={cn(
        variant === 'list' ? 'flex flex-col gap-1' : 'flex flex-wrap gap-2',
        className
      )}
    >
      {allRegions.map((region) =>
        renderButton({
          ...region,
          name:
            region.id === 'all'
              ? region.name
              : t(`regions.${region.id}`, region.name),
        })
      )}
    </div>
  );
}

export default RegionFilter;
