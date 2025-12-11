import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, Play, Square, RefreshCw, Loader2, Activity, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Progress } from '@/components/ui/Progress';

interface Worker {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  tasksProcessed: number;
  currentTask?: string;
  cpu: number;
  memory: number;
}

export default function WorkersPage() {
  // ✅ PRODUCTION READY - Utilise API réelle
  const { data: workers = [], isLoading, error, refetch } = useQuery<Worker[]>({
    queryKey: ['admin', 'workers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/workers');
      if (!res.ok) throw new Error('Failed to fetch workers');
      return res.json();
    },
    refetchInterval: 5000, // Auto-refresh toutes les 5 secondes
  });

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'running': return 'default';
      case 'stopped': return 'secondary';
      case 'error': return 'destructive';
    }
  };

  const getStatusIcon = (status: Worker['status']) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4" />;
      case 'stopped': return <Square className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleStopAll = async () => {
    try {
      await fetch('/api/admin/workers/stop-all', { method: 'POST' });
      refetch();
    } catch (error) {
      console.error('Failed to stop workers:', error);
    }
  };

  const handleStartAll = async () => {
    try {
      await fetch('/api/admin/workers/start-all', { method: 'POST' });
      refetch();
    } catch (error) {
      console.error('Failed to start workers:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            Workers
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Erreur lors du chargement des workers</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            Workers
          </h1>
          <p className="text-muted-foreground">Gestion des workers de traitement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={handleStopAll}>
            <Square className="h-4 w-4 mr-2" />
            Arrêter tous
          </Button>
          <Button onClick={handleStartAll}>
            <Play className="h-4 w-4 mr-2" />
            Démarrer tous
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Workers actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.filter(w => w.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">sur {workers.length} workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tâches traitées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.reduce((sum, w) => sum + w.tasksProcessed, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CPU moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.length > 0
                ? Math.round(workers.reduce((sum, w) => sum + w.cpu, 0) / workers.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">utilisation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mémoire moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.length > 0
                ? Math.round(workers.reduce((sum, w) => sum + w.memory, 0) / workers.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">utilisée</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Workers</CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun worker actif</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Tâches</TableHead>
                  <TableHead>Tâche en cours</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Mémoire</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(worker.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(worker.status)}
                        {worker.status === 'running' ? 'En cours' : worker.status === 'stopped' ? 'Arrêté' : 'Erreur'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {worker.uptime}
                    </TableCell>
                    <TableCell>{worker.tasksProcessed.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {worker.currentTask || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={worker.cpu} className="w-16" />
                        <span className="text-sm">{worker.cpu}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={worker.memory} className="w-16" />
                        <span className="text-sm">{worker.memory}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {worker.status === 'running' ? (
                          <Button variant="ghost" size="sm"><Square className="h-4 w-4" /></Button>
                        ) : (
                          <Button variant="ghost" size="sm"><Play className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
