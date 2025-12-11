import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Upload,
  FolderPlus,
  Grid3X3,
  List,
  SlidersHorizontal,
  Image,
  Film,
  FileText,
  Music,
  Archive,
  Trash2,
  FolderOpen,
  ChevronRight,
  RefreshCw,
  X,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/Sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { MediaGrid } from './MediaGrid';
import { MediaDetails } from './MediaDetails';
import { MediaUploader } from './MediaUploader';
import { UnsplashSearch } from './UnsplashSearch';
import { DalleGenerator } from './DalleGenerator';
import {
  useMedia,
  useMediaFolders,
  useMediaStats,
  useDeleteMedia,
  useBulkMediaAction,
  useCreateFolder,
} from '@/hooks/useMedia';
import {
  MediaItem,
  MediaFilters,
  MediaFolder,
  MediaType,
  MediaSource,
} from '@/types/media';
import { cn } from '@/lib/utils';

interface MediaLibraryProps {
  onSelect?: (media: MediaItem | MediaItem[]) => void;
  multiple?: boolean;
  maxSelection?: number;
  allowedTypes?: MediaType[];
  showUpload?: boolean;
  showUnsplash?: boolean;
  showDalle?: boolean;
  embedded?: boolean;
}

type ViewMode = 'grid' | 'list';
type SourceTab = 'library' | 'upload' | 'unsplash' | 'dalle';

const TYPE_OPTIONS: { value: MediaType | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Tous les types', icon: <FolderOpen className="h-4 w-4" /> },
  { value: 'image', label: 'Images', icon: <Image className="h-4 w-4" /> },
  { value: 'video', label: 'Vidéos', icon: <Film className="h-4 w-4" /> },
  { value: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
  { value: 'document', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { value: 'archive', label: 'Archives', icon: <Archive className="h-4 w-4" /> },
];

const SOURCE_OPTIONS: { value: MediaSource | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes les sources' },
  { value: 'upload', label: 'Téléversé' },
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'dalle', label: 'DALL-E' },
  { value: 'url', label: 'URL' },
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Plus récent' },
  { value: 'created_at:asc', label: 'Plus ancien' },
  { value: 'filename:asc', label: 'Nom A-Z' },
  { value: 'filename:desc', label: 'Nom Z-A' },
  { value: 'size:desc', label: 'Taille (décroissant)' },
  { value: 'size:asc', label: 'Taille (croissant)' },
  { value: 'usage_count:desc', label: 'Plus utilisé' },
];

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  multiple = false,
  maxSelection = 10,
  allowedTypes,
  showUpload = true,
  showUnsplash = true,
  showDalle = true,
  embedded = false,
}) => {
  const { t } = useTranslation(['media', 'common']);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<SourceTab>('library');
  const [filters, setFilters] = useState<MediaFilters>({});
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(new Set());
  const [detailsMedia, setDetailsMedia] = useState<MediaItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>();

  // Queries
  const { data: mediaData, isLoading, refetch } = useMedia({
    ...filters,
    folderId: currentFolderId,
    type: allowedTypes?.length === 1 ? allowedTypes[0] : filters.type,
    page,
    perPage: viewMode === 'grid' ? 24 : 50,
  });
  const { data: folders = [] } = useMediaFolders();
  const { data: stats } = useMediaStats();

  // Mutations
  const deleteMutation = useDeleteMedia();
  const bulkMutation = useBulkMediaAction();
  const createFolderMutation = useCreateFolder();

  const media = mediaData?.data || [];
  const meta = mediaData?.meta;

  // Search handler with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value || undefined }));
      setPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  // Filter handlers
  const updateFilter = useCallback((key: keyof MediaFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchValue('');
    setPage(1);
  }, []);

  // Selection handlers
  const handleSelectMedia = useCallback(
    (item: MediaItem, isSelected: boolean) => {
      setSelectedMedia((prev) => {
        const newSet = new Set(prev);
        if (isSelected) {
          if (!multiple) {
            newSet.clear();
          } else if (newSet.size >= maxSelection) {
            return prev;
          }
          newSet.add(item.id);
        } else {
          newSet.delete(item.id);
        }
        return newSet;
      });
    },
    [multiple, maxSelection]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedMedia.size === media.length) {
      setSelectedMedia(new Set());
    } else {
      const ids = media.slice(0, maxSelection).map((m) => m.id);
      setSelectedMedia(new Set(ids));
    }
  }, [media, maxSelection, selectedMedia.size]);

  // Confirm selection
  const handleConfirmSelection = useCallback(() => {
    if (!onSelect || selectedMedia.size === 0) return;

    const selectedItems = media.filter((m) => selectedMedia.has(m.id));
    if (multiple) {
      onSelect(selectedItems);
    } else {
      onSelect(selectedItems[0]);
    }
  }, [media, multiple, onSelect, selectedMedia]);

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedMedia.size === 0) return;
    
    await bulkMutation.mutateAsync({
      action: 'delete',
      mediaIds: Array.from(selectedMedia),
    });
    setSelectedMedia(new Set());
  }, [bulkMutation, selectedMedia]);

  const handleBulkMove = useCallback(
    async (folderId: number) => {
      if (selectedMedia.size === 0) return;

      await bulkMutation.mutateAsync({
        action: 'move',
        mediaIds: Array.from(selectedMedia),
        folderId,
      });
      setSelectedMedia(new Set());
    },
    [bulkMutation, selectedMedia]
  );

  // Folder handlers
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    await createFolderMutation.mutateAsync({
      name: newFolderName,
      parentId: currentFolderId,
    });
    setNewFolderDialog(false);
    setNewFolderName('');
  }, [createFolderMutation, currentFolderId, newFolderName]);

  const handleNavigateFolder = useCallback((folderId: number | undefined) => {
    setCurrentFolderId(folderId);
    setPage(1);
  }, []);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) return [];

    const result: MediaFolder[] = [];
    let current = folders.find((f) => f.id === currentFolderId);
    
    while (current) {
      result.unshift(current);
      current = current.parentId ? folders.find((f) => f.id === current?.parentId) : undefined;
    }
    
    return result;
  }, [currentFolderId, folders]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.source) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.unused) count++;
    return count;
  }, [filters]);

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <MediaUploader
            folderId={currentFolderId}
            onUploadComplete={(items) => {
              setActiveTab('library');
              refetch();
            }}
          />
        );
      case 'unsplash':
        return (
          <UnsplashSearch
            folderId={currentFolderId}
            onSelect={(item) => {
              if (onSelect) {
                onSelect(item);
              }
              setActiveTab('library');
              refetch();
            }}
          />
        );
      case 'dalle':
        return (
          <DalleGenerator
            folderId={currentFolderId}
            onSelect={(item) => {
              if (onSelect) {
                onSelect(item);
              }
              setActiveTab('library');
              refetch();
            }}
          />
        );
      default:
        return (
          <MediaGrid
            media={media}
            isLoading={isLoading}
            viewMode={viewMode}
            selectedIds={selectedMedia}
            onSelect={handleSelectMedia}
            onViewDetails={setDetailsMedia}
            onLoadMore={() => setPage((p) => p + 1)}
            hasMore={meta ? meta.currentPage < meta.lastPage : false}
          />
        );
    }
  };

  return (
    <div className={cn('flex flex-col h-full', !embedded && 'bg-background')}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t('media:library.title')}</h2>
            {stats && (
              <Badge variant="secondary">
                {(stats.total ?? 0).toLocaleString()} {t('media:library.items')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNewFolderDialog(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              {t('media:library.newFolder')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={activeTab === 'library' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('library')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            {t('media:tabs.library')}
          </Button>
          {showUpload && (
            <Button
              variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('media:tabs.upload')}
            </Button>
          )}
          {showUnsplash && (
            <Button
              variant={activeTab === 'unsplash' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('unsplash')}
            >
              <Image className="h-4 w-4 mr-2" />
              Unsplash
            </Button>
          )}
          {showDalle && (
            <Button
              variant={activeTab === 'dalle' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('dalle')}
            >
              <span className="mr-2">🎨</span>
              DALL-E
            </Button>
          )}
        </div>

        {/* Filters Toolbar (only for library tab) */}
        {activeTab === 'library' && (
          <>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('media:library.searchPlaceholder')}
                  className="pl-9"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <Select
                value={filters.type || 'all'}
                onValueChange={(v) => updateFilter('type', v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.filter(
                    (opt) => !allowedTypes || opt.value === 'all' || allowedTypes.includes(opt.value as MediaType)
                  ).map(({ value, label, icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {icon}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={`${filters.sortBy || 'created_at'}:${filters.sortOrder || 'desc'}`}
                onValueChange={(v) => {
                  const [sortBy, sortOrder] = v.split(':');
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: sortBy as 'created_at' | 'name' | 'size' | 'type',
                    sortOrder: sortOrder as 'asc' | 'desc',
                  }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced Filters */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    {t('media:library.filters')}
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t('media:library.advancedFilters')}</SheetTitle>
                    <SheetDescription>
                      {t('media:library.advancedFiltersDescription')}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div>
                      <Label>{t('media:library.source')}</Label>
                      <Select
                        value={filters.source || 'all'}
                        onValueChange={(v) => updateFilter('source', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="unused"
                          checked={filters.unused || false}
                          onChange={(e) => updateFilter('unused', e.target.checked || undefined)}
                          className="rounded"
                        />
                        <Label htmlFor="unused">{t('media:library.unusedOnly')}</Label>
                      </div>
                    </div>
                  </div>
                  <SheetFooter>
                    <Button variant="outline" onClick={clearFilters}>
                      {t('common:clearAll')}
                    </Button>
                    <Button onClick={() => setShowFilters(false)}>
                      {t('common:apply')}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* View Mode */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Breadcrumbs & Bulk Actions */}
            <div className="flex items-center justify-between mt-3">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => handleNavigateFolder(undefined)}
                  className={cn(
                    'hover:text-primary',
                    !currentFolderId && 'font-medium text-primary'
                  )}
                >
                  {t('media:library.root')}
                </button>
                {breadcrumbs.map((folder) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => handleNavigateFolder(folder.id)}
                      className={cn(
                        'hover:text-primary',
                        folder.id === currentFolderId && 'font-medium text-primary'
                      )}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Bulk Actions */}
              {selectedMedia.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedMedia.size} {t('media:library.selected')}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {t('media:library.actions')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {folders.length > 0 && (
                        <>
                          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                            {t('media:library.moveTo')}
                          </DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => handleBulkMove(folder.id)}
                            >
                              <FolderOpen className="h-4 w-4 mr-2" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={handleBulkDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('common:delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMedia(new Set())}>
                    <X className="h-4 w-4 mr-2" />
                    {t('common:clear')}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">{renderTabContent()}</div>

        {/* Details Panel */}
        {detailsMedia && activeTab === 'library' && (
          <div className="w-80 border-l overflow-auto">
            <MediaDetails
              media={detailsMedia}
              onClose={() => setDetailsMedia(null)}
              onDeleted={() => {
                setDetailsMedia(null);
                refetch();
              }}
            />
          </div>
        )}
      </div>

      {/* Footer (for selection mode) */}
      {onSelect && selectedMedia.size > 0 && (
        <div className="border-t p-4 flex items-center justify-between bg-muted/30">
          <span className="text-sm">
            {selectedMedia.size} {t('media:library.itemsSelected')}
          </span>
          <Button onClick={handleConfirmSelection}>
            {t('media:library.confirmSelection')}
          </Button>
        </div>
      )}

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
    </div>
  );
};

export default MediaLibrary;
