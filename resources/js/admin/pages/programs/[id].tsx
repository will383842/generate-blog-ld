import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  MoreVertical,
  Clock,
  Globe,
  Languages,
  FileText,
  Settings,
  BarChart3,
  History,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { ProgramStats } from '@/components/programs/ProgramStats';
import { RunHistory } from '@/components/programs/RunHistory';
import { PLATFORMS, CONTENT_TYPES } from '@/utils/constants';
import {
  useProgram,
  useDeleteProgram,
  usePauseProgram,
  useResumeProgram,
  useRunProgram,
  useCloneProgram,
} from '@/hooks/usePrograms';
import type { ProgramStatus } from '@/types/program';

const STATUS_CONFIG: Record<ProgramStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  draft: { label: 'Brouillon', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  active: { label: 'Actif', color: 'text-green-600', bgColor: 'bg-green-100' },
  paused: { label: 'En pause', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  scheduled: { label: 'Planifié', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  running: { label: 'En cours', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  completed: { label: 'Terminé', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  error: { label: 'Erreur', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);

  const { data: programData, isLoading, error } = useProgram(id || '');
  const { mutate: deleteProgram, isPending: isDeleting } = useDeleteProgram();
  const { mutate: pauseProgram, isPending: isPausing } = usePauseProgram();
  const { mutate: resumeProgram, isPending: isResuming } = useResumeProgram();
  const { mutate: runProgram, isPending: isRunning } = useRunProgram();
  const { mutate: cloneProgram, isPending: isCloning } = useCloneProgram();

  const program = programData?.data;
  const platform = program ? PLATFORMS.find((p) => p.id === program.platformId) : null;
  const statusConfig = program ? STATUS_CONFIG[program.status] : null;

  const canEdit = program?.status === 'draft' || program?.status === 'paused';
  const canRun = program?.status !== 'running';
  const canPause = program?.status === 'active' || program?.status === 'scheduled';
  const canResume = program?.status === 'paused';

  const handleDelete = () => {
    if (!id) return;
    deleteProgram({ id }, {
      onSuccess: () => navigate('/programs'),
    });
  };

  const handlePause = () => {
    if (!id) return;
    pauseProgram(id);
  };

  const handleResume = () => {
    if (!id) return;
    resumeProgram(id);
  };

  const handleRun = (dryRun = false) => {
    if (!id) return;
    runProgram({ id, dryRun }, {
      onSuccess: () => setShowRunDialog(false),
    });
  };

  const handleClone = () => {
    if (!id || !program) return;
    cloneProgram({ id, name: `${program.name} (copie)` }, {
      onSuccess: (data) => {
        if (data.data?.id) {
          navigate(`/programs/${data.data.id}`);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-red-600 mb-4">Programme non trouvé</p>
          <Button onClick={() => navigate('/programs')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/programs')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: platform?.color }}
                  />
                  <h1 className="text-xl font-semibold">{program.name}</h1>
                  <Badge className={cn(statusConfig?.bgColor, statusConfig?.color)}>
                    {statusConfig?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {platform?.name} · Créé le {format(new Date(program.createdAt), 'PPP', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canRun && (
                <Button onClick={() => setShowRunDialog(true)} disabled={isRunning}>
                  <Play className="w-4 h-4 mr-2" />
                  Lancer
                </Button>
              )}
              {canPause && (
                <Button variant="outline" onClick={handlePause} disabled={isPausing}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {canResume && (
                <Button onClick={handleResume} disabled={isResuming}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reprendre
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => navigate(`/programs/builder?edit=${id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleClone} disabled={isCloning}>
                    <Copy className="w-4 h-4 mr-2" />
                    Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{program.countries.length}</p>
                  <p className="text-xs text-muted-foreground">Pays</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Languages className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{program.languages.length}</p>
                  <p className="text-xs text-muted-foreground">Langues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{program.totalGenerated}</p>
                  <p className="text-xs text-muted-foreground">Générés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-lg font-bold">
                    {program.nextRunAt
                      ? format(new Date(program.nextRunAt), 'dd/MM HH:mm')
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Prochaine exéc.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Terminal className="w-4 h-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {program && <ProgramStats program={program} period="7d" />}
          </TabsContent>

          <TabsContent value="history">
            <RunHistory programId={id || ''} />
          </TabsContent>

          <TabsContent value="config">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Types de contenu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {program.contentTypes.map((typeId) => {
                      const type = CONTENT_TYPES.find((t) => t.id === typeId);
                      return (
                        <Badge key={typeId} variant="secondary">
                          {type?.name || typeId}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quantité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {program.quantityValue} articles / {program.quantityMode}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Planification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="capitalize">{program.recurrenceType}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>Modèle: {program.generationOptions?.model}</p>
                  <p>Images: {program.generationOptions?.generateImage ? 'Oui' : 'Non'}</p>
                  <p>Auto-publish: {program.generationOptions?.autoPublish ? 'Oui' : 'Non'}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardContent className="p-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-[400px] overflow-auto">
                  <p className="text-gray-500"># Dernière exécution</p>
                  <p className="text-green-400">[2024-01-15 09:00:00] Programme démarré</p>
                  <p>[2024-01-15 09:00:01] Chargement configuration...</p>
                  <p>[2024-01-15 09:00:02] 50 articles planifiés</p>
                  <p className="text-green-400">[2024-01-15 09:15:30] 50/50 articles générés</p>
                  <p className="text-green-400">[2024-01-15 09:15:31] Exécution terminée avec succès</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le programme ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Cette action est irréversible. Le programme et tout son historique seront supprimés.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lancer le programme</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Choisissez le mode d'exécution :
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleRun(true)} disabled={isRunning}>
              Dry Run (simulation)
            </Button>
            <Button onClick={() => handleRun(false)} disabled={isRunning}>
              Lancer maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProgramDetail;