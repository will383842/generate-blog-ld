import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Check,
  Trash2,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface PhotoItem {
  id: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  attribution?: string;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
}

interface PhotoGalleryProps {
  photos: PhotoItem[];
  selectable?: boolean;
  selectedIds?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  onDelete?: (photoId: number) => void;
  onDownload?: (photoId: number) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onDelete,
  onDownload,
  columns = 4,
}) => {
  const { t } = useTranslation(['press', 'common']);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Open lightbox
  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setLightboxOpen(true);
  }, []);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setZoom(1);
  }, []);

  // Navigate lightbox
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setZoom(1);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setZoom(1);
  }, [photos.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    },
    [goToPrevious, goToNext, closeLightbox]
  );

  // Toggle selection
  const toggleSelection = useCallback(
    (photoId: number) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedIds);
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId);
      } else {
        newSelection.add(photoId);
      }
      onSelectionChange(newSelection);
    },
    [selectedIds, onSelectionChange]
  );

  // Select all
  const selectAll = useCallback(() => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set(photos.map((p) => p.id)));
  }, [photos, onSelectionChange]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  }, []);

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Grid columns class
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  }[columns];

  const currentPhoto = photos[currentIndex];

  return (
    <div className="space-y-4">
      {/* Selection Toolbar */}
      {selectable && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                <Badge variant="secondary">
                  {t('common:selected', { count: selectedIds.size })}
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  {t('common:clearSelection')}
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {t('common:selectAll')}
              </Button>
            )}
          </div>

          {selectedIds.size > 0 && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                selectedIds.forEach((id) => onDelete(id));
                clearSelection();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common:delete')}
            </Button>
          )}
        </div>
      )}

      {/* Photo Grid */}
      <div className={cn('grid gap-3', gridClass)}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              'group relative aspect-square rounded-lg overflow-hidden cursor-pointer',
              'border-2 transition-all',
              selectedIds.has(photo.id)
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-transparent hover:border-primary/50'
            )}
            onClick={() => {
              if (selectable) {
                toggleSelection(photo.id);
              } else {
                openLightbox(index);
              }
            }}
          >
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.alt || ''}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div
              className={cn(
                'absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors',
                selectedIds.has(photo.id) && 'bg-black/20'
              )}
            />

            {/* Selection Checkbox */}
            {selectable && (
              <div
                className={cn(
                  'absolute top-2 left-2 transition-opacity',
                  selectedIds.has(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    selectedIds.has(photo.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/80 text-gray-600'
                  )}
                >
                  {selectedIds.has(photo.id) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(index);
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common:view')}</TooltipContent>
              </Tooltip>

              {onDownload && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(photo.id);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common:download')}</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Attribution Badge */}
            {photo.attribution && (
              <div className="absolute bottom-2 left-2 right-2">
                <Badge variant="secondary" className="text-xs truncate max-w-full">
                  © {photo.attribution}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">
                {currentIndex + 1} / {photos.length}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={zoomOut}
                      disabled={zoom <= 0.5}
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common:zoomOut')}</TooltipContent>
                </Tooltip>

                <span className="text-white text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={zoomIn}
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common:zoomIn')}</TooltipContent>
                </Tooltip>

                {onDownload && currentPhoto && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => onDownload(currentPhoto.id)}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common:download')}</TooltipContent>
                  </Tooltip>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={closeLightbox}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Image */}
          <div className="flex items-center justify-center w-full h-[80vh] overflow-auto">
            {currentPhoto && (
              <img
                src={currentPhoto.url}
                alt={currentPhoto.alt || ''}
                style={{ transform: `scale(${zoom})` }}
                className="max-w-full max-h-full object-contain transition-transform"
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Footer Info */}
          {currentPhoto && (currentPhoto.caption || currentPhoto.attribution) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {currentPhoto.caption && (
                <p className="text-white text-center mb-1">{currentPhoto.caption}</p>
              )}
              {currentPhoto.attribution && (
                <p className="text-white/70 text-center text-sm">
                  © {currentPhoto.attribution}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 mt-2 text-white/50 text-xs">
                {currentPhoto.width && currentPhoto.height && (
                  <span>
                    {currentPhoto.width} × {currentPhoto.height}
                  </span>
                )}
                {currentPhoto.size && <span>{formatFileSize(currentPhoto.size)}</span>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
