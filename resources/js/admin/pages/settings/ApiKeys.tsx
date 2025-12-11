/**
 * API Keys Settings Page
 * Manage API keys with .env sync functionality
 * NEW: Sync .env → Database for centralized management
 */

import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, Eye, EyeOff, Copy, Plus, Trash2, Check, AlertCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/Alert';

interface ApiKey {
  id: number;
  name: string;
  provider: string;
  key: string;
  is_active: boolean;
  synced_from_env: boolean;
  env_key_name?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

interface EnvKey {
  name: string;
  value: string;
  exists_in_db: boolean;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [envKeys, setEnvKeys] = useState<EnvKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showKeys, setShowKeys] = useState<{ [key: number]: boolean }>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    fetchApiKeys();
    fetchEnvKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setApiKeys(data.data || data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setApiKeys(getMockApiKeys());
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys/env');
      if (!response.ok) throw new Error('Failed to fetch env keys');
      
      const data = await response.json();
      setEnvKeys(data.data || []);
    } catch (error) {
      console.error('Error fetching env keys:', error);
      setEnvKeys(getMockEnvKeys());
    }
  };

  const getMockApiKeys = (): ApiKey[] => [
    {
      id: 1,
      name: 'OpenAI API Key',
      provider: 'OpenAI',
      key: 'sk-proj-abc123xyz...',
      is_active: true,
      synced_from_env: true,
      env_key_name: 'OPENAI_API_KEY',
      last_used_at: '2024-12-10T14:30:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-12-10T14:30:00Z',
    },
    {
      id: 2,
      name: 'Perplexity API Key',
      provider: 'Perplexity',
      key: 'pplx-abc123xyz...',
      is_active: true,
      synced_from_env: true,
      env_key_name: 'PERPLEXITY_API_KEY',
      last_used_at: '2024-12-10T12:15:00Z',
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-12-10T12:15:00Z',
    },
    {
      id: 3,
      name: 'DALL-E API Key',
      provider: 'OpenAI',
      key: 'sk-dalle-abc123...',
      is_active: false,
      synced_from_env: false,
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-12-01T10:00:00Z',
    },
  ];

  const getMockEnvKeys = (): EnvKey[] => [
    {
      name: 'OPENAI_API_KEY',
      value: 'sk-proj-abc123xyz...',
      exists_in_db: true,
    },
    {
      name: 'PERPLEXITY_API_KEY',
      value: 'pplx-abc123xyz...',
      exists_in_db: true,
    },
    {
      name: 'GOOGLE_VISION_API_KEY',
      value: 'AIza-abc123xyz...',
      exists_in_db: false,
    },
    {
      name: 'STRIPE_SECRET_KEY',
      value: 'sk_live_abc123...',
      exists_in_db: false,
    },
  ];

  const handleSyncFromEnv = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/api-keys/sync-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to sync');

      const result = await response.json();
      
      toast({
        title: 'Synchronisation réussie',
        description: `${result.synced_count || 0} clés synchronisées depuis .env`,
      });

      fetchApiKeys();
      fetchEnvKeys();
    } catch (error) {
      console.error('Error syncing env keys:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser les clés',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingleKey = async (envKey: EnvKey) => {
    try {
      const response = await fetch('/api/admin/api-keys/sync-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          env_key_name: envKey.name,
          key_value: envKey.value,
        }),
      });

      if (!response.ok) throw new Error('Failed to sync single key');

      toast({ title: `${envKey.name} synchronisée` });
      fetchApiKeys();
      fetchEnvKeys();
    } catch (error) {
      console.error('Error syncing single key:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser cette clé',
        variant: 'destructive',
      });
    }
  };

  const toggleShowKey = (keyId: number) => {
    setShowKeys({ ...showKeys, [keyId]: !showKeys[keyId] });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Clé copiée' });
  };

  const maskKey = (key: string) => {
    if (key.length <= 10) return '***';
    return key.substring(0, 10) + '...' + key.substring(key.length - 4);
  };

  const handleSaveKey = async () => {
    if (!selectedKey) return;

    try {
      const method = selectedKey.id ? 'PUT' : 'POST';
      const url = selectedKey.id
        ? `/api/admin/api-keys/${selectedKey.id}`
        : '/api/admin/api-keys';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedKey),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast({ title: 'Clé API enregistrée' });
      setEditDialogOpen(false);
      setSelectedKey(null);
      fetchApiKeys();
    } catch (error) {
      console.error('Error saving key:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la clé',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé ?')) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Clé supprimée' });
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la clé',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6" />
            Clés API
          </h1>
          <p className="text-muted-foreground">
            Gérez vos clés API et synchronisez avec .env
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFromEnv} disabled={syncing}>
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Sync depuis .env
          </Button>
          <Button onClick={() => {
            setSelectedKey({
              id: 0,
              name: '',
              provider: '',
              key: '',
              is_active: true,
              synced_from_env: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setEditDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle clé
          </Button>
        </div>
      </div>

      {/* Sync Alert */}
      {envKeys.some(k => !k.exists_in_db) && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Clés .env non synchronisées</AlertTitle>
          <AlertDescription>
            {envKeys.filter(k => !k.exists_in_db).length} clés trouvées dans .env mais absentes de la base de données.
            Cliquez sur "Sync depuis .env" pour les ajouter.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{apiKeys.length}</div>
              <div className="text-sm text-muted-foreground">Total clés</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {apiKeys.filter(k => k.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Actives</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {apiKeys.filter(k => k.synced_from_env).length}
              </div>
              <div className="text-sm text-muted-foreground">Depuis .env</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{envKeys.length}</div>
              <div className="text-sm text-muted-foreground">Clés .env</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Database Keys */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clés en base de données</CardTitle>
              <CardDescription>Clés API stockées et utilisées par l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {key.name}
                        {key.synced_from_env && (
                          <Badge variant="outline" className="text-xs">
                            <Database className="w-3 h-3 mr-1" />
                            .env
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{key.provider}</div>
                    </div>
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono">
                      {showKeys[key.id] ? key.key : maskKey(key.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShowKey(key.id)}
                    >
                      {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(key.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  {key.env_key_name && (
                    <div className="text-xs text-muted-foreground">
                      Variable .env: {key.env_key_name}
                    </div>
                  )}

                  {key.last_used_at && (
                    <div className="text-xs text-muted-foreground">
                      Dernière utilisation: {new Date(key.last_used_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* .env Keys */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clés dans .env</CardTitle>
              <CardDescription>Variables d'environnement détectées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {envKeys.map((envKey, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg space-y-2 ${
                    !envKey.exists_in_db ? 'border-orange-300 bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="font-medium font-mono text-sm">{envKey.name}</div>
                    {envKey.exists_in_db ? (
                      <Badge variant="default" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Synchronisée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-orange-300">
                        Non synchronisée
                      </Badge>
                    )}
                  </div>

                  <code className="block text-xs bg-muted px-2 py-1 rounded font-mono truncate">
                    {maskKey(envKey.value)}
                  </code>

                  {!envKey.exists_in_db && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSyncSingleKey(envKey)}
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Synchroniser vers BDD
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedKey?.id ? 'Modifier' : 'Nouvelle'} clé API
            </DialogTitle>
            <DialogDescription>
              Configurez une clé API pour l'application
            </DialogDescription>
          </DialogHeader>

          {selectedKey && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={selectedKey.name}
                  onChange={(e) => setSelectedKey({
                    ...selectedKey,
                    name: e.target.value,
                  })}
                  placeholder="ex: OpenAI API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>Provider</Label>
                <Input
                  value={selectedKey.provider}
                  onChange={(e) => setSelectedKey({
                    ...selectedKey,
                    provider: e.target.value,
                  })}
                  placeholder="ex: OpenAI, Perplexity, Google"
                />
              </div>

              <div className="space-y-2">
                <Label>Clé API</Label>
                <Input
                  type="password"
                  value={selectedKey.key}
                  onChange={(e) => setSelectedKey({
                    ...selectedKey,
                    key: e.target.value,
                  })}
                  placeholder="sk-..."
                />
              </div>

              <div className="space-y-2">
                <Label>Nom variable .env (optionnel)</Label>
                <Input
                  value={selectedKey.env_key_name || ''}
                  onChange={(e) => setSelectedKey({
                    ...selectedKey,
                    env_key_name: e.target.value,
                  })}
                  placeholder="ex: OPENAI_API_KEY"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveKey}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
