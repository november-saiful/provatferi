'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useCourseSchedules, useAttendance } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { COURSES, COURSE_ORDER } from '@/lib/constants';
import { formatTime, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stagger, StaggerItem } from '@/components/ui/motion';

const schema = z.object({
  arrival_time: z.string().optional(),
  exit_time: z.string().optional(),
  note: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function AttendanceManage() {
  const qc = useQueryClient();
  const { data: schedules, isLoading } = useCourseSchedules();
  const [courseId, setCourseId] = React.useState('');
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);
  const [present, setPresent] = React.useState(true);

  const { data: attendance } = useAttendance(courseId || undefined);
  const existing = selectedDay ? attendance?.find((a) => a.class_day === selectedDay) : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { arrival_time: '', exit_time: '', note: '' }
  });

  React.useEffect(() => {
    if (existing) {
      reset({
        arrival_time: existing.arrival_time?.slice(0, 5) ?? '',
        exit_time: existing.exit_time?.slice(0, 5) ?? '',
        note: existing.note ?? ''
      });
      setPresent(existing.is_present);
    } else {
      reset({ arrival_time: '', exit_time: '', note: '' });
      setPresent(true);
    }
  }, [existing, reset]);

  const total = schedules?.find((s) => s.id === courseId)?.total_classes ?? 16;

  const onSubmit = async (values: FormValues) => {
    if (!courseId || !selectedDay) {
      toast.error('Select a course and class day');
      return;
    }
    const { error } = await supabase.rpc('upsert_attendance', {
      p_course_schedule_id: courseId,
      p_class_day: selectedDay,
      p_arrival_time: values.arrival_time || null,
      p_exit_time: values.exit_time || null,
      p_note: values.note || null,
      p_is_present: present
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(existing ? 'Attendance updated' : 'Attendance recorded');
      qc.invalidateQueries({ queryKey: ['attendance', courseId] });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Stagger className="grid gap-6 lg:grid-cols-2">
      <StaggerItem className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select course</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelectedDay(null); }} className="w-full">
              <option value="">Choose a course…</option>
              {schedules?.map((s) => (
                <option key={s.id} value={s.id}>
                  {COURSES[s.course].label}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {courseId && (
          <Card>
            <CardHeader>
              <CardTitle>Class day (1–{total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
                  const rec = attendance?.find((a) => a.class_day === day);
                  return (
                    <StaggerItem key={day}>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          'flex h-12 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                          selectedDay === day
                            ? 'border-primary bg-primary text-primary-foreground'
                            : rec
                              ? rec.is_present
                                ? 'border-sage-300 bg-sage-50 text-sage-700 dark:bg-sage-900/40 dark:text-sage-200'
                                : 'border-warmred-300 bg-warmred-50 text-warmred-600 dark:bg-warmred-900/30 dark:text-warmred-300'
                              : 'border-border text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {day}
                        {rec && <span className="sr-only">{rec.is_present ? 'present' : 'absent'}</span>}
                      </button>
                    </StaggerItem>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </StaggerItem>

      {courseId && selectedDay && (
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Day {selectedDay} — {existing ? 'Update attendance' : 'Record attendance'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="a-arrival">Arrival time</Label>
                    <Input id="a-arrival" type="time" {...register('arrival_time')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-exit">Exit time</Label>
                    <Input id="a-exit" type="time" {...register('exit_time')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-note">Note</Label>
                  <Textarea id="a-note" rows={2} {...register('note')} placeholder="e.g. Late by 15 min, substitute instructor…" />
                  {errors.note && <p className="text-xs text-warmred-500">{errors.note.message}</p>}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <Label htmlFor="a-present">Present</Label>
                  <Switch id="a-present" checked={present} onCheckedChange={setPresent} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : existing ? 'Update attendance' : 'Record attendance'}
                </Button>
              </form>

              <div className="mt-6">
                <h4 className="mb-2 text-sm font-semibold">All recorded days</h4>
                <ul className="space-y-1">
                  {attendance
                    ?.slice()
                    .sort((a, b) => a.class_day - b.class_day)
                    .map((a) => (
                      <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
                        <span className="w-14 font-medium">Day {a.class_day}</span>
                        <span className={cn('font-medium', a.is_present ? 'text-sage-600' : 'text-warmred-500')}>
                          {a.is_present ? 'Present' : 'Absent'}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {a.arrival_time ? formatTime(a.arrival_time) : ''}
                          {a.arrival_time && a.exit_time ? ' – ' : ''}
                          {a.exit_time ? formatTime(a.exit_time) : ''}
                          {a.note ? ` · ${a.note}` : ''}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      )}
    </Stagger>
  );
}
