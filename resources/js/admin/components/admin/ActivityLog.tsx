/**
 * Activity Log Component
 * File 349 - Timeline of user activities
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Filter,
  User,
  LogIn,
  LogOut,
  FileText,
  Settings,
  Shield,
  Zap,
  Database,
  Key,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useActivityLogs } from '@/hooks/useUsers';
import {
  ActivityAction,
  ACTIVITY_ACTION_LABELS,
  ActivityLogFilters,
} from '@/types/user';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLogProps {
  userId?: number;
  limit?: number;
  showFilters?: boolean;
}

// Icon mapping
const getActionIcon = (action: ActivityAction) => {
  if (action.startsWith('user.login')) return LogIn;
  if (action.startsWith('user.logout')) return LogOut;
  if (action.startsWith('user.')) return User;
  if (action.startsWith('role.')) return Shield;
  if (action.startsWith('content.')) return FileText;
  if (action.startsWith('program.')) return Zap;
  if (action.startsWith('settings.')) return Settings;
  if (action.startsWith('backup.')) return Database;
  if (action.startsWith('api.')) return Key;
  if (action.startsWith('system.')) return Settings;
  return Activity;
};

// Color mapping
const getActionColor = (action: ActivityAction) => {
  if (action.includes('created')) return 'text-green-600 bg-green-100';
  if (action.includes('deleted')) return 'text-red-600 bg-red-100';
  if (action.includes('updated') || action.includes('activated')) return 'text-blue-600 bg-blue-100';
  if (action.includes('suspended') || action.includes('stopped')) return 'text-yellow-600 bg-yellow-100';
  if (action.includes('login') || action.includes('started')) return 'text-green-600 bg-green-100';
  if (action.includes('logout')) return 'text-gray-600 bg-gray-100';
  return 'text-gray-600 bg-gray-100';
};

export function ActivityLog({ userId, limit = 20, showFilters = true }: ActivityLogProps) {
  useTranslation();

  const [filters, setFilters] = useState<ActivityLogFilters>({
    userId,
    per_page: limit,
  });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const { data, isLoading } = useActivityLogs(filters);

  // Toggle expanded
  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Action</Label>
                  <Select
                    value={filters.action || 'all'}
                    onValueChange={(v) => setFilters({
                      ...filters,
                      action: v === 'all' ? undefined : v as ActivityAction,
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      <SelectItem value="user.login">Connexions</SelectItem>
                      <SelectItem value="user.created">Créations utilisateur</SelectItem>
                      <SelectItem value="content.created">Créations contenu</SelectItem>
                      <SelectItem value="content.published">Publications</SelectItem>
                      <SelectItem value="settings.updated">Modifications paramètres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date de début</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date de fin</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activité récente
            {data?.total && (
              <Badge variant="secondary">{data.total}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {data?.data.map((log, idx) => {
                const Icon = getActionIcon(log.action);
                const colorClass = getActionColor(log.action);
                const hasDetails = log.details && Object.keys(log.details).length > 0;

                return (
                  <div key={log.id} className="flex gap-3">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        colorClass
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < (data?.data.length || 0) - 1 && (
                        <div className="w-0.5 flex-1 bg-border my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <Collapsible
                        open={expandedItems.has(log.id)}
                        onOpenChange={() => toggleExpanded(log.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={log.userAvatar} />
                              <AvatarFallback className="text-xs">
                                {getInitials(log.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{log.userName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>

                        <div className="mt-1">
                          <p className="text-sm">
                            <Badge variant="outline" className="mr-2">
                              {ACTIVITY_ACTION_LABELS[log.action]}
                            </Badge>
                            {log.description}
                          </p>
                          {log.targetLabel && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cible: {log.targetLabel}
                            </p>
                          )}
                        </div>

                        {hasDetails && (
                          <>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-6 text-xs"
                              >
                                {expandedItems.has(log.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Masquer les détails
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Voir les détails
                                  </>
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </CollapsibleContent>
                          </>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>IP: {log.ip}</span>
                          <span>•</span>
                          <span>{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</span>
                        </div>
                      </Collapsible>
                    </div>
                  </div>
                );
              })}

              {(!data?.data || data.data.length === 0) && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune activité</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {data && data.total > data.per_page && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {data.total} activités
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= Math.ceil(data.total / data.per_page)}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivityLog;
