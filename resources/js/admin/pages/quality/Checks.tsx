/**
 * Quality Checks Page
 * File 277 - List of all quality checks with filters and bulk actions
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Select,
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
import { usePlatform } from '@/hooks/usePlatform';
import {
  useQualityChecks,
  useBulkRevalidate,
  useExportQualityChecks,
} from '@/hooks/useQuality';
import {
  QualityCheck,
  QualityCheckFilters,
  QualityStatus,
  ContentType,
  getScoreColor,
  getScoreLabel,
  getQualityStatusColor,
  getQualityStatusLabel,
} from '@/types/quality';
import { ScoreBreakdown } from '@/components/quality/ScoreBreakdown';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'comparative', label: 'Comparatif' },
  { value: 'pillar', label: 'Pilier' },
  { value: 'press', label: 'Communiqué' },
];

const STATUS_OPTIONS: { value: QualityStatus; label: string }[] = [
  { value: 'passed', label: 'Validé' },
  { value: 'warning', label: 'Attention' },
  { value: 'failed', label: 'Échec' },
  { value: 'pending', label: 'En attente' },
];

export default function QualityChecksPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  // Filters from URL
  const filters: QualityCheckFilters = {
    platform_id: platformId,
    content_type: searchParams.get('type') as ContentType || undefined,
    status: searchParams.get('status') as QualityStatus || undefined,
    min_score: searchParams.get('min_score') ? Number(searchParams.get('min_score')) : undefined,
    max_score: searchParams.get('max_score') ? Number(searchParams.get('max_score')) : undefined,
    search: search || undefined,
    page: Number(searchParams.get('page')) || 1,
    per_page: 20,
  };

  // API hooks
  const { data, isLoading, refetch } = useQualityChecks(filters);
  const bulkRevalidate = useBulkRevalidate();
  const exportChecks = useExportQualityChecks();

  // Update filter
  const updateFilter = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (data?.data) {
      setSelectedIds(new Set(data.data.map(c => c.article_id)));
    }
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Handle bulk revalidate
  const handleBulkRevalidate = () => {
    bulkRevalidate.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
      },
    });
  };

  // Handle export
  const handleExport = () => {
    exportChecks.mutate(filters);
  };

  // Pagination
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;
  const currentPage = data?.page || 1;

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            Vérifications qualité
          </h1>
          <p className="text-muted-foreground">
            {data?.total || 0} vérifications au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportChecks.isPending}
          >
            {exportChecks.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateFilter('search', search)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Content type */}
            <Select
              value={filters.content_type || 'all'}
              onValueChange={(v) => updateFilter('type', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {CONTENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => updateFilter('status', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Score range */}
            <Select
              value={filters.min_score?.toString() || 'all'}
              onValueChange={(v) => {
                if (v === 'all') {
                  updateFilter('min_score', undefined);
                  updateFilter('max_score', undefined);
                } else if (v === '80') {
                  updateFilter('min_score', '80');
                  updateFilter('max_score', undefined);
                } else if (v === '60') {
                  updateFilter('min_score', '60');
                  updateFilter('max_score', '79');
                } else if (v === '0') {
                  updateFilter('min_score', '0');
                  updateFilter('max_score', '59');
                }
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous scores</SelectItem>
                <SelectItem value="80">Excellent (80+)</SelectItem>
                <SelectItem value="60">Moyen (60-79)</SelectItem>
                <SelectItem value="0">Faible (&lt;60)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} sélectionné(s)
              </span>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Tout désélectionner
              </Button>
              <Button
                size="sm"
                onClick={handleBulkRevalidate}
                disabled={bulkRevalidate.isPending}
              >
                {bulkRevalidate.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Revalider la sélection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={data.data.every(c => selectedIds.has(c.article_id))}
                      onCheckedChange={(checked) => {
                        if (checked) selectAll();
                        else deselectAll();
                      }}
                    />
                  </TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-24">Score</TableHead>
                  <TableHead className="w-24">Statut</TableHead>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map(check => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(check.article_id)}
                        onCheckedChange={() => toggleSelection(check.article_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/quality/checks/${check.id}`}
                        className="font-medium hover:underline"
                      >
                        {check.article_title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {check.word_count} mots • {check.reading_time} min
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{check.content_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold"
                          style={{ color: getScoreColor(check.overall_score) }}
                        >
                          {check.overall_score}
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${check.overall_score}%`,
                              backgroundColor: getScoreColor(check.overall_score),
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: getQualityStatusColor(check.status),
                          color: 'white',
                        }}
                      >
                        {getQualityStatusLabel(check.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(check.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/quality/checks/${check.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/content/${check.content_type}/${check.article_id}`}>
                              <FileCheck className="h-4 w-4 mr-2" />
                              Voir l'article
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune vérification trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
