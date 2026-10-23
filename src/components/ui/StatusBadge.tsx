import React from 'react';
import { CheckCircle2, AlertTriangle, Activity, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: 0 | 1 | 'healthy' | 'failure' | 'warning' | 'unknown';
  size?: 'sm' | 'md' | 'lg';
  labelOverride?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  labelOverride,
  className,
}) => {
  const isHealthy = status === 0 || status === 'healthy';
  const isFailure = status === 1 || status === 'failure';
  const isWarning = status === 'warning';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-tight',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  if (isHealthy) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/40 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.25)] select-none',
          sizeClasses,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <CheckCircle2 size={iconSizes} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{labelOverride || 'Nominal / Healthy'}</span>
      </span>
    );
  }

  if (isFailure) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-500/60 shadow-xs dark:shadow-[0_0_16px_rgba(244,63,94,0.4)] animate-pulse-subtle select-none',
          sizeClasses,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
        <AlertTriangle size={iconSizes} className="text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{labelOverride || 'Machine Breakdown Alert'}</span>
      </span>
    );
  }

  if (isWarning) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40 shadow-xs dark:shadow-[0_0_12px_rgba(245,158,11,0.25)] select-none',
          sizeClasses,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <Activity size={iconSizes} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{labelOverride || 'Elevated Risk'}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 select-none',
        sizeClasses,
        className
      )}
    >
      <HelpCircle size={iconSizes} className="text-slate-500 dark:text-slate-400 shrink-0" />
      <span>{labelOverride || 'Uncalibrated'}</span>
    </span>
  );
};

