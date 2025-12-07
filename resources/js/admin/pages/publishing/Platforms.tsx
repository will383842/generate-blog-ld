/**
 * Publishing Platforms Page
 * Manage platforms for content publication
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  Server,
  BarChart3,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { usePlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform } from '@/hooks/usePlatform';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Platform {
  id: number;
  name: string;
  slug: string;
  domain: string;
  logoUrl?: string;
  isActive: boolean;
  languages: string[];
  defaultLanguage: string;
  stats: {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
  };
  createdAt: string;
}

export default function PublishingPlatforms() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);

  const { data: platforms, isLoading, refetch } = usePlatforms();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    languages: 'fr',
    defaultLanguage: 'fr',
    isActive: true,
  });

  const handleOpenDialog = (platform?: Platform) => {
    if (platform) {
      setEditingPlatform(platform);
      setFormData({
        name: platform.name,
        slug: platform.slug,
        domain: platform.domain,
        languages: platform.languages.join(', '),
        defaultLanguage: platform.defaultLanguage,
        isActive: platform.isActive,
      });
    } else {
      setEditingPlatform(null);
      setFormData({
        name: '',
        slug: '',
        domain: '',
        languages: 'fr',
        defaultLanguage: 'fr',
        isActive: true,
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      domain: formData.domain,
      languages: formData.languages.split(',').map(l => l.trim()),
      defaultLanguage: formData.defaultLanguage,
      isActive: formData.isActive,
    };

    if (editingPlatform) {
      await updatePlatform.mutateAsync({ id: editingPlatform.id, ...data });
    } else {
      await createPlatform.mutateAsync(data);
    }

    setShowDialog(false);
    refetch();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Etes-vous sur de vouloir supprimer cette plateforme ? Cette action est irreversible.')) {
      await deletePlatform.mutateAsync(id);
      refetch();
    }
  };

  const handleToggleActive = async (platform: Platform) => {
    await updatePlatform.mutateAsync({
      id: platform.id,
      isActive: !platform.isActive,
    });
    refetch();
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
            <Globe className="h-6 w-6" />
            Plateformes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerez les plateformes de publication de vos contenus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle plateforme
          </Button>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms && platforms.length > 0 ? (
          platforms.map((platform: Platform) => (
            <Card
              key={platform.id}
              className={`relative ${!platform.isActive ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {platform.logoUrl ? (
                      <img
                        src={platform.logoUrl}
                        alt={platform.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{platform.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {platform.domain}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(platform)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/publishing/endpoints?platform=${platform.id}`}>
                          <Server className="h-4 w-4 mr-2" />
                          Endpoints
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`https://${platform.domain}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visiter le site
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(platform.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={platform.isActive ? 'default' : 'secondary'}
                      className={platform.isActive ? 'bg-green-100 text-green-800' : ''}
                    >
                      {platform.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </>
                      )}
                    </Badge>
                    <Switch
                      checked={platform.isActive}
                      onCheckedChange={() => handleToggleActive(platform)}
                    />
                  </div>
                </div>

                {/* Languages */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Langues</span>
                  <div className="flex gap-1">
                    {platform.languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className={lang === platform.defaultLanguage ? 'border-primary' : ''}
                      >
                        {lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{platform.stats?.totalArticles || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">
                      {platform.stats?.publishedArticles || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Publies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-yellow-600">
                      {platform.stats?.draftArticles || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Brouillons</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/content/articles?platform=${platform.id}`}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Articles
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/publishing/queue?platform=${platform.id}`}>
                      <Server className="h-4 w-4 mr-1" />
                      Queue
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Aucune plateforme configuree</h3>
              <p className="text-muted-foreground mb-4">
                Creez une plateforme pour commencer a publier vos contenus
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Creer une plateforme
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
              {editingPlatform ? 'Modifier la plateforme' : 'Nouvelle plateforme'}
            </DialogTitle>
            <DialogDescription>
              Configurez les parametres de la plateforme
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la plateforme</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon Blog"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identifiant unique)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="mon-blog"
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour generer automatiquement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domaine</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="www.example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="languages">Langues (separees par des virgules)</Label>
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="fr, en, es"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Langue par defaut</Label>
                <Input
                  id="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                  placeholder="fr"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Plateforme active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createPlatform.isPending || updatePlatform.isPending}
              >
                {(createPlatform.isPending || updatePlatform.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingPlatform ? 'Enregistrer' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
