import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { PLATFORMS } from '@/utils/constants';
import type { ProgramSummary } from '@/types/program';

import 'react-big-calendar/lib/css/react-big-calendar.css';

export interface CalendarEvent {
  id: string;
  programId: string;
  programName: string;
  platformId: string;
  status?: string;
  scheduledAt?: Date;
  estimatedArticles?: number;
  estimatedDuration?: number;
  color?: string;
  start: Date;
  end: Date;
  title?: string;
}

export interface CalendarViewProps {
  programs: ProgramSummary[];
  events?: CalendarEvent[];
  scheduledRuns?: Array<{
    programId: string;
    scheduledAt: string;
  }>;
  selectedPlatforms?: string[];
  onEventClick?: (programId: string) => void;
  onEventDrop?: (eventId: string, newDate: Date) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  className?: string;
}

const locales = { fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  today: "Aujourd'hui",
  previous: 'Précédent',
  next: 'Suivant',
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun programme planifié sur cette période.',
  showMore: (total: number) => `+${total} autres`,
};

export function CalendarView({
  programs,
  scheduledRuns = [],
  onEventClick,
  onEventDrop,
  onDateSelect,
  className,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Convert programs and scheduled runs to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add next run for each active program
    programs.forEach((program) => {
      if (program.nextRunAt && ['active', 'scheduled'].includes(program.status)) {
        const platform = PLATFORMS.find((p) => p.id === program.platformId);
        const runDate = new Date(program.nextRunAt);

        calendarEvents.push({
          id: `${program.id}-next`,
          programId: program.id,
          programName: program.name,
          platformId: program.platformId,
          status: program.status,
          estimatedArticles: program.totalGenerated || 0,
          color: platform?.color || '#6B7280',
          title: program.name,
          start: runDate,
          end: new Date(runDate.getTime() + 60 * 60 * 1000), // 1 hour default
        });
      }
    });

    // Add additional scheduled runs
    scheduledRuns.forEach((run, index) => {
      const program = programs.find((p) => p.id === run.programId);
      if (program) {
        const platform = PLATFORMS.find((p) => p.id === program.platformId);
        const runDate = new Date(run.scheduledAt);

        calendarEvents.push({
          id: `${run.programId}-${index}`,
          programId: run.programId,
          programName: program.name,
          platformId: program.platformId,
          status: 'scheduled',
          estimatedArticles: 0,
          color: platform?.color || '#6B7280',
          title: program.name,
          start: runDate,
          end: new Date(runDate.getTime() + 60 * 60 * 1000),
        });
      }
    });

    return calendarEvents;
  }, [programs, scheduledRuns]);

  const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    switch (action) {
      case 'PREV':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'NEXT':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'TODAY':
        setCurrentDate(new Date());
        break;
    }
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleEventDrop = useCallback(
    ({ event, start }: { event: CalendarEvent; start: Date }) => {
      if (onEventDrop) {
        onEventDrop(event.id, start);
      }
    },
    [onEventDrop]
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (onDateSelect) {
        onDateSelect(start, end);
      }
    },
    [onDateSelect]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  }, []);

  const CustomToolbar = () => (
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleNavigate('TODAY')}>
          Aujourd'hui
        </Button>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleNavigate('PREV')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleNavigate('NEXT')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold ml-2">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant={view === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView(Views.MONTH)}
          className="gap-1"
        >
          <Grid3X3 className="w-4 h-4" />
          Mois
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView(Views.WEEK)}
          className="gap-1"
        >
          <CalendarIcon className="w-4 h-4" />
          Semaine
        </Button>
        <Button
          variant={view === 'agenda' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setView(Views.AGENDA)}
          className="gap-1"
        >
          <List className="w-4 h-4" />
          Liste
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn('bg-white rounded-lg', className)}>
      <CustomToolbar />

      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(newView: string) => setView(newView as typeof view)}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          // @ts-ignore
          onEventDrop={handleEventDrop}
          selectable
          resizable={false}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="fr"
          toolbar={false}
          className="rounded-lg"
        />
      </div>

      {/* Event detail modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedEvent?.color }}
              />
              {selectedEvent?.programName}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plateforme</p>
                  <p className="font-medium">
                    {PLATFORMS.find((p) => p.id === selectedEvent.platformId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">{selectedEvent.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exécution prévue</p>
                  <p className="font-medium">
                    {format(selectedEvent.start as Date, "PPP 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Articles estimés</p>
                  <p className="font-medium">{selectedEvent.estimatedArticles}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onEventClick?.(selectedEvent.programId);
                    setSelectedEvent(null);
                  }}
                >
                  Voir le programme
                </Button>
                <Button className="flex-1">
                  Lancer maintenant
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarView;
