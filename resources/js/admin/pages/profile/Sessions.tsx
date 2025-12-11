/**
 * Profile Sessions Page
 * Active sessions management and login history
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone, Tablet, MapPin, Calendar, LogOut, Shield, AlertCircle, Loader2 } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  // Fetch active sessions
  const { data: activeSessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['profile', 'sessions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/profile/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
  });

  // Fetch login history
  const { data: loginHistory = [], isLoading: historyLoading } = useQuery<LoginHistory[]>({
    queryKey: ['profile', 'login-history'],
    queryFn: async () => {
      const res = await fetch('/api/admin/profile/login-history');
      if (!res.ok) throw new Error('Failed to fetch login history');
      return res.json();
    },
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/admin/profile/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to revoke session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] });
      toast({
        title: 'Session révoquée',
        description: 'La session a été déconnectée avec succès',
      });
      setSessionToRevoke(null);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer la session',
        variant: 'destructive',
      });
    },
  });

  // Revoke all sessions mutation
  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/profile/sessions/revoke-all', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to revoke all sessions');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] });
      toast({
        title: 'Sessions révoquées',
        description: 'Toutes les autres sessions ont été déconnectées',
      });
      setShowRevokeAll(false);
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer les sessions',
        variant: 'destructive',
      });
    },
  });

  const handleRevokeSession = (sessionId: string) => {
    setSessionToRevoke(sessionId);
  };

  const confirmRevokeSession = () => {
    if (sessionToRevoke) {
      revokeSessionMutation.mutate(sessionToRevoke);
    }
  };

  const handleRevokeAll = () => {
    setShowRevokeAll(true);
  };

  const confirmRevokeAll = () => {
    revokeAllMutation.mutate();
  };

  const getDeviceIcon = (deviceType: Session['deviceType']) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
    }
  };

  if (sessionsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>Gérez vos sessions de connexion actives</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleRevokeAll}
              disabled={activeSessions.filter(s => !s.isCurrent).length === 0}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnecter les autres
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune session active</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Session actuelle
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <p>
                          {session.browser} • {session.os}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location} • {session.ip}
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {session.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique de connexion</CardTitle>
          <CardDescription>Dernières tentatives de connexion à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loginHistory.map((login) => (
                <div
                  key={login.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        login.success ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {login.success ? (
                        <Shield className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{login.device}</p>
                        <Badge variant={login.success ? 'default' : 'destructive'}>
                          {login.success ? 'Réussie' : 'Échouée'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 mt-1">
                        <p>{login.timestamp}</p>
                        <p>
                          {login.location} • {login.ip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Session Dialog */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter cette session ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette session sera immédiatement déconnectée et devra se reconnecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeSession}>
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter toutes les autres sessions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les sessions actives sauf celle-ci seront déconnectées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeAll}>
              Déconnecter tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
