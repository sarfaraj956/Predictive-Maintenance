import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-4 antialiased font-sans">
          <div className="max-w-lg w-full bg-[#0c1222] border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(244,63,94,0.25)] space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-500/40">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {this.props.fallbackTitle || 'UI Runtime Exception Intercepted'}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Maintena AI Diagnostics Recovery Protocol
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                Error Signature:
              </span>
              <p className="text-rose-300 break-words font-semibold">
                {this.state.error?.message || 'Unknown runtime error occurred.'}
              </p>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-slate-500 max-h-32 overflow-y-auto whitespace-pre-wrap pt-2 border-t border-slate-800/80">
                  {this.state.error.stack.slice(0, 400)}...
                </pre>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              An unhandled rendering fault was prevented from causing a blank screen. This can happen if outdated browser cache or corrupted local history exists.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <RefreshCw size={14} />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/50 border border-slate-700 text-slate-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
                title="Clears stale local storage and refreshes"
              >
                <Trash2 size={14} />
                <span>Clear Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
