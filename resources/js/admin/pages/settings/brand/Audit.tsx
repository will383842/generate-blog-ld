/**
 * Brand Audit Page
 * File 261 - Full page for audit results and mass actions
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  Download,
  RefreshCw,
  Filter,
  CheckSquare,
  XSquare,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { usePlatform } from '@/hooks/usePlatform';
import {
  useAuditResults,
  useAuditStats,
  useBrandAudit,
  useUpdateAuditStatus,
} from '@/hooks/useBrandValidation';
import { AuditResults } from '@/components/settings/AuditResults';
import { AuditResult } from '@/types/brand';
import { cn } from '@/lib/utils';

const CONTENT_TYPES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'article', label: 'Articles' },
  { value: 'landing', label: 'Landings' },
  { value: 'comparative', label: 'Comparatifs' },
  { value: 'pillar', label: 'Pages piliers' },
  { value: 'press', label: 'Presse' },
];

export default function BrandAuditPage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [runAuditDialogOpen, setRunAuditDialogOpen] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['article', 'landing']);
  const [massActionDialogOpen, setMassActionDialogOpen] = useState(false);
  const [selectedResults, setSelectedResults] = useState<number[]>([]);
  const [massActionType, setMassActionType] = useState<'fixed' | 'ignored' | null>(null);

  // API hooks
  const { data: stats, isLoading: statsLoading } = useAuditStats(platformId);
  const { data: results, isLoading: resultsLoading, refetch } = useAuditResults(platformId);
  const runAudit = useBrandAudit();
  const updateStatus = useUpdateAuditStatus();

  // Handle run audit
  const handleRunAudit = () => {
    runAudit.mutate({
      platform_id: platformId,
      content_type: selectedContentTypes.length === CONTENT_TYPES.length - 1
        ? undefined
        : selectedContentTypes[0],
    }, {
      onSuccess: () => {
        setRunAuditDialogOpen(false);
        refetch();
      },
    });
  };

  // Handle mass action
  const handleMassAction = () => {
    if (!massActionType || selectedResults.length === 0) return;

    selectedResults.forEach(id => {
      updateStatus.mutate({ id, status: massActionType });
    });

    setMassActionDialogOpen(false);
    setSelectedResults([]);
    setMassActionType(null);
  };

  // Toggle content type selection
  const toggleContentType = (type: string) => {
    if (selectedContentTypes.includes(type)) {
      setSelectedContentTypes(selectedContentTypes.filter(t => t !== type));
    } else {
      setSelectedContentTypes([...selectedContentTypes, type]);
    }
  };

  // Export report
  const handleExportReport = () => {
    if (!results || !stats) return;

    const report = {
      generated_at: new Date().toISOString(),
      platform: currentPlatform?.name,
      summary: {
        total_audited: stats.total_audited,
        average_score: stats.average_score,
        compliant: stats.compliant_count,
        non_compliant: stats.non_compliant_count,
      },
      violations_by_severity: stats.violations_by_severity,
      top_violations: stats.top_violations,
      results: results.map(r => ({
        content_type: r.content_type,
        title: r.content_title,
        score: r.score,
        violations: r.violations_count,
        status: r.status,
        date: r.audited_at,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-audit-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isLoading = statsLoading || resultsLoading;

  // Non-compliant pending count
  const pendingCount = results?.filter(r => r.status === 'pending' && r.score < 80).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/brand">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Audit de contenu
            </h1>
            <p className="text-muted-foreground">
              Analysez et corrigez les violations de brand guidelines
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setRunAuditDialogOpen(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Lancer un audit
          </Button>
        </div>
      </div>

      {/* Quick Actions for Pending */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">{pendingCount} contenus non conformes en attente</p>
                <p className="text-sm text-muted-foreground">
                  Marquez-les comme corrigés ou ignorés
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pendingIds = results
                    ?.filter(r => r.status === 'pending' && r.score < 80)
                    .map(r => r.id) || [];
                  setSelectedResults(pendingIds);
                  setMassActionType('fixed');
                  setMassActionDialogOpen(true);
                }}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Tout marquer corrigé
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const pendingIds = results
                    ?.filter(r => r.status === 'pending' && r.score < 80)
                    .map(r => r.id) || [];
                  setSelectedResults(pendingIds);
                  setMassActionType('ignored');
                  setMassActionDialogOpen(true);
                }}
              >
                <XSquare className="h-4 w-4 mr-2" />
                Tout ignorer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <AuditResults platformId={platformId} />

      {/* Run Audit Dialog */}
      <Dialog open={runAuditDialogOpen} onOpenChange={setRunAuditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lancer un audit</DialogTitle>
            <DialogDescription>
              Sélectionnez les types de contenu à auditer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Types de contenu</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CONTENT_TYPES.filter(t => t.value !== 'all').map(type => (
                  <div
                    key={type.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={type.value}
                      checked={selectedContentTypes.includes(type.value)}
                      onCheckedChange={() => toggleContentType(type.value)}
                    />
                    <label
                      htmlFor={type.value}
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Estimation</p>
              <p className="text-muted-foreground">
                L'audit analysera environ {selectedContentTypes.length * 50} contenus.
                Durée estimée : {selectedContentTypes.length * 2} minutes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunAuditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRunAudit}
              disabled={selectedContentTypes.length === 0 || runAudit.isPending}
            >
              {runAudit.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Audit en cours...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Lancer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Action Dialog */}
      <Dialog open={massActionDialogOpen} onOpenChange={setMassActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {massActionType === 'fixed' ? 'Marquer comme corrigés' : 'Ignorer les violations'}
            </DialogTitle>
            <DialogDescription>
              Cette action s'appliquera à {selectedResults.length} contenu(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {massActionType === 'fixed' ? (
              <p className="text-sm text-muted-foreground">
                Les contenus seront marqués comme corrigés. Assurez-vous d'avoir
                effectué les corrections nécessaires.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Les violations seront ignorées et n'apparaîtront plus dans les
                rapports. Utilisez cette option avec précaution.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMassActionDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant={massActionType === 'ignored' ? 'destructive' : 'default'}
              onClick={handleMassAction}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : massActionType === 'fixed' ? (
                <CheckSquare className="h-4 w-4 mr-2" />
              ) : (
                <XSquare className="h-4 w-4 mr-2" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
