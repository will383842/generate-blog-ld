/**
 * Article History Page
 * Version history with diff viewer
 */

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  History,
  RotateCcw,
  Eye,
  User,
  GitBranch,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useArticle, useArticleVersions, useRestoreVersion } from '@/hooks/useArticles';
import type { ArticleVersion } from '@/types/article';

const CHANGE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  create: { label: 'Création', color: 'bg-green-100 text-green-700' },
  update: { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  publish: { label: 'Publication', color: 'bg-purple-100 text-purple-700' },
  unpublish: { label: 'Dépublication', color: 'bg-orange-100 text-orange-700' },
  restore: { label: 'Restauration', color: 'bg-yellow-100 text-yellow-700' },
};

export function ArticleHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<ArticleVersion | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'compare'>('timeline');

  const { data: articleData } = useArticle(id || '');
  const { data: versionsData, isLoading } = useArticleVersions(id || '');
  const restoreVersion = useRestoreVersion();

  const article = articleData?.data;
  const versions = versionsData?.data || [];

  // Current version (latest)
  const currentVersion = versions[0];

  const handleRestore = async () => {
    if (!selectedVersion || !id) return;
    await restoreVersion.mutateAsync({
      articleId: id,
      versionId: selectedVersion.id,
    });
    setShowRestoreDialog(false);
  };

  // Simple diff function (word-level)
  const computeDiff = useMemo(() => {
    if (!selectedVersion || !compareVersion) return null;

    const oldContent = compareVersion.content;
    const newContent = selectedVersion.content;

    // Very simple diff - just mark differences
    // In production, use a proper diff library like diff-match-patch
    return {
      oldContent,
      newContent,
      hasDifferences: oldContent !== newContent,
    };
  }, [selectedVersion, compareVersion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Version List */}
      <div className="w-80 border-r bg-white overflow-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/content/articles/${id}`}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="font-semibold">Historique</h1>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {article?.title}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="p-4 border-b">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'timeline' | 'compare')}>
            <TabsList className="w-full">
              <TabsTrigger value="timeline" className="flex-1">
                <History className="w-4 h-4 mr-1" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex-1">
                <GitBranch className="w-4 h-4 mr-1" />
                Comparer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Versions */}
        <div className="p-2">
          {versions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune version
            </p>
          ) : (
            <div className="space-y-1">
              {versions.map((version, index) => {
                const isSelected = selectedVersion?.id === version.id;
                const isCompare = compareVersion?.id === version.id;
                const isCurrent = index === 0;
                const changeConfig = CHANGE_TYPE_CONFIG[version.changeType] || CHANGE_TYPE_CONFIG.update;

                return (
                  <button
                    key={version.id}
                    onClick={() => {
                      if (viewMode === 'compare') {
                        if (!selectedVersion) {
                          setSelectedVersion(version);
                        } else if (!compareVersion && selectedVersion.id !== version.id) {
                          setCompareVersion(version);
                        } else {
                          setSelectedVersion(version);
                          setCompareVersion(null);
                        }
                      } else {
                        setSelectedVersion(version);
                      }
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      isSelected && 'bg-primary/10 border-primary',
                      isCompare && 'bg-orange-50 border-orange-300',
                      !isSelected && !isCompare && 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className={changeConfig.color}>
                          {changeConfig.label}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="outline">Actuel</Badge>
                        )}
                      </div>
                      {viewMode === 'compare' && (
                        <>
                          {isSelected && <Badge>A</Badge>}
                          {isCompare && <Badge variant="outline">B</Badge>}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(new Date(version.createdAt), 'PPp', { locale: fr })}
                    </p>
                    {version.createdByName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.createdByName}
                      </p>
                    )}
                    {version.changeSummary && (
                      <p className="text-xs mt-1 line-clamp-2">
                        {version.changeSummary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {viewMode === 'timeline' ? (
          // Timeline View - Single Version
          selectedVersion ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Version #{selectedVersion.versionNumber}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedVersion.createdAt), 'PPPp', { locale: fr })}
                    {selectedVersion.createdByName && ` par ${selectedVersion.createdByName}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/content/articles/${id}/preview?version=${selectedVersion.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      Aperçu
                    </Link>
                  </Button>
                  {selectedVersion.id !== currentVersion?.id && (
                    <Button onClick={() => setShowRestoreDialog(true)}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurer
                    </Button>
                  )}
                </div>
              </div>

              {/* Version Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selectedVersion.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez une version pour voir son contenu
                </p>
              </div>
            </div>
          )
        ) : (
          // Compare View - Side by Side
          <div className="p-6">
            {selectedVersion && compareVersion ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Comparaison</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedVersion(null);
                      setCompareVersion(null);
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Version A */}
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <Badge>Version A</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(selectedVersion.createdAt), 'PP', { locale: fr })}
                        </span>
                      </div>
                      <CardTitle className="text-sm">{selectedVersion.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[60vh] overflow-auto">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                      />
                    </CardContent>
                  </Card>

                  {/* Version B */}
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Version B</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(compareVersion.createdAt), 'PP', { locale: fr })}
                        </span>
                      </div>
                      <CardTitle className="text-sm">{compareVersion.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[60vh] overflow-auto">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: compareVersion.content }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {computeDiff && (
                  <Card className="mt-4">
                    <CardContent className="py-3">
                      {computeDiff.hasDifferences ? (
                        <p className="text-sm text-yellow-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Les versions sont différentes
                        </p>
                      ) : (
                        <p className="text-sm text-green-600">
                          Les versions sont identiques
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {!selectedVersion
                      ? 'Sélectionnez la première version (A)'
                      : 'Sélectionnez la seconde version (B)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer cette version ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Cette action va créer une nouvelle version avec le contenu de la version #{selectedVersion?.versionNumber}.
            La version actuelle sera conservée dans l'historique.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRestore}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArticleHistoryPage;
