import React, { useState } from 'react';
import {
  BarChart3,
  Layers,
  Sparkles,
  GitCompare,
  Cpu,
  ShieldCheck,
  Award,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Table,
  HelpCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { VERIFIED_BENCHMARKS, HistoryRecord } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ComparisonProps {
  history: HistoryRecord[];
}

export const Comparison: React.FC<ComparisonProps> = ({ history }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [activeTab, setActiveTab] = useState<'metrics' | 'matrix' | 'features'>('metrics');

  const comparisonData = [
    {
      metric: 'Accuracy',
      'Random Forest': Number((VERIFIED_BENCHMARKS.random_forest.accuracy * 100).toFixed(1)),
      XGBoost: Number((VERIFIED_BENCHMARKS.xgboost.accuracy * 100).toFixed(1)),
    },
    {
      metric: 'Precision',
      'Random Forest': Number((VERIFIED_BENCHMARKS.random_forest.precision * 100).toFixed(1)),
      XGBoost: Number((VERIFIED_BENCHMARKS.xgboost.precision * 100).toFixed(1)),
    },
    {
      metric: 'Recall',
      'Random Forest': Number((VERIFIED_BENCHMARKS.random_forest.recall * 100).toFixed(1)),
      XGBoost: Number((VERIFIED_BENCHMARKS.xgboost.recall * 100).toFixed(1)),
    },
    {
      metric: 'F1 Score',
      'Random Forest': Number((VERIFIED_BENCHMARKS.random_forest.f1Score * 100).toFixed(1)),
      XGBoost: Number((VERIFIED_BENCHMARKS.xgboost.f1Score * 100).toFixed(1)),
    },
    {
      metric: 'PR-AUC',
      'Random Forest': Number((VERIFIED_BENCHMARKS.random_forest.prAuc * 100).toFixed(1)),
      XGBoost: Number((VERIFIED_BENCHMARKS.xgboost.prAuc * 100).toFixed(1)),
    },
  ];

  // Feature Importance breakdown from AI4I machine learning evaluation
  const featureImportances = [
    { feature: 'Torque [Nm]', rf: 32.4, xgb: 34.1, desc: 'Mechanical cutting resistance load' },
    { feature: 'Rotational speed [rpm]', rf: 24.8, xgb: 23.5, desc: 'Kinematic angular spindle velocity' },
    { feature: 'temp_diff (ΔT)', rf: 18.2, xgb: 17.6, desc: 'Thermodynamic dissipation gradient' },
    { feature: 'wear_torque', rf: 14.1, xgb: 13.8, desc: 'Structural tool shear interaction index' },
    { feature: 'Tool wear [min]', rf: 10.5, xgb: 11.0, desc: 'Cumulative cutter abrasion duration' },
  ];

  // Session stats
  const bothRecords = history.filter((h) => h.result.model_choice === 'both');
  const agreedBothNormal = bothRecords.filter(
    (h) => h.result.predictions.random_forest === 0 && h.result.predictions.xgboost === 0
  ).length;
  const agreedBothFailure = bothRecords.filter(
    (h) => h.result.predictions.random_forest === 1 && h.result.predictions.xgboost === 1
  ).length;
  const disagreed = bothRecords.filter(
    (h) => h.result.predictions.random_forest !== h.result.predictions.xgboost
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40">
              <GitCompare size={20} />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Machine Learning Classifier Benchmark & Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Empirical test set validation (2,000 samples) comparing Random Forest and XGBoost classifiers from the AI4I 2020 dataset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-300 dark:border-cyan-500/40 shadow-xs">
            predictive_maintenance.ipynb
          </span>
        </div>
      </div>

      {/* Side-by-Side Model Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Random Forest */}
        <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none" />

          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  Random Forest Classifier
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {VERIFIED_BENCHMARKS.random_forest.algorithm}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/40">
              99.30% Accuracy
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">
            {VERIFIED_BENCHMARKS.random_forest.description}
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1 relative z-10">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Precision</span>
              <strong className="text-sm text-cyan-600 dark:text-cyan-400">96.55%</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Recall</span>
              <strong className="text-sm text-slate-900 dark:text-white">82.35%</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">PR-AUC</span>
              <strong className="text-sm text-indigo-600 dark:text-indigo-400">0.9030</strong>
            </div>
          </div>
        </div>

        {/* XGBoost */}
        <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-card-light dark:shadow-card-dark space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  XGBoost Classifier
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {VERIFIED_BENCHMARKS.xgboost.algorithm}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-500/40">
              99.00% Accuracy
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">
            {VERIFIED_BENCHMARKS.xgboost.description}
          </p>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1 relative z-10">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Precision</span>
              <strong className="text-sm text-indigo-600 dark:text-indigo-400">88.71%</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Recall</span>
              <strong className="text-sm text-slate-900 dark:text-white">80.88%</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">PR-AUC</span>
              <strong className="text-sm text-cyan-600 dark:text-cyan-400">0.8849</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Empirical Metrics Chart | Confusion Matrices | Feature Importance */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-card-light dark:shadow-card-dark space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'metrics'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Metric Bar Benchmark
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'matrix'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Confusion Matrices
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'features'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Feature Importance
            </button>
          </div>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Test Holdout: <strong>2,000 Samples</strong> (80/20 Stratified Split)
          </span>
        </div>

        {/* Tab 1: Recharts Bar Benchmark */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  />
                  <XAxis
                    dataKey="metric"
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis
                    domain={[70, 100]}
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    fontFamily="JetBrains Mono"
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0c1222' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.2)',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                      paddingTop: '10px',
                    }}
                  />
                  <Bar
                    dataKey="Random Forest"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey="XGBoost"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-mono">
              Empirical metrics evaluated on the test set of 2,000 industrial machine observation records.
            </p>
          </div>
        )}

        {/* Tab 2: Confusion Matrices */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Random Forest Matrix */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                  Random Forest Test Confusion Matrix
                </span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  N = 2,000
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">True Negative (Healthy)</span>
                  <strong className="text-lg text-emerald-600 dark:text-emerald-400">1,930</strong>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30">
                  <span className="text-[10px] text-slate-400 block">False Positive (False Alarm)</span>
                  <strong className="text-lg text-rose-600 dark:text-rose-400">2</strong>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30">
                  <span className="text-[10px] text-slate-400 block">False Negative (Missed)</span>
                  <strong className="text-lg text-amber-600 dark:text-amber-400">12</strong>
                </div>
                <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/30">
                  <span className="text-[10px] text-slate-400 block">True Positive (Breakdown)</span>
                  <strong className="text-lg text-cyan-600 dark:text-cyan-400">56</strong>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-center">
                High precision (96.55%) with only 2 false breakdown alarms in 2,000 industrial cycles.
              </p>
            </div>

            {/* XGBoost Matrix */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                  XGBoost Test Confusion Matrix
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  N = 2,000
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">True Negative (Healthy)</span>
                  <strong className="text-lg text-emerald-600 dark:text-emerald-400">1,925</strong>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30">
                  <span className="text-[10px] text-slate-400 block">False Positive (False Alarm)</span>
                  <strong className="text-lg text-rose-600 dark:text-rose-400">7</strong>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30">
                  <span className="text-[10px] text-slate-400 block">False Negative (Missed)</span>
                  <strong className="text-lg text-amber-600 dark:text-amber-400">13</strong>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-500/30">
                  <span className="text-[10px] text-slate-400 block">True Positive (Breakdown)</span>
                  <strong className="text-lg text-indigo-600 dark:text-indigo-400">55</strong>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-center">
                Balanced precision (88.71%) and recall (80.88%) on imbalanced failure samples.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Feature Importance */}
        {activeTab === 'features' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-3">
              {featureImportances.map((item) => (
                <div
                  key={item.feature}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.feature}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.desc}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="w-24 text-cyan-600 dark:text-cyan-400 font-semibold">RF: {item.rf}%</span>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${item.rf * 2.5}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="w-24 text-indigo-600 dark:text-indigo-400 font-semibold">XGB: {item.xgb}%</span>
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${item.xgb * 2.5}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real Session Model Consensus Stats */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-card-light dark:shadow-card-dark space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Live Session Consensus Monitoring
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {bothRecords.length} Dual-Engine Evaluations
          </span>
        </div>

        {bothRecords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Unanimous Healthy</span>
              <strong className="text-xl text-emerald-600 dark:text-emerald-400 font-extrabold">{agreedBothNormal}</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({((agreedBothNormal / bothRecords.length) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Unanimous Failure</span>
              <strong className="text-xl text-rose-600 dark:text-rose-400 font-extrabold">{agreedBothFailure}</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({((agreedBothFailure / bothRecords.length) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Split Decisions</span>
              <strong className="text-xl text-amber-600 dark:text-amber-400 font-extrabold">{disagreed}</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({((disagreed / bothRecords.length) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            Execute inspection tests with "Both" models selected to accumulate live consensus agreement data.
          </p>
        )}
      </div>
    </div>
  );
};
