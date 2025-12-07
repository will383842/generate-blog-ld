/**
 * GapsAnalysis Component
 * List and analyze content coverage gaps with quick actions
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCoverageGaps, useGenerateMissing, useDismissGap } from '@/hooks/useCoverage';
import { getPriorityColor, type CoverageGap, type CoveragePriority, type GapFilters } from '@/types/coverage';
import type { PlatformId } from '@/types/program';

interface GapsAnalysisProps {
  platformId?: PlatformId;
  maxItems?: number;
  showFilters?: boolean;
  showBulkActions?: boolean;
  onGapClick?: (gap: CoverageGap) => void;
  className?: string;
}

const PRIORITY_ORDER: CoveragePriority[] = ['critical', 'high', 'medium', 'low'];

const PRIORITY_LABELS: Record<CoveragePriority, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

const REASON_LABELS: Record<string, string> = {
  no_content: 'Pas de contenu',
  missing_language: 'Langue manquante',
  missing_type: 'Type manquant',
  outdated_content: 'Contenu obsolète',
  competitor_gap: 'Opportunité concurrence',
  traffic_opportunity: 'Opportunité trafic',
  user_requested: 'Demande utilisateur',
};

export function GapsAnalysis({
  platformId,
  maxItems = 20,
  showFilters = true,
  showBulkActions = true,
  onGapClick,
  className,
}: GapsAnalysisProps) {
  const [filters, setFilters] = useState<GapFilters>({
    platformId,
    sortBy: 'priority',
    sortOrder: 'desc',
    perPage: maxItems,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: gapsData, isLoading } = useCoverageGaps(filters);
  const generateMissing = useGenerateMissing();
  const dismissGap = useDismissGap();

  const gaps = gapsData?.data || [];
  const meta = gapsData?.meta;

  // Group by priority
  const groupedGaps = useMemo(() => {
    const groups: Record<CoveragePriority, CoverageGap[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    gaps.forEach((gap) => {
      groups[gap.priority].push(gap);
    });
    return groups;
  }, [gaps]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(gaps.map((g) => g.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  // Actions
  const handleGenerate = async (gapIds: string[]) => {
    await generateMissing.mutateAsync({ gapIds });
    setSelectedIds(new Set());
  };

  const handleDismiss = async (gapId: string) => {
    await dismissGap.mutateAsync({ gapId, reason: 'not_needed' });
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg border p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">Lacunes de couverture</h3>
          {meta && (
            <Badge variant="outline">{meta.total} total</Badge>
          )}
        </div>

        {showBulkActions && selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedIds.size} sélectionné(s)</Badge>
            <Button
              size="sm"
              onClick={() => handleGenerate(Array.from(selectedIds))}
              disabled={generateMissing.isPending}
            >
              {generateMissing.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              Générer
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === gaps.length && gaps.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Tout sélectionner</span>
          </div>

          <Select
            value={filters.priority?.[0] || 'all'}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                priority: v === 'all' ? undefined : [v as CoveragePriority],
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {PRIORITY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy || 'priority'}
            onValueChange={(v) => setFilters({ ...filters, sortBy: v as 'priority' | 'country' | 'language' | 'estimatedCost' })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tri" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Par priorité</SelectItem>
              <SelectItem value="country">Par pays</SelectItem>
              <SelectItem value="language">Par langue</SelectItem>
              <SelectItem value="estimatedCost">Par coût</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Priority Stats */}
      {meta && (
        <div className="grid grid-cols-4 gap-2 p-4 border-b">
          {PRIORITY_ORDER.map((priority) => {
            const count =
              priority === 'critical' ? meta.totalByCritical :
              priority === 'high' ? meta.totalByHigh :
              priority === 'medium' ? meta.totalByMedium :
              meta.totalByLow;

            return (
              <button
                key={priority}
                className={cn(
                  'p-2 rounded text-center transition-colors',
                  filters.priority?.[0] === priority
                    ? getPriorityColor(priority)
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
                onClick={() =>
                  setFilters({
                    ...filters,
                    priority: filters.priority?.[0] === priority ? undefined : [priority],
                  })
                }
              >
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs">{PRIORITY_LABELS[priority]}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Gaps List */}
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {gaps.length === 0 ? (
          <div className="p-8 text-center">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium">Aucune lacune détectée</p>
            <p className="text-sm text-muted-foreground">
              Toutes les combinaisons pays/langues sont couvertes
            </p>
          </div>
        ) : (
          gaps.map((gap) => (
            <Collapsible
              key={gap.id}
              open={expandedId === gap.id}
              onOpenChange={(open) => setExpandedId(open ? gap.id : null)}
            >
              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(gap.id)}
                    onCheckedChange={(checked) => handleSelect(gap.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <CollapsibleTrigger asChild>
                    <div className="flex-1 cursor-pointer" onClick={() => onGapClick?.(gap)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(gap.priority)}>
                            {PRIORITY_LABELS[gap.priority]}
                          </Badge>
                          <span className="font-medium">{gap.countryName}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground uppercase">
                            {gap.languageId}
                          </span>
                          {gap.contentType && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <Badge variant="outline">{gap.contentType}</Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ~{gap.estimatedArticles} articles
                          </span>
                          {expandedId === gap.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {gap.reasons.map((reason) => (
                          <Badge key={reason} variant="outline" className="text-xs">
                            {REASON_LABELS[reason] || reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="mt-4 ml-8 space-y-4">
                    {/* Suggested Themes */}
                    {gap.suggestedThemes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Thèmes suggérés:</p>
                        <div className="flex flex-wrap gap-2">
                          {gap.suggestedThemes.map((theme) => (
                            <Badge key={theme} variant="secondary">{theme}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Titles */}
                    {gap.suggestedTitles.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Titres suggérés:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {gap.suggestedTitles.slice(0, 3).map((title, i) => (
                            <li key={i}>• {title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Estimation */}
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Articles estimés:</span>{' '}
                        <span className="font-medium">{gap.estimatedArticles}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coût estimé:</span>{' '}
                        <span className="font-medium">${gap.estimatedCost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Durée estimée:</span>{' '}
                        <span className="font-medium">{gap.estimatedDuration}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerate([gap.id])}
                        disabled={generateMissing.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Générer maintenant
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismiss(gap.id)}
                        disabled={dismissGap.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Ignorer
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </div>

      {/* Pagination hint */}
      {meta && meta.total > gaps.length && (
        <div className="p-4 border-t text-center text-sm text-muted-foreground">
          Affichage de {gaps.length} sur {meta.total} lacunes
        </div>
      )}
    </div>
  );
}
