import React, { useState, useMemo } from 'react';
import {
  History as HistoryIcon,
  Trash2,
  Filter,
  Eye,
  FileSpreadsheet,
  FileCode2,
  X,
  Search,
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { HistoryRecord } from '../types';
import {
  exportHistoryAsCsv,
  exportHistoryAsJson,
  clearPredictionHistory
} from '../services/history';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatNumber, formatTimestamp, formatPower } from '../lib/utils';
import { NavTab } from '../components/layout/Sidebar';

interface HistoryProps {
  history: HistoryRecord[];
  onRefreshHistory: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectRecordForInspection?: (record: HistoryRecord) => void;
}

export const History: React.FC<HistoryProps> = ({
  history,
  onRefreshHistory,
  onNavigate,
  onSelectRecordForInspection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'normal' | 'failure'>('all');
  const [filterType, setFilterType] = useState<'all' | 'L' | 'M' | 'H'>('all');
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter and search
  const filteredHistory = useMemo(() => {
    return history.filter((rec) => {
      const isFail =
        rec.result.predictions.random_forest === 1 || rec.result.predictions.xgboost === 1;

      if (filterResult === 'normal' && isFail) return false;
      if (filterResult === 'failure' && !isFail) return false;
      if (filterType !== 'all' && rec.inputs.Type !== filterType) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesType = rec.inputs.Type.toLowerCase().includes(query);
        const matchesSpeed = rec.inputs['Rotational speed [rpm]'].toString().includes(query);
        const matchesTorque = rec.inputs['Torque [Nm]'].toString().includes(query);
        const matchesId = rec.id.toLowerCase().includes(query);
        if (!matchesType && !matchesSpeed && !matchesTorque && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [history, filterResult, filterType, searchQuery]);

  const handleClear = () => {
    clearPredictionHistory();
    onRefreshHistory();
    setShowClearConfirm(false);
  };

  const failureCount = history.filter(
    (h) => h.result.predictions.random_forest === 1 || h.result.predictions.xgboost === 1
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-card-light dark:shadow-card-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40">
              <HistoryIcon size={20} />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Inspection Audit Trail & Telemetry Records
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological audit of machine failure diagnostics executed during this browser session with batch exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={exportHistoryAsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-colors font-mono"
                title="Export audit trail as CSV spreadsheet"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={exportHistoryAsJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs transition-colors font-mono"
                title="Export audit trail as JSON records"
              >
                <FileCode2 size={14} className="text-cyan-500" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold transition-colors"
                title="Clear all session history records"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-card-light dark:shadow-card-dark flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, speed, torque..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilterResult('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterResult === 'all'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilterResult('normal')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterResult === 'normal'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Healthy ({history.length - failureCount})
            </button>
            <button
              onClick={() => setFilterResult('failure')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterResult === 'failure'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Alerts ({failureCount})
            </button>
          </div>

          {/* Machine Type Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            {(['all', 'L', 'M', 'H'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-1 rounded-lg transition-colors uppercase ${
                  filterType === t
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === 'all' ? 'Type' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      {filteredHistory.length > 0 ? (
        <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-card-light dark:shadow-card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-[#111a2e] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp / ID</th>
                  <th className="py-3 px-4">Variant</th>
                  <th className="py-3 px-4">Kinematics</th>
                  <th className="py-3 px-4">Thermal (ΔT)</th>
                  <th className="py-3 px-4">Tool Wear</th>
                  <th className="py-3 px-4">Diagnostic Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredHistory.map((rec) => {
                  const isFail =
                    rec.result.predictions.random_forest === 1 || rec.result.predictions.xgboost === 1;
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRecord(rec)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rec.id.slice(0, 16)}...
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                          Type {rec.inputs.Type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold block">
                          {rec.inputs['Rotational speed [rpm]']} RPM
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {rec.inputs['Torque [Nm]']} Nm
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold block">
                          ΔT {rec.result.calculated_features?.temp_diff ?? 0} K
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {rec.inputs['Process temperature [K]']} K
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-rose-600 dark:text-rose-400 font-semibold block">
                          {rec.inputs['Tool wear [min]']} min
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatPower(rec.result.calculated_features?.power ?? 0)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={isFail ? 1 : 0} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectRecordForInspection) onSelectRecordForInspection(rec);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 text-[11px] font-bold font-mono transition-colors"
                          title="Reload parameters into Diagnostic Form"
                        >
                          Reload
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-12 text-center shadow-card-light dark:shadow-card-dark space-y-3">
          <HistoryIcon size={36} className="mx-auto text-slate-400 opacity-60" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Inspection History Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {history.length === 0
              ? 'Execute diagnostic inspections from the "3D Twin & Predict" tab to populate this session audit trail.'
              : 'No records matched your active filter or search query.'}
          </p>
          <button
            onClick={() => onNavigate('prediction')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <span>Run Machine Inspection</span>
          </button>
        </div>
      )}

      {/* Record Inspection Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-pulse-subtle">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Inspection Audit Record
                </h3>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {formatTimestamp(selectedRecord.timestamp)} • ID: {selectedRecord.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Diagnostic Outcome Status */}
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#111a2e] border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Outcome</span>
                <StatusBadge
                  status={
                    selectedRecord.result.predictions.random_forest === 1 ||
                    selectedRecord.result.predictions.xgboost === 1
                      ? 1
                      : 0
                  }
                  size="md"
                />
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-[10px] text-slate-400 block">Latency</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedRecord.latencyMs} ms</strong>
              </div>
            </div>

            {/* Parameter Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rotational Speed</span>
                <strong className="text-cyan-600 dark:text-cyan-400">
                  {selectedRecord.inputs['Rotational speed [rpm]']} RPM
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cutting Torque</span>
                <strong className="text-amber-600 dark:text-amber-400">
                  {selectedRecord.inputs['Torque [Nm]']} Nm
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Process / Air Temp</span>
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {selectedRecord.inputs['Process temperature [K]']} / {selectedRecord.inputs['Air temperature [K]']} K
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tool Wear</span>
                <strong className="text-rose-600 dark:text-rose-400">
                  {selectedRecord.inputs['Tool wear [min]']} min
                </strong>
              </div>
            </div>

            {/* Backend Features */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Temperature Difference (ΔT):</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{selectedRecord.result.calculated_features?.temp_diff ?? 0} K</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mechanical Power:</span>
                <strong className="text-cyan-600 dark:text-cyan-400">{formatPower(selectedRecord.result.calculated_features?.power ?? 0)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wear-Torque Shear Index:</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedRecord.result.calculated_features?.wear_torque ?? 0}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (onSelectRecordForInspection) {
                    onSelectRecordForInspection(selectedRecord);
                  }
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glow-cyan font-mono flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                <span>Reload into Form</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <Trash2 size={24} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear Inspection History?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will remove all {history.length} inspection records stored in your browser session localStorage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
