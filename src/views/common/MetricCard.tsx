import React, { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number; // positive = good, negative = bad; null/0 = neutral
  trendLabel?: string;
  icon?: ReactNode;
  accent?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  onClick?: () => void;
}

const ACCENT_CLASSES: Record<NonNullable<Props['accent']>, string> = {
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  blue:    'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  amber:   'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  red:     'from-red-500/20 to-red-500/5 border-red-500/30',
  purple:  'from-purple-500/20 to-purple-500/5 border-purple-500/30',
};

const ICON_BG: Record<NonNullable<Props['accent']>, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  blue:    'bg-blue-500/20 text-blue-400',
  amber:   'bg-amber-500/20 text-amber-400',
  red:     'bg-red-500/20 text-red-400',
  purple:  'bg-purple-500/20 text-purple-400',
};

export function MetricCard({ title, value, subtitle, trend, trendLabel, icon, accent = 'emerald', onClick }: Props) {
  const TrendIcon = trend == null || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend == null || trend === 0 ? 'text-gray-400' : trend > 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-gradient-to-br ${ACCENT_CLASSES[accent]}
        border rounded-2xl p-5
        ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-400 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white leading-tight">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          {(trend != null || trendLabel) && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon size={13} />
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 p-2.5 rounded-xl ${ICON_BG[accent]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
