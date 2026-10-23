import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Copy,
  Check,
  Globe,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { ApiStatus } from '../types';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  checkApiHealth
} from '../services/api';
import { getPredictionHistory, clearPredictionHistory } from '../services/history';

interface SettingsProps {
  apiStatus: ApiStatus;
  onRefreshApi: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ apiStatus, onRefreshApi }) => {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency?: number;
    message?: string;
    raw?: any;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const historyRecords = getPredictionHistory();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(urlInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefreshApi();
  };

  const handleReset = () => {
    resetApiBaseUrl();
    setUrlInput(getApiBaseUrl());
    onRefreshApi();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, latencyMs } = await checkApiHealth(urlInput);
      setTestResult({
        success: true,
        latency: latencyMs,
        message: data.message,
        raw: data,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const corsDocSnippet = `# Standard FastAPI CORSMiddleware (Reference Only)
# Note: Zero backend edits required! Vite proxy handles /api internally.
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(corsDocSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const docsUrl = urlInput.startsWith('http') ? `${urlInput}/docs` : '/api/docs';
  const openApiUrl = urlInput.startsWith('http') ? `${urlInput}/openapi.json` : '/api/openapi.json';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40">
              <Server size={20} />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              FastAPI Gateway & Connectivity Monitor
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure backend gateway endpoint, test round-trip latency, and inspect Swagger OpenAPI specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-cyan-500 transition-colors font-mono"
          >
            <FileCode2 size={14} className="text-cyan-500" />
            <span>FastAPI Swagger UI</span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Grid: Gateway Config & Architecture Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Configuration & Live Ping Terminal */}
        <div className="lg:col-span-7 space-y-6">
          {/* Base URL Config Form */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                <Globe size={16} className="text-cyan-500" />
                API Gateway Base URL
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Default: <code className="text-cyan-600 dark:text-cyan-400">/api</code> (Vite Proxy)
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Endpoint URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="/api or http://127.0.0.1:8000"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-colors shadow-xs"
                  >
                    Save URL
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-mono underline"
                >
                  Reset to Default (/api)
                </button>

                {savedSuccess && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold flex items-center gap-1">
                    <Check size={13} /> URL Persisted!
                  </span>
                )}
              </div>
            </form>

            {/* Test Connection Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="py-2.5 px-4 rounded-xl border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold font-mono transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'Testing Latency...' : 'Test Connection Latency'}</span>
              </button>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Pings <code className="text-slate-800 dark:text-slate-200">{urlInput}/</code>
              </span>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border font-mono text-xs space-y-2 animate-pulse-subtle ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {testResult.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    {testResult.success ? 'Gateway Online & Operational' : 'Connection Failed'}
                  </span>
                  {testResult.latency !== undefined && (
                    <span className="font-bold text-slate-900 dark:text-white">
                      Latency: {testResult.latency} ms
                    </span>
                  )}
                </div>

                <p className="text-[11px] opacity-90">{testResult.message}</p>

                {testResult.raw && (
                  <pre className="p-2.5 rounded-lg bg-white/70 dark:bg-black/40 text-[10px] overflow-x-auto text-slate-800 dark:text-slate-200">
                    {JSON.stringify(testResult.raw, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Reference Zero-CORS Architecture Note */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                <Terminal size={15} className="text-cyan-500" />
                Zero-CORS Vite Proxy Pipeline
              </span>
              <button
                onClick={handleCopySnippet}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSnippet ? 'Copied' : 'Copy CORS Snippet'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In modern browser architectures, calling a local port (e.g. FastAPI on port 8000 from Vite on port 5173) requires CORS headers unless proxied.
              Maintena AI includes a zero-configuration Vite proxy in <code className="text-cyan-600 dark:text-cyan-400 font-mono">vite.config.ts</code> that reroutes <code className="text-cyan-600 dark:text-cyan-400 font-mono">/api/*</code> to <code className="text-cyan-600 dark:text-cyan-400 font-mono">http://127.0.0.1:8000/*</code>, ensuring <strong>zero modifications</strong> to your backend Python scripts.
            </p>

            <pre className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-300 overflow-x-auto">
              {corsDocSnippet}
            </pre>
          </div>
        </div>

        {/* Right Column (5 cols): Pipeline Overview & Client Storage */}
        <div className="lg:col-span-5 space-y-6">
          {/* Architecture Pipeline Map */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layers size={15} className="text-cyan-500" />
              Cyber-Physical Data Flow Pipeline
            </span>

            <div className="space-y-3 font-mono text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">1. React 18 UI</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Kinematic 3D & sliders</span>
                </div>
                <span className="text-cyan-600 dark:text-cyan-400 text-xs font-bold">Port 5173</span>
              </div>

              {/* Arrow */}
              <div className="text-center text-slate-400 text-xs">↓ Internal Proxy (/api)</div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">2. FastAPI Gateway</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Pydantic feature engineering</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">Port 8000</span>
              </div>

              {/* Arrow */}
              <div className="text-center text-slate-400 text-xs">↓ Scikit-Learn / XGBoost</div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">3. Trained ML Models</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">RF (99.3%) + XGB (99.0%)</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">.joblib Artifacts</span>
              </div>
            </div>
          </div>

          {/* Client Local Storage Manager */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Database size={15} className="text-cyan-500" />
              Client Storage & Session Telemetry
            </span>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111a2e]">
                <span className="text-slate-500 dark:text-slate-400">Session Audit Records:</span>
                <strong className="text-slate-900 dark:text-white">{historyRecords.length} Items</strong>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111a2e]">
                <span className="text-slate-500 dark:text-slate-400">LocalStorage Key:</span>
                <strong className="text-cyan-600 dark:text-cyan-400 text-[11px]">maintena_prediction_history_v1</strong>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111a2e]">
                <span className="text-slate-500 dark:text-slate-400">Theme Preference Key:</span>
                <strong className="text-cyan-600 dark:text-cyan-400 text-[11px]">maintena_theme_preference</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              All telemetry audit logs and UI themes are persisted in your local browser sandbox without sending any client telemetry or state to remote third-party trackers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
