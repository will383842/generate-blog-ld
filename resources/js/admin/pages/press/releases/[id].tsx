import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  FileDown,
  Image,
  BarChart3,
  Globe,
  Trash2,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { Progress } from '@/components/ui/Progress';
import { ThumbnailImage } from '@/components/ui/OptimizedImage';
import { TipTapEditor } from '@/components/editors/TipTapEditor';
import { TranslationStatus } from '@/components/content/TranslationStatus';
import { MediaUploader } from '@/components/press/MediaUploader';
import { ChartGenerator } from '@/components/press/ChartGenerator';
import { ExportOptions } from '@/components/press/ExportOptions';
import {
  usePressRelease,
  usePressReleaseMedia,
  useCreatePressRelease,
  useUpdatePressRelease,
  usePublishPressRelease,
  useAddPressMedia,
  useRemovePressMedia,
  useTranslatePressRelease,
} from '@/hooks/usePressReleases';
import {
  PressRelease,
  UpdatePressReleaseInput,
  CreatePressReleaseInput,
  ChartData,
  PressStatus,
} from '@/types/press';
import { PLATFORMS } from '@/utils/constants';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Les 9 langues supportées
const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

const STATUS_COLORS: Record<PressStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-amber-100 text-amber-800',
};

export const PressReleaseEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['press', 'common']);
  const { showToast } = useToast();

  const isNew = id === 'new';
  const pressReleaseId = isNew ? undefined : parseInt(id!, 10);

  // Queries
  const { data: pressReleaseData, isLoading } = usePressRelease(pressReleaseId!, {
    enabled: !isNew && !!pressReleaseId,
  });
  const { data: mediaData } = usePressReleaseMedia(pressReleaseId!, {
    enabled: !isNew && !!pressReleaseId,
  });

  // Mutations
  const createMutation = useCreatePressRelease();
  const updateMutation = useUpdatePressRelease();
  const publishMutation = usePublishPressRelease();
  const addMediaMutation = useAddPressMedia();
  const removeMediaMutation = useRemovePressMedia();
  const translateMutation = useTranslatePressRelease();

  // Form state
  const [formData, setFormData] = useState<UpdatePressReleaseInput>({
    title: '',
    excerpt: '',
    content: '',
    platform: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [mediaSheetOpen, setMediaSheetOpen] = useState(false);
  const [chartSheetOpen, setChartSheetOpen] = useState(false);
  const [exportSheetOpen, setExportSheetOpen] = useState(false);

  // Sync form data with loaded press release
  useEffect(() => {
    if (pressReleaseData) {
      setFormData({
        title: pressReleaseData.title || '',
        excerpt: pressReleaseData.excerpt || '',
        content: pressReleaseData.content || '',
        platform: pressReleaseData.platform || '',
        metaTitle: pressReleaseData.metaTitle || '',
        metaDescription: pressReleaseData.metaDescription || '',
        focusKeyword: pressReleaseData.focusKeyword || '',
      });
      setHasChanges(false);
    }
  }, [pressReleaseData]);

  // Update form field
  const updateField = useCallback(
    <K extends keyof UpdatePressReleaseInput>(
      field: K,
      value: UpdatePressReleaseInput[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync(formData as CreatePressReleaseInput);
        showToast(t('press:messages.created'), 'success');
        navigate(`/admin/press/releases/${result.id}`);
      } else {
        await updateMutation.mutateAsync({ id: pressReleaseId!, data: formData });
        showToast(t('press:messages.saved'), 'success');
        setHasChanges(false);
      }
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [
    isNew,
    formData,
    pressReleaseId,
    createMutation,
    updateMutation,
    navigate,
    showToast,
    t,
  ]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    if (!pressReleaseId) return;

    try {
      // Save first if there are changes
      if (hasChanges) {
        await updateMutation.mutateAsync({ id: pressReleaseId, data: formData });
      }
      await publishMutation.mutateAsync(pressReleaseId);
      showToast(t('press:messages.published'), 'success');
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [pressReleaseId, hasChanges, formData, updateMutation, publishMutation, showToast, t]);

  // Media upload handler
  const handleMediaUpload = useCallback(
    async (file: File) => {
      if (!pressReleaseId) return;

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        await addMediaMutation.mutateAsync({
          pressReleaseId,
          data: formDataUpload,
        });
        showToast(t('press:messages.mediaAdded'), 'success');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [pressReleaseId, addMediaMutation, showToast, t]
  );

  // Media remove handler
  const handleMediaRemove = useCallback(
    async (mediaId: number) => {
      if (!pressReleaseId) return;

      try {
        await removeMediaMutation.mutateAsync({ pressReleaseId, mediaId });
        showToast(t('press:messages.mediaRemoved'), 'success');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [pressReleaseId, removeMediaMutation, showToast, t]
  );

  // Chart insert handler
  const handleChartInsert = useCallback(
    (chartData: ChartData) => {
      // Insert chart placeholder into content
      const chartPlaceholder = `\n[CHART:${JSON.stringify(chartData)}]\n`;
      updateField('content', formData.content + chartPlaceholder);
      setChartSheetOpen(false);
      showToast(t('press:messages.chartInserted'), 'success');
    },
    [formData.content, updateField, showToast, t]
  );

  // Translate handler
  const handleTranslate = useCallback(
    async (targetLanguage: string) => {
      if (!pressReleaseId) return;

      try {
        await translateMutation.mutateAsync({
          id: pressReleaseId,
          targetLanguage,
        });
        showToast(t('press:messages.translationStarted'), 'success');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [pressReleaseId, translateMutation, showToast, t]
  );

  // Export handler
  const handleExport = useCallback(
    async (_options: { format?: string; includeMedia?: boolean }) => {
      // Implementation handled by ExportOptions component
      return {
        url: '#',
        filename: `press-release-${pressReleaseId}.pdf`,
        size: 1024 * 500,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    },
    [pressReleaseId]
  );

  // Available translations
  const availableLanguages = useMemo(() => {
    const translations = pressReleaseData?.translations || [];
    return ['fr', ...translations.map((t) => t.language)];
  }, [pressReleaseData?.translations]);

  // Quality score color
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/press/releases"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:back')}
          </Link>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {isNew ? t('press:releases.new') : formData.title || t('press:releases.untitled')}
            </h1>

            {pressReleaseData?.platform && (
              <Badge variant="outline">
                {PLATFORMS.find((p) => p.id === pressReleaseData.platform)?.name ||
                  pressReleaseData.platform}
              </Badge>
            )}

            {pressReleaseData?.status && (
              <Badge className={STATUS_COLORS[pressReleaseData.status]}>
                {t(`press:status.${pressReleaseData.status}`)}
              </Badge>
            )}

            {hasChanges && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('common:unsaved')}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/press/releases/${pressReleaseId}/preview`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('common:preview')}
              </Button>

              <Sheet open={exportSheetOpen} onOpenChange={setExportSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-2" />
                    {t('common:export')}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t('press:export.title')}</SheetTitle>
                    <SheetDescription>{t('press:export.description')}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <ExportOptions
                      contentType="press-release"
                      contentId={pressReleaseId!}
                      availableLanguages={availableLanguages}
                      onExport={handleExport}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            {t('common:save')}
          </Button>

          {!isNew && pressReleaseData?.status !== 'published' && (
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Send className="h-4 w-4 mr-2" />
              {t('common:publish')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Editor Column */}
        <div className="col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">{t('press:tabs.content')}</TabsTrigger>
              <TabsTrigger value="seo">{t('press:tabs.seo')}</TabsTrigger>
              <TabsTrigger value="translations">{t('press:tabs.translations')}</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">{t('press:fields.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={t('press:placeholders.title')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="platform">{t('press:fields.platform')}</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(v) => updateField('platform', v)}
                >
                  <SelectTrigger id="platform" className="mt-1">
                    <SelectValue placeholder={t('press:placeholders.platform')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="excerpt">{t('press:fields.excerpt')}</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => updateField('excerpt', e.target.value)}
                  placeholder={t('press:placeholders.excerpt')}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>{t('press:fields.content')}</Label>
                <div className="mt-1 border rounded-lg">
                  <TipTapEditor
                    content={formData.content}
                    onChange={(content) => updateField('content', content)}
                    placeholder={t('press:placeholders.content')}
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="metaTitle">
                  {t('press:fields.metaTitle')}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formData.metaTitle?.length || 0}/60
                  </span>
                </Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => updateField('metaTitle', e.target.value)}
                  placeholder={t('press:placeholders.metaTitle')}
                  maxLength={60}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">
                  {t('press:fields.metaDescription')}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formData.metaDescription?.length || 0}/160
                  </span>
                </Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => updateField('metaDescription', e.target.value)}
                  placeholder={t('press:placeholders.metaDescription')}
                  maxLength={160}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="focusKeyword">{t('press:fields.focusKeyword')}</Label>
                <Input
                  id="focusKeyword"
                  value={formData.focusKeyword}
                  onChange={(e) => updateField('focusKeyword', e.target.value)}
                  placeholder={t('press:placeholders.focusKeyword')}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Translations Tab */}
            <TabsContent value="translations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('press:translations.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isNew ? (
                    <p className="text-sm text-muted-foreground">
                      {t('press:translations.saveFirst')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const translation = pressReleaseData?.translations?.find(
                          (t) => t.language === lang.code
                        );
                        const isOriginal = lang.code === 'fr';

                        return (
                          <div
                            key={lang.code}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">{lang.name}</span>
                              {isOriginal && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('press:translations.original')}
                                </Badge>
                              )}
                              {translation && (
                                <Badge
                                  variant={
                                    translation.status === 'completed'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {translation.status === 'completed' ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  )}
                                  {t(`press:translations.status.${translation.status}`)}
                                </Badge>
                              )}
                            </div>

                            {!isOriginal && !translation && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTranslate(lang.code)}
                                disabled={translateMutation.isPending}
                              >
                                {t('press:translations.translate')}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Media Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  {t('press:media.title')}
                </span>
                {!isNew && (
                  <Sheet open={mediaSheetOpen} onOpenChange={setMediaSheetOpen}>
                    <SheetTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[500px] sm:max-w-[500px]">
                      <SheetHeader>
                        <SheetTitle>{t('press:media.add')}</SheetTitle>
                        <SheetDescription>{t('press:media.addDescription')}</SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <MediaUploader
                          onUpload={handleMediaUpload}
                          acceptedTypes={['image/*']}
                          maxFiles={10}
                          maxSize={10 * 1024 * 1024}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isNew ? (
                <p className="text-sm text-muted-foreground">
                  {t('press:media.saveFirst')}
                </p>
              ) : mediaData && mediaData.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaData.map((media) => (
                    <div key={media.id} className="relative group">
                      <ThumbnailImage
                        src={media.thumbnailUrl || media.url}
                        alt={media.alt || ''}
                        className="w-full aspect-square rounded-lg"
                        objectFit="cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleMediaRemove(media.id)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('press:media.empty')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Charts Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('press:charts.title')}
                </span>
                {!isNew && (
                  <Sheet open={chartSheetOpen} onOpenChange={setChartSheetOpen}>
                    <SheetTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>{t('press:charts.create')}</SheetTitle>
                        <SheetDescription>{t('press:charts.createDescription')}</SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <ChartGenerator onInsert={handleChartInsert} />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('press:charts.description')}
              </p>
            </CardContent>
          </Card>

          {/* Quality Score */}
          {!isNew && pressReleaseData?.qualityScore !== undefined && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('press:quality.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(pressReleaseData.qualityScore / 100) * 251} 251`}
                        className={getQualityColor(pressReleaseData.qualityScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={cn(
                          'text-2xl font-bold',
                          getQualityColor(pressReleaseData.qualityScore)
                        )}
                      >
                        {pressReleaseData.qualityScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          {!isNew && pressReleaseData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('press:info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('press:info.created')}</span>
                  <span>
                    {format(new Date(pressReleaseData.createdAt), 'PPP', { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('press:info.updated')}</span>
                  <span>
                    {format(new Date(pressReleaseData.updatedAt), 'PPP', { locale: fr })}
                  </span>
                </div>
                {pressReleaseData.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('press:info.published')}</span>
                    <span>
                      {format(new Date(pressReleaseData.publishedAt), 'PPP', { locale: fr })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PressReleaseEditor;
