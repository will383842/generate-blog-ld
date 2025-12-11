/**
 * Schema Markup Page
 * File 323 - Manage structured data templates and generation
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileCode,
  ArrowLeft,
  Plus,
  Search,
  Wand2,
  Check,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useSchemaTemplates, useGenerateSchema } from '@/hooks/useSeo';
import { SchemaMarkupEditor } from '@/components/seo/SchemaMarkupEditor';
import { SCHEMA_TYPES, SchemaType } from '@/types/seo';
import { cn } from '@/lib/utils';

interface ArticleWithoutSchema {
  id: number;
  title: string;
  platform: string;
}

export default function SchemaPage() {
  const { t } = useTranslation();

  // State
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedArticleId, setSelectedArticleId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkType, setBulkType] = useState<SchemaType>('Article');

  // API hooks
  const { data: templates, isLoading: templatesLoading } = useSchemaTemplates();
  const generateSchema = useGenerateSchema();

  // Fetch articles without schema
  const { data: articlesWithoutSchema = [], isLoading: articlesLoading } = useQuery<ArticleWithoutSchema[]>({
    queryKey: ['seo', 'articles-without-schema'],
    queryFn: async () => {
      const res = await fetch('/api/admin/seo/articles-without-schema');
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    },
  });

  // Fetch schema stats
  const { data: schemaStats } = useQuery({
    queryKey: ['seo', 'schema-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/seo/schema-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const isLoading = templatesLoading || articlesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/seo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCode className="h-6 w-6" />
              Schema Markup
            </h1>
            <p className="text-muted-foreground">
              Gérez les données structurées pour le SEO
            </p>
          </div>
        </div>
        <Button onClick={() => setShowBulkDialog(true)}>
          <Wand2 className="h-4 w-4 mr-2" />
          Génération bulk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Templates</p>
            <p className="text-2xl font-bold">{templates?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Articles avec schema</p>
            <p className="text-2xl font-bold text-green-600">{schemaStats?.withSchema || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Sans schema</p>
            <p className="text-2xl font-bold text-yellow-600">{articlesWithoutSchema.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Erreurs validation</p>
            <p className="text-2xl font-bold text-red-600">{schemaStats?.errors || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor">
            <FileCode className="h-4 w-4 mr-2" />
            Éditeur
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Plus className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="missing">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Sans schema ({articlesWithoutSchema.length})
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="mt-6">
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un article..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={() => window.open('https://schema.org', '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Schema.org
                </Button>
              </div>
            </CardContent>
          </Card>

          <SchemaMarkupEditor
            articleId={selectedArticleId}
            onArticleChange={setSelectedArticleId}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates disponibles</CardTitle>
              <CardDescription>
                Modèles prédéfinis pour différents types de contenu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template: any) => (
                    <Card key={template.id} className="cursor-pointer hover:border-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.type}</p>
                          </div>
                          <Badge>{template.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun template disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Missing Schemas Tab */}
        <TabsContent value="missing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Articles sans schema</CardTitle>
              <CardDescription>
                Ces articles n'ont pas encore de données structurées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {articlesWithoutSchema.length > 0 ? (
                <div className="space-y-3">
                  {articlesWithoutSchema.map(article => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">{article.platform}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedArticleId(article.id);
                          setActiveTab('editor');
                        }}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Générer
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Tous les articles ont un schema !</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Generation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Génération en masse</DialogTitle>
            <DialogDescription>
              Générer automatiquement des schemas pour tous les articles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type de schema</label>
              <Select value={bulkType} onValueChange={(v) => setBulkType(v as SchemaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm">
                Cette action va générer les schemas pour {articlesWithoutSchema.length} articles.
                Cette opération peut prendre plusieurs minutes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => {
              // Trigger bulk generation
              setShowBulkDialog(false);
            }}>
              <Wand2 className="h-4 w-4 mr-2" />
              Générer ({articlesWithoutSchema.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
