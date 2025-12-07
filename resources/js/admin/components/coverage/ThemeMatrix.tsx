/**
 * ThemeMatrix Component
 * Heatmap showing theme coverage across countries
 */

import { useState, useMemo } from 'react';
import { Layers, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCoverageThemes, useCoverageCountries } from '@/hooks/useCoverage';
import { getCoverageStatus, type CoverageStatus } from '@/types/coverage';
import type { PlatformId } from '@/types/program';

interface ThemeMatrixProps {
  platformId?: PlatformId;
  onCellClick?: (themeId: string, countryId: string) => void;
  className?: string;
}

const REGIONS = [
  { value: 'all', label: 'Toutes les régions' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asie' },
  { value: 'americas', label: 'Amériques' },
  { value: 'africa', label: 'Afrique' },
  { value: 'oceania', label: 'Océanie' },
];

const HEATMAP_COLORS = [
  'bg-gray-100',      // 0
  'bg-green-100',     // 1-20
  'bg-green-200',     // 21-40
  'bg-green-300',     // 41-60
  'bg-green-400',     // 61-80
  'bg-green-500',     // 81-100
];

function getHeatmapColor(value: number, max: number): string {
  if (max === 0) return HEATMAP_COLORS[0];
  const percentage = (value / max) * 100;
  if (percentage === 0) return HEATMAP_COLORS[0];
  if (percentage <= 20) return HEATMAP_COLORS[1];
  if (percentage <= 40) return HEATMAP_COLORS[2];
  if (percentage <= 60) return HEATMAP_COLORS[3];
  if (percentage <= 80) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

export function ThemeMatrix({
  platformId,
  onCellClick,
  className,
}: ThemeMatrixProps) {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'coverage'>('coverage');

  const { data: themesData, isLoading: themesLoading } = useCoverageThemes({ platformId });
  const { data: countriesData, isLoading: countriesLoading } = useCoverageCountries({ 
    platformId,
    region: region !== 'all' ? region : undefined,
  });

  const themes = themesData?.data || [];
  const countries = countriesData?.data || [];

  const isLoading = themesLoading || countriesLoading;

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) => c.countryName.toLowerCase().includes(q) || c.countryId.toLowerCase().includes(q)
    );
  }, [countries, search]);

  // Sort themes
  const sortedThemes = useMemo(() => {
    return [...themes].sort((a, b) => {
      if (sortBy === 'name') {
        return a.themeName.localeCompare(b.themeName);
      }
      return b.percentage - a.percentage;
    });
  }, [themes, sortBy]);

  // Find max value for heatmap scaling
  const maxValue = useMemo(() => {
    let max = 0;
    themes.forEach((theme) => {
      Object.values(theme.byCountry).forEach((count) => {
        if (count > max) max = count;
      });
    });
    return max;
  }, [themes]);

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg border p-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Thèmes par pays</h3>
        </div>
        <Badge variant="outline">
          {themes.length} thèmes × {filteredCountries.length} pays
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pays..."
            className="max-w-xs"
          />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'coverage' | 'name')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coverage">Par couverture</SelectItem>
            <SelectItem value="name">Par nom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Matrix */}
      <div className="overflow-auto max-h-[600px]">
        <TooltipProvider>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-white p-2 border text-xs font-medium text-left min-w-[150px]">
                  Thème
                </th>
                {filteredCountries.slice(0, 50).map((country) => (
                  <th
                    key={country.countryId}
                    className="sticky top-0 z-10 bg-gray-50 p-1 border text-[10px] font-medium"
                    style={{ minWidth: 30 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{country.countryId}</span>
                      </TooltipTrigger>
                      <TooltipContent>{country.countryName}</TooltipContent>
                    </Tooltip>
                  </th>
                ))}
                <th className="sticky top-0 z-10 bg-gray-100 p-2 border text-xs font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedThemes.map((theme) => (
                <tr key={theme.themeId} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white p-2 border text-sm font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[120px]" title={theme.themeName}>
                        {theme.themeName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {theme.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </td>
                  {filteredCountries.slice(0, 50).map((country) => {
                    const count = theme.byCountry[country.countryId] || 0;
                    const color = getHeatmapColor(count, maxValue);

                    return (
                      <Tooltip key={country.countryId}>
                        <TooltipTrigger asChild>
                          <td
                            className={cn(
                              'p-0 border text-center text-[10px] cursor-pointer transition-opacity hover:opacity-80',
                              color,
                              count > 0 ? 'text-white' : 'text-gray-400'
                            )}
                            style={{ width: 30, height: 30 }}
                            onClick={() => onCellClick?.(theme.themeId, country.countryId)}
                          >
                            {count > 0 ? count : ''}
                          </td>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-medium">{theme.themeName}</p>
                            <p>{country.countryName}</p>
                            <p className="text-muted-foreground">{count} articles</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  <td className="bg-gray-50 p-2 border text-xs font-medium text-center">
                    {theme.totalArticles}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipProvider>

        {filteredCountries.length > 50 && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            Affichage limité à 50 pays. {filteredCountries.length - 50} pays masqués.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 p-4 border-t bg-gray-50">
        <span className="text-xs text-muted-foreground">Densité:</span>
        {HEATMAP_COLORS.map((color, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={cn('w-4 h-4 rounded border', color)} />
            <span className="text-[10px] text-muted-foreground">
              {i === 0 && '0'}
              {i === 1 && '1-20%'}
              {i === 5 && '80-100%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
