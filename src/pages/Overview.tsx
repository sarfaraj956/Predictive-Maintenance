import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Gauge,
  Thermometer,
  Zap,
  Info,
  History as HistoryIcon,
  Box,
  Radio,
  Play,
  Square,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { GaugeMeter } from '../components/ui/GaugeMeter';
import { Machine3DViewer } from '../components/3d/Machine3DViewer';
import { HistoryRecord, ApiStatus, VERIFIED_BENCHMARKS } from '../types';
import { formatNumber, formatTimestamp, formatPower } from '../lib/utils';
import { NavTab } from '../components/layout/Sidebar';

interface OverviewProps {
  apiStatus: ApiStatus;
  history: HistoryRecord[];
  onNavigate: (tab: NavTab) => void;
  onSelectRecordForInspection?: (record: HistoryRecord) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  apiStatus,
  history,
  onNavigate,
  onSelectRecordForInspection,
}) => {
  // Live Telemetry Simulation Mode (visual demo of live industrial sensor streaming)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1550);
  const [simTorque, setSimTorque] = useState(42.5);
  const [simAirTemp, setSimAirTemp] = useState(298.2);
  const [simProcessTemp, setSimProcessTemp] = useState(308.6);
  const [simToolWear, setSimToolWear] = useState(25);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimSpeed((prev) => Math.round(1500 + Math.sin(Date.now() / 1200) * 80 + (Math.random() - 0.5) * 15));
      setSimTorque((prev) => Number((42.0 + Math.cos(Date.now() / 1500) * 6 + (Math.random() - 0.5) * 1.5).toFixed(1)));
      setSimProcessTemp((prev) => Number((308.5 + Math.sin(Date.now() / 3000) * 1.2).toFixed(1)));
      setSimToolWear((prev) => (prev >= 240 ? 10 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // KPIs
  const totalPredictions = history.length;
  const failureCount = history.filter(
    (h) => h.result?.predictions?.random_forest === 1 || h.result?.predictions?.xgboost === 1
  ).length;
  const healthyCount = totalPredictions - failureCount;
  const healthRate = totalPredictions > 0 ? ((healthyCount / totalPredictions) * 100).toFixed(1) : null;

  const bothEvaluations = history.filter((h) => h.result?.model_choice === 'both');
  const agreementCount = bothEvaluations.filter(
    (h) => h.result?.predictions?.random_forest === h.result?.predictions?.xgboost
  ).length;
  const agreementRate =
    bothEvaluations.length > 0 ? ((agreementCount / bothEvaluations.length) * 100).toFixed(1) : null;

  const latestRecord = history.length > 0 ? history[0] : null;

  // Active values for preview
  const currentSpeed = isSimulating ? simSpeed : (latestRecord?.inputs ? latestRecord.inputs['Rotational speed [rpm]'] : 1550);
  const currentTorque = isSimulating ? simTorque : (latestRecord?.inputs ? latestRecord.inputs['Torque [Nm]'] : 42.8);
  const currentAirTemp = isSimulating ? simAirTemp : (latestRecord?.inputs ? latestRecord.inputs['Air temperature [K]'] : 298.1);
  const currentProcTemp = isSimulating ? simProcessTemp : (latestRecord?.inputs ? latestRecord.inputs['Process temperature [K]'] : 308.6);
  const currentToolWear = isSimulating ? simToolWear : (latestRecord?.inputs ? latestRecord.inputs['Tool wear [min]'] : 15);
  const currentFailure = latestRecord
    ? latestRecord.result?.predictions?.random_forest === 1 || latestRecord.result?.predictions?.xgboost === 1
    : false;

  const deltaT = Number((currentProcTemp - currentAirTemp).toFixed(1));
  const currentPowerW = Math.round(currentSpeed * currentTorque * 2 * Math.PI / 60);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Aero-Industrial Command Banner */}
      <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-blue-950/20 to-slate-900/40 dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-[#0d1322] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-card-light dark:shadow-card-dark overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shrink-0 shadow-glow-cyan">
            <Cpu size={26} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Predictive Maintenance Command Operations
              </h2>
              <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-300 dark:border-cyan-500/40">
                AI4I 2020 Standard
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Cyber-physical digital twin with real-time spindle kinematics, calibrated Random Forest & XGBoost failure diagnostics.
            </p>
          </div>
        </div>

        {/* Action Controls & Simulation Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto relative z-10 shrink-0">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
              isSimulating
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-glow-amber'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500/50'
            }`}
            title="Toggle simulated live sensor fluctuation on this overview"
          >
            <Radio size={14} className={isSimulating ? 'animate-pulse text-amber-500' : 'text-slate-400'} />
            <span>{isSimulating ? 'Live Telemetry Active' : 'Simulate Sensor Stream'}</span>
          </button>

          <button
            onClick={() => onNavigate('prediction')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glow-cyan transition-all font-mono"
          >
            <span>Launch 3D Diagnostic</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4 Golden-Ratio KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Session Inspections"
          value={totalPredictions}
          subtitle={totalPredictions > 0 ? 'Conducted in current session' : 'Awaiting first test'}
          icon={Activity}
          iconColor="text-cyan-600 dark:text-cyan-400"
          iconBg="bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-500/30"
          badgeText={totalPredictions > 0 ? 'Active' : 'Standby'}
          badgeType={totalPredictions > 0 ? 'brand' : 'neutral'}
        />

        <MetricCard
          title="Breakdown Alerts"
          value={failureCount}
          subtitle={totalPredictions > 0 ? `${failureCount} of ${totalPredictions} flagged failure` : 'No faults detected'}
          icon={AlertTriangle}
          iconColor="text-rose-600 dark:text-rose-400"
          iconBg="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30"
          badgeText={failureCount > 0 ? 'Breakdown' : 'Nominal'}
          badgeType={failureCount > 0 ? 'danger' : 'success'}
        />

        <MetricCard
          title="Machine Health Rate"
          value={healthRate !== null ? `${healthRate}%` : '100%'}
          subtitle={totalPredictions > 0 ? `${healthyCount} normal inspections` : 'Baseline status'}
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30"
          badgeText={healthRate !== null ? 'Nominal' : 'Ready'}
          badgeType="success"
        />

        <MetricCard
          title="Multi-Model Consensus"
          value={agreementRate !== null ? `${agreementRate}%` : '100%'}
          subtitle={bothEvaluations.length > 0 ? `${agreementCount}/${bothEvaluations.length} RF-XGB agreement` : 'Dual-model calibrated'}
          icon={Layers}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30"
          badgeText={bothEvaluations.length > 0 ? 'Consensus' : 'Dual-Engine'}
          badgeType="brand"
        />
      </div>

      {/* Main Operations Split: 62% Digital Twin & Telemetry | 38% Latest Diagnostic & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols ≈ 58%) - 3D Digital Twin & Real-time Gauges */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive 3D Spindle Model */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                <Box size={14} className="text-cyan-500" />
                Live 3D Digital Twin Simulation
              </span>
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                {isSimulating ? 'Stream Active' : 'Static Baseline'}
              </span>
            </div>

            <Machine3DViewer
              rotationalSpeed={currentSpeed}
              torque={currentTorque}
              toolWear={currentToolWear}
              airTemp={currentAirTemp}
              processTemp={currentProcTemp}
              isFailure={currentFailure}
            />
          </div>

          {/* Precision Circular Telemetry Gauges */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-card-light dark:shadow-card-dark">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                <Gauge size={14} className="text-cyan-500" />
                Real-Time Kinematic & Thermal Telemetry
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Power: <strong className="text-slate-800 dark:text-slate-200">{formatPower(currentPowerW)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <GaugeMeter
                value={currentSpeed}
                min={1000}
                max={3000}
                title="Spindle Speed"
                unit="RPM"
                color="cyan"
                thresholdWarning={2300}
                thresholdDanger={2700}
                size="md"
              />

              <GaugeMeter
                value={currentTorque}
                min={0}
                max={100}
                title="Cutting Torque"
                unit="Nm"
                color="amber"
                thresholdWarning={60}
                thresholdDanger={75}
                size="md"
              />

              <GaugeMeter
                value={deltaT}
                min={0}
                max={20}
                title="Thermal Delta"
                unit="ΔT (K)"
                color="indigo"
                thresholdWarning={14}
                thresholdDanger={17}
                size="md"
              />

              <GaugeMeter
                value={currentToolWear}
                min={0}
                max={250}
                title="Tool Wear"
                unit="min"
                color="rose"
                thresholdWarning={180}
                thresholdDanger={220}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Right Column (5 cols ≈ 42%) - Latest Inspection Outcome & Activity Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Latest Prediction Outcome Card */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-card-light dark:shadow-card-dark space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Latest Diagnostic Outcome
                </h3>
              </div>
              {latestRecord && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {formatTimestamp(latestRecord.timestamp)}
                </span>
              )}
            </div>

            {latestRecord ? (
              <div className="space-y-4">
                {/* Result Hero Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    currentFailure
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 shadow-glow-danger'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 shadow-glow-success'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                      Evaluation Result
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={currentFailure ? 1 : 0} size="lg" />
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Round-Trip Latency</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{latestRecord.latencyMs}ms</span>
                  </div>
                </div>

                {/* Individual Model Decisions */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono block">
                      Random Forest
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StatusBadge
                        status={latestRecord.result?.predictions?.random_forest ?? 'unknown'}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono block">
                      XGBoost
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StatusBadge
                        status={latestRecord.result?.predictions?.xgboost ?? 'unknown'}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Engineered Parameters */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Machine Variant</span>
                    <strong className="text-slate-900 dark:text-white">Type {latestRecord.inputs?.Type ?? 'M'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Mechanical Power</span>
                    <strong className="text-cyan-600 dark:text-cyan-400">
                      {formatPower(latestRecord.result.calculated_features?.power ?? 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Wear-Torque Index</span>
                    <strong className="text-slate-900 dark:text-white">
                      {formatNumber(latestRecord.result.calculated_features?.wear_torque ?? 0)}
                    </strong>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onSelectRecordForInspection && onSelectRecordForInspection(latestRecord)}
                  className="w-full py-2.5 px-4 rounded-xl border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} />
                  <span>Reload These Parameters into Form</span>
                </button>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <Box size={36} className="mx-auto text-slate-400 opacity-60" />
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  No inspection tests recorded yet in this session. Run your first machine diagnostic to see live telemetry and risk classifications.
                </p>
                <button
                  onClick={() => onNavigate('prediction')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Launch Diagnostic</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Recent Session Inspection Audit Log */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-card-light dark:shadow-card-dark space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Recent Session Inspections
                </h3>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View All ({history.length})</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {history.length > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {history.slice(0, 5).map((rec) => {
                  const isFail =
                    rec.result.predictions.random_forest === 1 || rec.result.predictions.xgboost === 1;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => onSelectRecordForInspection && onSelectRecordForInspection(rec)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 hover:border-cyan-400/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isFail ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                          }`}
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono block truncate">
                            Type {rec.inputs.Type} • {rec.inputs['Rotational speed [rpm]']} RPM
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatTimestamp(rec.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={isFail ? 1 : 0} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Recent inspection results will appear here as you run diagnostics.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
