'use client';

import { Globe } from 'lucide-react';
import type { FormMode } from '../lib/registration';

const FACEBOOK_PAGE_URL = 'https://www.facebook.com/provatferi.org/';

export function ModePicker({ onSelect }: { onSelect: (mode: FormMode) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
        <img src="/recruitment-logo.png" alt="Logo" className="h-16 mx-auto mb-5 object-contain" />
        <h2 className="text-2xl font-bold text-brand-primary mb-3">আপনি কী করতে চান?</h2>
        <p className="text-slate-600 text-sm mb-8">আপনার উদ্দেশ্য নির্বাচন করুন</p>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onSelect('course')}
            className="w-full px-6 py-4 rounded-2xl text-base font-bold text-white bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] shadow-lg shadow-brand-primary/20 transition-all duration-200"
          >
            কোর্সে ভর্তি হতে চাই
          </button>
          <button
            type="button"
            onClick={() => onSelect('member')}
            className="w-full px-6 py-4 rounded-2xl text-base font-bold text-brand-primary bg-brand-primary-light hover:bg-brand-secondary-light border-2 border-brand-primary active:scale-[0.99] transition-all duration-200"
          >
            ক্লাবের সদস্য হতে চাই
          </button>
        </div>

        {/* External links - Facebook page & main website */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-3">অথবা আমাদের সাথে যুক্ত হোন</p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-brand-primary bg-brand-primary-light hover:bg-brand-secondary-light border border-brand-primary/40 active:scale-[0.99] transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
              </svg>
              ফেসবুক পেজ
            </a>
            <a
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-brand-primary bg-brand-primary-light hover:bg-brand-secondary-light border border-brand-primary/40 active:scale-[0.99] transition-all duration-200"
            >
              <Globe className="w-4 h-4" />
              মূল ওয়েবসাইট
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
