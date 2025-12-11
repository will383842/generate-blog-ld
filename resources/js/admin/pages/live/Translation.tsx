/**
 * Live Translation Monitoring
 */

import React, { useState } from 'react';
import { Languages, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

export default function LiveTranslationPage() {
  const [jobs] = useState([
    { id: '1', article: 'Guide France', from: 'fr', to: 'en', progress: 75, status: 'running' },
    { id: '2', article: 'Article Espagne', from: 'fr', to: 'es', progress: 45, status: 'running' },
    { id: '3', article: 'Guide Allemagne', from: 'en', to: 'de', progress: 0, status: 'queued' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="w-6 h-6" />
            Traduction Live
          </h1>
          <p className="text-muted-foreground">Suivi des traductions en cours</p>
        </div>
        <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Actifs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">2</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">28</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Complétés</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">856</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Traductions en cours</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Vers</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.article}</TableCell>
                  <TableCell><Badge variant="outline">{job.from.toUpperCase()}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{job.to.toUpperCase()}</Badge></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-2" />
                      <span className="text-sm">{job.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge>{job.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
