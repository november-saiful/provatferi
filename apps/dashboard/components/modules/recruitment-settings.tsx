'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarClock, ExternalLink, Loader2, Power, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Countdown } from '@/components/recruitment/countdown';
import { useRecruitmentSettings, useUpdateRecruitmentSettings } from '@/lib/queries';
import {
  fromLocalInput,
  phaseTarget,
  resolveRecruitmentPhase,
  toLocalInput,
  type RecruitmentPhase
} from '@/lib/recruitment';
import { cn } from '@/lib/utils';

const PHASE_STYLE: Record<RecruitmentPhase, { label: string; className: string }> = {
  open: {
    label: 'চালু — ফর্ম খোলা',
    className: 'border-sage-300 bg-sage-50 text-sage-800 dark:border-sage-800 dark:bg-sage-900/40 dark:text-sage-300'
  },
  scheduled: {
    label: 'নির্ধারিত — এখনো শুরু হয়নি',
    className: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  },
  ended: {
    label: 'সমাপ্ত — ফর্ম বন্ধ',
    className: 'border-warmred-300 bg-warmred-50 text-warmred-800 dark:border-warmred-900 dark:bg-warmred-900/40 dark:text-warmred-300'
  },
  disabled: {
    label: 'বন্ধ (ম্যানুয়াল)',
    className: 'border-border bg-muted text-muted-foreground'
  }
};

export function RecruitmentSettingsPanel() {
  const { data, isLoading } = useRecruitmentSettings();
  const update = useUpdateRecruitmentSettings();

  const [enabled, setEnabled] = React.useState(true);
  const [startsInput, setStartsInput] = React.useState('');
  const [endsInput, setEndsInput] = React.useState('');

  React.useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setStartsInput(toLocalInput(data.startsAt));
    setEndsInput(toLocalInput(data.endsAt));
  }, [data]);

  const draft = {
    enabled,
    startsAt: fromLocalInput(startsInput) || null,
    endsAt: fromLocalInput(endsInput) || null
  };
  const phase = resolveRecruitmentPhase(draft);
  const target = phaseTarget(draft, phase);
  const style = PHASE_STYLE[phase];

  const dirty =
    !data ||
    data.enabled !== draft.enabled ||
    (data.startsAt ?? '') !== (draft.startsAt ?? '') ||
    (data.endsAt ?? '') !== (draft.endsAt ?? '');

  const save = () => {
    if (draft.startsAt && draft.endsAt && Date.parse(draft.endsAt) <= Date.parse(draft.startsAt)) {
      toast.error('শেষ সময় অবশ্যই শুরুর সময়ের পরে হতে হবে');
      return;
    }
    update.mutate(draft, {
      onSuccess: () => toast.success('রিক্রুটমেন্ট সেটিংস সেভ হয়েছে'),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'সেভ ব্যর্থ হয়েছে')
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-4 w-4 text-primary" />
                রিক্রুটমেন্ট নিয়ন্ত্রণ
              </CardTitle>
              <CardDescription className="mt-1">
                চালু/বন্ধ করুন এবং রিক্রুটমেন্ট পর্বের শুরুর ও শেষের সময় ঠিক করুন। পপআপ ও
                হোমপেজে লাইভ কাউন্টডাউন দেখানো হবে।
              </CardDescription>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold',
                style.className
              )}
            >
              {style.label}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">রিক্রুটমেন্ট পেজ চালু</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                বন্ধ থাকলে ফর্ম ও নেভিগেশন লিংক লুকানো থাকবে এবং সাবমিট API বন্ধ থাকবে।
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isLoading || update.isPending}
              aria-label="রিক্রুটমেন্ট পেজ চালু করুন"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                শুরুর সময় (ঐচ্ছিক)
              </label>
              <Input
                type="datetime-local"
                value={startsInput}
                onChange={(e) => setStartsInput(e.target.value)}
                disabled={isLoading || update.isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                খালি রাখলে কোনো শুরুর সীমা থাকবে না।
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                শেষের সময় (ঐচ্ছিক)
              </label>
              <Input
                type="datetime-local"
                value={endsInput}
                onChange={(e) => setEndsInput(e.target.value)}
                disabled={isLoading || update.isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                এই সময় পার হলে ফর্ম স্বয়ংক্রিয়ভাবে বন্ধ হবে।
              </p>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            সময় আপনার ডিভাইসের লোকাল টাইমে দেওয়া হচ্ছে এবং UTC হিসেবে সেভ হবে। শুরুর সময়ের
            আগে বা শেষের সময়ের পরে পেজে ফর্মের বদলে কাউন্টডাউন দেখানো হবে।
          </p>

          {target && (
            <div className="rounded-xl border border-border bg-card p-4">
              <Countdown
                target={target}
                label={phase === 'scheduled' ? 'শুরু হতে বাকি' : 'শেষ হতে বাকি'}
              />
            </div>
          )}
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 pb-4 pt-3 sm:px-5 md:px-6">
          <Link
            href="/recruitment/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
          >
            রিক্রুটমেন্ট পেজ দেখুন
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <div className="flex items-center gap-2">
            {!dirty && !update.isPending && (
              <span className="text-xs text-muted-foreground">সব সেভ করা আছে</span>
            )}
            <Button onClick={save} disabled={!dirty || update.isPending || isLoading}>
              {update.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              সেভ করুন
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
