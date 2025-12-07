/**
 * Activity Admin Page
 * File 357 - Activity log full page
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Download,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { useActivityLogs, useUsers } from '@/hooks/useUsers';
import { ActivityLogFilters, ActivityAction, ACTIVITY_ACTION_LABELS } from '@/types/user';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function ActivityPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');

  const [filters, setFilters] = useState<ActivityLogFilters>({
    userId: userIdParam ? parseInt(userIdParam) : undefined,
    per_page: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: activityData, isLoading } = useActivityLogs(filters);
  const { data: usersData } = useUsers({ per_page: 100 });

  // Export to CSV
  const handleExport = () => {
    if (!activityData?.data) return;

    const csv = [
      'id,user,email,action,description,ip,date',
      ...activityData.data.map(log =>
        `${log.id},"${log.userName}","${log.userEmail}","${log.action}","${log.description.replace(/"/g, '""')}","${log.ip}","${log.createdAt}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Quick date filters
  const setDateRange = (days: number) => {
    const now = new Date();
    setFilters({
      ...filters,
      dateFrom: format(subDays(now, days), 'yyyy-MM-dd'),
      dateTo: format(now, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Journal d'activité
          </h1>
          <p className="text-muted-foreground">Historique des actions des utilisateurs</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{activityData?.total || 0}</p>
            <p className="text-sm text-muted-foreground">Actions totales</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setDateRange(1)}>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">Aujourd'hui</p>
            <p className="text-sm text-muted-foreground">Filtrer</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setDateRange(7)}>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-purple-600">7 derniers jours</p>
            <p className="text-sm text-muted-foreground">Filtrer</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setDateRange(30)}>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">30 derniers jours</p>
            <p className="text-sm text-muted-foreground">Filtrer</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Utilisateur</Label>
              <Select
                value={String(filters.userId || 'all')}
                onValueChange={(v) => setFilters({
                  ...filters,
                  userId: v === 'all' ? undefined : parseInt(v),
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {usersData?.data.map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type d'action</Label>
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
                  {Object.entries(ACTIVITY_ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ per_page: 50 })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <ActivityLog
        userId={filters.userId}
        limit={50}
        showFilters={false}
      />
    </div>
  );
}
