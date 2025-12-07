/**
 * Article Filters
 * Sidebar filter panel for articles
 */

import { useState } from 'react';
import {
  Search,
  X,
  Filter,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PLATFORMS, LANGUAGES, CONTENT_TYPES } from '@/utils/constants';
import type { PlatformId, LanguageCode, ContentTypeId } from '@/types/program';
import type { ArticleFilters as ArticleFiltersType, ArticleStatus } from '@/types/article';

export interface ArticleFiltersProps {
  filters: ArticleFiltersType;
  onChange: (filters: ArticleFiltersType) => void;
  onSavePreset?: (name: string, filters: ArticleFiltersType) => void;
  savedPresets?: Array<{ name: string; filters: ArticleFiltersType }>;
  onLoadPreset?: (filters: ArticleFiltersType) => void;
  onDeletePreset?: (name: string) => void;
  className?: string;
}

const STATUS_OPTIONS: Array<{ value: ArticleStatus; label: string }> = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending_review', label: 'En révision' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
  { value: 'unpublished', label: 'Dépublié' },
  { value: 'archived', label: 'Archivé' },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b pb-4">
      <button
        className="flex items-center justify-between w-full py-2 font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isOpen && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

export function ArticleFilters({
  filters,
  onChange,
  onSavePreset,
  savedPresets = [],
  onLoadPreset,
  onDeletePreset,
  className,
}: ArticleFiltersProps) {
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const updateFilter = <K extends keyof ArticleFiltersType>(
    key: K,
    value: ArticleFiltersType[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: ArticleStatus) => {
    const current = filters.status || [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    updateFilter('status', next.length > 0 ? next : undefined);
  };

  const clearFilters = () => {
    onChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  const handleSavePreset = () => {
    if (presetName && onSavePreset) {
      onSavePreset(presetName, filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="pl-9"
          />
        </div>

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <FilterSection title="Filtres enregistrés">
            <div className="space-y-1">
              {savedPresets.map((preset) => (
                <div
                  key={preset.name}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <button
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => onLoadPreset?.(preset.filters)}
                  >
                    {preset.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDeletePreset?.(preset.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Status */}
        <FilterSection title="Statut">
          <div className="space-y-2">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.status?.includes(option.value) || false}
                  onCheckedChange={() => toggleStatus(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Platform */}
        <FilterSection title="Plateforme">
          <Select
            value={filters.platformId || ''}
            onChange={(e) =>
              updateFilter('platformId', (e.target.value || undefined) as PlatformId | undefined)
            }
          >
            <option value="">Toutes</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterSection>

        {/* Country */}
        <FilterSection title="Pays">
          <Input
            placeholder="Code pays (ex: FR)"
            value={filters.countryId || ''}
            onChange={(e) =>
              updateFilter('countryId', e.target.value.toUpperCase() || undefined)
            }
            maxLength={2}
          />
        </FilterSection>

        {/* Language */}
        <FilterSection title="Langue">
          <Select
            value={filters.languageId || ''}
            onChange={(e) =>
              updateFilter('languageId', (e.target.value || undefined) as LanguageCode | undefined)
            }
          >
            <option value="">Toutes</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </Select>
        </FilterSection>

        {/* Content Type */}
        <FilterSection title="Type de contenu">
          <Select
            value={filters.type || ''}
            onChange={(e) => updateFilter('type', (e.target.value || undefined) as ContentTypeId | undefined)}
          >
            <option value="">Tous</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FilterSection>

        {/* Date Range */}
        <FilterSection title="Période">
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Du</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                  updateFilter('dateFrom', e.target.value || undefined)
                }
              />
            </div>
            <div>
              <Label className="text-xs">Au</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) =>
                  updateFilter('dateTo', e.target.value || undefined)
                }
              />
            </div>
          </div>
        </FilterSection>

        {/* Quality Score */}
        <FilterSection title="Score qualité" defaultOpen={false}>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              min={0}
              max={100}
              value={filters.minQualityScore || ''}
              onChange={(e) =>
                updateFilter(
                  'minQualityScore',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-20"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              min={0}
              max={100}
              value={filters.maxQualityScore || ''}
              onChange={(e) =>
                updateFilter(
                  'maxQualityScore',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-20"
            />
          </div>
        </FilterSection>

        {/* Save Preset */}
        {onSavePreset && activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            {showSavePreset ? (
              <div className="space-y-2">
                <Input
                  placeholder="Nom du filtre"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSavePreset}>
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowSavePreset(false);
                      setPresetName('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowSavePreset(true)}
              >
                <Save className="w-4 h-4 mr-1" />
                Enregistrer ce filtre
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ArticleFilters;
