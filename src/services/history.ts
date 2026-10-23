import { HistoryRecord, PredictionPayload, PredictionResponse } from '../types';

const STORAGE_KEY_HISTORY = 'maintena_prediction_history_v1';
const MAX_HISTORY_RECORDS = 100;

export function getPredictionHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse prediction history from localStorage', e);
  }
  return [];
}

export function savePredictionRecord(
  inputs: PredictionPayload,
  result: PredictionResponse,
  latencyMs: number
): HistoryRecord {
  const record: HistoryRecord = {
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    inputs,
    result,
    latencyMs,
  };

  try {
    const current = getPredictionHistory();
    const updated = [record, ...current].slice(0, MAX_HISTORY_RECORDS);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save prediction record', e);
  }

  return record;
}

export function clearPredictionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch (e) {
    console.error('Failed to clear prediction history', e);
  }
}

export function exportHistoryAsJson(): void {
  const history = getPredictionHistory();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `maintena_ai_prediction_history_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportHistoryAsCsv(): void {
  const history = getPredictionHistory();
  if (history.length === 0) return;

  const headers = [
    'Timestamp',
    'Machine Type',
    'Rotational Speed [rpm]',
    'Air Temp [K]',
    'Process Temp [K]',
    'Temp Diff [K]',
    'Torque [Nm]',
    'Tool Wear [min]',
    'Power [W]',
    'Wear-Torque',
    'Model Choice',
    'Random Forest Pred',
    'XGBoost Pred',
    'Latency [ms]',
  ];

  const rows = history.map((h) => [
    h.timestamp,
    h.inputs.Type,
    h.inputs['Rotational speed [rpm]'],
    h.inputs['Air temperature [K]'],
    h.inputs['Process temperature [K]'],
    h.result.calculated_features?.temp_diff ?? 0,
    h.inputs['Torque [Nm]'],
    h.inputs['Tool wear [min]'],
    h.result.calculated_features?.power ?? 0,
    h.result.calculated_features?.wear_torque ?? 0,
    h.result.model_choice,
    h.result.predictions.random_forest ?? 'N/A',
    h.result.predictions.xgboost ?? 'N/A',
    h.latencyMs,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodeURI(csvContent));
  downloadAnchor.setAttribute('download', `maintena_ai_prediction_history_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
