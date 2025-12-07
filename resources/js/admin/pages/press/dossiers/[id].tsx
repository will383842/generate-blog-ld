import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  FileDown,
  Layers,
  Globe,
  Loader2,
  AlertCircle,
  List,
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
import { ScrollArea } from '@/components/ui/ScrollArea';
import { SectionManager } from '@/components/press/SectionManager';
import { ExportOptions } from '@/components/press/ExportOptions';
import {
  useDossier,
  useDossierSections,
  useCreateDossier,
  useUpdateDossier,
  usePublishDossier,
  useAddSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
} from '@/hooks/useDossiers';
import {
  PressDossier,
  DossierSection,
  DossierSectionType,
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

interface DossierFormData {
  title: string;
  excerpt: string;
  platform: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

export const DossierEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['press', 'common']);
  const { showToast } = useToast();

  const isNew = id === 'new';
  const dossierId = isNew ? undefined : parseInt(id!, 10);

  // Queries
  const { data: dossierData, isLoading } = useDossier(dossierId!, {
    enabled: !isNew && !!dossierId,
  });
  const { data: sectionsData } = useDossierSections(dossierId!, {
    enabled: !isNew && !!dossierId,
  });

  // Mutations
  const createMutation = useCreateDossier();
  const updateMutation = useUpdateDossier();
  const publishMutation = usePublishDossier();
  const addSectionMutation = useAddSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();
  const reorderSectionsMutation = useReorderSections();

  // Form state
  const [formData, setFormData] = useState<DossierFormData>({
    title: '',
    excerpt: '',
    platform: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);

  const sections = sectionsData || [];

  // Sync form data with loaded dossier
  useEffect(() => {
    if (dossierData) {
      setFormData({
        title: dossierData.title || '',
        excerpt: dossierData.excerpt || '',
        platform: dossierData.platform || '',
        metaTitle: dossierData.metaTitle || '',
        metaDescription: dossierData.metaDescription || '',
        focusKeyword: dossierData.focusKeyword || '',
      });
      setHasChanges(false);
    }
  }, [dossierData]);

  // Update form field
  const updateField = useCallback(
    <K extends keyof DossierFormData>(field: K, value: DossierFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync({
          title: formData.title,
          platform: formData.platform,
          excerpt: formData.excerpt,
        });
        showToast(t('press:messages.dossierCreated'), 'success');
        navigate(`/admin/press/dossiers/${result.id}`);
      } else {
        await updateMutation.mutateAsync({
          id: dossierId!,
          data: formData,
        });
        showToast(t('press:messages.dossierSaved'), 'success');
        setHasChanges(false);
      }
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [
    isNew,
    formData,
    dossierId,
    createMutation,
    updateMutation,
    navigate,
    showToast,
    t,
  ]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    if (!dossierId) return;

    try {
      if (hasChanges) {
        await updateMutation.mutateAsync({ id: dossierId, data: formData });
      }
      await publishMutation.mutateAsync(dossierId);
      showToast(t('press:messages.dossierPublished'), 'success');
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [dossierId, hasChanges, formData, updateMutation, publishMutation, showToast, t]);

  // Section handlers
  const handleAddSection = useCallback(
    async (type: DossierSectionType, title: string) => {
      if (!dossierId) return;

      try {
        await addSectionMutation.mutateAsync({
          dossierId,
          data: { type, title, order: sections.length },
        });
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [dossierId, sections.length, addSectionMutation, showToast, t]
  );

  const handleUpdateSection = useCallback(
    async (sectionId: number, data: Partial<DossierSection>) => {
      if (!dossierId) return;

      try {
        await updateSectionMutation.mutateAsync({
          dossierId,
          sectionId,
          data: {
            title: data.title,
            content: data.content,
            config: data.config,
          },
        });
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [dossierId, updateSectionMutation, showToast, t]
  );

  const handleDeleteSection = useCallback(
    async (sectionId: number) => {
      if (!dossierId) return;

      try {
        await deleteSectionMutation.mutateAsync({ dossierId, sectionId });
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [dossierId, deleteSectionMutation, showToast, t]
  );

  const handleReorderSections = useCallback(
    async (sectionIds: number[]) => {
      if (!dossierId) return;

      try {
        await reorderSectionsMutation.mutateAsync({ dossierId, sectionIds });
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [dossierId, reorderSectionsMutation, showToast, t]
  );

  // Export handler
  const handleExport = useCallback(
    async (_options: { format?: string; includeMedia?: boolean }) => {
      return {
        url: '#',
        filename: `dossier-${dossierId}.pdf`,
        size: 1024 * 1000,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    },
    [dossierId]
  );

  // Available translations
  const availableLanguages = useMemo(() => {
    const translations = dossierData?.translations || [];
    return ['fr', ...translations.map((t) => t.language)];
  }, [dossierData?.translations]);

  // Table of contents
  const tableOfContents = useMemo(() => {
    return sections.map((section, index) => ({
      id: section.id,
      number: index + 1,
      title: section.title,
      type: section.type,
    }));
  }, [sections]);

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
            to="/admin/press/dossiers"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:back')}
          </Link>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {isNew ? t('press:dossiers.new') : formData.title || t('press:dossiers.untitled')}
            </h1>

            {dossierData?.platform && (
              <Badge variant="outline">
                {PLATFORMS.find((p) => p.id === dossierData.platform)?.name ||
                  dossierData.platform}
              </Badge>
            )}

            {dossierData?.status && (
              <Badge className={STATUS_COLORS[dossierData.status]}>
                {t(`press:status.${dossierData.status}`)}
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
                onClick={() => navigate(`/admin/press/dossiers/${dossierId}/preview`)}
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
                      contentType="dossier"
                      contentId={dossierId!}
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

          {!isNew && dossierData?.status !== 'published' && (
            <Button onClick={handlePublish} disabled={publishMutation.isPending}>
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
      <div className="grid grid-cols-4 gap-6">
        {/* Table of Contents Sidebar */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  {t('press:dossier.tableOfContents')}
                </span>
                <Badge variant="secondary">{sections.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('press:dossier.noSections')}
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#section-${item.id}`}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-muted-foreground mr-2">
                          {item.number}.
                        </span>
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor Column */}
        <div className="col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="sections">
                <Layers className="h-4 w-4 mr-2" />
                {t('press:tabs.sections')}
              </TabsTrigger>
              <TabsTrigger value="info">{t('press:tabs.info')}</TabsTrigger>
              <TabsTrigger value="seo">{t('press:tabs.seo')}</TabsTrigger>
              <TabsTrigger value="translations">
                <Globe className="h-4 w-4 mr-2" />
                {t('press:tabs.translations')}
              </TabsTrigger>
            </TabsList>

            {/* Sections Tab */}
            <TabsContent value="sections" className="mt-4">
              {isNew ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {t('press:sections.saveFirst')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <SectionManager
                  sections={sections}
                  onAddSection={handleAddSection}
                  onUpdateSection={handleUpdateSection}
                  onDeleteSection={handleDeleteSection}
                  onReorder={handleReorderSections}
                  disabled={
                    addSectionMutation.isPending ||
                    updateSectionMutation.isPending ||
                    deleteSectionMutation.isPending ||
                    reorderSectionsMutation.isPending
                  }
                />
              )}
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">{t('press:fields.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={t('press:placeholders.dossierTitle')}
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
                  placeholder={t('press:placeholders.dossierExcerpt')}
                  rows={4}
                  className="mt-1"
                />
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
                        const translation = dossierData?.translations?.find(
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
                                  {t(`press:translations.status.${translation.status}`)}
                                </Badge>
                              )}
                            </div>

                            {!isOriginal && !translation && (
                              <Button size="sm" variant="outline">
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

          {/* Info Card */}
          {!isNew && dossierData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('press:info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('press:info.created')}</span>
                  <p className="font-medium">
                    {format(new Date(dossierData.createdAt), 'PPP', { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('press:info.updated')}</span>
                  <p className="font-medium">
                    {format(new Date(dossierData.updatedAt), 'PPP', { locale: fr })}
                  </p>
                </div>
                {dossierData.publishedAt && (
                  <div>
                    <span className="text-muted-foreground">{t('press:info.published')}</span>
                    <p className="font-medium">
                      {format(new Date(dossierData.publishedAt), 'PPP', { locale: fr })}
                    </p>
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

export default DossierEditor;
