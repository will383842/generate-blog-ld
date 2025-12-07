/**
 * Not Indexed Articles Component
 * File 321 - Display articles that are published but not indexed
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Globe,
  Filter,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
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
import { NotIndexedArticle, NotIndexedFilters } from '@/types/seo';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotIndexedArticlesProps {
  data?: {
    data: NotIndexedArticle[];
    total: number;
    page: number;
    per_page: number;
  };
  filters: NotIndexedFilters;
  onFilterChange: (filters: NotIndexedFilters) => void;
  onSubmit: (articleIds: number[]) => void;
  onSubmitAll: () => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export function NotIndexedArticles({
  data,
  filters,
  onFilterChange,
  onSubmit,
  onSubmitAll,
  isLoading,
  isSubmitting,
}: NotIndexedArticlesProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.size === data?.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data?.data.map(a => a.id)));
    }
  };

  // Handle submit selected
  const handleSubmitSelected = () => {
    onSubmit(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Handle submit all
  const handleSubmitAll = () => {
    setShowConfirmDialog(false);
    onSubmitAll();
  };

  // Get day badge color
  const getDaysBadgeColor = (days: number) => {
    if (days > 7) return 'bg-red-100 text-red-800';
    if (days > 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={data?.total && data.total > 0 ? 'border-yellow-200' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className={cn(
                  'h-4 w-4',
                  data?.total && data.total > 0 ? 'text-yellow-500' : 'text-green-500'
                )} />
                Articles non indexés
                {data?.total && data.total > 0 && (
                  <Badge variant="destructive">{data.total}</Badge>
                )}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={String(filters.days_since_publish || 'all')}
                onValueChange={(v) => onFilterChange({
                  ...filters,
                  days_since_publish: v === 'all' ? undefined : parseInt(v),
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Jours depuis publication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="1">Depuis 1 jour</SelectItem>
                  <SelectItem value="3">Depuis 3 jours</SelectItem>
                  <SelectItem value="7">Depuis 7 jours</SelectItem>
                  <SelectItem value="30">Depuis 30 jours</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              {selectedIds.size > 0 && (
                <Button
                  variant="outline"
                  onClick={handleSubmitSelected}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Soumettre ({selectedIds.size})
                </Button>
              )}

              {data?.total && data.total > 0 && (
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Tout soumettre
                </Button>
              )}
            </div>

            {/* Table */}
            {data?.data && data.data.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === data.data.length && data.data.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Publié le</TableHead>
                      <TableHead>Délai</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map(article => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(article.id)}
                            onCheckedChange={() => toggleSelection(article.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[250px]">
                              {article.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{article.platformName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDaysBadgeColor(article.daysSincePublish)}>
                            {article.daysSincePublish}j
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <Globe className="h-3 w-3" />
                            Voir
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Tous les articles sont indexés !</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.total > data.per_page && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {data.total} article(s) non indexé(s) • Page {data.page}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => onFilterChange({ ...filters, page: (filters.page || 1) - 1 })}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= Math.ceil(data.total / data.per_page)}
                    onClick={() => onFilterChange({ ...filters, page: (filters.page || 1) + 1 })}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soumettre tous les articles ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez soumettre {data?.total || 0} article(s) à l'indexation.
              Cette action respectera les quotas journaliers de chaque moteur de recherche.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitAll}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}

export default NotIndexedArticles;
