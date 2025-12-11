/**
 * Profile Sessions Page
 * Active sessions management and login history
 */

import React, { useState } from 'react';
import { Monitor, Smartphone, Tablet, MapPin, Calendar, LogOut, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';

interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginHistory {
  id: string;
  timestamp: string;
  device: string;
  location: string;
  ip: string;
  success: boolean;
}

export default function ProfileSessionsPage() {
  const { toast } = useToast();
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  const [activeSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows PC',
      deviceType: 'desktop',
      browser: 'Chrome 120',
      os: 'Windows 11',
      location: 'Marseille, France',
      ip: '91.160.45.123',
      lastActive: 'Maintenant',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 15 Pro',
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS 17',
      location: 'Paris, France',
      ip: '82.124.33.87',
      lastActive: 'Il y a 2 heures',
      isCurrent: false,
    },
    {
      id: '3',
      device: 'MacBook Pro',
      deviceType: 'desktop',
      browser: 'Firefox 121',
      os: 'macOS 14',
      location: 'Lyon, France',
      ip: '90.45.12.234',
      lastActive: 'Il y a 1 jour',
      isCurrent: false,
    },
  ]);

  const [loginHistory] = useState<LoginHistory[]>([
    {
      id: '1',
      timestamp: '2024-12-10 14:30',
      device: 'Windows PC - Chrome',
      location: 'Marseille, France',
      ip: '91.160.45.123',
      success: true,
    },
    {
      id: '2',
      timestamp: '2024-12-10 09:15',
      device: 'iPhone - Safari',
      location: 'Paris, France',
      ip: '82.124.33.87',
      success: true,
    },
    {
      id: '3',
      timestamp: '2024-12-09 18:45',
      device: 'MacBook Pro - Firefox',
      location: 'Lyon, France',
      ip: '90.45.12.234',
      success: true,
    },
    {
      id: '4',
      timestamp: '2024-12-09 11:20',
      device: 'Unknown Device - Chrome',
      location: 'Bucarest, Roumanie',
      ip: '89.234.156.78',
      success: false,
    },
    {
      id: '5',
      timestamp: '2024-12-08 16:30',
      device: 'Windows PC - Chrome',
      location: 'Marseille, France',
      ip: '91.160.45.123',
      success: true,
    },
  ]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessionToRevoke(null);
    toast({ title: 'Session révoquée avec succès' });
  };

  const handleRevokeAll = () => {
    setShowRevokeAll(false);
    toast({ title: 'Toutes les sessions ont été révoquées' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Sessions
          </h1>
          <p className="text-muted-foreground">Gérez vos sessions actives et l'historique des connexions</p>
        </div>
        <Button variant="destructive" onClick={() => setShowRevokeAll(true)}>
          <LogOut className="w-4 h-4 mr-2" />
          Révoquer toutes les sessions
        </Button>
      </div>

      {/* Security Alert */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-orange-900">Activité suspecte détectée</div>
              <div className="text-sm text-orange-700 mt-1">
                Une tentative de connexion échouée depuis Bucarest, Roumanie a été enregistrée le 09/12/2024 à 11:20.
                Si ce n'était pas vous, nous vous recommandons de changer votre mot de passe immédiatement.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>
                {activeSessions.length} {activeSessions.length > 1 ? 'appareils connectés' : 'appareil connecté'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {session.device}
                          {session.isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Session actuelle
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.browser} · {session.os}
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session.id)}
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {session.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {session.lastActive}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground font-mono">
                    IP: {session.ip}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Login History */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Historique des connexions</CardTitle>
              <CardDescription>Dernières activités sur votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loginHistory.map((login) => (
                  <div
                    key={login.id}
                    className={`p-3 border rounded-lg ${
                      !login.success ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={login.success ? 'default' : 'destructive'} className="text-xs">
                          {login.success ? 'Succès' : 'Échec'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {login.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{login.device}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {login.location}
                      </div>
                      <div className="font-mono">
                        {login.ip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{activeSessions.length}</div>
              <div className="text-sm text-muted-foreground">Sessions actives</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{loginHistory.filter(l => l.success).length}</div>
              <div className="text-sm text-muted-foreground">Connexions réussies</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {loginHistory.filter(l => !l.success).length}
              </div>
              <div className="text-sm text-muted-foreground">Tentatives échouées</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Pays différents</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revoke Session Dialog */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer cette session ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action déconnectera l'appareil de votre compte. Vous pourrez toujours vous reconnecter depuis cet appareil plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRevokeSession(sessionToRevoke!)}>
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer toutes les sessions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action déconnectera tous les appareils de votre compte, sauf celui que vous utilisez actuellement.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAll} className="bg-red-600 hover:bg-red-700">
              Révoquer toutes les sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
