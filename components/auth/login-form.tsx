'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleButton } from './google-button';

const schema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
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
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .maybeSingle();
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      toast.error('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। বিস্তারিত জানতে কমিটির সাথে যোগাযোগ করুন।');
      return;
    }
    await refreshProfile();
    toast.success('সাইন ইন হয়েছে');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <GoogleButton label="Google দিয়ে সাইন ইন করুন" />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        বা ইমেইল দিয়ে
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">ইমেইল</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-warmred-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">পাসওয়ার্ড</Label>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-warmred-500">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'সাইন ইন হচ্ছে…' : 'সাইন ইন'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        অ্যাকাউন্ট নেই?{' '}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          একটি তৈরি করুন
        </Link>
      </p>
    </div>
  );
}