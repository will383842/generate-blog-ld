/**
 * Profile Security Page
 * Password management, 2FA, API tokens, and security settings
 */

import React, { useState } from 'react';
import { Shield, Key, Smartphone, Lock, Eye, EyeOff, Copy, Check, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';

export default function ProfileSecurityPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [apiTokens] = useState([
    { id: '1', name: 'Production API', token: 'sk_live_...abc123', createdAt: '2024-11-15', lastUsed: '2h ago' },
    { id: '2', name: 'Development', token: 'sk_test_...xyz789', createdAt: '2024-12-01', lastUsed: '5m ago' },
  ]);

  const handlePasswordChange = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    toast({ title: 'Mot de passe modifié avec succès' });
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast({
      title: twoFactorEnabled ? 'Authentification à deux facteurs désactivée' : 'Authentification à deux facteurs activée',
    });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: 'Token copié' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Sécurité
        </h1>
        <p className="text-muted-foreground">Gérez la sécurité de votre compte</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Changer le mot de passe
              </CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe régulièrement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Au moins 8 caractères, avec majuscules, minuscules et chiffres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>

              <Button onClick={handlePasswordChange} className="w-full">
                Mettre à jour le mot de passe
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Authentification à deux facteurs
              </CardTitle>
              <CardDescription>
                Ajoutez une couche de sécurité supplémentaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Activer 2FA</div>
                  <div className="text-sm text-muted-foreground">
                    Utiliser une application d'authentification
                  </div>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} />
              </div>

              {twoFactorEnabled && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="text-sm font-medium">Scanner ce QR code</div>
                  <div className="bg-muted h-48 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      QR Code placeholder
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Code de vérification</Label>
                    <Input placeholder="123456" maxLength={6} />
                  </div>
                  <Button className="w-full">Vérifier et activer</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* API Tokens */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Tokens API
                  </CardTitle>
                  <CardDescription>
                    Gérez vos clés d'accès API
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiTokens.map((token) => (
                <div key={token.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{token.name}</div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono">
                      {token.token}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyToken(token.token)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Créé le {token.createdAt}</span>
                    <span>Dernière utilisation: {token.lastUsed}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Déconnexion automatique</div>
                  <div className="text-sm text-muted-foreground">
                    Après 30 minutes d'inactivité
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notifications de connexion</div>
                  <div className="text-sm text-muted-foreground">
                    Par email à chaque nouvelle connexion
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Alertes de sécurité</div>
                  <div className="text-sm text-muted-foreground">
                    Activités suspectes
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
