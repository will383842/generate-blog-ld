import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Grid3X3,
  List,
  Search,
  Trash2,
  Pause,
  Play,
  Calendar,
  BarChart3,
  Settings,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgramCard } from '@/components/programs/ProgramCard';
import { ProgramRow } from '@/components/programs/ProgramRow';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
} from '@/components/ui/Table';
import {
  usePrograms,
  useDeleteProgram,
  usePauseProgram,
  useResumeProgram,
  useRunProgram,
  useCloneProgram,
} from '@/hooks/usePrograms';
import { PLATFORMS } from '@/utils/constants';
import type { ProgramFilters, ProgramStatus } from '@/types/program';

type ViewMode = 'grid' | 'table';

const STATUS_OPTIONS: Array<{ value: ProgramStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'paused', label: 'En pause' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'scheduled', label: 'Planifiés' },
  { value: 'running', label: 'En cours' },
  { value: 'completed', label: 'Terminés' },
  { value: 'error', label: 'En erreur' },
];

export default function ProgramsListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ProgramFilters>({
    page: 1,
    perPage: 20,
  });

  const { data, isLoading, isError } = usePrograms(filters);
  const programs = data?.data || [];
  const pagination = data?.meta;

  const deleteProgram = useDeleteProgram();
  const pauseProgram = usePauseProgram();
  const resumeProgram = useResumeProgram();
  const runProgram = useRunProgram();
  const cloneProgram = useCloneProgram();

  // Stats summary
  const stats = useMemo(() => {
    return {
      total: programs.length,
      active: programs.filter((p) => p.status === 'active').length,
      paused: programs.filter((p) => p.status === 'paused').length,
      running: programs.filter((p) => p.status === 'running').length,
      totalGenerated: programs.reduce((sum, p) => sum + p.totalGenerated, 0),
      totalCost: programs.reduce((sum, p) => sum + p.totalCost, 0),
    };
  }, [programs]);

  const handleFilterChange = (key: keyof ProgramFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: key !== 'page' ? 1 : value,
    }));
  };

  const handleSelectAll = () => {
    if (selectedIds.size === programs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(programs.map((p) => p.id)));
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (action: 'delete' | 'pause' | 'resume') => {
    const ids = Array.from(selectedIds);
    
    switch (action) {
      case 'delete':
        if (!confirm(`Supprimer ${ids.length} programme(s) ?`)) return;
        await Promise.all(ids.map((id) => deleteProgram.mutateAsync({ id })));
        break;
      case 'pause':
        await Promise.all(ids.map((id) => pauseProgram.mutateAsync(id)));
        break;
      case 'resume':
        await Promise.all(ids.map((id) => resumeProgram.mutateAsync(id)));
        break;
    }
    
    setSelectedIds(new Set());
  };

  const clearFilters = () => {
    setFilters({ page: 1, perPage: 20 });
  };

  const hasActiveFilters = filters.search || filters.status || filters.platformId;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programmes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos programmes de génération automatisée
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/programs/calendar')}>
            <Calendar className="w-4 h-4 mr-2" />
            Calendrier
          </Button>
          <Button variant="outline" onClick={() => navigate('/programs/analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => navigate('/programs/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un programme
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total programmes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
            <p className="text-xs text-muted-foreground">En pause</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.totalGenerated.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Articles générés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">${stats.totalCost.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Coût total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-[180px]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>

        {/* Platform filter */}
        <Select
          value={filters.platformId || 'all'}
          onChange={(e) => handleFilterChange('platformId', e.target.value)}
          className="w-[180px]"
        >
          <option value="all">Toutes plateformes</option>
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Effacer
          </Button>
        )}

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} programme(s) sélectionné(s)
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('pause')}
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('resume')}
            >
              <Play className="w-4 h-4 mr-1" />
              Reprendre
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-12 text-red-600">
          Erreur lors du chargement des programmes
        </div>
      )}

      {/* Empty state */}
      {!isLoading && programs.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="font-medium text-gray-900">Aucun programme</p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? 'Aucun résultat pour ces filtres'
              : 'Créez votre premier programme de génération'
            }
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={() => navigate('/programs/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un programme
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {!isLoading && programs.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              isSelected={selectedIds.has(program.id)}
              onClick={(id) => navigate(`/programs/${id}`)}
              onEdit={(id) => navigate(`/programs/${id}/edit`)}
              onClone={(id) => cloneProgram.mutate({ id })}
              onDelete={(id) => {
                if (confirm('Supprimer ce programme ?')) {
                  deleteProgram.mutate({ id });
                }
              }}
              onRun={(id) => runProgram.mutate({ id })}
              onPause={(id) => pauseProgram.mutate(id)}
              onResume={(id) => resumeProgram.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {!isLoading && programs.length > 0 && viewMode === 'table' && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === programs.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Types</TableHead>
                <TableHead>Couverture</TableHead>
                <TableHead>Production</TableHead>
                <TableHead>Succès</TableHead>
                <TableHead>Prochaine exécution</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <ProgramRow
                  key={program.id}
                  program={program}
                  isSelected={selectedIds.has(program.id)}
                  onSelect={handleSelect}
                  onView={(id) => navigate(`/programs/${id}`)}
                  onEdit={(id) => navigate(`/programs/${id}/edit`)}
                  onClone={(id) => cloneProgram.mutate({ id })}
                  onDelete={(id) => {
                    if (confirm('Supprimer ce programme ?')) {
                      deleteProgram.mutate({ id });
                    }
                  }}
                  onRun={(id) => runProgram.mutate({ id })}
                  onPause={(id) => pauseProgram.mutate(id)}
                  onResume={(id) => resumeProgram.mutate(id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.perPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.from}-{pagination.to} sur {pagination.total} programmes
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.lastPage}
              onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
