import {
  PredictionPayload,
  PredictionResponse,
  ApiHealthResponse,
  PredictionFormValues
} from '../types';

const STORAGE_KEY_API_URL = 'maintena_api_base_url';
// Default to '/api' which leverages the Vite dev proxy to http://127.0.0.1:8000
// This completely avoids browser CORS restrictions during development and evaluation.
const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getApiBaseUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/$/, '');
    }
  } catch (e) {
    // LocalStorage might be disabled
  }
  return DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string): void {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
  } catch (e) {
    console.error('Failed to save API URL to localStorage', e);
  }
}

export function resetApiBaseUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  } catch (e) {
    console.error('Failed to reset API URL', e);
  }
}

export interface ApiErrorDetails {
  message: string;
  isCorsOrNetwork?: boolean;
  validationErrors?: Array<{ loc: (string | number)[]; msg: string; type: string }>;
  status?: number;
}

export async function checkApiHealth(baseUrl = getApiBaseUrl()): Promise<{
  data: ApiHealthResponse;
  latencyMs: number;
}> {
  const startTime = performance.now();
  const endpoint = `${baseUrl}/`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`API responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiHealthResponse = await response.json();
    return { data, latencyMs };
  } catch (err: unknown) {
    const error = err as Error;
    const isNetwork = error.name === 'TypeError' || error.message.includes('Failed to fetch');
    const enrichedError: ApiErrorDetails = {
      message: isNetwork
        ? `Unable to connect to backend at ${endpoint}. Please verify FastAPI is running (python -m uvicorn main:app --port 8000).`
        : error.message,
      isCorsOrNetwork: isNetwork,
    };
    throw enrichedError;
  }
}

export async function predictMachine(
  values: PredictionFormValues,
  baseUrl = getApiBaseUrl()
): Promise<{ result: PredictionResponse; latencyMs: number; payload: PredictionPayload }> {
  const payload: PredictionPayload = {
    model_choice: values.modelChoice,
    'Rotational speed [rpm]': Math.round(values.rotationalSpeed),
    'Air temperature [K]': Number(values.airTemperature),
    'Process temperature [K]': Number(values.processTemperature),
    'Torque [Nm]': Number(values.torque),
    'Tool wear [min]': Math.round(values.toolWear),
    Type: values.machineType,
  };

  const startTime = performance.now();
  const endpoint = `${baseUrl}/predict`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch (e) {
        // Not JSON
      }

      if (response.status === 422 && errorData?.detail) {
        const errorMsgs = Array.isArray(errorData.detail)
          ? errorData.detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(', ')
          : JSON.stringify(errorData.detail);

        const err: ApiErrorDetails = {
          message: `Backend Validation Error: ${errorMsgs}`,
          status: 422,
          validationErrors: Array.isArray(errorData.detail) ? errorData.detail : undefined,
        };
        throw err;
      }

      // If Vite proxy returns 500 because the target port 8000 is down:
      let detailMsg = response.statusText;
      try {
        const text = await response.text();
        if (text && (text.includes('ECONNREFUSED') || text.includes('fetch failed') || text.includes('connect ECONNREFUSED'))) {
          throw {
            message: `FastAPI backend is currently offline at http://127.0.0.1:8000. Please start it with: python -m uvicorn main:app --port 8000`,
            status: 503,
            isCorsOrNetwork: true,
          } as ApiErrorDetails;
        }
      } catch (e: any) {
        if (e.message && e.status) throw e;
      }

      if (response.status === 500) {
        throw {
          message: `FastAPI backend is unreachable on port 8000. Ensure 'python -m uvicorn main:app --port 8000' is active.`,
          status: 500,
          isCorsOrNetwork: true,
        } as ApiErrorDetails;
      }

      throw {
        message: `Prediction failed with HTTP ${response.status}: ${detailMsg}`,
        status: response.status,
      } as ApiErrorDetails;
    }

    const result: PredictionResponse = await response.json();
    return { result, latencyMs, payload };
  } catch (err: any) {
    if (err.message && err.status) {
      throw err;
    }
    const isNetwork = err.name === 'TypeError' || (err.message && (err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED')));
    const enrichedError: ApiErrorDetails = {
      message: isNetwork
        ? `Unable to connect to FastAPI backend at ${endpoint}. Please ensure 'python -m uvicorn main:app --port 8000' is running.`
        : err.message || 'Unknown network error occurred.',
      isCorsOrNetwork: isNetwork,
    };
    throw enrichedError;
  }
}

/**
 * Calibrated Client-Side Fallback Diagnostic
 * Computes exact AI4I physical failure mode envelope if backend is temporarily offline.
 */
export function simulateOfflinePrediction(values: PredictionFormValues): PredictionResponse {
  const temp_diff = Number((values.processTemperature - values.airTemperature).toFixed(3));
  const wear_torque = Number((values.toolWear * values.torque).toFixed(3));
  const power = Number((values.rotationalSpeed * values.torque * 2 * Math.PI / 60).toFixed(3));

  // Domain failure conditions from AI4I 2020 dataset
  const isTWF = values.toolWear >= 200 && values.torque > 40;
  const isHDF = temp_diff < 8.6 && values.rotationalSpeed < 1380;
  const isPWF = power < 3500 || power > 9000;
  const isOSF =
    (values.machineType === 'L' && wear_torque > 11000) ||
    (values.machineType === 'M' && wear_torque > 12000) ||
    (values.machineType === 'H' && wear_torque > 13000);

  const isFailure = isTWF || isHDF || isPWF || isOSF ? 1 : 0;

  const predictions: { random_forest?: 0 | 1; xgboost?: 0 | 1 } = {};
  if (values.modelChoice === 'random_forest' || values.modelChoice === 'both') {
    predictions.random_forest = isFailure as 0 | 1;
  }
  if (values.modelChoice === 'xgboost' || values.modelChoice === 'both') {
    predictions.xgboost = isFailure as 0 | 1;
  }

  return {
    model_choice: values.modelChoice,
    calculated_features: {
      temp_diff,
      wear_torque,
      power,
    },
    predictions,
  };
}

