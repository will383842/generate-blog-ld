import React, { useState } from 'react';
import { Cpu, Play, Square, RefreshCw, Loader2, Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [workers] = useState<Worker[]>([
    { id: '1', name: 'Generation Worker #1', status: 'running', uptime: '2d 5h', tasksProcessed: 1243, currentTask: 'Génération article France', cpu: 45, memory: 62 },
    { id: '2', name: 'Generation Worker #2', status: 'running', uptime: '2d 5h', tasksProcessed: 1189, cpu: 38, memory: 58 },
    { id: '3', name: 'Publishing Worker', status: 'running', uptime: '2d 5h', tasksProcessed: 856, currentTask: 'Publication Ulixai', cpu: 22, memory: 45 },
    { id: '4', name: 'Indexing Worker', status: 'stopped', uptime: '0h', tasksProcessed: 0, cpu: 0, memory: 0 },
    { id: '5', name: 'Translation Worker', status: 'error', uptime: '1d 3h', tasksProcessed: 342, cpu: 0, memory: 0 },
  ]);

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
          <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
          <Button variant="outline"><Square className="h-4 w-4 mr-2" />Arrêter tous</Button>
          <Button><Play className="h-4 w-4 mr-2" />Démarrer tous</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Workers actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.filter(w => w.status === 'running').length}</div>
            <p className="text-xs text-muted-foreground">sur {workers.length} workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tâches traitées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.reduce((sum, w) => sum + w.tasksProcessed, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CPU moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(workers.reduce((sum, w) => sum + w.cpu, 0) / workers.length)}%</div>
            <p className="text-xs text-muted-foreground">utilisation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mémoire moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(workers.reduce((sum, w) => sum + w.memory, 0) / workers.length)}%</div>
            <p className="text-xs text-muted-foreground">utilisée</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Workers</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="text-sm text-muted-foreground">{worker.currentTask || '-'}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}