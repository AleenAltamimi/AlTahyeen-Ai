# FinTech AI Predictor

A financial AI prediction platform that analyzes transaction data — via CSV upload or manual questionnaire — and returns real-time fraud detection and overspending predictions from ML models.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/fintech-ai run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, Framer Motion, Wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- File uploads: Multer (in-memory), csv-parse
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/predictions.ts` — DB schema for prediction results
- `artifacts/api-server/src/routes/predictions.ts` — prediction API routes
- `artifacts/api-server/src/lib/mlEngine.ts` — heuristic ML models (fraud + overspending)
- `artifacts/fintech-ai/src/` — React frontend pages and components

## Architecture decisions

- ML models live in `mlEngine.ts` as heuristic functions. Swap `runFraudModel` and `runOverspendingModel` function bodies with real model calls (e.g. POST to Python FastAPI) when trained models are available — the interface is already defined.
- CSV upload uses Multer (in-memory storage) + csv-parse on the Express server. The file never touches disk.
- The frontend passes a prediction result through React state after submission and navigates to `/dashboard`. Past results are also accessible via `/history` and `/dashboard?id=<id>`.
- `lib/api-zod/tsconfig.json` includes `"lib": ["esnext", "dom"]` — required because Orval generates `File`/`Blob` types for multipart endpoints.

## Product

- **Landing page** (`/`) — Hero with "Predict. Protect. Prevent." tagline, live signal card, CTAs
- **CSV Upload** (`/upload`) — Drag-and-drop CSV upload with progress, file info, and AI processing animation
- **Questionnaire** (`/questionnaire`) — 5-step wizard collecting transaction + financial + behavior data
- **Dashboard** (`/dashboard`) — Full AI results: fraud risk overview, overspending prediction, charts
- **Fraud Detail** (`/dashboard/fraud`) — Suspicious transactions list, probability gauge, confidence score
- **Budget Detail** (`/dashboard/budget`) — Spending categories, trends, high-risk categories, recommendations
- **History** (`/history`) — All past prediction runs

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding a new schema to `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking `api-server` or the new exports won't be visible.
- Always re-run codegen after any OpenAPI spec change.
- The `api-zod` package needs DOM lib types for `File`/`Blob` — already set in `lib/api-zod/tsconfig.json`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
