import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Image,
  Upload,
  Search,
  X,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMedia } from '@/hooks/useMedia';

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  type: 'image' | 'video' | 'document';
  source?: 'library' | 'unsplash' | 'dalle';
}

export interface MediaSelectorProps {
  value?: MediaItem | null;
  onChange: (media: MediaItem | null) => void;
  accept?: string[];
  allowUnsplash?: boolean;
  allowDalle?: boolean;
  triggerClassName?: string;
  placeholder?: string;
}

export function MediaSelector({
  value,
  onChange,
  accept = ['image/*'],
  allowUnsplash = true,
  allowDalle = false,
  triggerClassName,
  placeholder,
}: MediaSelectorProps) {
  const { t } = useTranslation('media');
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'unsplash' | 'dalle'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { mediaItems, uploadMedia, searchUnsplash } = useMedia();

  const handleSelect = (media: MediaItem) => {
    onChange(media);
    setOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsLoading(true);
    try {
      const uploaded = await uploadMedia(files[0]);
      if (uploaded) {
        handleSelect(uploaded);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {value ? (
          <div className={cn('relative group', triggerClassName)}>
            <img
              src={value.thumbnailUrl || value.url}
              alt={value.alt || ''}
              className="w-full h-32 object-cover rounded-lg border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm">
                {t('library.change')}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className={cn(
              'w-full h-32 border-dashed flex flex-col gap-2',
              triggerClassName
            )}
          >
            <Image className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {placeholder || t('library.selectImage')}
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('library.title')}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'unsplash' | 'dalle')}>
          <TabsList>
            <TabsTrigger value="library">{t('library.title')}</TabsTrigger>
            {allowUnsplash && (
              <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
            )}
            {allowDalle && <TabsTrigger value="dalle">DALL-E</TabsTrigger>}
          </TabsList>

          <div className="my-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('library.search')}
                className="pl-9"
              />
            </div>
            <label>
              <Button variant="outline" disabled={isLoading} asChild>
                <span>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {t('upload.button')}
                </span>
              </Button>
              <input
                type="file"
                accept={accept.join(',')}
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>

          <TabsContent value="library">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-4 gap-4 p-1">
                {mediaItems.map((media) => (
                  <button
                    key={media.id}
                    onClick={() => handleSelect(media)}
                    className={cn(
                      'relative aspect-video rounded-lg overflow-hidden border-2 transition-all',
                      value?.id === media.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                  >
                    <img
                      src={media.thumbnailUrl || media.url}
                      alt={media.alt || ''}
                      className="w-full h-full object-cover"
                    />
                    {value?.id === media.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {allowUnsplash && (
            <TabsContent value="unsplash">
              <div className="text-center py-12 text-muted-foreground">
                {t('unsplash.searchPrompt')}
              </div>
            </TabsContent>
          )}

          {allowDalle && (
            <TabsContent value="dalle">
              <div className="text-center py-12 text-muted-foreground">
                {t('dalle.generatePrompt')}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default MediaSelector;
