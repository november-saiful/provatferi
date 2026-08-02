'use client';

import * as React from 'react';
import { Calendar as RBCalendar, dateFnsLocalizer, type View, type SlotInfo } from 'react-big-calendar';
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format as dateFnsFormat, parse, startOfWeek, getDay } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { supabase } from '@/lib/supabase/client';
import { useCalendarEvents, useRealtimeInvalidate } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canWrite } from '@/lib/permissions';
import { CALENDAR_CATEGORIES } from '@/lib/constants';
import { formatDateTime, toBengaliDigits } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { CalendarEventForm } from '@/components/forms/calendar-event-form';
import { Stagger, StaggerItem } from '@/components/ui/motion';

const localizer = dateFnsLocalizer({
  format: (date: Date | string, formatString: string) =>
    toBengaliDigits(dateFnsFormat(new Date(date), formatString, { locale: bn })),
  parse,
  startOfWeek,
  getDay,
  locales: { bn }
});

// Bengali toolbar / view labels for react-big-calendar
const CALENDAR_MESSAGES = {
  today: 'আজ',
  previous: 'পেছনে',
  next: 'পরবর্তী',
  month: 'মাস',
  week: 'সপ্তাহ',
  day: 'দিন',
  agenda: 'এজেন্ডা',
  date: 'তারিখ',
  time: 'সময়',
  event: 'ইভেন্ট',
  showMore: (total: number) => `+${toBengaliDigits(total)} আরও`
};

interface RbcEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEvent;
}

const DragAndDropCalendar = withDragAndDrop<RbcEvent, Record<string, unknown>>(RBCalendar);

export function CalendarView() {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const { data: events, isLoading } = useCalendarEvents();
  useRealtimeInvalidate('calendar_events', [['calendar-events']]);

  const [detail, setDetail] = React.useState<CalendarEvent | null>(null);
  const [formEvent, setFormEvent] = React.useState<CalendarEvent | null | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [defaultDate, setDefaultDate] = React.useState<Date | undefined>(undefined);
  const [view, setView] = React.useState<View>('month');
  const [date, setDate] = React.useState(new Date());

  const canEdit = canWrite(role, 'cln');

  const rbcEvents: RbcEvent[] = React.useMemo(
    () =>
      (events ?? []).map((e) => ({
        id: e.id,
        title: e.custom_category && e.category === 'custom' ? `${e.custom_category}: ${e.title}` : e.title,
        start: new Date(e.start_date),
        end: e.end_date ? new Date(e.end_date) : new Date(new Date(e.start_date).getTime() + 60 * 60 * 1000),
        resource: e
      })),
    [events]
  );

  if (isLoading) {
    return <Skeleton className="h-[70vh] w-full" />;
  }

  const eventPropGetter = (event: RbcEvent) => ({
    style: {
      backgroundColor: CALENDAR_CATEGORIES[event.resource.category].color,
      color: '#fff'
    }
  });

  const handleSelectEvent = (e: RbcEvent) => {
    if (canEdit) {
      setFormEvent(e.resource);
      setFormOpen(true);
    } else {
      setDetail(e.resource);
    }
  };

  const handleSelectSlot = (slot: SlotInfo) => {
    if (!canEdit) return;
    setFormEvent(null);
    setDefaultDate(slot.start);
    setFormOpen(true);
  };

  const handleDelete = async (e: CalendarEvent) => {
    if (!confirm('এই ক্যালেন্ডার ইভেন্টটি মুছে ফেলবেন?')) return;
    const { error } = await supabase.from('calendar_events').delete().eq('id', e.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ইভেন্ট মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
      setFormOpen(false);
    }
  };

  const handleEventDrop = async ({ event, start, end }: EventInteractionArgs<RbcEvent>) => {
    if (!canEdit) return;
    // start/end can be string | Date; normalize to Date before serializing
    const nextStart = new Date(start);
    const nextEnd = end ? new Date(end) : null;
    const { error } = await supabase
      .from('calendar_events')
      .update({ start_date: nextStart.toISOString(), end_date: nextEnd ? nextEnd.toISOString() : null })
      .eq('id', event.resource.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ইভেন্ট পুনর্নির্ধারিত হয়েছে');
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  };

  const handleEventResize = async ({ event, start, end }: EventInteractionArgs<RbcEvent>) => {
    if (!canEdit) return;
    const nextStart = new Date(start);
    const nextEnd = end ? new Date(end) : null;
    const { error } = await supabase
      .from('calendar_events')
      .update({ start_date: nextStart.toISOString(), end_date: nextEnd ? nextEnd.toISOString() : null })
      .eq('id', event.resource.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ইভেন্টের আকার পরিবর্তন হয়েছে');
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    }
  };

  return (
    <Stagger className="space-y-4">
      {canEdit && (
        <StaggerItem className="flex justify-end">
          <Button
            onClick={() => {
              setFormEvent(null);
              setDefaultDate(undefined);
              setFormOpen(true);
            }}
          >
            <Plus /> ইভেন্ট যোগ করুন
          </Button>
        </StaggerItem>
      )}

      <StaggerItem className="rounded-xl2 border border-border bg-card p-3">
        <DndProvider backend={HTML5Backend}>
          <DragAndDropCalendar
            localizer={localizer}
            messages={CALENDAR_MESSAGES}
            culture="bn"
            events={rbcEvents}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={['month', 'week', 'day', 'agenda']}
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable={canEdit}
            resizable={canEdit}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            popup
            style={{ height: '70vh' }}
          />
        </DndProvider>
      </StaggerItem>

      <StaggerItem className="flex flex-wrap gap-2">
        {(Object.keys(CALENDAR_CATEGORIES) as Array<keyof typeof CALENDAR_CATEGORIES>).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CALENDAR_CATEGORIES[k].color }} />
            {CALENDAR_CATEGORIES[k].label}
          </span>
        ))}
      </StaggerItem>

      {/* Read-only detail */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {CALENDAR_CATEGORIES[detail.category].label}
              {detail.custom_category ? ` · ${detail.custom_category}` : ''}
            </p>
            <div className="space-y-1 text-sm">
              <p>শুরু {formatDateTime(detail.start_date)}</p>
              {detail.end_date && <p>শেষ {formatDateTime(detail.end_date)}</p>}
              {detail.location && <p>📍 {detail.location}</p>}
            </div>
            {detail.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.description}</p>}
          </div>
        )}
      </Dialog>

      {/* Add / edit form */}
      <CalendarEventForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        event={formEvent}
        defaultDate={defaultDate}
        footer={
          canEdit && formEvent ? (
            <Button type="button" variant="destructive" onClick={() => handleDelete(formEvent)}>
              <Trash2 /> মুছুন
            </Button>
          ) : undefined
        }
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['calendar-events'] });
          setFormOpen(false);
        }}
      />
    </Stagger>
  );
}
