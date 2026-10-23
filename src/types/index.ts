export type MachineType = 'L' | 'M' | 'H';

export type ModelChoice = 'random_forest' | 'xgboost' | 'both';

export interface PredictionPayload {
  model_choice: ModelChoice;
  'Rotational speed [rpm]': number;
  'Air temperature [K]': number;
  'Process temperature [K]': number;
  'Torque [Nm]': number;
  'Tool wear [min]': number;
  Type: MachineType;
}

export interface CalculatedFeatures {
  temp_diff: number;
  wear_torque: number;
  power: number;
}

export interface PredictionResults {
  random_forest?: 0 | 1;
  xgboost?: 0 | 1;
}

export interface PredictionResponse {
  model_choice: ModelChoice;
  calculated_features: CalculatedFeatures;
  predictions: PredictionResults;
}

export interface PredictionFormValues {
  modelChoice: ModelChoice;
  machineType: MachineType;
  rotationalSpeed: number;
  airTemperature: number;
  processTemperature: number;
  torque: number;
  toolWear: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  inputs: PredictionPayload;
  result: PredictionResponse;
  latencyMs: number;
}

export interface ApiHealthResponse {
  message: string;
  available_models: string[];
  docs: string;
}

export interface ApiStatus {
  online: boolean;
  checking: boolean;
  latencyMs?: number;
  data?: ApiHealthResponse;
  error?: string;
  lastChecked?: string;
}

// Genuine offline validation benchmark figures from the verified notebook evaluation artifact:
export interface ModelBenchmark {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  prAuc: number;
  description: string;
  algorithm: string;
}

export const VERIFIED_BENCHMARKS: Record<'random_forest' | 'xgboost', ModelBenchmark> = {
  random_forest: {
    model: 'Random Forest',
    accuracy: 0.9930,
    precision: 0.9655,
    recall: 0.8235,
    f1Score: 0.8889,
    prAuc: 0.9030,
    description: 'Ensemble of randomized decision trees. Optimized with RandomizedSearchCV for high precision on industrial imbalanced failure detection.',
    algorithm: 'Bagging Ensemble (Scikit-Learn)'
  },
  xgboost: {
    model: 'XGBoost',
    accuracy: 0.9900,
    precision: 0.8871,
    recall: 0.8088,
    f1Score: 0.8462,
    prAuc: 0.8849,
    description: 'Gradient boosted decision trees optimized with PowerTransformer & standard scaling pipeline on skewed rotational and temperature features.',
    algorithm: 'Gradient Tree Boosting (XGBoost)'
  }
};
