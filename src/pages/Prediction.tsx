import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  Gauge,
  Thermometer,
  Zap,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Sliders,
  Check,
  AlertCircle,
  Box,
  Flame,
  Info,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  HelpCircle
} from 'lucide-react';
import {
  PredictionFormValues,
  PredictionResponse,
  MachineType,
  PredictionPayload
} from '../types';
import { predictMachine, simulateOfflinePrediction } from '../services/api';
import { savePredictionRecord } from '../services/history';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatKelvinToCelsius, formatPower, formatNumber } from '../lib/utils';
import { Machine3DViewer } from '../components/3d/Machine3DViewer';
import { GaugeMeter } from '../components/ui/GaugeMeter';

interface PredictionPageProps {
  onPredictionCompleted?: () => void;
  initialValues?: PredictionFormValues | null;
}

const DEFAULT_FORM: PredictionFormValues = {
  modelChoice: 'both',
  machineType: 'M',
  rotationalSpeed: 1550,
  airTemperature: 298.1,
  processTemperature: 308.6,
  torque: 42.8,
  toolWear: 15,
};

const PRESETS: Array<{
  label: string;
  badge: string;
  description: string;
  riskType: 'healthy' | 'failure' | 'warning';
  values: PredictionFormValues;
}> = [
  {
    label: 'Nominal Baseline',
    badge: 'Nominal',
    riskType: 'healthy',
    description: 'Type M, standard rotational speed & moderate torque under low tool wear.',
    values: {
      machineType: 'M',
      rotationalSpeed: 1551,
      airTemperature: 298.1,
      processTemperature: 308.6,
      torque: 42.8,
      toolWear: 0,
      modelChoice: 'both',
    },
  },
  {
    label: 'High Tool Wear & Strain',
    badge: 'Wear Failure',
    riskType: 'failure',
    description: 'Type L, critical tool wear (245 min) and heavy cutting torque (72 Nm).',
    values: {
      machineType: 'L',
      rotationalSpeed: 1250,
      airTemperature: 300.0,
      processTemperature: 310.2,
      torque: 72.0,
      toolWear: 245,
      modelChoice: 'both',
    },
  },
  {
    label: 'Thermal Dissipation Stress',
    badge: 'Thermal Risk',
    riskType: 'warning',
    description: 'Narrow temperature difference between process and air (reduced cooling).',
    values: {
      machineType: 'H',
      rotationalSpeed: 1380,
      airTemperature: 303.5,
      processTemperature: 305.8,
      torque: 60.5,
      toolWear: 180,
      modelChoice: 'both',
    },
  },
  {
    label: 'High-Speed Finishing',
    badge: 'High RPM',
    riskType: 'healthy',
    description: 'High rotational velocity (2,400 rpm) with light torque and low wear.',
    values: {
      machineType: 'M',
      rotationalSpeed: 2400,
      airTemperature: 298.5,
      processTemperature: 309.0,
      torque: 22.0,
      toolWear: 40,
      modelChoice: 'both',
    },
  },
];

export const Prediction: React.FC<PredictionPageProps> = ({
  onPredictionCompleted,
  initialValues,
}) => {
  const [form, setForm] = useState<PredictionFormValues>(initialValues || DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [lastPayload, setLastPayload] = useState<PredictionPayload | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(0);

  // Sync with initialValues if updated externally (e.g. reload from history)
  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
      setActivePresetIndex(null);
    }
  }, [initialValues]);

  // Real-time instantaneous engineered features calculation
  const liveDeltaT = Number((form.processTemperature - form.airTemperature).toFixed(2));
  const livePowerW = Math.round(form.rotationalSpeed * form.torque * 2 * Math.PI / 60);
  const liveWearTorque = Math.round(form.toolWear * form.torque);

  // Thermodynamic validation check
  const isTempInvalid = form.processTemperature <= form.airTemperature;

  // Failure Mode Root Cause Diagnostic Heuristics (AI4I Domain Taxonomy)
  const failureModeAnalysis = useMemo(() => {
    const modes: Array<{ code: string; name: string; triggered: boolean; desc: string }> = [
      {
        code: 'TWF',
        name: 'Tool Wear Failure',
        triggered: form.toolWear >= 200,
        desc: `Tool wear (${form.toolWear} min) exceeds recommended limit (200 min).`,
      },
      {
        code: 'HDF',
        name: 'Heat Dissipation Failure',
        triggered: liveDeltaT < 8.6 && form.rotationalSpeed < 1380,
        desc: `Air/Process temp delta (${liveDeltaT}K) is too narrow with sub-nominal speed (<1380 RPM).`,
      },
      {
        code: 'PWF',
        name: 'Power Failure',
        triggered: livePowerW < 3500 || livePowerW > 9000,
        desc: `Mechanical power (${formatPower(livePowerW)}) outside operating safety envelope (3.5kW - 9.0kW).`,
      },
      {
        code: 'OSF',
        name: 'Overstrain Failure',
        triggered: (form.machineType === 'L' && liveWearTorque > 11000) ||
                   (form.machineType === 'M' && liveWearTorque > 12000) ||
                   (form.machineType === 'H' && liveWearTorque > 13000),
        desc: `Wear-torque product (${liveWearTorque}) exceeds structural shear threshold for Type ${form.machineType}.`,
      },
    ];

    const activeModes = modes.filter((m) => m.triggered);
    return {
      modes,
      activeModes,
      hasActiveRisk: activeModes.length > 0,
    };
  }, [form.toolWear, liveDeltaT, form.rotationalSpeed, livePowerW, form.machineType, liveWearTorque]);

  // Handle Preset Select
  const handleApplyPreset = (index: number) => {
    const preset = PRESETS[index];
    setForm(preset.values);
    setActivePresetIndex(index);
    setErrorMessage(null);
  };

  // Form Field Change
  const handleChange = (field: keyof PredictionFormValues, value: any) => {
    setActivePresetIndex(null);
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrorMessage(null);
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTempInvalid) {
      setErrorMessage('Process temperature must be greater than air temperature (Thermodynamic constraint).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await predictMachine(form);
      setResult(response.result);
      setLastPayload(response.payload);
      setLastLatency(response.latencyMs);

      // Save to client history
      savePredictionRecord(response.payload, response.result, response.latencyMs);
      if (onPredictionCompleted) {
        onPredictionCompleted();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute prediction. Please verify FastAPI backend is active.');
    } finally {
      setSubmitting(false);
    }
  };

  // Offline calibrated diagnostic fallback
  const handleOfflineSimulation = () => {
    const offlineResult = simulateOfflinePrediction(form);
    const payload: PredictionPayload = {
      model_choice: form.modelChoice,
      'Rotational speed [rpm]': Math.round(form.rotationalSpeed),
      'Air temperature [K]': Number(form.airTemperature),
      'Process temperature [K]': Number(form.processTemperature),
      'Torque [Nm]': Number(form.torque),
      'Tool wear [min]': Math.round(form.toolWear),
      Type: form.machineType,
    };
    setResult(offlineResult);
    setLastPayload(payload);
    setLastLatency(12);
    setErrorMessage(null);
    savePredictionRecord(payload, offlineResult, 12);
    if (onPredictionCompleted) {
      onPredictionCompleted();
    }
  };

  // Determine current failure state for 3D viewer
  const isFailureOutcome = result
    ? (result.predictions?.random_forest === 1 || result.predictions?.xgboost === 1)
    : failureModeAnalysis.hasActiveRisk;


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40">
              <Box size={20} />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Machine Failure Diagnostics & 3D Digital Twin
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive spindle parameter simulator with live thermodynamic calculations and multi-model consensus prediction.
          </p>
        </div>

        {/* Operating Presets Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Presets:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all border ${
                activePresetIndex === idx
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-glow-cyan'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-400/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form (5 cols) & 3D Twin + Outcome (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-card-light dark:shadow-card-dark space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                <Sliders size={14} className="text-cyan-500" />
                Kinematic & Physical Parameters
              </span>
              <button
                type="button"
                onClick={() => setForm(DEFAULT_FORM)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 font-mono"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Model Choice & Machine Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Classifier Engine
                </label>
                <select
                  value={form.modelChoice}
                  onChange={(e) => handleChange('modelChoice', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="both">Both (RF & XGBoost)</option>
                  <option value="random_forest">Random Forest (99.3%)</option>
                  <option value="xgboost">XGBoost (99.0%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Machine Quality Type
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['L', 'M', 'H'] as MachineType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange('machineType', type)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        form.machineType === type
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#111a2e] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rotational Speed (RPM) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Gauge size={13} className="text-cyan-500" /> Rotational Speed
                </span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {form.rotationalSpeed} RPM
                </span>
              </div>
              <input
                type="range"
                min="1100"
                max="2900"
                step="10"
                value={form.rotationalSpeed}
                onChange={(e) => handleChange('rotationalSpeed', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1,100 RPM (Low)</span>
                <span>2,000</span>
                <span>2,900 RPM (Max)</span>
              </div>
            </div>

            {/* Cutting Torque (Nm) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" /> Cutting Torque
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {form.torque} Nm
                </span>
              </div>
              <input
                type="range"
                min="3.0"
                max="80.0"
                step="0.5"
                value={form.torque}
                onChange={(e) => handleChange('torque', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3.0 Nm (Finishing)</span>
                <span>40.0</span>
                <span>80.0 Nm (Roughing)</span>
              </div>
            </div>

            {/* Temperatures: Air Temp & Process Temp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Air Temp</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    {form.airTemperature} K ({formatKelvinToCelsius(form.airTemperature)})
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="290"
                  max="310"
                  value={form.airTemperature}
                  onChange={(e) => handleChange('airTemperature', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Process Temp</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {form.processTemperature} K ({formatKelvinToCelsius(form.processTemperature)})
                  </span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="295"
                  max="320"
                  value={form.processTemperature}
                  onChange={(e) => handleChange('processTemperature', Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111a2e] border text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 ${
                    isTempInvalid
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700/80 focus:ring-cyan-500/50'
                  }`}
                />
              </div>
            </div>

            {/* Temperature Validation Warning */}
            {isTempInvalid && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle size={14} className="shrink-0" />
                <span>Thermodynamic Violation: Process temp must exceed Air temp.</span>
              </div>
            )}

            {/* Tool Wear (min) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={13} className="text-rose-500" /> Tool Wear
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {form.toolWear} min ({Math.min(100, Math.round((form.toolWear / 240) * 100))}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                step="1"
                value={form.toolWear}
                onChange={(e) => handleChange('toolWear', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 min (Fresh Tool)</span>
                <span>120 min</span>
                <span>240+ min (Critical)</span>
              </div>
            </div>

            {/* Instant Feature Preview Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-[11px] font-mono grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">ΔT Temp</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{liveDeltaT} K</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Power</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatPower(livePowerW)}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Wear-Torque</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{liveWearTorque}</span>
              </div>
            </div>

            {/* Error Message if API fails */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-200 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block font-mono">Backend Communication Notice</span>
                    <span className="text-[11px] leading-relaxed block opacity-90">{errorMessage}</span>
                  </div>
                </div>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold shadow-xs transition-colors"
                  >
                    Retry Connection
                  </button>
                  <button
                    type="button"
                    onClick={handleOfflineSimulation}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    Run Offline Calibrated Diagnostic
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isTempInvalid}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Machine Failure Models...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Execute Diagnostic Inspection</span>
                </>
              )}
            </button>
          </form>

          {/* Failure Mode Risk Breakdown Heuristic (AI4I Standard) */}
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-card-light dark:shadow-card-dark space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-500" />
              Physical Breakdown Heuristic Analysis
            </span>
            <div className="space-y-2">
              {failureModeAnalysis.modes.map((mode) => (
                <div
                  key={mode.code}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                    mode.triggered
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-[#111a2e] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                      mode.triggered
                        ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border-rose-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {mode.code}
                  </span>
                  <div>
                    <span className="font-semibold block">{mode.name}</span>
                    <span className="text-[11px] opacity-80 block">{mode.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Twin & Diagnostic Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live 3D Machine Spindle Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                <Box size={14} className="text-cyan-500" />
                Kinematic 3D Twin Response
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Speed: <strong>{form.rotationalSpeed} RPM</strong> • Torque: <strong>{form.torque} Nm</strong>
              </span>
            </div>

            <Machine3DViewer
              rotationalSpeed={form.rotationalSpeed}
              torque={form.torque}
              toolWear={form.toolWear}
              airTemp={form.airTemperature}
              processTemp={form.processTemperature}
              isFailure={isFailureOutcome}
            />
          </div>

          {/* Diagnostic Outcome Results Card */}
          {result ? (
            <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-5 animate-pulse-subtle">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Diagnostic Model Evaluation Complete
                  </h3>
                </div>
                {lastLatency && (
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/30">
                    {lastLatency}ms Latency
                  </span>
                )}
              </div>

              {/* Binary Primary Result Badge */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isFailureOutcome
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 shadow-glow-danger'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 shadow-glow-success'
                }`}
              >
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono block">
                    Diagnostic Status
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={isFailureOutcome ? 1 : 0} size="lg" />
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-600 dark:text-slate-300 sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Model Evaluation
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {result.model_choice ? result.model_choice.replace('_', ' ') : 'Both Models'}
                  </span>
                </div>
              </div>

              {/* Classifier Consensus Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      Random Forest Classifier
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                      99.30% Acc
                    </span>
                  </div>
                  <div className="pt-1">
                    <StatusBadge
                      status={result.predictions?.random_forest ?? 'unknown'}
                      size="md"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Optimized for high-precision breakdown detection.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      XGBoost Classifier
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                      99.00% Acc
                    </span>
                  </div>
                  <div className="pt-1">
                    <StatusBadge
                      status={result.predictions?.xgboost ?? 'unknown'}
                      size="md"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Gradient tree boosting with robust thermal feature scaling.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-8 text-center shadow-card-light dark:shadow-card-dark space-y-3">
              <Sparkles size={32} className="mx-auto text-cyan-500 opacity-60" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Awaiting Diagnostic Submission
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Select an operational preset or fine-tune kinematic and thermal sliders on the left, then click <strong>Execute Diagnostic Inspection</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
