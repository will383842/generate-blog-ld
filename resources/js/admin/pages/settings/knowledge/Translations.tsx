import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Languages,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { TranslationMatrix } from '@/components/settings/TranslationMatrix';
import { KnowledgeTypeFilter } from '@/components/settings/KnowledgeTypeFilter';
import {
  useKnowledgeList,
  useTranslationMatrix,
  useBulkTranslate,
  useExportKnowledge,
} from '@/hooks/usePlatformKnowledge';
import { useLanguages } from '@/hooks/useLanguages';
import { usePlatform } from '@/hooks/usePlatform';
import { KNOWLEDGE_TYPES } from '@/types/knowledge';
import { cn } from '@/lib/utils';

const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru'];

export default function TranslationsPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const { languages } = useLanguages();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('fr');

  const { data: matrix, isLoading: matrixLoading, refetch } = useTranslationMatrix(
    currentPlatform?.id || 0
  );

  const { data: knowledgeData, isLoading: listLoading } = useKnowledgeList({
    platform_id: currentPlatform?.id,
    type: selectedType || undefined,
    per_page: 100,
  });

  const bulkTranslate = useBulkTranslate();
  const exportKnowledge = useExportKnowledge();

  const isLoading = matrixLoading || listLoading;

  // Calculate stats per language
  const languageStats = SUPPORTED_LANGUAGES.map(lang => {
    if (!matrix) return { code: lang, total: 0, done: 0, pending: 0, missing: 0, percentage: 0 };
    
    const langData = matrix.languages[lang] || { done: 0, pending: 0, missing: 0 };
    const total = langData.done + langData.pending + langData.missing;
    const percentage = total > 0 ? Math.round((langData.done / total) * 100) : 0;
    
    return {
      code: lang,
      total,
      done: langData.done,
      pending: langData.pending,
      missing: langData.missing,
      percentage,
    };
  });

  // Overall stats
  const overallStats = {
    totalItems: matrix?.items.length || 0,
    totalTranslations: languageStats.reduce((acc, l) => acc + l.total, 0),
    completedTranslations: languageStats.reduce((acc, l) => acc + l.done, 0),
    pendingTranslations: languageStats.reduce((acc, l) => acc + l.pending, 0),
    missingTranslations: languageStats.reduce((acc, l) => acc + l.missing, 0),
  };

  const overallPercentage = overallStats.totalTranslations > 0
    ? Math.round((overallStats.completedTranslations / overallStats.totalTranslations) * 100)
    : 0;

  const handleBulkTranslate = () => {
    if (selectedItems.length === 0 || selectedLanguages.length === 0) return;
    
    bulkTranslate.mutate({
      knowledge_ids: selectedItems,
      source_language: sourceLanguage,
      target_languages: selectedLanguages,
    }, {
      onSuccess: () => {
        setShowBulkDialog(false);
        setSelectedItems([]);
        setSelectedLanguages([]);
        refetch();
      },
    });
  };

  const handleExport = (format: 'json' | 'csv') => {
    exportKnowledge.mutate({
      platform_id: currentPlatform?.id || 0,
      format,
      include_translations: true,
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === (knowledgeData?.data.length || 0)) {
      setSelectedItems([]);
    } else {
      setSelectedItems(knowledgeData?.data.map(k => k.id) || []);
    }
  };

  const handleSelectAllLanguages = () => {
    if (selectedLanguages.length === SUPPORTED_LANGUAGES.length - 1) {
      setSelectedLanguages([]);
    } else {
      setSelectedLanguages(SUPPORTED_LANGUAGES.filter(l => l !== sourceLanguage));
    }
  };

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
        <span className="text-foreground">{t('knowledge.translations.title')}</span>
      </nav>

      <PageHeader
        title={t('knowledge.translations.title')}
        description={t('knowledge.translations.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              {t('common.refresh')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exportKnowledge.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button
              onClick={() => setShowBulkDialog(true)}
              disabled={selectedItems.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('knowledge.translations.bulkTranslate')}
              {selectedItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedItems.length}
                </Badge>
              )}
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{overallStats.totalItems}</div>
            <p className="text-sm text-muted-foreground">
              {t('knowledge.translations.stats.items')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {overallStats.completedTranslations}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('knowledge.translations.stats.completed')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {overallStats.pendingTranslations}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('knowledge.translations.stats.pending')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-400">
              {overallStats.missingTranslations}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('knowledge.translations.stats.missing')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{overallPercentage}%</div>
            <Progress value={overallPercentage} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {t('knowledge.translations.stats.overall')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Language Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('knowledge.translations.languageProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
            {languageStats.map(lang => (
              <div
                key={lang.code}
                className={cn(
                  'text-center p-3 rounded-lg border',
                  lang.percentage === 100 && 'bg-green-50 border-green-200',
                  lang.percentage >= 50 && lang.percentage < 100 && 'bg-yellow-50 border-yellow-200',
                  lang.percentage < 50 && 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="font-medium uppercase">{lang.code}</div>
                <div className="text-2xl font-bold mt-1">{lang.percentage}%</div>
                <div className="text-xs text-muted-foreground">
                  {lang.done}/{lang.total}
                </div>
                <Progress value={lang.percentage} className="mt-2 h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Type Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('knowledge.translations.filterByType')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KnowledgeTypeFilter
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            orientation="horizontal"
            showCounts
            compact
          />
        </CardContent>
      </Card>

      {/* Translation Matrix */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : matrix && matrix.items.length > 0 ? (
        <TranslationMatrix
          items={selectedType
            ? matrix.items.filter(item => item.type === selectedType)
            : matrix.items
          }
          languages={SUPPORTED_LANGUAGES}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onTranslateItem={(id, targetLang) => {
            setSelectedItems([id]);
            setSelectedLanguages([targetLang]);
            setShowBulkDialog(true);
          }}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Languages className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t('knowledge.translations.empty.title')}</h3>
            <p className="text-muted-foreground text-center mt-2">
              {t('knowledge.translations.empty.description')}
            </p>
            <Button asChild className="mt-4">
              <Link to="/settings/knowledge/new">
                {t('knowledge.actions.add')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{t('knowledge.translations.status.done')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>{t('knowledge.translations.status.pending')}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              <span>{t('knowledge.translations.status.missing')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Translate Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('knowledge.translations.bulkDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('knowledge.translations.bulkDialog.description', {
                count: selectedItems.length,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source Language */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('knowledge.translations.bulkDialog.sourceLanguage')}
              </label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {lang.toUpperCase()} - {languages?.find(l => l.code === lang)?.name || lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Languages */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {t('knowledge.translations.bulkDialog.targetLanguages')}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllLanguages}
                >
                  {selectedLanguages.length === SUPPORTED_LANGUAGES.length - 1
                    ? t('common.deselectAll')
                    : t('common.selectAll')
                  }
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.filter(l => l !== sourceLanguage).map(lang => (
                  <label
                    key={lang}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded border cursor-pointer',
                      selectedLanguages.includes(lang) && 'bg-primary/10 border-primary'
                    )}
                  >
                    <Checkbox
                      checked={selectedLanguages.includes(lang)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLanguages([...selectedLanguages, lang]);
                        } else {
                          setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                        }
                      }}
                    />
                    <span className="font-medium">{lang.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedLanguages.length > 0 && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p>
                  {t('knowledge.translations.bulkDialog.summary', {
                    items: selectedItems.length,
                    languages: selectedLanguages.length,
                    total: selectedItems.length * selectedLanguages.length,
                  })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleBulkTranslate}
              disabled={selectedLanguages.length === 0 || bulkTranslate.isPending}
            >
              {bulkTranslate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.translating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('knowledge.translations.bulkDialog.translate')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
