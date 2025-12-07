/**
 * Pillar Sources
 * Research sources management with Perplexity integration
 */

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Clock,
  Shield,
  AlertTriangle,
  HelpCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  usePillarSources,
  useRefreshSources,
  useMarkSourceUsed,
} from '@/hooks/usePillars';
import type { PillarSource, SourceResult, SourceReliability, SourceQueryType } from '@/types/pillar';

export interface PillarSourcesProps {
  pillarId: string;
  onInsertSource?: (result: SourceResult) => void;
  className?: string;
}

const RELIABILITY_CONFIG: Record<SourceReliability, { label: string; color: string; icon: typeof Shield }> = {
  high: { label: 'Haute', color: 'text-green-600', icon: Shield },
  medium: { label: 'Moyenne', color: 'text-yellow-600', icon: AlertTriangle },
  low: { label: 'Basse', color: 'text-red-600', icon: AlertTriangle },
  unknown: { label: 'Inconnue', color: 'text-gray-600', icon: HelpCircle },
};

const QUERY_TYPE_LABELS: Record<SourceQueryType, string> = {
  statistics: 'Statistiques',
  citations: 'Citations',
  facts: 'Faits',
  news: 'Actualités',
  general: 'Général',
};

export function PillarSources({
  pillarId,
  onInsertSource,
  className,
}: PillarSourcesProps) {
  const [newQuery, setNewQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const { data: sourcesData, isLoading } = usePillarSources(pillarId);
  const refreshSources = useRefreshSources();
  const markUsed = useMarkSourceUsed();

  const sources = sourcesData?.data || [];

  const handleRefresh = async (queries?: string[]) => {
    await refreshSources.mutateAsync({
      pillarId,
      queries: queries || (newQuery ? [newQuery] : undefined),
    });
    setNewQuery('');
  };

  const handleNewQuery = () => {
    if (!newQuery.trim()) return;
    handleRefresh([newQuery.trim()]);
  };

  const handleMarkUsed = (sourceId: string, resultId: string) => {
    markUsed.mutate({ pillarId, sourceId, resultId });
  };

  const handleInsert = (result: SourceResult) => {
    onInsertSource?.(result);
  };

  const toggleExpand = (sourceId: string) => {
    const next = new Set(expandedSources);
    if (next.has(sourceId)) {
      next.delete(sourceId);
    } else {
      next.add(sourceId);
    }
    setExpandedSources(next);
  };

  // Stats
  const totalResults = sources.reduce((sum, s) => sum + s.results.length, 0);
  const usedResults = sources.reduce(
    (sum, s) => sum + s.results.filter((r) => r.isUsed).length,
    0
  );
  const expiredCount = sources.filter((s) => s.isExpired).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Sources de recherche
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh()}
            disabled={refreshSources.isPending}
          >
            {refreshSources.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{totalResults} résultats</span>
          <span className="text-green-600">{usedResults} utilisés</span>
          {expiredCount > 0 && (
            <span className="text-orange-600">{expiredCount} expirés</span>
          )}
        </div>

        {/* New Query */}
        <div className="flex gap-2">
          <Input
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            placeholder="Nouvelle recherche..."
            onKeyDown={(e) => e.key === 'Enter' && handleNewQuery()}
          />
          <Button onClick={handleNewQuery} disabled={!newQuery.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Sources List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune source</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajoutez une recherche pour trouver des sources
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                isExpanded={expandedSources.has(source.id)}
                onToggle={() => toggleExpand(source.id)}
                onRefresh={() => handleRefresh([source.query])}
                onMarkUsed={(resultId) => handleMarkUsed(source.id, resultId)}
                onInsert={handleInsert}
                isRefreshing={refreshSources.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SourceCardProps {
  source: PillarSource;
  isExpanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onMarkUsed: (resultId: string) => void;
  onInsert?: (result: SourceResult) => void;
  isRefreshing?: boolean;
}

function SourceCard({
  source,
  isExpanded,
  onToggle,
  onRefresh,
  onMarkUsed,
  onInsert,
  isRefreshing,
}: SourceCardProps) {
  const usedCount = source.results.filter((r) => r.isUsed).length;

  return (
    <Collapsible open={isExpanded}>
      <div
        className={cn(
          'border rounded-lg overflow-hidden',
          source.isExpired && 'border-orange-200 bg-orange-50'
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{QUERY_TYPE_LABELS[source.queryType]}</Badge>
                <span className="font-medium truncate">{source.query}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{source.results.length} résultats</span>
                <span className="text-green-600">{usedCount} utilisés</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(source.cachedAt), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </span>
                {source.isExpired && (
                  <Badge variant="outline" className="text-orange-600">
                    Expiré
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
          </button>
        </CollapsibleTrigger>

        {/* Results */}
        <CollapsibleContent>
          <div className="border-t p-2 space-y-2">
            {source.results.map((result) => (
              <ResultItem
                key={result.id}
                result={result}
                onMarkUsed={() => onMarkUsed(result.id)}
                onInsert={onInsert ? () => onInsert(result) : undefined}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface ResultItemProps {
  result: SourceResult;
  onMarkUsed: () => void;
  onInsert?: () => void;
}

function ResultItem({ result, onMarkUsed, onInsert }: ResultItemProps) {
  const reliabilityConfig = RELIABILITY_CONFIG[result.reliability];
  const ReliabilityIcon = reliabilityConfig.icon;

  return (
    <div
      className={cn(
        'p-2 rounded border',
        result.isUsed ? 'bg-green-50 border-green-200' : 'bg-white'
      )}
    >
      <div className="flex items-start gap-2">
        {result.favicon && (
          <img
            src={result.favicon}
            alt=""
            className="w-4 h-4 mt-1 rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:text-primary line-clamp-1"
          >
            {result.title}
          </a>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {result.snippet}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">{result.domain}</span>
            <span className={cn('flex items-center gap-0.5 text-[10px]', reliabilityConfig.color)}>
              <ReliabilityIcon className="w-3 h-3" />
              {reliabilityConfig.label}
            </span>
            {result.publishedDate && (
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(result.publishedDate), 'dd/MM/yyyy')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {result.isUsed ? (
            <Badge className="bg-green-100 text-green-700">
              <Check className="w-3 h-3" />
            </Badge>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMarkUsed}>
                <Check className="w-3 h-3" />
              </Button>
              {onInsert && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onInsert}>
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => window.open(result.url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PillarSources;
