/**
 * Schema Markup Editor Component
 * File 315 - Edit and validate JSON-LD structured data
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCode,
  Check,
  X,
  AlertTriangle,
  Copy,
  ExternalLink,
  Loader2,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  useSchemaTemplates,
  useSchemaForArticle,
  useGenerateSchema,
  useSaveSchema,
  useValidateSchema,
} from '@/hooks/useSeo';
import { SCHEMA_TYPES, SchemaType } from '@/types/seo';
import { cn } from '@/lib/utils';

interface SchemaMarkupEditorProps {
  articleId?: number;
  onSave?: (schema: Record<string, unknown>) => void;
}

export function SchemaMarkupEditor({ articleId, onSave }: SchemaMarkupEditorProps) {
  const { t } = useTranslation();

  // State
  const [selectedType, setSelectedType] = useState<SchemaType>('Article');
  const [schemaData, setSchemaData] = useState<Record<string, any>>({});
  const [jsonPreview, setJsonPreview] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // API hooks
  const { data: templates } = useSchemaTemplates();
  const { data: existingSchema } = useSchemaForArticle(articleId || 0);
  const generateSchema = useGenerateSchema();
  const saveSchema = useSaveSchema();
  const validateSchema = useValidateSchema();

  // Load existing schema
  useEffect(() => {
    if (existingSchema) {
      setSelectedType(existingSchema.type);
      setSchemaData(existingSchema.data);
    }
  }, [existingSchema]);

  // Update JSON preview
  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': selectedType,
      ...schemaData,
    };
    setJsonPreview(JSON.stringify(jsonLd, null, 2));
  }, [schemaData, selectedType]);

  // Get template for selected type
  const currentTemplate = templates?.find(t => t.type === selectedType);

  // Handle type change
  const handleTypeChange = (type: SchemaType) => {
    setSelectedType(type);
    const template = templates?.find(t => t.type === type);
    if (template) {
      setSchemaData(template.template);
    }
  };

  // Handle field change
  const handleFieldChange = (field: string, value: string | number | boolean | null) => {
    setSchemaData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate from article
  const handleGenerate = () => {
    if (!articleId) return;
    generateSchema.mutate(
      { articleId, type: selectedType },
      {
        onSuccess: (result) => {
          setSchemaData(result.data);
        },
      }
    );
  };

  // Validate schema
  const handleValidate = () => {
    validateSchema.mutate(
      { '@context': 'https://schema.org', '@type': selectedType, ...schemaData },
      {
        onSuccess: (result) => {
          setValidationResult(result);
        },
      }
    );
  };

  // Save schema
  const handleSave = () => {
    if (!articleId) return;
    saveSchema.mutate(
      { articleId, data: schemaData },
      {
        onSuccess: () => {
          onSave?.(schemaData);
        },
      }
    );
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonPreview);
  };

  // Open Google test tool
  const openGoogleTest = () => {
    const encoded = encodeURIComponent(jsonPreview);
    window.open(`https://search.google.com/test/rich-results?code=${encoded}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Éditeur de Schema
          </CardTitle>
          <CardDescription>
            Configurez les données structurées pour améliorer le référencement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type Selector */}
          <div>
            <Label>Type de Schema</Label>
            <Select value={selectedType} onValueChange={(v) => handleTypeChange(v as SchemaType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEMA_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          {articleId && (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={generateSchema.isPending}
              className="w-full"
            >
              {generateSchema.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Générer depuis l'article
            </Button>
          )}

          {/* Fields Editor */}
          <div className="space-y-3">
            {currentTemplate?.requiredFields.map(field => (
              <div key={field}>
                <Label className="flex items-center gap-1">
                  {field}
                  <span className="text-red-500">*</span>
                </Label>
                {field === 'description' || field === 'articleBody' ? (
                  <Textarea
                    value={schemaData[field] || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    value={schemaData[field] || ''}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className="mt-1"
                  />
                )}
              </div>
            ))}

            {currentTemplate?.optionalFields.slice(0, 5).map(field => (
              <div key={field}>
                <Label className="text-muted-foreground">{field}</Label>
                <Input
                  value={schemaData[field] || ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="mt-1"
                  placeholder="Optionnel"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview & Validation */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Aperçu JSON-LD</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={openGoogleTest}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {jsonPreview}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleValidate}
              disabled={validateSchema.isPending}
              className="w-full mb-4"
            >
              {validateSchema.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Valider le schema
            </Button>

            {validationResult && (
              <div className="space-y-3">
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg',
                  validationResult.isValid ? 'bg-green-50' : 'bg-red-50'
                )}>
                  {validationResult.isValid ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={validationResult.isValid ? 'text-green-800' : 'text-red-800'}>
                    {validationResult.isValid ? 'Schema valide' : 'Schema invalide'}
                  </span>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-red-600">
                        <X className="h-4 w-4 mt-0.5 shrink-0" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {articleId && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveSchema.isPending}
              className="flex-1"
            >
              {saveSchema.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={openGoogleTest}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Tester sur Google
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaMarkupEditor;
