import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
}

const VARIANTS = {
  primary:   'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600',
  danger:    'bg-red-600/80 hover:bg-red-500 text-white border-transparent',
  ghost:     'bg-transparent hover:bg-gray-700 text-gray-300 border-gray-700',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export function Button({ variant = 'primary', size = 'md', icon, children, className = '', ...rest }: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-xl border
        transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
