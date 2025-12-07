/**
 * Brand History Page
 * File 263 - Full page for version history and restore
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  History,
  ArrowLeft,
  Loader2,
  RotateCcw,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  FileText,
  Settings2,
  AlertTriangle,
  Check,
  Eye,
  GitCompare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useBrandHistory,
  useRestoreBrandVersion,
} from '@/hooks/useBrandValidation';
import { BrandVersion, BrandChange, getBrandSectionTypeMetadata } from '@/types/brand';
import { cn } from '@/lib/utils';

export default function BrandHistoryPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [selectedVersion, setSelectedVersion] = useState<BrandVersion | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [compareVersions, setCompareVersions] = useState<[BrandVersion | null, BrandVersion | null]>([null, null]);

  // API hooks
  const { data: history, isLoading } = useBrandHistory(platformId);
  const restoreVersion = useRestoreBrandVersion();

  // Toggle version expand
  const toggleVersionExpand = (versionId: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  // Handle restore
  const handleRestore = () => {
    if (!selectedVersion) return;

    restoreVersion.mutate(
      { platformId, versionId: selectedVersion.id },
      {
        onSuccess: () => {
          setRestoreDialogOpen(false);
          setSelectedVersion(null);
        },
      }
    );
  };

  // Open restore dialog
  const openRestoreDialog = (version: BrandVersion) => {
    setSelectedVersion(version);
    setRestoreDialogOpen(true);
  };

  // Select for comparison
  const selectForComparison = (version: BrandVersion) => {
    if (!compareVersions[0]) {
      setCompareVersions([version, null]);
    } else if (!compareVersions[1] && version.id !== compareVersions[0].id) {
      setCompareVersions([compareVersions[0], version]);
      setDiffDialogOpen(true);
    } else {
      setCompareVersions([version, null]);
    }
  };

  // Get change type icon
  const getChangeIcon = (field: string) => {
    if (field === 'content') return <FileText className="h-3 w-3" />;
    if (field.includes('setting')) return <Settings2 className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date),
    };
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString();
  };

  // Render diff
  const renderDiff = (oldValue: string, newValue: string) => {
    // Simple diff - in production, use a proper diff library
    return (
      <div className="space-y-2 text-sm font-mono">
        <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded">
          <span className="text-red-600">- {oldValue || '(vide)'}</span>
        </div>
        <div className="p-2 bg-green-50 border-l-4 border-green-500 rounded">
          <span className="text-green-600">+ {newValue || '(vide)'}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
            <Link to="/settings/brand">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Historique des versions
            </h1>
            <p className="text-muted-foreground">
              Consultez et restaurez les versions précédentes du brand book
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Selection */}
      {compareVersions[0] && !compareVersions[1] && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                Version {compareVersions[0].version_number} sélectionnée pour comparaison.
                Sélectionnez une autre version.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCompareVersions([null, null])}
            >
              Annuler
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {history && history.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {history.map((version, index) => {
              const { date, time, relative } = formatDate(version.created_at);
              const isExpanded = expandedVersions.has(version.id);
              const isSelectedForCompare = compareVersions[0]?.id === version.id;

              return (
                <div key={version.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-[12px] w-4 h-4 rounded-full border-2 bg-background',
                      index === 0 ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}
                  />

                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleVersionExpand(version.id)}
                  >
                    <Card className={cn(
                      'transition-all',
                      isSelectedForCompare && 'ring-2 ring-blue-500',
                      index === 0 && 'border-primary'
                    )}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  Version {version.version_number}
                                  {index === 0 && (
                                    <Badge>Actuelle</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {relative}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {version.created_by_name}
                                  </span>
                                  <span>
                                    {version.changes.length} modification(s)
                                  </span>
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => selectForComparison(version)}
                                    >
                                      <GitCompare className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Comparer</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {index !== 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRestoreDialog(version)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restaurer
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {version.comment && (
                            <p className="text-sm text-muted-foreground mb-4 italic">
                              "{version.comment}"
                            </p>
                          )}
                          <div className="space-y-3">
                            {version.changes.map((change, changeIdx) => {
                              const sectionMeta = getBrandSectionTypeMetadata(change.section_type);
                              return (
                                <div
                                  key={changeIdx}
                                  className="p-3 border rounded-lg bg-muted/50"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: sectionMeta?.color || '#6B7280' }}
                                    />
                                    <span className="font-medium text-sm">
                                      {sectionMeta?.label || change.section_type}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {change.language_code.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {change.field}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    {change.old_value !== change.new_value ? (
                                      <div className="space-y-1">
                                        {change.old_value && (
                                          <div className="flex items-start gap-2">
                                            <span className="text-red-500">-</span>
                                            <span className="line-through text-muted-foreground">
                                              {change.old_value.substring(0, 100)}
                                              {change.old_value.length > 100 && '...'}
                                            </span>
                                          </div>
                                        )}
                                        {change.new_value && (
                                          <div className="flex items-start gap-2">
                                            <span className="text-green-500">+</span>
                                            <span>
                                              {change.new_value.substring(0, 100)}
                                              {change.new_value.length > 100 && '...'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Pas de changement</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">Aucun historique</h3>
            <p className="text-muted-foreground text-center mt-2">
              Les modifications du brand book apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Restaurer la version {selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              Cette action remplacera la configuration actuelle par celle de la version {selectedVersion?.version_number}.
              Une nouvelle version sera créée avec l'état actuel avant la restauration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Version du {selectedVersion && formatDate(selectedVersion.created_at).date} par {selectedVersion?.created_by_name}
            </p>
            <p className="text-sm font-medium mt-2">
              {selectedVersion?.changes.length} modification(s) seront annulées
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRestore}
              disabled={restoreVersion.isPending}
            >
              {restoreVersion.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diff Dialog */}
      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Comparaison: Version {compareVersions[0]?.version_number} → Version {compareVersions[1]?.version_number}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 p-4">
              {/* Simple comparison - would need proper diff logic */}
              <p className="text-muted-foreground">
                Comparaison des changements entre les deux versions sélectionnées.
              </p>
              {compareVersions[0] && compareVersions[1] && (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        Version {compareVersions[0].version_number}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {compareVersions[0].changes.length} modification(s)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        Version {compareVersions[1].version_number}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {compareVersions[1].changes.length} modification(s)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDiffDialogOpen(false);
                setCompareVersions([null, null]);
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
