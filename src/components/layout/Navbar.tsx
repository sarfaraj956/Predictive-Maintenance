import React from 'react';
import {
  Menu,
  Activity,
  ExternalLink,
  RefreshCw,
  Box,
  FileCode2,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { ApiStatus } from '../../types';
import { NavTab } from './Sidebar';
import { getApiBaseUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onToggleMobileMenu: () => void;
  apiStatus: ApiStatus;
  onRefreshApi: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onToggleMobileMenu,
  apiStatus,
  onRefreshApi,
}) => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Operations Telemetry Command Hub',
      subtitle: 'Real-time 3D simulation, sensor telemetry & predictive breakdown surveillance',
    },
    prediction: {
      title: 'Machine Diagnostics & 3D Digital Twin',
      subtitle: 'Spindle parameter simulation & calibrated multi-model failure prediction',
    },
    benchmark: {
      title: 'Empirical Model Benchmark & ROC-PR Validation',
      subtitle: 'Empirical validation metrics (99%+ test accuracy) & confusion matrix audit',
    },
    history: {
      title: 'Inspection Audit Trail & Telemetry Records',
      subtitle: 'Historical session audit log with CSV and formatted JSON export',
    },
    settings: {
      title: 'FastAPI Gateway & Connectivity Monitor',
      subtitle: 'Health check, latency inspector, zero-CORS proxy, and Swagger docs',
    },
  };

  const { title, subtitle } = titles[currentTab] || titles.overview;
  const baseUrl = getApiBaseUrl();
  const docsUrl = baseUrl.startsWith('http') ? `${baseUrl}/docs` : '/api/docs';

  return (
    <header className="h-16 bg-white/90 dark:bg-[#080d19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="truncate">
          <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xl">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400/50 transition-all shadow-xs"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={17} className="text-amber-400 animate-spin-slow" />
          ) : (
            <Moon size={17} className="text-cyan-600" />
          )}
        </button>

        {/* Backend Status Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
          <span className="relative flex h-2 w-2">
            {apiStatus.online && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                apiStatus.online ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
              }`}
            />
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline font-mono text-[11px]">
            {apiStatus.online ? 'FastAPI Connected' : 'Offline'}
          </span>

          {apiStatus.latencyMs !== undefined && apiStatus.online && (
            <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 border-l border-slate-300 dark:border-slate-700 pl-2">
              {apiStatus.latencyMs}ms
            </span>
          )}

          <button
            onClick={onRefreshApi}
            disabled={apiStatus.checking}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded transition-colors disabled:opacity-50"
            title="Refresh API connection"
          >
            <RefreshCw size={12} className={apiStatus.checking ? 'animate-spin text-cyan-500' : ''} />
          </button>
        </div>

        {/* FastAPI Docs button */}
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          title="Open FastAPI Swagger Interactive Docs"
        >
          <FileCode2 size={14} className="text-slate-500 dark:text-slate-400" />
          <span>API Docs</span>
          <ExternalLink size={12} className="text-slate-400 dark:text-slate-500" />
        </a>

        {/* Quick Diagnostic Action */}
        {currentTab !== 'prediction' && (
          <button
            onClick={() => onSelectTab('prediction')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glow-cyan transition-all"
          >
            <Box size={14} />
            <span className="hidden xs:inline">Launch 3D Twin</span>
          </button>
        )}
      </div>
    </header>
  );
};
