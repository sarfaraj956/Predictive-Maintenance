import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  badgeType?: 'neutral' | 'success' | 'danger' | 'warning' | 'brand';
  className?: string;
  onClick?: () => void;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconColor = 'text-cyan-600 dark:text-cyan-400',
  iconBg = 'bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40',
  badgeText,
  badgeType = 'neutral',
  className,
  onClick,
  trend,
}) => {
  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/40',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500/40',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40',
    brand: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-cyan-500/40',
  }[badgeType];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-card-light dark:shadow-card-dark transition-all duration-300 hover:border-cyan-400/50 dark:hover:border-cyan-500/50 hover:shadow-glow-cyan-sm group overflow-hidden',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">{value}</span>
            {unit && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{unit}</span>}
          </div>
        </div>
        <div className={cn('p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-xs', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>

      {(subtitle || badgeText || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs relative z-10 gap-2">
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate text-[11px] font-medium">{subtitle}</span>
          )}
          {trend && (
            <span className={cn('font-mono font-semibold text-[11px]', trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {trend.value} {trend.label && <span className="text-slate-400 font-normal">({trend.label})</span>}
            </span>
          )}
          {badgeText && (
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ml-auto shrink-0 font-mono',
                badgeStyles
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

