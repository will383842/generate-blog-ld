/**
 * Platform Connector Component
 * File 378 - Platform configuration form
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Globe,
  Key,
  Link2,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  useCreatePlatform,
  useUpdatePlatform,
  useTestConnection,
} from '@/hooks/usePublishing';
import {
  ExternalPlatform,
  CreatePlatformInput,
  PlatformType,
  AuthType,
  FieldMapping,
  PLATFORM_TYPE_CONFIG,
  AUTH_TYPE_CONFIG,
} from '@/types/publishing';
import { cn } from '@/lib/utils';

// Validation schema
const platformSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  type: z.enum(['wordpress', 'custom_api', 'webhook', 'ftp', 'other'] as const),
  baseUrl: z.string().url('URL invalide'),
  authType: z.enum(['none', 'api_key', 'bearer', 'basic', 'oauth2'] as const),
  isActive: z.boolean(),
});

// Article fields available for mapping
const ARTICLE_FIELDS = [
  { value: 'title', label: 'Titre' },
  { value: 'content', label: 'Contenu' },
  { value: 'excerpt', label: 'Extrait' },
  { value: 'slug', label: 'Slug' },
  { value: 'meta_title', label: 'Meta Title' },
  { value: 'meta_description', label: 'Meta Description' },
  { value: 'featured_image', label: 'Image à la une' },
  { value: 'categories', label: 'Catégories' },
  { value: 'tags', label: 'Tags' },
  { value: 'author', label: 'Auteur' },
  { value: 'published_at', label: 'Date de publication' },
];

interface PlatformConnectorProps {
  platform?: ExternalPlatform | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PlatformConnector({ platform, onSuccess, onCancel }: PlatformConnectorProps) {
  const { t } = useTranslation();
  const isEditing = !!platform;

  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const testConnection = useTestConnection();

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [authConfig, setAuthConfig] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePlatformInput>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: platform?.name || '',
      type: platform?.type || 'wordpress',
      baseUrl: platform?.baseUrl || '',
      authType: platform?.authType || 'none',
      isActive: platform?.isActive ?? true,
    },
  });

  const authType = watch('authType');

  // Initialize from existing platform
  useEffect(() => {
    if (platform) {
      setHeaders(
        Object.entries(platform.defaultHeaders || {}).map(([key, value]) => ({ key, value }))
      );
      setFieldMappings(platform.fieldMapping || []);
      setAuthConfig(platform.authConfig || {});
    }
  }, [platform]);

  // Add header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  // Remove header
  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Update header
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  // Add field mapping
  const addFieldMapping = () => {
    setFieldMappings([...fieldMappings, { sourceField: '', targetPath: '' }]);
  };

  // Remove field mapping
  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  // Update field mapping
  const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
    const newMappings = [...fieldMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setFieldMappings(newMappings);
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!platform?.id) return;
    try {
      const result = await testConnection.mutateAsync(platform.id);
      setTestResult({
        success: result.success,
        message: result.success ? `Connexion réussie (${result.latency}ms)` : result.error || 'Échec',
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur de test' });
    }
  };

  // Submit
  const onSubmit = async (data: CreatePlatformInput) => {
    const payload = {
      ...data,
      authConfig,
      defaultHeaders: Object.fromEntries(
        headers.filter(h => h.key && h.value).map(h => [h.key, h.value])
      ),
      fieldMapping: fieldMappings.filter(m => m.sourceField && m.targetPath),
    };

    if (isEditing && platform) {
      await updatePlatform.mutateAsync({ id: platform.id, ...payload });
    } else {
      await createPlatform.mutateAsync(payload);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom de la plateforme</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Mon WordPress"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as PlatformType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="baseUrl">URL de base</Label>
            <Input
              id="baseUrl"
              {...register('baseUrl')}
              placeholder="https://example.com/wp-json/wp/v2"
              className="mt-1"
            />
            {errors.baseUrl && (
              <p className="text-sm text-red-500 mt-1">{errors.baseUrl.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Plateforme active</Label>
              <p className="text-sm text-muted-foreground">
                Activer les publications vers cette plateforme
              </p>
            </div>
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(v) => setValue('isActive', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Authentification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Type d'authentification</Label>
            <Select
              value={authType}
              onValueChange={(v) => setValue('authType', v as AuthType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AUTH_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <p>{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Auth */}
          {authType === 'api_key' && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div>
                <Label>Clé API</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showSecrets.apiKey ? 'text' : 'password'}
                    value={authConfig.apiKey || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSecrets({ ...showSecrets, apiKey: !showSecrets.apiKey })}
                  >
                    {showSecrets.apiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du header</Label>
                  <Input
                    value={authConfig.apiKeyHeader || 'X-API-Key'}
                    onChange={(e) => setAuthConfig({ ...authConfig, apiKeyHeader: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Emplacement</Label>
                  <Select
                    value={authConfig.apiKeyLocation || 'header'}
                    onValueChange={(v) => setAuthConfig({ ...authConfig, apiKeyLocation: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="query">Query parameter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Bearer Auth */}
          {authType === 'bearer' && (
            <div className="pl-4 border-l-2 border-muted">
              <Label>Bearer Token</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type={showSecrets.bearer ? 'text' : 'password'}
                  value={authConfig.bearerToken || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, bearerToken: e.target.value })}
                  placeholder="eyJhbGc..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSecrets({ ...showSecrets, bearer: !showSecrets.bearer })}
                >
                  {showSecrets.bearer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Basic Auth */}
          {authType === 'basic' && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
              <div>
                <Label>Username</Label>
                <Input
                  value={authConfig.username || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={authConfig.password || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Headers par défaut</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addHeader}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {headers.length > 0 ? (
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun header personnalisé
            </p>
          )}
        </CardContent>
      </Card>

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Mapping des champs
              </CardTitle>
              <CardDescription>
                Associez les champs de vos articles aux champs de l'API
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFieldMapping}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fieldMappings.length > 0 ? (
            <div className="space-y-2">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={mapping.sourceField}
                    onValueChange={(v) => updateFieldMapping(index, 'sourceField', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Champ source" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTICLE_FIELDS.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Chemin cible (ex: post.title)"
                    value={mapping.targetPath}
                    onChange={(e) => updateFieldMapping(index, 'targetPath', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFieldMapping(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun mapping configuré
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <div className={cn(
          'p-4 rounded-lg flex items-center gap-2',
          testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        )}>
          {testResult.success ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testConnection.isPending}
            >
              {testConnection.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Tester la connexion
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createPlatform.isPending || updatePlatform.isPending}
          >
            {(createPlatform.isPending || updatePlatform.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default PlatformConnector;
