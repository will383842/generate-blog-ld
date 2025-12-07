/**
 * Version History
 * Timeline of article versions with preview and restore
 */

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  History,
  Eye,
  RotateCcw,
  GitBranch,
  User,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { ArticleVersion } from '@/types/article';

export interface VersionHistoryProps {
  versions: ArticleVersion[];
  currentVersionId?: string;
  onPreview?: (version: ArticleVersion) => void;
  onRestore?: (version: ArticleVersion) => void;
  onCompare?: (version1: ArticleVersion, version2: ArticleVersion) => void;
  isLoading?: boolean;
  className?: string;
}

const CHANGE_TYPE_CONFIG: Record<
  ArticleVersion['changeType'],
  { label: string; color: string }
> = {
  create: { label: 'Création', color: 'bg-green-100 text-green-700' },
  update: { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  publish: { label: 'Publication', color: 'bg-purple-100 text-purple-700' },
  unpublish: { label: 'Dépublication', color: 'bg-orange-100 text-orange-700' },
  restore: { label: 'Restauration', color: 'bg-yellow-100 text-yellow-700' },
};

export function VersionHistory({
  versions,
  currentVersionId,
  onPreview,
  onRestore,
  onCompare,
  isLoading,
  className,
}: VersionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ArticleVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<ArticleVersion[]>([]);

  const handlePreview = (version: ArticleVersion) => {
    setPreviewVersion(version);
    onPreview?.(version);
  };

  const handleRestore = (version: ArticleVersion) => {
    if (confirm(`Restaurer la version ${version.versionNumber} ?`)) {
      onRestore?.(version);
    }
  };

  const toggleCompareSelect = (version: ArticleVersion) => {
    if (selectedForCompare.find((v) => v.id === version.id)) {
      setSelectedForCompare(selectedForCompare.filter((v) => v.id !== version.id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, version]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompare) {
      onCompare(selectedForCompare[0], selectedForCompare[1]);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-3 h-3 bg-gray-200 rounded-full mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Historique des versions
            <Badge variant="secondary">{versions.length}</Badge>
          </CardTitle>
          {onCompare && (
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
            >
              <GitBranch className="w-4 h-4 mr-1" />
              Comparer
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {compareMode && selectedForCompare.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm">
              {selectedForCompare.length}/2 versions sélectionnées
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedForCompare([])}
              >
                Effacer
              </Button>
              <Button
                size="sm"
                disabled={selectedForCompare.length !== 2}
                onClick={handleCompare}
              >
                Comparer
              </Button>
            </div>
          </div>
        )}

        {versions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune version enregistrée
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {/* Versions */}
            <div className="space-y-4">
              {versions.map((version, index) => {
                const isExpanded = expandedId === version.id;
                const isCurrent = version.id === currentVersionId;
                const isSelected = selectedForCompare.find((v) => v.id === version.id);
                const config = CHANGE_TYPE_CONFIG[version.changeType];

                return (
                  <div key={version.id} className="relative pl-6">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 bg-white',
                        isCurrent
                          ? 'border-primary bg-primary'
                          : isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      )}
                    />

                    {/* Version card */}
                    <div
                      className={cn(
                        'border rounded-lg transition-colors',
                        isSelected && 'border-blue-300 bg-blue-50',
                        isCurrent && 'border-primary/50 bg-primary/5'
                      )}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : version.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                Version {version.versionNumber}
                              </span>
                              <Badge className={config.color}>{config.label}</Badge>
                              {isCurrent && (
                                <Badge variant="outline">Actuelle</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(version.createdAt), 'PPp', {
                                  locale: fr,
                                })}
                              </span>
                              {version.createdByName && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {version.createdByName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {compareMode ? (
                            <Button
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompareSelect(version);
                              }}
                              disabled={
                                !isSelected && selectedForCompare.length >= 2
                              }
                            >
                              {isSelected ? 'Sélectionné' : 'Sélectionner'}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreview(version);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!isCurrent && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestore(version);
                                  }}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t">
                          {version.changeSummary && (
                            <p className="text-sm text-muted-foreground mt-3">
                              {version.changeSummary}
                            </p>
                          )}
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <p className="font-medium mb-2">{version.title}</p>
                            {version.excerpt && (
                              <p className="text-muted-foreground line-clamp-2">
                                {version.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">
                  Aperçu - Version {previewVersion.versionNumber}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(previewVersion.createdAt), 'PPp', { locale: fr })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewVersion(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto">
              <h1 className="text-2xl font-bold mb-4">{previewVersion.title}</h1>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewVersion.content }}
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleRestore(previewVersion)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurer cette version
              </Button>
              <Button onClick={() => setPreviewVersion(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default VersionHistory;
