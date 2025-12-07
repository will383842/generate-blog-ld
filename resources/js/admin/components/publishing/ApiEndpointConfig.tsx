/**
 * API Endpoint Config Component
 * File 379 - API endpoint configuration form
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Zap,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Code,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import {
  useCreateEndpoint,
  useUpdateEndpoint,
  useTestEndpoint,
} from '@/hooks/usePublishing';
import {
  PublishingEndpoint,
  CreateEndpointInput,
  HttpMethod,
  ResponseMapping,
} from '@/types/publishing';
import { cn } from '@/lib/utils';

// Validation schema
const endpointSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const),
  path: z.string().min(1, 'Path requis'),
  isDefault: z.boolean(),
});

// Available path variables
const PATH_VARIABLES = [
  { value: '{article_id}', label: 'ID de l\'article' },
  { value: '{slug}', label: 'Slug' },
  { value: '{category}', label: 'Catégorie' },
  { value: '{date}', label: 'Date' },
];

// Default body template
const DEFAULT_BODY_TEMPLATE = `{
  "title": "{{title}}",
  "content": "{{content}}",
  "excerpt": "{{excerpt}}",
  "status": "publish"
}`;

interface ApiEndpointConfigProps {
  platformId: number;
  endpoint?: PublishingEndpoint | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApiEndpointConfig({
  platformId,
  endpoint,
  onSuccess,
  onCancel,
}: ApiEndpointConfigProps) {
  const { t } = useTranslation();
  const isEditing = !!endpoint;

  const createEndpoint = useCreateEndpoint();
  const updateEndpoint = useUpdateEndpoint();
  const testEndpoint = useTestEndpoint();

  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [bodyTemplate, setBodyTemplate] = useState(DEFAULT_BODY_TEMPLATE);
  const [responseMapping, setResponseMapping] = useState<ResponseMapping>({});
  const [testResult, setTestResult] = useState<{ success: boolean; response?: unknown; error?: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEndpointInput>({
    resolver: zodResolver(endpointSchema),
    defaultValues: {
      name: endpoint?.name || '',
      method: endpoint?.method || 'POST',
      path: endpoint?.path || '/posts',
      isDefault: endpoint?.isDefault ?? false,
    },
  });

  const method = watch('method');

  // Initialize from existing endpoint
  useEffect(() => {
    if (endpoint) {
      setHeaders(
        Object.entries(endpoint.headers || {}).map(([key, value]) => ({ key, value }))
      );
      setBodyTemplate(endpoint.bodyTemplate || DEFAULT_BODY_TEMPLATE);
      setResponseMapping(endpoint.responseMapping || {});
    }
  }, [endpoint]);

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

  // Insert variable into path
  const insertVariable = (variable: string) => {
    const currentPath = watch('path');
    setValue('path', currentPath + variable);
  };

  // Test endpoint
  const handleTestEndpoint = async () => {
    if (!endpoint?.id) return;
    try {
      const result = await testEndpoint.mutateAsync(endpoint.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Erreur de test' });
    }
  };

  // Submit
  const onSubmit = async (data: CreateEndpointInput) => {
    const payload = {
      ...data,
      platformId,
      headers: Object.fromEntries(
        headers.filter(h => h.key && h.value).map(h => [h.key, h.value])
      ),
      bodyTemplate,
      responseMapping,
    };

    if (isEditing && endpoint) {
      await updateEndpoint.mutateAsync({ id: endpoint.id, ...payload });
    } else {
      await createEndpoint.mutateAsync(payload);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Configuration de l'endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de l'endpoint</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Créer un article"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Méthode</Label>
              <Select
                value={watch('method')}
                onValueChange={(v) => setValue('method', v as HttpMethod)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(m => (
                    <SelectItem key={m} value={m}>
                      <Badge
                        variant="outline"
                        className={cn(
                          m === 'GET' && 'bg-blue-50 text-blue-700',
                          m === 'POST' && 'bg-green-50 text-green-700',
                          m === 'PUT' && 'bg-yellow-50 text-yellow-700',
                          m === 'PATCH' && 'bg-orange-50 text-orange-700',
                          m === 'DELETE' && 'bg-red-50 text-red-700'
                        )}
                      >
                        {m}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label>Path</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  {...register('path')}
                  placeholder="/posts"
                  className="font-mono"
                />
                <Select onValueChange={insertVariable}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {PATH_VARIABLES.map(v => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.path && (
                <p className="text-sm text-red-500 mt-1">{errors.path.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isDefault">Endpoint par défaut</Label>
              <p className="text-sm text-muted-foreground">
                Utilisé automatiquement pour les publications
              </p>
            </div>
            <Switch
              id="isDefault"
              checked={watch('isDefault')}
              onCheckedChange={(v) => setValue('isDefault', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Headers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Headers</CardTitle>
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
                    className="flex-1 font-mono"
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="flex-1 font-mono"
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

      {/* Body Template */}
      {method !== 'GET' && method !== 'DELETE' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="h-4 w-4" />
              Template du body (JSON)
            </CardTitle>
            <CardDescription>
              Utilisez {'{{field}}'} pour les variables dynamiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder={DEFAULT_BODY_TEMPLATE}
              className="font-mono min-h-[200px]"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {['title', 'content', 'excerpt', 'slug', 'meta_title', 'meta_description'].map(field => (
                <Badge
                  key={field}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setBodyTemplate(prev => prev + `{{${field}}}`)}
                >
                  {`{{${field}}}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Mapping */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            {showAdvanced ? 'Masquer' : 'Afficher'} la configuration avancée
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapping de la réponse</CardTitle>
              <CardDescription>
                Configurez comment interpréter la réponse de l'API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chemin du succès</Label>
                  <Input
                    value={responseMapping.successPath || ''}
                    onChange={(e) => setResponseMapping({
                      ...responseMapping,
                      successPath: e.target.value,
                    })}
                    placeholder="status"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label>Valeur de succès</Label>
                  <Input
                    value={responseMapping.successValue || ''}
                    onChange={(e) => setResponseMapping({
                      ...responseMapping,
                      successValue: e.target.value,
                    })}
                    placeholder="success"
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chemin de l'ID externe</Label>
                  <Input
                    value={responseMapping.idPath || ''}
                    onChange={(e) => setResponseMapping({
                      ...responseMapping,
                      idPath: e.target.value,
                    })}
                    placeholder="data.id"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label>Chemin de l'URL externe</Label>
                  <Input
                    value={responseMapping.urlPath || ''}
                    onChange={(e) => setResponseMapping({
                      ...responseMapping,
                      urlPath: e.target.value,
                    })}
                    placeholder="data.link"
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
              <div>
                <Label>Chemin de l'erreur</Label>
                <Input
                  value={responseMapping.errorPath || ''}
                  onChange={(e) => setResponseMapping({
                    ...responseMapping,
                    errorPath: e.target.value,
                  })}
                  placeholder="error.message"
                  className="mt-1 font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Test Result */}
      {testResult && (
        <div className={cn(
          'p-4 rounded-lg',
          testResult.success ? 'bg-green-50' : 'bg-red-50'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.success ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Test réussi</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Test échoué</span>
              </>
            )}
          </div>
          {testResult.response && (
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-[200px]">
              {JSON.stringify(testResult.response, null, 2)}
            </pre>
          )}
          {testResult.error && (
            <p className="text-sm text-red-700">{testResult.error}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTestEndpoint}
              disabled={testEndpoint.isPending}
            >
              {testEndpoint.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Tester l'endpoint
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createEndpoint.isPending || updateEndpoint.isPending}
          >
            {(createEndpoint.isPending || updateEndpoint.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ApiEndpointConfig;
