/**
 * Style Settings Component
 * File 250 - Form for brand style parameters with sliders and lists
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings2,
  Plus,
  X,
  Save,
  Loader2,
  AlertCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  StyleSettings,
  FormattingRules,
  getDefaultStyleSettings,
} from '@/types/brand';
import { cn } from '@/lib/utils';

interface StyleSettingsFormProps {
  settings?: StyleSettings | null;
  onChange?: (settings: Partial<StyleSettings>) => void;
  onSave?: (settings: Partial<StyleSettings>) => void;
  isLoading?: boolean;
  isSaving?: boolean;
  showPreview?: boolean;
}

export function StyleSettingsForm({
  settings,
  onChange,
  onSave,
  isLoading = false,
  isSaving = false,
  showPreview = true,
}: StyleSettingsFormProps) {
  const { t } = useTranslation();
  const defaults = getDefaultStyleSettings();

  // Tone parameters
  const [formality, setFormality] = useState(settings?.formality ?? defaults.formality ?? 50);
  const [friendliness, setFriendliness] = useState(settings?.friendliness ?? defaults.friendliness ?? 70);
  const [enthusiasm, setEnthusiasm] = useState(settings?.enthusiasm ?? defaults.enthusiasm ?? 60);
  const [confidence, setConfidence] = useState(settings?.confidence ?? defaults.confidence ?? 70);
  const [empathy, setEmpathy] = useState(settings?.empathy ?? defaults.empathy ?? 60);

  // Complexity parameters
  const [sentenceLength, setSentenceLength] = useState<StyleSettings['sentence_length']>(
    settings?.sentence_length ?? 'medium'
  );
  const [vocabularyLevel, setVocabularyLevel] = useState<StyleSettings['vocabulary_level']>(
    settings?.vocabulary_level ?? 'standard'
  );
  const [technicalDepth, setTechnicalDepth] = useState(settings?.technical_depth ?? 50);

  // Lists
  const [vocabulary, setVocabulary] = useState<string[]>(settings?.vocabulary ?? []);
  const [forbiddenTerms, setForbiddenTerms] = useState<string[]>(settings?.forbidden_terms ?? []);
  const [requiredElements, setRequiredElements] = useState<string[]>(settings?.required_elements ?? []);
  const [templatePhrases, setTemplatePhrases] = useState<string[]>(settings?.template_phrases ?? []);

  // Formatting rules
  const [formattingRules, setFormattingRules] = useState<FormattingRules>(
    settings?.formatting_rules ?? defaults.formatting_rules!
  );

  // New item inputs
  const [newVocabulary, setNewVocabulary] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newRequired, setNewRequired] = useState('');
  const [newTemplate, setNewTemplate] = useState('');

  // Reset when settings change
  useEffect(() => {
    if (settings) {
      setFormality(settings.formality);
      setFriendliness(settings.friendliness);
      setEnthusiasm(settings.enthusiasm);
      setConfidence(settings.confidence);
      setEmpathy(settings.empathy);
      setSentenceLength(settings.sentence_length);
      setVocabularyLevel(settings.vocabulary_level);
      setTechnicalDepth(settings.technical_depth);
      setVocabulary(settings.vocabulary);
      setForbiddenTerms(settings.forbidden_terms);
      setRequiredElements(settings.required_elements);
      setTemplatePhrases(settings.template_phrases);
      setFormattingRules(settings.formatting_rules);
    }
  }, [settings?.id]);

  // Build current settings
  const getCurrentSettings = (): Partial<StyleSettings> => ({
    formality,
    friendliness,
    enthusiasm,
    confidence,
    empathy,
    sentence_length: sentenceLength,
    vocabulary_level: vocabularyLevel,
    technical_depth: technicalDepth,
    vocabulary,
    forbidden_terms: forbiddenTerms,
    required_elements: requiredElements,
    template_phrases: templatePhrases,
    formatting_rules: formattingRules,
  });

  // Notify parent of changes
  const notifyChange = () => {
    onChange?.(getCurrentSettings());
  };

  // Handle save
  const handleSave = () => {
    onSave?.(getCurrentSettings());
  };

  // Handle reset to defaults
  const handleReset = () => {
    const d = getDefaultStyleSettings();
    setFormality(d.formality!);
    setFriendliness(d.friendliness!);
    setEnthusiasm(d.enthusiasm!);
    setConfidence(d.confidence!);
    setEmpathy(d.empathy!);
    setSentenceLength(d.sentence_length!);
    setVocabularyLevel(d.vocabulary_level!);
    setTechnicalDepth(d.technical_depth!);
    setVocabulary(d.vocabulary!);
    setForbiddenTerms(d.forbidden_terms!);
    setRequiredElements(d.required_elements!);
    setTemplatePhrases(d.template_phrases!);
    setFormattingRules(d.formatting_rules!);
    notifyChange();
  };

  // List management
  const addToList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue('');
      notifyChange();
    }
  };

  const removeFromList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
    notifyChange();
  };

  // Slider with label component
  const SliderWithLabel = ({
    label,
    value,
    onChange: onSliderChange,
    leftLabel,
    rightLabel,
    description,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    leftLabel: string;
    rightLabel: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {label}
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Badge variant="outline">{value}%</Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => { onSliderChange(v); notifyChange(); }}
        min={0}
        max={100}
        step={5}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

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
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{t('brand.style.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('common.reset')}
          </Button>
          {onSave && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('common.save')}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="tone">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tone">Ton</TabsTrigger>
          <TabsTrigger value="complexity">Complexité</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulaire</TabsTrigger>
          <TabsTrigger value="formatting">Formatage</TabsTrigger>
        </TabsList>

        {/* Tone Tab */}
        <TabsContent value="tone" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paramètres du ton</CardTitle>
              <CardDescription>
                Ajustez le ton de communication de la marque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderWithLabel
                label="Formalité"
                value={formality}
                onChange={setFormality}
                leftLabel="Décontracté"
                rightLabel="Formel"
                description="Niveau de formalité dans la communication"
              />
              <SliderWithLabel
                label="Convivialité"
                value={friendliness}
                onChange={setFriendliness}
                leftLabel="Neutre"
                rightLabel="Chaleureux"
                description="Degré de proximité avec le lecteur"
              />
              <SliderWithLabel
                label="Enthousiasme"
                value={enthusiasm}
                onChange={setEnthusiasm}
                leftLabel="Sobre"
                rightLabel="Dynamique"
                description="Niveau d'énergie dans le discours"
              />
              <SliderWithLabel
                label="Confiance"
                value={confidence}
                onChange={setConfidence}
                leftLabel="Humble"
                rightLabel="Assuré"
                description="Niveau d'affirmation dans les propos"
              />
              <SliderWithLabel
                label="Empathie"
                value={empathy}
                onChange={setEmpathy}
                leftLabel="Factuel"
                rightLabel="Empathique"
                description="Prise en compte des émotions du lecteur"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complexity Tab */}
        <TabsContent value="complexity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complexité du contenu</CardTitle>
              <CardDescription>
                Définissez le niveau de complexité du contenu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Longueur des phrases</Label>
                  <Select
                    value={sentenceLength}
                    onValueChange={(v: StyleSettings['sentence_length']) => {
                      setSentenceLength(v);
                      notifyChange();
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Courtes (15-20 mots)</SelectItem>
                      <SelectItem value="medium">Moyennes (20-30 mots)</SelectItem>
                      <SelectItem value="long">Longues (30-40 mots)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Niveau de vocabulaire</Label>
                  <Select
                    value={vocabularyLevel}
                    onValueChange={(v: StyleSettings['vocabulary_level']) => {
                      setVocabularyLevel(v);
                      notifyChange();
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (grand public)</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="expert">Expert (technique)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SliderWithLabel
                label="Profondeur technique"
                value={technicalDepth}
                onChange={setTechnicalDepth}
                leftLabel="Vulgarisé"
                rightLabel="Technique"
                description="Niveau de détail technique dans les explications"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vocabulary Tab */}
        <TabsContent value="vocabulary" className="space-y-6 mt-6">
          <Accordion type="multiple" defaultValue={['vocabulary', 'forbidden']}>
            {/* Preferred Vocabulary */}
            <AccordionItem value="vocabulary">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  Vocabulaire à privilégier
                  <Badge variant="secondary">{vocabulary.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newVocabulary}
                      onChange={(e) => setNewVocabulary(e.target.value)}
                      placeholder="Ajouter un terme..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToList(vocabulary, setVocabulary, newVocabulary, setNewVocabulary);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => addToList(vocabulary, setVocabulary, newVocabulary, setNewVocabulary)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vocabulary.map((term, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {term}
                        <button
                          onClick={() => removeFromList(vocabulary, setVocabulary, idx)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Forbidden Terms */}
            <AccordionItem value="forbidden">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  Termes interdits
                  <Badge variant="destructive">{forbiddenTerms.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newForbidden}
                      onChange={(e) => setNewForbidden(e.target.value)}
                      placeholder="Ajouter un terme interdit..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToList(forbiddenTerms, setForbiddenTerms, newForbidden, setNewForbidden);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => addToList(forbiddenTerms, setForbiddenTerms, newForbidden, setNewForbidden)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {forbiddenTerms.map((term, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1 border-red-300 text-red-600">
                        {term}
                        <button
                          onClick={() => removeFromList(forbiddenTerms, setForbiddenTerms, idx)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Required Elements */}
            <AccordionItem value="required">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  Éléments requis
                  <Badge variant="outline">{requiredElements.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newRequired}
                      onChange={(e) => setNewRequired(e.target.value)}
                      placeholder="Ex: CTA, introduction, conclusion..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToList(requiredElements, setRequiredElements, newRequired, setNewRequired);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => addToList(requiredElements, setRequiredElements, newRequired, setNewRequired)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requiredElements.map((element, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {element}
                        <button
                          onClick={() => removeFromList(requiredElements, setRequiredElements, idx)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Template Phrases */}
            <AccordionItem value="templates">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  Phrases modèles
                  <Badge variant="outline">{templatePhrases.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newTemplate}
                      onChange={(e) => setNewTemplate(e.target.value)}
                      placeholder="Ajouter une phrase modèle..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToList(templatePhrases, setTemplatePhrases, newTemplate, setNewTemplate);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => addToList(templatePhrases, setTemplatePhrases, newTemplate, setNewTemplate)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {templatePhrases.map((phrase, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <span className="italic">"{phrase}"</span>
                        <button
                          onClick={() => removeFromList(templatePhrases, setTemplatePhrases, idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* Formatting Tab */}
        <TabsContent value="formatting" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Règles de formatage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Longueur max paragraphe (caractères)</Label>
                  <Input
                    type="number"
                    value={formattingRules.max_paragraph_length}
                    onChange={(e) => {
                      setFormattingRules({
                        ...formattingRules,
                        max_paragraph_length: parseInt(e.target.value) || 300,
                      });
                      notifyChange();
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Longueur min paragraphe (caractères)</Label>
                  <Input
                    type="number"
                    value={formattingRules.min_paragraph_length}
                    onChange={(e) => {
                      setFormattingRules({
                        ...formattingRules,
                        min_paragraph_length: parseInt(e.target.value) || 50,
                      });
                      notifyChange();
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <Label>Autoriser les listes à puces</Label>
                  <Switch
                    checked={formattingRules.use_bullet_points}
                    onCheckedChange={(checked) => {
                      setFormattingRules({ ...formattingRules, use_bullet_points: checked });
                      notifyChange();
                    }}
                  />
                </div>
                {formattingRules.use_bullet_points && (
                  <div>
                    <Label>Max items par liste</Label>
                    <Input
                      type="number"
                      value={formattingRules.max_bullet_items}
                      onChange={(e) => {
                        setFormattingRules({
                          ...formattingRules,
                          max_bullet_items: parseInt(e.target.value) || 7,
                        });
                        notifyChange();
                      }}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Style des titres</Label>
                <Select
                  value={formattingRules.heading_style}
                  onValueChange={(v: FormattingRules['heading_style']) => {
                    setFormattingRules({ ...formattingRules, heading_style: v });
                    notifyChange();
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title_case">Title Case</SelectItem>
                    <SelectItem value="sentence_case">Sentence case</SelectItem>
                    <SelectItem value="uppercase">MAJUSCULES</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Autoriser les emojis</Label>
                <Switch
                  checked={formattingRules.use_emojis}
                  onCheckedChange={(checked) => {
                    setFormattingRules({ ...formattingRules, use_emojis: checked });
                    notifyChange();
                  }}
                />
              </div>

              <div>
                <Label>Style des CTA</Label>
                <Select
                  value={formattingRules.call_to_action_style}
                  onValueChange={(v: FormattingRules['call_to_action_style']) => {
                    setFormattingRules({ ...formattingRules, call_to_action_style: v });
                    notifyChange();
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Bouton</SelectItem>
                    <SelectItem value="link">Lien</SelectItem>
                    <SelectItem value="inline">Texte inline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Panel */}
      {showPreview && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu de l'impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Ton attendu :</strong>{' '}
                {formality > 70 ? 'Formel' : formality > 30 ? 'Équilibré' : 'Décontracté'},{' '}
                {friendliness > 70 ? 'chaleureux' : friendliness > 30 ? 'cordial' : 'neutre'},{' '}
                {enthusiasm > 70 ? 'dynamique' : enthusiasm > 30 ? 'modéré' : 'sobre'}
              </p>
              <p>
                <strong>Complexité :</strong>{' '}
                Phrases {sentenceLength === 'short' ? 'courtes' : sentenceLength === 'long' ? 'longues' : 'moyennes'},{' '}
                vocabulaire {vocabularyLevel === 'simple' ? 'simple' : vocabularyLevel === 'expert' ? 'expert' : 'standard'}
              </p>
              <p>
                <strong>Vocabulaire :</strong>{' '}
                {vocabulary.length} termes à privilégier, {forbiddenTerms.length} termes interdits
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StyleSettingsForm;
