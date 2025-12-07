/**
 * Queue Filters
 * Filters panel for queue and history
 */

import { useState } from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PLATFORMS, CONTENT_TYPES } from '@/utils/constants';
import type { PlatformId } from '@/types/program';
import type { GenerationJobFilters, QueueStatus } from '@/types/generation';

export interface QueueFiltersProps {
  filters: GenerationJobFilters;
  onChange: (filters: GenerationJobFilters) => void;
  className?: string;
}

const STATUS_OPTIONS: Array<{ value: QueueStatus; label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'processing', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'failed', label: 'Échec' },
  { value: 'cancelled', label: 'Annulé' },
];

export function QueueFilters({ filters, onChange, className }: QueueFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof GenerationJobFilters>(
    key: K,
    value: GenerationJobFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: QueueStatus) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    updateFilter('status', updated.length > 0 ? updated : undefined);
  };

  const clearFilters = () => {
    onChange({});
  };

  const activeFilterCount = [
    filters.status?.length,
    filters.platformId,
    filters.type?.length,
    filters.dateFrom,
    filters.dateTo,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search + Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par ID..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      {/* Status badges (always visible) */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isActive = filters.status?.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => toggleStatus(option.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-1">Plateforme</label>
            <Select
              value={filters.platformId || ''}
              onChange={(e) => updateFilter('platformId', (e.target.value || undefined) as PlatformId | undefined)}
            >
              <option value="">Toutes</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <Select
              value={filters.type?.[0] || ''}
              onChange={(e) => updateFilter('type', e.target.value ? [e.target.value] : undefined)}
            >
              <option value="">Tous</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-sm font-medium mb-1">Depuis</label>
            <Input
              type="date"
              value={filters.dateFrom?.split('T')[0] || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value ? `${e.target.value}T00:00:00Z` : undefined)}
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-sm font-medium mb-1">Jusqu'à</label>
            <Input
              type="date"
              value={filters.dateTo?.split('T')[0] || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value ? `${e.target.value}T23:59:59Z` : undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default QueueFilters;
