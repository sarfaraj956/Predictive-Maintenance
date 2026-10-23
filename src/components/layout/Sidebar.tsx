import React from 'react';
import {
  LayoutDashboard,
  Box,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Server,
  ExternalLink,
  Wrench,
  Activity,
  Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ApiStatus } from '../../types';

export type NavTab = 'overview' | 'prediction' | 'benchmark' | 'history' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  apiStatus: ApiStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  apiStatus,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Telemetry Overview',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'prediction' as NavTab,
      label: '3D Twin & Predict',
      icon: Box,
      badge: '3D',
    },
    {
      id: 'benchmark' as NavTab,
      label: 'Model Benchmark',
      icon: BarChart3,
      badge: '99% Acc',
    },
    {
      id: 'history' as NavTab,
      label: 'Inspection History',
      icon: History,
    },
    {
      id: 'settings' as NavTab,
      label: 'Gateway & API',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white dark:bg-[#080d19] text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/80 transition-all duration-300 z-30 select-none shrink-0 min-h-screen',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800/80 justify-between">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelectTab('overview')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-cyan shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Maintena <span className="text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 font-mono">3D AI</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide truncate">
                Industrial Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative text-left',
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-glow-cyan'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                )}
              />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ml-2 shrink-0 font-mono border',
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/40'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
              {isCollapsed && isActive && (
                <span className="absolute right-1 top-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Backend Status Widget at Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#060a14]">
        {!isCollapsed ? (
          <div className="rounded-xl bg-white dark:bg-[#0d1424] p-3 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Server size={12} className="text-cyan-600 dark:text-cyan-400" />
                FastAPI Gateway
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    apiStatus.online
                      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                      : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  )}
                />
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  {apiStatus.online ? 'Online' : 'Offline'}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono text-xs">127.0.0.1:8000</span>
              {apiStatus.latencyMs !== undefined && apiStatus.online && (
                <span className="text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold">{apiStatus.latencyMs}ms</span>
              )}
            </div>

            <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck size={11} className="text-cyan-500" /> RF + XGBoost
              </span>
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 font-semibold"
              >
                Docs <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 cursor-pointer"
            onClick={() => onSelectTab('settings')}
            title={`FastAPI ${apiStatus.online ? 'Online' : 'Offline'}`}
          >
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                apiStatus.online
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-rose-500'
              )}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
