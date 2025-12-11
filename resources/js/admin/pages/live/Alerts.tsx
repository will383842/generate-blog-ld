/**
 * Live Alerts Monitoring
 */

import React from 'react';
import { AlertCircle, Bell, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function LiveAlertsPage() {
  const alerts = [
    { id: '1', type: 'error', message: 'Échec génération article France', time: '2m ago', severity: 'high' },
    { id: '2', type: 'warning', message: 'API OpenAI ralentie', time: '5m ago', severity: 'medium' },
    { id: '3', type: 'info', message: 'Batch complété: 50 articles', time: '10m ago', severity: 'low' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'info': return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Alertes Live
          </h1>
          <p className="text-muted-foreground">Surveillance des alertes système</p>
        </div>
        <Button variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Erreurs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">3</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Warnings</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-600">12</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Info</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">45</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Alertes récentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {getIcon(alert.type)}
                <div className="flex-1">
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-sm text-muted-foreground">{alert.time}</div>
                </div>
                <Badge variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
