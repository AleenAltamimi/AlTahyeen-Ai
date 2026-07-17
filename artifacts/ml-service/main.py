"""
AlTahyeen AI — Python ML Service
Trains and serves the Fraud Detection and Overspending Prediction models.
Runs on PORT env var (default 5001) for internal Express → Python communication.
"""

import io
import logging
import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="AlTahyeen ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
WORKSPACE_DIR = BASE_DIR.parent.parent
DATA_DIR = WORKSPACE_DIR / "attached_assets"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

FRAUD_CSV = DATA_DIR / "Fraud_detection_(1)_1784217473524.csv"
OVERSPENDING_CSV = DATA_DIR / "Overspending_prediction_1784217463659.csv"

# ── Global state ───────────────────────────────────────────────────────────────
fraud_model = None
fraud_feature_names: list[str] = []
overspending_model = None
overspending_imputer = None
overspending_columns: list[str] = []


# ── Training ───────────────────────────────────────────────────────────────────
def train_or_load_fraud():
    global fraud_model, fraud_feature_names
    pkl = MODEL_DIR / "fraud_model.pkl"
    feat_pkl = MODEL_DIR / "fraud_features.pkl"
    if pkl.exists() and feat_pkl.exists():
        fraud_model = joblib.load(pkl)
        fraud_feature_names = joblib.load(feat_pkl)
        log.info("Fraud model loaded from cache")
        return
    if not FRAUD_CSV.exists():
        log.error("Fraud CSV not found: %s", FRAUD_CSV)
        return
    log.info("Training fraud model from %s …", FRAUD_CSV)
    df = pd.read_csv(FRAUD_CSV)
    df = df.dropna(subset=["Class"])
    X = df.drop(columns=["Class"])
    y = df["Class"]
    fraud_feature_names = list(X.columns)
    joblib.dump(fraud_feature_names, feat_pkl)
    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced", n_jobs=-1)
    model.fit(X_train, y_train)
    joblib.dump(model, pkl)
    fraud_model = model
    log.info("Fraud model trained and saved")


def train_or_load_overspending():
    global overspending_model, overspending_imputer, overspending_columns
    pkl = MODEL_DIR / "overspending_model.pkl"
    imp_pkl = MODEL_DIR / "overspending_imputer.pkl"
    cols_pkl = MODEL_DIR / "overspending_columns.pkl"
    if pkl.exists() and imp_pkl.exists() and cols_pkl.exists():
        overspending_model = joblib.load(pkl)
        overspending_imputer = joblib.load(imp_pkl)
        overspending_columns = joblib.load(cols_pkl)
        log.info("Overspending model loaded from cache")
        return
    if not OVERSPENDING_CSV.exists():
        log.error("Overspending CSV not found: %s", OVERSPENDING_CSV)
        return
    log.info("Training overspending model from %s …", OVERSPENDING_CSV)
    df = pd.read_csv(OVERSPENDING_CSV)
    df["Overspending"] = (df["monthly_expense_total"] > df["budget_goal"]).astype(int)
    X = df.drop(columns=["Overspending"])
    y = df["Overspending"]
    X = pd.get_dummies(X, drop_first=True)
    imp = SimpleImputer(strategy="median")
    X_imputed = imp.fit_transform(X)
    overspending_columns = list(X.columns)
    joblib.dump(overspending_columns, cols_pkl)
    X_train, _, y_train, _ = train_test_split(X_imputed, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    joblib.dump(model, pkl)
    joblib.dump(imp, imp_pkl)
    overspending_model = model
    overspending_imputer = imp
    log.info("Overspending model trained and saved. Feature count: %d", len(overspending_columns))


@app.on_event("startup")
def startup():
    train_or_load_fraud()
    train_or_load_overspending()


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "fraud_ready": fraud_model is not None,
        "overspending_ready": overspending_model is not None,
        "fraud_features": len(fraud_feature_names),
        "overspending_features": len(overspending_columns),
    }


# ── Fraud — CSV ────────────────────────────────────────────────────────────────
@app.post("/predict/fraud/csv")
async def predict_fraud_csv(file: UploadFile = File(...)):
    if fraud_model is None:
        raise HTTPException(503, "Fraud model not ready")
    data = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(data))
    except Exception as exc:
        raise HTTPException(400, f"Failed to parse CSV: {exc}") from exc

    for col in fraud_feature_names:
        if col not in df.columns:
            df[col] = 0.0

    X = df[fraud_feature_names].fillna(0).values
    predictions = fraud_model.predict(X)
    probs = fraud_model.predict_proba(X)[:, 1]

    transactions = [
        {
            "row_index": i,
            "prediction": int(p),
            "label": "Fraud" if int(p) == 1 else "Legitimate",
            "probability": float(pr),
            "amount": float(df["Amount"].iloc[i]) if "Amount" in df.columns else 0.0,
        }
        for i, (p, pr) in enumerate(zip(predictions, probs))
    ]

    fraud_count = sum(1 for t in transactions if t["prediction"] == 1)
    total = len(transactions)
    return {
        "row_count": total,
        "fraud_count": fraud_count,
        "legitimate_count": total - fraud_count,
        "fraud_rate": fraud_count / max(total, 1),
        "average_fraud_probability": float(np.mean(probs)),
        "transactions": transactions,
    }


# ── Fraud — Manual ─────────────────────────────────────────────────────────────
class FraudManualRequest(BaseModel):
    time: float = 0.0
    amount: float = 0.0


@app.post("/predict/fraud/manual")
def predict_fraud_manual(data: FraudManualRequest):
    if fraud_model is None:
        raise HTTPException(503, "Fraud model not ready")
    row = {col: 0.0 for col in fraud_feature_names}
    if "Time" in row:
        row["Time"] = data.time
    if "Amount" in row:
        row["Amount"] = data.amount
    x = np.array([[row[col] for col in fraud_feature_names]])
    pred = int(fraud_model.predict(x)[0])
    prob = float(fraud_model.predict_proba(x)[0][1])
    return {"prediction": pred, "label": "Fraud" if pred == 1 else "Legitimate", "probability": prob}


# ── Overspending — Manual ──────────────────────────────────────────────────────
class OverspendingManualRequest(BaseModel):
    monthly_income: float
    monthly_expense_total: float
    budget_goal: float
    savings_rate: float = 0.0
    financial_scenario: str = "stable"
    credit_score: float = 650.0
    debt_to_income_ratio: float = 0.3
    loan_payment: float = 0.0
    investment_amount: float = 0.0
    subscription_services: int = 2
    emergency_fund: float = 0.0
    transaction_count: int = 20
    fraud_flag: int = 0
    discretionary_spending: float = 0.0
    essential_spending: float = 0.0
    income_type: str = "Salary"
    rent_or_mortgage: float = 0.0
    category: str = "Groceries"
    cash_flow_status: str = "Positive"
    financial_advice_score: float = 5.0
    financial_stress_level: str = "Low"
    actual_savings: float = 0.0
    savings_goal_met: int = 0
    user_id: int = 0
    date: str = "2024-01-01"


@app.post("/predict/overspending/manual")
def predict_overspending_manual(data: OverspendingManualRequest):
    if overspending_model is None or overspending_imputer is None:
        raise HTTPException(503, "Overspending model not ready")
    row = data.model_dump()
    df_row = pd.DataFrame([row])
    df_dummies = pd.get_dummies(df_row, drop_first=True)
    df_aligned = df_dummies.reindex(columns=overspending_columns, fill_value=0)
    x = overspending_imputer.transform(df_aligned)
    pred = int(overspending_model.predict(x)[0])
    prob = float(overspending_model.predict_proba(x)[0][1])
    return {
        "prediction": pred,
        "label": "Will Exceed Budget" if pred == 1 else "Within Budget",
        "probability": prob,
    }


# ── Overspending — CSV ─────────────────────────────────────────────────────────
@app.post("/predict/overspending/csv")
async def predict_overspending_csv(file: UploadFile = File(...)):
    if overspending_model is None or overspending_imputer is None:
        raise HTTPException(503, "Overspending model not ready")
    data = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(data))
    except Exception as exc:
        raise HTTPException(400, f"Failed to parse CSV: {exc}") from exc

    avg_expense = float(df["monthly_expense_total"].mean()) if "monthly_expense_total" in df.columns else None
    avg_budget = float(df["budget_goal"].mean()) if "budget_goal" in df.columns else None

    df_dummies = pd.get_dummies(df, drop_first=True)
    df_aligned = df_dummies.reindex(columns=overspending_columns, fill_value=0)
    X = overspending_imputer.transform(df_aligned)
    predictions = overspending_model.predict(X)
    probs = overspending_model.predict_proba(X)[:, 1]

    over_count = int(sum(predictions))
    total = len(predictions)
    return {
        "row_count": total,
        "overspending_count": over_count,
        "within_budget_count": total - over_count,
        "overspending_rate": over_count / max(total, 1),
        "average_overspending_probability": float(np.mean(probs)),
        "avg_expense": avg_expense,
        "avg_budget": avg_budget,
    }


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    uvicorn.run(app, host="0.0.0.0", port=port)
