import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  File,
  Image,
  Film,
  Music,
  FileText,
  Archive,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { useUploadMedia } from '@/hooks/useMedia';
import {
  UploadFile,
  UploadOptions,
  MediaItem,
  MediaMetadata,
  DEFAULT_MEDIA_VALIDATION,
} from '@/types/media';
import { cn } from '@/lib/utils';

interface MediaUploaderProps {
  folderId?: number;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number;
  onUploadComplete?: (items: MediaItem[]) => void;
  showMetadataForm?: boolean;
}

type FileStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  result?: MediaItem;
  metadata: Partial<MediaMetadata>;
  previewUrl?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
  if (type.startsWith('video/')) return <Film className="h-5 w-5" />;
  if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
  if (type.includes('pdf') || type.includes('document') || type.includes('text'))
    return <FileText className="h-5 w-5" />;
  if (type.includes('zip') || type.includes('rar') || type.includes('archive'))
    return <Archive className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  folderId,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip',
  maxFiles = 20,
  maxFileSize = DEFAULT_MEDIA_VALIDATION.maxFileSize,
  onUploadComplete,
  showMetadataForm = true,
}) => {
  const { t } = useTranslation(['media', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMedia();

  // State
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Create preview URL for images
  const createPreviewUrl = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return t('media:upload.errors.tooLarge', {
          max: formatFileSize(maxFileSize),
        });
      }

      // Check allowed types
      const allowedTypes = DEFAULT_MEDIA_VALIDATION.allowedTypes;
      if (!allowedTypes.includes(file.type)) {
        // Check by extension as fallback
        const ext = file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip'];
        if (!ext || !allowedExtensions.includes(ext)) {
          return t('media:upload.errors.invalidType');
        }
      }

      return null;
    },
    [maxFileSize, t]
  );

  // Add files
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadItem[] = [];

      Array.from(files).forEach((file) => {
        // Check max files
        if (uploadItems.length + newItems.length >= maxFiles) {
          return;
        }

        // Validate
        const error = validateFile(file);

        newItems.push({
          id: generateId(),
          file,
          status: error ? 'error' : 'pending',
          progress: 0,
          error: error || undefined,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          },
          previewUrl: createPreviewUrl(file),
        });
      });

      setUploadItems((prev) => [...prev, ...newItems]);
    },
    [createPreviewUrl, maxFiles, uploadItems.length, validateFile]
  );

  // Remove file
  const removeFile = useCallback((id: string) => {
    setUploadItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // Update metadata
  const updateMetadata = useCallback(
    (id: string, key: keyof MediaMetadata, value: string) => {
      setUploadItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, metadata: { ...item.metadata, [key]: value } }
            : item
        )
      );
    },
    []
  );

  // Upload single file
  const uploadFile = useCallback(
    async (item: UploadItem): Promise<MediaItem | null> => {
      try {
        // Update status to uploading
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'uploading' as FileStatus, progress: 0 } : i
          )
        );

        const result = await uploadMutation.mutateAsync({
          file: item.file,
          options: {
            folderId,
            metadata: item.metadata,
          },
          onProgress: (progress) => {
            setUploadItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, progress } : i
              )
            );
          },
        });

        // Update status to completed
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'completed' as FileStatus, progress: 100, result }
              : i
          )
        );

        return result;
      } catch (error) {
        // Update status to error
        const errorMessage = error instanceof Error ? error.message : t('media:upload.errors.failed');
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error' as FileStatus,
                  error: errorMessage,
                }
              : i
          )
        );
        return null;
      }
    },
    [folderId, t, uploadMutation]
  );

  // Upload all
  const uploadAll = useCallback(async () => {
    const pendingItems = uploadItems.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    const results: MediaItem[] = [];

    // Upload sequentially to avoid overwhelming the server
    for (const item of pendingItems) {
      const result = await uploadFile(item);
      if (result) {
        results.push(result);
      }
    }

    setIsUploading(false);

    if (results.length > 0) {
      onUploadComplete?.(results);
    }
  }, [uploadFile, uploadItems, onUploadComplete]);

  // Retry failed
  const retryFailed = useCallback(async (id: string) => {
    const item = uploadItems.find((i) => i.id === id);
    if (!item || item.status !== 'error') return;

    // Reset to pending
    setUploadItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'pending' as FileStatus, error: undefined } : i
      )
    );

    // Then upload
    await uploadFile(item);
  }, [uploadFile, uploadItems]);

  // Clear completed
  const clearCompleted = useCallback(() => {
    setUploadItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl && item.status === 'completed') {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return prev.filter((i) => i.status !== 'completed');
    });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    uploadItems.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setUploadItems([]);
  }, [uploadItems]);

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        addFiles(files);
      }
    },
    [addFiles]
  );

  // Stats
  const stats = useMemo(() => {
    const pending = uploadItems.filter((i) => i.status === 'pending').length;
    const uploading = uploadItems.filter((i) => i.status === 'uploading').length;
    const completed = uploadItems.filter((i) => i.status === 'completed').length;
    const errors = uploadItems.filter((i) => i.status === 'error').length;
    return { pending, uploading, completed, errors, total: uploadItems.length };
  }, [uploadItems]);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              isDragging ? 'bg-primary/20' : 'bg-muted'
            )}
          >
            <Upload
              className={cn(
                'h-8 w-8',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          <h3 className="text-lg font-medium mb-1">
            {isDragging
              ? t('media:upload.dropHere')
              : t('media:upload.dragAndDrop')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('media:upload.orBrowse')}
          </p>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadItems.length >= maxFiles}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('media:upload.selectFiles')}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                addFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <p className="text-xs text-muted-foreground mt-4">
            {t('media:upload.maxSize', { size: formatFileSize(maxFileSize) })} •{' '}
            {t('media:upload.maxFiles', { count: maxFiles })}
          </p>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadItems.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{t('media:upload.queue')}</h3>
              <Badge variant="secondary">{stats.total}</Badge>
              {stats.completed > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {stats.completed} {t('media:upload.completed')}
                </Badge>
              )}
              {stats.errors > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {stats.errors} {t('media:upload.errors')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stats.completed > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  {t('media:upload.clearCompleted')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAll}>
                {t('media:upload.clearAll')}
              </Button>
            </div>
          </div>

          {/* Files List */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {uploadItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'border rounded-lg p-3',
                    item.status === 'error' && 'border-red-200 bg-red-50',
                    item.status === 'completed' && 'border-green-200 bg-green-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Preview / Icon */}
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {getFileIcon(item.file.type)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{item.file.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>

                      {/* Progress / Status */}
                      {item.status === 'uploading' && (
                        <div className="space-y-1">
                          <Progress value={item.progress} className="h-1" />
                          <span className="text-xs text-muted-foreground">
                            {item.progress}% {t('media:upload.uploading')}
                          </span>
                        </div>
                      )}

                      {item.status === 'completed' && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <Check className="h-4 w-4" />
                          {t('media:upload.uploadComplete')}
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          {item.error}
                        </div>
                      )}

                      {/* Metadata form (only for pending) */}
                      {showMetadataForm && item.status === 'pending' && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              {t('media:upload.editMetadata')}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-2">
                            <div>
                              <Label className="text-xs">{t('media:metadata.title')}</Label>
                              <Input
                                value={item.metadata.title || ''}
                                onChange={(e) =>
                                  updateMetadata(item.id, 'title', e.target.value)
                                }
                                className="h-8 text-sm mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{t('media:metadata.alt')}</Label>
                              <Input
                                value={item.metadata.alt || ''}
                                onChange={(e) =>
                                  updateMetadata(item.id, 'alt', e.target.value)
                                }
                                className="h-8 text-sm mt-1"
                                placeholder={t('media:metadata.altPlaceholder')}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {item.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => retryFailed(item.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {(item.status === 'pending' || item.status === 'error') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Upload Button */}
          {stats.pending > 0 && (
            <Button
              onClick={uploadAll}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('media:upload.uploading')}...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('media:upload.uploadFiles', { count: stats.pending })}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
