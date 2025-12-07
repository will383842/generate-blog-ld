import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  RefreshCw,
  Settings,
  Globe,
  Palette,
  Search,
  BarChart3,
  Layers,
  ExternalLink,
  Copy,
  MoreVertical,
  Trash2,
  Archive,
  Layout,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  Check,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
import { CardImage } from '@/components/ui/OptimizedImage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
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
import { Separator } from '@/components/ui/Separator';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { SectionBuilder } from '@/components/landings/SectionBuilder';
import { CtaEditor } from '@/components/landings/CtaEditor';
import { MediaSelector } from '@/components/media/MediaSelector';
import {
  useLanding,
  useLandingSections,
  useUpdateLanding,
  useDeleteLanding,
  useDuplicateLanding,
  usePublishLanding,
  useUnpublishLanding,
  useAddSection,
  useUpdateSection,
  useDeleteSection,
  useDuplicateSection,
  useReorderSections,
  useTranslateLanding,
} from '@/hooks/useLandings';
import {
  Landing,
  LandingStatus,
  UpdateLandingInput,
  CreateSectionInput,
  UpdateSectionInput,
} from '@/types/landing';
import { PLATFORMS } from '@/utils/constants';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

// Les 9 langues supportées
const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

const STATUS_CONFIG: Record<LandingStatus, { color: string; icon: React.ReactNode }> = {
  draft: { color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-3 w-3" /> },
  review: { color: 'bg-blue-100 text-blue-700', icon: <Eye className="h-3 w-3" /> },
  approved: { color: 'bg-emerald-100 text-emerald-700', icon: <Check className="h-3 w-3" /> },
  published: { color: 'bg-green-100 text-green-700', icon: <Check className="h-3 w-3" /> },
  archived: { color: 'bg-amber-100 text-amber-700', icon: <Archive className="h-3 w-3" /> },
};

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const LandingEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['landing', 'common']);
  const { showToast } = useToast();

  const landingId = parseInt(id || '0');

  // Queries
  const { data: landing, isLoading, refetch } = useLanding(landingId);
  const { data: sections = [] } = useLandingSections(landingId);

  // Mutations
  const updateMutation = useUpdateLanding();
  const deleteMutation = useDeleteLanding();
  const duplicateMutation = useDuplicateLanding();
  const publishMutation = usePublishLanding();
  const unpublishMutation = useUnpublishLanding();
  const addSectionMutation = useAddSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();
  const duplicateSectionMutation = useDuplicateSection();
  const reorderSectionsMutation = useReorderSections();
  const translateMutation = useTranslateLanding();

  // Local state
  const [activeTab, setActiveTab] = useState('content');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [selectedTranslateLanguage, setSelectedTranslateLanguage] = useState('');

  // Form state
  const [formData, setFormData] = useState<UpdateLandingInput>({});

  // Initialize form data when landing loads
  useEffect(() => {
    if (landing) {
      setFormData({
        title: landing.title,
        slug: landing.slug,
        description: landing.description,
        metaTitle: landing.metaTitle,
        metaDescription: landing.metaDescription,
        focusKeyword: landing.focusKeyword,
        featuredImage: landing.featuredImage,
        primaryColor: landing.primaryColor,
        secondaryColor: landing.secondaryColor,
        fontFamily: landing.fontFamily,
        primaryCta: landing.primaryCta,
        secondaryCta: landing.secondaryCta,
        floatingCta: landing.floatingCta,
      });
    }
  }, [landing]);

  // Debounced auto-save
  const debouncedFormData = useDebounce(formData, 2000);

  useEffect(() => {
    if (hasUnsavedChanges && landing && Object.keys(debouncedFormData).length > 0) {
      handleSave(true);
    }
  }, [debouncedFormData]);

  // Update form field
  const updateField = useCallback(
    <K extends keyof UpdateLandingInput>(field: K, value: UpdateLandingInput[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasUnsavedChanges(true);
    },
    []
  );

  // Save handler
  const handleSave = useCallback(
    async (silent = false) => {
      if (!landing) return;

      try {
        await updateMutation.mutateAsync({ id: landing.id, data: formData });
        setHasUnsavedChanges(false);
        if (!silent) {
          showToast(t('landing:messages.saved'), 'success');
        }
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [formData, landing, showToast, t, updateMutation]
  );

  // Publish/Unpublish
  const handlePublish = useCallback(async () => {
    if (!landing) return;

    try {
      if (landing.status === 'published') {
        await unpublishMutation.mutateAsync(landing.id);
      } else {
        await publishMutation.mutateAsync(landing.id);
      }
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [landing, publishMutation, showToast, t, unpublishMutation]);

  // Delete
  const handleDelete = useCallback(async () => {
    if (!landing) return;

    try {
      await deleteMutation.mutateAsync(landing.id);
      navigate('/admin/content/landings');
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
    setDeleteDialogOpen(false);
  }, [deleteMutation, landing, navigate, showToast, t]);

  // Duplicate
  const handleDuplicate = useCallback(async () => {
    if (!landing) return;

    try {
      const result = await duplicateMutation.mutateAsync(landing.id);
      navigate(`/admin/content/landings/${result.id}`);
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [duplicateMutation, landing, navigate, showToast, t]);

  // Section handlers
  const handleAddSection = useCallback(
    async (data: CreateSectionInput) => {
      await addSectionMutation.mutateAsync({ landingId, data });
    },
    [addSectionMutation, landingId]
  );

  const handleUpdateSection = useCallback(
    async (sectionId: number, data: UpdateSectionInput) => {
      await updateSectionMutation.mutateAsync({ landingId, sectionId, data });
    },
    [landingId, updateSectionMutation]
  );

  const handleDeleteSection = useCallback(
    async (sectionId: number) => {
      await deleteSectionMutation.mutateAsync({ landingId, sectionId });
    },
    [deleteSectionMutation, landingId]
  );

  const handleDuplicateSection = useCallback(
    async (sectionId: number) => {
      await duplicateSectionMutation.mutateAsync({ landingId, sectionId });
    },
    [duplicateSectionMutation, landingId]
  );

  const handleReorderSections = useCallback(
    async (sectionIds: number[]) => {
      await reorderSectionsMutation.mutateAsync({ landingId, sectionIds });
    },
    [landingId, reorderSectionsMutation]
  );

  // Translate
  const handleTranslate = useCallback(async () => {
    if (!landing || !selectedTranslateLanguage) return;

    try {
      await translateMutation.mutateAsync({
        id: landing.id,
        targetLanguage: selectedTranslateLanguage,
      });
      setTranslateDialogOpen(false);
      setSelectedTranslateLanguage('');
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [landing, selectedTranslateLanguage, showToast, t, translateMutation]);

  // Quality score calculation
  const qualityScore = useMemo(() => {
    if (!landing) return 0;

    let score = 0;
    const checks = [
      { condition: !!formData.title && formData.title.length > 10, weight: 15 },
      { condition: !!formData.description && formData.description.length > 50, weight: 10 },
      { condition: !!formData.metaTitle && formData.metaTitle.length > 20, weight: 15 },
      { condition: !!formData.metaDescription && formData.metaDescription.length > 100, weight: 15 },
      { condition: !!formData.focusKeyword, weight: 10 },
      { condition: !!formData.featuredImage, weight: 10 },
      { condition: sections.length >= 3, weight: 15 },
      { condition: !!formData.primaryCta?.text && !!formData.primaryCta?.url, weight: 10 },
    ];

    checks.forEach((check) => {
      if (check.condition) score += check.weight;
    });

    return score;
  }, [formData, landing, sections.length]);

  // Available languages for translation
  const availableLanguages = useMemo(() => {
    if (!landing) return SUPPORTED_LANGUAGES;
    const translatedCodes = landing.translations?.map((t) => t.language) || [];
    return SUPPORTED_LANGUAGES.filter(
      (lang) => lang.code !== landing.language && !translatedCodes.includes(lang.code)
    );
  }, [landing]);

  // Platform info
  const platform = useMemo(() => {
    if (!landing) return null;
    return PLATFORMS.find((p) => p.id === landing.platform);
  }, [landing]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!landing) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Layout className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('landing:notFound')}</p>
        <Button asChild className="mt-4">
          <Link to="/admin/content/landings">{t('common:back')}</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[landing.status];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/content/landings">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{landing.title}</h1>
                <Badge className={cn('text-xs', statusConfig.color)}>
                  {statusConfig.icon}
                  <span className="ml-1">{t(`landing:status.${landing.status}`)}</span>
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    {t('common:unsavedChanges')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {platform && <span>{platform.name}</span>}
                {landing.language && (
                  <>
                    <span>•</span>
                    <span>
                      {SUPPORTED_LANGUAGES.find((l) => l.code === landing.language)?.flag}{' '}
                      {SUPPORTED_LANGUAGES.find((l) => l.code === landing.language)?.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview Toggle */}
            <Button
              variant={showPreview ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('common:preview')}
            </Button>

            {/* Save */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={updateMutation.isPending || !hasUnsavedChanges}
            >
              {updateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('common:save')}
            </Button>

            {/* Publish */}
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishMutation.isPending || unpublishMutation.isPending}
              variant={landing.status === 'published' ? 'secondary' : 'default'}
            >
              <Send className="h-4 w-4 mr-2" />
              {landing.status === 'published' ? t('common:unpublish') : t('common:publish')}
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/admin/content/landings/${landing.id}/preview`}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('landing:fullPreview')}
                  </Link>
                </DropdownMenuItem>
                {landing.publicUrl && (
                  <DropdownMenuItem asChild>
                    <a href={landing.publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('landing:viewOnline')}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('common:duplicate')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTranslateDialogOpen(true)}>
                  <Globe className="h-4 w-4 mr-2" />
                  {t('landing:translate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common:delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={cn('flex-1 overflow-auto p-6', showPreview && 'w-1/2')}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="content">
                <Layers className="h-4 w-4 mr-2" />
                {t('landing:tabs.content')}
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="h-4 w-4 mr-2" />
                {t('landing:tabs.seo')}
              </TabsTrigger>
              <TabsTrigger value="design">
                <Palette className="h-4 w-4 mr-2" />
                {t('landing:tabs.design')}
              </TabsTrigger>
              <TabsTrigger value="cta">
                <Settings className="h-4 w-4 mr-2" />
                {t('landing:tabs.cta')}
              </TabsTrigger>
              <TabsTrigger value="translations">
                <Globe className="h-4 w-4 mr-2" />
                {t('landing:tabs.translations')}
                {landing.translations && landing.translations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {landing.translations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('landing:basicInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">{t('landing:fields.title')}</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder={t('landing:placeholders.title')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">{t('landing:fields.slug')}</Label>
                    <Input
                      id="slug"
                      value={formData.slug || ''}
                      onChange={(e) => updateField('slug', e.target.value)}
                      placeholder={t('landing:placeholders.slug')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">{t('landing:fields.description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={t('landing:placeholders.description')}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    {t('landing:sections.title')}
                    <Badge variant="secondary">{sections.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SectionBuilder
                    sections={sections}
                    onAddSection={handleAddSection}
                    onUpdateSection={handleUpdateSection}
                    onDeleteSection={handleDeleteSection}
                    onDuplicateSection={handleDuplicateSection}
                    onReorder={handleReorderSections}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('landing:seo.title')}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('landing:seo.score')}:
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          qualityScore >= 80
                            ? 'bg-green-100 text-green-700'
                            : qualityScore >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {qualityScore}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">{t('landing:seo.metaTitle')}</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle || ''}
                      onChange={(e) => updateField('metaTitle', e.target.value)}
                      placeholder={t('landing:seo.metaTitlePlaceholder')}
                      className="mt-1"
                      maxLength={70}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.metaTitle || '').length}/70 {t('landing:seo.characters')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">{t('landing:seo.metaDescription')}</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription || ''}
                      onChange={(e) => updateField('metaDescription', e.target.value)}
                      placeholder={t('landing:seo.metaDescriptionPlaceholder')}
                      className="mt-1"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(formData.metaDescription || '').length}/160 {t('landing:seo.characters')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="focusKeyword">{t('landing:seo.focusKeyword')}</Label>
                    <Input
                      id="focusKeyword"
                      value={formData.focusKeyword || ''}
                      onChange={(e) => updateField('focusKeyword', e.target.value)}
                      placeholder={t('landing:seo.focusKeywordPlaceholder')}
                      className="mt-1"
                    />
                  </div>

                  {/* SEO Preview */}
                  <div className="mt-6">
                    <Label>{t('landing:seo.preview')}</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/30">
                      <div className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                        {formData.metaTitle || formData.title || t('landing:seo.untitled')}
                      </div>
                      <div className="text-green-700 text-sm">
                        {landing.publicUrl || 'https://example.com/landing-page'}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {formData.metaDescription ||
                          formData.description ||
                          t('landing:seo.noDescription')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('landing:design.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Featured Image */}
                  <div>
                    <Label>{t('landing:design.featuredImage')}</Label>
                    <div className="mt-2">
                      {formData.featuredImage ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                          <CardImage
                            src={formData.featuredImage}
                            alt="Featured"
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setMediaSelectorOpen(true)}
                            >
                              {t('common:change')}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateField('featuredImage', undefined)}
                            >
                              {t('common:remove')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMediaSelectorOpen(true)}
                          className="w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-center">
                            <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">
                              {t('landing:design.addImage')}
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">{t('landing:design.primaryColor')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          id="primaryColor"
                          value={formData.primaryColor || '#3b82f6'}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.primaryColor || '#3b82f6'}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">{t('landing:design.secondaryColor')}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          id="secondaryColor"
                          value={formData.secondaryColor || '#8b5cf6'}
                          onChange={(e) => updateField('secondaryColor', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={formData.secondaryColor || '#8b5cf6'}
                          onChange={(e) => updateField('secondaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font */}
                  <div>
                    <Label htmlFor="fontFamily">{t('landing:design.fontFamily')}</Label>
                    <Select
                      value={formData.fontFamily || 'inter'}
                      onValueChange={(v) => updateField('fontFamily', v)}
                    >
                      <SelectTrigger id="fontFamily" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                        <SelectItem value="poppins">Poppins</SelectItem>
                        <SelectItem value="montserrat">Montserrat</SelectItem>
                        <SelectItem value="opensans">Open Sans</SelectItem>
                        <SelectItem value="lato">Lato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CTA Tab */}
            <TabsContent value="cta" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CtaEditor
                  label={t('landing:cta.primary')}
                  value={formData.primaryCta}
                  onChange={(v) => updateField('primaryCta', v)}
                />
                <CtaEditor
                  label={t('landing:cta.secondary')}
                  value={formData.secondaryCta}
                  onChange={(v) => updateField('secondaryCta', v)}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('landing:cta.floating')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">{t('landing:cta.enableFloating')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('landing:cta.floatingDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={!!formData.floatingCta}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField('floatingCta', {
                            text: '',
                            url: '',
                            style: 'primary',
                            position: 'bottom-right',
                          });
                        } else {
                          updateField('floatingCta', undefined);
                        }
                      }}
                    />
                  </div>
                  {formData.floatingCta && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <CtaEditor
                          label=""
                          value={formData.floatingCta}
                          onChange={(v) =>
                            updateField('floatingCta', v as Landing['floatingCta'])
                          }
                          showPreview={false}
                        />
                        <div>
                          <Label>{t('landing:cta.position')}</Label>
                          <Select
                            value={formData.floatingCta.position}
                            onValueChange={(v) =>
                              updateField('floatingCta', {
                                ...formData.floatingCta!,
                                position: v as Landing['floatingCta']['position'],
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bottom-left">{t('landing:cta.bottomLeft')}</SelectItem>
                              <SelectItem value="bottom-center">{t('landing:cta.bottomCenter')}</SelectItem>
                              <SelectItem value="bottom-right">{t('landing:cta.bottomRight')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Translations Tab */}
            <TabsContent value="translations" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('landing:translations.title')}</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setTranslateDialogOpen(true)}
                      disabled={availableLanguages.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('landing:translations.add')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Original */}
                  <div className="mb-4">
                    <Label className="text-xs text-muted-foreground">
                      {t('landing:translations.original')}
                    </Label>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 mt-1">
                      <span className="text-2xl">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === landing.language)?.flag}
                      </span>
                      <div>
                        <p className="font-medium">
                          {SUPPORTED_LANGUAGES.find((l) => l.code === landing.language)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{landing.title}</p>
                      </div>
                    </div>
                  </div>

                  {/* Translations List */}
                  {landing.translations && landing.translations.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {t('landing:translations.list')}
                      </Label>
                      {landing.translations.map((translation) => {
                        const lang = SUPPORTED_LANGUAGES.find(
                          (l) => l.code === translation.language
                        );
                        return (
                          <div
                            key={translation.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{lang?.flag}</span>
                              <div>
                                <p className="font-medium">{lang?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {translation.title}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  translation.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : translation.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : translation.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                )}
                              >
                                {t(`landing:translations.status.${translation.status}`)}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('landing:translations.empty')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 border-l bg-muted/30 flex flex-col">
            <div className="p-4 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewDevice('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/content/landings/${landing.id}/preview`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('landing:fullPreview')}
                </Link>
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div
                className={cn(
                  'mx-auto bg-background shadow-lg rounded-lg overflow-hidden transition-all',
                  previewDevice === 'desktop' && 'w-full',
                  previewDevice === 'tablet' && 'w-[768px]',
                  previewDevice === 'mobile' && 'w-[375px]'
                )}
              >
                {/* Preview iframe or rendered sections would go here */}
                <div className="p-8 min-h-[600px]">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">{formData.title || landing.title}</h1>
                    {formData.description && (
                      <p className="text-muted-foreground mt-2">{formData.description}</p>
                    )}
                  </div>
                  {sections.length > 0 ? (
                    <div className="space-y-8">
                      {sections.map((section) => (
                        <div key={section.id} className="border-b pb-8">
                          <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
                          {section.subtitle && (
                            <p className="text-muted-foreground">{section.subtitle}</p>
                          )}
                          <Badge variant="outline" className="mt-2">
                            {section.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('landing:preview.noSections')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Selector Dialog */}
      <MediaSelector
        open={mediaSelectorOpen}
        onClose={() => setMediaSelectorOpen(false)}
        onSelect={(media) => {
          updateField('featuredImage', media.url);
          setMediaSelectorOpen(false);
        }}
        accept="image/*"
      />

      {/* Translate Dialog */}
      <AlertDialog open={translateDialogOpen} onOpenChange={setTranslateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('landing:dialogs.translate.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('landing:dialogs.translate.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>{t('landing:dialogs.translate.selectLanguage')}</Label>
            <Select value={selectedTranslateLanguage} onValueChange={setSelectedTranslateLanguage}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('landing:dialogs.translate.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTranslate}
              disabled={!selectedTranslateLanguage || translateMutation.isPending}
            >
              {translateMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('landing:translate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('landing:dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('landing:dialogs.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LandingEditor;
