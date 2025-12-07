/**
 * Scheduled Publications Page
 * File 391 - Calendar view for scheduled publications
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
  Edit,
  GripVertical,
  Loader2,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  usePublishQueue,
  useCancelPublish,
  useSchedulePublish,
  usePlatforms,
} from '@/hooks/usePublishing';
import { PublishQueue, PLATFORM_TYPE_CONFIG } from '@/types/publishing';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';

type ViewMode = 'month' | 'week' | 'day';

interface ScheduledItem extends PublishQueue {
  scheduledDate: Date;
}

export default function ScheduledPage() {
  const { t } = useTranslation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');

  const { data: queueData, isLoading } = usePublishQueue({ status: 'scheduled' });
  const { data: platforms } = usePlatforms();
  const cancelPublish = useCancelPublish();
  const schedulePublish = useSchedulePublish();

  // Parse scheduled items with dates
  const scheduledItems: ScheduledItem[] = useMemo(() => {
    if (!queueData?.data) return [];
    return queueData.data
      .filter(item => item.scheduledAt)
      .map(item => ({
        ...item,
        scheduledDate: parseISO(item.scheduledAt!),
      }))
      .filter(item => selectedPlatform === 'all' || item.platformId === parseInt(selectedPlatform));
  }, [queueData, selectedPlatform]);

  // Get items for a specific day
  const getItemsForDay = (date: Date) => {
    return scheduledItems.filter(item => isSameDay(item.scheduledDate, date));
  };

  // Navigation
  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Open edit modal
  const openEditModal = (item: ScheduledItem) => {
    setEditingItem(item);
    setNewScheduleDate(format(item.scheduledDate, 'yyyy-MM-dd'));
    setNewScheduleTime(format(item.scheduledDate, 'HH:mm'));
  };

  // Save reschedule
  const handleReschedule = async () => {
    if (!editingItem || !newScheduleDate || !newScheduleTime) return;

    const scheduledAt = `${newScheduleDate}T${newScheduleTime}:00`;
    await schedulePublish.mutateAsync({
      contentId: editingItem.contentId,
      platformId: editingItem.platformId,
      scheduledAt,
    });
    setEditingItem(null);
  };

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { locale: fr });
    const end = endOfWeek(endOfMonth(currentDate), { locale: fr });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: fr });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate]);

  // Render calendar item
  const renderCalendarItem = (item: ScheduledItem, compact = false) => (
    <div
      key={item.id}
      className={cn(
        'p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity',
        'bg-blue-100 border border-blue-200 text-blue-800'
      )}
      onClick={() => openEditModal(item)}
      draggable
    >
      {!compact && (
        <div className="flex items-center gap-1 mb-1">
          <GripVertical className="h-3 w-3 text-blue-400" />
          <span className="font-medium truncate flex-1">
            {format(item.scheduledDate, 'HH:mm')}
          </span>
        </div>
      )}
      <p className={cn('truncate', compact && 'text-[10px]')}>
        {item.content?.title || `#${item.contentId}`}
      </p>
      {!compact && item.platform && (
        <Badge variant="outline" className="mt-1 text-[10px] py-0">
          {item.platform.name}
        </Badge>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Publications planifiées
          </h1>
          <p className="text-muted-foreground">
            {scheduledItems.length} publication{scheduledItems.length > 1 ? 's' : ''} planifiée{scheduledItems.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Plateforme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les plateformes</SelectItem>
              {platforms?.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold ml-4">
                {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
                {viewMode === 'week' && `Semaine du ${format(startOfWeek(currentDate, { locale: fr }), 'd MMMM', { locale: fr })}`}
                {viewMode === 'day' && format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="month">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Mois
                </TabsTrigger>
                <TabsTrigger value="week">
                  <CalendarRange className="h-4 w-4 mr-1" />
                  Semaine
                </TabsTrigger>
                <TabsTrigger value="day">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Jour
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="border rounded-lg">
              {/* Week days header */}
              <div className="grid grid-cols-7 border-b">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  const dayItems = getItemsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'min-h-[100px] p-1 border-r border-b last:border-r-0',
                        !isCurrentMonth && 'bg-muted/30',
                        isToday(day) && 'bg-blue-50'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-1',
                        !isCurrentMonth && 'text-muted-foreground',
                        isToday(day) && 'text-blue-600'
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map(item => renderCalendarItem(item, true))}
                        {dayItems.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{dayItems.length - 3} de plus
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="border rounded-lg">
              <div className="grid grid-cols-7 border-b">
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-2 text-center border-r last:border-r-0',
                      isToday(day) && 'bg-blue-50'
                    )}
                  >
                    <div className="text-sm text-muted-foreground">
                      {format(day, 'EEE', { locale: fr })}
                    </div>
                    <div className={cn(
                      'text-lg font-semibold',
                      isToday(day) && 'text-blue-600'
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[400px]">
                {weekDays.map((day, index) => {
                  const dayItems = getItemsForDay(day);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-2 border-r last:border-r-0',
                        isToday(day) && 'bg-blue-50/50'
                      )}
                    >
                      <div className="space-y-2">
                        {dayItems.map(item => renderCalendarItem(item))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="border rounded-lg">
              <div className={cn(
                'p-4 border-b',
                isToday(currentDate) && 'bg-blue-50'
              )}>
                <h3 className="text-lg font-semibold">
                  {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </h3>
              </div>
              <div className="p-4 min-h-[400px]">
                {getItemsForDay(currentDate).length > 0 ? (
                  <div className="space-y-3">
                    {getItemsForDay(currentDate)
                      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
                      .map(item => (
                        <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditModal(item)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(item.scheduledDate, 'HH:mm')}
                                  </span>
                                </div>
                                <p className="font-medium">
                                  {item.content?.title || `Contenu #${item.contentId}`}
                                </p>
                                {item.platform && (
                                  <Badge variant="outline" className="mt-2">
                                    {PLATFORM_TYPE_CONFIG[item.platform.type as keyof typeof PLATFORM_TYPE_CONFIG]?.icon}{' '}
                                    {item.platform.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditModal(item); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); cancelPublish.mutate(item.id); }}
                                >
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-4" />
                    <p>Aucune publication planifiée ce jour</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Schedule Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la planification</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{editingItem.content?.title || `Contenu #${editingItem.contentId}`}</p>
                {editingItem.platform && (
                  <Badge variant="outline" className="mt-1">
                    {editingItem.platform.name}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newScheduleDate}
                    onChange={(e) => setNewScheduleDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Heure</Label>
                  <Input
                    type="time"
                    value={newScheduleTime}
                    onChange={(e) => setNewScheduleTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                cancelPublish.mutate(editingItem!.id);
                setEditingItem(null);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler la publication
            </Button>
            <Button onClick={handleReschedule} disabled={schedulePublish.isPending}>
              {schedulePublish.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
