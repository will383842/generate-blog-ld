/**
 * useRoles Hook
 * Role-based access control (RBAC) management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory =
  | 'articles'
  | 'translations'
  | 'publishing'
  | 'generation'
  | 'platforms'
  | 'users'
  | 'settings'
  | 'analytics'
  | 'system';

export interface CreateRoleInput {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  id: number;
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface AssignRoleInput {
  userId: number;
  roleIds: number[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: number) => [...roleKeys.all, 'detail', id] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const,
  userRoles: (userId: number) => [...roleKeys.all, 'user', userId] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get<Role[]>('/admin/roles');
  return data;
}

async function fetchRole(id: number): Promise<Role> {
  const { data } = await api.get<Role>(`/admin/roles/${id}`);
  return data;
}

async function fetchPermissions(): Promise<Permission[]> {
  const { data } = await api.get<Permission[]>('/admin/roles/permissions');
  return data;
}

async function createRole(input: CreateRoleInput): Promise<Role> {
  const { data } = await api.post<Role>('/admin/roles', input);
  return data;
}

async function updateRole(input: UpdateRoleInput): Promise<Role> {
  const { id, ...roleData } = input;
  const { data } = await api.put<Role>(`/admin/roles/${id}`, roleData);
  return data;
}

async function deleteRole(id: number): Promise<void> {
  await api.delete(`/admin/roles/${id}`);
}

async function assignRoles(input: AssignRoleInput): Promise<void> {
  await api.put(`/admin/users/${input.userId}/roles`, { roles: input.roleIds });
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all roles
 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: fetchRoles,
    staleTime: 60000,
  });
}

/**
 * Fetch a single role
 */
export function useRole(id: number) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => fetchRole(id),
    enabled: !!id,
  });
}

/**
 * Fetch all available permissions
 */
export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: fetchPermissions,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Get permissions grouped by category
 */
export function usePermissionsByCategory() {
  const { data: permissions } = usePermissions();

  return useMemo(() => {
    if (!permissions) return {};

    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<PermissionCategory, Permission[]>);
  }, [permissions]);
}

/**
 * Create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

/**
 * Update a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: (role) => {
      queryClient.setQueryData(roleKeys.detail(role.id), role);
      queryClient.invalidateQueries({ queryKey: roleKeys.list() });
    },
  });
}

/**
 * Delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

/**
 * Assign roles to a user
 */
export function useAssignRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignRoles,
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Check if current user has a specific permission
 */
export function useHasPermission(permissionId: string): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Super admin has all permissions
  if (user.role === 'super_admin') return true;

  // Check if user's permissions include the requested one
  return user.permissions?.includes(permissionId) || false;
}

/**
 * Check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissionIds: string[]): boolean {
  const { user } = useAuth();

  if (!user) return false;
  if (user.role === 'super_admin') return true;

  return permissionIds.some((id) => user.permissions?.includes(id));
}

/**
 * Check if current user has all of the specified permissions
 */
export function useHasAllPermissions(permissionIds: string[]): boolean {
  const { user } = useAuth();

  if (!user) return false;
  if (user.role === 'super_admin') return true;

  return permissionIds.every((id) => user.permissions?.includes(id));
}

/**
 * Get current user's permissions
 */
export function useCurrentPermissions(): string[] {
  const { user } = useAuth();
  return user?.permissions || [];
}

export default useRoles;
