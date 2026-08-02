'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, Music } from 'lucide-react';
import { useCourseSchedules, useAttendance } from '@/lib/queries';
import { COURSES, COURSE_ORDER } from '@/lib/constants';
import { formatTime, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function Courses() {
  const { data: schedules, isLoading } = useCourseSchedules();
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const { data: attendance } = useAttendance(expanded ?? undefined);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  const scheduleByCourse = new Map((schedules ?? []).map((s) => [s.course, s]));

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COURSE_ORDER.map((course) => {
        const schedule = scheduleByCourse.get(course);
        const meta = COURSES[course];
        const courseAttendance = attendance ?? [];
        const completed = schedule ? courseAttendance.filter((a) => a.is_present).length : 0;
        const total = schedule?.total_classes ?? 16;
        const pct = schedule ? (completed / total) * 100 : 0;
        const isExpanded = expanded === schedule?.id;

        return (
          <StaggerItem key={course}>
            <Card className={cn('card-hover', isExpanded && 'sm:col-span-2 lg:col-span-1')}>
            <CardHeader className="bg-gradient-to-br from-coffee-100 to-taupe-100 dark:from-coffee-900/40 dark:to-taupe-900/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm">
                  <Music className="h-5 w-5" style={{ color: meta.color }} />
                </span>
                <div className="flex-1">
                  <CardTitle className="text-base">{meta.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {schedule?.instructor?.full_name ?? 'Instructor TBA'}
                  </p>
                </div>
                {schedule && (
                  <Badge variant={schedule.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                    {schedule.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {schedule ? (
                <>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completed}/{total} classes</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="mt-1" barClassName="bg-coffee-500" />
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => setExpanded(isExpanded ? null : schedule.id)}
                  >
                    {isExpanded ? 'Hide details' : 'View class days'}
                  </button>
                  {isExpanded && (
                    <ul className="space-y-1">
                      {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
                        const rec = courseAttendance.find((a) => a.class_day === day);
                        return (
                          <li key={day} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
                            {rec?.is_present ? (
                              <CheckCircle2 className="h-4 w-4 text-sage-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-warmred-300" />
                            )}
                            <span className="w-6 font-medium">Day {day}</span>
                            {rec && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {rec.arrival_time ? `${formatTime(rec.arrival_time)}` : ''}
                                {rec.arrival_time && rec.exit_time ? ' – ' : ''}
                                {rec.exit_time ? formatTime(rec.exit_time) : ''}
                                {rec.note ? ` · ${rec.note}` : ''}
                              </span>
                            )}
                            {!rec && <span className="ml-auto text-xs text-muted-foreground">not held</span>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No schedule yet for this course.</p>
              )}
            </CardContent>
            </Card>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
