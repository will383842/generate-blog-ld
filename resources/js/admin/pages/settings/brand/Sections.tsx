/**
 * Brand Sections Page
 * File 257 - Full page for editing brand book sections
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Globe,
  Code,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useBrandSections,
  useBrandSection,
  useUpdateSection,
  useCreateBrandSection,
} from '@/hooks/useBrandValidation';
import {
  BrandSectionType,
  BRAND_SECTION_TYPES,
  getBrandSectionTypeMetadata,
  getBrandSectionsByCategory,
} from '@/types/brand';
import { BrandSectionEditor } from '@/components/settings/BrandSectionEditor';
import { PromptPreview } from '@/components/settings/PromptPreview';
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

const SECTION_CATEGORIES = [
  { key: 'identity', label: 'Identité', icon: '🎯' },
  { key: 'voice', label: 'Voix', icon: '🗣️' },
  { key: 'content', label: 'Contenu', icon: '📝' },
  { key: 'rules', label: 'Règles', icon: '📋' },
];

export default function BrandSections() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [activeType, setActiveType] = useState<BrandSectionType>(
    (searchParams.get('type') as BrandSectionType) || 'mission'
  );
  const [activeLanguage, setActiveLanguage] = useState('fr');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['identity', 'voice', 'content', 'rules'])
  );

  // API hooks
  const { data: sections, isLoading } = useBrandSections(platformId);
  const updateSection = useUpdateSection();
  const createSection = useCreateBrandSection();

  // Update URL when active type changes
  useEffect(() => {
    setSearchParams({ type: activeType });
  }, [activeType, setSearchParams]);

  // Find current section
  const currentSection = sections?.find(
    s => s.section_type === activeType && s.language_code === activeLanguage
  );

  // Check which sections are configured
  const configuredSections = new Set(
    sections?.map(s => `${s.section_type}-${s.language_code}`) || []
  );

  // Handle save
  const handleSave = (data: { content?: string }) => {
    if (currentSection) {
      updateSection.mutate({
        id: currentSection.id,
        ...data,
      });
    } else {
      createSection.mutate({
        platform_id: platformId,
        section_type: activeType,
        language_code: activeLanguage,
        content: data.content || '',
      });
    }
  };

  // Toggle category
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Count configured per type
  const getConfiguredLanguages = (type: BrandSectionType) => {
    return SUPPORTED_LANGUAGES.filter(
      lang => configuredSections.has(`${type}-${lang.code}`)
    ).length;
  };

  const typeMetadata = getBrandSectionTypeMetadata(activeType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/brand">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Sections du Brand Book
            </h1>
            <p className="text-muted-foreground">
              Configurez le contenu de chaque section
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPromptPreview(!showPromptPreview)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showPromptPreview ? 'Masquer aperçu' : 'Aperçu prompt'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Section Types */}
        <div className="col-span-3">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="p-4 pt-0 space-y-4">
                  {SECTION_CATEGORIES.map(category => {
                    const categorySections = getBrandSectionsByCategory(category.key as 'identity' | 'voice' | 'content' | 'rules');
                    const configuredCount = categorySections.filter(
                      s => getConfiguredLanguages(s.value) > 0
                    ).length;

                    return (
                      <Collapsible
                        key={category.key}
                        open={expandedCategories.has(category.key)}
                        onOpenChange={() => toggleCategory(category.key)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {configuredCount}/{categorySections.length}
                            </Badge>
                            <ChevronRight className={cn(
                              'h-4 w-4 transition-transform',
                              expandedCategories.has(category.key) && 'rotate-90'
                            )} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 mt-1 space-y-1">
                            {categorySections.map(sectionType => {
                              const isActive = activeType === sectionType.value;
                              const configuredLangs = getConfiguredLanguages(sectionType.value);

                              return (
                                <button
                                  key={sectionType.value}
                                  onClick={() => setActiveType(sectionType.value)}
                                  className={cn(
                                    'w-full flex items-center justify-between p-2 rounded text-sm text-left transition-colors',
                                    isActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: sectionType.color }}
                                    />
                                    <span>{sectionType.label}</span>
                                  </div>
                                  {configuredLangs > 0 ? (
                                    <Badge
                                      variant={isActive ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {configuredLangs}/{SUPPORTED_LANGUAGES.length}
                                    </Badge>
                                  ) : (
                                    <Plus className="h-3 w-3 opacity-50" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {/* Language Tabs */}
          <Tabs value={activeLanguage} onValueChange={setActiveLanguage}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="h-auto flex-wrap">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isConfigured = configuredSections.has(`${activeType}-${lang.code}`);
                  return (
                    <TabsTrigger
                      key={lang.code}
                      value={lang.code}
                      className="relative"
                    >
                      <span className="mr-1">{lang.flag}</span>
                      {lang.code.toUpperCase()}
                      {isConfigured && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {typeMetadata && (
                <Badge style={{ backgroundColor: typeMetadata.color }} className="text-white">
                  {typeMetadata.label}
                </Badge>
              )}
            </div>

            {SUPPORTED_LANGUAGES.map(lang => (
              <TabsContent key={lang.code} value={lang.code}>
                <BrandSectionEditor
                  section={currentSection}
                  platformId={platformId}
                  defaultSectionType={activeType}
                  onSave={handleSave}
                  onAutoSave={handleSave}
                  isLoading={isLoading}
                  isSaving={updateSection.isPending || createSection.isPending}
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* Prompt Preview */}
          {showPromptPreview && (
            <>
              <Separator className="my-6" />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Aperçu du prompt généré
                  </CardTitle>
                  <CardDescription>
                    Visualisez comment les sections sont intégrées dans les prompts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PromptPreview
                    platformId={platformId}
                    showTestButton={false}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
