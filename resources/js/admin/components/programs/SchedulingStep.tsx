import { useMemo } from 'react';
import { addDays, addMonths, format, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Repeat,
  PlayCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import type { RecurrenceType, RecurrenceConfig } from '@/types/program';

export interface SchedulingStepProps {
  recurrenceType: RecurrenceType;
  recurrenceConfig: RecurrenceConfig;
  onTypeChange: (type: RecurrenceType) => void;
  onConfigChange: (config: RecurrenceConfig) => void;
  errors?: string[];
  className?: string;
}

const RECURRENCE_OPTIONS: Array<{
  id: RecurrenceType;
  name: string;
  description: string;
  icon: typeof PlayCircle;
}> = [
  {
    id: 'once',
    name: 'Une seule fois',
    description: 'Exécution unique à une date précise',
    icon: PlayCircle,
  },
  {
    id: 'daily',
    name: 'Quotidien',
    description: 'Chaque jour à une heure fixe',
    icon: Repeat,
  },
  {
    id: 'weekly',
    name: 'Hebdomadaire',
    description: 'Certains jours de la semaine',
    icon: Calendar,
  },
  {
    id: 'monthly',
    name: 'Mensuel',
    description: 'Un jour précis du mois',
    icon: Calendar,
  },
  {
    id: 'cron',
    name: 'Expression Cron',
    description: 'Configuration avancée',
    icon: Clock,
  },
];

const DAYS_OF_WEEK = [
  { id: 0, name: 'Dim', fullName: 'Dimanche' },
  { id: 1, name: 'Lun', fullName: 'Lundi' },
  { id: 2, name: 'Mar', fullName: 'Mardi' },
  { id: 3, name: 'Mer', fullName: 'Mercredi' },
  { id: 4, name: 'Jeu', fullName: 'Jeudi' },
  { id: 5, name: 'Ven', fullName: 'Vendredi' },
  { id: 6, name: 'Sam', fullName: 'Samedi' },
];

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/London', label: 'Londres (GMT)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'UTC', label: 'UTC' },
];

export function SchedulingStep({
  recurrenceType,
  recurrenceConfig,
  onTypeChange,
  onConfigChange,
  errors,
  className,
}: SchedulingStepProps) {
  // Get current config values with defaults
  const configAny = recurrenceConfig as Record<string, unknown>;
  const time = (configAny.time as string) || '09:00';
  const timezone = (configAny.timezone as string) || 'Europe/Paris';
  const selectedDays = (configAny.days as number[]) || [1, 2, 3, 4, 5]; // Mon-Fri
  const dayOfMonth = (configAny.dayOfMonth as number) || 1;
  const scheduledAt = (configAny.scheduledAt as string) || new Date().toISOString();
  const cronExpression = (configAny.expression as string) || '0 9 * * *';
  const excludeWeekends = (configAny.excludeWeekends as boolean) ?? true;

  // Calculate next 5 executions
  const nextExecutions = useMemo(() => {
    const executions: Date[] = [];
    const [hours, minutes] = time.split(':').map(Number);
    let baseDate = setMinutes(setHours(new Date(), hours), minutes);

    switch (recurrenceType) {
      case 'once':
        executions.push(new Date(scheduledAt));
        break;
      
      case 'daily':
        for (let i = 0; i < 5; i++) {
          const nextDate = addDays(baseDate, i + 1);
          if (excludeWeekends) {
            const day = nextDate.getDay();
            if (day === 0) nextDate.setDate(nextDate.getDate() + 1);
            if (day === 6) nextDate.setDate(nextDate.getDate() + 2);
          }
          executions.push(nextDate);
        }
        break;
      
      case 'weekly':
        let weekDate = baseDate;
        let found = 0;
        while (found < 5) {
          weekDate = addDays(weekDate, 1);
          if (selectedDays.includes(weekDate.getDay())) {
            executions.push(new Date(weekDate));
            found++;
          }
        }
        break;
      
      case 'monthly':
        for (let i = 0; i < 5; i++) {
          const monthDate = addMonths(baseDate, i);
          monthDate.setDate(dayOfMonth);
          executions.push(monthDate);
        }
        break;
      
      case 'cron':
        // Simplified - would need a cron parser for accurate preview
        for (let i = 0; i < 5; i++) {
          executions.push(addDays(baseDate, i + 1));
        }
        break;
    }

    return executions.slice(0, 5);
  }, [recurrenceType, time, scheduledAt, selectedDays, dayOfMonth, excludeWeekends]);

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    onConfigChange({
      ...recurrenceConfig,
      type: recurrenceType,
      ...updates,
    } as RecurrenceConfig);
  };

  const toggleDay = (dayId: number) => {
    const newDays = selectedDays.includes(dayId)
      ? selectedDays.filter((d: number) => d !== dayId)
      : [...selectedDays, dayId].sort();
    updateConfig({ days: newDays } as Partial<RecurrenceConfig>);
  };

  const hasError = errors && errors.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Planification
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez quand et à quelle fréquence le programme s'exécute
        </p>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.join('. ')}</p>
        </div>
      )}

      {/* Recurrence type selection */}
      <div className="space-y-3">
        <Label>Fréquence</Label>
        <RadioGroup
          value={recurrenceType}
          onValueChange={(value: string) => onTypeChange(value as RecurrenceType)}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {RECURRENCE_OPTIONS.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                'flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                recurrenceType === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
              <option.icon className={cn(
                'w-6 h-6 mb-2',
                recurrenceType === option.id ? 'text-primary' : 'text-gray-400'
              )} />
              <span className="font-medium text-sm">{option.name}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Type-specific configuration */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        {/* Once - Date picker */}
        {recurrenceType === 'once' && (
          <div className="space-y-3">
            <Label htmlFor="scheduledAt">Date et heure d'exécution</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt.slice(0, 16)}
              onChange={(e) => updateConfig({ scheduledAt: new Date(e.target.value).toISOString() } as Partial<RecurrenceConfig>)}
            />
          </div>
        )}

        {/* Daily / Weekly / Monthly - Time picker */}
        {['daily', 'weekly', 'monthly'].includes(recurrenceType) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Heure d'exécution</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => updateConfig({ time: e.target.value } as Partial<RecurrenceConfig>)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select
                id="timezone"
                value={timezone}
                onChange={(e) => updateConfig({ timezone: e.target.value } as Partial<RecurrenceConfig>)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Daily - Exclude weekends */}
        {recurrenceType === 'daily' && (
          <div className="flex items-center justify-between">
            <div>
              <Label>Exclure les week-ends</Label>
              <p className="text-xs text-muted-foreground">
                Ne pas exécuter le samedi et dimanche
              </p>
            </div>
            <Switch
              checked={excludeWeekends}
              onCheckedChange={(checked) => updateConfig({ excludeWeekends: checked } as Partial<RecurrenceConfig>)}
            />
          </div>
        )}

        {/* Weekly - Day selection */}
        {recurrenceType === 'weekly' && (
          <div className="space-y-2">
            <Label>Jours d'exécution</Label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={cn(
                    'w-10 h-10 rounded-lg font-medium text-sm transition-colors',
                    selectedDays.includes(day.id)
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                  )}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly - Day of month */}
        {recurrenceType === 'monthly' && (
          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">Jour du mois</Label>
            <Select
              id="dayOfMonth"
              value={dayOfMonth.toString()}
              onChange={(e) => updateConfig({ dayOfMonth: parseInt(e.target.value) } as Partial<RecurrenceConfig>)}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day === 1 ? '1er' : day}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Cron - Expression input */}
        {recurrenceType === 'cron' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cron">Expression Cron</Label>
              <Input
                id="cron"
                placeholder="0 9 * * 1-5"
                value={cronExpression}
                onChange={(e) => updateConfig({ expression: e.target.value } as Partial<RecurrenceConfig>)}
                className="font-mono"
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="w-3 h-3" />
              Format: minute heure jour mois jour_semaine
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs text-center">
              <div className="bg-white rounded p-2">
                <p className="font-mono">0</p>
                <p className="text-muted-foreground">minute</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="font-mono">9</p>
                <p className="text-muted-foreground">heure</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="font-mono">*</p>
                <p className="text-muted-foreground">jour</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="font-mono">*</p>
                <p className="text-muted-foreground">mois</p>
              </div>
              <div className="bg-white rounded p-2">
                <p className="font-mono">1-5</p>
                <p className="text-muted-foreground">sem.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next executions preview */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Prochaines exécutions
        </h4>
        <div className="space-y-2">
          {nextExecutions.map((date, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
              {index === 0 && (
                <Badge variant="secondary" className="text-xs">Prochaine</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Résumé : </span>
          {recurrenceType === 'once' && `Exécution unique le ${format(new Date(scheduledAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}`}
          {recurrenceType === 'daily' && `Tous les jours${excludeWeekends ? ' (sauf week-ends)' : ''} à ${time}`}
          {recurrenceType === 'weekly' && `Chaque ${selectedDays.map((d: number) => DAYS_OF_WEEK.find(day => day.id === d)?.fullName).join(', ')} à ${time}`}
          {recurrenceType === 'monthly' && `Le ${dayOfMonth === 1 ? '1er' : dayOfMonth} de chaque mois à ${time}`}
          {recurrenceType === 'cron' && `Expression personnalisée : ${cronExpression}`}
        </p>
      </div>
    </div>
  );
}

export default SchedulingStep;
