
import joblib
import pandas as pd
import numpy as np

from fastapi import FastAPI
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Literal

app = FastAPI(title="Machine Failure Prediction API")

# Load trained models
model_1 = joblib.load("random_forest_model.joblib")
model_2 = joblib.load("xgboost_model.joblib")


class HouseData(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
        allow_inf_nan=False
    )

    model_choice: Literal[
        "random_forest", "xgboost", "both"
    ] = Field(default="both")

    rotational_speed: int = Field(
        ..., alias="Rotational speed [rpm]", gt=0, le=10000
    )

    air_temperature: float = Field(
        default=298, alias="Air temperature [K]", gt=0, le=500
    )

    process_temperature: float = Field(
        ..., alias="Process temperature [K]", gt=0, le=600
    )

    torque: float = Field(
        ..., alias="Torque [Nm]", gt=0, le=1000
    )

    tool_wear: int = Field(
        default=0, alias="Tool wear [min]", ge=0, le=1000
    )

    Type: Literal["L", "M", "H"]

    @model_validator(mode="after")
    def validate_temperatures(self):
        if self.process_temperature <= self.air_temperature:
            raise ValueError(
                "Process temperature must be greater than air temperature"
            )
        return self


@app.get("/")
def home():
    return {
        "message": "Predictive maintenance API is running",
        "available_models": ["random_forest", "xgboost", "both"],
        "docs": "/docs"
    }


@app.post("/predict")
def predict(data: HouseData):

    # Calculate engineered features
    temp_diff = (
        data.process_temperature - data.air_temperature
    )

    wear_torque = data.tool_wear * data.torque

    power = (
        data.rotational_speed * data.torque * 2 * np.pi / 60
    )

    # Prepare model input
    input_row = pd.DataFrame([{
        "Rotational speed [rpm]": data.rotational_speed,
        "temp_diff": temp_diff,
        "wear_torque": wear_torque,
        "Air temperature [K]": data.air_temperature,
        "Process temperature [K]": data.process_temperature,
        "Torque [Nm]": data.torque,
        "Tool wear [min]": data.tool_wear,
        "power": power,
        "Type": data.Type
    }])

    predictions = {}

    # Run selected model(s)
    if data.model_choice in ("random_forest", "both"):
        rf_result = model_1.predict(input_row)[0]
        predictions["random_forest"] = int(rf_result)

    if data.model_choice in ("xgboost", "both"):
        xgb_result = model_2.predict(input_row)[0]
        predictions["xgboost"] = int(xgb_result)

    return {
        "model_choice": data.model_choice,
        "calculated_features": {
            "temp_diff": round(temp_diff, 3),
            "wear_torque": round(wear_torque, 3),
            "power": round(power, 3)
        },
        "predictions": predictions
    }
