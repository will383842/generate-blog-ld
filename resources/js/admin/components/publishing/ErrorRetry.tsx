/**
 * Error Retry Component
 * File 384 - Publication error retry with payload editing
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Code,
  Edit3,
  Loader2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/Alert';
import { useRetryPublish, useCancelPublish } from '@/hooks/usePublishing';
import { PublishQueue, PLATFORM_TYPE_CONFIG } from '@/types/publishing';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ErrorRetryProps {
  errors: PublishQueue[];
  onDismiss?: (id: number) => void;
  compact?: boolean;
}

export function ErrorRetry({ errors, onDismiss, compact = false }: ErrorRetryProps) {
  const { t } = useTranslation();

  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [editingPayload, setEditingPayload] = useState<{ id: number; payload: string } | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const retryPublish = useRetryPublish();
  const cancelPublish = useCancelPublish();

  // Toggle error expansion
  const toggleError = (id: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedErrors(newExpanded);
  };

  // Open payload editor
  const openPayloadEditor = (error: PublishQueue) => {
    setEditingPayload({
      id: error.id,
      payload: JSON.stringify(error.payload || {}, null, 2),
    });
  };

  // Retry with modified payload
  const handleRetryWithPayload = async () => {
    if (!editingPayload) return;

    try {
      const payload = JSON.parse(editingPayload.payload);
      setRetryingId(editingPayload.id);
      await retryPublish.mutateAsync({ id: editingPayload.id, payload });
      setEditingPayload(null);
    } catch (error) {
      // JSON parse error
    } finally {
      setRetryingId(null);
    }
  };

  // Simple retry
  const handleRetry = async (id: number) => {
    setRetryingId(id);
    await retryPublish.mutateAsync({ id });
    setRetryingId(null);
  };

  // Dismiss error
  const handleDismiss = async (id: number) => {
    await cancelPublish.mutateAsync(id);
    onDismiss?.(id);
  };

  if (errors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <p>Aucune erreur de publication</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Alert */}
      {!compact && errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreurs de publication</AlertTitle>
          <AlertDescription>
            {errors.length} publication{errors.length > 1 ? 's' : ''} en erreur nécessite{errors.length > 1 ? 'nt' : ''} votre attention
          </AlertDescription>
        </Alert>
      )}

      {/* Error List */}
      <div className="space-y-3">
        {errors.map(error => (
          <Card key={error.id} className="border-red-200 bg-red-50">
            <Collapsible open={expandedErrors.has(error.id)} onOpenChange={() => toggleError(error.id)}>
              <CardHeader className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mt-0.5">
                        {expandedErrors.has(error.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {error.content?.title || `Contenu #${error.contentId}`}
                        </p>
                        {error.platform && (
                          <Badge variant="outline" className="text-xs">
                            {PLATFORM_TYPE_CONFIG[error.platform.type as keyof typeof PLATFORM_TYPE_CONFIG]?.icon}
                            {error.platform.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-red-700 mt-1 line-clamp-1">
                        {error.error || 'Erreur inconnue'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(error.updatedAt), { addSuffix: true, locale: fr })}
                        {' • '}
                        {error.retries}/{error.maxRetries} tentatives
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(error.id)}
                      disabled={retryingId === error.id}
                    >
                      {retryingId === error.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Réessayer</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(error.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Full Error Message */}
                  <div>
                    <p className="text-sm font-medium mb-1">Message d'erreur</p>
                    <pre className="text-xs bg-white p-3 rounded border border-red-200 overflow-auto max-h-[100px] whitespace-pre-wrap">
                      {error.error}
                    </pre>
                  </div>

                  {/* Original Request */}
                  {error.payload && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Payload original</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPayloadEditor(error)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                      <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-[150px]">
                        {JSON.stringify(error.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  {error.response && (
                    <div>
                      <p className="text-sm font-medium mb-1">Réponse API</p>
                      <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-[150px]">
                        {JSON.stringify(error.response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPayloadEditor(error)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Modifier et réessayer
                    </Button>
                    {error.content && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/articles/${error.contentId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir l'article
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Payload Editor Modal */}
      <Dialog open={!!editingPayload} onOpenChange={() => setEditingPayload(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Modifier le payload
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editingPayload?.payload || ''}
              onChange={(e) => setEditingPayload(prev =>
                prev ? { ...prev, payload: e.target.value } : null
              )}
              className="font-mono min-h-[300px]"
              placeholder="{}"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Modifiez le JSON ci-dessus puis cliquez sur "Réessayer" pour renvoyer la publication avec le nouveau payload.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayload(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleRetryWithPayload}
              disabled={retryPublish.isPending}
            >
              {retryPublish.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Réessayer avec ce payload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ErrorRetry;
