'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GraduationCap, Building2, Phone, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import type { Profile } from '@/lib/types';

const BANGLA_DIGITS = /[০-৯]/g;

/**
 * Check if profile has at least 4 of the 5 required fields:
 * full_name, academic_session, phone, department, reg_id
 */
function isProfileComplete(p: Profile | null): boolean {
  if (!p) return false;
  const fields = [
    p.full_name?.trim(),
    p.academic_session?.trim(),
    p.phone?.trim(),
    p.department?.trim(),
    p.reg_id?.trim()
  ];
  const filledCount = fields.filter(Boolean).length;
  return filledCount >= 4;
}

interface ProfileCompletionGateProps {
  children: React.ReactNode;
}

export function ProfileCompletionGate({ children }: ProfileCompletionGateProps) {
  const router = useRouter();
  const { user, profile, refreshProfile, loading } = useAuthStore();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [academicSession, setAcademicSession] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [hallName, setHallName] = React.useState('');
  const [regId, setRegId] = React.useState('');

  // Initialize form and check completion
  React.useEffect(() => {
    if (loading || !user || !profile) return;

    if (!isProfileComplete(profile)) {
      setOpen(true);
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setAcademicSession(profile.academic_session ?? '');
      setDepartment(profile.department ?? '');
      setHallName(profile.hall_name ?? '');
      setRegId(profile.reg_id ?? '');
    }
  }, [user, profile, loading]);

  // Re-check when profile updates
  React.useEffect(() => {
    if (profile && isProfileComplete(profile)) {
      setOpen(false);
    }
  }, [profile]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = 'সম্পূর্ণ নাম লিখুন';
    if (!/^01[0-9]{9}$/.test(phone.trim())) e.phone = '০১ দিয়ে শুরু হওয়া ১১ সংখ্যার মোবাইল নম্বর দিন';
    if (!/^\d{4}-\d{2,4}$/.test(academicSession.trim())) e.academicSession = 'শিক্ষাবর্ষ যেমন: 2020-21';
    if (!department.trim()) e.department = 'বিভাগ লিখুন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          hall_name: hallName.trim() || null,
          reg_id: regId.trim() || null
        })
        .eq('id', user.id);

      if (error) {
        toast.error('সংরক্ষণ হয়নি: ' + error.message);
        return;
      }

      await refreshProfile();
      toast.success('প্রোফাইল আপডেট হয়েছে!');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Don't render modal if loading or not signed in
  if (loading || !user) {
    return <>{children}</>;
  }

  const handleClose = () => {
    // Don't allow closing if profile is incomplete
    if (!isProfileComplete(profile)) {
      toast.warning('প্রোফাইল সম্পূর্ণ করুন');
      return;
    }
    setOpen(false);
  };

  return (
    <>
      {children}
      <Dialog open={open} onClose={handleClose} title="প্রোফাইল সম্পূর্ণ করুন" description="ড্যাশবোর্ড ব্যবহার করতে কমপক্ষে ৪টি তথ্য প্রদান করুন।">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pc-name" className="text-sm font-semibold">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  পূর্ণ নাম <span className="text-warmred-500">*</span>
                </span>
              </Label>
              <Input
                id="pc-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="আপনার পূর্ণ নাম"
              />
              {errors.fullName && <p className="text-xs text-warmred-500">{errors.fullName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-phone" className="text-sm font-semibold">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  মোবাইল নম্বর <span className="text-warmred-500">*</span>
                </span>
              </Label>
              <Input
                id="pc-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(BANGLA_DIGITS, ''))}
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                maxLength={11}
              />
              {errors.phone && <p className="text-xs text-warmred-500">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-session" className="text-sm font-semibold">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    শিক্ষাবর্ষ <span className="text-warmred-500">*</span>
                  </span>
                </Label>
                <Input
                  id="pc-session"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  placeholder="2020-21"
                />
                {errors.academicSession && <p className="text-xs text-warmred-500">{errors.academicSession}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pc-dept" className="text-sm font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    বিভাগ <span className="text-warmred-500">*</span>
                  </span>
                </Label>
                <Input
                  id="pc-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="যেমন: দর্শন"
                />
                {errors.department && <p className="text-xs text-warmred-500">{errors.department}</p>}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                ঐচ্ছিক: হলের নাম এবং রেজিস্ট্রেশন আইডি দিলে আরও ভালো হবে।
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              <ArrowRight className="h-4 w-4" />
              {saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}
            </Button>
          </form>
      </Dialog>
    </>
  );
}
