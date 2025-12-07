import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  FileText,
  Folder,
  Copy,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Code,
  CheckCircle,
  X,
  Save,
  RefreshCw,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
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
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { TipTapEditor } from '@/components/editors/TipTapEditor';
import { usePressTemplates, useCreatePressTemplate, useUpdatePressTemplate, useDeletePressTemplate } from '@/hooks/usePressReleases';
import { PressTemplate } from '@/types/press';
import { PLATFORMS } from '@/utils/constants';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type TemplateType = 'press-release' | 'dossier';

interface TemplateFormData {
  name: string;
  type: TemplateType;
  platform: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
}

interface TemplateVariable {
  key: string;
  label: string;
  defaultValue: string;
  required: boolean;
}

const DEFAULT_VARIABLES: TemplateVariable[] = [
  { key: '{{title}}', label: 'Titre', defaultValue: '', required: true },
  { key: '{{date}}', label: 'Date', defaultValue: '', required: false },
  { key: '{{platform}}', label: 'Plateforme', defaultValue: '', required: false },
  { key: '{{author}}', label: 'Auteur', defaultValue: '', required: false },
];

const initialFormData: TemplateFormData = {
  name: '',
  type: 'press-release',
  platform: '',
  description: '',
  content: '',
  variables: [],
};

export const PressTemplates: React.FC = () => {
  const { t } = useTranslation(['press', 'common']);
  const { showToast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<TemplateType>('press-release');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PressTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<PressTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [variableEditorOpen, setVariableEditorOpen] = useState(false);

  // Queries & Mutations
  const { data: templates, isLoading, refetch } = usePressTemplates();
  const createMutation = useCreatePressTemplate();
  const updateMutation = useUpdatePressTemplate();
  const deleteMutation = useDeletePressTemplate();

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    return templates.filter((template) => {
      const matchesType = template.type === activeTab;
      const matchesSearch = searchQuery
        ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesType && matchesSearch;
    });
  }, [templates, activeTab, searchQuery]);

  // Template counts
  const templateCounts = useMemo(() => {
    if (!templates) return { 'press-release': 0, dossier: 0 };
    return {
      'press-release': templates.filter((t) => t.type === 'press-release').length,
      dossier: templates.filter((t) => t.type === 'dossier').length,
    };
  }, [templates]);

  // Update form field
  const updateFormField = useCallback(
    <K extends keyof TemplateFormData>(field: K, value: TemplateFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Open create dialog
  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setFormData({ ...initialFormData, type: activeTab });
    setDialogOpen(true);
  }, [activeTab]);

  // Open edit dialog
  const handleEdit = useCallback((template: PressTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type as TemplateType,
      platform: template.platform || '',
      description: template.description || '',
      content: template.content,
      variables: template.variables || [],
    });
    setDialogOpen(true);
  }, []);

  // Open preview dialog
  const handlePreview = useCallback((template: PressTemplate) => {
    setEditingTemplate(template);
    setPreviewDialogOpen(true);
  }, []);

  // Duplicate template
  const handleDuplicate = useCallback(
    async (template: PressTemplate) => {
      try {
        await createMutation.mutateAsync({
          name: `${template.name} (copie)`,
          type: template.type,
          platform: template.platform,
          description: template.description,
          content: template.content,
          variables: template.variables,
        });
        showToast(t('press:templates.duplicated'), 'success');
      } catch (error) {
        showToast(t('common:error.generic'), 'error');
      }
    },
    [createMutation, showToast, t]
  );

  // Delete template
  const handleDeleteClick = useCallback((template: PressTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!templateToDelete) return;

    try {
      await deleteMutation.mutateAsync(templateToDelete.id);
      showToast(t('press:templates.deleted'), 'success');
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }

    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  }, [templateToDelete, deleteMutation, showToast, t]);

  // Save template
  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      showToast(t('press:templates.nameRequired'), 'error');
      return;
    }

    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          data: formData,
        });
        showToast(t('press:templates.updated'), 'success');
      } else {
        await createMutation.mutateAsync(formData);
        showToast(t('press:templates.created'), 'success');
      }
      setDialogOpen(false);
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    }
  }, [editingTemplate, formData, createMutation, updateMutation, showToast, t]);

  // Add variable
  const addVariable = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      variables: [
        ...prev.variables,
        { key: '', label: '', defaultValue: '', required: false },
      ],
    }));
  }, []);

  // Update variable
  const updateVariable = useCallback(
    (index: number, field: keyof TemplateVariable, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        variables: prev.variables.map((v, i) =>
          i === index ? { ...v, [field]: value } : v
        ),
      }));
    },
    []
  );

  // Remove variable
  const removeVariable = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  }, []);

  // Insert variable into content
  const insertVariable = useCallback((key: string) => {
    updateFormField('content', formData.content + key);
  }, [formData.content, updateFormField]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('press:templates.title')}
        description={t('press:templates.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:refresh')}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('press:templates.create')}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateType)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="press-release" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('press:templates.pressReleases')}
              <Badge variant="secondary" className="ml-1">
                {templateCounts['press-release']}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="dossier" className="gap-2">
              <Folder className="h-4 w-4" />
              {t('press:templates.dossiers')}
              <Badge variant="secondary" className="ml-1">
                {templateCounts.dossier}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('press:templates.search')}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="press-release" className="mt-6">
          <TemplateGrid
            templates={filteredTemplates}
            isLoading={isLoading}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
            onCreate={handleCreate}
            emptyTitle={t('press:templates.emptyPressReleases')}
          />
        </TabsContent>

        <TabsContent value="dossier" className="mt-6">
          <TemplateGrid
            templates={filteredTemplates}
            isLoading={isLoading}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
            onCreate={handleCreate}
            emptyTitle={t('press:templates.emptyDossiers')}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? t('press:templates.edit')
                : t('press:templates.create')}
            </DialogTitle>
            <DialogDescription>
              {t('press:templates.formDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">{t('press:templates.name')}</Label>
                <Input
                  id="templateName"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  placeholder={t('press:templates.namePlaceholder')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="templatePlatform">{t('press:templates.platform')}</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(v) => updateFormField('platform', v)}
                >
                  <SelectTrigger id="templatePlatform" className="mt-1">
                    <SelectValue placeholder={t('press:templates.allPlatforms')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('press:templates.allPlatforms')}</SelectItem>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="templateDescription">{t('press:templates.templateDescription')}</Label>
              <Textarea
                id="templateDescription"
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                placeholder={t('press:templates.descriptionPlaceholder')}
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Variables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('press:templates.variables')}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVariableEditorOpen(!variableEditorOpen)}
                >
                  <Code className="h-4 w-4 mr-2" />
                  {variableEditorOpen
                    ? t('press:templates.hideVariables')
                    : t('press:templates.editVariables')}
                </Button>
              </div>

              {/* Available variables */}
              <div className="flex flex-wrap gap-2 mb-2">
                {DEFAULT_VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.key}
                  </Badge>
                ))}
                {formData.variables.map((v) => (
                  <Badge
                    key={v.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.key || '{{...}}'}
                  </Badge>
                ))}
              </div>

              {/* Variable editor */}
              {variableEditorOpen && (
                <Card className="mt-2">
                  <CardContent className="pt-4 space-y-3">
                    {formData.variables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={variable.key}
                          onChange={(e) => updateVariable(index, 'key', e.target.value)}
                          placeholder="{{variable}}"
                          className="w-32"
                        />
                        <Input
                          value={variable.label}
                          onChange={(e) => updateVariable(index, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <Input
                          value={variable.defaultValue}
                          onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                          placeholder="Valeur par défaut"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariable(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addVariable}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('press:templates.addVariable')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Editor */}
            <div>
              <Label>{t('press:templates.content')}</Label>
              <div className="mt-1 border rounded-lg">
                <TipTapEditor
                  content={formData.content}
                  onChange={(content) => updateFormField('content', content)}
                  placeholder={t('press:templates.contentPlaceholder')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.name}</DialogTitle>
            <DialogDescription>
              {editingTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: editingTemplate?.content || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('press:templates.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('press:templates.deleteDescription', {
                name: templateToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

// Template Grid Component
interface TemplateGridProps {
  templates: PressTemplate[];
  isLoading: boolean;
  onEdit: (template: PressTemplate) => void;
  onPreview: (template: PressTemplate) => void;
  onDuplicate: (template: PressTemplate) => void;
  onDelete: (template: PressTemplate) => void;
  onCreate: () => void;
  emptyTitle: string;
}

const TemplateGrid: React.FC<TemplateGridProps> = ({
  templates,
  isLoading,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onCreate,
  emptyTitle,
}) => {
  const { t } = useTranslation(['press', 'common']);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={emptyTitle}
        description={t('press:templates.emptyDescription')}
        action={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('press:templates.create')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{template.name}</CardTitle>
                {template.platform && (
                  <Badge variant="outline" className="mt-1">
                    {PLATFORMS.find((p) => p.id === template.platform)?.name ||
                      template.platform}
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(template)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('common:preview')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common:edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(template)}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('common:duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(template)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common:delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {template.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {format(new Date(template.updatedAt), 'dd MMM yyyy', { locale: fr })}
              </span>
              {template.usageCount !== undefined && (
                <span>
                  {t('press:templates.usedTimes', { count: template.usageCount })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PressTemplates;
