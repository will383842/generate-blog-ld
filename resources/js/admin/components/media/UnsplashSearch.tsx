import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Download,
  ExternalLink,
  Heart,
  User,
  X,
  RefreshCw,
  Maximize2,
  Check,
  Image,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useSearchUnsplash, useDownloadUnsplash } from '@/hooks/useMedia';
import { UnsplashPhoto, UnsplashSearchParams, MediaItem } from '@/types/media';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface UnsplashSearchProps {
  folderId?: number;
  onSelect?: (media: MediaItem) => void;
}

const ORIENTATION_OPTIONS = [
  { value: 'all', label: 'Toutes orientations' },
  { value: 'landscape', label: 'Paysage' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'squarish', label: 'Carré' },
];

const COLOR_OPTIONS = [
  { value: '', label: 'Toutes couleurs' },
  { value: 'black_and_white', label: 'Noir & Blanc' },
  { value: 'black', label: 'Noir' },
  { value: 'white', label: 'Blanc' },
  { value: 'yellow', label: 'Jaune' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Rouge' },
  { value: 'purple', label: 'Violet' },
  { value: 'magenta', label: 'Magenta' },
  { value: 'green', label: 'Vert' },
  { value: 'teal', label: 'Turquoise' },
  { value: 'blue', label: 'Bleu' },
];

const POPULAR_SEARCHES = [
  'nature',
  'business',
  'technology',
  'travel',
  'food',
  'architecture',
  'people',
  'abstract',
  'city',
  'office',
];

export const UnsplashSearch: React.FC<UnsplashSearchProps> = ({
  folderId,
  onSelect,
}) => {
  const { t } = useTranslation(['media', 'common']);

  // State
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useState<UnsplashSearchParams>({
    query: '',
    page: 1,
    perPage: 24,
    orderBy: 'relevant',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<UnsplashPhoto | null>(null);

  // Debounced search
  const debouncedQuery = useDebounce(query, 500);

  // Update search params when query changes
  React.useEffect(() => {
    if (debouncedQuery) {
      setSearchParams((prev) => ({ ...prev, query: debouncedQuery, page: 1 }));
    }
  }, [debouncedQuery]);

  // Query
  const { data, isLoading, isFetching } = useSearchUnsplash(searchParams, !!searchParams.query);
  const downloadMutation = useDownloadUnsplash();

  const photos = data?.results || [];
  const totalPages = data?.totalPages || 0;
  const totalResults = data?.total || 0;

  // Search handler
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // Quick search
  const handleQuickSearch = useCallback((term: string) => {
    setQuery(term);
    setSearchParams((prev) => ({ ...prev, query: term, page: 1 }));
  }, []);

  // Filter change
  const handleFilterChange = useCallback(
    (key: keyof UnsplashSearchParams, value: string | number | undefined) => {
      setSearchParams((prev) => ({
        ...prev,
        [key]: value === 'all' || value === '' ? undefined : value,
        page: 1,
      }));
    },
    []
  );

  // Load more
  const handleLoadMore = useCallback(() => {
    if (searchParams.page && searchParams.page < totalPages) {
      setSearchParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [searchParams.page, totalPages]);

  // Select photo
  const handleSelectPhoto = useCallback((photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
  }, []);

  // Download and add to library
  const handleDownload = useCallback(async () => {
    if (!selectedPhoto) return;

    try {
      const result = await downloadMutation.mutateAsync({
        photo: selectedPhoto,
        folderId,
      });

      setSelectedPhoto(null);

      if (onSelect) {
        onSelect(result);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [downloadMutation, folderId, onSelect, selectedPhoto]);

  // Copy attribution
  const copyAttribution = useCallback(async (photo: UnsplashPhoto) => {
    const attribution = `Photo by ${photo.user.name} on Unsplash`;
    await navigator.clipboard.writeText(attribution);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('media:unsplash.searchPlaceholder')}
            className="pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchParams((prev) => ({ ...prev, query: '', page: 1 }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Orientation */}
        <Select
          value={searchParams.orientation || 'all'}
          onValueChange={(v) => handleFilterChange('orientation', v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORIENTATION_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Color */}
        <Select
          value={searchParams.color || ''}
          onValueChange={(v) => handleFilterChange('color', v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Couleur" />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Popular Searches */}
      {!searchParams.query && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('media:unsplash.popularSearches')}:
          </span>
          {POPULAR_SEARCHES.map((term) => (
            <Button
              key={term}
              variant="outline"
              size="sm"
              onClick={() => handleQuickSearch(term)}
              className="h-7"
            >
              {term}
            </Button>
          ))}
        </div>
      )}

      {/* Results */}
      {searchParams.query ? (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalResults.toLocaleString()} {t('media:unsplash.results')}
              </span>
              {isFetching && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select
              value={searchParams.orderBy || 'relevant'}
              onValueChange={(v) =>
                handleFilterChange('orderBy', v as 'relevant' | 'latest')
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant">{t('media:unsplash.sortRelevant')}</SelectItem>
                <SelectItem value="latest">{t('media:unsplash.sortLatest')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photos Grid */}
          {isLoading && !photos.length ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={cn(
                      'group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                      selectedPhoto?.id === photo.id
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-primary/50'
                    )}
                    onClick={() => handleSelectPhoto(photo)}
                    style={{ backgroundColor: photo.color }}
                  >
                    {/* Image */}
                    <div className="aspect-[4/3]">
                      <img
                        src={photo.urls.small}
                        alt={photo.altDescription || photo.description || 'Unsplash photo'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Selection Indicator */}
                    {selectedPhoto?.id === photo.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {/* Photographer */}
                        <a
                          href={photo.user.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-white text-sm hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photo.user.profileImage ? (
                            <img
                              src={photo.user.profileImage}
                              alt={photo.user.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span className="truncate">{photo.user.name}</span>
                        </a>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPhoto(photo);
                              }}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('media:unsplash.preview')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Likes */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        {photo.likes.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {searchParams.page && searchParams.page < totalPages && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {t('media:unsplash.loadMore')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t('media:unsplash.noResults')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t('media:unsplash.searchPrompt')}</p>
        </div>
      )}

      {/* Selected Photo Actions */}
      {selectedPhoto && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedPhoto.urls.thumb}
              alt=""
              className="w-12 h-12 rounded object-cover"
            />
            <div>
              <p className="font-medium truncate max-w-xs">{selectedPhoto.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPhoto.width}×{selectedPhoto.height}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
              {downloadMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('media:unsplash.addToLibrary')}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {previewPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <a
                    href={previewPhoto.user.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    {previewPhoto.user.profileImage && (
                      <img
                        src={previewPhoto.user.profileImage}
                        alt={previewPhoto.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    {previewPhoto.user.name}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </DialogTitle>
                <DialogDescription>
                  {previewPhoto.description || previewPhoto.altDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="relative">
                <img
                  src={previewPhoto.urls.regular}
                  alt={previewPhoto.altDescription || ''}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {previewPhoto.width}×{previewPhoto.height}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {previewPhoto.likes.toLocaleString()}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setSelectedPhoto(previewPhoto);
                    setPreviewPhoto(null);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('media:unsplash.select')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Attribution Notice */}
      <div className="text-xs text-muted-foreground text-center">
        {t('media:unsplash.attribution')}
        <a
          href="https://unsplash.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline ml-1"
        >
          Unsplash
        </a>
      </div>
    </div>
  );
};

export default UnsplashSearch;
