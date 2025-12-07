import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  FileText,
  File,
  Table,
  Archive,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Palette,
  Layout,
  Type,
  Image,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

// Types
interface PdfConfig {
  paperSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: number;
  fontFamily: string;
  headerEnabled: boolean;
  headerText: string;
  footerEnabled: boolean;
  footerText: string;
  pageNumbers: boolean;
  includeTableOfContents: boolean;
  includeMedia: boolean;
  mediaQuality: 'low' | 'medium' | 'high';
  primaryColor: string;
  watermarkEnabled: boolean;
  watermarkText: string;
}

interface WordConfig {
  includeStyles: boolean;
  includeMedia: boolean;
  mediaQuality: 'low' | 'medium' | 'high';
  includeTableOfContents: boolean;
  includeMetadata: boolean;
  trackChanges: boolean;
  templateId: string | null;
}

interface ExcelConfig {
  sheetName: string;
  includeHeaders: boolean;
  includeFormulas: boolean;
  dateFormat: string;
  numberFormat: string;
  autoWidth: boolean;
}

interface GeneralConfig {
  defaultFormat: 'pdf' | 'word' | 'html' | 'zip';
  includeTranslations: boolean;
  defaultLanguage: string;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  retentionDays: number;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
}

const PAPER_SIZES = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'legal', label: 'Legal (8.5 × 14 in)' },
];

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
];

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Basse (rapide)', description: '72 DPI' },
  { value: 'medium', label: 'Moyenne', description: '150 DPI' },
  { value: 'high', label: 'Haute (lent)', description: '300 DPI' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
];

export default function ExportConfigPage() {
  const { t } = useTranslation(['media', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Config states
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    defaultFormat: 'pdf',
    includeTranslations: false,
    defaultLanguage: 'fr',
    compressionLevel: 'medium',
    retentionDays: 30,
    notifyOnComplete: true,
    notifyOnError: true,
  });

  const [pdfConfig, setPdfConfig] = useState<PdfConfig>({
    paperSize: 'a4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    fontSize: 12,
    fontFamily: 'Inter',
    headerEnabled: true,
    headerText: '{title}',
    footerEnabled: true,
    footerText: '{date} - Page {page}/{pages}',
    pageNumbers: true,
    includeTableOfContents: true,
    includeMedia: true,
    mediaQuality: 'medium',
    primaryColor: '#3b82f6',
    watermarkEnabled: false,
    watermarkText: 'DRAFT',
  });

  const [wordConfig, setWordConfig] = useState<WordConfig>({
    includeStyles: true,
    includeMedia: true,
    mediaQuality: 'medium',
    includeTableOfContents: true,
    includeMetadata: true,
    trackChanges: false,
    templateId: null,
  });

  const [excelConfig, setExcelConfig] = useState<ExcelConfig>({
    sheetName: 'Export',
    includeHeaders: true,
    includeFormulas: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '#,##0.00',
    autoWidth: true,
  });

  // Section states
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['layout', 'content'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Save config
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast(t('media:export.config.saved'), 'success');
    } catch (error) {
      showToast(t('common:error.generic'), 'error');
    } finally {
      setSaving(false);
    }
  }, [showToast, t]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    // Reset all configs to defaults
    showToast(t('media:export.config.reset'), 'success');
  }, [showToast, t]);

  // Render section header
  const renderSectionHeader = (
    id: string,
    title: string,
    icon: React.ReactNode,
    description?: string
  ) => (
    <CollapsibleTrigger
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {expandedSections.has(id) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </CollapsibleTrigger>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title={t('media:export.pages.config.title')}
        description={t('media:export.pages.config.description')}
        backLink="/admin/export"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:reset')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('common:save')}
            </Button>
          </div>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="pdf">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </TabsTrigger>
              <TabsTrigger value="word">
                <File className="h-4 w-4 mr-2" />
                Word
              </TabsTrigger>
              <TabsTrigger value="excel">
                <Table className="h-4 w-4 mr-2" />
                Excel/CSV
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres par défaut</CardTitle>
                  <CardDescription>
                    Configuration générale des exports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Format par défaut</Label>
                      <Select
                        value={generalConfig.defaultFormat}
                        onValueChange={(v) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            defaultFormat: v as 'pdf' | 'word' | 'html' | 'zip',
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="word">Word (DOCX)</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="zip">Archive ZIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Langue par défaut</Label>
                      <Select
                        value={generalConfig.defaultLanguage}
                        onValueChange={(v) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            defaultLanguage: v,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Niveau de compression</Label>
                      <Select
                        value={generalConfig.compressionLevel}
                        onValueChange={(v) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            compressionLevel: v as 'none' | 'low' | 'medium' | 'high',
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          <SelectItem value="low">Légère</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Rétention (jours)</Label>
                      <Input
                        type="number"
                        value={generalConfig.retentionDays}
                        onChange={(e) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            retentionDays: parseInt(e.target.value) || 30,
                          }))
                        }
                        className="mt-1"
                        min={1}
                        max={365}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Inclure les traductions</Label>
                        <p className="text-sm text-muted-foreground">
                          Exporter toutes les versions linguistiques
                        </p>
                      </div>
                      <Switch
                        checked={generalConfig.includeTranslations}
                        onCheckedChange={(v) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            includeTranslations: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notification à la fin</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir une notification quand l'export est prêt
                        </p>
                      </div>
                      <Switch
                        checked={generalConfig.notifyOnComplete}
                        onCheckedChange={(v) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            notifyOnComplete: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notification en cas d'erreur</Label>
                        <p className="text-sm text-muted-foreground">
                          Être alerté si un export échoue
                        </p>
                      </div>
                      <Switch
                        checked={generalConfig.notifyOnError}
                        onCheckedChange={(v) =>
                          setGeneralConfig((prev) => ({
                            ...prev,
                            notifyOnError: v,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PDF Tab */}
            <TabsContent value="pdf" className="mt-6 space-y-4">
              {/* Layout Section */}
              <Card>
                <Collapsible open={expandedSections.has('layout')}>
                  {renderSectionHeader(
                    'layout',
                    'Mise en page',
                    <Layout className="h-4 w-4 text-primary" />,
                    'Format, orientation et marges'
                  )}
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Format de papier</Label>
                          <Select
                            value={pdfConfig.paperSize}
                            onValueChange={(v) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                paperSize: v as 'A4' | 'Letter' | 'Legal',
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAPER_SIZES.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Orientation</Label>
                          <Select
                            value={pdfConfig.orientation}
                            onValueChange={(v) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                orientation: v as 'portrait' | 'landscape',
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="portrait">Portrait</SelectItem>
                              <SelectItem value="landscape">Paysage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Marges (mm)</Label>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                          <Input
                            type="number"
                            value={pdfConfig.margins.top}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                margins: {
                                  ...prev.margins,
                                  top: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="Haut"
                          />
                          <Input
                            type="number"
                            value={pdfConfig.margins.right}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                margins: {
                                  ...prev.margins,
                                  right: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="Droite"
                          />
                          <Input
                            type="number"
                            value={pdfConfig.margins.bottom}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                margins: {
                                  ...prev.margins,
                                  bottom: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="Bas"
                          />
                          <Input
                            type="number"
                            value={pdfConfig.margins.left}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                margins: {
                                  ...prev.margins,
                                  left: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="Gauche"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Typography Section */}
              <Card>
                <Collapsible open={expandedSections.has('typography')}>
                  {renderSectionHeader(
                    'typography',
                    'Typographie',
                    <Type className="h-4 w-4 text-primary" />,
                    'Police et taille du texte'
                  )}
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Police</Label>
                          <Select
                            value={pdfConfig.fontFamily}
                            onValueChange={(v) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                fontFamily: v,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILIES.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Taille de police (pt)</Label>
                          <Input
                            type="number"
                            value={pdfConfig.fontSize}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                fontSize: parseInt(e.target.value) || 12,
                              }))
                            }
                            className="mt-1"
                            min={8}
                            max={24}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Couleur principale</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={pdfConfig.primaryColor}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                primaryColor: e.target.value,
                              }))
                            }
                            className="w-10 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={pdfConfig.primaryColor}
                            onChange={(e) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                primaryColor: e.target.value,
                              }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Content Section */}
              <Card>
                <Collapsible open={expandedSections.has('content')}>
                  {renderSectionHeader(
                    'content',
                    'Contenu',
                    <FileText className="h-4 w-4 text-primary" />,
                    'En-tête, pied de page et options'
                  )}
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>En-tête</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher un en-tête sur chaque page
                          </p>
                        </div>
                        <Switch
                          checked={pdfConfig.headerEnabled}
                          onCheckedChange={(v) =>
                            setPdfConfig((prev) => ({
                              ...prev,
                              headerEnabled: v,
                            }))
                          }
                        />
                      </div>
                      {pdfConfig.headerEnabled && (
                        <Input
                          value={pdfConfig.headerText}
                          onChange={(e) =>
                            setPdfConfig((prev) => ({
                              ...prev,
                              headerText: e.target.value,
                            }))
                          }
                          placeholder="Texte de l'en-tête ({title}, {date})"
                        />
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Pied de page</Label>
                          <p className="text-sm text-muted-foreground">
                            Afficher un pied de page sur chaque page
                          </p>
                        </div>
                        <Switch
                          checked={pdfConfig.footerEnabled}
                          onCheckedChange={(v) =>
                            setPdfConfig((prev) => ({
                              ...prev,
                              footerEnabled: v,
                            }))
                          }
                        />
                      </div>
                      {pdfConfig.footerEnabled && (
                        <Input
                          value={pdfConfig.footerText}
                          onChange={(e) =>
                            setPdfConfig((prev) => ({
                              ...prev,
                              footerText: e.target.value,
                            }))
                          }
                          placeholder="Texte du pied de page ({page}, {pages})"
                        />
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Table des matières</Label>
                          <p className="text-sm text-muted-foreground">
                            Générer automatiquement une table des matières
                          </p>
                        </div>
                        <Switch
                          checked={pdfConfig.includeTableOfContents}
                          onCheckedChange={(v) =>
                            setPdfConfig((prev) => ({
                              ...prev,
                              includeTableOfContents: v,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Inclure les médias</Label>
                          <p className="text-sm text-muted-foreground">
                            Intégrer les images dans le document
                          </p>
                        </div>
                        <Switch
                          checked={pdfConfig.includeMedia}
                          onCheckedChange={(v) =>
                            setPdfConfig((prev) => ({
                              ...prev,
                              includeMedia: v,
                            }))
                          }
                        />
                      </div>

                      {pdfConfig.includeMedia && (
                        <div>
                          <Label>Qualité des images</Label>
                          <Select
                            value={pdfConfig.mediaQuality}
                            onValueChange={(v) =>
                              setPdfConfig((prev) => ({
                                ...prev,
                                mediaQuality: v as 'low' | 'medium' | 'high',
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUALITY_OPTIONS.map(({ value, label, description }) => (
                                <SelectItem key={value} value={value}>
                                  {label} - {description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </TabsContent>

            {/* Word Tab */}
            <TabsContent value="word" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Word</CardTitle>
                  <CardDescription>
                    Paramètres pour les exports DOCX
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inclure les styles</Label>
                      <p className="text-sm text-muted-foreground">
                        Conserver le formatage du document
                      </p>
                    </div>
                    <Switch
                      checked={wordConfig.includeStyles}
                      onCheckedChange={(v) =>
                        setWordConfig((prev) => ({ ...prev, includeStyles: v }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inclure les médias</Label>
                      <p className="text-sm text-muted-foreground">
                        Intégrer les images dans le document
                      </p>
                    </div>
                    <Switch
                      checked={wordConfig.includeMedia}
                      onCheckedChange={(v) =>
                        setWordConfig((prev) => ({ ...prev, includeMedia: v }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Table des matières</Label>
                      <p className="text-sm text-muted-foreground">
                        Générer une table des matières
                      </p>
                    </div>
                    <Switch
                      checked={wordConfig.includeTableOfContents}
                      onCheckedChange={(v) =>
                        setWordConfig((prev) => ({
                          ...prev,
                          includeTableOfContents: v,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Métadonnées</Label>
                      <p className="text-sm text-muted-foreground">
                        Inclure les propriétés du document
                      </p>
                    </div>
                    <Switch
                      checked={wordConfig.includeMetadata}
                      onCheckedChange={(v) =>
                        setWordConfig((prev) => ({
                          ...prev,
                          includeMetadata: v,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Suivi des modifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer le mode révision
                      </p>
                    </div>
                    <Switch
                      checked={wordConfig.trackChanges}
                      onCheckedChange={(v) =>
                        setWordConfig((prev) => ({ ...prev, trackChanges: v }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Excel Tab */}
            <TabsContent value="excel" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Excel/CSV</CardTitle>
                  <CardDescription>
                    Paramètres pour les exports tabulaires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nom de la feuille</Label>
                    <Input
                      value={excelConfig.sheetName}
                      onChange={(e) =>
                        setExcelConfig((prev) => ({
                          ...prev,
                          sheetName: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Format de date</Label>
                      <Select
                        value={excelConfig.dateFormat}
                        onValueChange={(v) =>
                          setExcelConfig((prev) => ({ ...prev, dateFormat: v }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Format des nombres</Label>
                      <Select
                        value={excelConfig.numberFormat}
                        onValueChange={(v) =>
                          setExcelConfig((prev) => ({
                            ...prev,
                            numberFormat: v,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="#,##0.00">#,##0.00</SelectItem>
                          <SelectItem value="#,##0">#,##0</SelectItem>
                          <SelectItem value="0.00">0.00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inclure les en-têtes</Label>
                      <p className="text-sm text-muted-foreground">
                        Première ligne avec les noms de colonnes
                      </p>
                    </div>
                    <Switch
                      checked={excelConfig.includeHeaders}
                      onCheckedChange={(v) =>
                        setExcelConfig((prev) => ({
                          ...prev,
                          includeHeaders: v,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Largeur automatique</Label>
                      <p className="text-sm text-muted-foreground">
                        Ajuster la largeur des colonnes au contenu
                      </p>
                    </div>
                    <Switch
                      checked={excelConfig.autoWidth}
                      onCheckedChange={(v) =>
                        setExcelConfig((prev) => ({ ...prev, autoWidth: v }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
