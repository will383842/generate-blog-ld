/**
 * Coverage Gaps Page
 * Full gaps analysis with filtering and bulk generation
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Sparkles,
  Globe,
  Languages,
  ArrowUpDown,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { GapsAnalysis } from '@/components/coverage/GapsAnalysis';
import { QuickGenerate } from '@/components/coverage/QuickGenerate';
import { useCoverageGaps, useDismissGap, useExportCoverageReport } from '@/hooks/useCoverage';
import { PLATFORMS } from '@/utils/constants';
import type { CoverageGap, CoveragePriority, GapFilters } from '@/types/coverage';
import type { PlatformId } from '@/types/program';

const PRIORITY_OPTIONS: { value: CoveragePriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes les priorités' },
  { value: 'critical', label: 'Critique' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

const PRIORITY_CONFIG: Record<CoveragePriority, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'bg-red-100 text-red-700' },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-700' },
};

type SortField = 'priority' | 'country' | 'language' | 'estimatedCost';
type SortOrder = 'asc' | 'desc';

export default function CoverageGapsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformId, setPlatformId] = useState<PlatformId | ''>((searchParams.get('platformId') as PlatformId) || '');
  const [priorityFilter, setPriorityFilter] = useState<CoveragePriority | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [page, setPage] = useState(1);

  const filters: GapFilters = {
    platformId: platformId || undefined,
    priority: priorityFilter !== 'all' ? [priorityFilter] : undefined,
    sortBy: sortField,
    sortOrder,
    page,
    perPage: 20,
  };

  const { data: gapsData, isLoading } = useCoverageGaps(filters);
  const dismissGap = useDismissGap();
  const exportReport = useExportCoverageReport();

  const gaps = gapsData?.data || [];
  const meta = gapsData?.meta;

  // Filter by search
  const filteredGaps = useMemo(() => {
    if (!searchQuery) return gaps;
    const query = searchQuery.toLowerCase();
    return gaps.filter(
      (g) =>
        g.countryName.toLowerCase().includes(query) ||
        g.languageId.toLowerCase().includes(query)
    );
  }, [gaps, searchQuery]);

  // Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredGaps.map((g) => g.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDismiss = async (gapId: string) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    await dismissGap.mutateAsync({ gapId, reason });
  };

  const handleExport = () => {
    exportReport.mutate({ format: 'csv', filters });
  };

  const selectedGaps = filteredGaps.filter((g) => selectedIds.has(g.id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Analyse des lacunes
          </h1>
          <p className="text-muted-foreground">
            Identifier et combler les manques de contenu
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          {selectedIds.size > 0 && (
            <Button onClick={() => setShowGenerateModal(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{meta?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Lacunes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">{meta?.totalByCritical || 0}</p>
            <p className="text-xs text-muted-foreground">Critiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-600">{meta?.totalByHigh || 0}</p>
            <p className="text-xs text-muted-foreground">Haute priorité</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{meta?.totalByMedium || 0}</p>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-gray-600">{meta?.totalByLow || 0}</p>
            <p className="text-xs text-muted-foreground">Basse</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-10"
            />
          </div>
        </div>
        <Select value={platformId} onValueChange={setPlatformId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Toutes les plateformes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les plateformes</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as CoveragePriority | 'all')}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pl-4 border-l">
            <Badge variant="secondary">{selectedIds.size} sélectionné(s)</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Désélectionner
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.size === filteredGaps.length && filteredGaps.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priorité
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center gap-1">
                  Pays
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('language')}
              >
                <div className="flex items-center gap-1">
                  Langue
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('articles')}
              >
                <div className="flex items-center gap-1">
                  Articles estimés
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('cost')}
              >
                <div className="flex items-center gap-1">
                  Coût estimé
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Raisons</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <div className="h-6 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredGaps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucune lacune trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredGaps.map((gap) => {
                const priorityConfig = PRIORITY_CONFIG[gap.priority];
                return (
                  <TableRow
                    key={gap.id}
                    className={cn(
                      selectedIds.has(gap.id) && 'bg-primary/5'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(gap.id)}
                        onCheckedChange={(checked) => handleSelect(gap.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{gap.countryName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Languages className="w-4 h-4 text-muted-foreground" />
                        {gap.languageId.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {gap.contentType && (
                        <Badge variant="outline">{gap.contentType}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{gap.estimatedArticles}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${gap.estimatedCost.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {gap.reasons.slice(0, 2).map((reason) => (
                          <Badge key={reason} variant="outline" className="text-xs">
                            {reason.replace('_', ' ')}
                          </Badge>
                        ))}
                        {gap.reasons.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{gap.reasons.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedIds(new Set([gap.id]));
                              setShowGenerateModal(true);
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Générer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDismiss(gap.id)}>
                            <X className="w-4 h-4 mr-2" />
                            Rejeter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} sur {meta.lastPage} ({meta.total} résultats)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage(meta.page - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.lastPage}
              onClick={() => setPage(meta.page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      <QuickGenerate
        gaps={selectedGaps}
        open={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
