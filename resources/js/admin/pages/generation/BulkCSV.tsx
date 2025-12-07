/**
 * Bulk CSV Import Page
 * Upload and process CSV files for bulk generation
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { BulkUploader, type BulkUploadConfig } from '@/components/generation/BulkUploader';
import { CsvPreviewTable } from '@/components/generation/CsvPreviewTable';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import type { BulkUploadPreview, BulkUploadRow } from '@/types/generation';

type ProcessingStatus = 'idle' | 'uploading' | 'validating' | 'processing' | 'completed' | 'error';

// Parse CSV string into rows
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    // Handle quoted values with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  });

  return { headers, rows };
}

// Validate a single row
function validateRow(data: Record<string, string>, _rowNumber: number): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field: title/titre
  const title = data['title'] || data['titre'];
  if (!title || title.trim() === '') {
    errors.push('Titre manquant');
  }

  // Recommended fields
  const country = data['country'] || data['pays'];
  const language = data['language'] || data['langue'];
  const platform = data['platform'] || data['plateforme'];

  if (!country || country.trim() === '') {
    warnings.push('Pays non spécifié');
  }

  if (!language || language.trim() === '') {
    warnings.push('Langue non spécifiée');
  }

  if (!platform || platform.trim() === '') {
    warnings.push('Plateforme non spécifiée');
  }

  // Description length warning
  const description = data['description'];
  if (description && description.length < 20) {
    warnings.push('Description trop courte');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function BulkCSVPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { toast } = useToast();
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [preview, setPreview] = useState<BulkUploadPreview | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: Array<{ line: number; error: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleUpload = async (file: File) => {
    setStatus('uploading');
    setError(null);
    setCurrentFile(file);

    try {
      // Read file content
      setUploadProgress(20);
      const content = await file.text();
      setUploadProgress(50);

      // Parse CSV
      setStatus('validating');
      const { headers, rows } = parseCSV(content);
      setUploadProgress(80);

      if (headers.length === 0 || rows.length === 0) {
        throw new Error('Le fichier CSV est vide ou mal formaté');
      }

      // Normalize headers
      const normalizedHeaders = headers.map(h => h.toLowerCase());

      // Build preview data
      const sampleRows: BulkUploadRow[] = rows.slice(0, 50).map((row, index) => {
        const data: Record<string, string> = {};
        normalizedHeaders.forEach((header, i) => {
          data[header] = row[i] || '';
        });

        const validation = validateRow(data, index + 1);

        return {
          rowNumber: index + 2, // +2 for 1-indexed and header row
          data,
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      });

      // Count valid rows
      const validRows = sampleRows.filter(r => r.isValid).length;

      // Detect column mappings
      const suggestedMappings = normalizedHeaders.map(col => {
        const mappings: Record<string, string> = {
          'title': 'title',
          'titre': 'title',
          'description': 'description',
          'country': 'country',
          'pays': 'country',
          'language': 'language',
          'langue': 'language',
          'platform': 'platform',
          'plateforme': 'platform',
          'theme': 'theme',
        };

        return {
          csvColumn: col,
          targetField: mappings[col] || col,
          isRequired: col === 'title' || col === 'titre',
        };
      });

      setUploadProgress(100);

      const previewData: BulkUploadPreview = {
        filename: file.name,
        totalRows: rows.length,
        validRows,
        columns: headers,
        sampleRows,
        suggestedMappings,
      };

      setPreview(previewData);
      setStatus('idle');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'upload du fichier';
      setError(message);
      setStatus('error');
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleProcess = async (config: BulkUploadConfig) => {
    if (!preview || !currentFile) return;

    setStatus('processing');
    setProcessingProgress(0);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('auto_queue', config.autoQueue ? 'true' : 'false');

      // Upload to API
      setProcessingProgress(20);

      const response = await api.post('/manual-titles/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded / progressEvent.total) * 80) + 20
            : 50;
          setProcessingProgress(Math.min(progress, 95));
        },
      });

      setProcessingProgress(100);

      if (response.data.success) {
        setResults({
          total: preview.totalRows,
          success: response.data.data.created,
          failed: response.data.data.errors_count || 0,
          errors: response.data.data.errors || [],
        });
        setStatus('completed');

        toast({
          title: 'Import réussi',
          description: `${response.data.data.created} titres importés avec succès`,
        });
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'import');
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du traitement';
      setError(message);
      setStatus('error');
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleEditCell = useCallback((rowIndex: number, column: string, value: string) => {
    if (!preview) return;

    const updatedRows = [...preview.sampleRows];
    const newData = {
      ...updatedRows[rowIndex].data,
      [column]: value,
    };

    // Re-validate row
    const validation = validateRow(newData, rowIndex + 1);

    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      data: newData,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    };

    // Recalculate valid rows count
    const validRows = updatedRows.filter(r => r.isValid).length;

    setPreview({ ...preview, sampleRows: updatedRows, validRows });
  }, [preview]);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    if (!preview) return;

    const updatedRows = preview.sampleRows.filter((_, i) => i !== rowIndex);
    const validRows = updatedRows.filter(r => r.isValid).length;

    setPreview({
      ...preview,
      sampleRows: updatedRows,
      totalRows: preview.totalRows - 1,
      validRows,
    });
  }, [preview]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setPreview(null);
    setResults(null);
    setError(null);
    setCurrentFile(null);
    setUploadProgress(0);
    setProcessingProgress(0);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/generation')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import CSV</h1>
          <p className="text-muted-foreground">
            Importez des titres en masse pour la génération
          </p>
        </div>
      </div>

      {/* Status: Completed */}
      {status === 'completed' && results && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Import terminé</h3>
                <p className="text-muted-foreground">
                  {results.success} articles ajoutés à la queue
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{results.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{results.success}</p>
                <p className="text-xs text-muted-foreground">Réussis</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                <p className="text-xs text-muted-foreground">Échoués</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="font-medium text-red-800 mb-2">Erreurs ({results.errors.length})</p>
                <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                  {results.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>Ligne {err.line}: {err.error}</li>
                  ))}
                  {results.errors.length > 10 && (
                    <li className="font-medium">... et {results.errors.length - 10} autres erreurs</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => navigate('/generation/queue')}>
                Voir la queue
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Nouvel import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status: Processing */}
      {status === 'processing' && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div>
                <h3 className="font-semibold">Traitement en cours...</h3>
                <p className="text-sm text-muted-foreground">
                  Ajout des articles à la queue de génération
                </p>
              </div>
            </div>
            <ProgressBar value={processingProgress} className="mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              {processingProgress}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Erreur</h3>
                <p className="text-red-700">{error}</p>
              </div>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={handleReset}
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload / Config */}
      {(status === 'idle' || status === 'uploading' || status === 'validating') && !preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Télécharger un fichier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BulkUploader
              onUpload={handleUpload}
              onProcess={handleProcess}
              isUploading={status === 'uploading'}
              uploadProgress={uploadProgress}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview & Config */}
      {preview && status === 'idle' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Aperçu des données</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{preview.totalRows} lignes</Badge>
                  <Badge variant={preview.validRows === preview.totalRows ? 'default' : 'destructive'}>
                    {preview.validRows} valides
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CsvPreviewTable
                rows={preview.sampleRows}
                columns={preview.columns}
                mappings={preview.suggestedMappings}
                onEditCell={handleEditCell}
                onDeleteRow={handleDeleteRow}
              />
            </CardContent>
          </Card>

          <BulkUploader
            onUpload={handleUpload}
            onProcess={handleProcess}
            preview={preview}
          />
        </div>
      )}

      {/* Instructions */}
      {status === 'idle' && !preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Format du fichier CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm">
              <p>Le fichier CSV doit contenir au minimum une colonne "titre". Les autres colonnes sont optionnelles :</p>
              <ul>
                <li><strong>titre</strong> ou <strong>title</strong> (requis) : Titre de l'article à générer</li>
                <li><strong>description</strong> : Description ou brief pour l'article</li>
                <li><strong>pays</strong> ou <strong>country</strong> : Code pays (ex: FR, DE, US)</li>
                <li><strong>langue</strong> ou <strong>language</strong> : Code langue (ex: fr, en, de)</li>
                <li><strong>theme</strong> : Thème de l'article</li>
                <li><strong>plateforme</strong> ou <strong>platform</strong> : Code plateforme</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg font-mono text-sm">
              <p className="text-muted-foreground mb-2"># Exemple de fichier CSV</p>
              <p>titre,description,pays,langue,plateforme</p>
              <p>"Guide visa France","Article sur les visas","FR","fr","sos-expat"</p>
              <p>"Working in Germany","Complete guide","DE","en","sos-expat"</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BulkCSVPage;
