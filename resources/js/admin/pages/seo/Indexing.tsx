/**
 * SEO Indexing Page
 * File 327 - Search engine indexing management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Globe,
  ArrowLeft,
  RefreshCw,
  Download,
  Plus,
  Search,
  Check,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import {
  useIndexingQueue,
  useIndexingStats,
  useNotIndexedArticles,
  useIndexingHistory,
  useSubmitIndexing,
  useSubmitBatchIndexing,
  useRetryIndexing,
  useCancelIndexing,
  useSubmitAllNotIndexed,
} from '@/hooks/useIndexing';
import { IndexingStats } from '@/components/seo/IndexingStats';
import { IndexingQueue } from '@/components/seo/IndexingQueue';
import { NotIndexedArticles } from '@/components/seo/NotIndexedArticles';
import { IndexingQueueFilters, NotIndexedFilters } from '@/types/seo';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SeoIndexingPage() {
  const { t } = useTranslation();

  // State
  const [activeTab, setActiveTab] = useState('queue');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [engines, setEngines] = useState({ google: true, indexnow: true, bing: false });
  const [queueFilters, setQueueFilters] = useState<IndexingQueueFilters>({ per_page: 20 });
  const [notIndexedFilters, setNotIndexedFilters] = useState<NotIndexedFilters>({ per_page: 20 });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // API hooks
  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useIndexingQueue(queueFilters);
  const { data: stats, refetch: refetchStats } = useIndexingStats();
  const { data: notIndexedData, isLoading: notIndexedLoading } = useNotIndexedArticles(notIndexedFilters);
  const { data: historyData } = useIndexingHistory({ per_page: 50 });
  
  const submitIndexing = useSubmitIndexing();
  const submitBatch = useSubmitBatchIndexing();
  const retryIndexing = useRetryIndexing();
  const cancelIndexing = useCancelIndexing();
  const submitAllNotIndexed = useSubmitAllNotIndexed();

  // Auto refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refetchQueue();
      refetchStats();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchQueue, refetchStats]);

  // Handle manual refresh
  const handleRefresh = () => {
    refetchQueue();
    refetchStats();
    setLastRefresh(new Date());
  };

  // Handle manual submit
  const handleManualSubmit = () => {
    if (selectedArticles.length === 0) return;
    submitBatch.mutate(
      { articleIds: selectedArticles, engines },
      {
        onSuccess: () => {
          setShowSubmitDialog(false);
          setSelectedArticles([]);
        },
      }
    );
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      'id,article,url,status,google,indexnow,bing,attempts,last_attempt',
      ...(queueData?.data?.map(item =>
        `${item.id},"${item.articleTitle}","${item.url}",${item.status},${item.googleStatus},${item.indexnowStatus},${item.bingStatus},${item.attempts},${item.lastAttemptAt || ''}`
      ) || []),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indexing-queue.csv';
    a.click();
  };

  // Mock search results for manual submit
  const mockSearchResults = [
    { id: 1, title: 'Guide expatriation France', url: 'https://example.com/guide-france' },
    { id: 2, title: 'Visa travail Allemagne', url: 'https://example.com/visa-allemagne' },
    { id: 3, title: 'Démarches administratives UK', url: 'https://example.com/demarches-uk' },
    { id: 4, title: 'Assurance santé expatrié', url: 'https://example.com/assurance-sante' },
    { id: 5, title: 'Fiscalité internationale', url: 'https://example.com/fiscalite' },
  ].filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/seo">SEO</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Indexation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-bold flex items-center gap-2 mt-1">
              <Globe className="h-6 w-6" />
              Indexation SEO
            </h1>
            <p className="text-muted-foreground">
              Soumission aux moteurs de recherche
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            <Clock className="h-4 w-4" />
            <span>
              {formatDistanceToNow(lastRefresh, { addSuffix: true, locale: fr })}
            </span>
          </div>
          <Button variant="outline" onClick={() => setShowSubmitDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Soumettre manuellement
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <IndexingStats
        stats={stats}
        onSubmitAll={() => submitAllNotIndexed.mutate({ google: true, indexnow: true })}
        isLoading={submitAllNotIndexed.isPending}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">
            File d'attente
            {stats?.pending ? (
              <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="not-indexed">
            Non indexés
            {stats?.notIndexedCount ? (
              <Badge variant="destructive" className="ml-2">{stats.notIndexedCount}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-6">
          <IndexingQueue
            data={queueData}
            filters={queueFilters}
            onFilterChange={setQueueFilters}
            onRetry={(id) => retryIndexing.mutate(id)}
            onCancel={(id) => cancelIndexing.mutate(id)}
            onSubmitSelected={(ids) => submitBatch.mutate({ articleIds: ids, engines })}
            isLoading={queueLoading}
          />
        </TabsContent>

        {/* Not Indexed Tab */}
        <TabsContent value="not-indexed" className="mt-6">
          <NotIndexedArticles
            data={notIndexedData}
            filters={notIndexedFilters}
            onFilterChange={setNotIndexedFilters}
            onSubmit={(ids) => submitBatch.mutate({ articleIds: ids, engines })}
            onSubmitAll={() => submitAllNotIndexed.mutate({ google: true, indexnow: true })}
            isLoading={notIndexedLoading}
            isSubmitting={submitBatch.isPending || submitAllNotIndexed.isPending}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des indexations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Google</TableHead>
                      <TableHead className="text-center">IndexNow</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData?.data?.slice(0, 30).map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.articleTitle.substring(0, 40)}...
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 rounded truncate max-w-[200px] block">
                            {item.url}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>
                            {item.status === 'completed' ? 'Terminé' : 'Échoué'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.googleStatus === 'indexed' ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.indexnowStatus === 'accepted' ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Soumission manuelle</DialogTitle>
            <DialogDescription>
              Recherchez et sélectionnez les articles à soumettre pour indexation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            <ScrollArea className="h-[200px] border rounded-lg p-2">
              {mockSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {mockSearchResults.map(article => (
                    <div
                      key={article.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted',
                        selectedArticles.includes(article.id) && 'bg-primary/10'
                      )}
                      onClick={() => {
                        if (selectedArticles.includes(article.id)) {
                          setSelectedArticles(selectedArticles.filter(id => id !== article.id));
                        } else {
                          setSelectedArticles([...selectedArticles, article.id]);
                        }
                      }}
                    >
                      <Checkbox checked={selectedArticles.includes(article.id)} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{article.title}</p>
                        <p className="text-xs text-muted-foreground">{article.url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Aucun résultat' : 'Tapez pour rechercher'}
                </div>
              )}
            </ScrollArea>

            {/* Selected Count */}
            {selectedArticles.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge>{selectedArticles.length} sélectionné(s)</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedArticles([])}
                >
                  Désélectionner tout
                </Button>
              </div>
            )}

            {/* Engine Selection */}
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block">Moteurs de recherche</Label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={engines.google}
                    onCheckedChange={(checked) => setEngines({ ...engines, google: !!checked })}
                  />
                  <span className="text-sm">Google</span>
                  <Badge variant="outline" className="text-xs">API</Badge>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={engines.indexnow}
                    onCheckedChange={(checked) => setEngines({ ...engines, indexnow: !!checked })}
                  />
                  <span className="text-sm">IndexNow</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">Illimité</Badge>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={engines.bing}
                    onCheckedChange={(checked) => setEngines({ ...engines, bing: !!checked })}
                  />
                  <span className="text-sm">Bing</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleManualSubmit}
              disabled={selectedArticles.length === 0 || submitBatch.isPending}
            >
              {submitBatch.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Soumettre ({selectedArticles.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
