'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import {
  User,
  Phone,
  GraduationCap,
  Building2,
  Landmark,
  IdCard,
  Mail,
  Lock,
  ShieldCheck,
  MailCheck,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { GoogleButton } from './google-button';

const BANGLA_DIGITS = /[০-৯]/g;

const schema = z
  .object({
    fullName: z.string().min(2, 'সম্পূর্ণ নাম লিখুন'),
    phone: z
      .string()
      .min(11, 'সঠিক মোবাইল নম্বর দিন')
      .regex(/^01[0-9]{9}$/, 'মোবাইল নম্বরটি 01 দিয়ে শুরু হওয়া ১১ সংখ্যার হতে হবে'),
    academicSession: z
      .string()
      .min(1, 'শিক্ষাবর্ষ লিখুন')
      .regex(/^\d{4}-\d{2,4}$/, 'শিক্ষাবর্ষ যেমন: 2020-21'),
    department: z.string().min(1, 'বিভাগের নাম লিখুন'),
    hallName: z.string().min(1, 'হলের নাম লিখুন'),
    regId: z.string().min(6, 'রেজিস্ট্রেশন আইডি লিখুন'),
    email: z.string().email('সঠিক ইমেইল দিন'),
    password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'পাসওয়ার্ড দুটি মিলছে না',
    path: ['confirmPassword']
  });

type FormValues = z.infer<typeof schema>;

const OTP_LENGTH = 6;

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function Field({ id, label, icon: Icon, required, error, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-semibold text-coffee-800 dark:text-coffee-200">
        <span className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-coffee-700" />
          {label}
          {required && <span className="text-warmred-500">*</span>}
        </span>
      </Label>
      {children}
      {error && <p className="text-xs text-warmred-500">{error}</p>}
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [step, setStep] = React.useState<1 | 2>(1);
  const [pendingEmail, setPendingEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [canResend, setCanResend] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` }
    });
    if (error) throw error;
  };

  const onSubmitStep1 = async (values: FormValues) => {
    setSending(true);
    try {
      const redirectTo = `${window.location.origin}/login`;
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: values.fullName,
            phone: values.phone,
            academic_session: values.academicSession,
            department: values.department,
            hall_name: values.hallName,
            reg_id: values.regId
          }
        }
      });
      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      await sendOtp(values.email);

      setPendingEmail(values.email);
      setOtp('');
      setCountdown(30);
      setCanResend(false);
      setStep(2);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const resendOtp = async () => {
    setSending(true);
    try {
      await sendOtp(pendingEmail);
      setOtp('');
      setCountdown(30);
      setCanResend(false);
      toast.success('নতুন কোড পাঠানো হয়েছে');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: otp,
      type: 'email'
    });
    if (error) {
      setVerifying(false);
      toast.error(error.message);
      return;
    }
    try {
      await refreshProfile();
      toast.success('ইমেইল নিশ্চিত হয়েছে। প্রভাতফেরীতে স্বাগতম!');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setVerifying(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Supabase কনফিগার করা নেই। <code>NEXT_PUBLIC_SUPABASE_URL</code> এবং{' '}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> এনভায়রনমেন্টে যোগ করুন।
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Provider row */}
      <div className="space-y-3">
        <GoogleButton />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          বা ইমেইল দিয়ে
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-5">
          {/* Top row — name & phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="fullName"
              label="আবেদনকারীর নাম"
              icon={User}
              required
              error={errors.fullName?.message}
            >
              <Input
                id="fullName"
                placeholder="যেমন: Saiful Islam Ibu"
                className="border-input bg-white/70"
                {...register('fullName')}
              />
            </Field>
            <Field
              id="phone"
              label="মোবাইল নম্বর"
              icon={Phone}
              required
              error={errors.phone?.message}
            >
              <Input
                id="phone"
                placeholder="যেমন: 017XXXXXXXX"
                inputMode="numeric"
                maxLength={11}
                className="border-input bg-white/70"
                {...register('phone')}
                onChange={(e) => {
                  const v = e.target.value.replace(BANGLA_DIGITS, '');
                  e.target.value = v;
                  register('phone').onChange(e);
                }}
              />
            </Field>
          </div>

          {/* DU student info */}
          <div className="rounded-xl2 border border-coffee-200/70 bg-coffee-50/40 p-4 sm:p-5 dark:border-coffee-800/60 dark:bg-coffee-950/30">
            <div className="mb-4 flex items-center gap-2 text-coffee-800 dark:text-coffee-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coffee-600/10 text-coffee-700 dark:bg-coffee-800/50 dark:text-coffee-300">
                <Landmark className="h-4 w-4" />
              </span>
              <h3 className="font-bold tracking-tight">ঢাকা বিশ্ববিদ্যালয়ের শিক্ষার্থীর তথ্য</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="academicSession"
                label="শিক্ষাবর্ষ (Academic Session)"
                icon={GraduationCap}
                required
                error={errors.academicSession?.message}
              >
                <Input
                  id="academicSession"
                  placeholder="যেমন: 2020-21"
                  className="border-input bg-white/70"
                  {...register('academicSession')}
                />
              </Field>
              <Field
                id="department"
                label="বিভাগ (Department Name)"
                icon={Building2}
                required
                error={errors.department?.message}
              >
                <Input
                  id="department"
                  placeholder="যেমন: দর্শন বিভাগ"
                  className="border-input bg-white/70"
                  {...register('department')}
                />
              </Field>
              <Field
                id="hallName"
                label="হলের নাম (Hall Name)"
                icon={Landmark}
                required
                error={errors.hallName?.message}
              >
                <Input
                  id="hallName"
                  placeholder="যেমন: রোকেয়া হল"
                  className="border-input bg-white/70"
                  {...register('hallName')}
                />
              </Field>
              <Field
                id="regId"
                label="Academic Registration ID"
                icon={IdCard}
                required
                error={errors.regId?.message}
              >
                <Input
                  id="regId"
                  placeholder="যেমন: 2019XXXXXX"
                  className="border-input bg-white/70"
                  {...register('regId')}
                />
              </Field>
            </div>
          </div>

          {/* Login credentials */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="email" label="ইমেইল" icon={Mail} required error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="border-input bg-white/70"
                {...register('email')}
              />
            </Field>
            <Field id="password" label="পাসওয়ার্ড" icon={Lock} required error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="কমপক্ষে ৮ অক্ষর"
                className="border-input bg-white/70"
                {...register('password')}
              />
            </Field>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-coffee-800 dark:text-coffee-200">
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-coffee-700" />
                পাসওয়ার্ড নিশ্চিত করুন<span className="text-warmred-500">*</span>
              </span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="আবার পাসওয়ার্ড লিখুন"
              className="border-input bg-white/70"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-warmred-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-coffee-200/60 bg-coffee-50/30 p-3 dark:border-coffee-800/50 dark:bg-coffee-950/20">
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-600 dark:text-sage-400" />
              <span>
                সাবমিট করলে আমরা আপনার ইমেইলে একটি <strong>৬ সংখ্যার ভেরিফিকেশন কোড</strong> পাঠাব।
                কোডটি দিন এবং রেজিস্ট্রেশন সম্পূর্ণ করুন।
              </span>
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || sending}>
            {sending ? 'কোড পাঠানো হচ্ছে…' : 'ভেরিফিকেশন কোড পাঠান'}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtp();
          }}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-lg shadow-sage-500/25">
              <MailCheck className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold tracking-tight">ইমেইল নিশ্চিত করুন</h3>
            <p className="text-sm text-muted-foreground">
              আমরা <span className="font-semibold text-foreground">{pendingEmail}</span>-এ একটি{' '}
              {OTP_LENGTH} সংখ্যার কোড পাঠিয়েছি।
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" />
                ভেরিফিকেশন কোড
              </span>
            </Label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={OTP_LENGTH}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={'•'.repeat(OTP_LENGTH)}
              className="border-input bg-white/70 text-center text-lg tracking-[0.5em]"
              autoFocus
            />
            <p className="text-center text-xs text-muted-foreground">
              {canResend ? (
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={sending}
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  কোডটি আবার পাঠান
                </button>
              ) : (
                <>পুনরায় পাঠাতে {countdown} সেকেন্ড অপেক্ষা করুন</>
              )}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={verifying || otp.length !== OTP_LENGTH}>
            {verifying ? 'যাচাই হচ্ছে…' : 'ইমেইল নিশ্চিত করুন'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep(1)}
            disabled={verifying}
          >
            <ArrowLeft className="h-4 w-4" />
            তথ্য পরিবর্তন করতে ফিরে যান
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        আগে থেকে অ্যাকাউন্ট আছে?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          সাইন ইন করুন
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        নতুন অ্যাকাউন্ট <span className="font-medium">ভিজিটর</span> হিসেবে শুরু হয়। কমিটি আপনার ভূমিকা নির্ধারণ করবে।
      </p>
    </div>
  );
}