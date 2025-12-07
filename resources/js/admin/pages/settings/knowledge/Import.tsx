import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download,
  X,
  ArrowRight,
  HelpCircle,
  File,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Checkbox } from '@/components/ui/Checkbox';
import { useImportKnowledge, useExportKnowledge } from '@/hooks/usePlatformKnowledge';
import { usePlatform } from '@/hooks/usePlatform';
import { useToast } from '@/hooks/useToast';
import { KNOWLEDGE_TYPES } from '@/types/knowledge';
import { cn } from '@/lib/utils';

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  format: 'json' | 'csv';
}

interface FieldMapping {
  source: string;
  target: string;
}

const TARGET_FIELDS = [
  { key: 'type', label: 'Type', required: true },
  { key: 'title', label: 'Titre', required: true },
  { key: 'content', label: 'Contenu', required: true },
  { key: 'priority', label: 'Priorité', required: false },
  { key: 'language', label: 'Langue', required: false },
  { key: 'is_active', label: 'Actif', required: false },
  { key: 'use_in_articles', label: 'Articles', required: false },
  { key: 'use_in_landings', label: 'Landings', required: false },
  { key: 'use_in_comparatives', label: 'Comparatifs', required: false },
  { key: 'use_in_pillars', label: 'Piliers', required: false },
  { key: 'use_in_press', label: 'Presse', required: false },
];

const SAMPLE_JSON = `[
  {
    "type": "about",
    "title": "Présentation de la plateforme",
    "content": "Notre plateforme accompagne les expatriés...",
    "priority": 10,
    "language": "fr"
  },
  {
    "type": "values",
    "title": "Nos valeurs",
    "content": "Excellence, réactivité, proximité...",
    "priority": 9,
    "language": "fr"
  }
]`;

const SAMPLE_CSV = `type,title,content,priority,language
about,Présentation de la plateforme,"Notre plateforme accompagne les expatriés...",10,fr
values,Nos valeurs,"Excellence, réactivité, proximité...",9,fr`;

export default function ImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentPlatform } = usePlatform();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const importKnowledge = useImportKnowledge();
  const exportKnowledge = useExportKnowledge();

  const parseFile = useCallback(async (file: File) => {
    const text = await file.text();
    const isJson = file.name.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{');

    try {
      if (isJson) {
        let data = JSON.parse(text);
        if (!Array.isArray(data)) data = [data];
        
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        return {
          headers,
          rows: data,
          format: 'json' as const,
        };
      } else {
        // CSV parsing
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^,]+)/g) || [];
          return headers.reduce((obj, header, idx) => {
            obj[header] = (values[idx] || '').trim().replace(/^"|"$/g, '');
            return obj;
          }, {} as Record<string, string>);
        });
        
        return {
          headers,
          rows,
          format: 'csv' as const,
        };
      }
    } catch (error) {
      throw new Error('Impossible de parser le fichier. Vérifiez le format.');
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const parsed = await parseFile(file);
      setParsedData(parsed);
      
      // Auto-detect mappings
      const autoMappings: FieldMapping[] = [];
      TARGET_FIELDS.forEach(target => {
        const match = parsed.headers.find(h => 
          h.toLowerCase() === target.key.toLowerCase() ||
          h.toLowerCase().includes(target.key.toLowerCase())
        );
        if (match) {
          autoMappings.push({ source: match, target: target.key });
        }
      });
      setFieldMappings(autoMappings);
      setSelectedRows(parsed.rows.map((_, idx) => idx));
      setStep('mapping');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: 'Erreur de parsing',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      try {
        const parsed = await parseFile(file);
        setParsedData(parsed);

        const autoMappings: FieldMapping[] = [];
        TARGET_FIELDS.forEach(target => {
          const match = parsed.headers.find(h =>
            h.toLowerCase() === target.key.toLowerCase()
          );
          if (match) {
            autoMappings.push({ source: match, target: target.key });
          }
        });
        setFieldMappings(autoMappings);
        setSelectedRows(parsed.rows.map((_, idx) => idx));
        setStep('mapping');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        toast({
          title: 'Erreur de parsing',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const updateMapping = (sourceField: string, targetField: string) => {
    setFieldMappings(prev => {
      const existing = prev.findIndex(m => m.source === sourceField);
      if (existing >= 0) {
        if (targetField === '') {
          return prev.filter((_, idx) => idx !== existing);
        }
        const updated = [...prev];
        updated[existing] = { source: sourceField, target: targetField };
        return updated;
      }
      if (targetField) {
        return [...prev, { source: sourceField, target: targetField }];
      }
      return prev;
    });
  };

  const getMappingForSource = (source: string) => {
    return fieldMappings.find(m => m.source === source)?.target || '';
  };

  const requiredFieldsMapped = TARGET_FIELDS
    .filter(f => f.required)
    .every(f => fieldMappings.some(m => m.target === f.key));

  const handleImport = async () => {
    if (!parsedData || !currentPlatform) return;

    setStep('importing');
    setImportProgress(0);

    const mappedData = selectedRows.map(rowIdx => {
      const row = parsedData.rows[rowIdx];
      const mapped: Record<string, any> = {};
      
      fieldMappings.forEach(mapping => {
        mapped[mapping.target] = row[mapping.source];
      });
      
      return mapped;
    });

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await importKnowledge.mutateAsync({
        platform_id: currentPlatform.id,
        data: mappedData,
        format: parsedData.format,
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResults({
        success: selectedRows.length,
        failed: 0,
        errors: [],
      });
      setStep('complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'import';
      setImportResults({
        success: 0,
        failed: selectedRows.length,
        errors: [errorMessage],
      });
      setStep('complete');
    }
  };

  const handleDownloadTemplate = (format: 'json' | 'csv') => {
    const content = format === 'json' ? SAMPLE_JSON : SAMPLE_CSV;
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-template.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setStep('upload');
    setSelectedFile(null);
    setParsedData(null);
    setFieldMappings([]);
    setSelectedRows([]);
    setImportProgress(0);
    setImportResults(null);
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
        <span className="text-foreground">{t('knowledge.import.title')}</span>
      </nav>

      <PageHeader
        title={t('knowledge.import.title')}
        description={t('knowledge.import.description')}
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {['upload', 'mapping', 'preview', 'importing', 'complete'].map((s, idx) => (
          <React.Fragment key={s}>
            {idx > 0 && <div className="w-8 h-px bg-border" />}
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === s && 'bg-primary text-primary-foreground',
              ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > idx && 'bg-green-500 text-white',
              ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) < idx && 'bg-muted text-muted-foreground'
            )}>
              {['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > idx ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                idx + 1
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle>{t('knowledge.import.upload.title')}</CardTitle>
              <CardDescription>
                {t('knowledge.import.upload.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  'hover:border-primary hover:bg-primary/5'
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">{t('knowledge.import.upload.dropzone')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  JSON ou CSV uniquement
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={() => handleDownloadTemplate('json')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Template JSON
                </Button>
                <Button variant="outline" onClick={() => handleDownloadTemplate('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle>{t('knowledge.import.format.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="json">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="csv">CSV</TabsTrigger>
                </TabsList>
                <TabsContent value="json">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {SAMPLE_JSON}
                  </pre>
                </TabsContent>
                <TabsContent value="csv">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {SAMPLE_CSV}
                  </pre>
                </TabsContent>
              </Tabs>

              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm">Types disponibles :</h4>
                <div className="flex flex-wrap gap-1">
                  {KNOWLEDGE_TYPES.map(type => (
                    <Badge key={type.value} variant="outline" className="text-xs">
                      {type.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'mapping' && parsedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('knowledge.import.mapping.title')}</CardTitle>
                <CardDescription>
                  {t('knowledge.import.mapping.description')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedFile?.name}</span>
                <Badge variant="outline">{parsedData.format.toUpperCase()}</Badge>
                <Badge variant="secondary">{parsedData.rows.length} lignes</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colonne source</TableHead>
                  <TableHead>
                    <ArrowRight className="h-4 w-4" />
                  </TableHead>
                  <TableHead>Champ cible</TableHead>
                  <TableHead>Aperçu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.headers.map(header => (
                  <TableRow key={header}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={getMappingForSource(header)}
                        onValueChange={(value) => updateMapping(header, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Ignorer ce champ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ignorer</SelectItem>
                          {TARGET_FIELDS.map(field => (
                            <SelectItem
                              key={field.key}
                              value={field.key}
                              disabled={fieldMappings.some(m => m.target === field.key && m.source !== header)}
                            >
                              {field.label}
                              {field.required && ' *'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {parsedData.rows[0]?.[header] || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!requiredFieldsMapped && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Champs requis manquants</AlertTitle>
                <AlertDescription>
                  Les champs Type, Titre et Contenu sont obligatoires.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={resetImport}>
                Retour
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!requiredFieldsMapped}
              >
                Aperçu
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && parsedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('knowledge.import.preview.title')}</CardTitle>
                <CardDescription>
                  Sélectionnez les lignes à importer
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {selectedRows.length} / {parsedData.rows.length} sélectionnées
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRows.length === parsedData.rows.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows(parsedData.rows.map((_, idx) => idx));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                      />
                    </TableHead>
                    {fieldMappings.map(mapping => (
                      <TableHead key={mapping.target}>
                        {TARGET_FIELDS.find(f => f.key === mapping.target)?.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(idx)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRows([...selectedRows, idx]);
                            } else {
                              setSelectedRows(selectedRows.filter(i => i !== idx));
                            }
                          }}
                        />
                      </TableCell>
                      {fieldMappings.map(mapping => (
                        <TableCell key={mapping.target} className="max-w-xs truncate">
                          {row[mapping.source] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Retour
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedRows.length === 0}
              >
                Importer {selectedRows.length} éléments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'importing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium">Import en cours...</h3>
            <Progress value={importProgress} className="w-64 mt-4" />
            <p className="text-sm text-muted-foreground mt-2">
              {importProgress}% terminé
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && importResults && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {importResults.failed === 0 ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">Import terminé !</h3>
                <p className="text-muted-foreground mt-2">
                  {importResults.success} éléments importés avec succès
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-lg font-medium">Import échoué</h3>
                <p className="text-muted-foreground mt-2">
                  {importResults.failed} erreurs sur {importResults.success + importResults.failed} éléments
                </p>
                {importResults.errors.length > 0 && (
                  <Alert variant="destructive" className="mt-4 max-w-md">
                    <AlertDescription>
                      {importResults.errors.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={resetImport}>
                Nouvel import
              </Button>
              <Button onClick={() => navigate('/settings/knowledge')}>
                Voir les connaissances
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
