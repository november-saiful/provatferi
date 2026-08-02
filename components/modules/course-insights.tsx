'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { useCourseSchedules, useAllAttendance } from '@/lib/queries';
import { COURSES, COURSE_ORDER } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export function CourseInsights() {
  const { data: schedules, isLoading } = useCourseSchedules();
  const { data: attendance, isLoading: loadingAttendance } = useAllAttendance(true);

  if (isLoading || loadingAttendance) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const scheduleById = new Map((schedules ?? []).map((s) => [s.id, s]));
  const allRecords = attendance ?? [];

  const perCourse = COURSE_ORDER.map((course) => {
    const schedule = (schedules ?? []).find((s) => s.course === course);
    const records = schedule ? allRecords.filter((a) => a.course_schedule_id === schedule.id) : [];
    const present = records.filter((a) => a.is_present).length;
    const held = records.length;
    const total = schedule?.total_classes ?? 16;
    return {
      course,
      label: COURSES[course].label,
      color: COURSES[course].color,
      schedule,
      records,
      present,
      held,
      total,
      rate: held > 0 ? (present / held) * 100 : 0
    };
  });

  const totalHeld = perCourse.reduce((s, c) => s + c.held, 0);
  const totalPresent = perCourse.reduce((s, c) => s + c.present, 0);
  const avgRate = totalHeld > 0 ? (totalPresent / totalHeld) * 100 : 0;
  const withData = perCourse.filter((c) => c.held > 0);
  let best: { rate: number; label: string } = { rate: -1, label: '—' };
  let worst: { rate: number; label: string } = { rate: 101, label: '—' };
  for (const c of withData) {
    if (c.rate > best.rate) best = { rate: c.rate, label: c.label };
    if (c.rate < worst.rate) worst = { rate: c.rate, label: c.label };
  }

  const completionData = perCourse.map((c) => ({
    name: c.label,
    Completed: c.present,
    Remaining: Math.max(0, c.total - c.present)
  }));

  const trendData = Array.from({ length: 16 }, (_, i) => {
    const day = i + 1;
    const row: Record<string, string | number> = { day: `Day ${day}` };
    for (const c of perCourse) {
      const rec = c.records.find((a) => a.class_day === day);
      row[c.label] = rec === undefined ? 0 : rec.is_present ? 1 : 0;
    }
    return row;
  });

  return (
    <Stagger className="space-y-6">
      <StaggerItem>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total classes held</p>
            <p className="mt-1 text-3xl font-bold">{totalHeld}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average attendance rate</p>
            <p className="mt-1 text-3xl font-bold text-sage-600">{avgRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Most attended</p>
            <p className="mt-1 text-xl font-bold">{withData.length ? best.label : '—'}</p>
            {withData.length > 0 && <p className="text-xs text-muted-foreground">{best.rate.toFixed(0)}%</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Needs attention</p>
            <p className="mt-1 text-xl font-bold">{withData.length ? worst.label : '—'}</p>
            {withData.length > 0 && <p className="text-xs text-muted-foreground">{worst.rate.toFixed(0)}%</p>}
          </CardContent>
        </Card>
        </div>
      </StaggerItem>

      <Card>
        <CardHeader>
          <CardTitle>Completion overview</CardTitle>
          <CardDescription>Present classes vs remaining (out of {perCourse[0]?.total ?? 16} per course)</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Completed" stackId="a" fill="#93452A" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Remaining" stackId="a" fill="#E5D0BC" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance trend over 16 days</CardTitle>
          <CardDescription>Daily presence per course (0 = not held or absent, 1 = present)</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" interval={1} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} />
              <Tooltip />
              <Legend />
              {perCourse.map((c) => (
                <Line key={c.course} type="monotone" dataKey={c.label} stroke={c.color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {totalHeld === 0 && (
        <EmptyState title="No attendance data yet" description="Once the Course Coordinator records classes, charts will appear here." />
      )}
    </Stagger>
  );
}
