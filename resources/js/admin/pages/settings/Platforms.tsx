/**
 * Platforms Page - FUSIONNÉE
 * Gestion complète des plateformes de publication
 * FUSION: settings/Platforms + publishing/Platforms
 */

import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Power,
  Check,
  X,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Shield,
  Clock,
  Image,
  Video,
  Tag,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { usePlatforms, useUpdatePlatform, useDeletePlatform } from '@/hooks/usePlatforms';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface Platform {
  id: number;
  name: string;
  slug: string;
  url: string;
  api_url?: string;
  is_active: boolean;
  requires_auth: boolean;
  supports_scheduling: boolean;
  supports_images: boolean;
  supports_videos: boolean;
  supports_tags: boolean;
  max_title_length?: number;
  max_content_length?: number;
  articlesCount?: number;
  countriesCount?: number;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PlatformsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  const { data, isLoading, refetch } = usePlatforms();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  const platforms = data?.data || [];

  const filteredPlatforms = platforms.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.url.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (platform: Platform) => {
    setSelectedPlatform(platform);
    setEditDialogOpen(true);
  };

  const handleDelete = (platform: Platform) => {
    setSelectedPlatform(platform);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (platform: Platform) => {
    try {
      await updatePlatform.mutateAsync({
        id: platform.id,
        data: { ...platform, is_active: !platform.is_active },
      });
      toast({
        title: platform.is_active ? 'Plateforme désactivée' : 'Plateforme activée',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la plateforme',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!selectedPlatform) return;

    try {
      await updatePlatform.mutateAsync({
        id: selectedPlatform.id,
        data: selectedPlatform,
      });
      toast({ title: 'Plateforme enregistrée avec succès' });
      setEditDialogOpen(false);
      setSelectedPlatform(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer la plateforme",
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedPlatform) return;

    try {
      await deletePlatform.mutateAsync(selectedPlatform.id);
      toast({ title: 'Plateforme supprimée' });
      setDeleteDialogOpen(false);
      setSelectedPlatform(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la plateforme',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gestion des Plateformes
          </h1>
          <p className="text-muted-foreground">
            Configuration des plateformes SOS-Expat, Ulixai et Ulysse.AI
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            onClick={() => {
              setSelectedPlatform({
                id: 0,
                name: '',
                slug: '',
                url: '',
                is_active: true,
                requires_auth: false,
                supports_scheduling: false,
                supports_images: true,
                supports_videos: false,
                supports_tags: true,
              });
              setEditDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Plateformes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plateforme</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Fonctionnalités</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlatforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell>
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-xs text-muted-foreground">{platform.slug}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {platform.url.replace('https://', '')}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>{platform.articlesCount?.toLocaleString() || 0}</TableCell>
                  <TableCell>{platform.countriesCount || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {platform.supports_images && (
                        <Badge variant="outline" className="text-xs">
                          <Image className="h-3 w-3 mr-1" />
                          Images
                        </Badge>
                      )}
                      {platform.supports_videos && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Vidéos
                        </Badge>
                      )}
                      {platform.supports_tags && (
                        <Badge variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          Tags
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={platform.is_active}
                        onCheckedChange={() => handleToggleActive(platform)}
                      />
                      <span className={cn(
                        'text-xs font-medium',
                        platform.is_active ? 'text-green-600' : 'text-gray-400'
                      )}>
                        {platform.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(platform)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(platform)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlatform?.id ? 'Modifier' : 'Ajouter'} une plateforme
            </DialogTitle>
            <DialogDescription>
              Configuration complète de la plateforme de publication
            </DialogDescription>
          </DialogHeader>

          {selectedPlatform && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Nom de la plateforme</Label>
                    <Input
                      value={selectedPlatform.name}
                      onChange={(e) =>
                        setSelectedPlatform({ ...selectedPlatform, name: e.target.value })
                      }
                      placeholder="SOS-Expat"
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={selectedPlatform.slug}
                      onChange={(e) =>
                        setSelectedPlatform({ ...selectedPlatform, slug: e.target.value })
                      }
                      placeholder="sos-expat"
                    />
                  </div>
                  <div>
                    <Label>URL principale</Label>
                    <div className="flex gap-2">
                      <Globe className="h-4 w-4 mt-3 text-muted-foreground" />
                      <Input
                        value={selectedPlatform.url}
                        onChange={(e) =>
                          setSelectedPlatform({ ...selectedPlatform, url: e.target.value })
                        }
                        placeholder="https://sos-expat.com"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Plateforme active</Label>
                      <p className="text-xs text-muted-foreground">
                        Autoriser la publication sur cette plateforme
                      </p>
                    </div>
                    <Switch
                      checked={selectedPlatform.is_active}
                      onCheckedChange={(checked) =>
                        setSelectedPlatform({ ...selectedPlatform, is_active: checked })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>URL de l'API</Label>
                    <Input
                      value={selectedPlatform.api_url || ''}
                      onChange={(e) =>
                        setSelectedPlatform({ ...selectedPlatform, api_url: e.target.value })
                      }
                      placeholder="https://api.sos-expat.com/v1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Authentification requise</Label>
                      <p className="text-xs text-muted-foreground">
                        Nécessite des credentials pour publier
                      </p>
                    </div>
                    <Switch
                      checked={selectedPlatform.requires_auth}
                      onCheckedChange={(checked) =>
                        setSelectedPlatform({ ...selectedPlatform, requires_auth: checked })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Longueur max du titre</Label>
                      <Input
                        type="number"
                        value={selectedPlatform.max_title_length || 100}
                        onChange={(e) =>
                          setSelectedPlatform({
                            ...selectedPlatform,
                            max_title_length: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Longueur max du contenu</Label>
                      <Input
                        type="number"
                        value={selectedPlatform.max_content_length || 50000}
                        onChange={(e) =>
                          setSelectedPlatform({
                            ...selectedPlatform,
                            max_content_length: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Support des images</Label>
                      <Switch
                        checked={selectedPlatform.supports_images}
                        onCheckedChange={(checked) =>
                          setSelectedPlatform({ ...selectedPlatform, supports_images: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Support des vidéos</Label>
                      <Switch
                        checked={selectedPlatform.supports_videos}
                        onCheckedChange={(checked) =>
                          setSelectedPlatform({ ...selectedPlatform, supports_videos: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Support des tags</Label>
                      <Switch
                        checked={selectedPlatform.supports_tags}
                        onCheckedChange={(checked) =>
                          setSelectedPlatform({ ...selectedPlatform, supports_tags: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Support de la planification</Label>
                      <Switch
                        checked={selectedPlatform.supports_scheduling}
                        onCheckedChange={(checked) =>
                          setSelectedPlatform({
                            ...selectedPlatform,
                            supports_scheduling: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la plateforme{' '}
              <strong>{selectedPlatform?.name}</strong> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
