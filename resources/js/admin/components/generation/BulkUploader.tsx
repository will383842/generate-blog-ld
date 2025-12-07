/**
 * Bulk Uploader
 * CSV/Excel upload with column mapping
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ProgressBar';
import { PLATFORMS } from '@/utils/constants';
import type { PlatformId, LanguageCode } from '@/types/program';
import type { BulkUploadPreview, BulkUploadColumnMapping } from '@/types/generation';

export interface BulkUploaderProps {
  onUpload: (file: File) => void;
  onProcess: (config: BulkUploadConfig) => void;
  preview?: BulkUploadPreview;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export interface BulkUploadConfig {
  platformId: PlatformId;
  defaultLanguageId: LanguageCode;
  columnMappings: BulkUploadColumnMapping[];
  templateId?: string;
  scheduledAt?: string;
}

const MAPPABLE_FIELDS = [
  { value: 'title', label: 'Titre', required: true },
  { value: 'description', label: 'Description', required: false },
  { value: 'country', label: 'Pays (code)', required: false },
  { value: 'language', label: 'Langue (code)', required: false },
  { value: 'theme', label: 'Thème', required: false },
  { value: 'keywords', label: 'Mots-clés', required: false },
  { value: 'ignore', label: '(Ignorer)', required: false },
];

export function BulkUploader({
  onUpload,
  onProcess,
  preview,
  isUploading,
  uploadProgress = 0,
  className,
}: BulkUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<Partial<BulkUploadConfig>>({
    platformId: 'sos-expat' as PlatformId,
    defaultLanguageId: 'fr' as LanguageCode,
    columnMappings: [],
  });
  const [step, setStep] = useState<'upload' | 'mapping' | 'schedule'>('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      onUpload(uploadedFile);
      setStep('mapping');
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const updateMapping = (csvColumn: string, targetField: string) => {
    const newMappings = [...(config.columnMappings || [])];
    const existingIndex = newMappings.findIndex((m) => m.csvColumn === csvColumn);

    if (existingIndex >= 0) {
      newMappings[existingIndex] = {
        ...newMappings[existingIndex],
        targetField,
      };
    } else {
      newMappings.push({
        csvColumn,
        targetField,
        isRequired: MAPPABLE_FIELDS.find((f) => f.value === targetField)?.required || false,
      });
    }

    setConfig({ ...config, columnMappings: newMappings });
  };

  const handleProcess = () => {
    if (config.platformId && config.defaultLanguageId) {
      onProcess(config as BulkUploadConfig);
    }
  };

  const hasTitleMapping = config.columnMappings?.some((m) => m.targetField === 'title');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Step */}
      {step === 'upload' && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-primary bg-primary/5',
            !isDragActive && 'border-gray-300 hover:border-gray-400',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ou cliquez pour sélectionner (CSV, Excel)
          </p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
          <div className="flex-1">
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
              {preview && ` • ${preview.totalRows} lignes • ${preview.columns.length} colonnes`}
            </p>
          </div>
          {isUploading ? (
            <ProgressBar value={uploadProgress} className="w-32" size="sm" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setStep('upload');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Correspondance des colonnes</h3>
            <Badge variant={hasTitleMapping ? 'default' : 'destructive'}>
              {hasTitleMapping ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Titre mappé
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Titre requis
                </>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {preview.columns.map((column) => {
              const currentMapping = config.columnMappings?.find(
                (m) => m.csvColumn === column
              );
              const suggestedMapping = preview.suggestedMappings?.find(
                (m) => m.csvColumn === column
              );

              return (
                <div key={column} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{column}</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.sampleRows[0]?.data[column]?.substring(0, 50) || '-'}
                    </p>
                  </div>
                  <Select
                    value={currentMapping?.targetField || suggestedMapping?.targetField || 'ignore'}
                    onChange={(e) => updateMapping(column, e.target.value)}
                    className="w-40"
                  >
                    {MAPPABLE_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </Select>
                </div>
              );
            })}
          </div>

          <Button
            className="w-full"
            onClick={() => setStep('schedule')}
            disabled={!hasTitleMapping}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Schedule Step */}
      {step === 'schedule' && (
        <div className="space-y-4">
          <h3 className="font-semibold">Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plateforme *</label>
              <Select
                value={config.platformId}
                onChange={(e) =>
                  setConfig({ ...config, platformId: e.target.value as PlatformId })
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Langue par défaut *</label>
              <Select
                value={config.defaultLanguageId}
                onChange={(e) =>
                  setConfig({ ...config, defaultLanguageId: e.target.value as LanguageCode })
                }
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Planifier pour (optionnel)
            </label>
            <Input
              type="datetime-local"
              value={config.scheduledAt?.slice(0, 16) || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Articles à générer</span>
              <span className="font-bold text-xl">{preview?.validRows || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-muted-foreground">Coût estimé</span>
              <span className="font-bold">
                ~${((preview?.validRows || 0) * 0.15).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('mapping')} className="flex-1">
              Retour
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Lancer la génération
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkUploader;
