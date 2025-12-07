/**
 * Templates Page
 * CRUD for generation templates
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Star,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useSetDefaultTemplate,
  useDuplicateTemplate,
  useExportTemplates,
  useImportTemplates,
  TEMPLATE_VARIABLES,
  extractTemplateVariables,
  renderTemplate,
} from '@/hooks/useTemplates';
import { CONTENT_TYPES } from '@/utils/constants';
import type { ContentTypeId } from '@/types/program';
import type { Template, TemplateVariable, CreateTemplateInput } from '@/types/generation';

export function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ContentTypeId | ''>('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  const { data: templatesData, isLoading } = useTemplates({
    contentType: filterType || undefined,
    search: search || undefined,
  });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const setDefault = useSetDefaultTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const exportTemplates = useExportTemplates();
  const importTemplates = useImportTemplates();

  const templates = templatesData?.data || [];

  // Form state for create/edit
  const [form, setForm] = useState<Partial<CreateTemplateInput>>({
    name: '',
    description: '',
    contentType: 'article',
    content: '',
    variables: [],
  });

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setForm({
      name: '',
      description: '',
      contentType: 'article',
      content: '',
      variables: [],
    });
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(false);
    setForm({
      name: template.name,
      description: template.description,
      contentType: template.contentType,
      content: template.content,
      variables: template.variables,
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.content) return;

    // Auto-detect variables
    const detectedVars = extractTemplateVariables(form.content);
    const variables: TemplateVariable[] = detectedVars.map((name) => ({
      name,
      label: TEMPLATE_VARIABLES.find((v) => v.name === name)?.label || name,
      type: 'text',
      required: true,
    }));

    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        data: { ...form, variables },
      });
    } else {
      await createTemplate.mutateAsync({
        ...form as CreateTemplateInput,
        variables,
      });
    }

    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    await deleteTemplate.mutateAsync(id);
  };

  const handleDuplicate = async (template: Template) => {
    const name = prompt('Nom du nouveau template:', `${template.name} (copie)`);
    if (!name) return;
    await duplicateTemplate.mutateAsync({ id: template.id, name });
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await importTemplates.mutateAsync(file);
      }
    };
    input.click();
  };

  // Preview rendered template
  const renderedPreview = form.content
    ? renderTemplate(form.content, {
        platform: 'SOS-Expat',
        country: 'France',
        country_code: 'FR',
        language: 'Français',
        language_code: 'fr',
        theme: 'Visa',
        title: 'Guide complet',
        date: new Date().toISOString().split('T')[0],
        year: new Date().getFullYear().toString(),
        capital: 'Paris',
        ...previewData,
      })
    : '';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/generation">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-muted-foreground">
              Gérez les templates de génération
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" onClick={() => exportTemplates.mutate(undefined)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ContentTypeId | '')}
          className="w-48"
        >
          <option value="">Tous les types</option>
          {CONTENT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </Select>
      </div>

      {/* Editor / List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun template
              </p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition-colors',
                    editingTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-gray-300'
                  )}
                  onClick={() => handleEdit(template)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.isDefault && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {template.isSystem && (
                          <Badge variant="secondary">Système</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {CONTENT_TYPES.find((t) => t.id === template.contentType)?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!template.isDefault && !template.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefault.mutate(template.id);
                          }}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(template);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {!template.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {template.variables.slice(0, 4).map((v) => (
                      <Badge key={v.name} variant="outline" className="text-[10px]">
                        {`{{${v.name}}}`}
                      </Badge>
                    ))}
                    {template.variables.length > 4 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{template.variables.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        {(isCreating || editingTemplate) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Nouveau template' : 'Modifier le template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="edit">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="edit">
                    <Code className="w-4 h-4 mr-2" />
                    Éditer
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="w-4 h-4 mr-2" />
                    Aperçu
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom *</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nom du template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Description optionnelle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type de contenu</label>
                    <Select
                      value={form.contentType}
                      onChange={(e) =>
                        setForm({ ...form, contentType: e.target.value as ContentTypeId })
                      }
                    >
                      {CONTENT_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contenu *</label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Utilisez {{variable}} pour les variables"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Variables help */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Variables disponibles</p>
                    <div className="flex flex-wrap gap-1">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              content: (form.content || '') + `{{${v.name}}}`,
                            })
                          }
                          className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
                        >
                          {`{{${v.name}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm">
                    {renderedPreview || 'Aucun contenu à prévisualiser'}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsCreating(false);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!form.name || !form.content}
                >
                  {isCreating ? 'Créer' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default TemplatesPage;
