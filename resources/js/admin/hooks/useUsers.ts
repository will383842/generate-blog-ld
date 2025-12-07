/**
 * Users Hooks
 * File 343 - TanStack Query hooks for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  User,
  UserListItem,
  CreateUserInput,
  UpdateUserInput,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  Permission,
  PermissionGroupInfo,
  ActivityLog,
  UserFilters,
  ActivityLogFilters,
} from '@/types/user';

const API_BASE = '/admin';

// ============================================
// Query Keys
// ============================================

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: number) => [...usersKeys.details(), id] as const,
};

export const rolesKeys = {
  all: ['roles'] as const,
  list: () => [...rolesKeys.all, 'list'] as const,
  detail: (id: number) => [...rolesKeys.all, 'detail', id] as const,
};

export const permissionsKeys = {
  all: ['permissions'] as const,
  list: () => [...permissionsKeys.all, 'list'] as const,
  grouped: () => [...permissionsKeys.all, 'grouped'] as const,
};

export const activityKeys = {
  all: ['activity'] as const,
  list: (filters: ActivityLogFilters) => [...activityKeys.all, 'list', filters] as const,
};

// ============================================
// API Functions - Users
// ============================================

async function fetchUsers(filters: UserFilters): Promise<{
  data: UserListItem[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{ data: UserListItem[]; total: number; page: number; per_page: number }>(`${API_BASE}/users`, { params: filters });
  return data;
}

async function fetchUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`${API_BASE}/users/${id}`);
  return data;
}

async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<User>(`${API_BASE}/users`, input);
  return data;
}

async function updateUser({ id, ...input }: UpdateUserInput & { id: number }): Promise<User> {
  const { data } = await api.put<User>(`${API_BASE}/users/${id}`, input);
  return data;
}

async function deleteUser(id: number): Promise<void> {
  await api.delete(`${API_BASE}/users/${id}`);
}

async function suspendUser(id: number, reason?: string): Promise<User> {
  const { data } = await api.post<User>(`${API_BASE}/users/${id}/suspend`, { reason });
  return data;
}

async function activateUser(id: number): Promise<User> {
  const { data } = await api.post<User>(`${API_BASE}/users/${id}/activate`);
  return data;
}

// ============================================
// API Functions - Roles
// ============================================

async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get<Role[]>(`${API_BASE}/roles`);
  return data;
}

async function fetchRole(id: number): Promise<Role> {
  const { data } = await api.get<Role>(`${API_BASE}/roles/${id}`);
  return data;
}

async function createRole(input: CreateRoleInput): Promise<Role> {
  const { data } = await api.post<Role>(`${API_BASE}/roles`, input);
  return data;
}

async function updateRole({ id, ...input }: UpdateRoleInput & { id: number }): Promise<Role> {
  const { data } = await api.put<Role>(`${API_BASE}/roles/${id}`, input);
  return data;
}

async function deleteRole(id: number): Promise<void> {
  await api.delete(`${API_BASE}/roles/${id}`);
}

async function cloneRole(id: number, name: string): Promise<Role> {
  const { data } = await api.post<Role>(`${API_BASE}/roles/${id}/clone`, { name });
  return data;
}

// ============================================
// API Functions - Permissions
// ============================================

async function fetchPermissions(): Promise<Permission[]> {
  const { data } = await api.get<Permission[]>(`${API_BASE}/permissions`);
  return data;
}

async function fetchPermissionsGrouped(): Promise<PermissionGroupInfo[]> {
  const { data } = await api.get<PermissionGroupInfo[]>(`${API_BASE}/permissions/grouped`);
  return data;
}

async function assignRole(userId: number, roleId: number): Promise<User> {
  const { data } = await api.put<User>(`${API_BASE}/users/${userId}/role`, { roleId });
  return data;
}

// ============================================
// API Functions - Activity
// ============================================

async function fetchActivityLogs(filters: ActivityLogFilters): Promise<{
  data: ActivityLog[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{ data: ActivityLog[]; total: number; page: number; per_page: number }>(`${API_BASE}/activity`, { params: filters });
  return data;
}

// ============================================
// User Query Hooks
// ============================================

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => fetchUsers(filters),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: id > 0,
  });
}

// ============================================
// User Mutation Hooks
// ============================================

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast({ title: 'Utilisateur créé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer l\'utilisateur', variant: 'destructive' });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.setQueryData(usersKeys.detail(data.id), data);
      toast({ title: 'Utilisateur modifié' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de modifier l\'utilisateur', variant: 'destructive' });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast({ title: 'Utilisateur supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'utilisateur', variant: 'destructive' });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => suspendUser(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.setQueryData(usersKeys.detail(data.id), data);
      toast({ title: 'Utilisateur suspendu' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de suspendre l\'utilisateur', variant: 'destructive' });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.setQueryData(usersKeys.detail(data.id), data);
      toast({ title: 'Utilisateur activé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'activer l\'utilisateur', variant: 'destructive' });
    },
  });
}

// ============================================
// Role Query Hooks
// ============================================

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: fetchRoles,
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => fetchRole(id),
    enabled: id > 0,
  });
}

// ============================================
// Role Mutation Hooks
// ============================================

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast({ title: 'Rôle créé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer le rôle', variant: 'destructive' });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      queryClient.setQueryData(rolesKeys.detail(data.id), data);
      toast({ title: 'Rôle modifié' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de modifier le rôle', variant: 'destructive' });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast({ title: 'Rôle supprimé' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le rôle', variant: 'destructive' });
    },
  });
}

export function useCloneRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => cloneRole(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast({ title: 'Rôle cloné' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de cloner le rôle', variant: 'destructive' });
    },
  });
}

// ============================================
// Permission Hooks
// ============================================

export function usePermissions() {
  return useQuery({
    queryKey: permissionsKeys.list(),
    queryFn: fetchPermissions,
    staleTime: 300000,
  });
}

export function usePermissionsGrouped() {
  return useQuery({
    queryKey: permissionsKeys.grouped(),
    queryFn: fetchPermissionsGrouped,
    staleTime: 300000,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => assignRole(userId, roleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.setQueryData(usersKeys.detail(data.id), data);
      toast({ title: 'Rôle assigné' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'assigner le rôle', variant: 'destructive' });
    },
  });
}

// ============================================
// Activity Hooks
// ============================================

export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => fetchActivityLogs(filters),
  });
}
