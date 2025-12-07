/**
 * Comparison Builder
 * Define and configure comparison criteria
 */

import { useState } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp,
  Layers,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  SelectRoot as Select,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useCriteriaTemplates } from '@/hooks/useComparatives';
import type {
  ComparisonCriteria,
  CriteriaType,
  CriteriaTemplate,
  ScoringMethod,
} from '@/types/comparative';

export interface ComparisonBuilderProps {
  criteria: ComparisonCriteria[];
  scoringMethod: ScoringMethod;
  onUpdateCriteria: (criteria: ComparisonCriteria[]) => void;
  onUpdateScoringMethod: (method: ScoringMethod) => void;
  onApplyTemplate?: (templateId: string) => void;
  onSaveAsTemplate?: (name: string) => void;
  className?: string;
}

const CRITERIA_TYPES: { value: CriteriaType; label: string }[] = [
  { value: 'numeric', label: 'Numérique' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'rating', label: 'Étoiles (1-5)' },
  { value: 'text', label: 'Texte' },
  { value: 'price', label: 'Prix' },
  { value: 'percentage', label: 'Pourcentage' },
  { value: 'select', label: 'Choix multiple' },
];

const SCORING_METHODS: { value: ScoringMethod; label: string; description: string }[] = [
  { value: 'weighted_average', label: 'Moyenne pondérée', description: 'Score basé sur les poids des critères' },
  { value: 'simple_average', label: 'Moyenne simple', description: 'Tous les critères ont le même poids' },
  { value: 'sum', label: 'Somme', description: 'Addition de tous les scores' },
  { value: 'none', label: 'Aucun', description: 'Pas de calcul de score' },
];

export function ComparisonBuilder({
  criteria,
  scoringMethod,
  onUpdateCriteria,
  onUpdateScoringMethod,
  onApplyTemplate,
  onSaveAsTemplate,
  className,
}: ComparisonBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: templatesData } = useCriteriaTemplates();
  const templates = templatesData?.data || [];

  // Calculate total weight
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = totalWeight === 100 || scoringMethod !== 'weighted_average';

  const handleAddCriterion = () => {
    const newCriterion: ComparisonCriteria = {
      id: `criterion-${Date.now()}`,
      comparativeId: '',
      name: '',
      type: 'rating',
      weight: 0,
      higherIsBetter: true,
      order: criteria.length,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateCriteria([...criteria, newCriterion]);
    setExpandedId(newCriterion.id);
  };

  const handleUpdateCriterion = (id: string, updates: Partial<ComparisonCriteria>) => {
    onUpdateCriteria(
      criteria.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteCriterion = (id: string) => {
    onUpdateCriteria(criteria.filter((c) => c.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newCriteria = [...criteria];
    const [removed] = newCriteria.splice(draggedIndex, 1);
    newCriteria.splice(targetIndex, 0, removed);
    newCriteria.forEach((c, i) => (c.order = i));

    onUpdateCriteria(newCriteria);
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDistributeWeights = () => {
    const visibleCriteria = criteria.filter((c) => c.isVisible);
    const weightPerCriterion = Math.floor(100 / visibleCriteria.length);
    const remainder = 100 - weightPerCriterion * visibleCriteria.length;

    let remainderUsed = 0;
    onUpdateCriteria(
      criteria.map((c) => {
        if (!c.isVisible) return { ...c, weight: 0 };
        const extra = remainderUsed < remainder ? 1 : 0;
        remainderUsed++;
        return { ...c, weight: weightPerCriterion + extra };
      })
    );
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    onSaveAsTemplate?.(templateName.trim());
    setTemplateName('');
    setShowTemplateDialog(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Critères de comparaison
          </CardTitle>
          <div className="flex gap-2">
            {templates.length > 0 && (
              <Select onValueChange={(id) => onApplyTemplate?.(id)}>
                <SelectTrigger className="w-40">
                  <Layers className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateDialog(true)}
            >
              <Save className="w-4 h-4 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scoring Method */}
        <div>
          <Label className="mb-2 block">Méthode de calcul</Label>
          <Select
            value={scoringMethod}
            onValueChange={(v) => onUpdateScoringMethod(v as ScoringMethod)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORING_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div>
                    <p>{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weight Status */}
        {scoringMethod === 'weighted_average' && (
          <div
            className={cn(
              'flex items-center justify-between p-2 rounded',
              isWeightValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}
          >
            <span className="text-sm">
              Poids total: {totalWeight}%
              {!isWeightValid && ' (doit être 100%)'}
            </span>
            <Button variant="ghost" size="sm" onClick={handleDistributeWeights}>
              Distribuer
            </Button>
          </div>
        )}

        {/* Criteria List */}
        <div className="space-y-2">
          {criteria
            .sort((a, b) => a.order - b.order)
            .map((criterion, index) => (
              <Collapsible
                key={criterion.id}
                open={expandedId === criterion.id}
                onOpenChange={(open) => setExpandedId(open ? criterion.id : null)}
              >
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'border rounded-lg',
                    draggedIndex === index && 'opacity-50',
                    !criterion.isVisible && 'opacity-60 bg-gray-50'
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50">
                      <div className="cursor-grab">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {criterion.name || 'Nouveau critère'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {CRITERIA_TYPES.find((t) => t.value === criterion.type)?.label}
                          </Badge>
                          {scoringMethod === 'weighted_average' && (
                            <Badge variant="secondary" className="text-[10px]">
                              {criterion.weight}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateCriterion(criterion.id, {
                            isVisible: !criterion.isVisible,
                          });
                        }}
                      >
                        {criterion.isVisible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      {expandedId === criterion.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-3 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nom</Label>
                          <Input
                            value={criterion.name}
                            onChange={(e) =>
                              handleUpdateCriterion(criterion.id, { name: e.target.value })
                            }
                            placeholder="Nom du critère"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={criterion.type}
                            onValueChange={(v) =>
                              handleUpdateCriterion(criterion.id, { type: v as CriteriaType })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CRITERIA_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {scoringMethod === 'weighted_average' && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs">Poids</Label>
                            <span className="text-xs font-medium">{criterion.weight}%</span>
                          </div>
                          <Slider
                            value={[criterion.weight]}
                            onValueChange={([v]) =>
                              handleUpdateCriterion(criterion.id, { weight: v })
                            }
                            max={100}
                            step={5}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Plus élevé = meilleur</Label>
                        <Switch
                          checked={criterion.higherIsBetter}
                          onCheckedChange={(checked) =>
                            handleUpdateCriterion(criterion.id, { higherIsBetter: checked })
                          }
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCriterion(criterion.id)}
                        className="text-red-600 w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
        </div>

        {/* Add Criterion */}
        <Button variant="outline" className="w-full" onClick={handleAddCriterion}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un critère
        </Button>
      </CardContent>

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder comme template</DialogTitle>
          </DialogHeader>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nom du template"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ComparisonBuilder;
