'use client';

import React from 'react';
import { GraduationCap, Building, School, IdCard } from 'lucide-react';

export interface DuFieldValues {
  academicSession: string;
  department: string;
  hallName: string;
  duRegistrationId: string;
}

interface DuFieldsProps {
  values: DuFieldValues;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 transition-all text-slate-900';

function Field({
  icon,
  label,
  name,
  value,
  placeholder,
  error,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  name: keyof DuFieldValues;
  value: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onChange: DuFieldsProps['onChange'];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
        {icon}
        {label} <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClass}
      />
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  );
}

/** The 4 DU-student inputs, rendered as a 2-col grid. Wrappers differ per mode. */
export function DuFields({ values, errors, disabled, onChange }: DuFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      <Field
        icon={<GraduationCap className="w-3.5 h-3.5 text-brand-primary" />}
        label="শিক্ষাবর্ষ (Academic Session)"
        name="academicSession"
        value={values.academicSession}
        placeholder="যেমন: 2020-21"
        error={errors.academicSession}
        disabled={disabled}
        onChange={onChange}
      />
      <Field
        icon={<Building className="w-3.5 h-3.5 text-brand-primary" />}
        label="বিভাগ (Department Name)"
        name="department"
        value={values.department}
        placeholder="যেমন: দর্শন বিভাগ"
        error={errors.department}
        disabled={disabled}
        onChange={onChange}
      />
      <Field
        icon={<School className="w-3.5 h-3.5 text-brand-primary" />}
        label="হলের নাম (Hall Name)"
        name="hallName"
        value={values.hallName}
        placeholder="যেমন: রোকেয়া হল"
        error={errors.hallName}
        disabled={disabled}
        onChange={onChange}
      />
      <Field
        icon={<IdCard className="w-3.5 h-3.5 text-brand-primary" />}
        label="Academic Registration ID"
        name="duRegistrationId"
        value={values.duRegistrationId}
        placeholder="যেমন: 2019XXXXXX"
        error={errors.duRegistrationId}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
