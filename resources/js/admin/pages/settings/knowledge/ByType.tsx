/**
 * Knowledge By Type Page
 * File 241 - Browse and manage knowledge by type
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { KnowledgeTypeFilter } from '@/components/settings/KnowledgeTypeFilter';
import {
  useKnowledgeList,
  useUpdateKnowledge,
  useDeleteKnowledge,
  useDuplicateKnowledge,
} from '@/hooks/usePlatformKnowledge';
import { usePlatform } from '@/hooks/usePlatform';
import {
  PlatformKnowledge,
  KnowledgeType,
  KNOWLEDGE_TYPES,
  getKnowledgeTypeColor,
  getKnowledgeTypeMetadata,
} from '@/types/knowledge';
import { cn } from '@/lib/utils';

export default function KnowledgeByTypePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentPlatform } = usePlatform();

  // Filters
  const [selectedType, setSelectedType] = useState<string | null>(
    searchParams.get('type') || null
  );
  const [search, setSearch] = useState('');

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PlatformKnowledge | null>(null);

  // API hooks
  const { data: knowledgeData, isLoading } = useKnowledgeList({
    platform_id: currentPlatform?.id,
    type: selectedType || undefined,
    search: search || undefined,
    sort_by: 'priority',
    sort_order: 'desc',
    per_page: 100,
  });

  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();
  const duplicateKnowledge = useDuplicateKnowledge();

  // Handle type change
  const handleTypeChange = (type: string | null) => {
    setSelectedType(type);
    if (type) {
      setSearchParams({ type });
    } else {
      setSearchParams({});
    }
  };

  // Handle toggle active
  const handleToggleActive = (item: PlatformKnowledge) => {
    updateKnowledge.mutate({
      id: item.id,
      is_active: !item.is_active,
    });
  };

  // Handle duplicate
  const handleDuplicate = (id: number) => {
    duplicateKnowledge.mutate(id);
  };

  // Handle delete
  const handleDelete = (item: PlatformKnowledge) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteKnowledge.mutate(itemToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
      });
    }
  };

  // Calculate type counts for filter
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    KNOWLEDGE_TYPES.forEach(type => {
      counts[type.value] = knowledgeData?.data.filter(k => k.type === type.value).length || 0;
    });
    return counts;
  }, [knowledgeData]);

  // Get filtered items
  const filteredItems = knowledgeData?.data || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground">
          {t('settings.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/settings/knowledge" className="hover:text-foreground">
          {t('knowledge.title')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{t('knowledge.byType.title')}</span>
      </nav>

      <PageHeader
        title={t('knowledge.byType.title')}
        description={t('knowledge.byType.description')}
        actions={
          <Button asChild>
            <Link to={`/settings/knowledge/new${selectedType ? `?type=${selectedType}` : ''}`}>
              <Plus className="h-4 w-4 mr-2" />
              {t('knowledge.actions.add')}
            </Link>
          </Button>
        }
      />

      <div className="flex gap-6">
        {/* Sidebar - Type Filter */}
        <div className="w-64 shrink-0">
          <Card>
            <CardContent className="pt-4">
              <KnowledgeTypeFilter
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
                counts={typeCounts}
                orientation="vertical"
                showCounts
                showRequiredIndicator
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('knowledge.byType.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Type Info */}
          {selectedType && (
            <div className="flex items-center gap-2">
              <Badge
                style={{
                  backgroundColor: getKnowledgeTypeColor(selectedType as KnowledgeType),
                }}
                className="text-white"
              >
                {getKnowledgeTypeMetadata(selectedType as KnowledgeType)?.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getKnowledgeTypeMetadata(selectedType as KnowledgeType)?.description}
              </span>
            </div>
          )}

          {/* Table */}
          <Card>
            {isLoading ? (
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            ) : filteredItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t('knowledge.fields.active')}</TableHead>
                    <TableHead>{t('knowledge.fields.title')}</TableHead>
                    <TableHead className="w-24">{t('knowledge.fields.type')}</TableHead>
                    <TableHead className="w-20 text-center">{t('knowledge.fields.priority')}</TableHead>
                    <TableHead className="w-32 text-center">{t('knowledge.fields.usage')}</TableHead>
                    <TableHead className="w-32">{t('knowledge.fields.updated')}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={updateKnowledge.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/settings/knowledge/${item.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getKnowledgeTypeColor(item.type),
                            color: getKnowledgeTypeColor(item.type),
                          }}
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={item.priority >= 8 ? 'default' : item.priority >= 5 ? 'secondary' : 'outline'}
                        >
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={item.use_in_articles ? 'default' : 'outline'}
                                  className={cn(
                                    'w-6 h-6 p-0 flex items-center justify-center',
                                    !item.use_in_articles && 'opacity-30'
                                  )}
                                >
                                  A
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Articles</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={item.use_in_landings ? 'default' : 'outline'}
                                  className={cn(
                                    'w-6 h-6 p-0 flex items-center justify-center',
                                    !item.use_in_landings && 'opacity-30'
                                  )}
                                >
                                  L
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Landings</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={item.use_in_comparatives ? 'default' : 'outline'}
                                  className={cn(
                                    'w-6 h-6 p-0 flex items-center justify-center',
                                    !item.use_in_comparatives && 'opacity-30'
                                  )}
                                >
                                  C
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Comparatifs</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={item.use_in_pillars ? 'default' : 'outline'}
                                  className={cn(
                                    'w-6 h-6 p-0 flex items-center justify-center',
                                    !item.use_in_pillars && 'opacity-30'
                                  )}
                                >
                                  P
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Piliers</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={item.use_in_press ? 'default' : 'outline'}
                                  className={cn(
                                    'w-6 h-6 p-0 flex items-center justify-center',
                                    !item.use_in_press && 'opacity-30'
                                  )}
                                >
                                  PR
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Presse</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/settings/knowledge/${item.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(item.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              {t('common.duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(item)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">
                  {t('knowledge.byType.empty.title')}
                </h3>
                <p className="text-muted-foreground text-center mt-2">
                  {selectedType
                    ? t('knowledge.byType.empty.descriptionFiltered')
                    : t('knowledge.byType.empty.description')}
                </p>
                <Button asChild className="mt-4">
                  <Link to={`/settings/knowledge/new${selectedType ? `?type=${selectedType}` : ''}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('knowledge.actions.add')}
                  </Link>
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Pagination Info */}
          {knowledgeData?.meta && (
            <div className="text-sm text-muted-foreground text-center">
              {t('common.pagination.showing', {
                from: 1,
                to: filteredItems.length,
                total: knowledgeData.meta.total,
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('knowledge.delete.title')}
            </DialogTitle>
            <DialogDescription>
              {t('knowledge.delete.description', { title: itemToDelete?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteKnowledge.isPending}
            >
              {deleteKnowledge.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
