# Predictive-Maintenance

Machine Failure Prediction API & Interactive Dashboard powered by FastAPI, Scikit-Learn, and XGBoost.

## Features
- **FastAPI Backend**: Serves predictions for machine failure using trained Random Forest and XGBoost models.
- **Engineered Features**: Automatically calculates temperature difference (`temp_diff`), wear-torque interaction (`wear_torque`), and rotational mechanical power (`power`).
- **Interactive UI**: Real-time telemetry monitoring and failure classification dashboard.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sarfaraj956/Predictive-Maintenance.git
   cd Predictive-Maintenance
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the API server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API Docs will be available at `http://127.0.0.1:8000/docs`.

4. **Run Frontend (Optional):**
   ```bash
   npm install
   npm run dev
   ```
