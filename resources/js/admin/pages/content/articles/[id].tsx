/**
 * Article Editor Page
 * Full article editing with sidebar metadata
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Clock,
  History,
  Image as ImageIcon,
  FileText,
  Search,
  Link2,
  HelpCircle,
  ChevronDown,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CardImage } from '@/components/ui/OptimizedImage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { MultilingualEditor, type LanguageContent } from '@/components/editors/MultilingualEditor';
import { FaqEditor, type FaqItem } from '@/components/editors/FaqEditor';
import { SeoScoreCard, DEFAULT_SEO_CRITERIA } from '@/components/content/SeoScoreCard';
import { SourcesList } from '@/components/content/SourcesList';
import { RelatedContent } from '@/components/content/RelatedContent';
import { TranslationStatus } from '@/components/content/TranslationStatus';
import {
  useArticle,
  useUpdateArticle,
  usePublishArticle,
} from '@/hooks/useArticles';
import type { ArticleSource } from '@/types/article';
 

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: articleData, isLoading } = useArticle(id || '');
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [countryId, setCountryId] = useState('');
  const [themeId, setThemeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [sources, setSources] = useState<ArticleSource[]>([]);
  const [linkedArticles, setLinkedArticles] = useState<string[]>([]);

  // Content per language
  const [languageContents, setLanguageContents] = useState<LanguageContent[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState('content');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load article data
  useEffect(() => {
    if (articleData?.data) {
      const article = articleData.data;
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt || '');
      setMetaTitle(article.metaTitle || '');
      setMetaDescription(article.metaDescription || '');
      setImageUrl(article.imageUrl || '');
      setImageAlt(article.imageAlt || '');
      setCountryId(article.countryId);
      setThemeId(article.themeId || '');
      setScheduledAt(article.scheduledAt || '');

      // Set FAQs
      if (article.faqs) {
        setFaqs(article.faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          order: f.order,
        })));
      }

      // Set sources
      if (article.sources) {
        setSources(article.sources);
      }

      // Set language contents
      const contents: LanguageContent[] = [{
        languageId: article.languageId,
        content: article.content,
        status: 'done',
      }];
      if (article.translations) {
        article.translations.forEach((t) => {
          contents.push({
            languageId: t.languageId,
            content: t.content,
            status: t.status,
          });
        });
      }
      setLanguageContents(contents);
    }
  }, [articleData]);

  // Auto-save
  const handleSave = useCallback(async () => {
    if (!id || isNew) return;

    setIsSaving(true);
    try {
      await updateArticle.mutateAsync({
        id,
        data: {
          title,
          slug,
          excerpt,
          metaTitle,
          metaDescription,
          imageUrl,
          imageAlt,
          themeId: themeId || undefined,
          scheduledAt: scheduledAt || undefined,
          faqs: faqs.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            order: f.order,
          })),
          sources: sources.map((s) => ({
            id: s.id,
            title: s.title,
            url: s.url,
            reliability: s.reliability,
          })),
        },
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [id, isNew, title, slug, excerpt, metaTitle, metaDescription, imageUrl, imageAlt, themeId, scheduledAt, faqs, sources, updateArticle]);

  const handlePublish = async () => {
    if (!id) return;
    await publishArticle.mutateAsync({ articleId: id });
  };

  const handleSchedule = async () => {
    if (!id || !scheduledAt) return;
    await publishArticle.mutateAsync({ articleId: id, publishAt: scheduledAt });
  };

  const article = articleData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/content/articles">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {isNew ? 'Nouvel article' : 'Modifier l\'article'}
                </h1>
                {article && (
                  <p className="text-sm text-muted-foreground">
                    {article.status} • Créé le {format(new Date(article.createdAt), 'PPP', { locale: fr })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Save status */}
              {lastSaved && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Enregistré à {format(lastSaved, 'HH:mm')}
                </span>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600">
                  Non enregistré
                </Badge>
              )}

              <Button variant="outline" onClick={() => navigate(`/content/articles/${id}/preview`)}>
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              {article?.status === 'draft' && (
                <Button onClick={handlePublish}>
                  <Globe className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              )}
            </div>
          </div>

          {/* Title & Slug */}
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Titre de l'article"
              className="text-2xl font-bold h-auto py-3 border-0 shadow-none focus:ring-0 px-0"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Slug:</span>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="flex-1 h-8 text-sm"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">
                <FileText className="w-4 h-4 mr-2" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="w-4 h-4 mr-2" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="faqs">
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQs ({faqs.length})
              </TabsTrigger>
              <TabsTrigger value="sources">
                <Link2 className="w-4 h-4 mr-2" />
                Sources ({sources.length})
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-4">
              <MultilingualEditor
                contents={languageContents}
                onChange={(languageId, content) => {
                  setLanguageContents((prev) =>
                    prev.map((c) =>
                      c.languageId === languageId ? { ...c, content } : c
                    )
                  );
                  setHasUnsavedChanges(true);
                }}
                primaryLanguage={article?.languageId}
              />
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Titre</label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => {
                      setMetaTitle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {metaTitle.length}/60 caractères
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Extrait</label>
                  <Input
                    value={excerpt}
                    onChange={(e) => {
                      setExcerpt(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Court résumé de l'article"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => {
                    setMetaDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Description pour les moteurs de recherche"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {metaDescription.length}/160 caractères
                </p>
              </div>

              <SeoScoreCard
                score={article?.seoScore || 75}
                criteria={DEFAULT_SEO_CRITERIA}
                metaTitle={metaTitle || title}
                metaDescription={metaDescription}
                url={`https://example.com/${slug}`}
              />
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="mt-4">
              <FaqEditor
                faqs={faqs}
                onChange={(newFaqs) => {
                  setFaqs(newFaqs);
                  setHasUnsavedChanges(true);
                }}
              />
            </TabsContent>

            {/* Sources Tab */}
            <TabsContent value="sources" className="mt-4">
              <SourcesList
                sources={sources}
                onChange={(newSources) => {
                  setSources(newSources);
                  setHasUnsavedChanges(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-white overflow-auto">
        <div className="p-4 space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Statut</span>
                <Badge>{article?.status || 'draft'}</Badge>
              </div>
              {article?.publishedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span>Publié le</span>
                  <span>{format(new Date(article.publishedAt), 'PPP', { locale: fr })}</span>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Programmer</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              {scheduledAt && (
                <Button variant="outline" className="w-full" onClick={handleSchedule}>
                  <Clock className="w-4 h-4 mr-2" />
                  Programmer
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Image */}
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="py-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </CardTitle>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {imageUrl ? (
                    <CardImage
                      src={imageUrl}
                      alt={imageAlt || 'Image de l\'article'}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <Input
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="URL de l'image"
                  />
                  <Input
                    value={imageAlt}
                    onChange={(e) => {
                      setImageAlt(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Texte alternatif"
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Translations */}
          {article && (
            <TranslationStatus
              translations={article.translations || []}
              primaryLanguage={article.languageId}
              onNavigate={(lang) => {
                setActiveTab(lang ? 'content' : 'content');
              }}
            />
          )}

          {/* Related */}
          <RelatedContent
            currentArticleId={id || ''}
            currentCountryId={countryId}
            currentThemeId={themeId}
            linkedArticles={[]}
            onLink={(articleId) => setLinkedArticles([...linkedArticles, articleId])}
            onUnlink={(articleId) => setLinkedArticles(linkedArticles.filter((a) => a !== articleId))}
          />

          {/* History */}
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/content/articles/${id}/history`}>
              <History className="w-4 h-4 mr-2" />
              Historique des versions
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ArticleEditorPage;
