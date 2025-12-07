/**
 * Brand Section Editor Component
 * File 249 - TipTap editor for brand book sections with multi-language support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Save,
  Loader2,
  ChevronDown,
  Eye,
  Code,
  Variable,
  Sparkles,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
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
import { TipTapEditor } from '@/components/ui/TipTapEditor';
import { useDebounce } from '@/hooks/useDebounce';
import {
  BrandSection,
  BrandSectionWithTranslations,
  BrandSectionType,
  BRAND_SECTION_TYPES,
  getBrandSectionTypeMetadata,
} from '@/types/brand';
import { cn } from '@/lib/utils';

const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

// Available variables for brand sections
const BRAND_VARIABLES = [
  { key: '{{platform_name}}', label: 'Nom plateforme', description: 'Le nom de la plateforme' },
  { key: '{{platform_url}}', label: 'URL plateforme', description: 'L\'URL du site' },
  { key: '{{country}}', label: 'Pays', description: 'Le pays cible' },
  { key: '{{city}}', label: 'Ville', description: 'La ville cible' },
  { key: '{{service_type}}', label: 'Type service', description: 'Le type de service' },
  { key: '{{year}}', label: 'Année', description: 'L\'année en cours' },
  { key: '{{current_date}}', label: 'Date', description: 'La date actuelle' },
];

interface BrandSectionEditorProps {
  section?: BrandSectionWithTranslations | null;
  platformId: number;
  defaultSectionType?: BrandSectionType;
  onSave?: (data: Partial<BrandSection>) => void;
  onAutoSave?: (data: Partial<BrandSection>) => void;
  autoSaveDelay?: number;
  isLoading?: boolean;
  isSaving?: boolean;
}

export function BrandSectionEditor({
  section,
  platformId,
  defaultSectionType = 'mission',
  onSave,
  onAutoSave,
  autoSaveDelay = 2000,
  isLoading = false,
  isSaving = false,
}: BrandSectionEditorProps) {
  const { t } = useTranslation();

  // Form state
  const [sectionType, setSectionType] = useState<BrandSectionType>(
    section?.section_type ?? defaultSectionType
  );
  const [content, setContent] = useState(section?.content ?? '');
  const [sourceLanguage, setSourceLanguage] = useState(section?.language_code ?? 'fr');
  const [activeLanguage, setActiveLanguage] = useState(sourceLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize translations
  useEffect(() => {
    if (section?.translations) {
      const translationMap: Record<string, string> = {};
      Object.entries(section.translations).forEach(([lang, data]) => {
        translationMap[lang] = data.content;
      });
      setTranslations(translationMap);
    }
  }, [section]);

  // Reset form when section changes
  useEffect(() => {
    if (section) {
      setSectionType(section.section_type);
      setContent(section.content);
      setSourceLanguage(section.language_code);
      setActiveLanguage(section.language_code);
      setHasUnsavedChanges(false);
    }
  }, [section?.id]);

  // Build form data
  const getFormData = useCallback(() => ({
    section_type: sectionType,
    content: activeLanguage === sourceLanguage ? content : translations[activeLanguage] ?? '',
    language_code: sourceLanguage,
  }), [sectionType, content, sourceLanguage, activeLanguage, translations]);

  // Auto-save with debounce
  const debouncedData = useDebounce(getFormData(), autoSaveDelay);

  useEffect(() => {
    if (onAutoSave && hasUnsavedChanges && section?.id) {
      onAutoSave(debouncedData);
      setHasUnsavedChanges(false);
    }
  }, [debouncedData, onAutoSave, hasUnsavedChanges, section?.id]);

  // Mark as having unsaved changes
  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Handle content change
  const handleContentChange = (value: string) => {
    if (activeLanguage === sourceLanguage) {
      setContent(value);
    } else {
      setTranslations(prev => ({
        ...prev,
        [activeLanguage]: value,
      }));
    }
    markUnsaved();
  };

  // Get current content for active language
  const currentContent = activeLanguage === sourceLanguage
    ? content
    : translations[activeLanguage] ?? '';

  // Insert variable
  const insertVariable = (variable: string) => {
    handleContentChange(currentContent + ' ' + variable);
  };

  // Handle manual save
  const handleSave = () => {
    if (onSave) {
      onSave(getFormData());
      setHasUnsavedChanges(false);
    }
  };

  // Highlight variables in content
  const highlightVariables = (text: string) => {
    let highlighted = text;
    BRAND_VARIABLES.forEach(v => {
      highlighted = highlighted.replace(
        new RegExp(v.key.replace(/[{}]/g, '\\$&'), 'g'),
        `<mark class="bg-yellow-200 px-1 rounded">${v.key}</mark>`
      );
    });
    return highlighted;
  };

  // Get translation status
  const getTranslationStatus = (lang: string): 'done' | 'pending' | 'missing' => {
    if (lang === sourceLanguage) return 'done';
    if (translations[lang]) return 'done';
    return 'missing';
  };

  const typeMetadata = getBrandSectionTypeMetadata(sectionType);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {typeMetadata && (
            <Badge style={{ backgroundColor: typeMetadata.color }} className="text-white">
              {typeMetadata.label}
            </Badge>
          )}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <Clock className="h-3 w-3 mr-1" />
              {t('common.unsavedChanges')}
            </Badge>
          )}
          {isSaving && (
            <Badge variant="outline">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {t('common.saving')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVariables(!showVariables)}
          >
            <Variable className="h-4 w-4 mr-2" />
            Variables
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Éditeur' : 'Aperçu'}
          </Button>
          {onSave && (
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          )}
        </div>
      </div>

      {/* Section Type Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('brand.sections.type')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={sectionType} onValueChange={(v) => { setSectionType(v as BrandSectionType); markUnsaved(); }}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
              {BRAND_SECTION_TYPES.map(type => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
                  style={{
                    borderColor: sectionType === type.value ? type.color : undefined,
                  }}
                >
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {typeMetadata && (
            <p className="text-sm text-muted-foreground mt-3">
              {typeMetadata.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Variables Panel */}
      <Collapsible open={showVariables} onOpenChange={setShowVariables}>
        <CollapsibleContent>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Variable className="h-4 w-4" />
                Variables disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {BRAND_VARIABLES.map(variable => (
                  <TooltipProvider key={variable.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable.key)}
                          className="font-mono text-xs"
                        >
                          {variable.key}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{variable.label}</p>
                        <p className="text-xs text-muted-foreground">{variable.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Language Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('brand.sections.content')}
            </CardTitle>
            <Badge variant="outline">
              {sourceLanguage.toUpperCase()} = Source
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeLanguage} onValueChange={setActiveLanguage}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              {SUPPORTED_LANGUAGES.map(lang => {
                const status = getTranslationStatus(lang.code);
                const isSource = lang.code === sourceLanguage;

                return (
                  <TabsTrigger
                    key={lang.code}
                    value={lang.code}
                    className={cn(
                      'relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                      'border',
                      isSource && 'border-primary'
                    )}
                  >
                    <span className="mr-1">{lang.flag}</span>
                    {lang.code.toUpperCase()}
                    {!isSource && (
                      <span className="ml-1">
                        {status === 'done' && <Check className="h-3 w-3 text-green-500" />}
                        {status === 'missing' && <AlertCircle className="h-3 w-3 text-gray-400" />}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SUPPORTED_LANGUAGES.map(lang => (
              <TabsContent key={lang.code} value={lang.code}>
                {showPreview ? (
                  <div
                    className="prose prose-sm max-w-none min-h-[300px] p-4 border rounded-lg bg-muted/50"
                    dangerouslySetInnerHTML={{
                      __html: highlightVariables(
                        lang.code === sourceLanguage ? content : translations[lang.code] ?? ''
                      ),
                    }}
                  />
                ) : (
                  <div className="border rounded-lg">
                    <TipTapEditor
                      content={lang.code === sourceLanguage ? content : translations[lang.code] ?? ''}
                      onChange={handleContentChange}
                      placeholder={t('brand.sections.contentPlaceholder')}
                    />
                  </div>
                )}

                {/* AI Translate Button (for non-source languages) */}
                {lang.code !== sourceLanguage && !translations[lang.code] && (
                  <div className="mt-3 flex items-center justify-end">
                    <Button variant="outline" size="sm" disabled>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Traduire avec l'IA
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Prompt Preview */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Aperçu du prompt généré
                </CardTitle>
                <ChevronDown className="h-4 w-4" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                {`## ${typeMetadata?.label || sectionType}\n\n${currentContent || '(Contenu vide)'}`}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export default BrandSectionEditor;
