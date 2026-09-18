'use client';

import * as React from 'react';
import { Calendar as RBCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format as dateFnsFormat, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/lib/supabase/client';
import { useTasksByRange } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canManageTasks } from '@/lib/permissions';
import { formatDateTime, toBengaliDigits } from '@/lib/utils';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { TaskForm } from '@/components/forms/task-form';
import { Stagger, StaggerItem } from '@/components/ui/motion';

const localizer = dateFnsLocalizer({
  format: (date: Date | string, formatString: string) =>
    toBengaliDigits(dateFnsFormat(new Date(date), formatString, { locale: bn })),
  parse,
  startOfWeek,
  getDay,
  locales: { bn }
});

const TASK_MESSAGES = {
  today: 'আজ',
  previous: 'পেছনে',
  next: 'পরবর্তী',
  month: 'মাস',
  week: 'সপ্তাহ',
  day: 'দিন',
  agenda: 'এজেন্ডা',
  date: 'তারিখ',
  time: 'সময়',
  event: 'টাস্ক',
  showMore: (total: number) => `+${toBengaliDigits(total)} আরও`
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#D97706',      // amber-600
  in_progress: '#2563EB',  // blue-600
  completed: '#16A34A'     // green-600
};

interface RbcTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Task;
}

export function TaskCalendarView() {
  const qc = useQueryClient();
  const { role, user } = useAuthStore();
  const [view, setView] = React.useState<View>('month');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [detail, setDetail] = React.useState<Task | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formTask, setFormTask] = React.useState<Task | null | undefined>(undefined);
  const [defaultDate, setDefaultDate] = React.useState<Date | undefined>(undefined);

  const canEdit = canManageTasks(role);

  // Calculate visible date range for the query
  const { startDate, endDate } = React.useMemo(() => {
    const start = startOfMonth(subMonths(currentDate, 1));
    const end = endOfMonth(addMonths(currentDate, 1));
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [currentDate]);

  const { data: tasks, isLoading } = useTasksByRange(startDate, endDate);

  const rbcEvents: RbcTask[] = React.useMemo(
    () =>
      (tasks ?? []).map((t) => {
        const taskDate = new Date(t.task_date + 'T00:00:00');
        const endTime = t.end_time
          ? new Date(`${t.task_date}T${t.end_time}`)
          : new Date(taskDate.getTime() + 60 * 60 * 1000);
        const startTime = t.start_time
          ? new Date(`${t.task_date}T${t.start_time}`)
          : taskDate;

        return {
          id: t.id,
          title: t.title,
          start: startTime,
          end: endTime,
          allDay: !t.start_time,
          resource: t
        };
      }),
    [tasks]
  );

  if (isLoading) {
    return <Skeleton className="h-[70vh] w-full" />;
  }

  const eventPropGetter = (event: RbcTask) => ({
    style: {
      backgroundColor: STATUS_COLORS[event.resource.status] ?? STATUS_COLORS.pending,
      color: '#fff',
      borderRadius: '6px',
      border: 'none',
      fontSize: '12px',
      padding: '2px 6px'
    }
  });

  const handleSelectEvent = (e: RbcTask) => {
    if (canEdit) {
      setFormTask(e.resource);
      setFormOpen(true);
    } else {
      setDetail(e.resource);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm('এই টাস্কটি মুছে ফেলবেন?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('টাস্ক মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setFormOpen(false);
      setDetail(null);
    }
  };

  return (
    <Stagger className="space-y-4">
      <StaggerItem className="min-w-0 rounded-xl2 border border-border bg-card p-2 sm:p-3">
        <RBCalendar
          localizer={localizer}
          messages={TASK_MESSAGES}
          culture="bn"
          events={rbcEvents}
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          views={['month', 'week', 'day', 'agenda']}
          eventPropGetter={eventPropGetter}
          onSelectEvent={handleSelectEvent}
          popup
          style={{ height: '70vh' }}
        />
      </StaggerItem>

      {/* Status legend */}
      <StaggerItem className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.pending }} />
          অপেক্ষমাণ
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.in_progress }} />
          চলমান
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.completed }} />
          সম্পন্ন
        </span>
      </StaggerItem>

      {/* Read-only detail dialog */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">দায়িত্বপ্রাপ্ত:</span>{' '}
                {detail.assignee_name}
              </p>
              <p>
                <span className="text-muted-foreground">তারিখ:</span>{' '}
                {formatDateTime(detail.task_date)}
              </p>
              {detail.start_time && (
                <p>
                  <span className="text-muted-foreground">সময়:</span>{' '}
                  {detail.start_time.slice(0, 5)}
                  {detail.end_time && ` – ${detail.end_time.slice(0, 5)}`}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">স্ট্যাটাস:</span>{' '}
                {detail.status === 'pending' && 'অপেক্ষমাণ'}
                {detail.status === 'in_progress' && 'চলমান'}
                {detail.status === 'completed' && 'সম্পন্ন'}
              </p>
            </div>
            {detail.description && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.description}</p>
            )}
            {detail.perks && (
              <p className="text-sm">
                <span className="text-muted-foreground">পার্কস:</span> {detail.perks}
              </p>
            )}
          </div>
        )}
      </Dialog>

      {/* Add / edit form */}
      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={formTask}
        defaultDate={defaultDate}
        footer={
          canEdit && formTask ? (
            <Button type="button" variant="destructive" onClick={() => handleDelete(formTask)}>
              <Trash2 /> মুছুন
            </Button>
          ) : undefined
        }
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['tasks'] });
          setFormOpen(false);
        }}
      />
    </Stagger>
  );
}
