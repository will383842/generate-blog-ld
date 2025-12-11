/**
 * Live Monitoring Index Page
 * Real-time overview of all system activities
 */

import React, { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface LiveMetrics {
  generation: { active: number; queued: number; completed: number; failed: number; rate: number };
  translation: { active: number; queued: number; completed: number; languages: string[] };
  publishing: { active: number; queued: number; published: number; failed: number };
  indexing: { active: number; queued: number; indexed: number; pending: number };
  system: { cpu: number; memory: number; apiCalls: number; errors: number };
}

export default function LiveIndexPage() {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    generation: { active: 3, queued: 47, completed: 1243, failed: 12, rate: 124 },
    translation: { active: 2, queued: 28, completed: 856, languages: ['fr', 'en', 'es'] },
    publishing: { active: 1, queued: 15, published: 1156, failed: 8 },
    indexing: { active: 2, queued: 34, indexed: 987, pending: 189 },
    system: { cpu: 45, memory: 62, apiCalls: 2547, errors: 3 },
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        generation: {
          ...prev.generation,
          active: Math.max(0, prev.generation.active + Math.floor(Math.random() * 3) - 1),
        },
        system: {
          ...prev.system,
          cpu: Math.min(100, Math.max(0, prev.system.cpu + Math.floor(Math.random() * 10) - 5)),
        },
      }));
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Surveillance en Direct
          </h1>
          <p className="text-muted-foreground">Activité temps réel du système</p>
        </div>
        <Badge variant="default" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">CPU</CardTitle></CardHeader>
          <CardContent>
            <Progress value={metrics.system.cpu} />
            <div className="text-2xl font-bold mt-2">{metrics.system.cpu}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Mémoire</CardTitle></CardHeader>
          <CardContent>
            <Progress value={metrics.system.memory} />
            <div className="text-2xl font-bold mt-2">{metrics.system.memory}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Appels API</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.system.apiCalls.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Erreurs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.system.errors}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generation">
        <TabsList>
          <TabsTrigger value="generation">Génération <Badge variant="secondary" className="ml-2">{metrics.generation.active}</Badge></TabsTrigger>
          <TabsTrigger value="translation">Traduction <Badge variant="secondary" className="ml-2">{metrics.translation.active}</Badge></TabsTrigger>
          <TabsTrigger value="publishing">Publication <Badge variant="secondary" className="ml-2">{metrics.publishing.active}</Badge></TabsTrigger>
          <TabsTrigger value="indexing">Indexation <Badge variant="secondary" className="ml-2">{metrics.indexing.active}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="generation" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Génération en cours</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="text-sm text-muted-foreground">Actifs</div><div className="text-2xl font-bold">{metrics.generation.active}</div></div>
                <div><div className="text-sm text-muted-foreground">En attente</div><div className="text-2xl font-bold">{metrics.generation.queued}</div></div>
                <div><div className="text-sm text-muted-foreground">Complétés</div><div className="text-2xl font-bold text-green-600">{metrics.generation.completed}</div></div>
                <div><div className="text-sm text-muted-foreground">Échoués</div><div className="text-2xl font-bold text-red-600">{metrics.generation.failed}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="translation" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Traduction en cours</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-sm text-muted-foreground">Actifs</div><div className="text-2xl font-bold">{metrics.translation.active}</div></div>
                <div><div className="text-sm text-muted-foreground">En attente</div><div className="text-2xl font-bold">{metrics.translation.queued}</div></div>
                <div><div className="text-sm text-muted-foreground">Complétés</div><div className="text-2xl font-bold text-green-600">{metrics.translation.completed}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="publishing" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Publication en cours</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="text-sm text-muted-foreground">Actifs</div><div className="text-2xl font-bold">{metrics.publishing.active}</div></div>
                <div><div className="text-sm text-muted-foreground">En attente</div><div className="text-2xl font-bold">{metrics.publishing.queued}</div></div>
                <div><div className="text-sm text-muted-foreground">Publiés</div><div className="text-2xl font-bold text-green-600">{metrics.publishing.published}</div></div>
                <div><div className="text-sm text-muted-foreground">Échoués</div><div className="text-2xl font-bold text-red-600">{metrics.publishing.failed}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="indexing" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Indexation en cours</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="text-sm text-muted-foreground">Actifs</div><div className="text-2xl font-bold">{metrics.indexing.active}</div></div>
                <div><div className="text-sm text-muted-foreground">En attente</div><div className="text-2xl font-bold">{metrics.indexing.queued}</div></div>
                <div><div className="text-sm text-muted-foreground">Indexés</div><div className="text-2xl font-bold text-green-600">{metrics.indexing.indexed}</div></div>
                <div><div className="text-sm text-muted-foreground">En attente</div><div className="text-2xl font-bold text-amber-600">{metrics.indexing.pending}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
