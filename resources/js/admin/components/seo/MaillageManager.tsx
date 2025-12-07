/**
 * Maillage Manager Component
 * File 317 - Internal linking management with graph visualization
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link2,
  Plus,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Search,
  ExternalLink,
  Loader2,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  useMaillageLinks,
  useMaillageStats,
  useLinkOpportunities,
  useAddInternalLink,
  useDeleteInternalLink,
} from '@/hooks/useSeo';
import { cn } from '@/lib/utils';

interface MaillageManagerProps {
  compact?: boolean;
}

export function MaillageManager({ compact = false }: MaillageManagerProps) {
  const { t } = useTranslation();

  // State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLink, setNewLink] = useState({
    fromArticleId: 0,
    toArticleId: 0,
    anchorText: '',
    position: 'content',
  });
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  // API hooks
  const { data: linksData, isLoading } = useMaillageLinks();
  const { data: stats } = useMaillageStats();
  const { data: opportunities } = useLinkOpportunities();
  const addLink = useAddInternalLink();
  const deleteLink = useDeleteInternalLink();

  // Handle add link
  const handleAddLink = () => {
    addLink.mutate(newLink, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewLink({ fromArticleId: 0, toArticleId: 0, anchorText: '', position: 'content' });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Maillage interne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats?.totalLinks || 0}</p>
              <p className="text-xs text-muted-foreground">Liens</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.averageLinksPerPage?.toFixed(1) || 0}</p>
              <p className="text-xs text-muted-foreground">Moy/page</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats?.orphanPages || 0}</p>
              <p className="text-xs text-muted-foreground">Orphelines</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total liens</p>
                <p className="text-2xl font-bold">{stats?.totalLinks || 0}</p>
              </div>
              <Link2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moy. par page</p>
                <p className="text-2xl font-bold">{stats?.averageLinksPerPage?.toFixed(1) || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pages orphelines</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.orphanPages || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opportunités</p>
                <p className="text-2xl font-bold text-green-600">{opportunities?.length || 0}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="h-4 w-4" />
              Visualisation du maillage
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un lien
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Network className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Graphe interactif des liens internes</p>
              <p className="text-xs text-muted-foreground">(Intégration D3.js ou similar)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Linked Pages */}
      {stats?.topLinkedPages && stats.topLinkedPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pages les plus liées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topLinkedPages.slice(0, 5).map((page, idx) => (
                <div
                  key={page.articleId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{page.title}</span>
                  </div>
                  <Badge variant="secondary">{page.incomingLinks} liens entrants</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link Opportunities */}
      {opportunities && opportunities.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <Lightbulb className="h-4 w-4" />
              Opportunités de liens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {opportunities.map(opp => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{opp.fromArticleTitle}</span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="font-medium">{opp.toArticleTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ancre suggérée : "{opp.suggestedAnchor}" • Score : {opp.relevanceScore}%
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewLink({
                          fromArticleId: opp.fromArticleId,
                          toArticleId: opp.toArticleId,
                          anchorText: opp.suggestedAnchor,
                          position: 'content',
                        });
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tous les liens internes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>De</TableHead>
                  <TableHead>Vers</TableHead>
                  <TableHead>Ancre</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>PageRank</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linksData?.data?.slice(0, 20).map(link => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <a
                        href={link.fromArticleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {link.fromArticleTitle.substring(0, 30)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <a
                        href={link.toArticleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {link.toArticleTitle.substring(0, 30)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{link.anchorText}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{link.position}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-medium',
                        link.pageRank >= 0.5 ? 'text-green-600' :
                        link.pageRank >= 0.2 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {link.pageRank.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLink.mutate(link.id)}
                        disabled={deleteLink.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Link Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lien interne</DialogTitle>
            <DialogDescription>
              Créez un lien entre deux articles de votre site
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Article source</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Article destination</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Texte d'ancre</Label>
              <Input
                value={newLink.anchorText}
                onChange={(e) => setNewLink({ ...newLink, anchorText: e.target.value })}
                placeholder="Ex: guide complet, en savoir plus..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Position</Label>
              <Select
                value={newLink.position}
                onValueChange={(v) => setNewLink({ ...newLink, position: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Contenu</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="related">Articles liés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddLink}
              disabled={addLink.isPending || !newLink.anchorText}
            >
              {addLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MaillageManager;
