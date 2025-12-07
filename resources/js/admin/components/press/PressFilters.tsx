import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  X,
  Calendar,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/Sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PressReleaseFilters, DossierFilters, PressStatus } from '@/types/press';
import { PLATFORMS } from '@/utils/constants';

interface PressFiltersProps {
  type: 'press-release' | 'dossier';
  filters: PressReleaseFilters | DossierFilters;
  onFiltersChange: (filters: PressReleaseFilters | DossierFilters) => void;
  templates?: { id: number; name: string }[];
}

const STATUS_OPTIONS: { value: PressStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending_review', label: 'En révision' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

const HAS_MEDIA_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'yes', label: 'Avec médias' },
  { value: 'no', label: 'Sans médias' },
];

const DATE_PRESETS = [
  { label: '7 derniers jours', days: 7 },
  { label: '30 derniers jours', days: 30 },
  { label: 'Ce mois', preset: 'thisMonth' },
  { label: 'Mois dernier', preset: 'lastMonth' },
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Plus récent' },
  { value: 'created_at:asc', label: 'Plus ancien' },
  { value: 'title:asc', label: 'Titre A-Z' },
  { value: 'title:desc', label: 'Titre Z-A' },
  { value: 'published_at:desc', label: 'Publication récente' },
];

export const PressFilters: React.FC<PressFiltersProps> = ({
  type,
  filters,
  onFiltersChange,
  templates = [],
}) => {
  const { t } = useTranslation(['press', 'common']);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  // Update filter
  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Set date range
  const setDateRange = useCallback(
    (from: Date | undefined, to: Date | undefined) => {
      onFiltersChange({
        ...filters,
        dateFrom: from?.toISOString(),
        dateTo: to?.toISOString(),
      });
      setDateRangeOpen(false);
    },
    [filters, onFiltersChange]
  );

  // Apply date preset
  const applyDatePreset = useCallback(
    (preset: { days?: number; preset?: string }) => {
      const now = new Date();
      let from: Date;
      let to: Date = now;

      if (preset.days) {
        from = subDays(now, preset.days);
      } else if (preset.preset === 'thisMonth') {
        from = startOfMonth(now);
        to = endOfMonth(now);
      } else if (preset.preset === 'lastMonth') {
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
      } else {
        return;
      }

      setDateRange(from, to);
    },
    [setDateRange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchValue('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.platformId) count++;
    if (filters.status) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if ((filters as PressReleaseFilters).hasMedia) count++;
    if ((filters as PressReleaseFilters).templateId) count++;
    if ((filters as DossierFilters).minSections) count++;
    return count;
  }, [filters]);

  // Get active filter badges
  const activeFilterBadges = useMemo(() => {
    const badges: { key: string; label: string }[] = [];

    if (filters.platformId) {
      const platform = PLATFORMS.find((p) => p.id === filters.platformId);
      badges.push({ key: 'platform', label: platform?.name || filters.platformId });
    }

    if (filters.status) {
      const status = STATUS_OPTIONS.find((s) => s.value === filters.status);
      badges.push({ key: 'status', label: status?.label || filters.status });
    }

    if (filters.dateFrom || filters.dateTo) {
      let dateLabel = '';
      if (filters.dateFrom && filters.dateTo) {
        dateLabel = `${format(new Date(filters.dateFrom), 'dd/MM')} - ${format(
          new Date(filters.dateTo),
          'dd/MM'
        )}`;
      } else if (filters.dateFrom) {
        dateLabel = `Depuis ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')}`;
      } else if (filters.dateTo) {
        dateLabel = `Jusqu'au ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`;
      }
      badges.push({ key: 'date', label: dateLabel });
    }

    if ((filters as PressReleaseFilters).hasMedia) {
      badges.push({
        key: 'hasMedia',
        label: (filters as PressReleaseFilters).hasMedia === 'yes' ? 'Avec médias' : 'Sans médias',
      });
    }

    if ((filters as PressReleaseFilters).templateId) {
      const template = templates.find(
        (t) => t.id === (filters as PressReleaseFilters).templateId
      );
      badges.push({ key: 'template', label: template?.name || 'Template' });
    }

    if ((filters as DossierFilters).minSections) {
      badges.push({
        key: 'minSections',
        label: `Min ${(filters as DossierFilters).minSections} sections`,
      });
    }

    return badges;
  }, [filters, templates]);

  // Remove specific filter
  const removeFilter = useCallback(
    (key: string) => {
      const newFilters = { ...filters } as Record<string, unknown>;
      if (key === 'date') {
        delete newFilters.dateFrom;
        delete newFilters.dateTo;
      } else {
        delete newFilters[key];
      }
      onFiltersChange(newFilters as PressReleaseFilters | DossierFilters);
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="space-y-3">
      {/* Main Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('press:filters.searchPlaceholder')}
            className="pl-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Platform Select */}
        <Select
          value={filters.platform || 'all'}
          onValueChange={(v) => updateFilter('platform', v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('press:filters.platform')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('press:filters.allPlatforms')}</SelectItem>
            {PLATFORMS.map((platform) => (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Select */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('press:filters.status')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {filters.dateFrom || filters.dateTo ? (
                <span>
                  {filters.dateFrom
                    ? format(new Date(filters.dateFrom), 'dd/MM', { locale: fr })
                    : '...'}
                  {' - '}
                  {filters.dateTo
                    ? format(new Date(filters.dateTo), 'dd/MM', { locale: fr })
                    : '...'}
                </span>
              ) : (
                t('press:filters.dateRange')
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex">
              <div className="p-3 border-r">
                <Label className="text-xs mb-2 block">{t('press:filters.from')}</Label>
                <CalendarComponent
                  mode="single"
                  selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                  onSelect={(date) =>
                    setDateRange(date, filters.dateTo ? new Date(filters.dateTo) : undefined)
                  }
                  locale={fr}
                />
              </div>
              <div className="p-3">
                <Label className="text-xs mb-2 block">{t('press:filters.to')}</Label>
                <CalendarComponent
                  mode="single"
                  selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                  onSelect={(date) =>
                    setDateRange(
                      filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                      date
                    )
                  }
                  locale={fr}
                />
              </div>
            </div>
            {(filters.dateFrom || filters.dateTo) && (
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDateRange(undefined, undefined)}
                >
                  {t('common:clear')}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {t('press:filters.advanced')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('press:filters.advancedTitle')}</SheetTitle>
              <SheetDescription>{t('press:filters.advancedDescription')}</SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Platform */}
              <div>
                <Label>{t('press:filters.platform')}</Label>
                <Select
                  value={filters.platform || 'all'}
                  onValueChange={(v) => updateFilter('platform', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('press:filters.allPlatforms')}</SelectItem>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label>{t('press:filters.status')}</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(v) => updateFilter('status', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Press Release Specific Filters */}
              {type === 'press-release' && (
                <>
                  {/* Has Media */}
                  <div>
                    <Label>{t('press:filters.hasMedia')}</Label>
                    <Select
                      value={(filters as PressReleaseFilters).hasMedia || 'all'}
                      onValueChange={(v) => updateFilter('hasMedia', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAS_MEDIA_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Template */}
                  {templates.length > 0 && (
                    <div>
                      <Label>{t('press:filters.template')}</Label>
                      <Select
                        value={
                          (filters as PressReleaseFilters).templateId?.toString() || 'all'
                        }
                        onValueChange={(v) =>
                          updateFilter('templateId', v === 'all' ? undefined : parseInt(v))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('press:filters.allTemplates')}</SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* Dossier Specific Filters */}
              {type === 'dossier' && (
                <div>
                  <Label htmlFor="minSections">{t('press:filters.minSections')}</Label>
                  <Input
                    id="minSections"
                    type="number"
                    min={0}
                    value={(filters as DossierFilters).minSections || ''}
                    onChange={(e) =>
                      updateFilter(
                        'minSections',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              )}

              <Separator />

              {/* Sort */}
              <div>
                <Label>{t('press:filters.sortBy')}</Label>
                <Select
                  value={
                    filters.sortBy && filters.sortOrder
                      ? `${filters.sortBy}:${filters.sortOrder}`
                      : 'created_at:desc'
                  }
                  onValueChange={(v) => {
                    const [sortBy, sortOrder] = v.split(':');
                    onFiltersChange({
                      ...filters,
                      sortBy: sortBy as 'created_at' | 'title' | 'status' | 'scheduled_at',
                      sortOrder: sortOrder as 'asc' | 'desc',
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter>
              <Button variant="outline" onClick={clearFilters}>
                {t('common:clearAll')}
              </Button>
              <Button onClick={() => setSheetOpen(false)}>{t('common:apply')}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Clear All */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t('common:clearAll')}
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilterBadges.map(({ key, label }) => (
            <Badge key={key} variant="secondary" className="gap-1 pr-1">
              {label}
              <button
                type="button"
                onClick={() => removeFilter(key)}
                className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default PressFilters;
