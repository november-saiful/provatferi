'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GraduationCap, Building2, Landmark, IdCard, MailCheck, ArrowRight, type LucideIcon } from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import type { Profile } from '@/lib/types';

const BANGLA_DIGITS = /[০-৯]/g;

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, icon: Icon, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        <span className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
          {hint && <span className="font-normal text-muted-foreground">({hint})</span>}
          <span className="ml-auto text-warmred-500">*</span>
        </span>
      </Label>
      {children}
      {error && <p className="text-xs text-warmred-500">{error}</p>}
    </div>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading } = useAuthStore();

  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [academicSession, setAcademicSession] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [hallName, setHallName] = React.useState('');
  const [regId, setRegId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setAcademicSession(profile.academic_session ?? '');
      setDepartment(profile.department ?? '');
      setHallName(profile.hall_name ?? '');
      setRegId(profile.reg_id ?? '');
    }
  }, [user, profile, loading, router]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = 'সম্পূর্ণ নাম লিখুন';
    if (!/^01[0-9]{9}$/.test(phone.trim())) e.phone = 'মোবাইল নম্বরটি 01 দিয়ে শুরু হওয়া ১১ সংখ্যার হতে হবে';
    if (!/^\d{4}-\d{2,4}$/.test(academicSession.trim())) e.academicSession = 'শিক্ষাবর্ষ যেমন: 2020-21';
    if (!department.trim()) e.department = 'বিভাগের নাম লিখুন';
    if (!hallName.trim()) e.hallName = 'হলের নাম লিখুন';
    if (!regId.trim() || regId.trim().length < 6) e.regId = 'রেজিস্ট্রেশন আইডি লিখুন (কমপক্ষে ৬ অক্ষর)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          academic_session: academicSession.trim(),
          department: department.trim(),
          hall_name: hallName.trim(),
          reg_id: regId.trim()
        })
        .eq('id', user.id);
      if (error) {
        toast.error('সংরক্ষণ হয়নি: ' + error.message);
        return;
      }
      await refreshProfile();
      toast.success('প্রোফাইল সম্পূর্ণ হয়েছে। স্বাগতম!');
      router.replace('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicShell>
      <Seo title="প্রোফাইল সম্পন্ন করুন" />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16">
        <Reveal className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-lg shadow-sage-500/25">
            <MailCheck className="h-8 w-8" />
          </span>
        </Reveal>
        <Reveal delay={0.08} className="w-full">
          <Card className="mt-8 w-full shadow-lg border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">রেজিস্ট্রেশন সম্পূর্ণ করুন</CardTitle>
            <p className="text-sm text-muted-foreground">
              অ্যাকাউন্ট নিশ্চিত হয়েছে। ড্যাশবোর্ড ব্যবহার করতে ঢাকা বিশ্ববিদ্যালয়‍ের শিক্ষার্থীর তথ্য দিন।
            </p>
          </CardHeader>
          <div className="px-6 pb-6">
            {loading && <Skeleton className="h-72 w-full" />}
            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                ইমেইল: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <RevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RevealItem className="min-w-0" y={10}>
                  <Field id="fullName" label="পূর্ণ নাম" icon={GraduationCap} error={errors.fullName}>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: Saiful Islam Ibu"
                    />
                  </Field>
                </RevealItem>
                <RevealItem className="min-w-0" y={10}>
                  <Field id="phone" label="মোবাইল নম্বর" icon={GraduationCap} error={errors.phone}>
                    <Input
                      id="phone"
                      value={phone}
                      inputMode="numeric"
                      maxLength={11}
                      onChange={(e) => setPhone(e.target.value.replace(BANGLA_DIGITS, ''))}
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                </RevealItem>
                <RevealItem className="min-w-0" y={10}>
                  <Field id="academicSession" label="শিক্ষাবর্ষ" icon={GraduationCap} hint="2020-21" error={errors.academicSession}>
                    <Input
                      id="academicSession"
                      value={academicSession}
                      onChange={(e) => setAcademicSession(e.target.value)}
                      placeholder="যেমন: 2020-21"
                    />
                  </Field>
                </RevealItem>
                <RevealItem className="min-w-0" y={10}>
                  <Field id="department" label="বিভাগ" icon={Building2} error={errors.department}>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="যেমন: দর্শন বিভাগ"
                    />
                  </Field>
                </RevealItem>
                <RevealItem className="min-w-0" y={10}>
                  <Field id="hallName" label="হলের নাম" icon={Landmark} error={errors.hallName}>
                    <Input
                      id="hallName"
                      value={hallName}
                      onChange={(e) => setHallName(e.target.value)}
                      placeholder="যেমন: রোকেয়া হল"
                    />
                  </Field>
                </RevealItem>
                <RevealItem className="min-w-0" y={10}>
                  <Field id="regId" label="রেজিস্ট্রেশন আইডি" icon={IdCard} error={errors.regId}>
                    <Input
                      id="regId"
                      value={regId}
                      onChange={(e) => setRegId(e.target.value)}
                      placeholder="যেমন: 2019XXXXXX"
                    />
                  </Field>
                </RevealItem>
              </RevealStagger>
              <Button type="submit" className="w-full" disabled={saving}>
                <ArrowRight className="h-4 w-4" />
                {saving ? 'সংরক্ষণ হচ্ছে…' : 'সম্পন্ন করুন'}
              </Button>
            </form>
          </div>
          </Card>
        </Reveal>
      </div>
    </PublicShell>
  );
}