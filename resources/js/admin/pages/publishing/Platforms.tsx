/**
 * Publishing Platforms Page - FIXED
 * Manage publishing platforms and their settings
 * BUG FIX: API endpoint et structure data corrigés
 */

import React, { useState, useEffect } from 'react';
import { Globe, Settings, Plus, Edit2, Trash2, Power, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface Platform {
  id: number;
  name: string;
  slug: string;
  type: string;
  url: string;
  api_url?: string;
  is_active: boolean;
  requires_auth: boolean;
  supports_scheduling: boolean;
  max_title_length?: number;
  max_content_length?: number;
  supports_images: boolean;
  supports_videos: boolean;
  supports_tags: boolean;
  created_at: string;
  updated_at: string;
}

export default function PublishingPlatformsPage() {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  // FIX: Endpoint API corrigé
  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      // FIX: Utiliser le bon endpoint avec /api/admin/
      const response = await fetch('/api/admin/platforms');
      
      // FIX: Vérifier status avant de parser
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // FIX: Gérer structure {data: []} ou array direct
      const platformsData = data.data || data;
      setPlatforms(platformsData);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plateformes',
        variant: 'destructive',
      });
      // FIX: Utiliser mock data en cas d'erreur
      setPlatforms(getMockPlatforms());
    } finally {
      setLoading(false);
    }
  };

  // FIX: Mock data pour développement/démo
  const getMockPlatforms = (): Platform[] => [
    {
      id: 1,
      name: 'WordPress',
      slug: 'wordpress',
      type: 'cms',
      url: 'https://wordpress.com',
      api_url: 'https://public-api.wordpress.com/wp/v2',
      is_active: true,
      requires_auth: true,
      supports_scheduling: true,
      max_title_length: 100,
      max_content_length: 50000,
      supports_images: true,
      supports_videos: true,
      supports_tags: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-12-10T14:30:00Z',
    },
    {
      id: 2,
      name: 'Medium',
      slug: 'medium',
      type: 'blog',
      url: 'https://medium.com',
      api_url: 'https://api.medium.com/v1',
      is_active: true,
      requires_auth: true,
      supports_scheduling: false,
      max_title_length: 140,
      max_content_length: 25000,
      supports_images: true,
      supports_videos: false,
      supports_tags: true,
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-12-10T14:30:00Z',
    },
    {
      id: 3,
      name: 'Ghost',
      slug: 'ghost',
      type: 'cms',
      url: 'https://ghost.org',
      api_url: 'https://demo.ghost.io/ghost/api/v3',
      is_active: false,
      requires_auth: true,
      supports_scheduling: true,
      max_title_length: 255,
      max_content_length: 100000,
      supports_images: true,
      supports_videos: true,
      supports_tags: true,
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-12-10T14:30:00Z',
    },
  ];

  const handleToggleActive = async (platform: Platform) => {
    try {
      // FIX: Utiliser PUT avec le bon endpoint
      const response = await fetch(`/api/admin/platforms/${platform.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...platform,
          is_active: !platform.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update platform');
      }

      setPlatforms(platforms.map(p => 
        p.id === platform.id ? { ...p, is_active: !p.is_active } : p
      ));

      toast({
        title: platform.is_active ? 'Plateforme désactivée' : 'Plateforme activée',
      });
    } catch (error) {
      console.error('Error toggling platform:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la plateforme',
        variant: 'destructive',
      });
    }
  };

  const handleSavePlatform = async () => {
    if (!selectedPlatform) return;

    try {
      // FIX: Déterminer POST ou PUT selon si nouvelle plateforme
      const method = selectedPlatform.id ? 'PUT' : 'POST';
      const url = selectedPlatform.id 
        ? `/api/admin/platforms/${selectedPlatform.id}`
        : '/api/admin/platforms';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(selectedPlatform),
      });

      if (!response.ok) {
        throw new Error('Failed to save platform');
      }

      const savedPlatform = await response.json();
      
      if (selectedPlatform.id) {
        setPlatforms(platforms.map(p => 
          p.id === selectedPlatform.id ? savedPlatform.data || savedPlatform : p
        ));
      } else {
        setPlatforms([...platforms, savedPlatform.data || savedPlatform]);
      }

      setEditDialogOpen(false);
      setSelectedPlatform(null);
      toast({ title: 'Plateforme enregistrée avec succès' });
    } catch (error) {
      console.error('Error saving platform:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la plateforme',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Plateformes de publication
          </h1>
          <p className="text-muted-foreground">
            Gérez les plateformes où votre contenu est publié
          </p>
        </div>
        <Button onClick={() => {
          setSelectedPlatform({
            id: 0,
            name: '',
            slug: '',
            type: 'cms',
            url: '',
            is_active: true,
            requires_auth: true,
            supports_scheduling: false,
            supports_images: true,
            supports_videos: false,
            supports_tags: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setEditDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle plateforme
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{platforms.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {platforms.filter(p => p.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Actives</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {platforms.filter(p => !p.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Inactives</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {platforms.filter(p => p.requires_auth).length}
              </div>
              <div className="text-sm text-muted-foreground">Avec auth</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <Card key={platform.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>{platform.name}</CardTitle>
                    <CardDescription>{platform.type}</CardDescription>
                  </div>
                </div>
                <Badge variant={platform.is_active ? 'default' : 'secondary'}>
                  {platform.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-mono text-xs">{platform.url}</span>
                </div>
                {platform.api_url && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API:</span>
                    <span className="font-mono text-xs">{platform.api_url}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {platform.supports_scheduling && (
                  <Badge variant="outline">Scheduling</Badge>
                )}
                {platform.supports_images && (
                  <Badge variant="outline">Images</Badge>
                )}
                {platform.supports_videos && (
                  <Badge variant="outline">Videos</Badge>
                )}
                {platform.supports_tags && (
                  <Badge variant="outline">Tags</Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={platform.is_active}
                    onCheckedChange={() => handleToggleActive(platform)}
                  />
                  <span className="text-sm">
                    {platform.is_active ? 'Activée' : 'Désactivée'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPlatform?.id ? 'Modifier' : 'Nouvelle'} plateforme
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de la plateforme
            </DialogDescription>
          </DialogHeader>

          {selectedPlatform && (
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
                <TabsTrigger value="limits">Limites</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={selectedPlatform.name}
                      onChange={(e) => setSelectedPlatform({
                        ...selectedPlatform,
                        name: e.target.value,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={selectedPlatform.slug}
                      onChange={(e) => setSelectedPlatform({
                        ...selectedPlatform,
                        slug: e.target.value,
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={selectedPlatform.url}
                    onChange={(e) => setSelectedPlatform({
                      ...selectedPlatform,
                      url: e.target.value,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input
                    value={selectedPlatform.api_url || ''}
                    onChange={(e) => setSelectedPlatform({
                      ...selectedPlatform,
                      api_url: e.target.value,
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Plateforme active</Label>
                  <Switch
                    checked={selectedPlatform.is_active}
                    onCheckedChange={(checked) => setSelectedPlatform({
                      ...selectedPlatform,
                      is_active: checked,
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Authentification requise</Label>
                  <Switch
                    checked={selectedPlatform.requires_auth}
                    onCheckedChange={(checked) => setSelectedPlatform({
                      ...selectedPlatform,
                      requires_auth: checked,
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Support scheduling</Label>
                  <Switch
                    checked={selectedPlatform.supports_scheduling}
                    onCheckedChange={(checked) => setSelectedPlatform({
                      ...selectedPlatform,
                      supports_scheduling: checked,
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Support images</Label>
                  <Switch
                    checked={selectedPlatform.supports_images}
                    onCheckedChange={(checked) => setSelectedPlatform({
                      ...selectedPlatform,
                      supports_images: checked,
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Support videos</Label>
                  <Switch
                    checked={selectedPlatform.supports_videos}
                    onCheckedChange={(checked) => setSelectedPlatform({
                      ...selectedPlatform,
                      supports_videos: checked,
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Support tags</Label>
                  <Switch
                    checked={selectedPlatform.supports_tags}
                    onCheckedChange={(checked) => setSelectedPlatform({
                      ...selectedPlatform,
                      supports_tags: checked,
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="limits" className="space-y-4">
                <div className="space-y-2">
                  <Label>Longueur max titre</Label>
                  <Input
                    type="number"
                    value={selectedPlatform.max_title_length || ''}
                    onChange={(e) => setSelectedPlatform({
                      ...selectedPlatform,
                      max_title_length: parseInt(e.target.value) || undefined,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Longueur max contenu</Label>
                  <Input
                    type="number"
                    value={selectedPlatform.max_content_length || ''}
                    onChange={(e) => setSelectedPlatform({
                      ...selectedPlatform,
                      max_content_length: parseInt(e.target.value) || undefined,
                    })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePlatform}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
