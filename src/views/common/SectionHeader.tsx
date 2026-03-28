import React, { type ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
