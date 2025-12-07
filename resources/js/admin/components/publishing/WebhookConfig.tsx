/**
 * Webhook Config Component
 * File 382 - Webhook configuration form
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Webhook,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  useCreateWebhook,
  useUpdateWebhook,
  useTestWebhook,
  generateWebhookSecret,
} from '@/hooks/useWebhooks';
import {
  Webhook as WebhookType,
  CreateWebhookInput,
  WebhookEvent,
  WEBHOOK_EVENTS,
} from '@/types/publishing';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Validation schema
const webhookSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  url: z.string().url('URL invalide'),
  isActive: z.boolean(),
});

interface WebhookConfigProps {
  webhook?: WebhookType | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WebhookConfig({ webhook, onSuccess, onCancel }: WebhookConfigProps) {
  const { t } = useTranslation();
  const isEditing = !!webhook;

  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const testWebhook = useTestWebhook();

  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWebhookInput>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: webhook?.name || '',
      url: webhook?.url || '',
      isActive: webhook?.isActive ?? true,
    },
  });

  // Initialize from existing webhook
  useEffect(() => {
    if (webhook) {
      setSecret(webhook.secret);
      setEvents(webhook.events);
      setHeaders(
        Object.entries(webhook.headers || {}).map(([key, value]) => ({ key, value }))
      );
    } else {
      setSecret(generateWebhookSecret());
    }
  }, [webhook]);

  // Toggle event
  const toggleEvent = (event: WebhookEvent) => {
    if (events.includes(event)) {
      setEvents(events.filter(e => e !== event));
    } else {
      setEvents([...events, event]);
    }
  };

  // Toggle all events in group
  const toggleGroup = (groupEvents: WebhookEvent[]) => {
    const allSelected = groupEvents.every(e => events.includes(e));
    if (allSelected) {
      setEvents(events.filter(e => !groupEvents.includes(e)));
    } else {
      setEvents([...new Set([...events, ...groupEvents])]);
    }
  };

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

  // Generate new secret
  const handleGenerateSecret = () => {
    setSecret(generateWebhookSecret());
  };

  // Copy secret
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  // Test webhook
  const handleTestWebhook = async () => {
    if (!webhook?.id) return;
    try {
      const result = await testWebhook.mutateAsync(webhook.id);
      setTestResult({
        success: result.success,
        message: result.success
          ? `Status: ${result.statusCode} - ${result.duration}ms`
          : result.error || 'Échec',
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur de test' });
    }
  };

  // Submit
  const onSubmit = async (data: CreateWebhookInput) => {
    const payload = {
      ...data,
      secret,
      events,
      headers: Object.fromEntries(
        headers.filter(h => h.key && h.value).map(h => [h.key, h.value])
      ),
    };

    if (isEditing && webhook) {
      await updateWebhook.mutateAsync({ id: webhook.id, ...payload });
    } else {
      await createWebhook.mutateAsync(payload);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du webhook</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Mon webhook"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="url">URL de destination</Label>
            <Input
              id="url"
              {...register('url')}
              placeholder="https://example.com/webhook"
              className="mt-1"
            />
            {errors.url && (
              <p className="text-sm text-red-500 mt-1">{errors.url.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Webhook actif</Label>
              <p className="text-sm text-muted-foreground">
                Les événements seront envoyés à cette URL
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

      {/* Secret */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clé secrète</CardTitle>
          <CardDescription>
            Utilisée pour signer les requêtes (header X-Webhook-Signature)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="font-mono flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopySecret}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateSecret}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Générer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Événements</CardTitle>
          <CardDescription>
            Sélectionnez les événements qui déclencheront ce webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {WEBHOOK_EVENTS.map(group => {
              const groupEventValues = group.events.map(e => e.value);
              const allSelected = groupEventValues.every(e => events.includes(e));
              const someSelected = groupEventValues.some(e => events.includes(e));

              return (
                <div key={group.group} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleGroup(groupEventValues)}
                      className={cn(someSelected && !allSelected && 'opacity-50')}
                    />
                    <span className="font-medium">{group.group}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    {group.events.map(event => (
                      <div key={event.value} className="flex items-center gap-2">
                        <Checkbox
                          checked={events.includes(event.value)}
                          onCheckedChange={() => toggleEvent(event.value)}
                        />
                        <span className="text-sm">{event.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Headers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Headers personnalisés</CardTitle>
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

      {/* Status Info */}
      {isEditing && webhook && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dernier déclenchement</p>
                <p className="font-medium">
                  {webhook.lastTriggered
                    ? formatDistanceToNow(new Date(webhook.lastTriggered), {
                        addSuffix: true,
                        locale: fr,
                      })
                    : 'Jamais'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Taux de succès</p>
                <p className={cn(
                  'font-medium',
                  webhook.successRate >= 95 && 'text-green-600',
                  webhook.successRate >= 80 && webhook.successRate < 95 && 'text-yellow-600',
                  webhook.successRate < 80 && 'text-red-600'
                )}>
                  {webhook.successRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total appels</p>
                <p className="font-medium">{webhook.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              onClick={handleTestWebhook}
              disabled={testWebhook.isPending}
            >
              {testWebhook.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Tester le webhook
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createWebhook.isPending || updateWebhook.isPending || events.length === 0}
          >
            {(createWebhook.isPending || updateWebhook.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default WebhookConfig;
