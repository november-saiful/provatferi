'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  BookOpen,
  School,
  MapPin,
  Download,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  ArrowLeft
} from 'lucide-react';
import { PublicShell } from '@/components/layout/dashboard-shell';
import { Seo } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Countdown } from '@/components/recruitment/countdown';
import { ModePicker } from '@/components/recruitment/mode-picker';
import { DuFields } from '@/components/recruitment/du-fields';
import { PaymentSection } from '@/components/recruitment/payment-section';
import { useRecruitmentSettings } from '@/lib/queries';
import {
  COURSES,
  DEFAULT_RECRUITMENT_SETTINGS,
  getFullAmount,
  isDuStudentFlag,
  phaseTarget,
  resolveRecruitmentPhase,
  validateRegistration,
  type FormMode,
  type RecruitmentPhase,
  type RecruitmentSettings
} from '@/lib/recruitment';

/** Re-evaluate the phase while the page stays open (no reload needed). */
function usePhaseClock(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });
}

const labelClass = 'flex items-center gap-2 text-sm font-semibold text-foreground';

export default function RecruitmentPage() {
  const { data, isLoading } = useRecruitmentSettings();
  const settings = data ?? DEFAULT_RECRUITMENT_SETTINGS;
  const now = usePhaseClock();
  const phase = resolveRecruitmentPhase(settings, new Date(now));

  return (
    <PublicShell>
      <Seo title="রিক্রুটমেন্ট" />
      <div className="mx-auto max-w-3xl">
        {isLoading && !data ? (
          <div className="flex min-h-[50vh] items-center justify-center" role="status">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span className="text-sm">লোড হচ্ছে…</span>
            </div>
          </div>
        ) : phase === 'open' ? (
          <RecruitmentForm settings={settings} />
        ) : (
          <RecruitmentClosed phase={phase} settings={settings} isLoading={isLoading} />
        )}
      </div>
    </PublicShell>
  );
}

/* ─────────────────────────── Closed / not started ─────────────────────────── */

function RecruitmentClosed({
  phase,
  settings,
  isLoading
}: {
  phase: Exclude<RecruitmentPhase, 'open'>;
  settings: RecruitmentSettings;
  isLoading: boolean;
}) {
  // Count down to the opening bell whenever one is scheduled in the future —
  // including a manually paused phase that already has a restart date.
  const target =
    phase === 'scheduled' ||
    (phase === 'disabled' && !!settings.startsAt && Date.parse(settings.startsAt) > Date.now())
      ? settings.startsAt
      : null;
  const startLabel = formatDeadline(settings.startsAt);

  const copy: Record<Exclude<RecruitmentPhase, 'open'>, { title: string; body: string }> = {
    disabled: {
      title: 'রিক্রুটমেন্ট বর্তমানে বন্ধ',
      body: 'কমিটি রিক্রুটমেন্ট সাময়িকভাবে বন্ধ রেখেছে। পরবর্তী ঘোষণার জন্য চোখ রাখুন।'
    },
    scheduled: {
      title: 'রিক্রুটমেন্ট এখনো শুরু হয়নি',
      body: startLabel
        ? `রেজিস্ট্রেশন শুরু হবে ${startLabel}-এ।`
        : 'খুব শীঘ্রই রেজিস্ট্রেশন শুরু হবে।'
    },
    ended: {
      title: 'এই পর্বের রিক্রুটমেন্ট শেষ হয়েছে',
      body: 'আপনার আগ্রহের জন্য ধন্যবাদ। পরবর্তী রিক্রুটমেন্টের ঘোষণা নোটিশ বোর্ডে প্রকাশ করা হবে।'
    }
  };

  const { title, body } = copy[phase];

  return (
    <div className="mx-auto max-w-xl py-10 text-center sm:py-16">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-card text-primary shadow-sm">
        <CalendarClock className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {body}
      </p>

      {target && (
        <Countdown
          target={target}
          label="শুরু হতে বাকি"
          className="mx-auto mt-6 max-w-sm text-left"
        />
      )}

      {isLoading && (
        <p className="mt-4 text-xs text-muted-foreground">সেটিংস লোড হচ্ছে…</p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-input bg-card px-5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/10"
        >
          <ArrowLeft className="h-4 w-4" />
          মূল সাইটে ফিরে যান
        </Link>
        <Link
          href="/notices"
          className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
        >
          নোটিশ দেখুন
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Registration ─────────────────────────────── */

function RecruitmentForm({ settings }: { settings: RecruitmentSettings }) {
  const [showPopup, setShowPopup] = React.useState(true);
  const [formMode, setFormMode] = React.useState<FormMode | null>(null);

  // Warm up the serverless function in background while user fills the form
  React.useEffect(() => {
    fetch('/api/recruitment/health').catch(() => {});
  }, []);

  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    phone: '',
    service: '',
    isDuStudent: 'no',
    academicSession: '',
    department: '',
    hallName: '',
    duRegistrationId: '',
    paymentMethod: '',
    transactionId: ''
  });

  const [fullAmount, setFullAmount] = React.useState(3100);
  const [amount, setAmount] = React.useState(3100);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [downloadName, setDownloadName] = React.useState('invoice.pdf');
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const isDu = isDuStudentFlag(formData.isDuStudent);

  React.useEffect(() => {
    if (!formMode) return;
    const base = getFullAmount(formMode, formData.isDuStudent === 'yes');
    setFullAmount(base);
    setAmount(base);
  }, [formMode, formData.isDuStudent]);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (loading) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          const speed = p < 30 ? 3 : p < 60 ? 2 : 1;
          return Math.min(p + speed, 90);
        });
      }, 300);
    } else {
      setProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = validateRegistration({ ...formData, formMode });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setProgress(0);

    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/recruitment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount,
          isDuStudent: formData.isDuStudent === 'yes',
          paymentType: 'full',
          fullAmount,
          formMode
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }

      setProgress(60);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = `invoice-${formMode === 'member' ? 'M' : ''}${Date.now()}.pdf`;

      setProgress(80);
      setDownloadUrl(blobUrl);
      setDownloadName(filename);

      try {
        window.open(blobUrl, '_blank');
      } catch {}

      setProgress(100);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setFormData({
        name: '',
        address: '',
        phone: '',
        service: '',
        isDuStudent: 'no',
        academicSession: '',
        department: '',
        hallName: '',
        duRegistrationId: '',
        paymentMethod: '',
        transactionId: ''
      });

      setTimeout(() => setLoading(false), 800);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'নেটওয়ার্ক বা সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      );
      setLoading(false);
    }
  };

  const countdownTarget = phaseTarget(settings, 'open');
  const countdownLabel = settings.endsAt ? 'রেজিস্ট্রেশন শেষ হতে বাকি' : undefined;

  return (
    <>
      {showPopup && (
        <ModePicker
          countdownTarget={countdownTarget}
          countdownLabel={countdownLabel}
          onSelect={(mode) => {
            setFormMode(mode);
            setShowPopup(false);
          }}
        />
      )}

      {/* Hero — same coffee/gold language as the main site */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border-2 border-border bg-gradient-to-br from-coffee-900 via-coffee-800 to-taupe-800 px-5 py-8 text-center text-white sm:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-[80px]"
          aria-hidden
        />
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="প্রভাতফেরী"
            className="mx-auto mb-4 h-20 w-auto object-contain drop-shadow-lg"
          />
          <h1 className="text-xl font-bold tracking-tight text-balance sm:text-2xl md:text-3xl">
            প্রভাতফেরী সাংস্কৃতিক সংসদ, ঢাকা বিশ্ববিদ্যালয়
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/75">
            {formMode === 'member'
              ? 'ক্লাব সদস্যপদ ফরম। প্রয়োজনীয় তথ্য দিয়ে আপনার রেজিস্ট্রেশন সম্পন্ন করুন।'
              : formMode === 'course'
                ? 'সঙ্গীত ও বাদ্যযন্ত্র কোর্স ভর্তি ফরম। প্রয়োজনীয় তথ্য দিয়ে আপনার রেজিস্ট্রেশন সম্পন্ন করুন।'
                : 'সঙ্গীত ও বাদ্যযন্ত্র কোর্স ভর্তি ও ক্লাব সদস্যপদ ফরম।'}
          </p>

          {countdownTarget && (
            <Countdown
              target={countdownTarget}
              label={countdownLabel}
              tone="dark"
              className="mx-auto mt-5 max-w-sm"
            />
          )}
        </div>
      </section>

      {formMode && success && (
        <div className="mb-8 animate-fade-in rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="text-base font-bold">রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!</h4>
              <p className="mt-1 text-sm opacity-90">
                আপনার রসিদ নিচে দেখা যাচ্ছে। ডাউনলোড করতে নিচের বাটনে ক্লিক করুন।
              </p>
            </div>
          </div>
          {downloadUrl && (
            <>
              <embed
                src={downloadUrl}
                type="application/pdf"
                className="mt-4 h-64 w-full rounded-xl border border-emerald-300 dark:border-emerald-800"
              />
              <a
                href={downloadUrl}
                download={downloadName}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                <Download className="h-5 w-5" />
                রসিদ ডাউনলোড করুন
              </a>
            </>
          )}
        </div>
      )}

      {formMode && error && (
        <div className="mb-8 flex items-start gap-4 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <h4 className="text-base font-bold">আবেদন ব্যর্থ হয়েছে</h4>
            <p className="mt-1 text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {formMode && (
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="recruitment-name">
                <User className="h-4 w-4 text-primary" />
                আবেদনকারীর নাম <span className="text-rose-500">*</span>
                <span className="text-xs font-normal text-muted-foreground">(ইংরেজিতে লিখুন)</span>
              </label>
              <Input
                id="recruitment-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="name"
                placeholder="যেমন: Saiful Islam Ibu"
                aria-invalid={!!validationErrors.name}
                className={validationErrors.name ? 'border-rose-400 focus-visible:border-rose-400' : undefined}
              />
              {validationErrors.name && (
                <p className="text-xs font-medium text-rose-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className={labelClass} htmlFor="recruitment-phone">
                <Phone className="h-4 w-4 text-primary" />
                মোবাইল নম্বর <span className="text-rose-500">*</span>
                <span className="text-xs font-normal text-muted-foreground">(ইংরেজিতে লিখুন)</span>
              </label>
              <Input
                id="recruitment-phone"
                type="tel"
                inputMode="numeric"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="tel"
                placeholder="যেমন: 017XXXXXXXX"
                aria-invalid={!!validationErrors.phone}
                className={validationErrors.phone ? 'border-rose-400 focus-visible:border-rose-400' : undefined}
              />
              {validationErrors.phone && (
                <p className="text-xs font-medium text-rose-500">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Address — course only */}
          {formMode === 'course' && (
            <div className="space-y-2">
              <label className={labelClass} htmlFor="recruitment-address">
                <MapPin className="h-4 w-4 text-primary" />
                ঠিকানা <span className="text-rose-500">*</span>
                <span className="text-xs font-normal text-muted-foreground">(ইংরেজিতে লিখুন)</span>
              </label>
              <Input
                id="recruitment-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="যেমন: Shegunbagicha, Dhaka"
                aria-invalid={!!validationErrors.address}
                className={validationErrors.address ? 'border-rose-400 focus-visible:border-rose-400' : undefined}
              />
              {validationErrors.address && (
                <p className="text-xs font-medium text-rose-500">{validationErrors.address}</p>
              )}
            </div>
          )}

          {/* Course — course only */}
          {formMode === 'course' && (
            <div className="space-y-2">
              <label className={labelClass} htmlFor="recruitment-course">
                <BookOpen className="h-4 w-4 text-primary" />
                কোর্স নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <select
                id="recruitment-course"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!validationErrors.service}
                className={`flex h-10 w-full rounded-xl border-2 bg-card px-3 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 disabled:opacity-40 sm:h-11 sm:px-4 ${
                  validationErrors.service ? 'border-rose-400' : 'border-input'
                }`}
              >
                <option value="">কোর্স সিলেক্ট করুন</option>
                {COURSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {validationErrors.service && (
                <p className="text-xs font-medium text-rose-500">{validationErrors.service}</p>
              )}
            </div>
          )}

          {/* DU student question — course */}
          {formMode === 'course' && (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4 md:p-5">
              <span className="block text-sm font-bold text-foreground">
                আপনি কি ঢাকা বিশ্ববিদ্যালয়ের (ঢাবি) শিক্ষার্থী? (বর্তমান/প্রাক্তন)
              </span>
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/80">
                  <input
                    type="radio"
                    name="isDuStudent"
                    value="yes"
                    checked={formData.isDuStudent === 'yes'}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-4 w-4 accent-primary"
                  />
                  হ্যাঁ (Yes)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/80">
                  <input
                    type="radio"
                    name="isDuStudent"
                    value="no"
                    checked={formData.isDuStudent === 'no'}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-4 w-4 accent-primary"
                  />
                  না (No)
                </label>
              </div>

              {isDu && (
                <div className="mt-4 border-t border-border pt-4">
                  <DuFields
                    values={formData}
                    errors={validationErrors}
                    disabled={loading}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* DU details — always for member */}
          {formMode === 'member' && (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4 md:p-5">
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <School className="h-4 w-4 text-primary" />
                ঢাকা বিশ্ববিদ্যালয়ের শিক্ষার্থীর তথ্য
              </span>
              <DuFields
                values={formData}
                errors={validationErrors}
                disabled={loading}
                onChange={handleInputChange}
              />
            </div>
          )}

          <PaymentSection
            formMode={formMode}
            isDuStudent={isDu}
            amount={amount}
            paymentMethod={formData.paymentMethod}
            transactionId={formData.transactionId}
            errors={validationErrors}
            disabled={loading}
            onChange={handleInputChange}
          />

          {/* Submit / progress */}
          {loading ? (
            <div className="mt-4 animate-fade-in space-y-3">
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                <div
                  className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  {progress < 100 && <div className="absolute inset-0 animate-pulse bg-white/25" />}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>
                  {progress === 100
                    ? 'সম্পন্ন!'
                    : progress < 30
                      ? 'তথ্য জমা দেওয়া হচ্ছে...'
                      : progress < 80
                        ? 'ইনভয়েস তৈরি করা হচ্ছে...'
                        : 'ডাউনলোড প্রস্তুত হচ্ছে...'}
                </span>
              </div>
            </div>
          ) : success ? (
            <Button
              size="lg"
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 />
              আরেকটি রেজিস্ট্রেশন করুন
            </Button>
          ) : (
            <Button size="lg" type="submit" className="mt-4 w-full">
              <Download />
              {formMode === 'member' ? 'সদস্যপদ নিন এবং রসিদ নিন' : 'রেজিস্ট্রেশন করুন এবং রসিদ নিন'}
            </Button>
          )}
        </form>
      )}
    </>
  );
}
