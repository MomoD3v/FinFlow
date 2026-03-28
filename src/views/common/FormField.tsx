import React, { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

const INPUT_BASE =
  'w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors';

export function InputField({ label, error, hint, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <input className={`${INPUT_BASE} ${className}`} {...rest} />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SelectField({ label, error, children, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <select className={`${INPUT_BASE} ${className}`} {...rest}>
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-emerald-500"
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}
