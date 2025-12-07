/**
 * Comparative Editor Page
 * Full editor for comparison articles
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Scale,
  FileText,
  BarChart3,
  Settings,
  CheckCircle,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TipTapEditor } from '@/components/editors/TipTapEditor';
import { ComparisonTable } from '@/components/content/ComparisonTable';
import { ComparisonBuilder } from '@/components/content/ComparisonBuilder';
import { SeoScoreCard } from '@/components/content/SeoScoreCard';
import { SourcesList } from '@/components/content/SourcesList';
import {
  useComparative,
  useUpdateComparative,
  useUpdateCriteria,
  useUpdateItems,
  useRecalculateScores,
  useApplyTemplate,
  useSaveAsTemplate,
} from '@/hooks/useComparatives';
import { usePublishArticle } from '@/hooks/useArticles';
import type { Comparative, ComparisonCriteria, ComparisonItem, CriteriaValue, ScoringMethod } from '@/types/comparative';
import type { ArticleStatus } from '@/types/article';
import type { ArticleSource } from '@/types/article';

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  pending_review: { label: 'En révision', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approuvé', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Programmé', color: 'bg-purple-100 text-purple-700' },
  published: { label: 'Publié', color: 'bg-green-100 text-green-700' },
  unpublished: { label: 'Dépublié', color: 'bg-orange-100 text-orange-700' },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-500' },
};

export default function ComparativeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: comparativeData, isLoading } = useComparative(id!);
  const updateComparative = useUpdateComparative();
  const updateCriteria = useUpdateCriteria();
  const updateItems = useUpdateItems();
  const recalculateScores = useRecalculateScores();
  const applyTemplate = useApplyTemplate();
  const saveAsTemplate = useSaveAsTemplate();
  const publishArticle = usePublishArticle();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [verdictText, setVerdictText] = useState('');
  const [criteria, setCriteria] = useState<ComparisonCriteria[]>([]);
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>('weighted_average');
  const [showScores, setShowScores] = useState(true);
  const [highlightWinner, setHighlightWinner] = useState(true);
  const [sources, setSources] = useState<ArticleSource[]>([]);

  // UI state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('comparison');

  const comparative = comparativeData?.data;

  // Load data
  useEffect(() => {
    if (comparative) {
      setTitle(comparative.title);
      setSlug(comparative.slug);
      setExcerpt(comparative.excerpt || '');
      setContent(comparative.content || '');
      setMetaTitle(comparative.metaTitle || '');
      setMetaDescription(comparative.metaDescription || '');
      setVerdictText(comparative.verdictText || '');
      setCriteria(comparative.criteria || []);
      setItems(comparative.items || []);
      setScoringMethod(comparative.scoringMethod);
      setShowScores(comparative.showScores);
      setHighlightWinner(comparative.highlightWinner);
    }
  }, [comparative]);

  // Mark changes
  useEffect(() => {
    if (comparative) {
      setHasUnsavedChanges(true);
    }
  }, [title, slug, content, criteria, items, scoringMethod]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!id) return;

    await updateComparative.mutateAsync({
      id,
      data: {
        title,
        slug,
        excerpt,
        content,
        metaTitle,
        metaDescription,
        verdictText,
        scoringMethod,
        showScores,
        highlightWinner,
      },
    });

    if (criteria.length > 0) {
      await updateCriteria.mutateAsync({ comparativeId: id, criteria });
    }

    if (items.length > 0) {
      await updateItems.mutateAsync({ comparativeId: id, items });
    }

    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  }, [id, title, slug, excerpt, content, metaTitle, metaDescription, verdictText, criteria, items, scoringMethod, showScores, highlightWinner, updateComparative, updateCriteria, updateItems]);

  // Publish handler
  const handlePublish = async () => {
    if (!id) return;
    await handleSave();
    await publishArticle.mutateAsync({ id });
  };

  // Recalculate scores
  const handleRecalculate = async () => {
    if (!id) return;
    await recalculateScores.mutateAsync(id);
  };

  // Update item values
  const handleUpdateItemValues = (itemId: string, values: Record<string, CriteriaValue>) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, values } : item)));
  };

  // Add item
  const handleAddItem = () => {
    const newItem: ComparisonItem = {
      id: `item-${Date.now()}`,
      comparativeId: id!,
      name: 'Nouvel élément',
      slug: 'nouvel-element',
      values: {},
      score: 0,
      rank: items.length + 1,
      isWinner: false,
      pros: [],
      cons: [],
      order: items.length,
      isHighlighted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems([...items, newItem]);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  // Reorder items
  const handleReorderItems = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    newItems.forEach((item, i) => (item.order = i));
    setItems(newItems);
  };

  // Apply template
  const handleApplyTemplate = async (templateId: string) => {
    if (!id) return;
    await applyTemplate.mutateAsync({ comparativeId: id, templateId });
  };

  // Save as template
  const handleSaveAsTemplate = async (name: string) => {
    if (!id) return;
    await saveAsTemplate.mutateAsync({ comparativeId: id, name });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!comparative) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Comparatif non trouvé</p>
        <Button className="mt-4" onClick={() => navigate('/content/comparatives')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[comparative.status];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/content/comparatives')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-muted-foreground" />
                <h1 className="font-semibold truncate max-w-md">{title || 'Nouveau comparatif'}</h1>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {lastSaved ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Sauvegardé {format(lastSaved, 'HH:mm', { locale: fr })}
                  </span>
                ) : hasUnsavedChanges ? (
                  <Badge variant="outline" className="text-orange-600">Non enregistré</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/content/comparatives/${id}/preview`)}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={updateComparative.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button onClick={handlePublish} disabled={publishArticle.isPending}>
              <Send className="w-4 h-4 mr-2" />
              Publier
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du comparatif"
            className="text-2xl font-bold h-auto py-3 border-0 shadow-none focus-visible:ring-0 px-0"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span>/comparatifs/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-du-comparatif"
              className="w-64 h-8 text-sm"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="comparison" className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Comparaison
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                SEO
              </TabsTrigger>
            </TabsList>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="mt-4 space-y-6">
              {/* Options */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showScores}
                        onCheckedChange={setShowScores}
                      />
                      <span className="text-sm">Afficher les scores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={highlightWinner}
                        onCheckedChange={setHighlightWinner}
                      />
                      <span className="text-sm">Mettre en avant le gagnant</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRecalculate}>
                      <Calculator className="w-4 h-4 mr-2" />
                      Recalculer les scores
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Table */}
              <ComparisonTable
                comparative={{
                  ...comparative,
                  criteria,
                  items,
                  scoringMethod,
                  showScores,
                  highlightWinner,
                }}
                onUpdateItem={handleUpdateItemValues}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onReorderItems={handleReorderItems}
                onRecalculate={handleRecalculate}
                isEditable
                showScores={showScores}
              />

              {/* Verdict */}
              <div>
                <label className="block text-sm font-medium mb-2">Verdict / Conclusion</label>
                <Textarea
                  value={verdictText}
                  onChange={(e) => setVerdictText(e.target.value)}
                  placeholder="Votre conclusion et recommandation..."
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Introduction</label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Introduction du comparatif..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contenu détaillé</label>
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Contenu additionnel..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sources</label>
                <SourcesList
                  sources={sources}
                  onChange={setSources}
                />
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meta Title ({metaTitle.length}/60)
                    </label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Titre SEO"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meta Description ({metaDescription.length}/160)
                    </label>
                    <Textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Description pour les moteurs de recherche..."
                      rows={3}
                      maxLength={160}
                    />
                  </div>
                </div>
                <SeoScoreCard
                  score={comparative.seoScore || 0}
                  metaTitle={metaTitle}
                  metaDescription={metaDescription}
                  url={`/comparatifs/${slug}`}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Criteria Builder */}
        <aside className="w-80 border-l bg-gray-50 overflow-y-auto">
          <ComparisonBuilder
            criteria={criteria}
            scoringMethod={scoringMethod}
            onUpdateCriteria={setCriteria}
            onUpdateScoringMethod={setScoringMethod}
            onApplyTemplate={handleApplyTemplate}
            onSaveAsTemplate={handleSaveAsTemplate}
          />
        </aside>
      </div>
    </div>
  );
}
