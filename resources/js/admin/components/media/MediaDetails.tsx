import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Download,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Image,
  Film,
  Music,
  FileText,
  Archive,
  Edit,
  Save,
  Clock,
  Eye,
  Link,
  Calendar,
  User,
  Folder,
  Tag,
  Info,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  useMediaUsage,
  useUpdateMedia,
  useDeleteMedia,
} from '@/hooks/useMedia';
import { MediaItem, MediaType, MediaSource, UpdateMediaInput } from '@/types/media';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MediaDetailsProps {
  media: MediaItem;
  onClose: () => void;
  onDeleted?: () => void;
}

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  image: <Image className="h-5 w-5" />,
  video: <Film className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  archive: <Archive className="h-5 w-5" />,
};

const SOURCE_LABELS: Record<MediaSource, string> = {
  upload: 'Téléversé',
  unsplash: 'Unsplash',
  dalle: 'DALL-E',
  url: 'URL externe',
  pexels: 'Pexels',
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const MediaDetails: React.FC<MediaDetailsProps> = ({
  media,
  onClose,
  onDeleted,
}) => {
  const { t } = useTranslation(['media', 'common']);

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: media.metadata.title || '',
    alt: media.metadata.alt || '',
    caption: media.metadata.caption || '',
    description: media.metadata.description || '',
    copyright: media.metadata.copyright || '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [usageOpen, setUsageOpen] = useState(false);
  const [exifOpen, setExifOpen] = useState(false);

  // Queries
  const { data: usage = [], isLoading: usageLoading } = useMediaUsage(media.id);

  // Mutations
  const updateMutation = useUpdateMedia();
  const deleteMutation = useDeleteMedia();

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Save metadata
  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync({
      id: media.id,
      data: {
        metadata: {
          ...media.metadata,
          title: editData.title || undefined,
          alt: editData.alt || undefined,
          caption: editData.caption || undefined,
          description: editData.description || undefined,
          copyright: editData.copyright || undefined,
        },
      },
    });
    setIsEditing(false);
  }, [editData, media.id, media.metadata, updateMutation]);

  // Delete
  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(media.id);
    setDeleteDialogOpen(false);
    onDeleted?.();
  }, [deleteMutation, media.id, onDeleted]);

  // Download
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [media]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold truncate flex-1 mr-2">{t('media:details.title')}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preview */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
            {media.type === 'image' && (
              <img
                src={media.previewUrl || media.url}
                alt={media.metadata.alt || media.filename}
                className="w-full h-full object-contain"
              />
            )}
            {media.type === 'video' && (
              <video
                src={media.url}
                controls
                className="w-full h-full object-contain"
                poster={media.thumbnailUrl}
              />
            )}
            {media.type === 'audio' && (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Music className="h-16 w-16 text-muted-foreground mb-4" />
                <audio src={media.url} controls className="w-full max-w-xs" />
              </div>
            )}
            {(media.type === 'document' || media.type === 'archive') && (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {TYPE_ICONS[media.type]}
                <span className="text-sm text-muted-foreground mt-2">{media.mimeType}</span>
              </div>
            )}

            {/* Status overlay */}
            {media.status === 'processing' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            {media.status === 'error' && (
              <div className="absolute inset-0 bg-red-500/50 flex flex-col items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-white" />
                <span className="text-white text-sm mt-2">{t('media:details.processingError')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common:download')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(media.url, 'url')}
                >
                  {copied === 'url' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('media:details.copyUrl')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(media.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('media:details.openOriginal')}</TooltipContent>
            </Tooltip>

            <div className="flex-1" />

            <Button
              variant="destructive"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* File Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {TYPE_ICONS[media.type]}
              <span className="font-medium">{media.filename}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>{formatFileSize(media.size)}</span>
              </div>

              {media.dimensions && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Image className="h-4 w-4" />
                  <span>
                    {media.dimensions.width}×{media.dimensions.height}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(media.uploadedAt), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{media.usageCount} {t('media:details.uses')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{SOURCE_LABELS[media.source]}</Badge>
              <Badge variant="outline">{media.mimeType}</Badge>
              {media.folder && (
                <Badge variant="outline">
                  <Folder className="h-3 w-3 mr-1" />
                  {media.folder.name}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t('media:details.metadata')}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    setEditData({
                      title: media.metadata.title || '',
                      alt: media.metadata.alt || '',
                      caption: media.metadata.caption || '',
                      description: media.metadata.description || '',
                      copyright: media.metadata.copyright || '',
                    });
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t('common:cancel')}
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common:edit')}
                  </>
                )}
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title" className="text-xs">
                    {t('media:metadata.title')}
                  </Label>
                  <Input
                    id="title"
                    value={editData.title}
                    onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="alt" className="text-xs">
                    {t('media:metadata.alt')}
                  </Label>
                  <Input
                    id="alt"
                    value={editData.alt}
                    onChange={(e) => setEditData((prev) => ({ ...prev, alt: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="caption" className="text-xs">
                    {t('media:metadata.caption')}
                  </Label>
                  <Textarea
                    id="caption"
                    value={editData.caption}
                    onChange={(e) => setEditData((prev) => ({ ...prev, caption: e.target.value }))}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-xs">
                    {t('media:metadata.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="copyright" className="text-xs">
                    {t('media:metadata.copyright')}
                  </Label>
                  <Input
                    id="copyright"
                    value={editData.copyright}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, copyright: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  {t('common:save')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {media.metadata.title && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.title')}:</span>
                    <p className="font-medium">{media.metadata.title}</p>
                  </div>
                )}
                {media.metadata.alt && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.alt')}:</span>
                    <p>{media.metadata.alt}</p>
                  </div>
                )}
                {media.metadata.caption && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.caption')}:</span>
                    <p>{media.metadata.caption}</p>
                  </div>
                )}
                {media.metadata.description && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.description')}:</span>
                    <p className="text-muted-foreground">{media.metadata.description}</p>
                  </div>
                )}
                {media.metadata.attribution && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.attribution')}:</span>
                    <p>{media.metadata.attribution}</p>
                  </div>
                )}
                {media.metadata.copyright && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.copyright')}:</span>
                    <p>{media.metadata.copyright}</p>
                  </div>
                )}
                {media.metadata.tags && media.metadata.tags.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">{t('media:metadata.tags')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {media.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {!media.metadata.title &&
                  !media.metadata.alt &&
                  !media.metadata.caption &&
                  !media.metadata.description && (
                    <p className="text-muted-foreground italic">
                      {t('media:details.noMetadata')}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* EXIF Data (for images) */}
          {media.metadata.exif && Object.keys(media.metadata.exif).length > 0 && (
            <>
              <Separator />
              <Collapsible open={exifOpen} onOpenChange={setExifOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span>{t('media:details.exifData')}</span>
                    {exifOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-1 text-sm bg-muted/30 rounded-lg p-3">
                    {media.metadata.exif.camera && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Camera</span>
                        <span>{media.metadata.exif.camera}</span>
                      </div>
                    )}
                    {media.metadata.exif.lens && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lens</span>
                        <span>{media.metadata.exif.lens}</span>
                      </div>
                    )}
                    {media.metadata.exif.aperture && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aperture</span>
                        <span>{media.metadata.exif.aperture}</span>
                      </div>
                    )}
                    {media.metadata.exif.shutter && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shutter</span>
                        <span>{media.metadata.exif.shutter}</span>
                      </div>
                    )}
                    {media.metadata.exif.iso && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ISO</span>
                        <span>{media.metadata.exif.iso}</span>
                      </div>
                    )}
                    {media.metadata.exif.dateTaken && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date taken</span>
                        <span>{media.metadata.exif.dateTaken}</span>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* Usage */}
          <Separator />
          <Collapsible open={usageOpen} onOpenChange={setUsageOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  {t('media:details.usedIn')}
                  <Badge variant="secondary">{usage.length}</Badge>
                </span>
                {usageOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {usageLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : usage.length > 0 ? (
                <div className="space-y-2">
                  {usage.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.entityTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.entityType} - {item.field}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('media:details.notUsed')}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('media:dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {usage.length > 0
                ? t('media:dialogs.delete.descriptionWithUsage', { count: usage.length })
                : t('media:dialogs.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MediaDetails;
