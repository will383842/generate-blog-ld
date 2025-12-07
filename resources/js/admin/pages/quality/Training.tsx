/**
 * Training Export Page
 * File 281 - Export golden examples for model training
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Download,
  ArrowLeft,
  FileJson,
  FileSpreadsheet,
  Database,
  Loader2,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useGoldenCategories,
  useExportTraining,
  useExportsList,
  useExportStatus,
} from '@/hooks/useGoldenExamples';
import {
  TrainingExportOptions,
  TrainingExportResult,
  ContentType,
} from '@/types/quality';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'comparative', label: 'Comparatif' },
  { value: 'pillar', label: 'Pilier' },
  { value: 'press', label: 'Communiqué' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'ru', label: 'Русский' },
];

const FORMAT_OPTIONS = [
  { value: 'jsonl', label: 'JSONL', icon: FileJson, description: 'Format standard pour le fine-tuning' },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Pour analyse et traitement' },
  { value: 'parquet', label: 'Parquet', icon: Database, description: 'Format optimisé pour les grands datasets' },
];

export default function TrainingExportPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State - Export options
  const [options, setOptions] = useState<TrainingExportOptions>({
    format: 'jsonl',
    include_positive: true,
    include_negative: true,
    categories: [],
    content_types: [],
    languages: [],
    min_quality_score: 70,
    limit: undefined,
    shuffle: true,
  });

  // API hooks
  const { data: categories } = useGoldenCategories(platformId);
  const { data: exports, isLoading: exportsLoading, refetch: refetchExports } = useExportsList();
  const exportTraining = useExportTraining();

  // Handle export
  const handleExport = () => {
    exportTraining.mutate(options);
  };

  // Get status color
  const getStatusColor = (status: TrainingExportResult['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  // Get status icon
  const getStatusIcon = (status: TrainingExportResult['status']) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/quality/golden">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Download className="h-6 w-6" />
              Export Training
            </h1>
            <p className="text-muted-foreground">
              Exportez vos exemples dorés pour l'entraînement de modèles
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration de l'export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format */}
              <div>
                <Label className="mb-3 block">Format de sortie</Label>
                <div className="grid grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map(format => {
                    const Icon = format.icon;
                    return (
                      <button
                        key={format.value}
                        onClick={() => setOptions({ ...options, format: format.value as 'jsonl' | 'csv' | 'parquet' })}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          options.format === format.value
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-muted-foreground'
                        }`}
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        <p className="font-medium">{format.label}</p>
                        <p className="text-xs text-muted-foreground">{format.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Example types */}
              <div>
                <Label className="mb-3 block">Types d'exemples</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="include-positive"
                      checked={options.include_positive}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, include_positive: !!checked })
                      }
                    />
                    <label htmlFor="include-positive" className="flex items-center gap-1 cursor-pointer">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      Positifs
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="include-negative"
                      checked={options.include_negative}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, include_negative: !!checked })
                      }
                    />
                    <label htmlFor="include-negative" className="flex items-center gap-1 cursor-pointer">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      Négatifs
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Categories */}
              <div>
                <Label className="mb-3 block">Catégories (optionnel)</Label>
                <div className="flex flex-wrap gap-2">
                  {categories?.map(cat => (
                    <Badge
                      key={cat.slug}
                      variant={options.categories?.includes(cat.slug) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = options.categories || [];
                        setOptions({
                          ...options,
                          categories: current.includes(cat.slug)
                            ? current.filter(c => c !== cat.slug)
                            : [...current, cat.slug],
                        });
                      }}
                    >
                      {cat.name} ({cat.examples_count})
                    </Badge>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <p className="text-sm text-muted-foreground">Aucune catégorie</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Content types */}
              <div>
                <Label className="mb-3 block">Types de contenu (optionnel)</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map(type => (
                    <Badge
                      key={type.value}
                      variant={options.content_types?.includes(type.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = options.content_types || [];
                        setOptions({
                          ...options,
                          content_types: current.includes(type.value)
                            ? current.filter(t => t !== type.value)
                            : [...current, type.value],
                        });
                      }}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Languages */}
              <div>
                <Label className="mb-3 block">Langues (optionnel)</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <Badge
                      key={lang.value}
                      variant={options.languages?.includes(lang.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = options.languages || [];
                        setOptions({
                          ...options,
                          languages: current.includes(lang.value)
                            ? current.filter(l => l !== lang.value)
                            : [...current, lang.value],
                        });
                      }}
                    >
                      {lang.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Quality score */}
              <div>
                <Label className="mb-3 block">
                  Score qualité minimum: {options.min_quality_score}
                </Label>
                <Slider
                  value={[options.min_quality_score || 0]}
                  onValueChange={([value]) => setOptions({ ...options, min_quality_score: value })}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <Separator />

              {/* Options */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shuffle">Mélanger les données</Label>
                  <p className="text-xs text-muted-foreground">
                    Recommandé pour l'entraînement
                  </p>
                </div>
                <Switch
                  id="shuffle"
                  checked={options.shuffle}
                  onCheckedChange={(checked) => setOptions({ ...options, shuffle: checked })}
                />
              </div>

              <div>
                <Label htmlFor="limit">Limite (optionnel)</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="Aucune limite"
                  value={options.limit || ''}
                  onChange={(e) => setOptions({
                    ...options,
                    limit: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  className="mt-1 w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Export button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleExport}
            disabled={exportTraining.isPending || (!options.include_positive && !options.include_negative)}
          >
            {exportTraining.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Lancer l'export
          </Button>
        </div>

        {/* Export history */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Exports récents</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => refetchExports()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {exportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : exports && exports.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {exports.map(exp => (
                      <div
                        key={exp.id}
                        className="p-3 rounded-lg border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(exp.status)}
                            <Badge variant="outline">{exp.options.format.toUpperCase()}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(exp.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">
                          {exp.items_count} éléments
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(exp.file_size)}
                        </p>
                        {exp.status === 'processing' && (
                          <Progress value={50} className="mt-2 h-1" />
                        )}
                        {exp.status === 'completed' && exp.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            asChild
                          >
                            <a href={exp.file_url} download>
                              <Download className="h-3 w-3 mr-2" />
                              Télécharger
                            </a>
                          </Button>
                        )}
                        {exp.status === 'failed' && exp.error && (
                          <p className="text-xs text-red-600 mt-2">{exp.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucun export</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
