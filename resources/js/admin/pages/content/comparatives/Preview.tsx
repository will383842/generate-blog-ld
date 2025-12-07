/**
 * Comparative Preview Page
 * Preview comparison article with interactive table and charts
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Edit,
  Copy,
  Share2,
  Trophy,
  Star,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  BarChart2,
  Table,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useComparative } from '@/hooks/useComparatives';
import { ThumbnailImage } from '@/components/ui/OptimizedImage';
import { PLATFORMS } from '@/utils/constants';
import type { ComparisonItem, ComparisonCriteria } from '@/types/comparative';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 1200, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

export default function ComparativePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: comparativeData, isLoading } = useComparative(id!);
  const comparative = comparativeData?.data;

  // Sort items
  const sortedItems = useMemo(() => {
    if (!comparative?.items) return [];
    
    return [...comparative.items].sort((a, b) => {
      if (sortBy === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
      if (sortBy === 'name') {
        return sortOrder === 'desc'
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      }
      // Sort by criterion value
      const aVal = a.values[sortBy]?.value;
      const bVal = b.values[sortBy]?.value;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }, [comparative?.items, sortBy, sortOrder]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: comparative?.title,
        url: window.location.href,
      });
    }
  };

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!comparative) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Comparatif non trouvé</p>
        <Button className="mt-4" onClick={() => navigate('/content/comparatives')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const platform = PLATFORMS.find((p) => p.id === comparative.platformId);
  const deviceSize = DEVICE_SIZES[device];
  const visibleCriteria = comparative.criteria.filter((c) => c.isVisible);
  const winner = comparative.items.find((i) => i.id === comparative.winnerId);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/content/comparatives/${id}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Aperçu: {comparative.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Device Toggle */}
            <Tabs value={device} onValueChange={(v) => setDevice(v as DeviceType)}>
              <TabsList>
                <TabsTrigger value="desktop">
                  <Monitor className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="tablet">
                  <Tablet className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'chart')}>
              <TabsList>
                <TabsTrigger value="table">
                  <Table className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="chart">
                  <BarChart2 className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-1" />
              {copied ? 'Copié!' : 'Copier le lien'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Partager
            </Button>
            <Button size="sm" onClick={() => navigate(`/content/comparatives/${id}`)}>
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          </div>
        </div>
      </header>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          className={cn(
            'bg-white shadow-lg overflow-hidden transition-all duration-300',
            device === 'mobile' && 'rounded-3xl',
            device === 'tablet' && 'rounded-2xl',
            device === 'desktop' && 'rounded-lg'
          )}
          style={{
            width: deviceSize.width,
            height: deviceSize.height,
          }}
        >
          {/* Browser Chrome (Desktop) */}
          {device === 'desktop' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded px-3 py-1 text-xs text-muted-foreground truncate">
                  {platform?.url}/comparatifs/{comparative.slug}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="h-full overflow-y-auto">
            <article className="p-6">
              {/* Header */}
              <header className="mb-8">
                <Badge variant="outline" className="mb-4">Comparatif</Badge>
                <h1 className={cn(
                  'font-bold mb-4',
                  device === 'mobile' ? 'text-xl' : 'text-3xl'
                )}>
                  {comparative.title}
                </h1>
                {comparative.excerpt && (
                  <p className="text-muted-foreground">{comparative.excerpt}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>{format(new Date(comparative.updatedAt), 'dd MMMM yyyy', { locale: fr })}</span>
                  <span>•</span>
                  <span>{comparative.items.length} éléments comparés</span>
                </div>
              </header>

              {/* Winner Highlight */}
              {comparative.highlightWinner && winner && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Notre recommandation</p>
                      <p className="text-xl font-bold">{winner.name}</p>
                      {winner.highlightLabel && (
                        <Badge className="mt-1">{winner.highlightLabel}</Badge>
                      )}
                    </div>
                    {winner.imageUrl && (
                      <ThumbnailImage
                        src={winner.imageUrl}
                        alt={winner.name}
                        className="w-16 h-16 rounded ml-auto"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              {viewMode === 'table' && (
                <div className={cn(
                  'overflow-x-auto mb-8',
                  device === 'mobile' && '-mx-6'
                )}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th
                          className="p-3 text-left font-medium cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Élément
                            {sortBy === 'name' && (
                              sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        {visibleCriteria.map((criterion) => (
                          <th
                            key={criterion.id}
                            className="p-3 text-center font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort(criterion.id)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {criterion.name}
                              {sortBy === criterion.id && (
                                sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                        ))}
                        {comparative.showScores && (
                          <th
                            className="p-3 text-center font-medium cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('score')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Score
                              {sortBy === 'score' && (
                                sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            'border-t',
                            item.isWinner && comparative.highlightWinner && 'bg-yellow-50'
                          )}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {item.imageUrl && (
                                <ThumbnailImage
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-10 h-10 rounded"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.name}</span>
                                  {item.isWinner && comparative.highlightWinner && (
                                    <Trophy className="w-4 h-4 text-yellow-600" />
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          {visibleCriteria.map((criterion) => (
                            <td key={criterion.id} className="p-3 text-center">
                              <CellDisplay
                                criterion={criterion}
                                value={item.values[criterion.id]}
                              />
                            </td>
                          ))}
                          {comparative.showScores && (
                            <td className="p-3 text-center">
                              <span className={cn(
                                'text-xl font-bold',
                                item.score >= 80 && 'text-green-600',
                                item.score >= 60 && item.score < 80 && 'text-yellow-600',
                                item.score < 60 && 'text-red-600'
                              )}>
                                {item.score.toFixed(0)}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Chart View */}
              {viewMode === 'chart' && (
                <div className="mb-8 space-y-4">
                  {sortedItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 border rounded-lg',
                        item.isWinner && comparative.highlightWinner && 'border-yellow-400 bg-yellow-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.isWinner && (
                            <Trophy className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <span className="text-2xl font-bold">{item.score.toFixed(0)}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            item.score >= 80 && 'bg-green-500',
                            item.score >= 60 && item.score < 80 && 'bg-yellow-500',
                            item.score < 60 && 'bg-red-500'
                          )}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Verdict */}
              {comparative.verdictText && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h2 className="text-lg font-bold mb-2">Notre verdict</h2>
                  <p className="text-muted-foreground">{comparative.verdictText}</p>
                </div>
              )}

              {/* Content */}
              {comparative.content && (
                <div
                  className="prose max-w-none mb-8"
                  dangerouslySetInnerHTML={{ __html: comparative.content }}
                />
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

function CellDisplay({
  criterion,
  value,
}: {
  criterion: ComparisonCriteria;
  value?: { value: string | number | boolean; displayValue?: string };
}) {
  const displayValue = value?.displayValue || value?.value;

  switch (criterion.type) {
    case 'boolean':
      return displayValue ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-600 mx-auto" />
      );
    case 'rating':
      return (
        <div className="flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-4 h-4',
                star <= Number(displayValue)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              )}
            />
          ))}
        </div>
      );
    case 'price':
      return (
        <span className="font-medium">
          {typeof displayValue === 'number'
            ? `$${displayValue.toLocaleString()}`
            : displayValue || '-'}
        </span>
      );
    default:
      return <span>{displayValue?.toString() || '-'}</span>;
  }
}
