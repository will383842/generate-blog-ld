/**
 * Live Generation Monitoring
 * Real-time monitoring of content generation activities
 */

import React, { useState } from 'react';
import { Zap, Play, Square, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const [jobs] = useState<GenerationJob[]>([
    { id: '1', title: 'Guide expatriation France', platform: 'SOS-Expat', country: 'FR', language: 'fr', status: 'running', progress: 65, startedAt: new Date(), estimatedEnd: new Date(Date.now() + 120000) },
    { id: '2', title: 'Moving to Spain guide', platform: 'Ulixai', country: 'ES', language: 'en', status: 'running', progress: 42, startedAt: new Date(), estimatedEnd: new Date(Date.now() + 180000) },
    { id: '3', title: 'Article visa Allemagne', platform: 'SOS-Expat', country: 'DE', language: 'fr', status: 'queued', progress: 0 },
    { id: '4', title: 'Japan culture article', platform: 'Ulysse', country: 'JP', language: 'en', status: 'running', progress: 88, startedAt: new Date() },
    { id: '5', title: 'Article santé UK', platform: 'SOS-Expat', country: 'GB', language: 'fr', status: 'failed', progress: 0 },
  ]);

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
          <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
          <Button><Play className="w-4 h-4 mr-2" />Démarrer jobs</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Jobs actifs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{activeJobs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{queuedJobs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Vitesse</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">124<span className="text-base text-muted-foreground">/h</span></div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Jobs en cours</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Langue</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.platform}</TableCell>
                  <TableCell><Badge variant="outline">{job.country}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{job.language}</Badge></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-2" />
                      <span className="text-sm text-muted-foreground">{job.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getStatusColor(job.status)}>{job.status}</Badge></TableCell>
                  <TableCell>
                    {job.status === 'running' && <Button variant="ghost" size="sm"><Square className="w-4 h-4" /></Button>}
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
