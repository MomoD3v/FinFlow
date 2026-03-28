import React from 'react';

interface Props {
  value: number; // 0–100
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const COLORS: Record<NonNullable<Props['color']>, string> = {
  emerald: 'bg-emerald-500',
  blue:    'bg-blue-500',
  amber:   'bg-amber-400',
  red:     'bg-red-500',
  purple:  'bg-purple-500',
};

export function ProgressBar({ value, color = 'emerald', size = 'md', showLabel = false }: Props) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-700 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-500 ${COLORS[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-400 w-8 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
