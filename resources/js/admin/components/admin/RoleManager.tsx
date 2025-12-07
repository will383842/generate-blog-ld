/**
 * Role Manager Component
 * File 347 - Manage roles with CRUD operations
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Copy,
  Users,
  Lock,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCloneRole,
} from '@/hooks/useUsers';
import { Role, CreateRoleInput, UpdateRoleInput } from '@/types/user';
import { cn } from '@/lib/utils';

interface RoleManagerProps {
  onRoleSelect?: (role: Role) => void;
  selectedRoleId?: number;
}

export function RoleManager({ onRoleSelect, selectedRoleId }: RoleManagerProps) {
  const { t } = useTranslation();
  const { data: roles, isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const cloneRole = useCloneRole();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [cloneName, setCloneName] = useState('');

  // Handle create
  const handleCreate = async () => {
    try {
      await createRole.mutateAsync({
        name: formData.name,
        description: formData.description,
        permissions: [],
      });
      setShowCreateDialog(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedRole) return;
    try {
      await updateRole.mutateAsync({
        id: selectedRole.id,
        name: formData.name,
        description: formData.description,
      });
      setShowEditDialog(false);
      setSelectedRole(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole.mutateAsync(selectedRole.id);
      setShowDeleteDialog(false);
      setSelectedRole(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle clone
  const handleClone = async () => {
    if (!selectedRole) return;
    try {
      await cloneRole.mutateAsync({ id: selectedRole.id, name: cloneName });
      setShowCloneDialog(false);
      setSelectedRole(null);
      setCloneName('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Open edit dialog
  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setShowEditDialog(true);
  };

  // Open clone dialog
  const openCloneDialog = (role: Role) => {
    setSelectedRole(role);
    setCloneName(`${role.name} (copie)`);
    setShowCloneDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Rôles</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les rôles et leurs permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map(role => (
          <Card
            key={role.id}
            className={cn(
              'cursor-pointer transition-colors',
              selectedRoleId === role.id && 'border-primary bg-primary/5',
              role.isSystem && 'border-dashed'
            )}
            onClick={() => onRoleSelect?.(role)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    role.isSystem ? 'bg-yellow-100' : 'bg-primary/10'
                  )}>
                    <Shield className={cn(
                      'h-5 w-5',
                      role.isSystem ? 'text-yellow-600' : 'text-primary'
                    )} />
                  </div>
                  <div>
                    <h4 className="font-medium">{role.name}</h4>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-2 w-2 mr-1" />
                        Système
                      </Badge>
                    )}
                  </div>
                </div>
                {!role.isSystem && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(role);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        openCloneDialog(role);
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Cloner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(role);
                        }}
                        className="text-red-600"
                        disabled={role.usersCount > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {role.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {role.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {role.usersCount} utilisateur{role.usersCount > 1 ? 's' : ''}
                </div>
                <Badge variant="secondary">
                  {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau rôle</DialogTitle>
            <DialogDescription>
              Créez un nouveau rôle avec des permissions personnalisées
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du rôle</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Éditeur"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du rôle..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || createRole.isPending}
            >
              {createRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du rôle</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || updateRole.isPending}
            >
              {updateRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cloner le rôle</DialogTitle>
            <DialogDescription>
              Créez une copie de "{selectedRole?.name}" avec ses permissions
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Nom du nouveau rôle</Label>
            <Input
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloneDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleClone}
              disabled={!cloneName || cloneRole.isPending}
            >
              {cloneRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cloner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le rôle "{selectedRole?.name}" sera définitivement supprimé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RoleManager;
