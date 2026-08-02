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
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function Field({ id, label, icon: Icon, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-semibold text-coffee-800 dark:text-coffee-200">
        <span className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-coffee-700" />
          {label}
          {required && <span className="text-warmred-500">*</span>}
          {hint && <span className="font-normal text-muted-foreground">({hint})</span>}
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

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Supabase কনফিগার করা নেই। <code>NEXT_PUBLIC_SUPABASE_URL</code> এবং{' '}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> এনভায়রনমেন্টে যোগ করুন।
      </p>
    );
  }

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
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
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success('অ্যাকাউন্ট তৈরি হয়েছে। প্রভাতফেরীতে স্বাগতম!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Top row — name & phone */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="fullName"
          label="আবেদনকারীর নাম"
          icon={User}
          required
          hint="ইংরেজিতে লিখুন"
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
          hint="ইংরেজিতে লিখুন"
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

      {/* Nested DU student info container */}
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
            placeholder="you@example.com"
            className="border-input bg-white/70"
            {...register('email')}
          />
        </Field>
        <Field id="password" label="পাসওয়ার্ড" icon={Lock} required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
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
          placeholder="আবার পাসওয়ার্ড লিখুন"
          className="border-input bg-white/70"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-warmred-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'অ্যাকাউন্ট তৈরি হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করুন'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        আগে থেকে অ্যাকাউন্ট আছে?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          সাইন ইন করুন
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        নতুন অ্যাকাউন্ট <span className="font-medium">ভিজিটর</span> হিসেবে শুরু হয়। কমিটি আপনার ভূমিকা নির্ধারণ করবে।
      </p>
    </form>
  );
}
