import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  ArrowLeft,
  FolderPlus,
  Tag,
  Settings,
  Check,
  X,
  RefreshCw,
  Image,
  Film,
  Music,
  FileText,
  Archive,
  ChevronDown,
  Folder,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { Checkbox } from '@/components/ui/Checkbox';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { PageHeader } from '@/components/layout/PageHeader';
import { MediaUploader } from '@/components/media/MediaUploader';
import {
  useMediaFolders,
  useCreateFolder,
  useBulkMediaAction,
} from '@/hooks/useMedia';
import { MediaItem, MediaFolder, MediaMetadata } from '@/types/media';
import { ThumbnailImage } from '@/components/ui/OptimizedImage';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  media: MediaItem;
  selected: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'hero', label: 'Hero / Banner' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'icon', label: 'Icône' },
  { value: 'background', label: 'Arrière-plan' },
  { value: 'profile', label: 'Photo de profil' },
  { value: 'document', label: 'Document' },
  { value: 'video', label: 'Vidéo' },
];

const PREDEFINED_TAGS = [
  'hero',
  'banner',
  'thumbnail',
  'icon',
  'background',
  'portrait',
  'landscape',
  'product',
  'service',
  'team',
  'office',
  'event',
  'testimonial',
];

export default function MediaUploadPage() {
  const { t } = useTranslation(['media', 'common']);
  const navigate = useNavigate();

  // State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>();
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [bulkMetadataOpen, setBulkMetadataOpen] = useState(false);
  const [bulkMetadata, setBulkMetadata] = useState<Partial<MediaMetadata>>({
    tags: [],
  });
  const [bulkCategory, setBulkCategory] = useState<string>('');

  // Queries
  const { data: folders = [] } = useMediaFolders();
  const createFolderMutation = useCreateFolder();
  const bulkMutation = useBulkMediaAction();

  // Selected count
  const selectedCount = useMemo(
    () => uploadedFiles.filter((f) => f.selected).length,
    [uploadedFiles]
  );

  // Handle upload complete
  const handleUploadComplete = useCallback((items: MediaItem[]) => {
    const newFiles = items.map((media) => ({
      id: media.uuid,
      media,
      selected: false,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    const allSelected = uploadedFiles.every((f) => f.selected);
    setUploadedFiles((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
  }, [uploadedFiles]);

  // Create folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    const result = await createFolderMutation.mutateAsync({
      name: newFolderName,
      parentId: selectedFolder,
    });

    setSelectedFolder(result.id);
    setNewFolderDialog(false);
    setNewFolderName('');
  }, [createFolderMutation, newFolderName, selectedFolder]);

  // Apply bulk metadata
  const handleApplyBulkMetadata = useCallback(async () => {
    const selectedIds = uploadedFiles.filter((f) => f.selected).map((f) => f.media.id);
    if (selectedIds.length === 0) return;

    await bulkMutation.mutateAsync({
      action: 'update_metadata',
      mediaIds: selectedIds,
      metadata: bulkMetadata,
    });

    setBulkMetadataOpen(false);
  }, [bulkMetadata, bulkMutation, uploadedFiles]);

  // Move to folder
  const handleMoveToFolder = useCallback(
    async (folderId: number) => {
      const selectedIds = uploadedFiles.filter((f) => f.selected).map((f) => f.media.id);
      if (selectedIds.length === 0) return;

      await bulkMutation.mutateAsync({
        action: 'move',
        mediaIds: selectedIds,
        folderId,
      });
    },
    [bulkMutation, uploadedFiles]
  );

  // Delete selected
  const handleDeleteSelected = useCallback(async () => {
    const selectedIds = uploadedFiles.filter((f) => f.selected).map((f) => f.media.id);
    if (selectedIds.length === 0) return;

    await bulkMutation.mutateAsync({
      action: 'delete',
      mediaIds: selectedIds,
    });

    setUploadedFiles((prev) => prev.filter((f) => !f.selected));
  }, [bulkMutation, uploadedFiles]);

  // Add tag to bulk metadata
  const addTag = useCallback((tag: string) => {
    setBulkMetadata((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tag].filter((t, i, arr) => arr.indexOf(t) === i),
    }));
  }, []);

  // Remove tag from bulk metadata
  const removeTag = useCallback((tag: string) => {
    setBulkMetadata((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  }, []);

  // Get type icon
  const getTypeIcon = (type: string) => {
    if (type === 'image') return <Image className="h-4 w-4" />;
    if (type === 'video') return <Film className="h-4 w-4" />;
    if (type === 'audio') return <Music className="h-4 w-4" />;
    if (type === 'document') return <FileText className="h-4 w-4" />;
    return <Archive className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title={t('media:pages.upload.title')}
        description={t('media:pages.upload.description')}
        backLink="/admin/media"
        actions={
          <div className="flex items-center gap-2">
            {uploadedFiles.length > 0 && (
              <Button variant="outline" onClick={() => navigate('/admin/media')}>
                <Check className="h-4 w-4 mr-2" />
                {t('common:done')}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Folder Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {t('media:upload.destinationFolder')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedFolder?.toString() || 'root'}
                  onValueChange={(v) => setSelectedFolder(v === 'root' ? undefined : parseInt(v))}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder={t('media:upload.selectFolder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {t('media:library.root')}
                      </div>
                    </SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {t('media:library.newFolder')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploader */}
          <Card>
            <CardHeader>
              <CardTitle>{t('media:upload.dropzone')}</CardTitle>
              <CardDescription>{t('media:upload.dropzoneDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaUploader
                folderId={selectedFolder}
                onUploadComplete={handleUploadComplete}
                maxFiles={50}
              />
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {t('media:upload.uploadedFiles')}
                      <Badge variant="secondary">{uploadedFiles.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {t('media:upload.uploadedFilesDescription')}
                    </CardDescription>
                  </div>

                  {/* Bulk Actions */}
                  {selectedCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedCount} {t('media:library.selected')}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkMetadataOpen(true)}
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        {t('media:upload.editMetadata')}
                      </Button>
                      <Select onValueChange={(v) => handleMoveToFolder(parseInt(v))}>
                        <SelectTrigger className="w-[150px] h-9">
                          <SelectValue placeholder={t('media:library.moveTo')} />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id.toString()}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Select All */}
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    checked={uploadedFiles.length > 0 && uploadedFiles.every((f) => f.selected)}
                    onCheckedChange={selectAll}
                  />
                  <Label className="text-sm">{t('common:selectAll')}</Label>
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        'group relative rounded-lg border overflow-hidden cursor-pointer transition-all',
                        file.selected && 'ring-2 ring-primary border-primary'
                      )}
                      onClick={() => toggleSelection(file.id)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-muted">
                        {file.media.type === 'image' && file.media.thumbnailUrl ? (
                          <ThumbnailImage
                            src={file.media.thumbnailUrl}
                            alt={file.media.filename}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {getTypeIcon(file.media.type)}
                          </div>
                        )}
                      </div>

                      {/* Selection Checkbox */}
                      <div
                        className={cn(
                          'absolute top-2 left-2 transition-opacity',
                          file.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center',
                            file.selected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-white/80 border-white'
                          )}
                        >
                          {file.selected && <Check className="h-3 w-3" />}
                        </div>
                      </div>

                      {/* Filename */}
                      <div className="p-2">
                        <p className="text-xs truncate" title={file.media.filename}>
                          {file.media.filename}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('media:library.newFolderTitle')}</DialogTitle>
            <DialogDescription>{t('media:library.newFolderDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">{t('media:library.folderName')}</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t('media:library.folderNamePlaceholder')}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Metadata Dialog */}
      <Dialog open={bulkMetadataOpen} onOpenChange={setBulkMetadataOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('media:upload.bulkMetadata')}</DialogTitle>
            <DialogDescription>
              {t('media:upload.bulkMetadataDescription', { count: selectedCount })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category */}
            <div>
              <Label>{t('media:metadata.category')}</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('media:metadata.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alt Text */}
            <div>
              <Label>{t('media:metadata.alt')}</Label>
              <Input
                value={bulkMetadata.alt || ''}
                onChange={(e) =>
                  setBulkMetadata((prev) => ({ ...prev, alt: e.target.value }))
                }
                placeholder={t('media:metadata.altPlaceholder')}
                className="mt-1"
              />
            </div>

            {/* Copyright */}
            <div>
              <Label>{t('media:metadata.copyright')}</Label>
              <Input
                value={bulkMetadata.copyright || ''}
                onChange={(e) =>
                  setBulkMetadata((prev) => ({ ...prev, copyright: e.target.value }))
                }
                placeholder="© 2024 Company Name"
                className="mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <Label>{t('media:metadata.tags')}</Label>
              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                {(bulkMetadata.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {PREDEFINED_TAGS.filter((t) => !(bulkMetadata.tags || []).includes(t)).map(
                  (tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMetadataOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleApplyBulkMetadata} disabled={bulkMutation.isPending}>
              {bulkMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              {t('common:apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
