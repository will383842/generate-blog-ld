import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  FileText,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type ScheduleStatus = 'active' | 'paused' | 'completed';

export interface ScheduledPillar {
  id: string;
  name: string;
  pillarId: string;
  scheduledDate: string;
  scheduledTime: string;
  frequency: ScheduleFrequency;
  status: ScheduleStatus;
  articlesToGenerate: number;
  lastRun?: string;
  nextRun?: string;
}

export interface Pillar {
  id: string;
  name: string;
  articleCount: number;
}

export interface PillarSchedulerProps {
  schedules: ScheduledPillar[];
  pillars: Pillar[];
  onCreateSchedule: (schedule: Omit<ScheduledPillar, 'id' | 'status' | 'lastRun' | 'nextRun'>) => void;
  onUpdateSchedule: (id: string, schedule: Partial<ScheduledPillar>) => void;
  onDeleteSchedule: (id: string) => void;
  onToggleStatus: (id: string) => void;
  className?: string;
}

const frequencyLabels: Record<ScheduleFrequency, string> = {
  once: 'Once',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const statusConfig: Record<ScheduleStatus, { color: string; label: string }> = {
  active: { color: 'bg-green-100 text-green-700', label: 'Active' },
  paused: { color: 'bg-amber-100 text-amber-700', label: 'Paused' },
  completed: { color: 'bg-gray-100 text-gray-700', label: 'Completed' },
};

export function PillarScheduler({
  schedules,
  pillars,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onToggleStatus,
  className,
}: PillarSchedulerProps) {
  const { t } = useTranslation('content');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledPillar | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pillarId: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    frequency: 'once' as ScheduleFrequency,
    articlesToGenerate: 5,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      pillarId: '',
      scheduledDate: '',
      scheduledTime: '09:00',
      frequency: 'once',
      articlesToGenerate: 5,
    });
    setEditingSchedule(null);
  };

  const handleOpenDialog = (schedule?: ScheduledPillar) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        name: schedule.name,
        pillarId: schedule.pillarId,
        scheduledDate: schedule.scheduledDate,
        scheduledTime: schedule.scheduledTime,
        frequency: schedule.frequency,
        articlesToGenerate: schedule.articlesToGenerate,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSchedule) {
      onUpdateSchedule(editingSchedule.id, formData);
    } else {
      onCreateSchedule(formData);
    }
    setDialogOpen(false);
    resetForm();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('pillarScheduler.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('pillarScheduler.description')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('pillarScheduler.addSchedule')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSchedule
                  ? t('pillarScheduler.editSchedule')
                  : t('pillarScheduler.newSchedule')}
              </DialogTitle>
              <DialogDescription>
                {t('pillarScheduler.scheduleDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('pillarScheduler.name')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Weekly Blog Posts"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('pillarScheduler.pillar')}</Label>
                <Select
                  value={formData.pillarId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pillarId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('pillarScheduler.selectPillar')} />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.id}>
                        {pillar.name} ({pillar.articleCount} articles)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('pillarScheduler.date')}</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('pillarScheduler.time')}</Label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('pillarScheduler.frequency')}</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: ScheduleFrequency) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(frequencyLabels) as ScheduleFrequency[]).map(
                      (freq) => (
                        <SelectItem key={freq} value={freq}>
                          {frequencyLabels[freq]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('pillarScheduler.articlesToGenerate')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.articlesToGenerate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      articlesToGenerate: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.pillarId || !formData.scheduledDate}
              >
                {editingSchedule ? t('actions.save') : t('actions.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">{t('pillarScheduler.noSchedules')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('pillarScheduler.noSchedulesDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const pillar = pillars.find((p) => p.id === schedule.pillarId);
            const status = statusConfig[schedule.status];

            return (
              <Card key={schedule.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{schedule.name}</h3>
                        <Badge className={cn('text-xs', status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {pillar?.name || 'Unknown Pillar'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3.5 w-3.5" />
                          {frequencyLabels[schedule.frequency]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(schedule.nextRun || schedule.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {schedule.scheduledTime}
                        </span>
                      </div>
                      <p className="text-sm">
                        {schedule.articlesToGenerate} {t('pillarScheduler.articlesPerRun')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleStatus(schedule.id)}
                        title={
                          schedule.status === 'active'
                            ? t('actions.pause')
                            : t('actions.resume')
                        }
                      >
                        {schedule.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PillarScheduler;
