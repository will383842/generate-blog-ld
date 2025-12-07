/**
 * Schema Markup Page
 * File 323 - Manage structured data templates and generation
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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

export default function SchemaPage() {
  const { t } = useTranslation();

  // State
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedArticleId, setSelectedArticleId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkType, setBulkType] = useState<SchemaType>('Article');

  // API hooks
  const { data: templates, isLoading } = useSchemaTemplates();
  const generateSchema = useGenerateSchema();

  // Mock articles without schema (would come from API)
  const articlesWithoutSchema = [
    { id: 1, title: 'Article sans schema 1', platform: 'SOS-Expat' },
    { id: 2, title: 'Article sans schema 2', platform: 'Ulixai' },
    { id: 3, title: 'Article sans schema 3', platform: 'SOS-Expat' },
  ];

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
            <p className="text-2xl font-bold text-green-600">1,245</p>
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
            <p className="text-2xl font-bold text-red-600">2</p>
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
                <Button variant="outline">
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>

          <SchemaMarkupEditor articleId={selectedArticleId} />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCHEMA_TYPES.map(type => {
              const template = templates?.find(t => t.type === type.value);
              return (
                <Card key={type.value} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{type.label}</CardTitle>
                      {template?.isDefault && (
                        <Badge variant="secondary">Par défaut</Badge>
                      )}
                    </div>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Champs requis : {template?.requiredFields.length || 0}</p>
                      <p>Champs optionnels : {template?.optionalFields.length || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(
                          `https://schema.org/${type.value}`,
                          '_blank'
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Missing Schema Tab */}
        <TabsContent value="missing" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Articles sans schema markup</CardTitle>
                <Button size="sm" onClick={() => setShowBulkDialog(true)}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Générer pour tous
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {articlesWithoutSchema.map(article => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <Badge variant="outline" className="mt-1">{article.platform}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedArticleId(article.id);
                            setActiveTab('editor');
                          }}
                        >
                          Éditer
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => generateSchema.mutate({
                            articleId: article.id,
                            type: 'Article',
                          })}
                          disabled={generateSchema.isPending}
                        >
                          {generateSchema.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Generate Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Génération bulk de schema</DialogTitle>
            <DialogDescription>
              Générez automatiquement les données structurées pour tous les articles sans schema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type de schema par défaut</label>
              <Select value={bulkType} onValueChange={(v) => setBulkType(v as SchemaType)}>
                <SelectTrigger className="mt-1">
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
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Attention</p>
                  <p>Cette action va générer les schemas pour {articlesWithoutSchema.length} articles. 
                  Vérifiez les résultats après génération.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowBulkDialog(false)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Générer ({articlesWithoutSchema.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
