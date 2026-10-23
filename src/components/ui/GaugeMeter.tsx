import React from 'react';
import { cn } from '../../lib/utils';

interface GaugeMeterProps {
  value: number;
  min: number;
  max: number;
  title: string;
  unit: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  thresholdWarning?: number;
  thresholdDanger?: number;
  className?: string;
  subtitle?: string;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({
  value,
  min,
  max,
  title,
  unit,
  color = 'cyan',
  size = 'md',
  thresholdWarning,
  thresholdDanger,
  className,
  subtitle,
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Determine dynamic color based on thresholds if provided
  let activeColor = color;
  if (thresholdDanger !== undefined && value >= thresholdDanger) {
    activeColor = 'rose';
  } else if (thresholdWarning !== undefined && value >= thresholdWarning) {
    activeColor = 'amber';
  }

  const dimensions = {
    sm: { width: 100, height: 60, radius: 40, stroke: 6, fontSize: 'text-base' },
    md: { width: 140, height: 85, radius: 55, stroke: 8, fontSize: 'text-xl' },
    lg: { width: 180, height: 110, radius: 72, stroke: 10, fontSize: 'text-2xl' },
  }[size];

  const colorMap = {
    cyan: {
      stroke: '#06b6d4',
      track: 'stroke-cyan-500/10 dark:stroke-cyan-500/20',
      glow: 'drop-shadow(0 0 6px rgba(6,182,212,0.6))',
      text: 'text-cyan-600 dark:text-cyan-400',
    },
    emerald: {
      stroke: '#10b981',
      track: 'stroke-emerald-500/10 dark:stroke-emerald-500/20',
      glow: 'drop-shadow(0 0 6px rgba(16,185,129,0.6))',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      stroke: '#f59e0b',
      track: 'stroke-amber-500/10 dark:stroke-amber-500/20',
      glow: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))',
      text: 'text-amber-600 dark:text-amber-400',
    },
    rose: {
      stroke: '#f43f5e',
      track: 'stroke-rose-500/10 dark:stroke-rose-500/20',
      glow: 'drop-shadow(0 0 6px rgba(244,63,94,0.7))',
      text: 'text-rose-600 dark:text-rose-400',
    },
    indigo: {
      stroke: '#6366f1',
      track: 'stroke-indigo-500/10 dark:stroke-indigo-500/20',
      glow: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
  }[activeColor];

  // Semi-circle arc calculations
  const circumference = Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center select-none', className)}>
      <div className="relative flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height + 5}`}
          className="overflow-visible"
        >
          {/* Background Track Arc */}
          <path
            d={`M ${dimensions.width / 2 - dimensions.radius} ${dimensions.height} A ${dimensions.radius} ${dimensions.radius} 0 0 1 ${dimensions.width / 2 + dimensions.radius} ${dimensions.height}`}
            fill="none"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            className={cn('transition-all', colorMap.track)}
          />

          {/* Active Filled Arc */}
          <path
            d={`M ${dimensions.width / 2 - dimensions.radius} ${dimensions.height} A ${dimensions.radius} ${dimensions.radius} 0 0 1 ${dimensions.width / 2 + dimensions.radius} ${dimensions.height}`}
            fill="none"
            stroke={colorMap.stroke}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ filter: colorMap.glow, transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* Gauge needle / indicator dot */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height}
            r="3"
            className="fill-slate-400 dark:fill-slate-200"
          />
        </svg>

        {/* Center Value */}
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-end pb-0.5">
          <span className={cn('font-mono font-bold tracking-tight', dimensions.fontSize, colorMap.text)}>
            {value.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {unit}
          </span>
        </div>
      </div>

      <div className="mt-1 text-center">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-tight block">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
