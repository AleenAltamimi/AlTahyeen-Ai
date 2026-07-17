# AlTahyeen AI

**Intelligent fraud detection and overspending prediction powered by real trained machine learning models.**

## 🌐 Live MVP

**Try it now →** [https://altahyeen-ai.replit.app](https://altahyeen-ai.replit.app)

Upload a CSV of transactions **or** fill in the manual questionnaire to instantly get fraud risk scores and overspending predictions from real trained ML models.

---

AlTahyeen AI lets you upload a CSV of transactions or fill in a manual questionnaire, then instantly runs two RandomForest models — one that flags fraudulent transactions and one that predicts budget overruns — and delivers a full risk dashboard with charts, breakdowns, and recommendations.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Fraud Detection** | Trained on the Kaggle Credit Card Fraud dataset (284,807 transactions, 30 PCA features). Flags suspicious rows and scores overall portfolio risk. |
| **Overspending Prediction** | Trained on a 95-feature spending profile dataset. Predicts whether monthly expenses will exceed a budget goal. |
| **CSV Upload** | Drag-and-drop any transaction CSV — both models run in parallel and return per-row fraud scores + aggregate overspending stats. |
| **Manual Questionnaire** | 3-step wizard collecting transaction details, financial profile (income, budget, rent, loan, investments), and behavioral signals (stress level, cash flow, subscriptions). |
| **Results Dashboard** | Interactive charts (spending trends, category breakdown, risk breakdown), suspicious transaction list, and personalised recommendations. |
| **History** | Every analysis is persisted to PostgreSQL and accessible from the History page. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser (React + Vite)              │
│  Home · Upload · Questionnaire · Dashboard · History │
└────────────────────────┬────────────────────────────┘
                         │ REST  /api/*
┌────────────────────────▼────────────────────────────┐
│              Express 5  API Server  :8080            │
│  POST /api/predictions/manual                        │
│  POST /api/predictions/csv                           │
│  GET  /api/predictions                               │
│  GET  /api/predictions/:id                           │
└────────┬───────────────────────────┬────────────────┘
         │ HTTP  localhost:5000       │ Drizzle ORM
┌────────▼──────────────┐  ┌─────────▼──────────────┐
│  Python FastAPI  ML   │  │     PostgreSQL DB        │
│  Service  :5000       │  │  predictions table       │
│                       │  └────────────────────────┘
│  POST /predict/fraud/csv            │
│  POST /predict/fraud/manual         │
│  POST /predict/overspending/csv     │
│  POST /predict/overspending/manual  │
│  GET  /health                       │
└─────────────────────────────────────┘
```

### Monorepo layout

```
/
├── artifacts/
│   ├── fintech-ai/          # React + Vite frontend (Tailwind, Recharts, Wouter)
│   ├── api-server/          # Express 5 API (TypeScript)
│   └── ml-service/          # Python FastAPI ML service
│       ├── main.py
│       ├── requirements.txt
│       └── models/          # Cached .pkl files (auto-generated on first run)
├── lib/
│   ├── api-spec/            # OpenAPI 3.0 specification (single source of truth)
│   ├── api-zod/             # Auto-generated Zod schemas (via Orval)
│   ├── api-client-react/    # Auto-generated React Query hooks (via Orval)
│   └── db/                  # Drizzle ORM schema + client (PostgreSQL)
└── attached_assets/         # Training CSV datasets
```

---

## 🧠 ML Models

### Fraud Detection
- **Dataset**: Credit card transactions — `Time`, `V1`–`V28` (PCA), `Amount`, `Class`
- **Algorithm**: RandomForest (`n_estimators=100`, `class_weight="balanced"`)
- **Manual input**: Only `Amount` is passed; V1–V28 are zeroed (PCA-transformed features cannot be reconstructed from raw data)
- **Output**: per-row fraud probability + aggregate fraud rate for CSV; single probability for manual

### Overspending Prediction
- **Dataset**: Monthly spending profiles — 95 features after `pd.get_dummies`
- **Label**: `monthly_expense_total > budget_goal`
- **Pipeline**: `pd.get_dummies(drop_first=True)` → `SimpleImputer(strategy="median")` → `RandomForestClassifier`
- **Column alignment**: Trained column list is saved to `overspending_columns.pkl`; inference inputs are `reindex`-ed against it with `fill_value=0` so unseen categories never break the model
- **Output**: binary prediction + probability

Models are trained on the first run and cached as `.pkl` files in `artifacts/ml-service/models/`. Subsequent restarts load from cache instantly.

---

## 🚀 Running locally (Replit)

All three services start automatically via configured workflows:

| Workflow | Command | Port |
|---|---|---|
| `ML Service` | `cd artifacts/ml-service && PORT=5000 .venv/bin/python main.py` | 5000 |
| `API Server` | `pnpm --filter @workspace/api-server run dev` | 8080 |
| `web` | `pnpm --filter @workspace/fintech-ai run dev` | dynamic |

### First-time setup

```bash
# Install Node dependencies
pnpm install

# Set up the Python virtual environment and install ML dependencies
cd artifacts/ml-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Push the database schema
pnpm run db:push
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (set by Replit) |
| `SESSION_SECRET` | Express session secret |
| `ML_SERVICE_URL` | Override ML service URL (default `http://localhost:5000`) |

---

## 📡 API Reference

### `POST /api/predictions/manual`
Submit a questionnaire result for analysis.

**Body** (JSON): see `lib/api-spec/openapi.yaml` → `ManualInput` schema  
**Response**: fraud scores + overspending prediction + dashboard data

### `POST /api/predictions/csv`
Upload a CSV file for bulk analysis.

**Body**: `multipart/form-data`, field `file` (CSV)  
**Supports both formats**:
- Fraud format: `Time, V1–V28, Amount`
- Spending format: `monthly_income, monthly_expense_total, budget_goal, …`

**Response**: per-row fraud flags + aggregate overspending stats

### `GET /api/predictions`
List all past analyses (summary).

### `GET /api/predictions/:id`
Retrieve full results for a specific analysis.

---

## 🛠️ Development

```bash
# Regenerate API types after editing openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Typecheck everything
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run typecheck

# DB schema changes → push to Postgres
pnpm run db:push
```

---

## 📦 Tech Stack

**Frontend**: React 18 · Vite · TypeScript · Tailwind CSS · Recharts · Wouter · Framer Motion  
**API**: Express 5 · TypeScript · Multer · csv-parse  
**ML Service**: Python 3.13 · FastAPI · scikit-learn · pandas · joblib  
**Database**: PostgreSQL · Drizzle ORM  
**Codegen**: Orval (OpenAPI → Zod + React Query)  
**Monorepo**: pnpm workspaces · Node 24

---

## 📄 License

MIT
