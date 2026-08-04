'use client';

import * as React from 'react';
import { Wallet, Smartphone, Copy, Check, type LucideIcon } from 'lucide-react';
import { PAYMENT_METHODS, type PaymentMethodId } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PaymentSectionProps {
  method: PaymentMethodId | '';
  onMethodChange: (method: PaymentMethodId) => void;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  transactionIdError?: string;
  methodError?: string;
  title?: string;
}

const METHOD_ICON: Record<PaymentMethodId, LucideIcon> = {
  bkash: Smartphone,
  nagad: Smartphone
};

/**
 * bKash / Nagad send-money block used by the donation and sponsor forms.
 * Selecting a method reveals the matching wallet number to send money to and
 * unlocks the transaction-ID box so the treasurer can reconcile the payment.
 */
export function PaymentSection({
  method,
  onMethodChange,
  transactionId,
  onTransactionIdChange,
  transactionIdError,
  methodError,
  title = 'পেমেন্ট (Send Money)'
}: PaymentSectionProps) {
  const [copied, setCopied] = React.useState(false);

  const copyNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the number is still visible to copy manually.
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-coffee-200/70 bg-coffee-50/40 p-4 sm:p-5 dark:border-coffee-800/60 dark:bg-coffee-950/30">
      <div className="flex items-center gap-2 text-coffee-800 dark:text-coffee-200">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coffee-600/10 text-coffee-700 dark:bg-coffee-800/50 dark:text-coffee-300">
          <Wallet className="h-4 w-4" />
        </span>
        <h3 className="font-bold tracking-tight">{title}</h3>
      </div>

      {/* Method selector */}
      <div role="radiogroup" aria-label="পেমেন্ট মাধ্যম" className="grid grid-cols-2 gap-3">
        {(Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).map((id) => {
          const Icon = METHOD_ICON[id];
          const active = method === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={PAYMENT_METHODS[id].label}
              onClick={() => onMethodChange(id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all duration-200',
                active
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border bg-card hover:border-primary/30'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-coffee-100 text-coffee-700 dark:bg-coffee-900/50 dark:text-coffee-300'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold">{PAYMENT_METHODS[id].label}</span>
            </button>
          );
        })}
      </div>
      {methodError && <p className="text-xs text-warmred-500">{methodError}</p>}

      {/* Wallet number shown once a method is chosen */}
      {method && (
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            {PAYMENT_METHODS[method].label} — Send Money করুন এই নম্বরে
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-mono text-lg font-bold tracking-wider text-primary">
              {PAYMENT_METHODS[method].number}
            </span>
            <button
              type="button"
              onClick={() => copyNumber(PAYMENT_METHODS[method].number)}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3 text-sage-600" /> : <Copy className="h-3 w-3" />}
              {copied ? 'কপি হয়েছে' : 'কপি'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction ID */}
      <div className="space-y-1.5">
        <Label htmlFor="transaction-id">
          <span className="flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-coffee-700" />
            ট্রানজেকশন আইডি (Transaction ID)
          </span>
        </Label>
        <Input
          id="transaction-id"
          value={transactionId}
          onChange={(e) => onTransactionIdChange(e.target.value)}
          placeholder={method ? 'যেমন: 9HJ4K2L3M5N' : 'আগে পেমেন্ট মাধ্যম বেছে নিন'}
          disabled={!method}
          className="border-input bg-white/70 disabled:opacity-50"
        />
        {transactionIdError && <p className="text-xs text-warmred-500">{transactionIdError}</p>}
      </div>
    </div>
  );
}
