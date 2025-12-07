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
  Select,
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
import { LandingFilters as LandingFiltersType, LandingStatus, Landing } from '@/types/landing';
import { PLATFORMS } from '@/utils/constants';
import { STATIC_COUNTRIES as COUNTRIES } from '@/utils/staticCountries';

interface LandingFiltersProps {
  filters: LandingFiltersType;
  onFiltersChange: (filters: LandingFiltersType) => void;
}

const STATUS_OPTIONS: { value: LandingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'review', label: 'En révision' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

const TYPE_OPTIONS: { value: Landing['type'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les types' },
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Produit' },
  { value: 'campaign', label: 'Campagne' },
  { value: 'event', label: 'Événement' },
  { value: 'generic', label: 'Générique' },
];

// Les 9 langues supportées
const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'Toutes les langues' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
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
  { value: 'view_count:desc', label: 'Plus de vues' },
];

export const LandingFilters: React.FC<LandingFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation(['landing', 'common']);
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
    if (filters.platform) count++;
    if (filters.country) count++;
    if (filters.language) count++;
    if (filters.status) count++;
    if (filters.type) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minSections) count++;
    return count;
  }, [filters]);

  // Get active filter badges
  const activeFilterBadges = useMemo(() => {
    const badges: { key: string; label: string }[] = [];

    if (filters.platform) {
      const platform = PLATFORMS.find((p) => p.id === filters.platform);
      badges.push({ key: 'platform', label: platform?.name || filters.platform });
    }

    if (filters.country) {
      const country = COUNTRIES.find((c) => c.code === filters.country);
      badges.push({ key: 'country', label: country?.name || filters.country });
    }

    if (filters.language) {
      const lang = LANGUAGE_OPTIONS.find((l) => l.value === filters.language);
      badges.push({ key: 'language', label: lang?.label || filters.language });
    }

    if (filters.status) {
      const status = STATUS_OPTIONS.find((s) => s.value === filters.status);
      badges.push({ key: 'status', label: status?.label || filters.status });
    }

    if (filters.type) {
      const type = TYPE_OPTIONS.find((t) => t.value === filters.type);
      badges.push({ key: 'type', label: type?.label || filters.type });
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

    if (filters.minSections) {
      badges.push({ key: 'minSections', label: `Min ${filters.minSections} sections` });
    }

    return badges;
  }, [filters]);

  // Remove specific filter
  const removeFilter = useCallback(
    (key: string) => {
      const { [key]: _, dateFrom, dateTo, ...rest } = filters;
      if (key === 'date') {
        onFiltersChange(rest);
      } else {
        onFiltersChange({ ...rest, dateFrom, dateTo });
      }
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
            placeholder={t('landing:filters.searchPlaceholder')}
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
            <SelectValue placeholder={t('landing:filters.platform')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('landing:filters.allPlatforms')}</SelectItem>
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
            <SelectValue placeholder={t('landing:filters.status')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Select */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(v) => updateFilter('type', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('landing:filters.type')} />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map(({ value, label }) => (
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
                t('landing:filters.dateRange')
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
                <Label className="text-xs mb-2 block">{t('landing:filters.from')}</Label>
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
                <Label className="text-xs mb-2 block">{t('landing:filters.to')}</Label>
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
              {t('landing:filters.advanced')}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('landing:filters.advancedTitle')}</SheetTitle>
              <SheetDescription>{t('landing:filters.advancedDescription')}</SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Platform */}
              <div>
                <Label>{t('landing:filters.platform')}</Label>
                <Select
                  value={filters.platform || 'all'}
                  onValueChange={(v) => updateFilter('platform', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('landing:filters.allPlatforms')}</SelectItem>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country */}
              <div>
                <Label>{t('landing:filters.country')}</Label>
                <Select
                  value={filters.country || 'all'}
                  onValueChange={(v) => updateFilter('country', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('landing:filters.allCountries')}</SelectItem>
                    {COUNTRIES.slice(0, 50).map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div>
                <Label>{t('landing:filters.language')}</Label>
                <Select
                  value={filters.language || 'all'}
                  onValueChange={(v) => updateFilter('language', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Status */}
              <div>
                <Label>{t('landing:filters.status')}</Label>
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

              {/* Type */}
              <div>
                <Label>{t('landing:filters.type')}</Label>
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(v) => updateFilter('type', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min Sections */}
              <div>
                <Label htmlFor="minSections">{t('landing:filters.minSections')}</Label>
                <Input
                  id="minSections"
                  type="number"
                  min={0}
                  value={filters.minSections || ''}
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

              <Separator />

              {/* Sort */}
              <div>
                <Label>{t('landing:filters.sortBy')}</Label>
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
                      sortBy: sortBy as 'created_at' | 'title' | 'status' | 'seo_score',
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

export default LandingFilters;
