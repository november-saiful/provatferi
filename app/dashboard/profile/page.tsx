'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_NAMES } from '@/lib/permissions';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import {
  User,
  Phone,
  GraduationCap,
  Building2,
  Landmark,
  IdCard,
  Mail,
  Save,
  ArrowLeft,
  Camera,
  type LucideIcon
} from 'lucide-react';
import type { Profile } from '@/lib/types';

const BANGLA_DIGITS = /[০-৯]/g;

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function Field({ id, label, icon: Icon, error, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-semibold">
        <span className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
      </Label>
      {children}
      {error && <p className="text-xs text-warmred-500">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, refreshProfile } = useAuthStore();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form state
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [academicSession, setAcademicSession] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [hallName, setHallName] = React.useState('');
  const [regId, setRegId] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuthChecked(true);
  }, []);

  React.useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        toast.error('প্রোফাইল লোড করা যায়নি');
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
        setAcademicSession(data.academic_session ?? '');
        setDepartment(data.department ?? '');
        setHallName(data.hall_name ?? '');
        setRegId(data.reg_id ?? '');
        setAvatarUrl(data.avatar_url);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, router]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'সম্পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)';
    }

    if (!phone.trim() || !/^01[0-9]{9}$/.test(phone.trim())) {
      newErrors.phone = 'মোবাইল নম্বরটি 01 দিয়ে শুরু হওয়া ১১ সংখ্যার হতে হবে';
    }

    if (!academicSession.trim() || !/^\d{4}-\d{2,4}$/.test(academicSession.trim())) {
      newErrors.academicSession = 'শিক্ষাবর্ষ যেমন: 2020-21';
    }

    if (!department.trim()) {
      newErrors.department = 'বিভাগের নাম লিখুন';
    }

    if (!hallName.trim()) {
      newErrors.hallName = 'হলের নাম লিখুন';
    }

    if (!regId.trim() || regId.trim().length < 6) {
      newErrors.regId = 'রেজিস্ট্রেশন আইডি লিখুন (কমপক্ষে ৬ অক্ষর)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি আপলোড করুন');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ছবির সাইজ ২MB এর কম হতে হবে');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `avatars/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        toast.error('ছবি আপলোড হয়নি: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(fileName);
      setAvatarUrl(urlData.publicUrl);
      toast.success('ছবি আপলোড হয়েছে');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          academic_session: academicSession.trim(),
          department: department.trim(),
          hall_name: hallName.trim(),
          reg_id: regId.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) {
        toast.error('প্রোফাইল আপডেট হয়নি: ' + error.message);
        return;
      }

      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return <EmptyState title="প্রোফাইল পাওয়া যায়নি" description="আবার চেষ্টা করুন।" />;
  }

  return (
    <Stagger className="space-y-6" gap={10}>
      <StaggerItem>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title="আমার প্রোফাইল"
            description="আপনার ব্যক্তিগত তথ্য দেখুন ও সম্পাদনা করুন"
          />
        </div>
      </StaggerItem>

      <StaggerItem>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  name={profile.full_name}
                  src={avatarUrl}
                  className="h-20 w-20 text-2xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:scale-110 disabled:opacity-50"
                >
                  {isUploading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{profile.full_name ?? 'ব্যবহারকারী'}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="coffee">{ROLE_NAMES[profile.role_id] ?? profile.role_id}</Badge>
                  <Badge variant={profile.is_active ? 'success' : 'secondary'}>
                    {profile.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold">ব্যক্তিগত তথ্য</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="fullName" label="পূর্ণ নাম" icon={User} error={errors.fullName}>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম"
                />
              </Field>

              <Field id="phone" label="মোবাইল নম্বর" icon={Phone} error={errors.phone}>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(BANGLA_DIGITS, '');
                    setPhone(v);
                  }}
                  placeholder="01XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={11}
                />
              </Field>
            </div>
          </div>

          {/* DU Student Information */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold">ঢাকা বিশ্ববিদ্যালয়ের শিক্ষার্থীর তথ্য</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="academicSession"
                label="শিক্ষাবর্ষ"
                icon={GraduationCap}
                error={errors.academicSession}
              >
                <Input
                  id="academicSession"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  placeholder="যেমন: 2020-21"
                />
              </Field>

              <Field id="department" label="বিভাগ" icon={Building2} error={errors.department}>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="যেমন: দর্শন বিভাগ"
                />
              </Field>

              <Field id="hallName" label="হলের নাম" icon={Landmark} error={errors.hallName}>
                <Input
                  id="hallName"
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  placeholder="যেমন: রোকেয়া হল"
                />
              </Field>

              <Field id="regId" label="রেজিস্ট্রেশন আইডি" icon={IdCard} error={errors.regId}>
                <Input
                  id="regId"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="যেমন: 2019XXXXXX"
                />
              </Field>
            </div>
          </div>

          {/* Account Info (Read-only) */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold">অ্যাকাউন্ট তথ্য</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    ইমেইল
                  </span>
                </Label>
                <p className="text-sm">{profile.email}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-muted-foreground">যোগদানের তারিখ</Label>
                <p className="text-sm">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </StaggerItem>
    </Stagger>
  );
}
