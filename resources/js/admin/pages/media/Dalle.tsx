import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  History,
  Image,
  Clock,
  Zap,
  DollarSign,
  RefreshCw,
  Eye,
  Save,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  BarChart3,
  Calendar,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { PageHeader } from '@/components/layout/PageHeader';
import { DalleGenerator } from '@/components/media/DalleGenerator';
import { useMedia, useDalleHistory } from '@/hooks/useMedia';
import { MediaItem, DalleHistory, DalleImage } from '@/types/media';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThumbnailImage } from '@/components/ui/OptimizedImage';

type DalleTab = 'generate' | 'history' | 'saved' | 'usage';

// Mock usage data (would come from API)
const USAGE_DATA = {
  creditsUsed: 87,
  creditsTotal: 200,
  creditsRemaining: 113,
  imagesGenerated: 87,
  costPerImage: 0.04,
  totalCost: 3.48,
  monthlyLimit: 200,
  resetDate: '2024-02-01',
};

const DAILY_USAGE = [
  { date: '2024-01-25', count: 12, cost: 0.48 },
  { date: '2024-01-26', count: 8, cost: 0.32 },
  { date: '2024-01-27', count: 15, cost: 0.60 },
  { date: '2024-01-28', count: 5, cost: 0.20 },
  { date: '2024-01-29', count: 18, cost: 0.72 },
  { date: '2024-01-30', count: 10, cost: 0.40 },
  { date: '2024-01-31', count: 19, cost: 0.76 },
];

export default function DallePage() {
  const { t } = useTranslation(['media', 'common']);
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<DalleTab>('generate');
  const [previewImage, setPreviewImage] = useState<DalleImage | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState(false);

  // DALL-E generated images saved to library
  const { data: savedImages, isLoading: savedLoading } = useMedia({
    source: 'dalle',
    sortBy: 'created_at',
    sortOrder: 'desc',
    perPage: 30,
  });

  // DALL-E history
  const { data: history = [], isLoading: historyLoading } = useDalleHistory();

  // Stats
  const stats = useMemo(() => {
    const totalGenerated = history.reduce((sum, h) => sum + h.imagesCount, 0);
    const totalSaved = savedImages?.meta?.total || 0;
    const saveRate = totalGenerated > 0 ? Math.round((totalSaved / totalGenerated) * 100) : 0;

    return {
      totalGenerated,
      totalSaved,
      saveRate,
      totalCreditsUsed: history.reduce((sum, h) => sum + h.creditsUsed, 0),
    };
  }, [history, savedImages]);

  // Handle media select
  const handleSelect = useCallback(
    (media: MediaItem) => {
      navigate('/admin/media');
    },
    [navigate]
  );

  // Copy prompt
  const handleCopyPrompt = useCallback(async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Usage percentage
  const usagePercentage = Math.round(
    (USAGE_DATA.creditsUsed / USAGE_DATA.creditsTotal) * 100
  );

  // Render generate tab
  const renderGenerateTab = () => (
    <Card>
      <CardContent className="p-6">
        <DalleGenerator onSelect={handleSelect} />
      </CardContent>
    </Card>
  );

  // Render history tab
  const renderHistoryTab = () => (
    <div className="space-y-6">
      {historyLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Images Preview */}
                  <div className="flex gap-2 flex-shrink-0">
                    {item.images.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded overflow-hidden bg-muted cursor-pointer hover:ring-2 ring-primary"
                        onClick={() => setPreviewImage(img)}
                      >
                        <ThumbnailImage
                          src={img.url}
                          alt=""
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                    {item.imagesCount > 3 && (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                        +{item.imagesCount - 3}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 mb-2">{item.prompt}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {item.style}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.quality}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.size}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyPrompt(item.prompt)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('media:dalle.copyPrompt')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('media:dalle.usePrompt')}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t('media:dalle.noHistory')}</p>
        </div>
      )}
    </div>
  );

  // Render saved tab
  const renderSavedTab = () => (
    <div className="space-y-6">
      {savedLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : savedImages?.data && savedImages.data.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {savedImages.data.map((media) => (
            <div
              key={media.id}
              className="group relative rounded-lg overflow-hidden border cursor-pointer hover:border-primary/50"
              onClick={() => setPreviewMedia(media)}
            >
              <div className="aspect-square bg-muted">
                <ThumbnailImage
                  src={media.thumbnailUrl || media.url}
                  alt={media.metadata.alt || ''}
                  className="w-full h-full"
                />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  {t('common:view')}
                </Button>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  {format(new Date(media.createdAt), 'dd MMM', { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Save className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t('media:dalle.noSaved')}</p>
        </div>
      )}
    </div>
  );

  // Render usage tab
  const renderUsageTab = () => (
    <div className="space-y-6">
      {/* Credits Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            {t('media:dalle.credits')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {USAGE_DATA.creditsUsed} / {USAGE_DATA.creditsTotal} crédits utilisés
            </span>
            <span className="text-sm font-medium">{usagePercentage}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Reste: {USAGE_DATA.creditsRemaining} crédits
            </span>
            <span className="text-muted-foreground">
              Réinitialisation: {format(new Date(USAGE_DATA.resetDate), 'dd MMM', { locale: fr })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cost Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images générées</CardTitle>
            <Image className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{USAGE_DATA.imagesGenerated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût / image</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${USAGE_DATA.costPerImage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${USAGE_DATA.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de sauvegarde</CardTitle>
            <Save className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.saveRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Utilisation quotidienne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Images</TableHead>
                <TableHead className="text-right">Coût</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAILY_USAGE.map((day) => (
                <TableRow key={day.date}>
                  <TableCell>
                    {format(new Date(day.date), 'EEEE dd MMM', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">{day.count}</TableCell>
                  <TableCell className="text-right">${day.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title={t('media:pages.dalle.title')}
        description={t('media:pages.dalle.description')}
        backLink="/admin/media"
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                usagePercentage > 80
                  ? 'bg-red-100 text-red-700'
                  : usagePercentage > 50
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              )}
            >
              <Zap className="h-3 w-3 mr-1" />
              {USAGE_DATA.creditsRemaining} crédits
            </Badge>
          </div>
        }
      />

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.totalGenerated')}
            </CardTitle>
            <Sparkles className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGenerated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.saved')}
            </CardTitle>
            <Save className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSaved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.creditsUsed')}
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditsUsed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('media:stats.saveRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.saveRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DalleTab)}>
          <TabsList>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('media:tabs.generate')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('media:tabs.history')}
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('media:tabs.saved')}
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('media:tabs.usage')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="generate" className="mt-0">
              {renderGenerateTab()}
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              {renderHistoryTab()}
            </TabsContent>
            <TabsContent value="saved" className="mt-0">
              {renderSavedTab()}
            </TabsContent>
            <TabsContent value="usage" className="mt-0">
              {renderUsageTab()}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* DALL-E Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          {previewImage && (
            <>
              <DialogHeader>
                <DialogTitle>{t('media:dalle.generatedImage')}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge variant="outline">{previewImage.style}</Badge>
                  <Badge variant="outline">{previewImage.quality}</Badge>
                  <Badge variant="outline">{previewImage.size}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="aspect-square max-h-[60vh] rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewImage.url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{previewImage.revisedPrompt || previewImage.prompt}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewImage(null)}>
                  {t('common:close')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyPrompt(previewImage.prompt)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t('media:dalle.copyPrompt')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Media Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-3xl">
          {previewMedia && (
            <>
              <DialogHeader>
                <DialogTitle>{previewMedia.filename}</DialogTitle>
              </DialogHeader>

              <div className="aspect-square max-h-[60vh] rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewMedia.previewUrl || previewMedia.url}
                  alt=""
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

      {/* Credits Footer */}
      <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Propulsé par{' '}
          <a
            href="https://openai.com/dall-e-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DALL-E 3
          </a>
        </span>
        <span>
          {USAGE_DATA.creditsRemaining} crédits restants ce mois
        </span>
      </div>
    </div>
  );
}
