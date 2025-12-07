/**
 * Report Builder Component
 * File 334 - Build and schedule custom reports
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Download,
  Eye,
  Settings,
  Mail,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import { DateRangePicker } from './DateRangePicker';
import {
  useCreateReport,
  useScheduleReport,
  CreateReportInput,
  DateRange,
  ReportSchedule,
} from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface CreatedReport {
  id: number;
  name: string;
  type: string;
  format: string;
  created_at: string;
}

interface ReportBuilderProps {
  onReportCreated?: (report: CreatedReport) => void;
}

const REPORT_SECTIONS = [
  { id: 'overview', label: 'Vue d\'ensemble', description: 'Métriques principales et KPIs' },
  { id: 'traffic', label: 'Trafic', description: 'Sources, tendances et géographie' },
  { id: 'content', label: 'Contenu', description: 'Top pages et performances' },
  { id: 'conversions', label: 'Conversions', description: 'Entonnoir et objectifs' },
  { id: 'audience', label: 'Audience', description: 'Démographie et comportement' },
  { id: 'technical', label: 'Technique', description: 'Vitesse et erreurs' },
  { id: 'seo', label: 'SEO', description: 'Positionnement et indexation' },
  { id: 'comparison', label: 'Comparaison', description: 'Benchmark des plateformes' },
];

const REPORT_TYPES = [
  { value: 'dashboard', label: 'Dashboard complet' },
  { value: 'traffic', label: 'Rapport trafic' },
  { value: 'conversions', label: 'Rapport conversions' },
  { value: 'content', label: 'Rapport contenu' },
  { value: 'custom', label: 'Personnalisé' },
];

export function ReportBuilder({ onReportCreated }: ReportBuilderProps) {
  const { t } = useTranslation();
  const createReport = useCreateReport();
  const scheduleReport = useScheduleReport();

  // State
  const [activeTab, setActiveTab] = useState('content');
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('custom');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'traffic']);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [schedule, setSchedule] = useState<ReportSchedule>({
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '09:00',
    recipients: [],
    enabled: false,
  });
  const [newRecipient, setNewRecipient] = useState('');

  // Toggle section
  const toggleSection = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter(s => s !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  // Add recipient
  const addRecipient = () => {
    if (newRecipient && !schedule.recipients.includes(newRecipient)) {
      setSchedule({
        ...schedule,
        recipients: [...schedule.recipients, newRecipient],
      });
      setNewRecipient('');
    }
  };

  // Remove recipient
  const removeRecipient = (email: string) => {
    setSchedule({
      ...schedule,
      recipients: schedule.recipients.filter(r => r !== email),
    });
  };

  // Handle create report
  const handleCreate = () => {
    const input: CreateReportInput = {
      name: reportName || `Rapport ${new Date().toLocaleDateString('fr-FR')}`,
      type: reportType,
      format,
      sections: selectedSections,
      dateRange,
    };

    createReport.mutate(input, {
      onSuccess: (report) => {
        if (scheduleEnabled) {
          scheduleReport.mutate({
            reportId: report.id,
            schedule: { ...schedule, enabled: true },
          });
        }
        onReportCreated?.(report);
      },
    });
  };

  // Handle preview
  const handlePreview = () => {
    // TODO: Implement report preview generation
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Créer un rapport
        </CardTitle>
        <CardDescription>
          Configurez le contenu et la planification de votre rapport
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="schedule">Planification</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label>Nom du rapport</Label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Ex: Rapport mensuel performance"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Type de rapport</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Période</Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="mt-1"
              />
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">Sections à inclure</Label>
              <div className="grid grid-cols-2 gap-3">
                {REPORT_SECTIONS.map(section => (
                  <div
                    key={section.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedSections.includes(section.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox checked={selectedSections.includes(section.id)} />
                    <div>
                      <p className="font-medium text-sm">{section.label}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Format Tab */}
          <TabsContent value="format" className="space-y-4">
            <div>
              <Label className="mb-3 block">Format d'export</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'pdf', label: 'PDF', desc: 'Document formaté' },
                  { value: 'excel', label: 'Excel', desc: 'Données brutes' },
                  { value: 'csv', label: 'CSV', desc: 'Données simples' },
                ].map(f => (
                  <div
                    key={f.value}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer text-center transition-colors',
                      format === f.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    )}
                    onClick={() => setFormat(f.value as 'pdf' | 'excel' | 'csv')}
                  >
                    <FileText className={cn(
                      'h-8 w-8 mx-auto mb-2',
                      format === f.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <p className="font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Aperçu du rapport</h4>
              <ul className="space-y-1 text-sm">
                <li>• {selectedSections.length} section(s) incluse(s)</li>
                <li>• Période: {dateRange.start} au {dateRange.end}</li>
                <li>• Format: {format.toUpperCase()}</li>
              </ul>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Planification automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Générer et envoyer ce rapport automatiquement
                </p>
              </div>
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>

            {scheduleEnabled && (
              <>
                <Separator />

                <div>
                  <Label>Fréquence</Label>
                  <Select
                    value={schedule.frequency}
                    onValueChange={(v) => setSchedule({ ...schedule, frequency: v as 'daily' | 'weekly' | 'monthly' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {schedule.frequency === 'weekly' && (
                  <div>
                    <Label>Jour de la semaine</Label>
                    <Select
                      value={String(schedule.dayOfWeek)}
                      onValueChange={(v) => setSchedule({ ...schedule, dayOfWeek: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Lundi</SelectItem>
                        <SelectItem value="2">Mardi</SelectItem>
                        <SelectItem value="3">Mercredi</SelectItem>
                        <SelectItem value="4">Jeudi</SelectItem>
                        <SelectItem value="5">Vendredi</SelectItem>
                        <SelectItem value="6">Samedi</SelectItem>
                        <SelectItem value="0">Dimanche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {schedule.frequency === 'monthly' && (
                  <div>
                    <Label>Jour du mois</Label>
                    <Select
                      value={String(schedule.dayOfMonth)}
                      onValueChange={(v) => setSchedule({ ...schedule, dayOfMonth: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Heure d'envoi</Label>
                  <Input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Destinataires</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="email"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="email@example.com"
                    />
                    <Button variant="outline" onClick={addRecipient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {schedule.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {schedule.recipients.map(email => (
                        <Badge key={email} variant="secondary" className="gap-1">
                          <Mail className="h-3 w-3" />
                          {email}
                          <button onClick={() => removeRecipient(email)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createReport.isPending || selectedSections.length === 0}
          >
            {createReport.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Générer le rapport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReportBuilder;
