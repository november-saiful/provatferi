'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useCourseSchedules, useAttendance, useAllAttendance } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { COURSES, COURSE_ORDER } from '@/lib/constants';
import { formatTime, cn, toBengaliDigits } from '@/lib/utils';
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
  const { data: allAttendance } = useAllAttendance();
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
      toast.error('একটি কোর্স এবং ক্লাসের দিন নির্বাচন করুন');
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
      toast.success(existing ? 'উপস্থিতি আপডেট হয়েছে' : 'উপস্থিতি রেকর্ড হয়েছে');
      // Invalidate every attendance key so the public course view and the
      // course-insights charts refresh immediately (per spec scenario 5).
      qc.invalidateQueries({ queryKey: ['attendance'] });
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
            <CardTitle>কোর্স নির্বাচন করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelectedDay(null); }} className="w-full">
              <option value="">একটি কোর্স বেছে নিন…</option>
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
              <CardTitle>ক্লাসের দিন (১–{toBengaliDigits(total)})</CardTitle>
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
                        {toBengaliDigits(day)}
                        {rec && <span className="sr-only">{rec.is_present ? 'উপস্থিত' : 'অনুপস্থিত'}</span>}
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
              <CardTitle>দিন {toBengaliDigits(selectedDay)} — {existing ? 'উপস্থিতি আপডেট' : 'উপস্থিতি রেকর্ড'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="a-arrival">আগমনের সময়</Label>
                    <Input id="a-arrival" type="time" {...register('arrival_time')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a-exit">প্রস্থানের সময়</Label>
                    <Input id="a-exit" type="time" {...register('exit_time')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-note">নোট</Label>
                  <Textarea id="a-note" rows={2} {...register('note')} placeholder="যেমন: ১৫ মিনিট দেরি, বিকল্প শিক্ষক…" />
                  {errors.note && <p className="text-xs text-warmred-500">{errors.note.message}</p>}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <Label htmlFor="a-present">উপস্থিত</Label>
                  <Switch id="a-present" checked={present} onCheckedChange={setPresent} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে…' : existing ? 'উপস্থিতি আপডেট' : 'উপস্থিতি রেকর্ড'}
                </Button>
              </form>

              <div className="mt-6">
                <h4 className="mb-2 text-sm font-semibold">সব রেকর্ডকৃত দিন</h4>
                <ul className="space-y-1">
                  {attendance
                    ?.slice()
                    .sort((a, b) => a.class_day - b.class_day)
                    .map((a) => (
                      <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
                        <span className="w-14 font-medium">দিন {toBengaliDigits(a.class_day)}</span>
                        <span className={cn('font-medium', a.is_present ? 'text-sage-600' : 'text-warmred-500')}>
                          {a.is_present ? 'উপস্থিত' : 'অনুপস্থিত'}
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

      <StaggerItem className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>প্রতিটি কোর্সের রেকর্ড</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(schedules ?? []).map((schedule) => {
                const records = (allAttendance ?? [])
                  .filter((record) => record.course_schedule_id === schedule.id)
                  .sort((a, b) => a.class_day - b.class_day);

                return (
                  <div key={schedule.id} className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold">{COURSES[schedule.course].label}</h4>
                      <span className="text-xs text-muted-foreground">{records.length}/{schedule.total_classes}</span>
                    </div>
                    {records.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">এখনো কোনো রেকর্ড নেই।</p>
                    ) : (
                      <ul className="mt-3 space-y-1.5">
                        {records.map((record) => (
                          <li key={record.id} className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">দিন {record.class_day}</span>
                              <span className={cn('text-xs font-medium', record.is_present ? 'text-sage-600' : 'text-warmred-500')}>
                                {record.is_present ? 'উপস্থিত' : 'অনুপস্থিত'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {record.arrival_time ? formatTime(record.arrival_time) : '—'}
                              {' – '}
                              {record.exit_time ? formatTime(record.exit_time) : '—'}
                              {record.note ? ` · ${record.note}` : ''}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}
