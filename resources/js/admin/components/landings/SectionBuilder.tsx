import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Settings,
  Layout,
  Star,
  MessageSquare,
  CreditCard,
  HelpCircle,
  BarChart3,
  Image,
  Table,
  Users,
  HeartHandshake,
  Mail,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { TipTapEditor } from '@/components/editors/TipTapEditor';
import { SectionPreview } from './SectionPreview';
import {
  LandingSection,
  LandingSectionType,
  SectionConfig,
  CreateSectionInput,
  UpdateSectionInput,
} from '@/types/landing';
import { cn } from '@/lib/utils';

interface SectionBuilderProps {
  sections: LandingSection[];
  onAddSection: (data: CreateSectionInput) => void;
  onUpdateSection: (sectionId: number, data: UpdateSectionInput) => void;
  onDeleteSection: (sectionId: number) => void;
  onDuplicateSection: (sectionId: number) => void;
  onReorder: (sectionIds: number[]) => void;
  disabled?: boolean;
}

interface SectionTypeConfig {
  type: LandingSectionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'content' | 'social' | 'conversion' | 'data' | 'custom';
}

const SECTION_TYPES: SectionTypeConfig[] = [
  // Content
  {
    type: 'hero',
    label: 'Hero',
    icon: <Layout className="h-4 w-4" />,
    description: 'Section principale avec titre, image de fond et CTA',
    category: 'content',
  },
  {
    type: 'features',
    label: 'Fonctionnalités',
    icon: <Star className="h-4 w-4" />,
    description: 'Grille de fonctionnalités avec icônes',
    category: 'content',
  },
  {
    type: 'gallery',
    label: 'Galerie',
    icon: <Image className="h-4 w-4" />,
    description: 'Galerie d\'images en grille ou carousel',
    category: 'content',
  },
  // Social Proof
  {
    type: 'testimonials',
    label: 'Témoignages',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Carousel ou grille de témoignages clients',
    category: 'social',
  },
  {
    type: 'team',
    label: 'Équipe',
    icon: <Users className="h-4 w-4" />,
    description: 'Présentation des membres de l\'équipe',
    category: 'social',
  },
  {
    type: 'partners',
    label: 'Partenaires',
    icon: <HeartHandshake className="h-4 w-4" />,
    description: 'Logos des partenaires',
    category: 'social',
  },
  // Conversion
  {
    type: 'pricing',
    label: 'Tarifs',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Tableau de tarification avec plans',
    category: 'conversion',
  },
  {
    type: 'cta',
    label: 'Appel à l\'action',
    icon: <Layout className="h-4 w-4" />,
    description: 'Bannière CTA simple',
    category: 'conversion',
  },
  {
    type: 'contact',
    label: 'Contact',
    icon: <Mail className="h-4 w-4" />,
    description: 'Formulaire de contact',
    category: 'conversion',
  },
  // Data
  {
    type: 'statistics',
    label: 'Statistiques',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Chiffres clés animés',
    category: 'data',
  },
  {
    type: 'comparison',
    label: 'Comparaison',
    icon: <Table className="h-4 w-4" />,
    description: 'Tableau de comparaison',
    category: 'data',
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Questions fréquentes en accordéon',
    category: 'data',
  },
  // Custom
  {
    type: 'custom',
    label: 'Personnalisé',
    icon: <Code className="h-4 w-4" />,
    description: 'Section HTML/CSS personnalisée',
    category: 'custom',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  content: 'Contenu',
  social: 'Preuve sociale',
  conversion: 'Conversion',
  data: 'Données',
  custom: 'Personnalisé',
};

export const SectionBuilder: React.FC<SectionBuilderProps> = ({
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onDuplicateSection,
  onReorder,
  disabled = false,
}) => {
  const { t } = useTranslation(['landing', 'common']);

  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [configSectionId, setConfigSectionId] = useState<number | null>(null);
  const [previewSection, setPreviewSection] = useState<LandingSection | null>(null);

  // Toggle section expanded
  const toggleSection = useCallback((sectionId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, sectionId: number) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedSection === null) return;

      const currentIndex = sections.findIndex((s) => s.id === draggedSection);
      if (currentIndex === targetIndex) return;

      const newSections = [...sections];
      const [movedSection] = newSections.splice(currentIndex, 1);
      newSections.splice(targetIndex, 0, movedSection);

      onReorder(newSections.map((s) => s.id));
      setDraggedSection(null);
    },
    [draggedSection, sections, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSection(null);
  }, []);

  // Add section
  const handleAddSection = useCallback(
    (type: LandingSectionType) => {
      const typeConfig = SECTION_TYPES.find((t) => t.type === type);
      onAddSection({
        type,
        title: typeConfig?.label || 'Nouvelle section',
        order: sections.length,
      });
    },
    [onAddSection, sections.length]
  );

  // Delete section
  const handleDeleteClick = useCallback((sectionId: number) => {
    setSectionToDelete(sectionId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (sectionToDelete !== null) {
      onDeleteSection(sectionToDelete);
    }
    setDeleteDialogOpen(false);
    setSectionToDelete(null);
  }, [sectionToDelete, onDeleteSection]);

  // Toggle visibility
  const toggleVisibility = useCallback(
    (section: LandingSection) => {
      onUpdateSection(section.id, { isVisible: !section.isVisible });
    },
    [onUpdateSection]
  );

  // Open config sheet
  const openConfig = useCallback((sectionId: number) => {
    setConfigSectionId(sectionId);
    setConfigSheetOpen(true);
  }, []);

  // Get section icon
  const getSectionIcon = (type: LandingSectionType) => {
    const config = SECTION_TYPES.find((t) => t.type === type);
    return config?.icon || <Layout className="h-4 w-4" />;
  };

  // Group section types by category
  const sectionTypesByCategory = useMemo(() => {
    const grouped: Record<string, SectionTypeConfig[]> = {};
    SECTION_TYPES.forEach((type) => {
      if (!grouped[type.category]) {
        grouped[type.category] = [];
      }
      grouped[type.category].push(type);
    });
    return grouped;
  }, []);

  // Get section being configured
  const configSection = useMemo(() => {
    if (!configSectionId) return null;
    return sections.find((s) => s.id === configSectionId) || null;
  }, [configSectionId, sections]);

  return (
    <div className="space-y-4">
      {/* Sections List */}
      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Layout className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('landing:sections.empty')}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={disabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('landing:sections.add')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                {Object.entries(sectionTypesByCategory).map(([category, types]) => (
                  <DropdownMenuGroup key={category}>
                    <DropdownMenuLabel>{CATEGORY_LABELS[category]}</DropdownMenuLabel>
                    {types.map((sectionType) => (
                      <DropdownMenuItem
                        key={sectionType.type}
                        onClick={() => handleAddSection(sectionType.type)}
                      >
                        {sectionType.icon}
                        <div className="ml-2">
                          <p className="font-medium">{sectionType.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {sectionType.description}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'transition-all',
                draggedSection === section.id && 'opacity-50',
                !section.isVisible && 'opacity-60'
              )}
            >
              <Collapsible
                open={expandedSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card className={cn(!section.isVisible && 'border-dashed')}>
                  <CardHeader className="p-3">
                    <div className="flex items-center gap-2">
                      {/* Drag Handle */}
                      <div
                        className={cn(
                          'cursor-grab',
                          disabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Expand Toggle */}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      {/* Section Icon & Type */}
                      <div className="flex items-center gap-2">
                        {getSectionIcon(section.type)}
                        <Badge variant="secondary" className="text-xs">
                          {SECTION_TYPES.find((t) => t.type === section.type)?.label ||
                            section.type}
                        </Badge>
                      </div>

                      {/* Section Title */}
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          onUpdateSection(section.id, { title: e.target.value })
                        }
                        className="flex-1 h-8 text-sm font-medium"
                        disabled={disabled}
                      />

                      {/* Visibility Badge */}
                      {!section.isVisible && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Masqué
                        </Badge>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setPreviewSection(section)}
                          disabled={disabled}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleVisibility(section)}
                          disabled={disabled}
                        >
                          {section.isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openConfig(section.id)}
                          disabled={disabled}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onDuplicateSection(section.id)}
                          disabled={disabled}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteClick(section.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      {/* Subtitle */}
                      <div className="mb-4">
                        <Input
                          value={section.subtitle || ''}
                          onChange={(e) =>
                            onUpdateSection(section.id, { subtitle: e.target.value })
                          }
                          placeholder={t('landing:sections.subtitlePlaceholder')}
                          className="text-sm"
                          disabled={disabled}
                        />
                      </div>

                      {/* Content Editor for applicable sections */}
                      {['hero', 'cta', 'custom'].includes(section.type) && (
                        <div className="border rounded-lg">
                          <TipTapEditor
                            content={section.content || ''}
                            onChange={(content) =>
                              onUpdateSection(section.id, { content })
                            }
                            placeholder={t('landing:sections.contentPlaceholder')}
                            disabled={disabled}
                          />
                        </div>
                      )}

                      {/* Section-specific placeholder */}
                      {['features', 'testimonials', 'pricing', 'faq', 'statistics', 'gallery', 'comparison', 'team', 'partners', 'contact'].includes(section.type) && (
                        <div className="text-center py-6 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">
                            {t(`landing:sections.${section.type}Placeholder`)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfig(section.id)}
                            disabled={disabled}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {t('landing:sections.configure')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          ))}
        </div>
      )}

      {/* Add Section Button */}
      {sections.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full border-dashed" disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              {t('landing:sections.add')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {Object.entries(sectionTypesByCategory).map(([category, types]) => (
              <DropdownMenuGroup key={category}>
                <DropdownMenuLabel>{CATEGORY_LABELS[category]}</DropdownMenuLabel>
                {types.map((sectionType) => (
                  <DropdownMenuItem
                    key={sectionType.type}
                    onClick={() => handleAddSection(sectionType.type)}
                  >
                    {sectionType.icon}
                    <span className="ml-2">{sectionType.label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('landing:dialogs.deleteSection.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('landing:dialogs.deleteSection.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Config Sheet */}
      <Sheet open={configSheetOpen} onOpenChange={setConfigSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {t('landing:sections.configureTitle')} -{' '}
              {configSection
                ? SECTION_TYPES.find((t) => t.type === configSection.type)?.label
                : ''}
            </SheetTitle>
            <SheetDescription>
              {t('landing:sections.configureDescription')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {/* Section config form would go here based on section type */}
            <p className="text-sm text-muted-foreground">
              Configuration spécifique pour ce type de section.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Section Preview Dialog */}
      {previewSection && (
        <SectionPreview
          section={previewSection}
          open={!!previewSection}
          onClose={() => setPreviewSection(null)}
        />
      )}
    </div>
  );
};

export default SectionBuilder;
