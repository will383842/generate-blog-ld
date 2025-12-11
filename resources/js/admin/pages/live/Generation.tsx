/**
 * Live Generation Monitoring
 * Real-time monitoring of content generation activities
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Play, Square, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

interface GenerationJob {
  id: string;
  title: string;
  platform: string;
  country: string;
  language: string;
  status: 'running' | 'queued' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  estimatedEnd?: Date;
}

export default function LiveGenerationPage() {
  const { data: jobs = [], isLoading, refetch } = useQuery<GenerationJob[]>({
    queryKey: ['live', 'generation'],
    queryFn: async () => {
      const res = await fetch('/api/live/generation');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
    refetchInterval: 3000, // Auto-refresh toutes les 3 secondes
  });

  const getStatusColor = (status: GenerationJob['status']) => {
    switch (status) {
      case 'running': return 'default';
      case 'queued': return 'secondary';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'running');
  const queuedJobs = jobs.filter(j => j.status === 'queued');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Génération Live
          </h1>
          <p className="text-muted-foreground">Suivi en temps réel de la génération de contenu</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Démarrer jobs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Jobs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{queuedJobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Vitesse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {jobs.filter(j => j.status === 'completed').length}
              <span className="text-base text-muted-foreground">/h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jobs en cours</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun job de génération en cours</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Langue</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.platform}</TableCell>
                    <TableCell>{job.country}</TableCell>
                    <TableCell>{job.language}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(job.status)}>
                        {job.status === 'running' ? 'En cours' : 
                         job.status === 'queued' ? 'En attente' :
                         job.status === 'completed' ? 'Terminé' : 'Échoué'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="w-20" />
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Square className="w-4 h-4" />
                      </Button>
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
