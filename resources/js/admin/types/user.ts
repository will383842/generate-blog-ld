/**
 * User Types
 * File 342 - Types for users, roles, permissions, and activity logs
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  roleId: number;
  permissions: string[];
  isActive: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspendedReason?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  emailVerifiedAt?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  roleName: string;
  roleId: number;
  isActive: boolean;
  isSuspended: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: number;
  isActive?: boolean;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
}

// ============================================
// Role Types
// ============================================

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

// ============================================
// Permission Types
// ============================================

export interface Permission {
  id: string;
  name: string;
  slug: string;
  group: PermissionGroup;
  description: string;
}

export type PermissionGroup = 
  | 'content'
  | 'programs'
  | 'seo'
  | 'analytics'
  | 'users'
  | 'roles'
  | 'settings'
  | 'system'
  | 'backups'
  | 'api';

export interface PermissionGroupInfo {
  id: PermissionGroup;
  name: string;
  description: string;
  permissions: Permission[];
}

// ============================================
// Activity Log Types
// ============================================

export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  action: ActivityAction;
  actionLabel: string;
  description: string;
  details?: Record<string, unknown>;
  targetType?: string;
  targetId?: number;
  targetLabel?: string;
  ip: string;
  userAgent?: string;
  createdAt: string;
}

export type ActivityAction =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.activated'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'content.created'
  | 'content.updated'
  | 'content.published'
  | 'content.deleted'
  | 'program.created'
  | 'program.updated'
  | 'program.started'
  | 'program.stopped'
  | 'settings.updated'
  | 'backup.created'
  | 'backup.restored'
  | 'system.cache_cleared'
  | 'system.worker_restarted'
  | 'api.key_rotated';

// ============================================
// Filters
// ============================================

export interface UserFilters {
  search?: string;
  roleId?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  per_page?: number;
  page?: number;
}

export interface ActivityLogFilters {
  userId?: number;
  action?: ActivityAction;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
  per_page?: number;
  page?: number;
}

// ============================================
// Constants
// ============================================

export const PERMISSION_GROUPS: Record<PermissionGroup, string> = {
  content: 'Contenu',
  programs: 'Programmes',
  seo: 'SEO',
  analytics: 'Analytics',
  users: 'Utilisateurs',
  roles: 'Rôles',
  settings: 'Paramètres',
  system: 'Système',
  backups: 'Sauvegardes',
  api: 'API',
};

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  'user.login': 'Connexion',
  'user.logout': 'Déconnexion',
  'user.created': 'Utilisateur créé',
  'user.updated': 'Utilisateur modifié',
  'user.deleted': 'Utilisateur supprimé',
  'user.suspended': 'Utilisateur suspendu',
  'user.activated': 'Utilisateur activé',
  'role.created': 'Rôle créé',
  'role.updated': 'Rôle modifié',
  'role.deleted': 'Rôle supprimé',
  'content.created': 'Contenu créé',
  'content.updated': 'Contenu modifié',
  'content.published': 'Contenu publié',
  'content.deleted': 'Contenu supprimé',
  'program.created': 'Programme créé',
  'program.updated': 'Programme modifié',
  'program.started': 'Programme démarré',
  'program.stopped': 'Programme arrêté',
  'settings.updated': 'Paramètres modifiés',
  'backup.created': 'Sauvegarde créée',
  'backup.restored': 'Sauvegarde restaurée',
  'system.cache_cleared': 'Cache vidé',
  'system.worker_restarted': 'Worker redémarré',
  'api.key_rotated': 'Clé API renouvelée',
};

export const ACTIVITY_ACTION_ICONS: Record<string, string> = {
  'user.login': 'LogIn',
  'user.logout': 'LogOut',
  'user.created': 'UserPlus',
  'user.updated': 'UserCog',
  'user.deleted': 'UserMinus',
  'user.suspended': 'UserX',
  'user.activated': 'UserCheck',
  'role.created': 'Shield',
  'role.updated': 'Shield',
  'role.deleted': 'ShieldOff',
  'content.created': 'FilePlus',
  'content.updated': 'FileEdit',
  'content.published': 'Send',
  'content.deleted': 'Trash',
  'program.created': 'Zap',
  'program.updated': 'Settings',
  'program.started': 'Play',
  'program.stopped': 'Pause',
  'settings.updated': 'Settings',
  'backup.created': 'Database',
  'backup.restored': 'RotateCcw',
  'system.cache_cleared': 'Trash2',
  'system.worker_restarted': 'RefreshCw',
  'api.key_rotated': 'Key',
};
