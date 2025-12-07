/**
 * Audit Results Component
 * File 253 - Display audit results with charts and actions
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Download,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Eye,
  CheckSquare,
  XSquare,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  useAuditResults,
  useAuditStats,
  useBrandAudit,
  useUpdateAuditStatus,
} from '@/hooks/useBrandValidation';
import {
  AuditResult,
  AuditStats,
  ViolationSeverity,
  getViolationSeverityColor,
  getViolationSeverityLabel,
} from '@/types/brand';
import { cn } from '@/lib/utils';

const CONTENT_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'article', label: 'Articles' },
  { value: 'landing', label: 'Landings' },
  { value: 'comparative', label: 'Comparatifs' },
  { value: 'pillar', label: 'Pages piliers' },
  { value: 'press', label: 'Presse' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'reviewed', label: 'Revus' },
  { value: 'fixed', label: 'Corrigés' },
  { value: 'ignored', label: 'Ignorés' },
];

interface AuditResultsProps {
  platformId: number;
  compact?: boolean;
}

export function AuditResults({ platformId, compact = false }: AuditResultsProps) {
  const { t } = useTranslation();

  // Filters
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

  // API hooks
  const { data: results, isLoading: resultsLoading, refetch } = useAuditResults(
    platformId,
    {
      content_type: contentTypeFilter !== 'all' ? contentTypeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }
  );
  const { data: stats, isLoading: statsLoading } = useAuditStats(platformId);
  const runAudit = useBrandAudit();
  const updateStatus = useUpdateAuditStatus();

  // Calculate filtered results
  const filteredResults = useMemo(() => {
    if (!results) return [];
    let filtered = [...results];

    // Date filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(r => new Date(r.audited_at) >= cutoff);
    }

    return filtered.sort((a, b) => 
      new Date(b.audited_at).getTime() - new Date(a.audited_at).getTime()
    );
  }, [results, dateRange]);

  // Score trend (simplified)
  const scoreTrend = useMemo(() => {
    if (!stats?.score_trend || stats.score_trend.length < 2) return null;
    const first = stats.score_trend[0].score;
    const last = stats.score_trend[stats.score_trend.length - 1].score;
    return {
      direction: last > first ? 'up' : last < first ? 'down' : 'stable',
      change: Math.abs(last - first),
    };
  }, [stats?.score_trend]);

  // Handle run audit
  const handleRunAudit = () => {
    runAudit.mutate({
      platform_id: platformId,
      content_type: contentTypeFilter !== 'all' ? contentTypeFilter : undefined,
    });
  };

  // Handle status update
  const handleStatusUpdate = (id: number, status: AuditResult['status']) => {
    updateStatus.mutate({ id, status });
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      ['ID', 'Type', 'Titre', 'Score', 'Violations', 'Statut', 'Date'].join(','),
      ...filteredResults.map(r => [
        r.id,
        r.content_type,
        `"${r.content_title}"`,
        r.score,
        r.violations_count,
        r.status,
        r.audited_at,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const isLoading = resultsLoading || statsLoading;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Quick Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold">{stats?.average_score || 0}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            {scoreTrend && (
              <Badge variant={scoreTrend.direction === 'up' ? 'default' : 'destructive'}>
                {scoreTrend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {scoreTrend.change}%
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={handleRunAudit} disabled={runAudit.isPending}>
            {runAudit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Recent violations */}
        {filteredResults.slice(0, 3).map(result => (
          <div
            key={result.id}
            className="flex items-center justify-between p-2 border rounded text-sm"
          >
            <span className="truncate">{result.content_title}</span>
            <Badge variant={getScoreBadge(result.score)}>{result.score}</Badge>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Score moyen</div>
              <div className="flex items-center gap-2">
                <span className={cn('text-3xl font-bold', getScoreColor(stats.average_score))}>
                  {stats.average_score}
                </span>
                {scoreTrend && (
                  <Badge variant={scoreTrend.direction === 'up' ? 'default' : 'destructive'}>
                    {scoreTrend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {scoreTrend.change}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Contenus audités</div>
              <div className="text-3xl font-bold">{stats.total_audited}</div>
              <Progress
                value={(stats.compliant_count / Math.max(stats.total_audited, 1)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Conformes
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.compliant_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Non conformes
              </div>
              <div className="text-3xl font-bold text-red-600">{stats.non_compliant_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violations by Severity */}
      {stats?.violations_by_severity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Violations par sévérité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {(['critical', 'major', 'minor', 'info'] as ViolationSeverity[]).map(severity => (
                <div key={severity} className="text-center p-3 rounded-lg bg-muted">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: getViolationSeverityColor(severity) }}
                  >
                    {stats.violations_by_severity[severity] || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getViolationSeverityLabel(severity)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de contenu" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={handleRunAudit} disabled={runAudit.isPending}>
            {runAudit.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            Lancer un audit
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        ) : filteredResults.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contenu</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-20 text-center">Score</TableHead>
                <TableHead className="w-32 text-center">Violations</TableHead>
                <TableHead className="w-28">Statut</TableHead>
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map(result => (
                <TableRow key={result.id}>
                  <TableCell>
                    <Link
                      to={`/content/${result.content_type}/${result.content_id}`}
                      className="font-medium hover:underline flex items-center gap-1"
                    >
                      {result.content_title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.content_type}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getScoreBadge(result.score)}>
                      {result.score}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      {result.violations_by_severity.critical > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {result.violations_by_severity.critical} crit
                        </Badge>
                      )}
                      {result.violations_by_severity.major > 0 && (
                        <Badge className="text-xs bg-orange-500">
                          {result.violations_by_severity.major} maj
                        </Badge>
                      )}
                      {result.violations_by_severity.minor > 0 && (
                        <Badge className="text-xs bg-yellow-500">
                          {result.violations_by_severity.minor} min
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={result.status}
                      onValueChange={(v) => handleStatusUpdate(result.id, v as AuditResult['status'])}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="reviewed">Revu</SelectItem>
                        <SelectItem value="fixed">Corrigé</SelectItem>
                        <SelectItem value="ignored">Ignoré</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(result.audited_at).toLocaleDateString()}
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
                          <Link to={`/content/${result.content_type}/${result.content_id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir le contenu
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(result.id, 'fixed')}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Marquer corrigé
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(result.id, 'ignored')}
                        >
                          <XSquare className="h-4 w-4 mr-2" />
                          Ignorer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">Aucun résultat d'audit</h3>
            <p className="text-muted-foreground text-center mt-2">
              Lancez un audit pour analyser la conformité de vos contenus
            </p>
            <Button className="mt-4" onClick={handleRunAudit} disabled={runAudit.isPending}>
              {runAudit.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Lancer un audit
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Top Violations */}
      {stats?.top_violations && stats.top_violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Violations les plus fréquentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_violations.slice(0, 5).map((violation, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{violation.type}</span>
                      <span className="text-muted-foreground">
                        {violation.count} ({violation.percentage}%)
                      </span>
                    </div>
                    <Progress value={violation.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AuditResults;
