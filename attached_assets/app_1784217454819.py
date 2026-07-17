from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(
    title="AlTahyeen AI Backend",
    description="Fraud Detection and Overspending Prediction API",
    version="1.0.0"
)

# Load trained models
fraud_model = joblib.load("models/fraud_model.pkl")

overspending_model = joblib.load("models/overspending_model.pkl")
overspending_imputer = joblib.load("models/overspending_imputer.pkl")


class FraudRequest(BaseModel):
    features: list[float]


class OverspendingRequest(BaseModel):
    features: list[float]


@app.get("/")
def root():
    return {
        "message": "AlTahyeen AI Backend is running.",
        "endpoints": [
            "/predict/fraud",
            "/predict/overspending"
        ]
    }


@app.post("/predict/fraud")
def predict_fraud(data: FraudRequest):
    x = np.array(data.features).reshape(1, -1)

    prediction = int(fraud_model.predict(x)[0])

    if hasattr(fraud_model, "predict_proba"):
        probability = float(fraud_model.predict_proba(x)[0][1])
    else:
        probability = None

    return {
        "prediction": prediction,
        "label": "Fraud" if prediction == 1 else "Legitimate",
        "probability": probability
    }


@app.post("/predict/overspending")
def predict_overspending(data: OverspendingRequest):
    x = np.array(data.features).reshape(1, -1)
    x = overspending_imputer.transform(x)

    prediction = int(overspending_model.predict(x)[0])

    if hasattr(overspending_model, "predict_proba"):
        probability = float(overspending_model.predict_proba(x)[0][1])
    else:
        probability = None

    return {
        "prediction": prediction,
        "label": "Will Exceed Budget" if prediction == 1 else "Within Budget",
        "probability": probability
    }
