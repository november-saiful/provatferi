'use client';

import * as React from 'react';
import { CreditCard } from 'lucide-react';
import {
  PAYMENT_NUMBERS,
  MEMBER_FEE,
  toBanglaNum,
  type FormMode
} from '@/lib/recruitment';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  onChange
}: PaymentSectionProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4 md:p-5">
      <label className="flex items-center gap-2 text-sm font-bold text-foreground">
        <CreditCard className="h-4 w-4 text-primary" />
        পেমেন্ট পদ্ধতি নির্বাচন করুন <span className="text-rose-500">*</span>
      </label>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-all duration-200',
            paymentMethod === 'bkash'
              ? 'border-pink-500 bg-pink-50 font-bold text-pink-700 dark:bg-pink-950/25 dark:text-pink-300'
              : 'border-border bg-card text-muted-foreground hover:bg-muted'
          )}
        >
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

        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-sm transition-all duration-200',
            paymentMethod === 'nagad'
              ? 'border-orange-500 bg-orange-50 font-bold text-orange-700 dark:bg-orange-950/25 dark:text-orange-300'
              : 'border-border bg-card text-muted-foreground hover:bg-muted'
          )}
        >
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
      <div className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
        {formMode === 'member' ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">সদস্যপদ ফি (Membership Fee)</span>
            <span className="font-bold text-primary">{toBanglaNum(MEMBER_FEE)}/-</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">কোর্স ফি</span>
              {isDuStudent ? (
                <span className="text-muted-foreground">
                  <del>৩,০০০/-</del> <span className="font-bold text-primary">২,৫০০/-</span>
                </span>
              ) : (
                <span className="font-bold text-primary">৩,০০০/-</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">প্ল্যাটফর্ম ও ফর্ম ফি</span>
              {isDuStudent ? (
                <span className="text-muted-foreground">
                  <del>১০০/-</del> <span className="font-bold text-primary">৫০/-</span>
                </span>
              ) : (
                <span className="font-bold text-primary">১০০/-</span>
              )}
            </div>
          </>
        )}
        <hr className="border-border" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground/80">মোট প্রদেয় ফি:</span>
          <span className="text-2xl font-black text-primary">{toBanglaNum(amount)}/-</span>
        </div>
      </div>

      {/* Transaction ID input field */}
      {paymentMethod && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p className="text-center text-sm text-muted-foreground">
            নিম্নোক্ত নাম্বারে টাকা পাঠিয়ে (সেন্ড-মানি) ট্রানজাকশন নাম্বারটি কপি করে এখানে পেস্ট করুন।
          </p>
          <div className="flex justify-center rounded-2xl border border-border bg-card p-5">
            <span className="text-2xl font-black tracking-wide text-primary">
              {paymentMethod === 'nagad' ? PAYMENT_NUMBERS.nagad : PAYMENT_NUMBERS.bkash}
            </span>
          </div>
          <label className="mt-2 block text-xs font-bold text-foreground/80">
            Transaction ID (TrxID) লিখুন <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            name="transactionId"
            value={transactionId}
            onChange={onChange}
            disabled={disabled}
            placeholder="যেমন: 8N79JFLK2"
            aria-invalid={!!errors.transactionId}
            className={errors.transactionId ? 'border-rose-400 focus-visible:border-rose-400' : undefined}
          />
          {errors.transactionId && (
            <p className="text-xs text-rose-500">{errors.transactionId}</p>
          )}
        </div>
      )}
    </div>
  );
}
