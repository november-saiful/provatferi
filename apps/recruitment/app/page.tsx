'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  BookOpen,
  School,
  MapPin,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  COURSES,
  getFullAmount,
  isDuStudentFlag,
  validateRegistration,
  type FormMode,
} from '../lib/registration';
import { ModePicker } from '../components/mode-picker';
import { DuFields } from '../components/du-fields';
import { PaymentSection } from '../components/payment-section';

export default function Home() {
  const [showPopup, setShowPopup] = useState(true);

  // Warm up the serverless function in background while user fills the form
  useEffect(() => {
    fetch('/api/recruitment/health').catch(() => {});
  }, []);
  const [formMode, setFormMode] = useState<FormMode | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    service: '', // Course name
    isDuStudent: 'no', // 'yes' | 'no'
    academicSession: '',
    department: '',
    hallName: '',
    duRegistrationId: '',
    paymentMethod: '', // 'bkash' | 'nagad'
    transactionId: '',
  });

  const [fullAmount, setFullAmount] = useState(3100);
  const [amount, setAmount] = useState(3100);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('invoice.pdf');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isDu = isDuStudentFlag(formData.isDuStudent);

  useEffect(() => {
    if (!formMode) return;
    const base = getFullAmount(formMode, formData.isDuStudent === 'yes');
    setFullAmount(base);
    setAmount(base);
  }, [formMode, formData.isDuStudent]);

  useEffect(() => {
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
    return () => { if (interval) clearInterval(interval); };
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
          formMode,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }

      setProgress(60);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = `invoice-${formMode === 'member' ? 'M' : ''}${Date.now()}.pdf`;

      setProgress(80);
      setDownloadUrl(blobUrl);
      setDownloadName(filename);

      try { window.open(blobUrl, '_blank'); } catch {}

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
        transactionId: '',
      });

      setTimeout(() => setLoading(false), 800);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'নেটওয়ার্ক বা সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-bengali">

      {/* Banner/Header */}
      <div className="px-5 md:px-8 py-6 md:py-10 relative">
        <div className="max-w-2xl mx-auto text-center">
          <img src="/recruitment-logo.png" alt="Logo" className="h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-2 text-brand-primary">সাংস্কৃতিক সংসদ, ঢাকা বিশ্ববিদ্যালয়</h1>
          <p className="text-brand-primary/70 text-sm">
            {formMode === 'member'
              ? 'ক্লাব সদস্যপদ ফরম। প্রয়োজনীয় তথ্য দিয়ে আপনার রেজিস্ট্রেশন সম্পন্ন করুন।'
              : formMode === 'course'
              ? 'সঙ্গীত ও বাদ্যযন্ত্র কোর্স ভর্তি ফরম। প্রয়োজনীয় তথ্য দিয়ে আপনার রেজিস্ট্রেশন সম্পন্ন করুন।'
              : 'সঙ্গীত ও বাদ্যযন্ত্র কোর্স ভর্তি ও ক্লাব সদস্যপদ ফরম।'}
          </p>
        </div>
      </div>

      {/* Mode Selection Popup */}
      {showPopup && (
        <ModePicker
          onSelect={(mode) => {
            setFormMode(mode);
            setShowPopup(false);
          }}
        />
      )}

      <div className="max-w-2xl mx-auto px-5 md:px-8 py-6 md:py-10">
          {!formMode && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">উপরে আপনার উদ্দেশ্য নির্বাচন করুন</p>
            </div>
          )}

          {formMode && success && (
            <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-fade-in">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-base text-emerald-900">রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!</h4>
                  <p className="text-sm text-emerald-800/90 mt-1">
                    আপনার রসিদ নিচে দেখা যাচ্ছে। ডাউনলোড করতে নিচের বাটনে ক্লিক করুন।
                  </p>
                </div>
              </div>
              {downloadUrl && (
                <>
                  <embed src={downloadUrl} type="application/pdf" className="w-full h-64 mt-4 rounded-xl border border-emerald-200" />
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    className="flex items-center justify-center gap-2 mt-4 w-full text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-300"
                  >
                    <Download className="w-5 h-5" />
                    রসিদ ডাউনলোড করুন
                  </a>
                </>
              )}
            </div>
          )}

          {formMode && error && (
            <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <h4 className="font-bold text-base text-rose-900">আবেদন ব্যর্থ হয়েছে</h4>
                <p className="text-sm text-rose-800/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          {formMode && (
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">

            {/* Name & Phone Field Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" />
                  আবেদনকারীর নাম <span className="text-rose-500">*</span>
                  <span className="text-xs text-slate-500 font-normal">(ইংরেজিতে লিখুন)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="যেমন: Saiful Islam Ibu"
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border ${validationErrors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-primary-light'
                    } focus:outline-none focus:ring-4 focus:border-brand-primary transition-all duration-200 text-slate-900`}
                />
                {validationErrors.name && (
                  <p className="text-xs text-rose-500 font-medium">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-primary" />
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                  <span className="text-xs text-slate-500 font-normal">(ইংরেজিতে লিখুন)</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="যেমন: 017XXXXXXXX"
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border ${validationErrors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-primary-light'
                    } focus:outline-none focus:ring-4 focus:border-brand-primary transition-all duration-200 text-slate-900`}
                />
                {validationErrors.phone && (
                  <p className="text-xs text-rose-500 font-medium">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Address Field - course mode only */}
            {formMode === 'course' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary" />
                ঠিকানা <span className="text-rose-500">*</span>
                <span className="text-xs text-slate-500 font-normal">(ইংরেজিতে লিখুন)</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="যেমন: Shegunbagicha, Dhaka"
                className={`w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border ${validationErrors.address ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-primary-light'
                  } focus:outline-none focus:ring-4 focus:border-brand-primary transition-all duration-200 text-slate-900`}
              />
              {validationErrors.address && (
                <p className="text-xs text-rose-500 font-medium">{validationErrors.address}</p>
              )}
            </div>
            )}

            {/* Course Dropdown - only for course mode */}
            {formMode === 'course' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-primary" />
                কোর্স নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border ${validationErrors.service ? 'border-rose-400' : 'border-slate-200'
                  } focus:outline-none focus:ring-4 focus:ring-brand-primary-light focus:border-brand-primary transition-all duration-200 text-slate-900`}
              >
                <option value="">কোর্স সিলেক্ট করুন</option>
                {COURSES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {validationErrors.service && (
                <p className="text-xs text-rose-500 font-medium">{validationErrors.service}</p>
              )}
            </div>
            )}

            {/* Dhaka University Student Cascade Question - only for course mode */}
            {formMode === 'course' && (
            <div className="space-y-3 bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200/60">
              <label className="text-sm font-bold text-slate-800 block">
                আপনি কি ঢাকা বিশ্ববিদ্যালয়ের (ঢাবি) শিক্ষার্থী? (বর্তমান/প্রাক্তন)
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="isDuStudent"
                    value="yes"
                    checked={formData.isDuStudent === 'yes'}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                  />
                  হ্যাঁ (Yes)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="isDuStudent"
                    value="no"
                    checked={formData.isDuStudent === 'no'}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                  />
                  না (No)
                </label>
              </div>

              {/* DU Student Details Cascade Fields */}
              {isDu && (
                <div className="mt-4 pt-4 border-t border-slate-200">
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

            {/* DU Student Details - always shown for member mode */}
            {formMode === 'member' && (
            <div className="space-y-3 bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200/60">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <School className="w-4 h-4 text-brand-primary" />
                ঢাকা বিশ্ববিদ্যালয়ের শিক্ষার্থীর তথ্য
              </label>
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

            {/* Submit Button / Progress Bar */}
            {loading ? (
              <div className="mt-4 space-y-3 animate-fade-in">
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-amber-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    {progress < 100 && (
                      <div className="absolute inset-0 bg-white/25 animate-pulse" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-brand-primary">
                  <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>
                    {progress === 100
                      ? 'সম্পন্ন!'
                      : progress < 30
                        ? 'তথ্য জমা দেওয়া হচ্ছে...'
                        : progress < 80
                          ? 'ইনভয়েস তৈরি করা হচ্ছে...'
                          : 'ডাউনলোড প্রস্তুত হচ্ছে...'}
                  </span>
                </div>
              </div>
            ) : success ? (
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 rounded-2xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-lg shadow-emerald-600/20 transition-all duration-200"
              >
                <CheckCircle2 className="w-5 h-5" />
                আরেকটি রেজিস্ট্রেশন করুন
              </button>
            ) : (
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 rounded-2xl text-base font-bold text-white bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] shadow-lg shadow-brand-primary/10 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                {formMode === 'member' ? 'সদস্যপদ নিন এবং রসিদ নিন' : 'রেজিস্ট্রেশন করুন এবং রসিদ নিন'}
              </button>
            )}
          </form>
          )}
        </div>
    </main>
  );
}
