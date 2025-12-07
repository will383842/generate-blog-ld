/**
 * User Card Component
 * File 345 - Display user info in a card format
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  UserX,
  UserCheck,
  Trash2,
  Edit,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { UserListItem } from '@/types/user';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserCardProps {
  user: UserListItem;
  onEdit?: (user: UserListItem) => void;
  onSuspend?: (user: UserListItem) => void;
  onActivate?: (user: UserListItem) => void;
  onDelete?: (user: UserListItem) => void;
  onViewActivity?: (user: UserListItem) => void;
}

export function UserCard({
  user,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
  onViewActivity,
}: UserCardProps) {
  const { t } = useTranslation();

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get status
  const getStatus = () => {
    if (user.isSuspended) return { label: 'Suspendu', color: 'bg-red-100 text-red-800' };
    if (user.isActive) return { label: 'Actif', color: 'bg-green-100 text-green-800' };
    return { label: 'Inactif', color: 'bg-gray-100 text-gray-800' };
  };

  const status = getStatus();

  return (
    <Card className={cn(user.isSuspended && 'border-red-200 bg-red-50/50')}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          {/* User Info */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{user.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(user)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewActivity?.(user)}>
                <Activity className="h-4 w-4 mr-2" />
                Voir l'activité
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.isSuspended ? (
                <DropdownMenuItem onClick={() => onActivate?.(user)}>
                  <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-600">Réactiver</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onSuspend?.(user)}>
                  <UserX className="h-4 w-4 mr-2 text-yellow-600" />
                  <span className="text-yellow-600">Suspendre</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(user)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            {user.roleName}
          </Badge>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        {/* Last Login */}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {user.lastLoginAt ? (
            <>
              Dernière connexion{' '}
              {formatDistanceToNow(new Date(user.lastLoginAt), {
                addSuffix: true,
                locale: fr,
              })}
            </>
          ) : (
            'Jamais connecté'
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default UserCard;
