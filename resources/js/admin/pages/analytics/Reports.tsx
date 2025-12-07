/**
 * Reports Analytics Page
 * File 341 - Report builder and scheduled reports management
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Download,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Play,
  Pause,
  Settings,
  Mail,
  History,
  Bookmark,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';
import {
  useReports,
  useDeleteReport,
  useGenerateReport,
  useScheduleReport,
  Report,
} from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('builder');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data: reports, isLoading } = useReports();
  const deleteReport = useDeleteReport();
  const generateReport = useGenerateReport();
  const scheduleReport = useScheduleReport();

  // Separate reports by type
  const scheduledReports = reports?.filter(r => r.schedule?.enabled) || [];
  const historyReports = reports?.filter(r => r.lastGeneratedAt) || [];
  const templateReports = reports?.filter(r => !r.schedule?.enabled && !r.lastGeneratedAt) || [];

  // Format type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      traffic: 'Trafic',
      conversions: 'Conversions',
      content: 'Contenu',
      custom: 'Personnalisé',
    };
    return labels[type] || type;
  };

  // Format frequency label
  const getFrequencyLabel = (frequency?: string) => {
    const labels: Record<string, string> = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
    };
    return labels[frequency || ''] || frequency;
  };

  // Handle schedule toggle
  const handleScheduleToggle = (report: Report, enabled: boolean) => {
    if (report.schedule) {
      scheduleReport.mutate({
        reportId: report.id,
        schedule: { ...report.schedule, enabled },
      });
    }
  };

  // Handle generate
  const handleGenerate = (reportId: number) => {
    generateReport.mutate(reportId);
  };

  // Handle delete
  const handleDelete = (reportId: number) => {
    if (confirm('Supprimer ce rapport ?')) {
      deleteReport.mutate(reportId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/analytics">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Rapports
            </h1>
            <p className="text-muted-foreground">Génération et planification des rapports</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">
            <Plus className="h-4 w-4 mr-2" />
            Créer un rapport
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Planifiés
            {scheduledReports.length > 0 && (
              <Badge variant="secondary" className="ml-2">{scheduledReports.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Bookmark className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="mt-6">
          <ReportBuilder
            onReportCreated={(report) => {
              setActiveTab('scheduled');
            }}
          />
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rapports planifiés</CardTitle>
              <CardDescription>
                Rapports générés et envoyés automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : scheduledReports.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rapport</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Fréquence</TableHead>
                        <TableHead>Prochaine exécution</TableHead>
                        <TableHead>Destinataires</TableHead>
                        <TableHead>Actif</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledReports.map(report => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                          </TableCell>
                          <TableCell>{getFrequencyLabel(report.schedule?.frequency)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {report.schedule?.time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{report.schedule?.recipients.length || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={report.schedule?.enabled}
                              onCheckedChange={(enabled) => handleScheduleToggle(report, enabled)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleGenerate(report.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Générer maintenant
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedReport(report);
                                  setShowScheduleDialog(true);
                                }}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Modifier la planification
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(report.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun rapport planifié</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('builder')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un rapport
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des rapports</CardTitle>
              <CardDescription>
                Rapports générés précédemment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyReports.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rapport</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Généré</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyReports.map(report => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{report.format.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {report.dateRange.start} - {report.dateRange.end}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {report.lastGeneratedAt && formatDistanceToNow(
                              new Date(report.lastGeneratedAt),
                              { addSuffix: true, locale: fr }
                            )}
                          </TableCell>
                          <TableCell>
                            {report.downloadUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={report.downloadUrl} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun rapport dans l'historique</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates sauvegardés</CardTitle>
              <CardDescription>
                Réutilisez vos configurations de rapports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Default Templates */}
                {[
                  { name: 'Rapport mensuel', type: 'dashboard', sections: ['overview', 'traffic', 'conversions'] },
                  { name: 'Analyse SEO', type: 'custom', sections: ['traffic', 'seo', 'content'] },
                  { name: 'Performance contenu', type: 'content', sections: ['content', 'conversions'] },
                ].map((template, idx) => (
                  <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.sections.length} sections
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map(section => (
                          <Badge key={section} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        Utiliser ce template
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* User Templates */}
                {templateReports.map(report => (
                  <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Bookmark className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.sections.length} sections
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {report.sections.slice(0, 3).map(section => (
                          <Badge key={section} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                        {report.sections.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{report.sections.length - 3}
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        Utiliser
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Template Card */}
                <Card className="border-dashed">
                  <CardContent className="flex items-center justify-center h-full min-h-[180px]">
                    <Button variant="outline" onClick={() => setActiveTab('builder')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la planification</DialogTitle>
            <DialogDescription>
              Configurez quand ce rapport doit être généré et envoyé
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <Label>Rapport</Label>
                <p className="text-sm text-muted-foreground">{selectedReport.name}</p>
              </div>
              <div>
                <Label>Fréquence actuelle</Label>
                <p className="text-sm">{getFrequencyLabel(selectedReport.schedule?.frequency)}</p>
              </div>
              <div>
                <Label>Heure d'envoi</Label>
                <p className="text-sm">{selectedReport.schedule?.time}</p>
              </div>
              <div>
                <Label>Destinataires</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedReport.schedule?.recipients.map(email => (
                    <Badge key={email} variant="secondary">
                      <Mail className="h-3 w-3 mr-1" />
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Fermer
            </Button>
            <Button onClick={() => setShowScheduleDialog(false)}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
