/**
 * Prompt Preview Component
 * File 254 - Preview prompts generated from brand sections
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Code,
  Copy,
  Check,
  Play,
  Loader2,
  Variable,
  FileText,
  Layout,
  FileSearch,
  Building2,
  Newspaper,
  Sparkles,
  Settings2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { useBrandSections, useStyleSettings } from '@/hooks/useBrandValidation';
import {
  BrandSection,
  BrandSectionType,
  StyleSettings,
  BRAND_SECTION_TYPES,
  getBrandSectionTypeMetadata,
} from '@/types/brand';
import { cn } from '@/lib/utils';

// Content type configuration
const CONTENT_TYPES = [
  { value: 'article', label: 'Article', icon: FileText, description: 'Articles de blog' },
  { value: 'landing', label: 'Landing', icon: Layout, description: 'Pages de destination' },
  { value: 'comparative', label: 'Comparatif', icon: FileSearch, description: 'Pages comparatives' },
  { value: 'pillar', label: 'Pilier', icon: Building2, description: 'Pages piliers SEO' },
  { value: 'press', label: 'Presse', icon: Newspaper, description: 'Communiqués presse' },
];

// Sample variables for preview
const SAMPLE_VARIABLES = {
  platform_name: 'SOS-Expat',
  platform_url: 'https://sos-expat.com',
  country: 'France',
  city: 'Paris',
  service_type: 'Assistance juridique',
  year: new Date().getFullYear().toString(),
  current_date: new Date().toLocaleDateString('fr-FR'),
};

interface PromptPreviewProps {
  platformId: number;
  onTestGeneration?: (prompt: string, contentType: string) => void;
  showTestButton?: boolean;
}

export function PromptPreview({
  platformId,
  onTestGeneration,
  showTestButton = true,
}: PromptPreviewProps) {
  const { t } = useTranslation();

  // State
  const [activeContentType, setActiveContentType] = useState('article');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showVariables, setShowVariables] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // API hooks
  const { data: sections, isLoading: sectionsLoading } = useBrandSections(platformId);
  const { data: styleSettings, isLoading: styleLoading } = useStyleSettings(platformId);

  // Group sections by type
  const sectionsByType = useMemo(() => {
    if (!sections) return {};
    return sections.reduce((acc, section) => {
      if (!acc[section.section_type]) acc[section.section_type] = [];
      acc[section.section_type].push(section);
      return acc;
    }, {} as Record<string, BrandSection[]>);
  }, [sections]);

  // Generate full prompt for content type
  const generatePrompt = useMemo(() => {
    if (!sections || !styleSettings) return '';

    const parts: string[] = [];

    // Header
    parts.push('# Instructions de génération de contenu');
    parts.push('');

    // Content type specific instructions
    parts.push(`## Type de contenu: ${CONTENT_TYPES.find(t => t.value === activeContentType)?.label}`);
    parts.push('');

    // Identity sections
    const identitySections = ['mission', 'vision', 'values'];
    identitySections.forEach(type => {
      const section = sectionsByType[type]?.[0];
      if (section) {
        const metadata = getBrandSectionTypeMetadata(type as BrandSectionType);
        parts.push(`### ${metadata?.label || type}`);
        parts.push(section.content);
        parts.push('');
      }
    });

    // Voice sections
    const voiceSections = ['tone', 'personality', 'audience'];
    voiceSections.forEach(type => {
      const section = sectionsByType[type]?.[0];
      if (section) {
        const metadata = getBrandSectionTypeMetadata(type as BrandSectionType);
        parts.push(`### ${metadata?.label || type}`);
        parts.push(section.content);
        parts.push('');
      }
    });

    // Style settings
    parts.push('## Paramètres de style');
    parts.push('');
    parts.push(`- Formalité: ${styleSettings.formality}% (${styleSettings.formality > 70 ? 'formel' : styleSettings.formality > 30 ? 'équilibré' : 'décontracté'})`);
    parts.push(`- Convivialité: ${styleSettings.friendliness}%`);
    parts.push(`- Enthousiasme: ${styleSettings.enthusiasm}%`);
    parts.push(`- Longueur des phrases: ${styleSettings.sentence_length === 'short' ? 'courtes' : styleSettings.sentence_length === 'long' ? 'longues' : 'moyennes'}`);
    parts.push(`- Niveau de vocabulaire: ${styleSettings.vocabulary_level === 'simple' ? 'simple' : styleSettings.vocabulary_level === 'expert' ? 'expert' : 'standard'}`);
    parts.push('');

    // Vocabulary
    if (styleSettings.vocabulary && styleSettings.vocabulary.length > 0) {
      parts.push('### Vocabulaire à privilégier');
      parts.push(styleSettings.vocabulary.join(', '));
      parts.push('');
    }

    // Forbidden terms
    if (styleSettings.forbidden_terms && styleSettings.forbidden_terms.length > 0) {
      parts.push('### Termes à éviter');
      parts.push(styleSettings.forbidden_terms.join(', '));
      parts.push('');
    }

    // Content sections
    const contentSections = ['examples', 'templates', 'vocabulary'];
    contentSections.forEach(type => {
      const section = sectionsByType[type]?.[0];
      if (section) {
        const metadata = getBrandSectionTypeMetadata(type as BrandSectionType);
        parts.push(`### ${metadata?.label || type}`);
        parts.push(section.content);
        parts.push('');
      }
    });

    // Rules sections
    const rulesSections = ['formatting', 'guidelines', 'donts'];
    rulesSections.forEach(type => {
      const section = sectionsByType[type]?.[0];
      if (section) {
        const metadata = getBrandSectionTypeMetadata(type as BrandSectionType);
        parts.push(`### ${metadata?.label || type}`);
        parts.push(section.content);
        parts.push('');
      }
    });

    return parts.join('\n');
  }, [sections, styleSettings, activeContentType, sectionsByType]);

  // Replace variables in prompt
  const promptWithVariables = useMemo(() => {
    let result = generatePrompt;
    Object.entries(SAMPLE_VARIABLES).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  }, [generatePrompt]);

  // Handle copy
  const handleCopy = async (content: string, sectionId?: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedSection(sectionId || 'full');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Handle test generation
  const handleTestGeneration = async () => {
    if (!onTestGeneration) return;
    setIsGenerating(true);
    try {
      await onTestGeneration(promptWithVariables, activeContentType);
    } finally {
      setIsGenerating(false);
    }
  };

  // Highlight variables in content
  const highlightContent = (content: string) => {
    if (!showVariables) return content;
    
    let highlighted = content;
    Object.keys(SAMPLE_VARIABLES).forEach(key => {
      highlighted = highlighted.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        `<mark class="bg-yellow-200 px-1 rounded-sm font-mono text-sm">{{${key}}}</mark>`
      );
    });
    return highlighted;
  };

  const isLoading = sectionsLoading || styleLoading;

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
      {/* Content Type Tabs */}
      <Tabs value={activeContentType} onValueChange={setActiveContentType}>
        <div className="flex items-center justify-between">
          <TabsList>
            {CONTENT_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.value} value={type.value} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {type.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVariables(!showVariables)}
                  >
                    <Variable className={cn('h-4 w-4', showVariables && 'text-yellow-600')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showVariables ? 'Masquer les variables' : 'Afficher les variables'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(showVariables ? generatePrompt : promptWithVariables)}
            >
              {copiedSection === 'full' ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copier tout
            </Button>

            {showTestButton && onTestGeneration && (
              <Button
                onClick={handleTestGeneration}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Tester
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        {CONTENT_TYPES.map(type => (
          <TabsContent key={type.value} value={type.value} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Prompt Preview */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Prompt généré
                      </CardTitle>
                      <Badge variant="outline">
                        {generatePrompt.length} caractères
                      </Badge>
                    </div>
                    <CardDescription>
                      Prompt complet pour la génération de {type.description.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div
                        className="prose prose-sm max-w-none font-mono text-sm whitespace-pre-wrap p-4 bg-muted rounded-lg"
                        dangerouslySetInnerHTML={{
                          __html: highlightContent(generatePrompt),
                        }}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Sections Sidebar */}
              <div className="space-y-4">
                {/* Variables Card */}
                {showVariables && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Variable className="h-4 w-4" />
                        Variables dynamiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {Object.entries(SAMPLE_VARIABLES).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <code className="text-xs bg-white px-1 rounded">
                              {`{{${key}}}`}
                            </code>
                            <span className="text-muted-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sections List */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Sections incluses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {BRAND_SECTION_TYPES.map(sectionType => {
                        const hasSection = sectionsByType[sectionType.value]?.length > 0;
                        return (
                          <div
                            key={sectionType.value}
                            className={cn(
                              'flex items-center justify-between p-2 rounded text-sm',
                              hasSection ? 'bg-green-50' : 'bg-gray-50'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: sectionType.color }}
                              />
                              <span>{sectionType.label}</span>
                            </div>
                            {hasSection ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Non configuré</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Style Preview */}
                {styleSettings && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Paramètres de style
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Formalité</span>
                          <Badge variant="outline">{styleSettings.formality}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Convivialité</span>
                          <Badge variant="outline">{styleSettings.friendliness}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Vocabulaire</span>
                          <Badge variant="outline">
                            {styleSettings.vocabulary?.length || 0} termes
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Interdits</span>
                          <Badge variant="outline">
                            {styleSettings.forbidden_terms?.length || 0} termes
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Optimization Tips */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Conseils
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Ajoutez plus d'exemples concrets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Définissez des templates de phrases</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Précisez les termes interdits</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default PromptPreview;
