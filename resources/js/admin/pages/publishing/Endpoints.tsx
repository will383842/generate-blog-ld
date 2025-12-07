/**
 * Publishing Endpoints Page
 * Manage API endpoints for content publication
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TestTube,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { usePublishing } from '@/hooks/usePublishing';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Endpoint {
  id: number;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  auth_type: 'none' | 'api_key' | 'bearer' | 'basic';
  auth_header?: string;
  auth_value?: string;
  platform_id: number;
  platform_name: string;
  is_active: boolean;
  last_test_at?: string;
  last_test_status?: 'success' | 'failed';
  last_test_message?: string;
  created_at: string;
}

const AUTH_TYPES = {
  none: { label: 'Aucune', icon: Globe },
  api_key: { label: 'API Key', icon: Lock },
  bearer: { label: 'Bearer Token', icon: Lock },
  basic: { label: 'Basic Auth', icon: Lock },
};

const METHODS = ['POST', 'PUT', 'PATCH'];

export default function PublishingEndpoints() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [testingId, setTestingId] = useState<number | null>(null);

  const {
    endpoints,
    platforms,
    isLoading,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    testEndpoint,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
  } = usePublishing();

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST' as 'POST' | 'PUT' | 'PATCH',
    auth_type: 'none' as 'none' | 'api_key' | 'bearer' | 'basic',
    auth_header: '',
    auth_value: '',
    platform_id: '',
  });

  const handleOpenDialog = (endpoint?: Endpoint) => {
    if (endpoint) {
      setEditingEndpoint(endpoint);
      setFormData({
        name: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        auth_type: endpoint.auth_type,
        auth_header: endpoint.auth_header || '',
        auth_value: endpoint.auth_value || '',
        platform_id: String(endpoint.platform_id),
      });
    } else {
      setEditingEndpoint(null);
      setFormData({
        name: '',
        url: '',
        method: 'POST',
        auth_type: 'none',
        auth_header: '',
        auth_value: '',
        platform_id: '',
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      platform_id: Number(formData.platform_id),
    };

    if (editingEndpoint) {
      await updateEndpoint({ id: editingEndpoint.id, ...data });
    } else {
      await createEndpoint(data);
    }

    setShowDialog(false);
    refetch();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Etes-vous sur de vouloir supprimer cet endpoint ?')) {
      await deleteEndpoint(id);
      refetch();
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await testEndpoint(id);
      refetch();
    } finally {
      setTestingId(null);
    }
  };

  const toggleShowSecret = (id: number) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Endpoints de publication
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurez les APIs pour publier vos contenus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel endpoint
          </Button>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="grid gap-4">
        {endpoints && endpoints.length > 0 ? (
          endpoints.map((endpoint: Endpoint) => (
            <Card key={endpoint.id} className={!endpoint.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{endpoint.name}</h3>
                      <Badge variant="outline">{endpoint.method}</Badge>
                      <Badge
                        variant={endpoint.is_active ? 'default' : 'secondary'}
                      >
                        {endpoint.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                      {endpoint.last_test_status && (
                        <Badge
                          variant={endpoint.last_test_status === 'success' ? 'default' : 'destructive'}
                          className={endpoint.last_test_status === 'success' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {endpoint.last_test_status === 'success' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {endpoint.last_test_status === 'success' ? 'OK' : 'Echec'}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">URL:</span>
                        <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                          {endpoint.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(endpoint.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Plateforme:</span>
                        <span>{endpoint.platform_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Auth:</span>
                        <span className="flex items-center gap-1">
                          {React.createElement(AUTH_TYPES[endpoint.auth_type].icon, { className: 'h-3 w-3' })}
                          {AUTH_TYPES[endpoint.auth_type].label}
                        </span>
                        {endpoint.auth_value && (
                          <>
                            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                              {showSecrets[endpoint.id] ? endpoint.auth_value : '""""""""'}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleShowSecret(endpoint.id)}
                            >
                              {showSecrets[endpoint.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>

                      {endpoint.last_test_message && (
                        <div className="flex items-center gap-2 mt-2">
                          {endpoint.last_test_status === 'failed' && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={endpoint.last_test_status === 'failed' ? 'text-red-600' : 'text-muted-foreground'}>
                            {endpoint.last_test_message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(endpoint.id)}
                      disabled={testingId === endpoint.id}
                    >
                      {testingId === endpoint.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      <span className="ml-2">Tester</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(endpoint)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(endpoint.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Aucun endpoint configure</h3>
              <p className="text-muted-foreground mb-4">
                Configurez un endpoint pour commencer a publier vos contenus
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Creer un endpoint
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEndpoint ? 'Modifier l\'endpoint' : 'Nouvel endpoint'}
            </DialogTitle>
            <DialogDescription>
              Configurez les parametres de l'API de publication
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon endpoint WordPress"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plateforme</Label>
              <Select
                value={formData.platform_id}
                onValueChange={(value) => setFormData({ ...formData, platform_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez une plateforme" />
                </SelectTrigger>
                <SelectContent>
                  {platforms?.map((platform: { id: number; name: string }) => (
                    <SelectItem key={platform.id} value={String(platform.id)}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.example.com/posts"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Methode</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData({ ...formData, method: value as 'POST' | 'PUT' | 'PATCH' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth_type">Type d'authentification</Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value) => setFormData({ ...formData, auth_type: value as 'none' | 'api_key' | 'bearer' | 'basic' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AUTH_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.auth_type !== 'none' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="auth_header">Header d'authentification</Label>
                  <Input
                    id="auth_header"
                    value={formData.auth_header}
                    onChange={(e) => setFormData({ ...formData, auth_header: e.target.value })}
                    placeholder={formData.auth_type === 'bearer' ? 'Authorization' : 'X-API-Key'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth_value">Valeur / Token</Label>
                  <Input
                    id="auth_value"
                    type="password"
                    value={formData.auth_value}
                    onChange={(e) => setFormData({ ...formData, auth_value: e.target.value })}
                    placeholder="Votre cle API ou token"
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEndpoint ? 'Enregistrer' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
