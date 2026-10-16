'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import {
  PAYMENT_NUMBERS,
  MEMBER_FEE,
  toBanglaNum,
  type FormMode,
} from '../lib/registration';

interface PaymentSectionProps {
  formMode: FormMode;
  isDuStudent: boolean;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PaymentSection({
  formMode,
  isDuStudent,
  amount,
  paymentMethod,
  transactionId,
  errors,
  disabled,
  onChange,
}: PaymentSectionProps) {
  return (
    <div className="space-y-4 bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200/60">
      <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-brand-primary" />
        পেমেন্ট পদ্ধতি নির্বাচন করুন <span className="text-rose-500">*</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'bkash'
          ? 'border-pink-500 bg-pink-50/50 text-pink-700 font-bold'
          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
          }`}>
          <input
            type="radio"
            name="paymentMethod"
            value="bkash"
            checked={paymentMethod === 'bkash'}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
          />
          <span>বিকাশ (bKash)</span>
        </label>

        <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'nagad'
          ? 'border-orange-500 bg-orange-50/50 text-orange-700 font-bold'
          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
          }`}>
          <input
            type="radio"
            name="paymentMethod"
            value="nagad"
            checked={paymentMethod === 'nagad'}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
          />
          <span>নগদ (Nagad)</span>
        </label>
      </div>

      {/* Price overview summary */}
      {formMode === 'member' ? (
        <div className="bg-brand-primary-light p-5 rounded-2xl border border-brand-primary-light space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-primary-dark">সদস্যপদ ফি (Membership Fee)</span>
            <span className="font-bold text-brand-primary">{toBanglaNum(MEMBER_FEE)}/-</span>
          </div>
          <hr className="border-slate-300" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-brand-primary-dark">মোট প্রদেয় ফি:</span>
            <span className="text-2xl font-black text-brand-primary">{toBanglaNum(amount)}/-</span>
          </div>
        </div>
      ) : (
        <div className="bg-brand-primary-light p-5 rounded-2xl border border-brand-primary-light space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-primary-dark">কোর্স ফি</span>
            {isDuStudent ? (
              <span className="text-slate-500"><del>৩,০০০/-</del> <span className="font-bold text-brand-primary">২,৫০০/-</span></span>
            ) : (
              <span className="font-bold text-brand-primary">৩,০০০/-</span>
            )}
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-primary-dark">প্ল্যাটফর্ম ও ফর্ম ফি</span>
            {isDuStudent ? (
              <span className="text-slate-500"><del>১০০/-</del> <span className="font-bold text-brand-primary">৫০/-</span></span>
            ) : (
              <span className="font-bold text-brand-primary">১০০/-</span>
            )}
          </div>
          <hr className="border-slate-300" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-brand-primary-dark">মোট প্রদেয় ফি:</span>
            <span className="text-2xl font-black text-brand-primary">{toBanglaNum(amount)}/-</span>
          </div>
        </div>
      )}

      {/* Transaction ID input field */}
      {paymentMethod && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <p className="text-sm text-center text-slate-600">নিম্নোক্ত নাম্বারে টাকা পাঠিয়ে (সেন্ড-মানি) ট্রানজাকশন নাম্বারটি কপি করে এখানে পেস্ট করুন।</p>
          <div className="flex justify-center bg-white p-5 rounded-2xl border border-slate-200">
            <span className="text-2xl font-black text-brand-primary">
              {paymentMethod === 'nagad' ? PAYMENT_NUMBERS.nagad : PAYMENT_NUMBERS.bkash}
            </span>
          </div>
          <label className="text-xs font-bold text-slate-600 block mt-2">
            Transaction ID (TrxID) লিখুন <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="transactionId"
            value={transactionId}
            onChange={onChange}
            disabled={disabled}
            placeholder="যেমন: 8N79JFLK2"
            className={`w-full px-4 py-2.5 rounded-lg text-sm bg-white border ${errors.transactionId ? 'border-rose-400' : 'border-slate-200'
              } focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-slate-900`}
          />
          {errors.transactionId && (
            <p className="text-xs text-rose-500">{errors.transactionId}</p>
          )}
        </div>
      )}
    </div>
  );
}
