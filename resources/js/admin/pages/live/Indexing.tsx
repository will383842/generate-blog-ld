/**
 * Live Indexing Monitoring
 */

import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

export default function LiveIndexingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Indexation Live
          </h1>
          <p className="text-muted-foreground">Suivi de l'indexation SEO</p>
        </div>
        <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Actifs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">2</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">34</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Indexés</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">987</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">189</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Progression globale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Google Search Console</span>
              <span className="text-sm font-medium">847/987</span>
            </div>
            <Progress value={85.8} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Bing Webmaster</span>
              <span className="text-sm font-medium">723/987</span>
            </div>
            <Progress value={73.2} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
