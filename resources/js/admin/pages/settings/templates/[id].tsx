import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Save,
  ArrowLeft,
  Copy,
  Trash2,
  Star,
  Eye,
  History,
  Code,
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useContentTemplates } from '@/hooks/useContentTemplates';
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  LANGUAGES,
  LANGUAGE_FLAGS,
  GPT_MODELS,
  type ContentTemplate,
  type TemplateFormData,
  type TemplateType,
  type LanguageCode,
} from '@/types/template';

const TemplateEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const isNew = id === 'new';

  const {
    template,
    versions,
    loading,
    error,
    fetchTemplate,
    fetchVersions,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    setAsDefault,
    restoreVersion,
    previewPrompt,
  } = useContentTemplates();

  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    type: 'article',
    name: '',
    description: '',
    language_code: 'fr',
    system_prompt: '',
    user_prompt: '',
    model: 'gpt-4o',
    max_tokens: 4000,
    temperature: 0.7,
    word_count_min: 1200,
    word_count_target: 1500,
    word_count_max: 1800,
    faq_count: 8,
    is_default: false,
    is_active: true,
  });

  const [changeNote, setChangeNote] = useState('');
  const [activeTab, setActiveTab] = useState('prompts');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load template if editing
  useEffect(() => {
    if (!isNew && id) {
      fetchTemplate(parseInt(id));
      fetchVersions(parseInt(id));
    }
  }, [id, isNew, fetchTemplate, fetchVersions]);

  // Populate form with template data
  useEffect(() => {
    if (template && !isNew) {
      setFormData({
        type: template.type,
        name: template.name,
        description: template.description || '',
        language_code: template.language_code,
        system_prompt: template.system_prompt,
        user_prompt: template.user_prompt,
        model: template.model,
        max_tokens: template.max_tokens,
        temperature: template.temperature,
        word_count_min: template.word_count_min || undefined,
        word_count_target: template.word_count_target || undefined,
        word_count_max: template.word_count_max || undefined,
        faq_count: template.faq_count,
        is_default: template.is_default,
        is_active: template.is_active,
      });
    }
  }, [template, isNew]);

  // Form change handler
  const handleChange = useCallback((key: keyof TemplateFormData, value: TemplateFormData[keyof TemplateFormData]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setValidationErrors([]);
  }, []);

  // Validation
  const validate = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Le nom est requis');
    }
    if (!formData.system_prompt.trim() || formData.system_prompt.length < 50) {
      errors.push('Le system prompt doit contenir au moins 50 caractères');
    }
    if (!formData.user_prompt.trim() || formData.user_prompt.length < 100) {
      errors.push('Le user prompt doit contenir au moins 100 caractères');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Save handler
  const handleSave = async () => {
    if (!validate()) return;

    let result;
    if (isNew) {
      result = await createTemplate(formData);
    } else if (template) {
      result = await updateTemplate(template.id, { ...formData, change_note: changeNote });
    }

    if (result) {
      setHasChanges(false);
      setChangeNote('');
      if (isNew) {
        navigate(`/settings/templates/${result.id}`);
      }
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (template) {
      const success = await deleteTemplate(template.id);
      if (success) {
        navigate('/settings/templates');
      }
    }
    setShowDeleteConfirm(false);
  };

  // Duplicate handler
  const handleDuplicate = async () => {
    if (template) {
      const result = await duplicateTemplate(template.id);
      if (result) {
        navigate(`/settings/templates/${result.id}`);
      }
    }
  };

  // Preview handler
  const handlePreview = async () => {
    if (template) {
      const data = await previewPrompt(template.id);
      setPreviewData(data);
    }
  };

  // Restore version handler
  const handleRestoreVersion = async (version: number) => {
    if (template) {
      await restoreVersion(template.id, version);
      setHasChanges(false);
    }
  };

  // Extract variables from user prompt
  const extractedVariables = formData.user_prompt.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || [];

  // Category based on type
  const category = ['press_release', 'dossier'].includes(formData.type) ? 'press' : 'content';

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isNew ? 'Nouveau Template' : `Modifier: ${template?.name || ''}`}
        description={isNew ? 'Créez un nouveau template de génération' : `Version ${template?.version || 1}`}
        actions={
          <div className="flex items-center gap-3">
            {!isNew && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDuplicate}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Dupliquer
                </Button>
                {!template?.is_default && (
                  <Button
                    variant="outline"
                    onClick={() => template && setAsDefault(template.id)}
                    className="flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Définir par défaut
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </>
            )}
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isNew ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        }
      />

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="error">
          <AlertCircle className="w-4 h-4" />
          <div>
            <p className="font-medium">Erreurs de validation :</p>
            <ul className="list-disc list-inside mt-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* Status badges */}
      {!isNew && template && (
        <div className="flex items-center gap-3">
          <Badge variant={template.is_active ? 'green' : 'gray'}>
            {template.is_active ? 'Actif' : 'Inactif'}
          </Badge>
          {template.is_default && (
            <Badge variant="yellow" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Par défaut
            </Badge>
          )}
          <Badge variant="blue">
            {LANGUAGE_FLAGS[template.language_code]} {LANGUAGES[template.language_code]}
          </Badge>
          <Badge variant="purple">
            {TEMPLATE_TYPES[template.category]?.[template.type]}
          </Badge>
          <span className="text-sm text-gray-500">
            Utilisé {template.usage_count} fois
          </span>
        </div>
      )}

      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prompts">
            <Code className="w-4 h-4 mr-2" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Prévisualisation
          </TabsTrigger>
          {!isNew && (
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
          )}
        </TabsList>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card className="p-6 space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label="Type de contenu"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as TemplateType)}
                required
              >
                <optgroup label="Contenu en ligne">
                  {Object.entries(TEMPLATE_TYPES.content).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </optgroup>
                <optgroup label="Presse (PDF)">
                  {Object.entries(TEMPLATE_TYPES.press).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </optgroup>
              </Select>

              <Input
                label="Nom du template"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Article Standard"
                required
              />

              <Select
                label="Langue"
                value={formData.language_code}
                onChange={(e) => handleChange('language_code', e.target.value as LanguageCode)}
                required
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {LANGUAGE_FLAGS[code as LanguageCode]} {name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description optionnelle du template"
            />

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Prompt
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Textarea
                value={formData.system_prompt}
                onChange={(e) => handleChange('system_prompt', e.target.value)}
                rows={6}
                placeholder="Instructions pour définir le rôle et le comportement de l'IA..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Définit le rôle, l'expertise et le style de l'IA. Minimum 50 caractères.
              </p>
            </div>

            {/* User Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Prompt (Template)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Textarea
                value={formData.user_prompt}
                onChange={(e) => handleChange('user_prompt', e.target.value)}
                rows={15}
                placeholder="Template avec variables {title}, {country}, etc..."
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Utilisez {'{variable}'} pour les variables dynamiques. Minimum 100 caractères.
                </p>
                <span className="text-xs text-gray-500">
                  {formData.user_prompt.length} caractères
                </span>
              </div>
            </div>

            {/* Extracted variables */}
            {extractedVariables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables détectées ({extractedVariables.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractedVariables.map((variable, i) => (
                    <Badge key={i} variant="blue">
                      {'{' + variable + '}'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-medium">Configuration GPT</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label="Modèle"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
              >
                {Object.entries(GPT_MODELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>

              <Input
                label="Max Tokens"
                type="number"
                value={formData.max_tokens}
                onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                min={500}
                max={16000}
              />

              <Input
                label="Température"
                type="number"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-medium">Paramètres de contenu</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input
                label="Mots minimum"
                type="number"
                value={formData.word_count_min || ''}
                onChange={(e) => handleChange('word_count_min', parseInt(e.target.value) || undefined)}
                min={100}
              />

              <Input
                label="Mots cible"
                type="number"
                value={formData.word_count_target || ''}
                onChange={(e) => handleChange('word_count_target', parseInt(e.target.value) || undefined)}
                min={100}
              />

              <Input
                label="Mots maximum"
                type="number"
                value={formData.word_count_max || ''}
                onChange={(e) => handleChange('word_count_max', parseInt(e.target.value) || undefined)}
                min={100}
              />

              <Input
                label="Nombre de FAQ"
                type="number"
                value={formData.faq_count}
                onChange={(e) => handleChange('faq_count', parseInt(e.target.value) || 0)}
                min={0}
                max={20}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-medium">Statut</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Template actif</p>
                  <p className="text-sm text-gray-500">Les templates inactifs ne sont pas disponibles pour la génération</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Template par défaut</p>
                  <p className="text-sm text-gray-500">Utilisé automatiquement pour ce type et cette langue</p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => handleChange('is_default', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Change note for updates */}
          {!isNew && hasChanges && (
            <Card className="p-6">
              <Input
                label="Note de modification (optionnel)"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Décrivez les changements apportés..."
              />
            </Card>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Prévisualisation du prompt</h3>
              <Button
                onClick={handlePreview}
                disabled={isNew || loading}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Générer l'aperçu
              </Button>
            </div>

            {previewData ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    System Prompt
                  </h4>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {previewData.system_prompt}
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Prompt (avec variables de test)
                  </h4>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {previewData.user_prompt}
                  </pre>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variables utilisées
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(previewData.variables_used).map(([key, value]) => (
                      <div key={key} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                        <span className="text-gray-500">{key}:</span>{' '}
                        <span className="font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Cliquez sur "Générer l'aperçu" pour voir le prompt avec des données de test
              </div>
            )}
          </Card>
        </TabsContent>

        {/* History Tab */}
        {!isNew && (
          <TabsContent value="history" className="space-y-6">
            <Card>
              {versions.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {versions.map((version) => (
                    <div key={version.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <Badge variant="blue">v{version.version}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(version.created_at).toLocaleString('fr-FR')}
                          </span>
                          {version.creator && (
                            <span className="text-sm text-gray-500">
                              par {version.creator.name}
                            </span>
                          )}
                        </div>
                        {version.change_note && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {version.change_note}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.version)}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restaurer
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Aucun historique de version disponible
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Supprimer le template"
        description={`Êtes-vous sûr de vouloir supprimer le template "${template?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="destructive"
      />

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 dark:text-yellow-200">
            Vous avez des modifications non enregistrées
          </span>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
