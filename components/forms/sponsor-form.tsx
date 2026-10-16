'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PaymentSection } from '@/components/forms/payment-section';
import type { PaymentMethodId } from '@/lib/constants';

const BANGLA_DIGITS = /[০-৯]/g;

const schema = z.object({
  company_name: z.string().min(2, 'প্রতিষ্ঠানের নাম প্রয়োজন'),
  representative_name: z.string().optional(),
  // Email is now optional; phone is the required point of contact.
  contact_email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  contact_phone: z
    .string()
    .min(11, 'মোবাইল নম্বরটি 01 দিয়ে শুরু হওয়া ১১ সংখ্যার হতে হবে')
    .regex(/^01[0-9]{9}$/, 'মোবাইল নম্বরটি 01 দিয়ে শুরু হওয়া ১১ সংখ্যার হতে হবে'),
  payment_method: z.enum(['bkash', 'nagad'], { required_error: 'পেমেন্ট মাধ্যম বেছে নিন' }),
  transaction_id: z.string().min(6, 'সঠিক ট্রানজেকশন আইডি দিন'),
  brand_details: z.string().optional(),
  proposed_event: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function SponsorForm() {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodId | ''>('');
  const [transactionId, setTransactionId] = React.useState('');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contact_email: '', contact_phone: '', payment_method: undefined, transaction_id: '' }
  });

  const handleMethodChange = (m: PaymentMethodId) => {
    setPaymentMethod(m);
    setValue('payment_method', m, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase.from('sponsors').insert({
        company_name: values.company_name,
        representative_name: values.representative_name || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone,
        payment_method: values.payment_method,
        transaction_id: values.transaction_id,
        brand_details: values.brand_details || null,
        proposed_event: values.proposed_event || null,
        status: 'pending'
      });
      if (error) throw error;
      toast.success('আবেদন জমা হয়েছে। কমিটি যোগাযোগ করবে।');
      setPaymentMethod('');
      setTransactionId('');
      reset({ contact_email: '', contact_phone: '', payment_method: undefined, transaction_id: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'আবেদন জমা ব্যর্থ হয়েছে');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-company">প্রতিষ্ঠানের নাম</Label>
          <Input id="s-company" {...register('company_name')} placeholder="আপনার প্রতিষ্ঠান" />
          {errors.company_name && <p className="text-xs text-warmred-500">{errors.company_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-rep">প্রতিনিধির নাম</Label>
          <Input id="s-rep" {...register('representative_name')} placeholder="যোগাযোগের ব্যক্তি" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-email">যোগাযোগের ইমেইল <span className="text-muted-foreground">(ঐচ্ছিক)</span></Label>
          <Input id="s-email" type="email" {...register('contact_email')} placeholder="you@company.com" />
          {errors.contact_email && <p className="text-xs text-warmred-500">{errors.contact_email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-phone">মোবাইল নম্বর <span className="text-warmred-500">*</span></Label>
          <Input
            id="s-phone"
            {...register('contact_phone')}
            placeholder="01XXXXXXXXX"
            inputMode="numeric"
            maxLength={11}
            onChange={(e) => {
              const v = e.target.value.replace(BANGLA_DIGITS, '');
              e.target.value = v;
              register('contact_phone').onChange(e);
            }}
          />
          {errors.contact_phone && <p className="text-xs text-warmred-500">{errors.contact_phone.message}</p>}
        </div>
      </div>
      <PaymentSection
        method={paymentMethod}
        onMethodChange={handleMethodChange}
        transactionId={transactionId}
        onTransactionIdChange={(v) => {
          setTransactionId(v);
          // shouldTouch only — the min(6) error must not appear while typing.
          setValue('transaction_id', v, { shouldTouch: true });
        }}
        methodError={errors.payment_method?.message}
        transactionIdError={errors.transaction_id?.message}
      />
      <div className="space-y-2">
        <Label htmlFor="s-details">আপনি কী দিতে পারেন / ব্র্যান্ডের বিবরণ</Label>
        <Textarea id="s-details" rows={3} {...register('brand_details')} placeholder="পণ্য, সেবা, স্পনসরশিপের বাজেট…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-event">প্রস্তাবিত ইভেন্ট / প্রোগ্রাম</Label>
        <Input id="s-event" {...register('proposed_event')} placeholder="যেমন: বার্ষিক সাংস্কৃতিক সন্ধ্যা" />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'জমা হচ্ছে…' : 'আবেদন জমা দিন'}
      </Button>
    </form>
  );
}
