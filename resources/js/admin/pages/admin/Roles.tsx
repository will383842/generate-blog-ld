/**
 * Roles Admin Page
 * File 356 - Role and permissions management
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { RoleManager } from '@/components/admin/RoleManager';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';
import { useRoles, useUsers } from '@/hooks/useUsers';
import { Role } from '@/types/user';

export default function RolesPage() {
  const { t } = useTranslation();
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>();
  
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: usersData } = useUsers({ per_page: 1 });

  // Handle role select
  const handleRoleSelect = (role: Role) => {
    setSelectedRoleId(role.id);
  };

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Rôles & Permissions
          </h1>
          <p className="text-muted-foreground">
            Gérez les rôles et leurs permissions d'accès
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roles?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Rôles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usersData?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {roles?.filter(r => r.isSystem).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Rôles système</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {roles?.filter(r => !r.isSystem).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Rôles personnalisés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Gestion des rôles
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Users className="h-4 w-4 mr-2" />
            Matrice des permissions
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <RoleManager
            onRoleSelect={handleRoleSelect}
            selectedRoleId={selectedRoleId}
          />

          {/* Selected Role Details */}
          {selectedRoleId && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Permissions du rôle sélectionné
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {roles?.find(r => r.id === selectedRoleId)?.permissions.map(perm => (
                    <Badge key={perm} variant="secondary">
                      {perm}
                    </Badge>
                  ))}
                  {roles?.find(r => r.id === selectedRoleId)?.permissions.length === 0 && (
                    <p className="text-muted-foreground">Aucune permission assignée</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Matrix Tab */}
        <TabsContent value="matrix" className="mt-6">
          <PermissionsMatrix selectedRoleId={selectedRoleId} />
        </TabsContent>
      </Tabs>

      {/* Role Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition des utilisateurs par rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles?.map(role => {
              const total = roles.reduce((sum, r) => sum + r.usersCount, 0);
              const percentage = total > 0 ? (role.usersCount / total) * 100 : 0;

              return (
                <div key={role.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="outline" className="text-xs">Système</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {role.usersCount} utilisateur{role.usersCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
