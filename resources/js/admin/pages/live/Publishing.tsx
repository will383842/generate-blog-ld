/**
 * Live Publishing Monitoring
 */

import React from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function LivePublishingPage() {
  const jobs = [
    { id: '1', article: 'Guide France', platform: 'SOS-Expat', status: 'publishing', time: '2m ago' },
    { id: '2', article: 'Article Espagne', platform: 'Ulixai', status: 'queued', time: '5m' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="w-6 h-6" />
            Publication Live
          </h1>
          <p className="text-muted-foreground">Suivi des publications</p>
        </div>
        <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Actifs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">1</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">15</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Publiés</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">1156</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Échoués</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">8</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Publications en cours</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Temps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.article}</TableCell>
                  <TableCell>{job.platform}</TableCell>
                  <TableCell><Badge>{job.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{job.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
