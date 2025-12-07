/**
 * Coverage Objectives Page
 * CRUD objectives with progress tracking
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
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
  useRecordProgress,
} from '@/hooks/useCoverage';
import { PLATFORMS } from '@/utils/constants';
import type { CoverageObjective, ObjectiveStatus, CreateObjectiveInput } from '@/types/coverage';
import type { PlatformId } from '@/types/program';

const STATUS_CONFIG: Record<ObjectiveStatus, { label: string; color: string; icon: typeof Target }> = {
  not_started: { label: 'Non démarré', color: 'bg-gray-100 text-gray-700', icon: Clock },
  on_track: { label: 'En bonne voie', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  behind: { label: 'En retard', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  at_risk: { label: 'À risque', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  achieved: { label: 'Atteint', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-500', icon: X },
};

export default function CoverageObjectivesPage() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingObjective, setEditingObjective] = useState<CoverageObjective | null>(null);
  const [progressObjective, setProgressObjective] = useState<CoverageObjective | null>(null);

  const { data: objectivesData, isLoading } = useCoverageObjectives();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();
  const recordProgress = useRecordProgress();

  const objectives = objectivesData?.data || [];
  const meta = objectivesData?.meta;

  // Group by status
  const activeObjectives = objectives.filter(
    (o) => !['achieved', 'cancelled'].includes(o.status)
  );
  const completedObjectives = objectives.filter(
    (o) => ['achieved', 'cancelled'].includes(o.status)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet objectif ?')) return;
    await deleteObjective.mutateAsync(id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Objectifs de couverture
          </h1>
          <p className="text-muted-foreground">
            Définir et suivre vos objectifs de contenu
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{meta?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{meta?.achieved || 0}</p>
            <p className="text-xs text-muted-foreground">Atteints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{meta?.onTrack || 0}</p>
            <p className="text-xs text-muted-foreground">En bonne voie</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{meta?.behind || 0}</p>
            <p className="text-xs text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">{meta?.atRisk || 0}</p>
            <p className="text-xs text-muted-foreground">À risque</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Objectives */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Objectifs actifs</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeObjectives.length === 0 ? (
          <Card>
            <CardContent className="pt-4 text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucun objectif actif</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier objectif de couverture
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un objectif
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {activeObjectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                onEdit={() => setEditingObjective(objective)}
                onDelete={() => handleDelete(objective.id)}
                onRecordProgress={() => setProgressObjective(objective)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Objectives */}
      {completedObjectives.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Objectifs terminés</h2>
          <div className="grid grid-cols-2 gap-4">
            {completedObjectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                onEdit={() => setEditingObjective(objective)}
                onDelete={() => handleDelete(objective.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ObjectiveFormDialog
        open={showCreateDialog || !!editingObjective}
        objective={editingObjective}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingObjective(null);
        }}
        onSubmit={async (data) => {
          if (editingObjective) {
            await updateObjective.mutateAsync({ id: editingObjective.id, data });
          } else {
            await createObjective.mutateAsync(data);
          }
          setShowCreateDialog(false);
          setEditingObjective(null);
        }}
        isLoading={createObjective.isPending || updateObjective.isPending}
      />

      {/* Progress Dialog */}
      <ProgressDialog
        open={!!progressObjective}
        objective={progressObjective}
        onClose={() => setProgressObjective(null)}
        onSubmit={async (value, note) => {
          if (progressObjective) {
            await recordProgress.mutateAsync({
              id: progressObjective.id,
              value,
              note,
            });
            setProgressObjective(null);
          }
        }}
        isLoading={recordProgress.isPending}
      />
    </div>
  );
}

interface ObjectiveCardProps {
  objective: CoverageObjective;
  onEdit: () => void;
  onDelete: () => void;
  onRecordProgress?: () => void;
}

function ObjectiveCard({ objective, onEdit, onDelete, onRecordProgress }: ObjectiveCardProps) {
  const statusConfig = STATUS_CONFIG[objective.status];
  const StatusIcon = statusConfig.icon;
  const daysLeft = differenceInDays(new Date(objective.deadline), new Date());
  const isOverdue = daysLeft < 0 && objective.status !== 'achieved';

  const getProgressColor = () => {
    if (objective.status === 'achieved') return 'bg-green-500';
    if (objective.percentage >= 80) return 'bg-green-500';
    if (objective.percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-700">En retard</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold mb-1">{objective.name}</h3>
        {objective.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {objective.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{objective.current} / {objective.target}</span>
            <span className="font-medium">{objective.percentage.toFixed(0)}%</span>
          </div>
          <ProgressBar
            value={objective.percentage}
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(objective.deadline), 'dd MMM yyyy', { locale: fr })}
          </div>
          {daysLeft > 0 ? (
            <span className="text-muted-foreground">{daysLeft}j restants</span>
          ) : daysLeft === 0 ? (
            <span className="text-orange-600">Aujourd'hui</span>
          ) : (
            <span className="text-red-600">{Math.abs(daysLeft)}j de retard</span>
          )}
        </div>

        {/* Actions */}
        {onRecordProgress && objective.status !== 'achieved' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={onRecordProgress}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Enregistrer une progression
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ObjectiveFormDialogProps {
  open: boolean;
  objective: CoverageObjective | null;
  onClose: () => void;
  onSubmit: (data: CreateObjectiveInput) => Promise<void>;
  isLoading: boolean;
}

function ObjectiveFormDialog({
  open,
  objective,
  onClose,
  onSubmit,
  isLoading,
}: ObjectiveFormDialogProps) {
  const [formData, setFormData] = useState<CreateObjectiveInput>({
    name: objective?.name || '',
    description: objective?.description || '',
    target: objective?.target || 100,
    deadline: objective?.deadline?.split('T')[0] || '',
    platformId: objective?.platformId,
    countryId: objective?.countryId,
    languageId: objective?.languageId,
    contentType: objective?.contentType,
    themeId: objective?.themeId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {objective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: 100 articles France en anglais"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de l'objectif..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cible</label>
              <Input
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date limite</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Plateforme (optionnel)</label>
            <Select
              value={formData.platformId || ''}
              onValueChange={(v) => setFormData({ ...formData, platformId: (v as PlatformId) || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les plateformes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les plateformes</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProgressDialogProps {
  open: boolean;
  objective: CoverageObjective | null;
  onClose: () => void;
  onSubmit: (value: number, note?: string) => Promise<void>;
  isLoading: boolean;
}

function ProgressDialog({
  open,
  objective,
  onClose,
  onSubmit,
  isLoading,
}: ProgressDialogProps) {
  const [value, setValue] = useState(objective?.current || 0);
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(value, note || undefined);
    setNote('');
  };

  if (!objective) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer une progression</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{objective.name}</p>
            <div className="flex items-center gap-2">
              <ProgressBar
                value={objective.percentage}
                className="h-2 flex-1"
              />
              <span className="text-sm font-medium">{objective.percentage.toFixed(0)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nouvelle valeur (actuel: {objective.current} / cible: {objective.target})
            </label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value))}
              min={0}
              max={objective.target}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Ajout de 10 articles via génération"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
