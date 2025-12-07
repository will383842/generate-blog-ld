/**
 * API Keys Settings Page
 * File 363 - API keys management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Loader2,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
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
import { useToast } from '@/hooks/useToast';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ApiKeyConfig {
  id: string;
  name: string;
  provider: string;
  icon: string;
  key: string;
  status: 'connected' | 'error' | 'not_configured';
  lastChecked?: string;
  quotaUsed?: number;
  quotaLimit?: number;
  docsUrl: string;
}

// Default API configs (keys will be loaded from API)
const DEFAULT_API_CONFIGS: Omit<ApiKeyConfig, 'key' | 'status' | 'lastChecked' | 'quotaUsed'>[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    provider: 'OpenAI',
    icon: '🤖',
    quotaLimit: 100000,
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    provider: 'Perplexity',
    icon: '🔍',
    quotaLimit: 10000,
    docsUrl: 'https://docs.perplexity.ai',
  },
  {
    id: 'dalle',
    name: 'DALL-E',
    provider: 'OpenAI',
    icon: '🎨',
    docsUrl: 'https://platform.openai.com/docs/guides/images',
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    provider: 'Unsplash',
    icon: '📷',
    quotaLimit: 5000,
    docsUrl: 'https://unsplash.com/developers',
  },
  {
    id: 'google',
    name: 'Google APIs',
    provider: 'Google',
    icon: '🔑',
    docsUrl: 'https://console.cloud.google.com',
  },
];

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const api = useApi();

  const [apis, setApis] = useState<ApiKeyConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [rotatingApi, setRotatingApi] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load API statuses from backend
  useEffect(() => {
    loadApiStatus();
  }, []);

  const loadApiStatus = async () => {
    setIsLoading(true);
    try {
      // Fetch API health status
      const [healthResponse, settingsResponse] = await Promise.all([
        api.get('/monitoring/apis/health').catch(() => ({ data: { data: {} } })),
        api.get('/settings', { params: { group: 'api_keys' } }).catch(() => ({ data: { data: [] } })),
      ]);

      const healthData = healthResponse.data?.data || {};
      const settingsData = settingsResponse.data?.data || [];

      // Build API configs from defaults + API data
      const configuredApis: ApiKeyConfig[] = DEFAULT_API_CONFIGS.map((config) => {
        const healthInfo = healthData[config.id] || {};
        const settingInfo = settingsData.find((s: { key: string }) => s.key === `api_key_${config.id}`);

        return {
          ...config,
          key: settingInfo?.value?.masked || '',
          status: healthInfo.status === 'healthy'
            ? 'connected'
            : healthInfo.status === 'error'
              ? 'error'
              : 'not_configured',
          lastChecked: healthInfo.lastChecked || new Date().toISOString(),
          quotaUsed: healthInfo.usage?.current || 0,
          quotaLimit: healthInfo.usage?.limit || config.quotaLimit,
        };
      });

      setApis(configuredApis);
    } catch (error) {
      console.error('Failed to load API status:', error);
      // Fall back to defaults with not_configured status
      setApis(DEFAULT_API_CONFIGS.map((config) => ({
        ...config,
        key: '',
        status: 'not_configured',
        quotaUsed: 0,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle key visibility
  const toggleKeyVisibility = (id: string) => {
    setShowKey({ ...showKey, [id]: !showKey[id] });
  };

  // Start editing key
  const startEditing = (id: string, currentKey: string) => {
    setEditingKey(id);
    setNewKeyValue(currentKey.includes('...') ? '' : currentKey);
  };

  // Save key to backend
  const saveKey = async (id: string) => {
    setIsSaving(true);
    try {
      // Save to settings API
      await api.put(`/settings/api_key_${id}`, {
        value: {
          key: newKeyValue,
          masked: maskKey(newKeyValue),
          updated_at: new Date().toISOString(),
        },
        group: 'api_keys',
        type: 'json',
      });

      // Update local state with masked key
      setApis(apis.map(apiConfig =>
        apiConfig.id === id
          ? { ...apiConfig, key: maskKey(newKeyValue), status: 'connected' as const }
          : apiConfig
      ));

      setEditingKey(null);
      setNewKeyValue('');

      toast({ title: 'Clé API enregistrée', description: 'La clé a été sauvegardée avec succès' });

      // Test connection after saving
      testConnection(id);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder la clé', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Mask API key for display
  const maskKey = (key: string): string => {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  // Test connection
  const testConnection = async (id: string) => {
    setTestingApi(id);
    try {
      // Call API health check
      const response = await api.get('/monitoring/apis/health');
      const healthData = response.data?.data || {};
      const apiHealth = healthData[id];

      const success = apiHealth?.status === 'healthy';

      setApis(apis.map(apiConfig =>
        apiConfig.id === id
          ? {
              ...apiConfig,
              status: success ? 'connected' : 'error',
              lastChecked: new Date().toISOString(),
              quotaUsed: apiHealth?.usage?.current || apiConfig.quotaUsed,
            }
          : apiConfig
      ));

      toast({
        title: success ? 'Connexion réussie' : 'Erreur de connexion',
        description: success ? 'L\'API est accessible' : apiHealth?.error || 'Vérifiez votre clé API',
        variant: success ? 'default' : 'destructive',
      });
    } catch (error) {
      setApis(apis.map(apiConfig =>
        apiConfig.id === id
          ? { ...apiConfig, status: 'error', lastChecked: new Date().toISOString() }
          : apiConfig
      ));
      toast({
        title: 'Erreur de connexion',
        description: 'Impossible de vérifier la connexion',
        variant: 'destructive',
      });
    } finally {
      setTestingApi(null);
    }
  };

  // Rotate key - just clear it so user can enter new one
  const rotateKey = async () => {
    if (!rotatingApi) return;
    try {
      await api.put(`/settings/api_key_${rotatingApi}`, {
        value: {
          key: '',
          masked: '',
          updated_at: new Date().toISOString(),
        },
        group: 'api_keys',
        type: 'json',
      });

      setApis(apis.map(apiConfig =>
        apiConfig.id === rotatingApi
          ? { ...apiConfig, key: '', status: 'not_configured' as const }
          : apiConfig
      ));

      toast({ title: 'Clé supprimée', description: 'Entrez une nouvelle clé API' });
      setShowRotateDialog(false);
      setRotatingApi(null);

      // Start editing mode for the rotated key
      setEditingKey(rotatingApi);
      setNewKeyValue('');
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la clé', variant: 'destructive' });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 gap-1">
            <CheckCircle className="h-3 w-3" />
            Connecté
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Non configuré
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            Clés API
          </h1>
          <p className="text-muted-foreground">Gérez vos clés API pour les services externes</p>
        </div>
        <Button variant="outline" onClick={loadApiStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* API Cards */}
      <div className="space-y-4">
        {apis.map(apiConfig => (
          <Card key={apiConfig.id} className={cn(
            apiConfig.status === 'error' && 'border-red-200',
            apiConfig.status === 'not_configured' && 'border-dashed'
          )}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {apiConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{apiConfig.name}</h3>
                      {getStatusBadge(apiConfig.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{apiConfig.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={apiConfig.docsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Key Input */}
              <div className="mt-4">
                <Label>Clé API</Label>
                <div className="flex items-center gap-2 mt-1">
                  {editingKey === apiConfig.id ? (
                    <>
                      <Input
                        type={showKey[apiConfig.id] ? 'text' : 'password'}
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        placeholder="Entrez votre clé API..."
                        className="font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(apiConfig.id)}
                      >
                        {showKey[apiConfig.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={() => saveKey(apiConfig.id)}
                        disabled={isSaving || !newKeyValue}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingKey(null);
                          setNewKeyValue('');
                        }}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        type="password"
                        value={apiConfig.key || ''}
                        readOnly
                        placeholder="Non configuré"
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => startEditing(apiConfig.id, apiConfig.key)}
                      >
                        {apiConfig.key ? 'Modifier' : 'Configurer'}
                      </Button>
                      {apiConfig.key && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => testConnection(apiConfig.id)}
                            disabled={testingApi === apiConfig.id}
                          >
                            {testingApi === apiConfig.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Tester'
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setRotatingApi(apiConfig.id);
                              setShowRotateDialog(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Quota & Stats */}
              {apiConfig.status === 'connected' && apiConfig.quotaLimit && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Utilisation du quota</span>
                    </div>
                    <span className="text-sm font-medium">
                      {apiConfig.quotaUsed?.toLocaleString()} / {apiConfig.quotaLimit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={(apiConfig.quotaUsed || 0) / apiConfig.quotaLimit * 100}
                    className={cn(
                      (apiConfig.quotaUsed || 0) / apiConfig.quotaLimit > 0.9 && '[&>div]:bg-red-500',
                      (apiConfig.quotaUsed || 0) / apiConfig.quotaLimit > 0.7 && (apiConfig.quotaUsed || 0) / apiConfig.quotaLimit <= 0.9 && '[&>div]:bg-yellow-500'
                    )}
                  />
                  {(apiConfig.quotaUsed || 0) / apiConfig.quotaLimit > 0.9 && (
                    <p className="text-xs text-red-600 mt-2">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Quota presque atteint
                    </p>
                  )}
                </div>
              )}

              {apiConfig.status === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <XCircle className="h-4 w-4 inline mr-1" />
                    Erreur de connexion. Vérifiez votre clé API.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Résumé des APIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {apis.filter(a => a.status === 'connected').length}
              </p>
              <p className="text-sm text-green-700">Connectées</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {apis.filter(a => a.status === 'error').length}
              </p>
              <p className="text-sm text-red-700">En erreur</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {apis.filter(a => a.status === 'not_configured').length}
              </p>
              <p className="text-sm text-gray-700">Non configurées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rotate Key Dialog */}
      <AlertDialog open={showRotateDialog} onOpenChange={setShowRotateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la clé API ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'ancienne clé sera supprimée. Vous devrez entrer une nouvelle clé pour reconnecter le service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={rotateKey}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
