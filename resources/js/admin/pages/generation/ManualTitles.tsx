/**
 * Manual Titles Page
 * Create articles from manual titles
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PenLine,
  ArrowLeft,
  Sparkles,
  Clock,
  Trash2,
  Play,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  useManualTitles,
  useCreateManualTitle,
  useDeleteManualTitle,
  useGenerateFromTitle,
} from '@/hooks/useManualTitles';
import { PLATFORMS, LANGUAGES } from '@/utils/constants';
import type { ContentTypeId, PlatformId, LanguageCode } from '@/types/program';
import type { ManualTitleStatus } from '@/types/generation';

const STATUS_COLORS: Record<ManualTitleStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  queued: 'bg-blue-100 text-blue-700',
  generating: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<ManualTitleStatus, string> = {
  draft: 'Brouillon',
  queued: 'En queue',
  generating: 'Génération',
  completed: 'Terminé',
  failed: 'Échec',
};

export function ManualTitlesPage() {
  const navigate = useNavigate();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platformId, setPlatformId] = useState<PlatformId>('sos-expat');
  const [countryId, setCountryId] = useState('FR');
  const [languageId, setLanguageId] = useState<LanguageCode>('fr');
  const [templateType, setTemplateType] = useState<ContentTypeId>('article');
  const [scheduledAt, setScheduledAt] = useState('');

  // Hooks
  const { data: titlesData, isLoading: isLoadingTitles } = useManualTitles({ perPage: 20 });
  const createTitle = useCreateManualTitle();
  const deleteTitle = useDeleteManualTitle();
  const generateFromTitle = useGenerateFromTitle();

  const titles = titlesData?.data || [];

  const handleSubmit = async (immediate: boolean) => {
    if (!title.trim()) return;

    await createTitle.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      platformId,
      countryId,
      languageId,
      templateType,
      scheduledAt: scheduledAt || undefined,
      generateImmediately: immediate,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setScheduledAt('');
  };

  const handleGenerate = async (id: string) => {
    await generateFromTitle.mutateAsync({ id, immediate: true });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce titre ?')) {
      await deleteTitle.mutateAsync(id);
    }
  };

  // Auto-detect template type from title
  const detectTemplateType = (titleText: string): ContentTypeId => {
    const lower = titleText.toLowerCase();
    if (lower.includes('faq') || lower.includes('questions')) return 'faq';
    if (lower.includes('guide') || lower.includes('comment')) return 'guide';
    if (lower.includes('glossaire') || lower.includes('définition')) return 'glossary';
    if (lower.includes('actualité') || lower.includes('news')) return 'news';
    if (lower.includes('avis') || lower.includes('review')) return 'review';
    if (lower.includes('comparatif') || lower.includes('vs')) return 'comparison';
    return 'article';
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setTemplateType(detectTemplateType(value));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/generation')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Titres manuels</h1>
          <p className="text-muted-foreground">
            Créez des articles à partir de titres personnalisés
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="w-5 h-5" />
            Nouveau titre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Titre *</label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Guide complet pour obtenir un visa en France"
            />
            {title && (
              <p className="text-xs text-muted-foreground mt-1">
                Type détecté: <Badge variant="outline">{templateType}</Badge>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optionnel)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief ou instructions supplémentaires pour la génération..."
              rows={3}
            />
          </div>

          {/* Context */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plateforme</label>
              <Select
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value as PlatformId)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pays</label>
              <Input
                value={countryId}
                onChange={(e) => setCountryId(e.target.value.toUpperCase())}
                placeholder="FR"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Langue</label>
              <Select
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value as LanguageCode)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Planifier</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => handleSubmit(true)}
              disabled={!title.trim() || createTitle.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générer maintenant
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={!title.trim() || createTitle.isPending}
            >
              <Clock className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des titres</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTitles ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : titles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun titre créé
            </p>
          ) : (
            <div className="space-y-3">
              {titles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.title}</p>
                      <Badge className={STATUS_COLORS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.platformId} • {item.countryId} • {item.languageId.toUpperCase()}
                      {item.scheduledAt && (
                        <>
                          {' • '}
                          <Calendar className="w-3 h-3 inline" />
                          {' '}
                          {format(new Date(item.scheduledAt), 'PPp', { locale: fr })}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {item.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerate(item.id)}
                        disabled={generateFromTitle.isPending}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    {(item.status === 'draft' || item.status === 'failed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {item.articleId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/content/articles/${item.articleId}`)}
                      >
                        Voir l'article
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ManualTitlesPage;
