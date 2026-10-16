'use client';

import * as React from 'react';
import Link from 'next/link';
import { BadgeCheck, Clock3, GraduationCap, Send, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { useMyAlumniClaim } from '@/lib/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STATUS_COPY: Record<string, { icon: typeof Clock3; title: string; body: string }> = {
  pending: {
    icon: Clock3,
    title: 'আপনার দাবি পর্যালোচনাধীন',
    body: 'কমিটির সদস্যরা যাচাই করে অনুমোদন দিলে আপনার প্রোফাইল অ্যালামনাই তালিকায় যুক্ত হবে।',
  },
  approved: {
    icon: BadgeCheck,
    title: 'অভিনন্দন! আপনি এখন অ্যালামনাই',
    body: 'আপনার প্রোফাইল অ্যালামনাই ডিরেক্টরিতে দেখা যাচ্ছে।',
  },
  rejected: {
    icon: XCircle,
    title: 'দাবিটি গৃহীত হয়নি',
    body: 'তথ্যে কোনো ভুল থাকলে সঠিক করে আবার জমা দিন, অথবা কমিটির সাথে যোগাযোগ করুন।',
  },
};

function ClaimForm({ userId, defaultName }: { userId: string; defaultName: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    full_name: defaultName,
    academic_session: '',
    department: '',
    hall_name: '',
    reg_id: '',
    phone: '',
    note: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error('আপনার নাম লিখুন');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('alumni_claims').insert({
      user_id: userId,
      full_name: form.full_name.trim(),
      academic_session: form.academic_session.trim() || null,
      department: form.department.trim() || null,
      hall_name: form.hall_name.trim() || null,
      reg_id: form.reg_id.trim() || null,
      phone: form.phone.trim() || null,
      note: form.note.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('দাবি জমা হয়েছে — পর্যালোচনার পর জানানো হবে');
    qc.invalidateQueries({ queryKey: ['alumni-claims', 'mine'] });
  };

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="claim-name">পুরো নাম *</Label>
        <Input id="claim-name" value={form.full_name} onChange={set('full_name')} placeholder="আপনার নাম" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claim-phone">মোবাইল</Label>
        <Input id="claim-phone" value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claim-session">শিক্ষাবর্ষ</Label>
        <Input id="claim-session" value={form.academic_session} onChange={set('academic_session')} placeholder="যেমন: 2015-16" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claim-dept">বিভাগ</Label>
        <Input id="claim-dept" value={form.department} onChange={set('department')} placeholder="যেমন: দর্শন বিভাগ" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claim-hall">হল</Label>
        <Input id="claim-hall" value={form.hall_name} onChange={set('hall_name')} placeholder="যেমন: রোকেয়া হল" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="claim-reg">রেজিস্ট্রেশন নম্বর</Label>
        <Input id="claim-reg" value={form.reg_id} onChange={set('reg_id')} placeholder="একাডেমিক রেজিস্ট্রেশন নম্বর" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="claim-note">বাড়তি তথ্য (ঐচ্ছিক)</Label>
        <Textarea
          id="claim-note"
          value={form.note}
          onChange={set('note')}
          placeholder="কোন ব্যাচে ছিলেন, কে চিনবে — যাচাইয়ে সাহায্য করে এমন কিছু লিখুন"
          rows={3}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          <Send className="h-4 w-4" aria-hidden="true" />
          {busy ? 'জমা হচ্ছে…' : 'দাবি জমা দিন'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Alumni onboarding card: signed-out visitors are asked to log in;
 * signed-in non-alumni can file (and track) an alumni claim.
 */
export function AlumniClaimCard() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { data: claim, isLoading } = useMyAlumniClaim(!!user);
  const [open, setOpen] = React.useState(false);

  // Already alumni (or committee) — nothing to claim.
  if (user && profile && profile.role_id !== 'visitor') return null;

  return (
    <Card className="overflow-hidden border-2 border-dashed border-primary/30">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold tracking-tight">প্রাক্তন সদস্য? প্রোফাইল দাবি করুন</p>
            <p className="mt-1 text-sm text-muted-foreground">
              লগইন করে আপনার শিক্ষাবর্ষ ও বিভাগ জানান — যাচাই শেষে নাম অ্যালামনাই তালিকায় উঠবে।
            </p>
          </div>
        </div>

        {!user && (
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-all hover:-translate-y-0.5"
          >
            লগইন করে দাবি করুন
          </Link>
        )}

        {user && isLoading && (
          <p className="mt-4 text-sm text-muted-foreground">লোড হচ্ছে…</p>
        )}

        {user && !isLoading && claim && (() => {
          const copy = STATUS_COPY[claim.status];
          const Icon = copy.icon;
          return (
            <div className="mt-4 rounded-xl bg-muted p-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {copy.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
              {claim.status === 'rejected' && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
                  নতুন করে জমা দিন
                </Button>
              )}
            </div>
          );
        })()}

        {user && !isLoading && (!claim || (claim.status === 'rejected' && open)) && (
          <>
            {claim?.status === 'rejected' && (
              <p className="mt-4 text-xs text-muted-foreground">
                আগের দাবি গৃহীত হয়নি — নিচে সংশোধন করে আবার পাঠান।
              </p>
            )}
            <ClaimForm userId={user.id} defaultName={profile?.full_name ?? ''} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
