/**
 * Users Admin Page
 * File 355 - User management with list, create, edit, suspend
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  UserX,
  Trash2,
  Activity,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { UserCard } from '@/components/admin/UserCard';
import { UserForm } from '@/components/admin/UserForm';
import { ActivityLog } from '@/components/admin/ActivityLog';
import {
  useUsers,
  useUser,
  useRoles,
  useDeleteUser,
  useSuspendUser,
  useActivateUser,
} from '@/hooks/useUsers';
import { UserListItem, UserFilters, User } from '@/types/user';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function UsersPage() {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState<UserFilters>({ per_page: 20 });
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const { data: usersData, isLoading } = useUsers({
    ...filters,
    search: search || undefined,
  });
  const { data: selectedUser } = useUser(selectedUserId || 0);
  const { data: roles } = useRoles();

  const deleteUser = useDeleteUser();
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle edit
  const handleEdit = (user: UserListItem) => {
    setSelectedUserId(user.id);
    setShowEditDialog(true);
  };

  // Handle suspend
  const handleSuspend = (user: UserListItem) => {
    setSelectedUserId(user.id);
    setSuspendReason('');
    setShowSuspendDialog(true);
  };

  // Handle activate
  const handleActivate = async (user: UserListItem) => {
    await activateUser.mutateAsync(user.id);
  };

  // Handle delete
  const handleDelete = (user: UserListItem) => {
    setSelectedUserId(user.id);
    setShowDeleteDialog(true);
  };

  // Handle view activity
  const handleViewActivity = (user: UserListItem) => {
    setSelectedUserId(user.id);
    setShowActivityDialog(true);
  };

  // Confirm suspend
  const confirmSuspend = async () => {
    if (!selectedUserId) return;
    await suspendUser.mutateAsync({ id: selectedUserId, reason: suspendReason });
    setShowSuspendDialog(false);
    setSelectedUserId(null);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedUserId) return;
    await deleteUser.mutateAsync(selectedUserId);
    setShowDeleteDialog(false);
    setSelectedUserId(null);
  };

  // Toggle user selection
  const toggleUserSelection = (id: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedUsers.size === usersData?.data.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(usersData?.data.map(u => u.id)));
    }
  };

  // Bulk suspend
  const bulkSuspend = async () => {
    for (const id of selectedUsers) {
      await suspendUser.mutateAsync({ id });
    }
    setSelectedUsers(new Set());
  };

  // Bulk delete
  const bulkDelete = async () => {
    for (const id of selectedUsers) {
      await deleteUser.mutateAsync(id);
    }
    setSelectedUsers(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="h-6 w-6" />
            Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs accès
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="pl-9"
              />
            </div>
            <Select
              value={filters.roleId?.toString() || 'all'}
              onValueChange={(v) => setFilters({
                ...filters,
                roleId: v === 'all' ? undefined : parseInt(v),
              })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roles?.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={
                filters.isActive === undefined
                  ? 'all'
                  : filters.isSuspended
                    ? 'suspended'
                    : filters.isActive
                      ? 'active'
                      : 'inactive'
              }
              onValueChange={(v) => {
                if (v === 'all') {
                  setFilters({ ...filters, isActive: undefined, isSuspended: undefined });
                } else if (v === 'active') {
                  setFilters({ ...filters, isActive: true, isSuspended: false });
                } else if (v === 'inactive') {
                  setFilters({ ...filters, isActive: false, isSuspended: false });
                } else if (v === 'suspended') {
                  setFilters({ ...filters, isSuspended: true });
                }
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="suspended">Suspendus</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedUsers.size} utilisateur{selectedUsers.size > 1 ? 's' : ''} sélectionné{selectedUsers.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={bulkSuspend}>
              <UserX className="h-4 w-4 mr-2" />
              Suspendre
            </Button>
            <Button variant="outline" size="sm" onClick={bulkDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Users List/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersData?.data.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onSuspend={handleSuspend}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onViewActivity={handleViewActivity}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === usersData?.data.length && usersData.data.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.data.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.roleName}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.isSuspended ? (
                          <Badge className="bg-red-100 text-red-800">Suspendu</Badge>
                        ) : user.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastLoginAt ? (
                          formatDistanceToNow(new Date(user.lastLoginAt), {
                            addSuffix: true,
                            locale: fr,
                          })
                        ) : (
                          'Jamais'
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">•••</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewActivity(user)}>
                              <Activity className="h-4 w-4 mr-2" />
                              Voir l'activité
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isSuspended ? (
                              <DropdownMenuItem onClick={() => handleActivate(user)}>
                                Réactiver
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleSuspend(user)}>
                                Suspendre
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-red-600"
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {usersData && usersData.total > usersData.per_page && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {usersData.total} utilisateurs
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersData.page <= 1}
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersData.page >= Math.ceil(usersData.total / usersData.per_page)}
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <UserForm
            onSuccess={() => setShowCreateDialog(false)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedUserId(null);
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedUserId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Activité de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUserId && (
            <ActivityLog userId={selectedUserId} limit={20} showFilters={false} />
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspendre l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">L'utilisateur ne pourra plus se connecter.</p>
              <div>
                <Label>Raison (optionnel)</Label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Motif de suspension..."
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {suspendUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Suspendre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
