import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Upload,
  FolderOpen,
  Database,
  HardDrive,
  TrendingUp,
  RefreshCw,
  Settings,
  Download,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
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
import { MediaLibrary } from '@/components/media/MediaLibrary';
import { MediaUploader } from '@/components/media/MediaUploader';
import { UnsplashSearch } from '@/components/media/UnsplashSearch';
import { DalleGenerator } from '@/components/media/DalleGenerator';
import { useMediaStats, useBulkMediaAction } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

// Format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Type icons & colors
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  image: { icon: <Image className="h-5 w-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  video: { icon: <Image className="h-5 w-5" />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  audio: { icon: <Image className="h-5 w-5" />, color: 'text-green-600', bgColor: 'bg-green-50' },
  document: { icon: <Image className="h-5 w-5" />, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  archive: { icon: <Image className="h-5 w-5" />, color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

export default function MediaPage() {
  const { t } = useTranslation(['media', 'common']);
  
  // State
  const [activeTab, setActiveTab] = useState('library');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  
  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useMediaStats();
  const bulkMutation = useBulkMediaAction();

  // Cleanup unused media
  const handleCleanup = async () => {
    // This would call a cleanup API endpoint
    setCleanupDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <PageHeader
        title={t('media:page.title')}
        description={t('media:page.description')}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common:refresh')}
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t('media:page.upload')}
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Media */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('media:stats.total')}
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : (stats?.total ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('media:stats.uploadedThisMonth', { count: stats?.uploadedThisMonth || 0 })}
            </p>
          </CardContent>
        </Card>

        {/* Storage Used */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('media:stats.storage')}
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatSize(stats?.totalSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('media:stats.storageUsed')}
            </p>
          </CardContent>
        </Card>

        {/* Unused Media */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('media:stats.unused')}
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : (stats?.unused ?? 0).toLocaleString()}
            </div>
            {stats?.unused && stats.unused > 0 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setCleanupDialogOpen(true)}
              >
                {t('media:stats.cleanup')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('media:stats.byType')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {stats?.byType?.slice(0, 4).map(({ type, count }) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Type Breakdown */}
      {stats?.byType && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('media:stats.breakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.byType.map(({ type, count, size }) => {
                const config = TYPE_CONFIG[type] || TYPE_CONFIG.document;
                return (
                  <div
                    key={type}
                    className={cn(
                      'rounded-lg p-4 text-center',
                      config.bgColor
                    )}
                  >
                    <div className={cn('inline-flex p-2 rounded-full mb-2', config.bgColor)}>
                      <span className={config.color}>{config.icon}</span>
                    </div>
                    <p className="font-medium capitalize">{type}</p>
                    <p className="text-2xl font-bold">{(count ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(size)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b">
            <TabsList>
              <TabsTrigger value="library">
                <FolderOpen className="h-4 w-4 mr-2" />
                {t('media:tabs.library')}
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                {t('media:tabs.upload')}
              </TabsTrigger>
              <TabsTrigger value="unsplash">
                <Image className="h-4 w-4 mr-2" />
                Unsplash
              </TabsTrigger>
              <TabsTrigger value="dalle">
                <span className="mr-2">🎨</span>
                DALL-E
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            <TabsContent value="library" className="m-0">
              <div className="h-[600px]">
                <MediaLibrary embedded />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="m-0 p-6">
              <MediaUploader
                onUploadComplete={(items) => {
                  refetchStats();
                  setActiveTab('library');
                }}
              />
            </TabsContent>

            <TabsContent value="unsplash" className="m-0 p-6">
              <UnsplashSearch
                onSelect={(item) => {
                  refetchStats();
                  setActiveTab('library');
                }}
              />
            </TabsContent>

            <TabsContent value="dalle" className="m-0 p-6">
              <DalleGenerator
                onSelect={(item) => {
                  refetchStats();
                  setActiveTab('library');
                }}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Quick Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('media:upload.title')}</DialogTitle>
            <DialogDescription>{t('media:upload.description')}</DialogDescription>
          </DialogHeader>
          <MediaUploader
            onUploadComplete={(items) => {
              setUploadDialogOpen(false);
              refetchStats();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation */}
      <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('media:dialogs.cleanup.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('media:dialogs.cleanup.description', { count: stats?.unused || 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('media:dialogs.cleanup.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
