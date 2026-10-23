# Maintena AI — Predictive Maintenance Dashboard Frontend

**Maintena AI** is a modern, high-precision industrial frontend application designed for real-time machine failure prediction and equipment health diagnostics. It connects directly to your existing FastAPI backend and trained machine learning models (**Random Forest** and **XGBoost**).

---

## 🛡️ Backend Integrity Verification

As strictly required, **none of your existing backend, data, or notebook files were modified or replaced**:
- `main.py` — Untouched (original FastAPI endpoints, Pydantic validation, and feature calculations preserved)
- `random_forest_model.joblib` — Untouched
- `xgboost_model.joblib` — Untouched
- `ai4i2020.csv` — Untouched
- `predictive_maintenance.ipynb` — Untouched

---

## 🚀 Key Features

1. **Operations Overview**:
   - Live backend health badge with round-trip latency monitoring.
   - Session KPI metrics: Total inspections, Breakdown alerts, Health rate (%), and Multi-model consensus (%).
   - Latest inspection diagnostic outcome card with quick re-inspection triggers.
   - Real-time recent session inspection feed with instant parameter reloading into the form.

2. **Machine Failure Diagnostics (Prediction Page)**:
   - Full support for the exact FastAPI contract (`Rotational speed [rpm]`, `Air temperature [K]`, `Process temperature [K]`, `Torque [Nm]`, `Tool wear [min]`, `Type`, `model_choice`).
   - One-click editable presets based on AI4I operational distributions (*Nominal Baseline*, *High Tool Wear & Strain*, *Thermal Stress*, *High-Speed Finishing*).
   - Real-time client-side validation preventing invalid submissions (e.g. enforcing $T_{process} > T_{air}$).
   - Prominent binary diagnostic outcome (Healthy/Nominal vs Failure Alert) with accessible colors and icons.
   - Individual model classifier outputs and consensus/split indicators.
   - Backend-computed engineered features display ($\Delta T$, Wear-Torque interaction, and Mechanical Power in Watts/kW).

3. **Model Benchmarking & Comparison**:
   - Empirical validation metrics retrieved directly from the notebook test evaluation split (2,000 samples):
     - **Random Forest**: 99.30% Accuracy, 96.55% Precision, 82.35% Recall, 0.9030 PR-AUC.
     - **XGBoost**: 99.00% Accuracy, 88.71% Precision, 80.88% Recall, 0.8849 PR-AUC.
   - Interactive Recharts bar visualization comparing model characteristics.
   - Session consensus breakdown tracking unanimous vs split model decisions.

4. **Inspection Audit History**:
   - Client-side audit log stored in browser local storage.
   - Filtering by diagnostic outcome (Healthy vs Failure) and Machine Quality Variant (L, M, H).
   - Instant "Reload into Form" to test parameter permutations.
   - One-click export to CSV spreadsheet and formatted JSON.
   - Honest data persistence disclaimer regarding client-side session storage.

5. **Settings & Gateway Connectivity**:
   - Configurable API Base URL (defaults to zero-CORS Vite proxy `/api`).
   - Live connection latency test button.
   - Real backend metadata inspector (inspects `message`, `available_models`, and `docs` from `GET /`).
   - Direct links to FastAPI Swagger UI (`/docs`) and OpenAPI schema (`/openapi.json`).
   - CORS explanation and reference configuration guide for production deployments.

---

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS with custom industrial color scheme
- **Icons**: Lucide React
- **Visualizations**: Recharts
- **Storage**: Browser LocalStorage for lightweight audit trail

---

## 💻 Quick Start & Running Locally

### 1. Start the FastAPI Backend
Ensure your Python environment has dependencies installed and run:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
FastAPI will start on `http://127.0.0.1:8000`.

### 2. Start the Frontend Development Server
In another terminal in the project directory, run:
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 🌐 Zero-CORS Architecture

Because standard browser security blocks cross-origin requests when a frontend on port `5173` calls a backend on port `8000` without `CORSMiddleware`, **Vite dev proxy** is preconfigured in `vite.config.ts`:

- Frontend requests to `/api/predict` are internally proxied to `http://127.0.0.1:8000/predict`.
- Frontend requests to `/api/` are internally proxied to `http://127.0.0.1:8000/`.

This provides a seamless, zero-configuration local development experience without modifying a single line of your Python code.
