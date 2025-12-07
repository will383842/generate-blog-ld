/**
 * Permissions Matrix Component
 * File 348 - Matrix view of roles and permissions
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useRoles, usePermissionsGrouped, useUpdateRole } from '@/hooks/useUsers';
import { Role, PermissionGroup, PERMISSION_GROUPS } from '@/types/user';
import { cn } from '@/lib/utils';

interface PermissionsMatrixProps {
  selectedRoleId?: number;
}

export function PermissionsMatrix({ selectedRoleId }: PermissionsMatrixProps) {
  const { t } = useTranslation();
  const { data: roles } = useRoles();
  const { data: permissionGroups, isLoading } = usePermissionsGrouped();
  const updateRole = useUpdateRole();

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Get selected role
  const selectedRole = roles?.find(r => r.id === selectedRoleId);

  // Toggle permission
  const togglePermission = async (role: Role, permissionSlug: string) => {
    if (role.isSystem) return;

    const newPermissions = role.permissions.includes(permissionSlug)
      ? role.permissions.filter(p => p !== permissionSlug)
      : [...role.permissions, permissionSlug];

    await updateRole.mutateAsync({
      id: role.id,
      permissions: newPermissions,
    });
  };

  // Toggle all permissions in group
  const toggleGroupPermissions = async (role: Role, groupId: string) => {
    if (role.isSystem) return;

    const group = permissionGroups?.find(g => g.id === groupId);
    if (!group) return;

    const groupPermissionSlugs = group.permissions.map(p => p.slug);
    const allGranted = groupPermissionSlugs.every(slug => role.permissions.includes(slug));

    let newPermissions: string[];
    if (allGranted) {
      // Remove all group permissions
      newPermissions = role.permissions.filter(p => !groupPermissionSlugs.includes(p));
    } else {
      // Add all group permissions
      newPermissions = [...new Set([...role.permissions, ...groupPermissionSlugs])];
    }

    await updateRole.mutateAsync({
      id: role.id,
      permissions: newPermissions,
    });
  };

  // Count permissions in group for role
  const countGrantedInGroup = (role: Role, groupId: string) => {
    const group = permissionGroups?.find(g => g.id === groupId);
    if (!group) return { granted: 0, total: 0 };

    const groupPermissionSlugs = group.permissions.map(p => p.slug);
    const granted = groupPermissionSlugs.filter(slug => role.permissions.includes(slug)).length;

    return { granted, total: group.permissions.length };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Matrice des permissions
          {selectedRole && (
            <Badge variant="outline" className="ml-2">
              {selectedRole.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="flex items-center border-b pb-2 mb-2 sticky top-0 bg-background z-10">
              <div className="w-64 font-medium">Permission</div>
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${roles?.length || 1}, 1fr)` }}>
                {roles?.map(role => (
                  <div key={role.id} className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant={selectedRoleId === role.id ? 'default' : 'outline'}
                            className="truncate max-w-[100px]"
                          >
                            {role.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{role.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {role.permissions.length} permissions
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission Groups */}
            <Accordion
              type="multiple"
              value={expandedGroups}
              onValueChange={setExpandedGroups}
              className="w-full"
            >
              {permissionGroups?.map(group => (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.permissions.length}
                        </Badge>
                      </div>
                      <div
                        className="flex-1 grid gap-2 ml-4"
                        style={{ gridTemplateColumns: `repeat(${roles?.length || 1}, 1fr)` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {roles?.map(role => {
                          const { granted, total } = countGrantedInGroup(role, group.id);
                          const allGranted = granted === total;
                          const someGranted = granted > 0 && granted < total;

                          return (
                            <div key={role.id} className="text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'inline-flex items-center justify-center w-6 h-6 rounded cursor-pointer',
                                        allGranted && 'bg-green-100 text-green-600',
                                        someGranted && 'bg-yellow-100 text-yellow-600',
                                        !granted && 'bg-gray-100 text-gray-400',
                                        role.isSystem && 'opacity-50 cursor-not-allowed'
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroupPermissions(role, group.id);
                                      }}
                                    >
                                      {allGranted ? (
                                        <Check className="h-4 w-4" />
                                      ) : someGranted ? (
                                        <span className="text-xs font-medium">{granted}</span>
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{role.name}</p>
                                    <p className="text-xs">{granted}/{total} permissions</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4">
                      {group.permissions.map(permission => (
                        <div
                          key={permission.id}
                          className="flex items-center py-2 border-b border-dashed last:border-0"
                        >
                          <div className="w-60">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  <span className="text-sm">{permission.name}</span>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs">{permission.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div
                            className="flex-1 grid gap-2"
                            style={{ gridTemplateColumns: `repeat(${roles?.length || 1}, 1fr)` }}
                          >
                            {roles?.map(role => {
                              const isGranted = role.permissions.includes(permission.slug);

                              return (
                                <div key={role.id} className="text-center">
                                  <Checkbox
                                    checked={isGranted}
                                    disabled={role.isSystem}
                                    onCheckedChange={() => togglePermission(role, permission.slug)}
                                    className={cn(
                                      isGranted && 'bg-green-500 border-green-500',
                                      !isGranted && 'border-gray-300'
                                    )}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 flex items-center justify-center">
              <Check className="h-3 w-3 text-green-600" />
            </div>
            <span className="text-sm text-muted-foreground">Toutes accordées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 flex items-center justify-center">
              <span className="text-xs font-medium text-yellow-600">3</span>
            </div>
            <span className="text-sm text-muted-foreground">Partiellement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center">
              <X className="h-3 w-3 text-gray-400" />
            </div>
            <span className="text-sm text-muted-foreground">Aucune</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionsMatrix;
