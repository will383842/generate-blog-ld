/**
 * Knowledge Detail Page
 * File 242 - Create and edit knowledge items
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Copy,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Languages,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { KnowledgeEditor } from '@/components/settings/KnowledgeEditor';
import { KnowledgeValidator } from '@/components/settings/KnowledgeValidator';
import {
  useKnowledge,
  useCreateKnowledge,
  useUpdateKnowledge,
  useDeleteKnowledge,
  useDuplicateKnowledge,
} from '@/hooks/usePlatformKnowledge';
import { usePlatform } from '@/hooks/usePlatform';
import {
  KnowledgeType,
  KnowledgeWithTranslations,
  getKnowledgeTypeMetadata,
  getKnowledgeTypeColor,
  KNOWLEDGE_TYPES,
} from '@/types/knowledge';
import { cn } from '@/lib/utils';

export default function KnowledgeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentPlatform } = usePlatform();

  const isNew = id === 'new';
  const knowledgeId = isNew ? 0 : parseInt(id || '0');
  const defaultType = (searchParams.get('type') as KnowledgeType) || 'about';

  // State
  const [activeTab, setActiveTab] = useState('editor');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // API hooks
  const { data: knowledge, isLoading } = useKnowledge(knowledgeId);
  const createKnowledge = useCreateKnowledge();
  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();
  const duplicateKnowledge = useDuplicateKnowledge();

  // Handle save (create or update)
  const handleSave = async (data: Partial<KnowledgeWithTranslations>) => {
    if (isNew) {
      createKnowledge.mutate({
        platform_id: currentPlatform?.id || 0,
        type: data.type || defaultType,
        title: data.title || '',
        content: data.content || '',
        language: data.language,
        priority: data.priority,
        is_active: data.is_active,
        use_in_articles: data.use_in_articles,
        use_in_landings: data.use_in_landings,
        use_in_comparatives: data.use_in_comparatives,
        use_in_pillars: data.use_in_pillars,
        use_in_press: data.use_in_press,
      }, {
        onSuccess: (newKnowledge) => {
          navigate(`/settings/knowledge/${newKnowledge.id}`);
        },
      });
    } else {
      updateKnowledge.mutate({
        id: knowledgeId,
        ...data,
      });
    }
  };

  // Handle auto-save (only for existing items)
  const handleAutoSave = async (data: Partial<KnowledgeWithTranslations>) => {
    if (!isNew && knowledgeId > 0) {
      updateKnowledge.mutate({
        id: knowledgeId,
        ...data,
      });
    }
  };

  // Handle duplicate
  const handleDuplicate = () => {
    if (knowledgeId > 0) {
      duplicateKnowledge.mutate(knowledgeId, {
        onSuccess: (newKnowledge) => {
          navigate(`/settings/knowledge/${newKnowledge.id}`);
        },
      });
    }
  };

  // Handle delete
  const confirmDelete = () => {
    deleteKnowledge.mutate(knowledgeId, {
      onSuccess: () => {
        navigate('/settings/knowledge');
      },
    });
  };

  const typeMetadata = knowledge
    ? getKnowledgeTypeMetadata(knowledge.type)
    : getKnowledgeTypeMetadata(defaultType);

  const isSaving = createKnowledge.isPending || updateKnowledge.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground">
          {t('settings.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/settings/knowledge" className="hover:text-foreground">
          {t('knowledge.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {isNew ? t('knowledge.new') : knowledge?.title || t('knowledge.edit')}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/knowledge/by-type">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? t('knowledge.new') : knowledge?.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {typeMetadata && (
                <Badge
                  style={{ backgroundColor: typeMetadata.color }}
                  className="text-white"
                >
                  {typeMetadata.label}
                </Badge>
              )}
              {knowledge && (
                <>
                  <Badge variant={knowledge.is_active ? 'default' : 'secondary'}>
                    {knowledge.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                  <Badge variant="outline">
                    {t('knowledge.priority.label')}: {knowledge.priority}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={duplicateKnowledge.isPending}
            >
              {duplicateKnowledge.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('common.duplicate')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('knowledge.tabs.editor')}
          </TabsTrigger>
          {!isNew && (
            <>
              <TabsTrigger value="translations" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {t('knowledge.tabs.translations')}
                {knowledge?.translations && (
                  <Badge variant="secondary" className="ml-1">
                    {knowledge.translations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('knowledge.tabs.validation')}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="editor" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Editor */}
            <div className="lg:col-span-3">
              <KnowledgeEditor
                knowledge={knowledge || null}
                platformId={currentPlatform?.id || 0}
                defaultType={defaultType}
                onSave={handleSave}
                onAutoSave={!isNew ? handleAutoSave : undefined}
                isLoading={isLoading}
                isSaving={isSaving}
              />
            </div>

            {/* Metadata Sidebar */}
            <div className="space-y-4">
              {/* Info Card */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('knowledge.fields.platform')}
                    </p>
                    <p className="font-medium">{currentPlatform?.name}</p>
                  </div>

                  {knowledge && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('knowledge.fields.created')}
                        </p>
                        <p>{new Date(knowledge.created_at).toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('knowledge.fields.updated')}
                        </p>
                        <p>{new Date(knowledge.updated_at).toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('knowledge.fields.sourceLanguage')}
                        </p>
                        <Badge variant="outline">
                          {knowledge.language.toUpperCase()}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Type Info */}
              {typeMetadata && (
                <Card>
                  <CardContent className="pt-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${typeMetadata.color}20` }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: typeMetadata.color }}
                      />
                    </div>
                    <h4 className="font-medium">{typeMetadata.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {typeMetadata.description}
                    </p>
                    {typeMetadata.required && (
                      <Badge variant="outline" className="mt-2 text-red-600 border-red-300">
                        {t('knowledge.required')}
                      </Badge>
                    )}
                    {typeMetadata.maxItems && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('knowledge.maxItems', { count: typeMetadata.maxItems })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {!isNew && (
          <>
            <TabsContent value="translations" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  {knowledge?.translations && knowledge.translations.length > 0 ? (
                    <div className="space-y-4">
                      {knowledge.translations.map(trans => (
                        <div
                          key={trans.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              {trans.language.toUpperCase()}
                            </Badge>
                            <div>
                              <p className="font-medium">{trans.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {trans.status === 'done' && t('knowledge.translations.status.done')}
                                {trans.status === 'pending' && t('knowledge.translations.status.pending')}
                                {trans.status === 'missing' && t('knowledge.translations.status.missing')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {trans.translated_by && (
                              <Badge variant="secondary">
                                {trans.translated_by === 'ai' ? 'IA' : 'Manuel'}
                              </Badge>
                            )}
                            {trans.translated_at && (
                              <span className="text-sm text-muted-foreground">
                                {new Date(trans.translated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium">{t('knowledge.translations.empty.title')}</h3>
                      <p className="text-muted-foreground mt-1">
                        {t('knowledge.translations.empty.description')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validation" className="mt-6">
              <KnowledgeValidator
                initialText={knowledge?.content || ''}
                platformId={currentPlatform?.id}
                compact={false}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('knowledge.delete.title')}
            </DialogTitle>
            <DialogDescription>
              {t('knowledge.delete.description', { title: knowledge?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteKnowledge.isPending}
            >
              {deleteKnowledge.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
