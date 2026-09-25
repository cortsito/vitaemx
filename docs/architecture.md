# Architecture

## Overview

VitaeMX is split into two halves that are deliberately kept independent: a **research** half, where the actuarial science happens offline and is fully reproducible, and a **product** half, where the results of that research are served as a small interactive web application. This split matters because it means the web application never has to run expensive or fragile statistical code on a request — it only ever reads pre-validated, versioned data.

```
                        ┌──────────────────────────┐
                        │        RESEARCH           │
                        │  (offline, notebooks)      │
                        │                            │
  CONAPO / INEGI / WHO  │  research/*.ipynb          │
  raw data  ───────────▶│  clean → fit → validate    │
                        │                            │
                        └─────────────┬──────────────┘
                                      │ writes
                                      ▼
                        ┌──────────────────────────┐
                        │      data/processed/       │
                        │  versioned CSV / Parquet   │
                        │  (life tables, fitted       │
                        │   parameters, validation    │
                        │   metrics)                  │
                        └─────────────┬──────────────┘
                                      │ read at request time
                                      ▼
                        ┌──────────────────────────┐
                        │        BACKEND             │
                        │  FastAPI, serverless        │
                        │  (Vercel Python functions)  │
                        │                            │
                        │  /api/life-table/{state}    │
                        │  /api/premium               │
                        │  /api/methodology-notes     │
                        └─────────────┬──────────────┘
                                      │ JSON over HTTPS
                                      ▼
                        ┌──────────────────────────┐
                        │        FRONTEND            │
                        │  React + TypeScript,        │
                        │  static build (Vercel)      │
                        └──────────────────────────┘
```

## Components

**`research/`** — Jupyter notebooks that pull raw data (or read a cached copy in `data/raw/`), clean it, fit the Gompertz-Makeham model, validate it, and write the results to `data/processed/`. These notebooks are the single source of truth for the methodology described in [`METHODOLOGY.md`](METHODOLOGY.md); the backend never re-derives a model, it only serves what the notebooks already produced and versioned.

**`data/`** — `raw/` holds a cached snapshot of the source datasets (with a fetch date recorded, since CONAPO/INEGI update periodically — see [`DATA_SOURCES.md`](DATA_SOURCES.md)); `processed/` holds the versioned, ready-to-serve outputs: per-state life tables, fitted Gompertz-Makeham parameters, and validation metrics. Both are tracked in git as small CSV/Parquet files, since the entire dataset for Phase 1 is a few megabytes — no database service is needed.

**`backend/`** — A FastAPI application exposing a small, typed, self-documenting API (FastAPI generates OpenAPI docs automatically at `/docs`). Endpoints read from `data/processed/` (loaded into a small in-memory or SQLite-backed store at cold start) and perform only the lightweight, request-time computation that depends on user input — e.g. a premium calculation for a chosen age, state, product, and interest rate. It does not run model fitting on request.

**`frontend/`** — A React + TypeScript single-page application, built to static assets and served from the same Vercel project as the API. It calls the backend API for data and renders life tables, mortality curves, and premium results in the visual style described in the project's design notes.

## Why this split

Keeping research and product separate means the web application has no dependency on `scipy`/`statsmodels` at request time, keeps the serverless functions small and fast (important on a free tier), and makes the science auditable independently of the app — anyone can open a notebook in `research/` and reproduce a number shown in the UI from raw data to final figure, which is exactly the kind of transparency the project is meant to demonstrate.

## Why Python (FastAPI) + React

Documented in full in [`docs/adr/0001-python-react-stack.md`](docs/adr/0001-python-react-stack.md). In short: Python is the natural language for the actuarial/statistical work regardless of what serves the API, so using it for the backend as well avoids a second language for that layer; React is used for the frontend because the product is meant to be genuinely interactive (compare states, adjust interest rate, see the curve update), which a static site generator alone would not comfortably support.

## Why Vercel (serverless) instead of a traditional free-tier server

Documented in full in [`docs/adr/0002-vercel-serverless-hosting.md`](docs/adr/0002-vercel-serverless-hosting.md). In short: free tiers on platforms like Render or Railway put the backend to sleep after a period of inactivity, causing a multi-second "cold start" delay the first time a recruiter or reviewer opens the demo — a bad first impression for a portfolio piece. Vercel's serverless functions have a much smaller, less noticeable cold start, and hosting frontend and backend in the same project means one deploy pipeline and one domain, at $0.

## API contract (Phase 1)

```
GET  /api/states                              → [{code, name}]; code 0 = national, 1–32 = states (INEGI order)
GET  /api/life-table/{code}?sex=total         → life table rows (age, mx, qx, lx, dx, Lx, Tx, ex, qx_fitted, qx_source)
GET  /api/mortality-curve/{code}?sex=total    → Gompertz-Makeham parameters + per-age raw vs fitted μx and qx
POST /api/premium                             → {state_code, sex, age, product, term, interest_rate, sum_assured} → premium breakdown + limitations
GET  /api/methodology-version                 → contents of data/processed/version.json
GET  /api/validation                          → rebuilt vs CONAPO-published e0 per state and sex
```

`sex` is `total`, `male` or `female`. Schemas are Pydantic models in `backend/app/schemas.py`, mirrored by hand in `frontend/src/api/types.ts`; the OpenAPI document is served at `/docs` when running locally.

## Repository layout of the implementation

- `research/vitaemx_research/` — the math (`lifetable.py`, `gompertz.py`, `premiums.py`) as importable, unit-tested modules; the notebooks `01`–`04` call them.
- `data/processed/` — `life_tables.csv`, `fitted_qx.csv`, `gompertz_makeham_params.csv`, `validation_e0.csv`, `version.json` (data dictionary in `data/processed/README.md`).
- `backend/app/` — `data.py` loads the CSVs once per process, `actuarial.py` prices at request time (pure Python, no numpy), `main.py` holds the routes.
- `api/index.py` + `vercel.json` (repo root) — Vercel wiring: one Python function for `/api/*`, static `frontend/dist` for everything else.
- `frontend/src/` — `App.tsx` (hash-based navigation, no router dependency), one component per view, `api/client.ts` as the only place that calls `fetch`.

## Deployment pipeline

`main` branch on GitHub → connected to a Vercel project → every push to `main` triggers an automatic build and deploy of both the frontend static build and the backend serverless functions. No manual deploy step, no server to provision. Preview deployments are generated automatically for pull requests, which is a nice, free-to-get "looks like a real engineering workflow" signal for a portfolio repo.

## Configuration and secrets

Phase 1 requires no API keys or secrets (all data is public and bundled/versioned in-repo), so there is nothing sensitive to manage yet. If later phases add anything requiring a key, it will be handled via Vercel's environment variable store and documented here.