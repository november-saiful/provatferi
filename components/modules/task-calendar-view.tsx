'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Clock, Gift, User, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useTasksByDate, useTaskDates } from '@/lib/queries';
import { useAuthStore } from '@/lib/auth-store';
import { canManageTasks } from '@/lib/permissions';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { TaskForm } from '@/components/forms/task-form';
import type { Task } from '@/lib/types';

const STATUS_CONFIG = {
  pending: { label: 'অপেক্ষমাণ', icon: Circle, color: 'text-amber-500', bg: 'bg-amber-500/10', dot: '#D97706' },
  in_progress: { label: 'চলমান', icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', dot: '#2563EB' },
  completed: { label: 'সম্পন্ন', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-600/10', dot: '#16A34A' }
} as const;

type StatusKey = 'pending' | 'in_progress' | 'completed';

const STATUS_CYCLE: StatusKey[] = ['pending', 'in_progress', 'completed'];

function TaskItem({
  task,
  onClick,
  onDelete,
  onStatusChange
}: {
  task: Task;
  onClick?: () => void;
  onDelete?: (t: Task) => void;
  onStatusChange?: (task: Task, status: StatusKey) => void;
}) {
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div
      className={`bg-muted relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full ${onClick ? 'cursor-pointer hover:bg-accent/50' : ''}`}
      style={{ '--tw-after-bg': status.dot } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {onStatusChange ? (
              <div className="flex items-center gap-1">
                {STATUS_CYCLE.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const active = task.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onStatusChange(task, s); }}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-200 ${
                        active
                          ? `${cfg.bg} ${cfg.color} ring-1 ring-current/20`
                          : 'bg-transparent text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground'
                      }`}
                      title={cfg.label}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.color}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            )}
          </div>
          <div className="mt-1 font-medium">{task.title}</div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee_name}
            </span>
            {task.start_time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.start_time.slice(0, 5)}
                {task.end_time && ` – ${task.end_time.slice(0, 5)}`}
              </span>
            )}
          </div>
          {task.perks && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Gift className="h-3 w-3" />
              {task.perks}
            </div>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="মুছুন"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TaskCalendarView() {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [detail, setDetail] = React.useState<Task | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formTask, setFormTask] = React.useState<Task | null | undefined>(undefined);

  const canEdit = canManageTasks(role);

  const dateStr = date ? date.toISOString().split('T')[0] : undefined;
  const { data: tasks, isLoading } = useTasksByDate(dateStr);
  const { data: taskDates } = useTaskDates();

  const highlightedDates = React.useMemo(
    () => (taskDates ?? []).map((d) => new Date(d + 'T00:00:00')),
    [taskDates]
  );

  const handleDelete = async (task: Task) => {
    if (!confirm('এই টাস্কটি মুছে ফেলবেন?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('টাস্ক মুছে ফেলা হয়েছে');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setDetail(null);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: StatusKey) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`স্ট্যাটাস আপডেট: ${STATUS_CONFIG[newStatus].label}`);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  const handleTaskClick = (task: Task) => {
    if (canEdit) {
      setFormTask(task);
      setFormOpen(true);
    } else {
      setDetail(task);
    }
  };

  return (
    <Stagger className="space-y-4">
      {/* Admin action bar */}
      {canEdit && (
        <StaggerItem className="flex justify-end">
          <Button onClick={() => { setFormTask(null); setFormOpen(true); }}>
            <Plus /> টাস্ক নির্ধারণ করুন
          </Button>
        </StaggerItem>
      )}

      <StaggerItem className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        {/* Calendar card */}
        <Card className="pt-4 md:w-auto">
          <CardContent className="px-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full bg-transparent p-0"
              modifiers={{
                hasTask: (day) => {
                  const dayStr = day.toISOString().split('T')[0];
                  return highlightedDates.some((d) => d.toISOString().split('T')[0] === dayStr);
                }
              }}
              modifiersStyles={{
                hasTask: {
                  backgroundColor: 'hsl(var(--primary) / 0.15)',
                  borderRadius: '9999px',
                  fontWeight: 600
                }
              }}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 border-t px-4 !pt-4">
            <div className="flex w-full items-center justify-between px-1">
              <div className="text-sm font-medium">
                {date?.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  title="টাস্ক যোগ করুন"
                  onClick={() => { setFormTask(null); setFormOpen(true); }}
                >
                  <Plus />
                  <span className="sr-only">টাস্ক যোগ করুন</span>
                </Button>
              )}
            </div>
            {/* Status legend */}
            <div className="flex w-full flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  {cfg.label}
                </span>
              ))}
            </div>
          </CardFooter>
        </Card>

        {/* Task list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task)}
                  onDelete={canEdit ? handleDelete : undefined}
                  onStatusChange={canEdit ? handleStatusChange : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="কোনো টাস্ক নেই"
              description={date ? 'এই তারিখে কোনো টাস্ক নির্ধারিত হয়নি।' : 'একটি তারিখ নির্বাচন করুন।'}
            />
          )}
        </div>
      </StaggerItem>

      {/* Read-only detail dialog (for public / non-admin users) */}
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
                {STATUS_CONFIG[detail.status]?.label ?? 'অপেক্ষমাণ'}
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

      {/* Add / edit form (admin only) */}
      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={formTask}
        defaultDate={date}
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
