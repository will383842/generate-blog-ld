import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Filter,
  ChevronRight,
  Clock,
  Play,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { CalendarView, type CalendarEvent } from '@/components/programs/CalendarView';
import { usePrograms } from '@/hooks/usePrograms';
import { PLATFORMS } from '@/utils/constants';

export function ProgramsCalendar() {
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: programsData, isLoading } = usePrograms({
    status: ['active', 'scheduled'],
    perPage: 100,
  });

  const programs = programsData?.data || [];

  // Generate calendar events from programs
  const events: CalendarEvent[] = useMemo(() => {
    const eventList: CalendarEvent[] = [];

    programs.forEach((program) => {
      const quantity = program.quantityValue ?? 0;
      const platform = PLATFORMS.find((p) => p.id === program.platformId);
      if (program.nextRunAt) {
        const start = new Date(program.nextRunAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        eventList.push({
          id: `${program.id}-next`,
          programId: program.id,
          programName: program.name,
          platformId: program.platformId,
          scheduledAt: start,
          estimatedArticles: quantity,
          estimatedDuration: Math.round(quantity * 1.5),
          color: platform?.color,
          title: program.name,
          start,
          end,
        });
      }

      // Add more future events based on recurrence (simplified)
      if (program.recurrenceType === 'daily' && program.nextRunAt) {
        for (let i = 1; i <= 7; i++) {
          const start = addDays(new Date(program.nextRunAt), i);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          eventList.push({
            id: `${program.id}-future-${i}`,
            programId: program.id,
            programName: program.name,
            platformId: program.platformId,
            scheduledAt: start,
            estimatedArticles: quantity,
            estimatedDuration: Math.round(quantity * 1.5),
            color: platform?.color,
            title: program.name,
            start,
            end,
          });
        }
      }
    });

    return eventList;
  }, [programs]);

  // Upcoming programs (next 7 days)
  const upcomingPrograms = useMemo(() => {
    const now = new Date();
    const weekLater = addDays(now, 7);

    return events
      .filter((e) => {
        if (!e.scheduledAt) return false;
        const date = new Date(e.scheduledAt);
        return date >= now && date <= weekLater;
      })
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 10);
  }, [events]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleEventClick = (programId: string) => {
    navigate(`/programs/${programId}`);
  };

  const handleEventDrop = (_eventId: string, _newDate: Date) => {
    // TODO: Call API to reschedule
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Calendrier des programmes</h1>
              <p className="text-sm text-muted-foreground">
                {events.length} exécutions planifiées
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                    {selectedPlatforms.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedPlatforms.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="font-medium mb-3">Plateformes</h3>
                      <div className="space-y-2">
                        {PLATFORMS.map((platform) => (
                          <label
                            key={platform.id}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={() => togglePlatform(platform.id)}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: platform.color }}
                            />
                            <span>{platform.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedPlatforms([])}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button onClick={() => navigate('/programs/builder')}>
                Nouveau programme
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Calendar */}
          <div className="flex-1">
            <Card className="h-[calc(100vh-200px)]">
              <CardContent className="p-4 h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <CalendarView
                    events={events}
                    programs={programs}
                    onEventClick={handleEventClick}
                    onEventDrop={handleEventDrop}
                    selectedPlatforms={selectedPlatforms}
                    className="h-full"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Upcoming */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  À venir (7 jours)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingPrograms.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    Aucune exécution planifiée
                  </p>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {upcomingPrograms.map((event) => {
                      const platform = PLATFORMS.find((p) => p.id === event.platformId);
                      return (
                        <button
                          key={event.id}
                          onClick={() => navigate(`/programs/${event.programId}`)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                              style={{ backgroundColor: platform?.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {event.programName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {event.scheduledAt && format(new Date(event.scheduledAt), 'EEE d MMM HH:mm', { locale: fr })}
                                </span>
                              </div>
                              {event.estimatedArticles && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  ~{event.estimatedArticles} articles
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/programs/builder')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Créer un programme
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/programs')}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Voir tous les programmes
                </Button>
              </CardContent>
            </Card>

            {/* Platform Legend */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Légende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PLATFORMS.map((platform) => {
                    const count = events.filter((e) => e.platformId === platform.id).length;
                    return (
                      <div
                        key={platform.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: platform.color }}
                          />
                          <span>{platform.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgramsCalendar;