/**
 * ObjectivesTracker Component
 * Track and manage coverage objectives with progress
 */

import { useState } from 'react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  useCoverageObjectives,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
} from '@/hooks/useCoverage';
import {
  getObjectiveStatusColor,
  type CoverageObjective,
  type ObjectiveStatus,
  type CreateObjectiveInput,
} from '@/types/coverage';

export interface ObjectivesTrackerProps {
  platformId?: string;
  compact?: boolean;
  limit?: number;
  className?: string;
}

const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  not_started: 'Non démarré',
  on_track: 'En bonne voie',
  behind: 'En retard',
  at_risk: 'À risque',
  achieved: 'Atteint',
  cancelled: 'Annulé',
};

const STATUS_ICONS: Record<ObjectiveStatus, typeof Check> = {
  not_started: Clock,
  on_track: TrendingUp,
  behind: Clock,
  at_risk: AlertTriangle,
  achieved: Check,
  cancelled: AlertTriangle,
};

export function ObjectivesTracker({
  compact = false,
  limit,
  className,
}: ObjectivesTrackerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingObjective, setEditingObjective] = useState<CoverageObjective | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateObjectiveInput>>({});

  const { data: objectivesData, isLoading } = useCoverageObjectives();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();

  const allObjectives = objectivesData?.data || [];
  const objectives = limit ? allObjectives.slice(0, limit) : allObjectives;
  const meta = objectivesData?.meta;

  // Open create dialog
  const handleCreate = () => {
    setEditingObjective(null);
    setFormData({});
    setShowDialog(true);
  };

  // Open edit dialog
  const handleEdit = (objective: CoverageObjective) => {
    setEditingObjective(objective);
    setFormData({
      name: objective.name,
      description: objective.description,
      target: objective.target,
      deadline: objective.deadline,
    });
    setShowDialog(true);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.name || !formData.target || !formData.deadline) return;

    if (editingObjective) {
      await updateObjective.mutateAsync({
        id: editingObjective.id,
        data: formData,
      });
    } else {
      await createObjective.mutateAsync(formData as CreateObjectiveInput);
    }

    setShowDialog(false);
  };

  // Delete objective
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet objectif ?')) return;
    await deleteObjective.mutateAsync(id);
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline: string) => {
    return differenceInDays(new Date(deadline), new Date());
  };

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-lg border p-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Objectifs de couverture</h3>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Nouvel objectif
        </Button>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-4 gap-2 p-4 border-b bg-gray-50">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{meta.achieved}</p>
            <p className="text-xs text-muted-foreground">Atteints</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{meta.onTrack}</p>
            <p className="text-xs text-muted-foreground">En bonne voie</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-600">{meta.behind}</p>
            <p className="text-xs text-muted-foreground">En retard</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">{meta.atRisk}</p>
            <p className="text-xs text-muted-foreground">À risque</p>
          </div>
        </div>
      )}

      {/* Objectives List */}
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {objectives.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">Aucun objectif défini</p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez des objectifs pour suivre votre progression
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Créer un objectif
            </Button>
          </div>
        ) : (
          objectives.map((objective) => {
            const StatusIcon = STATUS_ICONS[objective.status];
            const daysRemaining = getDaysRemaining(objective.deadline);
            const isExpanded = expandedId === objective.id;

            return (
              <Collapsible
                key={objective.id}
                open={isExpanded}
                onOpenChange={(open) => setExpandedId(open ? objective.id : null)}
              >
                <div className="p-4 hover:bg-gray-50">
                  <CollapsibleTrigger asChild>
                    <div className="cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getObjectiveStatusColor(objective.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_LABELS[objective.status]}
                            </Badge>
                            <span className="font-medium">{objective.name}</span>
                          </div>

                          {/* Progress */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                {objective.current.toLocaleString()} / {objective.target.toLocaleString()}
                              </span>
                              <span className="font-medium">{objective.percentage.toFixed(0)}%</span>
                            </div>
                            <Progress
                              value={objective.percentage}
                              className={cn(
                                'h-2',
                                objective.status === 'achieved' && '[&>div]:bg-green-500',
                                objective.status === 'on_track' && '[&>div]:bg-blue-500',
                                objective.status === 'behind' && '[&>div]:bg-yellow-500',
                                objective.status === 'at_risk' && '[&>div]:bg-red-500'
                              )}
                            />
                          </div>

                          {/* Deadline */}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                Échéance: {format(new Date(objective.deadline), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            {daysRemaining > 0 ? (
                              <Badge variant="outline">
                                {daysRemaining} jours restants
                              </Badge>
                            ) : daysRemaining === 0 ? (
                              <Badge className="bg-orange-100 text-orange-700">
                                Aujourd'hui
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700">
                                {Math.abs(daysRemaining)} jours de retard
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(objective);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(objective.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Description */}
                      {objective.description && (
                        <p className="text-sm text-muted-foreground">
                          {objective.description}
                        </p>
                      )}

                      {/* Scope */}
                      <div className="flex flex-wrap gap-2">
                        {objective.countryId && (
                          <Badge variant="outline">Pays: {objective.countryId}</Badge>
                        )}
                        {objective.languageId && (
                          <Badge variant="outline">Langue: {objective.languageId}</Badge>
                        )}
                        {objective.contentType && (
                          <Badge variant="outline">Type: {objective.contentType}</Badge>
                        )}
                        {objective.themeId && (
                          <Badge variant="outline">Thème: {objective.themeId}</Badge>
                        )}
                      </div>

                      {/* History */}
                      {objective.history.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Historique:</p>
                          <div className="space-y-1">
                            {objective.history.slice(-5).map((entry, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}
                                </span>
                                <span className="font-medium">{entry.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingObjective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Couvrir 50 pays en français"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cible *</Label>
                <Input
                  type="number"
                  value={formData.target || ''}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>Échéance *</Label>
                <Input
                  type="date"
                  value={formData.deadline?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pays (optionnel)</Label>
                <Input
                  value={formData.countryId || ''}
                  onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                  placeholder="FR, DE, ..."
                />
              </div>
              <div>
                <Label>Langue (optionnel)</Label>
                <Input
                  value={formData.languageId || ''}
                  onChange={(e) => setFormData({ ...formData, languageId: e.target.value || undefined })}
                  placeholder="fr, en, ..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.target || !formData.deadline}
            >
              {editingObjective ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
