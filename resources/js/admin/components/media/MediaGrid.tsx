import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Film,
  Music,
  FileText,
  Archive,
  Check,
  Eye,
  Download,
  Trash2,
  MoreVertical,
  Play,
  Clock,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { MediaItem, MediaType, MediaSource } from '@/types/media';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useInView } from 'react-intersection-observer';

interface MediaGridProps {
  media: MediaItem[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  selectedIds: Set<number>;
  onSelect: (item: MediaItem, isSelected: boolean) => void;
  onViewDetails: (item: MediaItem) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  image: <Image className="h-5 w-5" />,
  video: <Film className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  archive: <Archive className="h-5 w-5" />,
};

const SOURCE_BADGES: Record<MediaSource, { label: string; className: string }> = {
  upload: { label: 'Upload', className: 'bg-blue-100 text-blue-700' },
  unsplash: { label: 'Unsplash', className: 'bg-purple-100 text-purple-700' },
  dalle: { label: 'DALL-E', className: 'bg-pink-100 text-pink-700' },
  url: { label: 'URL', className: 'bg-gray-100 text-gray-700' },
  pexels: { label: 'Pexels', className: 'bg-green-100 text-green-700' },
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  isLoading,
  viewMode,
  selectedIds,
  onSelect,
  onViewDetails,
  onLoadMore,
  hasMore,
}) => {
  const { t } = useTranslation(['media', 'common']);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Infinite scroll sentinel
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Load more when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  // Handle image load
  const handleImageLoad = useCallback((id: number) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  }, []);

  // Render thumbnail
  const renderThumbnail = (item: MediaItem, size: 'small' | 'large' = 'large') => {
    const isLoaded = loadedImages.has(item.id);
    const thumbnailUrl = size === 'small' ? item.thumbnailUrl : item.previewUrl || item.thumbnailUrl;

    if (item.type === 'image' && thumbnailUrl) {
      return (
        <div className="relative w-full h-full bg-muted">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          <img
            src={thumbnailUrl}
            alt={item.metadata.alt || item.filename}
            className={cn(
              'w-full h-full object-cover transition-opacity',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => handleImageLoad(item.id)}
            loading="lazy"
          />
        </div>
      );
    }

    if (item.type === 'video' && thumbnailUrl) {
      return (
        <div className="relative w-full h-full bg-muted">
          <img
            src={thumbnailUrl}
            alt={item.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-8 w-8 text-white" />
          </div>
          {item.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
              {formatDuration(item.duration)}
            </div>
          )}
        </div>
      );
    }

    // Fallback for other types
    return (
      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center text-muted-foreground">
        {TYPE_ICONS[item.type]}
        <span className="text-xs mt-2 uppercase">
          {item.mimeType.split('/')[1] || item.type}
        </span>
      </div>
    );
  };

  // Grid view
  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const sourceBadge = SOURCE_BADGES[item.source];

            return (
              <div
                key={item.id}
                className={cn(
                  'group relative rounded-lg border overflow-hidden cursor-pointer transition-all',
                  isSelected && 'ring-2 ring-primary border-primary',
                  !isSelected && 'hover:border-primary/50'
                )}
                onClick={() => onViewDetails(item)}
              >
                {/* Thumbnail */}
                <div className="aspect-square relative">
                  {renderThumbnail(item)}

                  {/* Selection Checkbox */}
                  <div
                    className={cn(
                      'absolute top-2 left-2 transition-opacity',
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item, !isSelected);
                    }}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-white/80 border-white hover:border-primary'
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Source Badge */}
                  {item.source !== 'upload' && sourceBadge && (
                    <Badge
                      className={cn(
                        'absolute top-2 right-2 text-xs',
                        sourceBadge.className
                      )}
                    >
                      {sourceBadge.label}
                    </Badge>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(item);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common:view')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.url, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common:download')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Status indicator */}
                  {item.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-sm font-medium truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatFileSize(item.size)}</span>
                    {item.dimensions && (
                      <span>
                        {item.dimensions.width}×{item.dimensions.height}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex items-center justify-center py-4">
            {isLoading && (
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && media.length === 0 && (
          <div className="text-center py-12">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t('media:library.noMedia')}</p>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={media.length > 0 && selectedIds.size === media.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    media.forEach((m) => onSelect(m, true));
                  } else {
                    media.forEach((m) => onSelect(m, false));
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-16"></TableHead>
            <TableHead>{t('media:columns.filename')}</TableHead>
            <TableHead>{t('media:columns.type')}</TableHead>
            <TableHead>{t('media:columns.source')}</TableHead>
            <TableHead className="text-right">{t('media:columns.size')}</TableHead>
            <TableHead>{t('media:columns.dimensions')}</TableHead>
            <TableHead>{t('media:columns.date')}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {media.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const sourceBadge = SOURCE_BADGES[item.source];

            return (
              <TableRow
                key={item.id}
                className={cn(
                  'cursor-pointer',
                  isSelected && 'bg-muted/50'
                )}
                onClick={() => onViewDetails(item)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(item, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                    {renderThumbnail(item, 'small')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[200px]" title={item.filename}>
                      {item.filename}
                    </span>
                    {item.metadata.alt && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {item.metadata.alt}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {TYPE_ICONS[item.type]}
                    <span className="text-sm capitalize">{item.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {sourceBadge && (
                    <Badge className={cn('text-xs', sourceBadge.className)}>
                      {sourceBadge.label}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatFileSize(item.size)}
                </TableCell>
                <TableCell>
                  {item.dimensions ? (
                    `${item.dimensions.width}×${item.dimensions.height}`
                  ) : item.duration ? (
                    formatDuration(item.duration)
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(item.uploadedAt), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {format(new Date(item.uploadedAt), 'PPpp', { locale: fr })}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('common:view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('media:openOriginal')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = item.url;
                          link.download = item.filename;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('common:download')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Load More Sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-4">
          {isLoading && (
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && media.length === 0 && (
        <div className="text-center py-12">
          <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t('media:library.noMedia')}</p>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
