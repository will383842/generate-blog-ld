import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  BarChart3,
  Table,
  Quote,
  List,
  Settings,
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
import { TipTapEditor } from '@/components/editors/TipTapEditor';
import { DossierSection, DossierSectionType } from '@/types/press';
import { cn } from '@/lib/utils';

interface SectionManagerProps {
  sections: DossierSection[];
  onAddSection: (type: DossierSectionType, title: string) => void;
  onUpdateSection: (sectionId: number, data: Partial<DossierSection>) => void;
  onDeleteSection: (sectionId: number) => void;
  onReorder: (sectionIds: number[]) => void;
  disabled?: boolean;
}

interface SectionTypeConfig {
  type: DossierSectionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTION_TYPES: SectionTypeConfig[] = [
  {
    type: 'introduction',
    label: 'Introduction',
    icon: <FileText className="h-4 w-4" />,
    description: 'Section d\'introduction du dossier',
  },
  {
    type: 'content',
    label: 'Contenu',
    icon: <FileText className="h-4 w-4" />,
    description: 'Section de contenu libre',
  },
  {
    type: 'statistics',
    label: 'Statistiques',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Tableau de statistiques avec données',
  },
  {
    type: 'gallery',
    label: 'Galerie',
    icon: <Image className="h-4 w-4" />,
    description: 'Galerie de photos',
  },
  {
    type: 'chart',
    label: 'Graphique',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Graphique interactif',
  },
  {
    type: 'table',
    label: 'Tableau',
    icon: <Table className="h-4 w-4" />,
    description: 'Tableau de données',
  },
  {
    type: 'quote',
    label: 'Citation',
    icon: <Quote className="h-4 w-4" />,
    description: 'Citation mise en avant',
  },
  {
    type: 'key_points',
    label: 'Points clés',
    icon: <List className="h-4 w-4" />,
    description: 'Liste de points importants',
  },
  {
    type: 'conclusion',
    label: 'Conclusion',
    icon: <FileText className="h-4 w-4" />,
    description: 'Section de conclusion',
  },
];

export const SectionManager: React.FC<SectionManagerProps> = ({
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorder,
  disabled = false,
}) => {
  const { t } = useTranslation(['press', 'common']);

  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);

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

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, sectionId: number) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId.toString());
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
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

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedSection(null);
  }, []);

  // Add section handler
  const handleAddSection = useCallback(
    (type: DossierSectionType) => {
      const typeConfig = SECTION_TYPES.find((t) => t.type === type);
      const title = typeConfig?.label || 'Nouvelle section';
      onAddSection(type, title);
    },
    [onAddSection]
  );

  // Confirm delete
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

  // Get section icon
  const getSectionIcon = (type: DossierSectionType) => {
    const config = SECTION_TYPES.find((t) => t.type === type);
    return config?.icon || <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Sections List */}
      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              {t('press:sections.empty')}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={disabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('press:sections.add')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {SECTION_TYPES.map((sectionType) => (
                  <DropdownMenuItem
                    key={sectionType.type}
                    onClick={() => handleAddSection(sectionType.type)}
                  >
                    {sectionType.icon}
                    <span className="ml-2">{sectionType.label}</span>
                  </DropdownMenuItem>
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
                draggedSection === section.id && 'opacity-50'
              )}
            >
              <Collapsible
                open={expandedSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card>
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

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={disabled}
                        >
                          <Settings className="h-4 w-4" />
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
                      {/* Content Editor */}
                      {['introduction', 'content', 'conclusion'].includes(section.type) && (
                        <div className="border rounded-lg">
                          <TipTapEditor
                            content={section.content || ''}
                            onChange={(content) =>
                              onUpdateSection(section.id, { content })
                            }
                            placeholder={t('press:sections.contentPlaceholder')}
                            disabled={disabled}
                          />
                        </div>
                      )}

                      {/* Quote Section */}
                      {section.type === 'quote' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              {t('press:sections.quoteText')}
                            </label>
                            <textarea
                              value={section.content || ''}
                              onChange={(e) =>
                                onUpdateSection(section.id, { content: e.target.value })
                              }
                              className="w-full min-h-24 p-3 border rounded-lg text-lg italic resize-none"
                              placeholder={t('press:sections.quotePlaceholder')}
                              disabled={disabled}
                            />
                          </div>
                          <Input
                            value={section.config?.author || ''}
                            onChange={(e) =>
                              onUpdateSection(section.id, {
                                config: { ...section.config, author: e.target.value },
                              })
                            }
                            placeholder={t('press:sections.quoteAuthor')}
                            disabled={disabled}
                          />
                        </div>
                      )}

                      {/* Key Points Section */}
                      {section.type === 'key_points' && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {t('press:sections.keyPointsDescription')}
                          </p>
                          <div className="border rounded-lg">
                            <TipTapEditor
                              content={section.content || ''}
                              onChange={(content) =>
                                onUpdateSection(section.id, { content })
                              }
                              placeholder={t('press:sections.keyPointsPlaceholder')}
                              disabled={disabled}
                            />
                          </div>
                        </div>
                      )}

                      {/* Gallery, Statistics, Chart, Table - Show placeholder */}
                      {['gallery', 'statistics', 'chart', 'table'].includes(
                        section.type
                      ) && (
                        <div className="text-center py-8 bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground">
                            {t(`press:sections.${section.type}Placeholder`)}
                          </p>
                          <Button variant="outline" className="mt-2" disabled={disabled}>
                            {t(`press:sections.configure${section.type.charAt(0).toUpperCase() + section.type.slice(1)}`)}
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
              {t('press:sections.add')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {SECTION_TYPES.map((sectionType) => (
              <DropdownMenuItem
                key={sectionType.type}
                onClick={() => handleAddSection(sectionType.type)}
              >
                {sectionType.icon}
                <div className="ml-2">
                  <p className="font-medium">{sectionType.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {sectionType.description}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('press:dialogs.deleteSection.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('press:dialogs.deleteSection.description')}
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
    </div>
  );
};

export default SectionManager;
