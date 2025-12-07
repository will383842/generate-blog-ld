import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Image,
  Search,
  Download,
  Heart,
  Clock,
  Grid3X3,
  Layers,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Eye,
  ChevronRight,
  User,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { PageHeader } from '@/components/layout/PageHeader';
import { UnsplashSearch } from '@/components/media/UnsplashSearch';
import { useMedia, useDownloadUnsplash } from '@/hooks/useMedia';
import { MediaItem, UnsplashPhoto } from '@/types/media';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CardImage, ThumbnailImage } from '@/components/ui/OptimizedImage';

// Mock collections data (would come from API)
const COLLECTIONS = [
  { id: 'business', name: 'Business', count: 1250, thumbnail: '/images/collections/business.jpg' },
  { id: 'nature', name: 'Nature', count: 3400, thumbnail: '/images/collections/nature.jpg' },
  { id: 'technology', name: 'Technologie', count: 890, thumbnail: '/images/collections/tech.jpg' },
  { id: 'travel', name: 'Voyage', count: 2100, thumbnail: '/images/collections/travel.jpg' },
  { id: 'food', name: 'Cuisine', count: 1800, thumbnail: '/images/collections/food.jpg' },
  { id: 'architecture', name: 'Architecture', count: 950, thumbnail: '/images/collections/arch.jpg' },
  { id: 'people', name: 'Personnes', count: 4200, thumbnail: '/images/collections/people.jpg' },
  { id: 'abstract', name: 'Abstrait', count: 720, thumbnail: '/images/collections/abstract.jpg' },
];

// Trending searches (would come from API)
const TRENDING_SEARCHES = [
  'artificial intelligence',
  'remote work',
  'sustainable',
  'diversity',
  'healthcare',
  'fintech',
  'startup',
  'team collaboration',
];

type UnsplashTab = 'search' | 'collections' | 'recent' | 'favorites';

export default function UnsplashPage() {
  const { t } = useTranslation(['media', 'common']);
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<UnsplashTab>('search');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  // Recent downloads from Unsplash
  const { data: recentDownloads, isLoading: recentLoading } = useMedia({
    source: 'unsplash',
    sortBy: 'created_at',
    sortOrder: 'desc',
    perPage: 20,
  });

  // Download stats
  const downloadStats = useMemo(() => {
    const items = recentDownloads?.data || [];
    const thisMonth = items.filter((m) => {
      const date = new Date(m.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return {
      total: recentDownloads?.meta?.total || 0,
      thisMonth,
    };
  }, [recentDownloads]);

  // Handle media select
  const handleSelect = useCallback(
    (media: MediaItem) => {
      navigate('/admin/media');
    },
    [navigate]
  );

  // Handle collection select
  const handleCollectionSelect = useCallback((collectionId: string) => {
    setSelectedCollection(collectionId);
    setActiveTab('search');
  }, []);

  // Render search tab
  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Trending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('media:unsplash.trending')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                onClick={() => {
                  // Would trigger search
                }}
              >
                {term}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Search */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <UnsplashSearch onSelect={handleSelect} />
        </CardContent>
      </Card>
    </div>
  );

  // Render collections tab
  const renderCollectionsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {COLLECTIONS.map((collection) => (
          <Card
            key={collection.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCollectionSelect(collection.id)}
          >
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
              {collection.thumbnail ? (
                <CardImage
                  src={collection.thumbnail}
                  alt={collection.name}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Layers className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-medium">{collection.name}</h3>
                <p className="text-white/70 text-sm">
                  {collection.count.toLocaleString()} photos
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render recent downloads tab
  const renderRecentTab = () => (
    <div className="space-y-6">
      {recentLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : recentDownloads?.data && recentDownloads.data.length > 0 ? (
        <>
          {/* Group by date */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentDownloads.data.map((media) => (
              <div
                key={media.id}
                className="group relative rounded-lg overflow-hidden border cursor-pointer hover:border-primary/50"
                onClick={() => setPreviewMedia(media)}
              >
                <div className="aspect-square bg-muted">
                  {media.thumbnailUrl ? (
                    <ThumbnailImage
                      src={media.thumbnailUrl}
                      alt={media.metadata.alt || media.filename}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    {t('common:view')}
                  </Button>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(media.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {(recentDownloads?.meta?.currentPage || 1) < (recentDownloads?.meta?.lastPage || 1) && (
            <div className="flex justify-center">
              <Button variant="outline">{t('common:loadMore')}</Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Download className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t('media:unsplash.noRecentDownloads')}</p>
        </div>
      )}
    </div>
  );

  // Render favorites tab (placeholder)
  const renderFavoritesTab = () => (
    <div className="text-center py-12">
      <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">{t('media:unsplash.noFavorites')}</p>
      <p className="text-sm text-muted-foreground mt-2">
        {t('media:unsplash.favoritesDescription')}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title={t('media:pages.unsplash.title')}
        description={t('media:pages.unsplash.description')}
        backLink="/admin/media"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-purple-600 bg-purple-100">
              <Image className="h-3 w-3 mr-1" />
              {downloadStats.total} téléchargés
            </Badge>
          </div>
        }
      />

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.totalDownloads')}
            </CardTitle>
            <Download className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downloadStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.thisMonth')}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downloadStats.thisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Layers className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{COLLECTIONS.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.favorites')}
            </CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UnsplashTab)}>
          <TabsList>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('media:tabs.search')}
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('media:tabs.recent')}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t('media:tabs.favorites')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="search" className="mt-0">
              {renderSearchTab()}
            </TabsContent>
            <TabsContent value="collections" className="mt-0">
              {renderCollectionsTab()}
            </TabsContent>
            <TabsContent value="recent" className="mt-0">
              {renderRecentTab()}
            </TabsContent>
            <TabsContent value="favorites" className="mt-0">
              {renderFavoritesTab()}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-3xl">
          {previewMedia && (
            <>
              <DialogHeader>
                <DialogTitle>{previewMedia.filename}</DialogTitle>
                <DialogDescription>
                  {previewMedia.metadata.attribution}
                </DialogDescription>
              </DialogHeader>

              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewMedia.previewUrl || previewMedia.url}
                  alt={previewMedia.metadata.alt || ''}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  {previewMedia.dimensions && (
                    <span>
                      {previewMedia.dimensions.width}×{previewMedia.dimensions.height}
                    </span>
                  )}
                  <span>
                    {format(new Date(previewMedia.createdAt), 'PPP', { locale: fr })}
                  </span>
                </div>
                <Badge variant="secondary">
                  <Eye className="h-3 w-3 mr-1" />
                  {previewMedia.usageCount} utilisations
                </Badge>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewMedia(null)}>
                  {t('common:close')}
                </Button>
                <Button onClick={() => window.open(previewMedia.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('media:details.openOriginal')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Attribution Footer */}
      <div className="px-6 py-3 border-t bg-muted/30 text-center text-xs text-muted-foreground">
        Photos fournies par{' '}
        <a
          href="https://unsplash.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Unsplash
        </a>
        . Attribution automatique incluse.
      </div>
    </div>
  );
}
